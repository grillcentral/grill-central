import { useEffect, useState } from 'react';
import { StoreConfig, getStoreConfig } from '@/lib/storeConfig';

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(() => getStoreConfig());

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await getStoreConfig();
      if (mounted) setConfig(data);
    }

    load();

    // 🔁 escuta evento de atualização vindo do Admin
    function handleUpdate() {
      load();
    }

    window.addEventListener('storeConfigUpdated', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('storeConfigUpdated', handleUpdate);
    };
  }, []);

  return config;
}