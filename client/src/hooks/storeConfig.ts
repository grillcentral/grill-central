// client/src/lib/storeConfig.ts
// ✅ SEM localStorage — dados fixos no código, visíveis em todos os dispositivos

export interface StoreConfig {
  name: string;
  neighborhood: string;
  city: string;
  state: string;
  address: string;
  hours: string;
  whatsappNumber: string;
  isOpen: boolean;
}

export const DEFAULT_CONFIG: StoreConfig = {
  name: 'GRILL CENTRAL',
  neighborhood: 'Centro',
  city: 'Forquilhinha',
  state: 'SC',
  address: 'Rua Cinquentenário, 15',
  hours: 'Qua–Dom 18:30h–23:00h',
  whatsappNumber: '5548988362576',
  isOpen: true,
};

// Retorna sempre o config fixo do código
export function getStoreConfig(): StoreConfig {
  return { ...DEFAULT_CONFIG };
}

// Mantido para não quebrar imports existentes, mas não faz nada
// Para alterar dados, edite DEFAULT_CONFIG acima e faça deploy
export function saveStoreConfig(_config: StoreConfig): void {
  console.warn('[storeConfig] saveStoreConfig desativado — edite DEFAULT_CONFIG no código.');
}
