import Link from 'next/link';
import { getSupabaseServerClient } from '~/lib/supabase';

export const dynamic = 'force-dynamic';

interface RestaurantLink {
  id: string;
  name: string;
  slug: string;
}

export default async function HomePage() {
  let restaurants: RestaurantLink[] = [];

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .order('created_at', { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        restaurants = data;
      }
    } catch {
      // Fall back to default slug if Supabase is unreachable
    }
  }

  const primary = restaurants[0] ?? null;
  const primarySlug = primary?.slug ?? 'demo';
  const extraRestaurants = restaurants.slice(1);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center text-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Ristorante Automazione
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sistema di fedeltà e retention per ristoranti — ambiente di test
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href={`/r/${encodeURIComponent(primarySlug)}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Apri Landing Page QR
            {primary ? ` (${primary.name})` : ''}
          </Link>

          <p className="text-xs text-gray-500">
            Percorso QR:{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">
              /r/{primarySlug}
            </code>
          </p>

          {extraRestaurants.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Altri ristoranti trovati
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {extraRestaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/r/${encodeURIComponent(restaurant.slug)}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    {restaurant.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}