// client/src/lib/productOverrides.ts
// ✅ ATIVO — salva/lê overrides do Supabase (product_overrides table)

import { supabase } from '@/lib/supabase';

export interface ProductOverride {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  hidden?: boolean;
  active?: boolean;
}

// Lê overrides do Supabase — retorna Record<id, override>
export async function loadProductOverrides(): Promise<Record<string, ProductOverride>> {
  try {
    const { data } = await supabase.from('product_overrides').select('*');
    if (!data) return {};
    const map: Record<string, ProductOverride> = {};
    data.forEach((r: any) => {
      map[r.product_id] = {
        id:          r.product_id,
        price:       r.price       ?? undefined,
        description: r.description ?? undefined,
        hidden:      r.hidden      ?? false,
        active:      r.hidden      ? false : true,
      };
    });
    return map;
  } catch (_) {
    return {};
  }
}

// Salva override de um produto no Supabase
export async function saveProductOverrideSupabase(
  productId: string,
  fields: { price?: number; description?: string; hidden?: boolean }
): Promise<void> {
  await supabase.from('product_overrides').upsert(
    { product_id: productId, ...fields, updated_at: new Date().toISOString() },
    { onConflict: 'product_id' }
  );
}

// ---------- Mantidos para não quebrar imports antigos ----------
export function getProductOverrides(): ProductOverride[] { return []; }
export function saveProductOverride(_o: ProductOverride): void {}
export function resetProductOverride(_id: string): void {}
