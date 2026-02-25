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
  neighborhood: 'Cassino',
  city: 'Rio Grande',
  state: 'RS',
  address: 'R. dos Navegantes, 1221',
  hours: 'Qua–Dom 18h–23h',
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
