import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

const DEFAULT: StoreConfig = {
  name: 'GRILL CENTRAL',
  neighborhood: 'centro',
  city: 'Forquilhinha',
  state: 'SC',
  address: 'Rua Cinquentenário, 15',
  hours: 'Qua–Dom 18:30h–23:00h',
  whatsappNumber: '5548988362576',
  isOpen: true,
};

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('store_config')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data) {
          setConfig({
            name:           data.name          ?? DEFAULT.name,
            neighborhood:   data.neighborhood  ?? DEFAULT.neighborhood,
            city:           data.city          ?? DEFAULT.city,
            state:          data.state         ?? DEFAULT.state,
            address:        data.address       ?? DEFAULT.address,
            hours:          data.hours         ?? DEFAULT.hours,
            whatsappNumber: data.whatsapp      ?? DEFAULT.whatsappNumber,
            isOpen:         data.is_open       ?? DEFAULT.isOpen,
          });
        }
      } catch (_) {}
    }

    load();

    // Recarrega quando admin alterar
    const handler = () => load();
    window.addEventListener('storeConfigUpdated', handler);
    return () => window.removeEventListener('storeConfigUpdated', handler);
  }, []);

  return config;
}
