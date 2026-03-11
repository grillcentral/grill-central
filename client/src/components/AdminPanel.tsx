import { useState, useEffect, useRef } from 'react';
import { X, Camera, Eye, EyeOff, Upload, Printer, RefreshCw, Settings, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = '@grill2025';
const IMGBB_KEY = '168636329f99c2f019368c3c7d628d83';

/* ─────────────────── Tipos ─────────────────── */
interface AdminPanelProps {
  onClose: () => void;
  isOpen?: boolean;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  address?: string;
  number?: string;
  reference?: string;
  observations?: string;
  payment_method: string;
  troco?: number | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  freight: number;
  total: number;
  gps_lat?: number;
  gps_lng?: number;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-yellow-600 text-yellow-100' },
  preparando: { label: 'Preparando', color: 'bg-blue-600 text-blue-100' },
  entregue: { label: 'Entregue', color: 'bg-green-700 text-green-100' },
  cancelado: { label: 'Cancelado', color: 'bg-red-700 text-red-100' },
};

/* ─────────────────── Som Ding-Dong ─────────────────── */
function tocarNovoPedido() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // DING (nota alta)
    const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    const t = ctx.currentTime;

    // DING — nota aguda
    playNote(1318, t,        0.6, 0.5);  // Mi5
    playNote(1047, t + 0.02, 0.6, 0.3); // Dó5 (harmônico)

    // DONG — nota grave (0.7s depois)
    playNote(880,  t + 0.7,  0.8, 0.5); // Lá4
    playNote(659,  t + 0.72, 0.8, 0.3); // Mi4 (harmônico)

    // Repete uma vez após 1.8s
    setTimeout(() => tocarNovoPedido._once?.(), 1800);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}
// Toca só 2x no total (evita loop infinito)
tocarNovoPedido._once = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const play = (freq: number, t: number, dur: number, vol: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    };
    const t = ctx.currentTime;
    play(1318, t, 0.6, 0.4);
    play(1047, t + 0.02, 0.6, 0.25);
    play(880,  t + 0.7, 0.8, 0.4);
    play(659,  t + 0.72, 0.8, 0.25);
  } catch (_) {}
};


/* ─────────────────── Resize Imagem ─────────────────── */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const MAX = 1200;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.88);
    };
    img.src = url;
  });
}

/* ─────────────────── Componente Principal ─────────────────── */
export default function AdminPanel({ onClose, products }: AdminPanelProps) {
  const safeProducts: Product[] = products ?? [];

  /* Auth */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /* UI */
  const [activeTab, setActiveTab] = useState<'pedidos' | 'fotos' | 'produtos' | 'loja'>('pedidos');
  const [toast, setToast] = useState<string | null>(null);

  /* Pedidos */
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const lastOrderCount = useRef<number>(-1);

  /* Fotos */
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Produtos */
  const [overrides, setOverrides] = useState<Record<string, { price?: number; description?: string; hidden?: boolean }>>({});

  /* Loja */
  const [storeForm, setStoreForm] = useState({
    name: 'GRILL CENTRAL',
    neighborhood: 'centro',
    city: 'Forquilhinha',
    state: 'SC',
    address: 'Rua Cinquentenário, 15',
    hours: 'Qua–Dom 18:30–23:00',
    whatsapp: '5548988362576',
    isOpen: true,
  });

  /* ── Carrega dados após login ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    loadImages();
    loadOrders();
    loadStoreConfig();
    loadOverrides();
  }, [isAuthenticated]);

  /* ── Listener de novos pedidos (evento local) ── */
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setOrders(prev => [e.detail, ...prev]);
        tocarNovoPedido();
        showToast('🛒 Novo pedido chegou!');
      }
    };
    window.addEventListener('novoPedido', handler);
    return () => window.removeEventListener('novoPedido', handler);
  }, []);

  /* ── Polling Supabase (30s) ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!data) return;

        const count = data.length;

        if (lastOrderCount.current === -1) {
          lastOrderCount.current = count;
          return;
        }

        if (count > lastOrderCount.current) {
          const novos = count - lastOrderCount.current;
          lastOrderCount.current = count;

          const { data: full } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          if (full) setOrders(full);

          for (let i = 0; i < Math.min(novos, 3); i++) {
            setTimeout(() => tocarNovoPedido(), i * 2000);
          }

          showToast(`🛒 ${novos} novo${novos > 1 ? 's pedidos' : ' pedido'}!`);
        }
      } catch (_) {}
    }, 30000);

    return () => clearInterval(poll);
  }, [isAuthenticated]);

  /* ── Helpers ── */
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function loadImages() {
    try {
      const { data } = await supabase.from('product_images').select('product_id, image_url');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => {
          map[r.product_id] = r.image_url;
        });
        setProductImages(map);
      }
    } catch (_) {}
  }

  function getProductImage(productId: string, productName: string): string | undefined {
    if (productImages[productId]) return productImages[productId];

    const slug = productName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (productImages[slug]) return productImages[slug];

    const found = Object.entries(productImages).find(([k]) =>
      k.replace(/[_\s]/g, '-') === slug ||
      slug.includes(k.replace(/[_\s]/g, '-')) ||
      k.replace(/[_\s]/g, '-').includes(slug)
    );

    return found?.[1];
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setOrders(data);
        lastOrderCount.current = data.length;
      }
    } catch (_) {}
    setLoadingOrders(false);
  }

  async function loadStoreConfig() {
    try {
      const { data } = await supabase.from('store_config').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setStoreForm(prev => ({
          name: data.name ?? prev.name,
          neighborhood: data.neighborhood ?? prev.neighborhood,
          city: data.city ?? prev.city,
          state: data.state ?? prev.state,
          address: data.address ?? prev.address,
          hours: data.hours ?? prev.hours,
          whatsapp: data.whatsapp ?? prev.whatsapp,
          isOpen: data.is_open ?? prev.isOpen,
        }));
      }
    } catch (_) {}
  }

  async function saveStoreConfig() {
    try {
      const { error } = await supabase
        .from('store_config')
        .update({
          name: storeForm.name,
          neighborhood: storeForm.neighborhood,
          city: storeForm.city,
          state: storeForm.state,
          address: storeForm.address,
          hours: storeForm.hours,
          whatsapp: storeForm.whatsapp,
          is_open: storeForm.isOpen,
        })
        .eq('id', 1);

      if (error) throw error;

      showToast('✅ Configurações salvas!');
      window.dispatchEvent(new CustomEvent('storeConfigUpdated'));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showToast('❌ Erro ao salvar configurações');
    }
  }

  async function loadOverrides() {
    try {
      const { data } = await supabase.from('product_overrides').select('*');
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((r: any) => {
          map[r.product_id] = {
            price: r.price,
            description: r.description,
            hidden: !!r.hidden,
          };
        });
        setOverrides(map);
      }
    } catch (_) {}
  }

  async function saveOverride(id: string, field: string, value: any) {
    const updated = { ...overrides, [id]: { ...(overrides[id] ?? {}), [field]: value } };
    setOverrides(updated);

    try {
      const row = updated[id] ?? {};
      await supabase.from('product_overrides').upsert(
        {
          product_id: id,
          price: row.price ?? null,
          description: row.description ?? null,
          hidden: row.hidden ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id' }
      );

      window.dispatchEvent(new CustomEvent('productOverridesUpdated'));
      showToast('✅ Produto salvo!');
    } catch (_) {
      showToast('❌ Erro ao salvar produto');
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm('Excluir este pedido?')) return;

    try {
      await supabase.from('orders').delete().eq('id', orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('🗑️ Pedido excluído');
    } catch (_) {
      showToast('❌ Erro ao excluir');
    }
  }

  async function clearAllOrders() {
    if (!confirm('Tem certeza que deseja LIMPAR TODOS os pedidos? Esta ação não pode ser desfeita.')) return;

    try {
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setOrders([]);
      lastOrderCount.current = 0;
      showToast('🗑️ Todos os pedidos foram limpos!');
    } catch (_) {
      showToast('❌ Erro ao limpar pedidos');
    }
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast(`✅ Status: ${STATUS_CONFIG[status]?.label}`);
    } catch (_) {
      showToast('❌ Erro ao atualizar status');
    }
  }

  function handleUploadClick(productId: string) {
    setUploadTargetId(productId);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadTargetId;
    if (!file || !id) return;

    setUploadingId(id);

    try {
      const blob = await resizeImage(file);
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error('ImgBB falhou');

      const url = json.data.url;

      await supabase.from('product_images').upsert(
        { product_id: id, image_url: url },
        { onConflict: 'product_id' }
      );

      setProductImages(prev => ({ ...prev, [id]: url }));
      showToast('✅ Foto salva!');
    } catch (_) {
      showToast('❌ Erro ao enviar foto');
    }

    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function printOrder(order: Order) {
    const w = window.open('', '_blank', 'width=380,height=700');
    if (!w) return;

    const dt = new Date(order.created_at).toLocaleString('pt-BR');
    const items = order.items
      .map((i: any) => `${i.quantity}x ${i.name} — R$ ${Number(i.price).toFixed(2)}`)
      .join('\n');

    const pay =
      order.payment_method === 'pix'
        ? 'PIX'
        : order.payment_method === 'cartao'
        ? 'Cartão'
        : `Dinheiro${order.troco ? ` (troco p/ R$ ${Number(order.troco).toFixed(2)})` : ''}`;

    const addr =
      order.delivery_type === 'delivery'
        ? `Endereço: ${order.address}, ${order.number}`
        : 'Retirada no local';

    w.document.write(`<html><head><meta charset="utf-8"><title>Cupom</title>
<style>body{font-family:monospace;font-size:12px;width:300px;margin:0 auto;padding:8px}
h2{text-align:center;font-size:14px}hr{border:1px dashed #000}pre{white-space:pre-wrap}</style></head>
<body><h2>🔥 GRILL CENTRAL</h2><hr>
<p><b>Pedido #${order.id.slice(-6).toUpperCase()}</b><br>${dt}</p><hr>
<p><b>Cliente:</b> ${order.customer_name}<br><b>Tel:</b> ${order.customer_phone}</p><hr>
<pre>${items}</pre><hr>
<p>Subtotal: R$ ${Number(order.subtotal).toFixed(2)}
${order.freight > 0 ? `\nFrete: R$ ${Number(order.freight).toFixed(2)}` : ''}
<br><b>TOTAL: R$ ${Number(order.total).toFixed(2)}</b></p><hr>
<p>${addr}</p>
<p><b>Pagamento:</b> ${pay}</p><hr>
<p style="text-align:center">Obrigado! 🍔</p>
<script>window.print();window.close();</script></body></html>`);
    w.document.close();
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Senha incorreta!');
    }
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 p-3"
      style={{ zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg"
          style={{ zIndex: 10000 }}
        >
          {toast}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-400" />
            <span className="text-white font-bold text-sm">Admin — Grill Central</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 gap-4">
            <Lock className="w-10 h-10 text-zinc-400" />
            <p className="text-zinc-300 text-sm">Digite a senha para acessar o painel</p>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Senha"
              className="w-64 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 text-white text-center focus:outline-none focus:border-red-500 text-sm"
              autoFocus
            />
            {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
            <button
              onClick={handleLogin}
              className="px-8 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition"
            >
              Entrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex border-b border-zinc-700 bg-zinc-800 flex-shrink-0 overflow-x-auto">
              {(['pedidos', 'fotos', 'produtos', 'loja'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold capitalize whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'text-red-400 border-b-2 border-red-500 bg-zinc-900'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'pedidos'
                    ? '🧾 Pedidos'
                    : tab === 'fotos'
                    ? '📷 Fotos'
                    : tab === 'produtos'
                    ? '🍔 Produtos'
                    : '🏪 Loja'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'pedidos' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-zinc-400 text-xs">Últimos 50 pedidos</p>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button
                        onClick={tocarNovoPedido}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition"
                        title="Testar som"
                      >
                        🔔 Som
                      </button>
                      <button
                        onClick={loadOrders}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingOrders ? 'animate-spin' : ''}`} />
                        Atualizar
                      </button>
                      {orders.length > 0 && (
                        <button
                          onClick={clearAllOrders}
                          className="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg text-xs transition flex items-center gap-1"
                          title="Limpar todos os pedidos"
                        >
                          <Trash2 className="w-3 h-3" />
                          Limpar tudo
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingOrders && <p className="text-zinc-500 text-xs text-center py-4">Carregando...</p>}

                  {!loadingOrders && orders.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <p className="text-3xl mb-2">🧾</p>
                      <p className="text-sm">Nenhum pedido ainda</p>
                    </div>
                  )}

                  {orders.map(order => {
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.novo;
                    const isExpanded = expandedOrder === order.id;
                    const dt = new Date(order.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={order.id} className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-750"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-white text-xs font-semibold">{order.customer_name}</span>
                            <span className="text-zinc-400 text-xs">{dt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-xs font-bold">R$ {Number(order.total).toFixed(2)}</span>
                            <span className="text-zinc-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-zinc-700 p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-zinc-400">Tel</p>
                                <p className="text-white">{order.customer_phone}</p>
                              </div>
                              <div>
                                <p className="text-zinc-400">Tipo</p>
                                <p className="text-white capitalize">
                                  {order.delivery_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                                </p>
                              </div>

                              {order.delivery_type === 'delivery' && order.address && (
                                <div className="col-span-2">
                                  <p className="text-zinc-400">Endereço</p>
                                  <p className="text-white">{order.address}, {order.number}</p>
                                  {order.reference && <p className="text-zinc-400 text-xs">{order.reference}</p>}
                                  {order.gps_lat && (
                                    <a
                                      href={`https://www.google.com/maps?q=${order.gps_lat},${order.gps_lng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-400 text-xs hover:underline"
                                    >
                                      📍 Ver no Maps
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-zinc-400 text-xs mb-1">Itens</p>
                              {(order.items ?? []).map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-white">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>R$ {Number(item.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            <div className="border-t border-zinc-700 pt-2 text-xs">
                              <div className="flex justify-between text-zinc-400">
                                <span>Subtotal</span>
                                <span>R$ {Number(order.subtotal).toFixed(2)}</span>
                              </div>
                              {order.freight > 0 && (
                                <div className="flex justify-between text-zinc-400">
                                  <span>Frete</span>
                                  <span>R$ {Number(order.freight).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-white font-bold mt-1">
                                <span>Total</span>
                                <span>R$ {Number(order.total).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-zinc-400 mt-1">
                                <span>Pagamento</span>
                                <span>
                                  {order.payment_method === 'pix'
                                    ? 'PIX'
                                    : order.payment_method === 'cartao'
                                    ? 'Cartão'
                                    : `Dinheiro${order.troco ? ` (troco p/ R$${Number(order.troco).toFixed(2)})` : ''}`}
                                </span>
                              </div>
                            </div>

                            {order.observations && (
                              <div className="bg-zinc-700 rounded-lg p-2 text-xs text-zinc-300">
                                📝 {order.observations}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              {['novo', 'preparando', 'entregue', 'cancelado'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                                    order.status === s
                                      ? STATUS_CONFIG[s].color
                                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                  }`}
                                >
                                  {STATUS_CONFIG[s].label}
                                </button>
                              ))}

                              <button
                                onClick={() => printOrder(order)}
                                className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs flex items-center gap-1 transition"
                              >
                                <Printer className="w-3 h-3" /> Imprimir
                              </button>

                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg text-xs flex items-center gap-1 ml-auto transition"
                                title="Excluir pedido"
                              >
                                <Trash2 className="w-3 h-3" /> Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'fotos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-zinc-400 text-xs">Clique em "Foto" para enviar imagem de cada produto</p>
                    <button
                      onClick={loadImages}
                      className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" /> Recarregar
                    </button>
                  </div>

                  {safeProducts.length === 0 && (
                    <p className="text-zinc-500 text-xs text-center py-4">Nenhum produto disponível</p>
                  )}

                  {safeProducts.map(product => (
                    <div key={product.id} className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                        {getProductImage(product.id, product.name)
                          ? <img src={getProductImage(product.id, product.name)} alt={product.name} className="w-full h-full object-cover" />
                          : <span className="text-2xl">🍔</span>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                        <p className="text-zinc-400 text-xs">R$ {Number(product.price).toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => handleUploadClick(product.id)}
                        disabled={uploadingId === product.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition disabled:opacity-50"
                      >
                        {uploadingId === product.id
                          ? <Upload className="w-3 h-3 animate-spin" />
                          : <Camera className="w-3 h-3" />
                        }
                        {uploadingId === product.id ? 'Enviando...' : 'Foto'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'produtos' && (
                <div className="space-y-3">
                  {safeProducts.length === 0 && (
                    <p className="text-zinc-500 text-xs text-center py-4">Nenhum produto disponível</p>
                  )}

                  {safeProducts.map(product => {
                    const ov = overrides[product.id] ?? {};

                    return (
                      <div key={product.id} className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold text-sm">{product.name}</p>
                          <button
                            onClick={() => saveOverride(product.id, 'hidden', !ov.hidden)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                              ov.hidden
                                ? 'bg-red-800 text-red-300 hover:bg-red-700'
                                : 'bg-green-800 text-green-300 hover:bg-green-700'
                            }`}
                          >
                            {ov.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {ov.hidden ? 'Oculto' : 'Visível'}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={ov.price ?? product.price}
                            placeholder="Preço"
                            className="w-28 px-2 py-1 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-xs focus:outline-none focus:border-red-500"
                            onBlur={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) saveOverride(product.id, 'price', val);
                            }}
                          />
                          <input
                            type="text"
                            defaultValue={ov.description ?? product.description ?? ''}
                            placeholder="Descrição"
                            className="flex-1 px-2 py-1 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-xs focus:outline-none focus:border-red-500"
                            onBlur={e => saveOverride(product.id, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'loja' && (
                <div className="space-y-3">
                  {[
                    { label: 'Nome', key: 'name' },
                    { label: 'Bairro', key: 'neighborhood' },
                    { label: 'Cidade', key: 'city' },
                    { label: 'Estado', key: 'state' },
                    { label: 'Endereço', key: 'address' },
                    { label: 'Horário', key: 'hours' },
                    { label: 'WhatsApp (com DDI)', key: 'whatsapp' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-zinc-400 text-xs block mb-1">{label}</label>
                      <input
                        type="text"
                        value={(storeForm as any)[key]}
                        onChange={e => setStoreForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-zinc-400 text-xs block mb-1">Status da loja</label>
                    <button
                      onClick={async () => {
                        const newVal = !storeForm.isOpen;
                        setStoreForm(prev => ({ ...prev, isOpen: newVal }));

                        try {
                          const { error } = await supabase
                            .from('store_config')
                            .update({
                              name: storeForm.name,
                              neighborhood: storeForm.neighborhood,
                              city: storeForm.city,
                              state: storeForm.state,
                              address: storeForm.address,
                              hours: storeForm.hours,
                              whatsapp: storeForm.whatsapp,
                              is_open: newVal,
                            })
                            .eq('id', 1);

                          if (error) throw error;

                          showToast(newVal ? '🟢 Loja aberta!' : '🔴 Loja fechada!');
                          window.dispatchEvent(new CustomEvent('storeConfigUpdated'));
                        } catch (error) {
                          console.error('Erro ao salvar status:', error);
                          showToast('❌ Erro ao salvar status');
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        storeForm.isOpen
                          ? 'bg-green-700 text-green-100 hover:bg-green-600'
                          : 'bg-red-800 text-red-200 hover:bg-red-700'
                      }`}
                    >
                      {storeForm.isOpen ? '🟢 Aberta' : '🔴 Fechada'}
                    </button>
                  </div>

                  <button
                    onClick={saveStoreConfig}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition mt-2"
                  >
                    💾 Salvar Configurações
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-700 px-4 py-2 bg-zinc-800 flex-shrink-0 flex justify-end">
              <button
                onClick={() => { setIsAuthenticated(false); setPassword(''); }}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition"
              >
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}