import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X, Upload, Loader2, Trash2, CheckCircle, Cloud,
  Camera, Store, UtensilsCrossed, Save, RotateCcw, Eye, EyeOff
} from 'lucide-react';
import { products } from '@/data/products';
import { toast } from 'sonner';
import { getStoreConfig, StoreConfig } from '@/lib/storeConfig';
import { getProductOverrides, saveProductOverride, resetProductOverride } from '@/lib/productOverrides';

interface AdminPanelProps {
  onClose: () => void;
}

const ADMIN_PASSWORD = '@grill2025';
const IMGBB_API_KEY = '168636329f99c2f019368c3c7d628d83';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

type Tab = 'fotos' | 'produtos' | 'loja';

// ── helpers imagens ──────────────────────────────────────────────────────────
function getStoredImages(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('productImages') || '{}'); }
  catch { return {}; }
}
function saveImageUrl(productId: string, url: string) {
  const s = getStoredImages(); s[productId] = url;
  localStorage.setItem('productImages', JSON.stringify(s));
  window.dispatchEvent(new Event('productImagesUpdated'));
}
function removeImageUrl(productId: string) {
  const s = getStoredImages(); delete s[productId];
  localStorage.setItem('productImages', JSON.stringify(s));
  window.dispatchEvent(new Event('productImagesUpdated'));
}
function resizeImage(file: File, maxW = 1200, maxH = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88).split(',')[1]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
async function uploadToImgBB(base64: string, name: string): Promise<string> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64);
  formData.append('name', name);
  const response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error?.message || 'Erro no ImgBB');
  return data.data.display_url as string;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [activeTab, setActiveTab]             = useState<Tab>('fotos');

  // ── Tab: Fotos ──
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [images, setImages]           = useState<Record<string, string>>(getStoredImages);
  const refreshImages = () => setImages(getStoredImages());

  // ── Tab: Produtos ──
  const [overrides, setOverrides]   = useState(getProductOverrides);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState({ name: '', price: '', description: '' });
  const refreshOverrides = () => setOverrides(getProductOverrides());

  // ── Tab: Loja ──
  // ✅ Sempre inicia com DEFAULT_CONFIG do código — sem localStorage
  const [storeForm, setStoreForm] = useState<StoreConfig>(getStoreConfig());

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('✅ Login realizado!');
    } else {
      toast.error('❌ Senha incorreta!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🔐 Painel Admin</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha" autoFocus required />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Entrar</Button>
          </form>
        </Card>
      </div>
    );
  }

  // ── Handlers: Fotos ──────────────────────────────────────────────────────
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string,
    productName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 32 * 1024 * 1024) { toast.error('Imagem muito grande! Máximo 32MB.'); return; }
    setUploadingId(productId);
    try {
      toast.info('📤 Enviando para a nuvem...');
      const base64 = await resizeImage(file);
      const url    = await uploadToImgBB(base64, productName);
      saveImageUrl(productId, url);
      refreshImages();
      toast.success('✅ Foto salva na nuvem!');
    } catch (err) {
      console.error(err);
      toast.error('❌ Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };
  const handleRemoveImage = (productId: string) => {
    removeImageUrl(productId);
    refreshImages();
    toast.success('🗑️ Foto removida!');
  };

  // ── Handlers: Produtos ───────────────────────────────────────────────────
  const startEdit = (id: string) => {
    const ov = overrides[id] || {};
    const base = products.find(p => p.id === id)!;
    setEditForm({
      name:        ov.name        ?? base.name,
      price:       String(ov.price ?? base.price),
      description: ov.description ?? base.description,
    });
    setEditingId(id);
  };
  const saveEdit = (id: string) => {
    const price = parseFloat(editForm.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) { toast.error('Preço inválido!'); return; }
    saveProductOverride(id, {
      name:        editForm.name.trim(),
      price,
      description: editForm.description.trim(),
    });
    refreshOverrides();
    setEditingId(null);
    toast.success('✅ Produto atualizado! (somente neste dispositivo)');
  };
  const resetProduct = (id: string) => {
    resetProductOverride(id);
    refreshOverrides();
    if (editingId === id) setEditingId(null);
    toast.info('↩️ Produto restaurado ao padrão.');
  };
  const toggleActive = (id: string) => {
    const current = overrides[id]?.active ?? true;
    saveProductOverride(id, { active: !current });
    refreshOverrides();
    toast.success(current ? '🙈 Produto ocultado do cardápio.' : '👁️ Produto visível no cardápio.');
  };

  // ── Handlers: Loja ──────────────────────────────────────────────────────
  // ✅ Salvar não usa mais localStorage — mostra aviso explicativo
  const handleSaveStore = () => {
    toast.info('ℹ️ Para alterar o endereço permanentemente, edite DEFAULT_CONFIG em storeConfig.ts e faça deploy.');
  };

  // ── TABS RENDER ──────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'fotos',    label: 'Fotos',    icon: <Camera className="w-4 h-4" /> },
    { id: 'produtos', label: 'Produtos', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'loja',     label: 'Loja',     icon: <Store className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto">

        {/* ── Cabeçalho ── */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">⚙️ Painel Admin</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-zinc-800 px-4 pt-2 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === t.id
                  ? 'border-red-500 text-red-400 bg-zinc-800'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB: FOTOS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'fotos' && (
          <>
            <div className="mx-6 mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Como usar:</strong> Clique em <strong>"Adicionar Foto"</strong>,
                escolha a foto (até 32MB, suporta 4K). Ela vai para a nuvem e aparece em todos os dispositivos.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => {
                const currentImage = images[product.id];
                const isUploading  = uploadingId === product.id;
                return (
                  <Card key={product.id} className="bg-zinc-800 border-zinc-700 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-sm">{overrides[product.id]?.name ?? product.name}</h3>
                        <p className="text-yellow-500 text-sm font-semibold">
                          R$ {(overrides[product.id]?.price ?? product.price).toFixed(2)}
                        </p>
                      </div>
                      {currentImage && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" /><Cloud className="w-3 h-3" /> Nuvem
                        </span>
                      )}
                    </div>
                    {currentImage && (
                      <div className="mb-3 rounded overflow-hidden border border-zinc-600">
                        <img src={currentImage} alt={product.name} className="w-full h-36 object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input type="file" accept="image/*" id={`upload-${product.id}`}
                        className="hidden" disabled={isUploading}
                        onChange={e => handleFileChange(e, product.id, product.name)} />
                      <Label htmlFor={`upload-${product.id}`}
                        className={`flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                          isUploading ? 'bg-zinc-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        }`}>
                        {isUploading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                          : <><Upload className="w-4 h-4" /> {currentImage ? 'Trocar Foto' : 'Adicionar Foto'}</>}
                      </Label>
                      {currentImage && !isUploading && (
                        <Button variant="outline" size="sm"
                          onClick={() => handleRemoveImage(product.id)}
                          className="px-3 border-zinc-600 hover:bg-red-950 hover:border-red-800">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: PRODUTOS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'produtos' && (
          <div className="p-6 space-y-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
              <p className="text-sm text-yellow-300">
                ✏️ Edite nome, preço e descrição de cada produto. Use o botão 👁️ para ocultar/mostrar no cardápio.
              </p>
            </div>
            {products.map(product => {
              const ov       = overrides[product.id] || {};
              const isActive = ov.active ?? true;
              const isEditing = editingId === product.id;
              const hasOverride = Object.keys(ov).length > 0;

              return (
                <Card key={product.id}
                  className={`bg-zinc-800 border-zinc-700 p-4 transition-all ${!isActive ? 'opacity-50' : ''}`}>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 font-mono">{product.id}</span>
                        <span className="text-xs text-yellow-400">editando...</span>
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">Nome</Label>
                        <Input value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="bg-zinc-700 border-zinc-600 mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">Preço (R$)</Label>
                        <Input value={editForm.price}
                          onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          className="bg-zinc-700 border-zinc-600 mt-1" placeholder="29.90" />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">Descrição</Label>
                        <Textarea value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          className="bg-zinc-700 border-zinc-600 mt-1 resize-none" rows={2} />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => saveEdit(product.id)}
                          className="bg-green-600 hover:bg-green-700 gap-1">
                          <Save className="w-3.5 h-3.5" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => setEditingId(null)}
                          className="border-zinc-600">Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm">{ov.name ?? product.name}</h3>
                          {hasOverride && (
                            <span className="text-[10px] bg-yellow-900/50 border border-yellow-600/40 text-yellow-400 px-1.5 py-0.5 rounded">
                              editado
                            </span>
                          )}
                          {!isActive && (
                            <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                              oculto
                            </span>
                          )}
                        </div>
                        <p className="text-red-400 font-bold text-sm mt-0.5">
                          R$ {(ov.price ?? product.price).toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">
                          {ov.description ?? product.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost"
                          onClick={() => toggleActive(product.id)}
                          className="px-2 text-zinc-400 hover:text-white"
                          title={isActive ? 'Ocultar do cardápio' : 'Mostrar no cardápio'}>
                          {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => startEdit(product.id)}
                          className="px-2 text-zinc-400 hover:text-white">
                          ✏️
                        </Button>
                        {hasOverride && (
                          <Button size="sm" variant="ghost"
                            onClick={() => resetProduct(product.id)}
                            className="px-2 text-zinc-400 hover:text-yellow-400"
                            title="Restaurar padrão">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: LOJA
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'loja' && (
          <div className="p-6 max-w-lg space-y-4">

            {/* ✅ Aviso explicativo */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                📌 <strong>Dados fixos no código.</strong> As informações abaixo são exibidas para todos os clientes.
                Para alterar permanentemente, edite <code className="bg-zinc-800 px-1 rounded">DEFAULT_CONFIG</code> em{' '}
                <code className="bg-zinc-800 px-1 rounded">client/src/lib/storeConfig.ts</code> e faça deploy.
              </p>
            </div>

            {/* Campos somente leitura mostrando os valores atuais do código */}
            <div className="space-y-4 opacity-80">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-400">Bairro</Label>
                  <Input value={storeForm.neighborhood} readOnly
                    className="bg-zinc-800 border-zinc-700 mt-1 cursor-default" />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Cidade</Label>
                  <Input value={storeForm.city} readOnly
                    className="bg-zinc-800 border-zinc-700 mt-1 cursor-default" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Endereço completo</Label>
                <Input value={storeForm.address} readOnly
                  className="bg-zinc-800 border-zinc-700 mt-1 cursor-default" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Horário de funcionamento</Label>
                <Input value={storeForm.hours} readOnly
                  className="bg-zinc-800 border-zinc-700 mt-1 cursor-default" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Número WhatsApp (com DDI, sem +)</Label>
                <Input value={storeForm.whatsappNumber} readOnly
                  className="bg-zinc-800 border-zinc-700 mt-1 cursor-default" />
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <div>
                  <p className="text-sm font-semibold">Status da loja</p>
                  <p className="text-xs text-zinc-500">Exibe "Aberto agora" ou "Fechado"</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  storeForm.isOpen ? 'bg-green-700 text-green-100' : 'bg-zinc-600 text-zinc-300'
                }`}>
                  {storeForm.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            </div>

            {/* Botão informativo */}
            <Button
              onClick={handleSaveStore}
              variant="outline"
              className="w-full border-blue-600 text-blue-400 hover:bg-blue-950 gap-2">
              <Save className="w-4 h-4" /> Como alterar estes dados?
            </Button>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t border-zinc-800 p-4 text-center">
          <p className="text-xs text-zinc-500">🔒 Painel Admin · Grill Central</p>
        </div>
      </Card>
    </div>
  );
}
