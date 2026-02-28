import { supabase } from './supabase';

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

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .eq('id', 1)
      .single();
    if (error || !data) return { ...DEFAULT_CONFIG };
    return {
      name: data.name ?? DEFAULT_CONFIG.name,
      neighborhood: data.neighborhood ?? DEFAULT_CONFIG.neighborhood,
      city: data.city ?? DEFAULT_CONFIG.city,
      state: data.state ?? DEFAULT_CONFIG.state,
      address: data.address ?? DEFAULT_CONFIG.address,
      hours: data.hours ?? DEFAULT_CONFIG.hours,
      whatsappNumber: data.whatsapp_number ?? DEFAULT_CONFIG.whatsappNumber,
      isOpen: data.is_open ?? DEFAULT_CONFIG.isOpen,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveStoreConfig(config: StoreConfig): Promise<void> {
  const { error } = await supabase.from('store_config').upsert({
    id: 1,
    name: config.name,
    neighborhood: config.neighborhood,
    city: config.city,
    state: config.state,
    address: config.address,
    hours: config.hours,
    whatsapp_number: config.whatsappNumber,
    is_open: config.isOpen,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
