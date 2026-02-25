// client/src/lib/productOverrides.ts
// ✅ SEM localStorage — sem overrides dinâmicos
// Produtos são fixos em products.ts. Para editar, altere diretamente products.ts e faça deploy.

export interface ProductOverride {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  hidden?: boolean;
}

// Retorna array vazio — nenhum override ativo
export function getProductOverrides(): ProductOverride[] {
  return [];
}

// Mantido para não quebrar imports existentes, mas não faz nada
export function saveProductOverride(_override: ProductOverride): void {
  console.warn('[productOverrides] saveProductOverride desativado — edite products.ts no código.');
}

// Mantido para não quebrar imports existentes, mas não faz nada
export function resetProductOverride(_id: string): void {
  console.warn('[productOverrides] resetProductOverride desativado.');
}
