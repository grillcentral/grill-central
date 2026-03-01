// client/src/lib/storeConfig.ts
import { supabase } from "./supabaseClient"

export interface StoreConfig {
  name: string
  neighborhood: string
  city: string
  state: string
  address: string
  hours: string
  whatsappNumber: string
  isOpen: boolean
}

const CONFIG_ID = 1

export const DEFAULT_CONFIG: StoreConfig = {
  name: "GRILL CENTRAL",
  neighborhood: "Centro",
  city: "Forquilhinha",
  state: "SC",
  address: "Rua Cinquentenário, 15",
  hours: "Qua–Dom 18:30h–23:00h",
  whatsappNumber: "5548988362576",
  isOpen: true,
}

type StoreConfigRow = {
  id: string
  name: string
  neighborhood: string | null
  city: string | null
  state: string | null
  address: string | null
  hours: string | null
  whatsapp_number: string | null
  is_open: boolean
}

function rowToConfig(row: StoreConfigRow): StoreConfig {
  return {
    name: row.name,
    neighborhood: row.neighborhood ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    address: row.address ?? "",
    hours: row.hours ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    isOpen: !!row.is_open,
  }
}

function configToRow(config: StoreConfig): StoreConfigRow {
  return {
    id: CONFIG_ID,
    name: config.name,
    neighborhood: config.neighborhood ?? "",
    city: config.city ?? "",
    state: config.state ?? "",
    address: config.address ?? "",
    hours: config.hours ?? "",
    whatsapp_number: config.whatsappNumber ?? "",
    is_open: !!config.isOpen,
  }
}

// ✅ Agora é async: lê do Supabase
export async function getStoreConfig(): Promise<StoreConfig> {
  const { data, error } = await supabase
    .from("store_config")
    .select("*")
    .eq("id", CONFIG_ID)
    .maybeSingle()

  if (error) {
    console.error("[storeConfig] get error:", error)
    return { ...DEFAULT_CONFIG }
  }

  if (!data) {
    // cria a linha se não existir
    const created = await saveStoreConfig(DEFAULT_CONFIG)
    return created
  }

  return rowToConfig(data as StoreConfigRow)
}

// ✅ Agora salva no Supabase (upsert)
export async function saveStoreConfig(config: StoreConfig): Promise<StoreConfig> {
  const payload = configToRow(config)

  const { data, error } = await supabase
    .from("store_config")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .eq("id", CONFIG_ID)
    .single()

  if (error) {
    console.error("[storeConfig] save error:", error)
    // devolve o que tentou salvar (pra UI não travar)
    return { ...config }
  }

  return rowToConfig(data as StoreConfigRow)
}