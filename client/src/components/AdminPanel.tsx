import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPanel({ onClose }: { onClose: () => void }) {

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    checkSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      checkSession()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkSession() {

    setLoading(true)

    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      setSession(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setSession(session)

    const { data } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (data) {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
      setError("Sem permissão de admin neste usuário.")
    }

    setLoading(false)
  }

  async function handleLogin() {

    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) {
      setError("Email ou senha incorretos.")
      setLoading(false)
      return
    }

    await checkSession()
  }

  async function handleLogout() {

    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)

  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center text-white">
        Carregando...
      </div>
    )
  }

  if (!session) {

    return (

      <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

        <div className="bg-zinc-900 p-6 rounded-lg w-80 text-white space-y-4">

          <h2 className="text-xl font-bold text-center">Admin Login</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-2 text-sm rounded">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 p-2 rounded font-semibold"
          >
            Entrar
          </button>

          <button
            onClick={onClose}
            className="w-full text-sm text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>

        </div>

      </div>

    )

  }

  if (!isAdmin) {

    return (

      <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

        <div className="bg-zinc-900 p-6 rounded text-white">

          {error || "Sem permissão de admin."}

          <div className="mt-4 flex gap-2">

            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Sair
            </button>

            <button
              onClick={onClose}
              className="bg-zinc-700 px-4 py-2 rounded"
            >
              Fechar
            </button>

          </div>

        </div>

      </div>

    )

  }

  return (

    <div className="fixed inset-0 bg-black text-white overflow-auto">

      <div className="p-4 flex justify-between items-center border-b border-zinc-800">

        <div>
          <h2 className="text-xl font-bold">Painel Admin</h2>
          <div className="text-sm text-zinc-400">
            Logado como {session.user.email}
          </div>
        </div>

        <div className="flex gap-2">

          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Sair
          </button>

          <button
            onClick={onClose}
            className="bg-zinc-700 px-4 py-2 rounded"
          >
            Fechar
          </button>

        </div>

      </div>

      <div className="p-6">

        {/* TODO: aqui continua seu painel existente
           Pedidos
           Fotos
           Produtos
           Loja
        */}

      </div>

    </div>

  )

}