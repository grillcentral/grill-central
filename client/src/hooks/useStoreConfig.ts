import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { StoreConfig, getStoreConfig } from "@/lib/storeConfig"

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>({
    name: "GRILL CENTRAL",
    neighborhood: "Centro",
    city: "Forquilhinha",
    state: "SC",
    address: "Rua Cinquentenário, 15",
    hours: "Qua–Dom 18:30h–23:00h",
    whatsappNumber: "5548988362576",
    isOpen: true,
  })

  useEffect(() => {
    let alive = true

    // 1) carrega do banco ao abrir
    getStoreConfig().then((c) => {
      if (!alive) return
      setConfig(c)
    })

    // 2) realtime: escuta qualquer update/insert na store_config
    const channel = supabase
      .channel("store_config_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_config" },
        async (payload) => {
          // jeito mais seguro: refaz o GET (garante consistência)
          const fresh = await getStoreConfig()
          if (!alive) return
          setConfig(fresh)

          // opcional: avisa outras partes
          window.dispatchEvent(new Event("storeConfigUpdated"))
        }
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [])

  return config
}