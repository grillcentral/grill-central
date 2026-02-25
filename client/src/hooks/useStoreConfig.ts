import { StoreConfig, getStoreConfig } from '@/lib/storeConfig';

export function useStoreConfig(): StoreConfig {
  return getStoreConfig();
}
