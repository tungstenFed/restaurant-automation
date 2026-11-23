import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '~/lib/supabase';

const createCustomerSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug ristorante mancante')
    .max(100, 'Slug ristorante non valido')
    .refine((value) => !/[\u0000-\u001F\u007F]/.test(value), {
      message: 'Slug ristorante non valido',
    }),
  firstName: z
    .string()
    .trim()
    .min(1, 'Inserisci il tuo nome')
    .max(80, 'Il nome è troppo lungo'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Inserisci il tuo cognome')
    .max(80, 'Il cognome è troppo lungo'),
  phone: z
    .string()
    .trim()
    .min(6, 'Inserisci un numero di telefono valido')
    .max(30, 'Numero di telefono troppo lungo'),
  birthday: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Inserisci una data di nascita valida'),
  consent: z.literal(true, {
    errorMap: () => ({
      message: 'Devi accettare il consenso per registrarti',
    }),
  }),
});

function normalizePhone(rawPhone: string): string | null {
  const trimmed = rawPhone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 7 || digits.length > 15) {
    return null;
  }

  return hasPlus ? `+${digits}` : digits;
}

function isValidPastDate(dateStr: string): boolean {
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  // Ensure calendar date didn't overflow (e.g. 2024-02-31)
  if (parsed.toISOString().slice(0, 10) !== dateStr) {
    return false;
  }

  const now = new Date();
  const minYear = 1900;
  return parsed.getUTCFullYear() >= minYear && parsed <= now;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Richiesta non valida. Formato JSON atteso.' },
      { status: 400 }
    );
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? 'Dati inseriti non validi.',
        field: firstIssue?.path[0] ?? null,
      },
      { status: 400 }
    );
  }

  const { slug, firstName, lastName, phone, birthday, consent } = parsed.data;

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json(
      {
        error: 'Inserisci un numero di telefono valido (7–15 cifre).',
        field: 'phone',
      },
      { status: 400 }
    );
  }

  if (!isValidPastDate(birthday)) {
    return NextResponse.json(
      {
        error: 'Inserisci una data di nascita valida nel passato.',
        field: 'birthday',
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          'Supabase non è ancora configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (oppure SUPABASE_SERVICE_ROLE_KEY) nelle variabili di ambiente.',
      },
      { status: 503 }
    );
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (restaurantError) {
    console.error('[api/crm/create] Error fetching restaurant:', restaurantError.code);
    return NextResponse.json(
      { error: 'Errore durante la verifica del ristorante su Supabase.' },
      { status: 500 }
    );
  }

  if (!restaurant) {
    return NextResponse.json(
      {
        error: `Nessun ristorante trovato con slug "${slug}". Verifica che esista una riga nella tabella restaurants di Supabase.`,
      },
      { status: 404 }
    );
  }

  const { data: existingCustomers, error: lookupError } = await supabase
    .from('customers')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('phone', normalizedPhone)
    .limit(1);

  if (lookupError) {
    console.error('[api/crm/create] Error checking existing customer:', lookupError.code);
    return NextResponse.json(
      { error: 'Errore durante la verifica della registrazione.' },
      { status: 500 }
    );
  }

  if (existingCustomers && existingCustomers.length > 0) {
    return NextResponse.json(
      {
        error: 'Questo numero di telefono risulta già registrato per questo ristorante.',
        alreadyRegistered: true,
      },
      { status: 409 }
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data: createdCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      id: randomUUID(),
      restaurant_id: restaurant.id,
      name: fullName,
      phone: normalizedPhone,
      birthday,
      consent,
      has_active_discount: false,
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    })
    .select('id, name, phone, birthday, created_at')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        {
          error: 'Questo numero di telefono risulta già registrato per questo ristorante.',
          alreadyRegistered: true,
        },
        { status: 409 }
      );
    }

    if (insertError.code === '42501') {
      return NextResponse.json(
        {
          error:
            'Permesso negato da Supabase (RLS). Verifica che SUPABASE_SECRET_KEY sia impostata correttamente nelle variabili di ambiente.',
        },
        { status: 403 }
      );
    }

    console.error('[api/crm/create] Error inserting customer:', insertError.code);
    return NextResponse.json(
      { error: 'Impossibile completare la registrazione su Supabase.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      restaurantName: restaurant.name,
      customer: createdCustomer,
    },
    { status: 201 }
  );
}
