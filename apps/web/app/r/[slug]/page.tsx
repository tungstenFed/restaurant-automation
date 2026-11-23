import Link from 'next/link';
import { getSupabaseServerClient } from '~/lib/supabase';
import { CustomerRegistrationForm } from './CustomerRegistrationForm';

export const dynamic = 'force-dynamic';

interface QrLandingPageProps {
  params: Promise<{ slug: string }>;
}

function formatSlugFallback(slug: string): string { //Aura
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function QrLandingPage({ params }: QrLandingPageProps) {
  const { slug: rawSlug } = await params;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }

  let restaurantName = formatSlugFallback(slug) || 'Ristorante';
  let restaurantFound: boolean | null = null;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (!error) {
        if (data) {
          restaurantName = data.name;
          restaurantFound = true;
        } else {
          restaurantFound = false;
        }
      }
    } catch {
      // Keep fallback name if Supabase is unreachable
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10 text-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Programma Fedeltà
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {restaurantName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Inserisci i tuoi dati per registrarti e ricevere sconti dedicati.
          </p>
        </div>

        {restaurantFound === false && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            Nessun ristorante trovato su Supabase con slug{' '}
            <code className="font-mono font-semibold">{slug}</code>. Assicurati
            che lo slug corrisponda a una riga nella tabella{' '}
            <code className="font-mono">restaurants</code>.
          </div>
        )}

        <CustomerRegistrationForm
          slug={slug}
          restaurantName={restaurantName}
        />

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
          >
            ← Torna alla Home
          </Link>
        </div>
      </div>
    </main>
  );
}
