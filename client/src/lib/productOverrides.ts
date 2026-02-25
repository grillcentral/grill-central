// client/src/lib/productOverrides.ts
export interface ProductOverride {
  name?: string;
  price?: number;
  description?: string;
  active?: boolean;
}

export function getProductOverrides(): Record<string, ProductOverride> {
  try {
    return JSON.parse(localStorage.getItem('productOverrides') || '{}');
  } catch {
    return {};
  }
}

export function saveProductOverride(id: string, override: ProductOverride) {
  const all = getProductOverrides();
  all[id] = { ...all[id], ...override };
  localStorage.setItem('productOverrides', JSON.stringify(all));
  window.dispatchEvent(new Event('productOverridesUpdated'));
}

export function resetProductOverride(id: string) {
  const all = getProductOverrides();
  delete all[id];
  localStorage.setItem('productOverrides', JSON.stringify(all));
  window.dispatchEvent(new Event('productOverridesUpdated'));
}
