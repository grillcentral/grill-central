import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Eye, EyeOff, Upload, Cloud, Printer, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getProductOverrides, saveProductOverrides, ProductOverride } from '@/lib/productOverrides';
import { getStoreConfig, saveStoreConfig, DEFAULT_CONFIG, StoreConfig } from '@/lib/storeConfig';

const ADMIN_PASSWORD = '@grill2025';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  address: string;
  number: string;
  reference: string;
  observations: string;
  payment_method: string;
  troco: number | null;
  items: any[];
  subtotal: number;
  freight: number;
  total: number;
  gps_lat: number | null;
  gps_lng: number | null;
  status: string;
  created_at: string;
}

// ── Cupom térmico 80mm ───────────────────────────────────────────────
function gerarCupom(order: Order): string {
  const L = 42;
  const linha = '─'.repeat(L);
  const centro = (t: string) => {
    const pad = Math.max(0, Math.floor((L - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const row = (esq: string, dir: string) => {
    const maxEsq = L - dir.length - 1;
    return esq.substring(0, maxEsq).padEnd(maxEsq) + ' ' + dir;
  };

  const pagLabel =
    order.payment_method === 'pix'     ? 'PIX' :
    order.payment_method === 'cartao'  ? 'Cartão' : 'Dinheiro';

  const itensLinhas = order.items
    .map((i: any) => row(`${i.quantity}x ${i.name}`, `R$${(i.price * i.quantity).toFixed(2)}`))
    .join('\n');

  const entregaLinha =
    order.delivery_type === 'delivery'
      ? `Entrega: ${order.address}, ${order.number}${order.reference ? '\nRef: ' + order.reference : ''}`
      : 'Retirada no local';

  const trocoLinha = order.payment_method === 'dinheiro' && order.troco
    ? `Troco p/: R$ ${order.troco.toFixed(2)}\n`
    : '';

  const freteLinha = order.freight > 0
    ? row('Frete', `R$${order.freight.toFixed(2)}`) + '\n'
    : '';

  const dataHora = new Date(order.created_at).toLocaleString('pt-BR');

  return [
    '',
    centro('*** GRILL CENTRAL ***'),
    centro('Forquilhinha - SC'),
    centro('(48) 98836-2576'),
    linha,
    `Pedido: ${order.id.substring(0, 8).toUpperCase()}`,
    `Data: ${dataHora}`,
    linha,
    `Cliente: ${order.customer_name}`,
    `Tel: ${order.customer_phone}`,
    linha,
    entregaLinha,
    linha,
    row('ITEM', 'VALOR'),
    linha,
    itensLinhas,
    linha,
    freteLinha + row('SUBTOTAL', `R$${order.subtotal.toFixed(2)}`),
    row('** TOTAL **', `R$${order.total.toFixed(2)}`),
    linha,
    `Pagamento: ${pagLabel}`,
    trocoLinha + linha,
    centro('Obrigado pela preferencia!'),
    centro('Bom apetite! :)'),
    '',
  ].join('\n');
}

function imprimirCupom(order: Order) {
  const cupom = gerarCupom(order);
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(`
    <html><head><title>Cupom #${order.id.substring(0,8).toUpperCase()}</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; font-size: 12px;
             white-space: pre; margin: 4mm; line-height: 1.4; }
    </style></head>
    <body>${cupom.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  novo:       { label: 'Novo',       color: 'bg-blue-700 text-blue-100',   icon: Clock },
  preparando: { label: 'Preparando', color: 'bg-yellow-700 text-yellow-100', icon: Clock },
  entregue:   { label: 'Entregue',   color: 'bg-green-700 text-green-100',  icon: CheckCircle },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-800 text-red-100',     icon: XCircle },
};

// ── Som de notificação (Web Audio API — sem arquivo externo) ─────────────────
 function tocarNovoPedido() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ac = new AudioCtx();

    const beep = (freq: number, start: number, dur: number, vol = 0.3) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ac.currentTime + start);
      gain.gain.setValueAtTime(0, ac.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ac.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
      osc.start(ac.currentTime + start);
      osc.stop(ac.currentTime + start + dur + 0.05);
    };

    // Sequência Ding-Dong — 2 repetições
    beep(880,  0.0,  0.15);
    beep(1100, 0.2,  0.15);
    beep(1320, 0.4,  0.25, 0.35);
    beep(880,  0.8,  0.15);
    beep(1100, 1.0,  0.15);
    beep(1320, 1.2,  0.25, 0.35);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function AdminPanel({ isOpen, onClose, products }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [passwordError, setPasswordError]     = useState('');
  const [activeTab, setActiveTab]             = useState<'pedidos' | 'fotos' | 'produtos' | 'loja'>('pedidos');
  const [overrides, setOverrides]             = useState<Record<string, ProductOverride>>({});
  const [storeForm, setStoreForm]             = useState<StoreConfig>({ ...DEFAULT_CONFIG });
  const [productImages, setProductImages]     = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId]         = useState<string | null>(null);
  const [toast, setToast]                     = useState<string | null>(null);
  const [orders, setOrders]                   = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders]     = useState(false);
  const [expandedOrder, setExpandedOrder]     = useState<string | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId]   = useState<string | null>(null);
  const lastOrderCount = useRef<number>(-1);

  useEffect(() => {
    if (isAuthenticated) {
      setOverrides(getProductOverrides());
      loadImages();
      loadOrders();
      getStoreConfig().then(setStoreForm).catch(() => setStoreForm({ ...DEFAULT_CONFIG }));
    }
  }, [isAuthenticated]);

  // Escuta novos pedidos do CheckoutModal
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

  // Polling Supabase a cada 30s — detecta pedidos de outros dispositivos
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = setInterval(async () => {
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
        // Recarrega a lista completa
        const { data: full } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (full) setOrders(full);
        // Toca o som e mostra toast
        for (let i = 0; i < Math.min(novos, 3); i++) {
          setTimeout(() => tocarNovoPedido(), i * 2000);
        }
        showToast(`🛒 ${novos} novo${novos > 1 ? 's pedidos' : ' pedido'} chegou!`);
      }
    }, 30000); // a cada 30 segundos
    return () => clearInterval(poll);
  }, [isAuthenticated]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setOrders(data);
    setLoadingOrders(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    showToast(`✅ Status atualizado: ${STATUS_CONFIG[status]?.label}`);
  };

  const loadImages = async () => {
    const { data } = await supabase.from('product_images').select('id, image_url');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(row => { map[row.id] = row.image_url; });
      setProductImages(map);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setIsAuthenticated(true); setPasswordError(''); }
    else setPasswordError('Senha incorreta');
  };

  const handleLogout = () => { setIsAuthenticated(false); setPassword(''); onClose(); };

  const resizeImage = (file: File, maxW = 1200, maxH = 900): Promise<Blob> =>
    new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio); height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85);
      };
      img.src = url;
    });

  const uploadToImgBB = async (blob: Blob): Promise<string> => {
    const fd = new FormData(); fd.append('image', blob);
    const res = await fetch('https://api.imgbb.com/1/upload?key=168636329f99c2f019368c3c7d628d83', { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.success) throw new Error('ImgBB upload falhou');
    return json.data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploadingId(uploadTargetId);
    try {
      const blob = await resizeImage(file);
      const url  = await uploadToImgBB(blob);
      const { error } = await supabase.from('product_images').upsert({ id: uploadTargetId, image_url: url, updated_at: new Date().toISOString() });
      if (error) throw error;
      setProductImages(prev => ({ ...prev, [uploadTargetId]: url }));
      window.dispatchEvent(new Event('productImagesUpdated'));
      showToast('✅ Foto salva! Visível em todos os dispositivos.');
    } catch { showToast('❌ Erro ao salvar foto.'); }
    finally {
      setUploadingId(null); setUploadTargetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (id: string) => { setUploadTargetId(id); setTimeout(() => fileInputRef.current?.click(), 50); };

  const handleSaveStore = async () => {
    try { await saveStoreConfig(storeForm); showToast('✅ Dados da loja salvos!'); }
    catch { showToast('❌ Erro ao salvar.'); }
  };

  const handleToggleProduct = (id: string, hidden: boolean) => {
    const updated = { ...overrides, [id]: { ...overrides[id], hidden } };
    setOverrides(updated); saveProductOverrides(updated);
    window.dispatchEvent(new Event('productOverridesUpdated'));
  };

  const handleSaveProduct = (id: string, field: 'price' | 'description', value: string) => {
    const updated = { ...overrides, [id]: { ...overrides[id], [field]: field === 'price' ? parseFloat(value) : value } };
    setOverrides(updated); saveProductOverrides(updated);
    window.dispatchEvent(new Event('productOverridesUpdated'));
    showToast('✅ Produto atualizado!');
  };

  if (!isOpen) return null;

  const tabs = [
    { key: 'pedidos',   label: '🧾 Pedidos' },
    { key: 'fotos',     label: '📷 Fotos' },
    { key: 'produtos',  label: '🍔 Produtos' },
    { key: 'loja',      label: '🏪 Loja' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 text-white w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">🔒 Painel Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 gap-4">
            <div className="text-4xl">🔑</div>
            <p className="text-gray-300 text-sm">Digite a senha para acessar o painel</p>
            <input type="password"
              className="w-full max-w-xs bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-600 focus:outline-none focus:border-red-500"
              placeholder="Senha" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
            <Button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 w-full max-w-xs">Entrar</Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 min-w-max py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-b-2 border-red-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* ── PEDIDOS ── */}
              {activeTab === 'pedidos' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-xs">Últimos 50 pedidos · atualiza a cada 30s</p>
                    <div className="flex items-center gap-2">
                      <button onClick={tocarNovoPedido} title="Testar som"
                        className="text-gray-400 hover:text-yellow-400 text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">
                        🔔
                      </button>
                      <button onClick={loadOrders} className="text-gray-400 hover:text-white">
                        <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {loadingOrders && (
                    <div className="text-center text-gray-500 py-8">Carregando pedidos...</div>
                  )}

                  {!loadingOrders && orders.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-2xl mb-2">🧾</p>
                      <p className="text-sm">Nenhum pedido ainda</p>
                    </div>
                  )}

                  {orders.map(order => {
                    const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['novo'];
                    const Icon = st.icon;
                    const isExpanded = expandedOrder === order.id;
                    const dataHora = new Date(order.created_at).toLocaleString('pt-BR');
                    const pagLabel =
                      order.payment_method === 'pix'    ? '🔵 PIX' :
                      order.payment_method === 'cartao' ? '💳 Cartão' : '💵 Dinheiro';

                    return (
                      <div key={order.id} className="bg-gray-800 rounded-xl overflow-hidden">
                        {/* Linha principal */}
                        <div className="p-3 flex items-center gap-3 cursor-pointer"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{order.customer_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${st.color}`}>
                                <Icon size={10} /> {st.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{dataHora} · {pagLabel} · R$ {order.total.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {order.delivery_type === 'delivery' ? `📍 ${order.address}, ${order.number}` : '🏪 Retirada'}
                            </p>
                          </div>
                          <div className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</div>
                        </div>

                        {/* Detalhes expandidos */}
                        {isExpanded && (
                          <div className="border-t border-gray-700 p-3 space-y-3">
                            {/* Itens */}
                            <div>
                              <p className="text-xs text-gray-400 font-medium mb-1">ITENS</p>
                              {order.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs py-0.5">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span className="text-gray-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
                                {order.freight > 0 && (
                                  <div className="flex justify-between text-xs text-gray-400">
                                    <span>Frete</span><span>R$ {order.freight.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-bold">
                                  <span>Total</span><span className="text-yellow-400">R$ {order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Pagamento */}
                            <div className="text-xs text-gray-300">
                              {pagLabel}
                              {order.payment_method === 'dinheiro' && order.troco && (
                                <span className="text-gray-400"> · Troco p/ R$ {order.troco.toFixed(2)} (troco: R$ {(order.troco - order.total).toFixed(2)})</span>
                              )}
                            </div>

                            {/* GPS */}
                            {order.gps_lat && order.gps_lng && (
                              <a href={`https://www.google.com/maps?q=${order.gps_lat},${order.gps_lng}`}
                                target="_blank" rel="noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                📍 Ver localização no Maps
                              </a>
                            )}

                            {/* Obs */}
                            {order.observations && (
                              <p className="text-xs text-gray-400">📝 {order.observations}</p>
                            )}

                            {/* Status buttons */}
                            <div>
                              <p className="text-xs text-gray-400 mb-2">Alterar status:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <button key={key}
                                    onClick={() => updateStatus(order.id, key)}
                                    className={`text-xs px-3 py-1 rounded-lg transition-all ${order.status === key ? cfg.color + ' font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                    {cfg.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Botão imprimir */}
                            <button onClick={() => imprimirCupom(order)}
                              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                              <Printer size={14} /> Imprimir Cupom (80mm)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── FOTOS ── */}
              {activeTab === 'fotos' && (
                <>
                  <p className="text-gray-400 text-xs text-center mb-2">Clique em "Adicionar Foto" para cada produto</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {products.map(product => (
                    <div key={product.id} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                        {productImages[product.id]
                          ? <img src={productImages[product.id]} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-500"><Camera size={20} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {productImages[product.id]
                          ? <span className="text-xs text-green-400 flex items-center gap-1"><Cloud size={12} /> Nuvem</span>
                          : <span className="text-xs text-gray-500">Sem foto</span>}
                      </div>
                      <button onClick={() => triggerUpload(product.id)} disabled={uploadingId === product.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors">
                        {uploadingId === product.id ? '⏳' : <><Upload size={12} /> Adicionar Foto</>}
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* ── PRODUTOS ── */}
              {activeTab === 'produtos' && (
                <>
                  <p className="text-gray-400 text-xs text-center mb-2">Edite preço, descrição ou oculte produtos</p>
                  {products.map(product => {
                    const ov = overrides[product.id] || {};
                    return (
                      <div key={product.id} className="bg-gray-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{product.name}</span>
                          <button onClick={() => handleToggleProduct(product.id, !ov.hidden)}
                            className={`text-xs px-2 py-1 rounded-lg ${ov.hidden ? 'bg-gray-600 text-gray-300' : 'bg-green-700 text-green-200'}`}>
                            {ov.hidden ? <><EyeOff size={12} className="inline mr-1" />Oculto</> : <><Eye size={12} className="inline mr-1" />Visível</>}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input type="number" step="0.01" defaultValue={ov.price ?? product.price}
                            className="w-24 bg-gray-700 rounded-lg px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-red-500"
                            onBlur={e => handleSaveProduct(product.id, 'price', e.target.value)} />
                          <input type="text" defaultValue={ov.description ?? product.description}
                            className="flex-1 bg-gray-700 rounded-lg px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-red-500"
                            onBlur={e => handleSaveProduct(product.id, 'description', e.target.value)} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── LOJA ── */}
              {activeTab === 'loja' && (
                <div className="space-y-3">
                  {([
                    { label: 'Nome', field: 'name' },
                    { label: 'Bairro', field: 'neighborhood' },
                    { label: 'Cidade', field: 'city' },
                    { label: 'Estado', field: 'state' },
                    { label: 'Endereço', field: 'address' },
                    { label: 'Horários', field: 'hours' },
                    { label: 'WhatsApp (somente números)', field: 'whatsappNumber' },
                  ] as { label: string; field: keyof StoreConfig }[]).map(({ label, field }) => (
                    <div key={String(field)}>
                      <label className="text-gray-400 text-xs block mb-1">{label}</label>
                      <input type="text" value={String(storeForm[field])}
                        onChange={e => setStoreForm(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-red-500" />
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <label className="text-gray-400 text-xs">Status da loja</label>
                    <button onClick={() => setStoreForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${storeForm.isOpen ? 'bg-green-700 text-green-200' : 'bg-red-800 text-red-200'}`}>
                      {storeForm.isOpen ? '🟢 Aberta' : '🔴 Fechada'}
                    </button>
                  </div>
                  <Button onClick={handleSaveStore} className="w-full bg-red-600 hover:bg-red-700 mt-2">
                    💾 Salvar na nuvem
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-700 flex justify-between items-center">
              <span className="text-gray-500 text-xs">Grill Central Admin</span>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs">Sair</button>
            </div>
          </>
        )}

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-xl shadow-lg border border-gray-600 whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
