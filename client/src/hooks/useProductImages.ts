import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type ImageMap = Record<string, string>

async function fetchImages(): Promise<ImageMap> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, image_url")

  if (error) {
    console.error("[useProductImages] Supabase error:", error)
    return {}
  }

  const map: ImageMap = {}
  for (const row of data ?? []) {
    if (row?.id && row?.image_url) map[String(row.id)] = String(row.image_url)
  }
  return map
}

export function useProductImages(): ImageMap {
  const [images, setImages] = useState<ImageMap>({})

  useEffect(() => {
    let alive = true

    const load = async () => {
      const map = await fetchImages()
      if (alive) setImages(map)
    }

    // carrega ao abrir
    load()

    // recarrega quando o AdminPanel terminar upload/remove
    const onUpdated = () => load()
    window.addEventListener("productImagesUpdated", onUpdated)

    return () => {
      alive = false
      window.removeEventListener("productImagesUpdated", onUpdated)
    }
  }, [])

  return images
}