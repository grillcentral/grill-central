// client/src/hooks/useStoreConfig.ts
// ✅ SEM localStorage — retorna sempre o config fixo do código

import { StoreConfig, getStoreConfig } from '@/lib/storeConfig';

export function useStoreConfig(): StoreConfig {
  // Sem useState/useEffect — dados são estáticos e vêm direto do código
  return getStoreConfig();
}
