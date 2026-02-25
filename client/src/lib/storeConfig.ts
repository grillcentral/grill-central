// client/src/lib/storeConfig.ts
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

const DEFAULT_CONFIG: StoreConfig = {
  name: 'GRILL CENTRAL',
  neighborhood: 'Centro',          // ← aqui
  city: 'Forquilhinha',            // ← aqui
  state: 'SC',                     // ← aqui
  address: 'Rua Cinquentenário, 15', // ← aqui
  hours: 'Qua–Dom 18:30h–23:00h', // ← aqui
  whatsappNumber: '5548988362576',
  isOpen: true,
};


export function getStoreConfig(): StoreConfig {
  try {
    const stored = localStorage.getItem('storeConfig');
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveStoreConfig(config: StoreConfig) {
  localStorage.setItem('storeConfig', JSON.stringify(config));
  window.dispatchEvent(new Event('storeConfigUpdated'));
}
