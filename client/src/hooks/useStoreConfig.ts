// client/src/hooks/useStoreConfig.ts
import { useState, useEffect } from 'react';
import { getStoreConfig, StoreConfig } from '@/lib/storeConfig';

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(getStoreConfig);

  useEffect(() => {
    const handler = () => setConfig(getStoreConfig());
    window.addEventListener('storeConfigUpdated', handler);
    return () => window.removeEventListener('storeConfigUpdated', handler);
  }, []);

  return config;
}
