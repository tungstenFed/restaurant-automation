import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  created_at: string | null;
};

export type Customer = {
  id: string;
  restaurant_id: string | null;
  name: string;
  phone: string;
  birthday: string | null;
  consent: boolean | null;
  has_active_discount: boolean | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  created_at: string | null;
};

export type DiscountCode = {
  id: string;
  customer_id: string | null;
  restaurant_id: string | null;
  code: string;
  discount_percent: number | null;
  base_order_total: number | null;
  discount_amount: number | null;
  status: string | null;
  valid_until: string | null;
  used_at: string | null;
  created_at: string | null;
};

export type Order = {
  id: string;
  restaurant_id: string | null;
  customer_id: string | null;
  total_amount: number | null;
  discount_applied: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          phone?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          name: string;
          phone: string;
          birthday?: string | null;
          consent?: boolean | null;
          has_active_discount?: boolean | null;
          total_orders?: number | null;
          total_spent?: number | null;
          last_order_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          name?: string;
          phone?: string;
          birthday?: string | null;
          consent?: boolean | null;
          has_active_discount?: boolean | null;
          total_orders?: number | null;
          total_spent?: number | null;
          last_order_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      discount_codes: {
        Row: DiscountCode;
        Insert: {
          id?: string;
          customer_id?: string | null;
          restaurant_id?: string | null;
          code: string;
          discount_percent?: number | null;
          base_order_total?: number | null;
          discount_amount?: number | null;
          status?: string | null;
          valid_until?: string | null;
          used_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          restaurant_id?: string | null;
          code?: string;
          discount_percent?: number | null;
          base_order_total?: number | null;
          discount_amount?: number | null;
          status?: string | null;
          valid_until?: string | null;
          used_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          customer_id?: string | null;
          total_amount?: number | null;
          discount_applied?: number | null;
          status?: string | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          customer_id?: string | null;
          total_amount?: number | null;
          discount_applied?: number | null;
          status?: string | null;
          paid_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

let cachedClient: SupabaseClient<Database> | null = null;
let cachedConfigKey: string | null = null;

function resolveSupabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();

  // Prioritize server-only Secret key (sb_secret_...) and legacy service_role key
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return resolveSupabaseConfig() !== null;
}

/**
 * Returns a typed, server-side Supabase client supporting both the new
 * sb_secret_/sb_publishable_ keys and legacy service_role/anon keys.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  const config = resolveSupabaseConfig();
  if (!config) {
    return null;
  }

  const configKey = `${config.url}::${config.key}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  cachedClient = createClient<Database>(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  cachedConfigKey = configKey;

  return cachedClient;
}
