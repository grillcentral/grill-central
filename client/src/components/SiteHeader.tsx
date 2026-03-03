import React from "react"

type Props = {
  name?: string
  subtitle?: string
  isOpen?: boolean
  hoursText?: string
  addressText?: string
  whatsappUrl?: string
  onOpenAdmin?: () => void
}

export default function SiteHeader({
  name = "GRILL CENTRAL",
  subtitle = "centro • Forquilhinha, SC",
  isOpen = true,
  hoursText = "Qua–Dom 18:30h–23:00h",
  addressText = "Rua Cinquentenário, 15",
  whatsappUrl = "https://wa.me/5548999999999",
  onOpenAdmin,
}: Props) {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            
            {/* ESQUERDA */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10 shadow-md shrink-0">
                <img
                  src="/logo.png"
                  alt={name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-extrabold tracking-wide text-lg sm:text-xl truncate">
                    {name}
                  </h1>

                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold border",
                      isOpen
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
                        : "bg-zinc-500/10 text-zinc-300 border-white/10",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        isOpen ? "bg-emerald-400" : "bg-zinc-400",
                      ].join(" ")}
                    />
                    {isOpen ? "Aberto agora" : "Fechado"}
                  </span>
                </div>

                <p className="text-white/60 text-sm truncate">{subtitle}</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill icon="🕒" text={hoursText} />
                  <Pill icon="📍" text={addressText} />
                </div>
              </div>
            </div>

            {/* DIREITA */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
                           bg-emerald-500 text-black hover:bg-emerald-400 transition
                           shadow-md shadow-emerald-500/20"
              >
                💬 WhatsApp
              </a>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition
                           text-white/80 flex items-center justify-center"
              >
                ⚙️
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="h-6 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
    </header>
  )
}

function Pill({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs
                     bg-white/5 border border-white/10 text-white/75">
      <span>{icon}</span>
      <span className="truncate max-w-[220px] sm:max-w-none">{text}</span>
    </span>
  )
}