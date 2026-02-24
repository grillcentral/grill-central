import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart, Settings, Plus, Minus, Trash2, X,
  MapPin, Clock, Flame, MessageCircle, Star, Phone,
  ChevronRight
} from 'lucide-react';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useProductImages } from '@/hooks/useProductImages';
import CheckoutModal from '@/components/CheckoutModal';
import AdminPanel from '@/components/AdminPanel';

const WHATSAPP_NUMBER = '5548988362576';

const CATEGORY_ICONS: Record<string, string> = {
  'XIS': '🍔',
  'LINHA ALHO NEGRO': '🧄',
  'PORÇÕES': '🍟',
  'BEBIDAS GELADAS': '🥤',
};

// Badges especiais por categoria
const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  'LINHA ALHO NEGRO': { label: '👨‍🍳 CHEF INDICA', color: 'bg-purple-900 border-purple-500 text-purple-200' },
};

// IDs com badge "DESTAQUE"
const DESTAQUES = ['xis-bacon', 'xis-file-mignon', 'xis-camarao'];

// IDs com badge "KIDS"
const KIDS_BADGE = ['xis-kids'];

export default function Home() {
  const { items, addItem, updateQuantity, removeItem, total } = useCart();
  const productImages = useProductImages();
  const [selectedCategory, setSelectedCategory] = useState<string>('XIS');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const categoryBarRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'XIS',              label: 'XIS' },
    { id: 'LINHA ALHO NEGRO', label: 'ALHO NEGRO' },
    { id: 'PORÇÕES',          label: 'PORÇÕES' },
    { id: 'BEBIDAS GELADAS',  label: 'BEBIDAS' },
  ];

  const filteredProducts = products.filter(p => p.category === selectedCategory);
  const cartItemCount    = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleWhatsApp = () => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');

  const pedirDiretoWhatsApp = (name: string, price: number) => {
    const msg = encodeURIComponent(
      `Olá! Gostaria de pedir:\n\n🍔 *${name}* — R$ ${price.toFixed(2).replace('.', ',')}\n\nAguardo confirmação! 😊`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  // Scroll aba ativa para o centro
  useEffect(() => {
    if (!categoryBarRef.current) return;
    const activeBtn = categoryBarRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ══════════════════════════════════════════════════════
          BANNER HERO — estilo iFood
      ══════════════════════════════════════════════════════ */}
      <div className="relative w-full" style={{ minHeight: 220 }}>
        {/* Plano de fundo degradê + foto sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0000 0%, #450a0a 45%, #7f1d1d 100%)',
          }}
        />
        {/* Overlay escurecedor na parte inferior */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #09090b 0%, transparent 55%)' }}
        />

        {/* Ícones do topo (settings + whatsapp) */}
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          <button
            onClick={handleWhatsApp}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition"
            title="WhatsApp"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdmin(true)}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition"
            title="Admin"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo do banner */}
        <div className="relative z-10 px-4 pt-10 pb-5 flex flex-col gap-3">
          {/* Logo + nome */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: '#dc2626',
                boxShadow: '0 0 20px #dc262688',
              }}
            >
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide leading-tight">GRILL CENTRAL</h1>
              <p className="text-red-300 text-xs font-medium">Cassino • Rio Grande, RS</p>
            </div>
          </div>

          {/* Pills de informação */}
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{ background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)', color: '#86efac' }}>
              🟢 Aberto agora
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/15 bg-white/10 text-zinc-300">
              <Clock className="w-3 h-3" /> Qua–Dom 18h–23h
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/15 bg-white/10 text-zinc-300">
              <MapPin className="w-3 h-3" /> R. dos Navegantes, 1221
            </span>
          </div>

          {/* CTA WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="self-start flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-full transition-all mt-1"
            style={{ boxShadow: '0 0 14px rgba(34,197,94,0.5)', animation: 'pulse-green 2s infinite' }}
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ABAS DE CATEGORIA — sticky, estilo iFood
      ══════════════════════════════════════════════════════ */}
      <div
        ref={categoryBarRef}
        className="sticky top-0 z-40 flex gap-1 overflow-x-auto bg-zinc-950 border-b border-zinc-800 px-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          const count = products.filter(p => p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              data-active={isActive}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{CATEGORY_ICONS[cat.id]}</span>
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-red-900/60 text-red-300' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          LISTA DE PRODUTOS — cards horizontais estilo iFood
      ══════════════════════════════════════════════════════ */}
      <main className="pb-28 px-3 pt-4">

        {/* Título da seção */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-5 bg-red-600 rounded-full" />
          <h2 className="text-base font-bold text-zinc-200">
            {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
          </h2>
          <span className="text-xs text-zinc-600 ml-1">
            {filteredProducts.length} itens
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {filteredProducts.map(product => {
            const imgSrc   = productImages[product.id] || product.image;
            const cartItem = items.find(i => i.id === product.id);
            const isDestaque = DESTAQUES.includes(product.id);
            const isKids     = KIDS_BADGE.includes(product.id);
            const catBadge   = CATEGORY_BADGE[product.category];

            return (
              <div
                key={product.id}
                className="relative bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden"
                style={isDestaque ? { borderColor: 'rgba(220,38,38,0.4)' } : {}}
              >
                {/* Barra lateral colorida nos destaques */}
                {isDestaque && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-2xl" />
                )}

                <div className="flex items-start gap-3 p-4">

                  {/* ── TEXTO ── */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-0.5">
                      {isDestaque && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/70 border border-red-600/50 text-red-300">
                          <Star className="w-2.5 h-2.5" /> DESTAQUE
                        </span>
                      )}
                      {isKids && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/70 border border-blue-500/50 text-blue-300">
                          🧒 KIDS
                        </span>
                      )}
                      {catBadge && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Nome */}
                    <h3 className="font-bold text-[15px] leading-snug text-white">{product.name}</h3>

                    {/* Descrição */}
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>

                    {/* Preço */}
                    <p className="text-red-400 font-black text-lg mt-1">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>

                    {/* Botão WhatsApp direto */}
                    <button
                      onClick={() => pedirDiretoWhatsApp(product.name, product.price)}
                      className="self-start mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-green-400 hover:text-green-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Pedir direto pelo WhatsApp
                    </button>
                  </div>

                  {/* ── FOTO + BOTÃO ADD ── */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center"
                      style={{ flexShrink: 0 }}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl opacity-40">{CATEGORY_ICONS[product.category]}</span>
                      )}
                    </div>

                    {/* Botão + / controle de quantidade */}
                    {cartItem ? (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-950 border border-red-600 rounded-full px-2 py-1 shadow-lg">
                        <button
                          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white w-4 text-center">{cartItem.quantity}</span>
                        <button
                          onClick={() => addItem(product)}
                          className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(product)}
                        className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-900/50 transition-all hover:scale-110"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════
          SIDEBAR DO CARRINHO
      ══════════════════════════════════════════════════════ */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={() => setShowCart(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-zinc-900 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
          showCart ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 sticky top-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-500" />
            Carrinho
            {cartItemCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartItemCount}
              </span>
            )}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setShowCart(false)} className="hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20">
              <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Carrinho vazio</p>
              <p className="text-xs mt-1">Adicione itens do cardápio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <h4 className="font-semibold text-sm leading-snug">{item.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        R$ {item.price.toFixed(2).replace('.', ',')} / un.
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-md bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-md bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="ml-auto font-bold text-red-400 text-sm">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 p-4 space-y-3 bg-zinc-900">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total do pedido</span>
              <span className="text-xl font-black text-red-400">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button
              onClick={() => { setShowCart(false); setShowCheckout(true); }}
              className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-lg shadow-red-900/30"
            >
              🛒 Finalizar Pedido
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BARRA FLUTUANTE DO CARRINHO — estilo iFood
      ══════════════════════════════════════════════════════ */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 text-white font-bold transition-all"
          style={{
            background: '#dc2626',
            boxShadow: '0 -4px 20px rgba(220,38,38,0.35)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="bg-black/25 text-white text-sm font-black px-2.5 py-0.5 rounded-lg">
              {cartItemCount}
            </span>
            <span className="text-base">Ver carrinho</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
            <ChevronRight className="w-5 h-5 opacity-80" />
          </div>
        </button>
      )}

      {/* FAB WhatsApp quando carrinho vazio */}
      {cartItemCount === 0 && (
        <button
          onClick={handleWhatsApp}
          className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow-xl shadow-green-900/50 transition-all hover:scale-105"
          style={{ animation: 'pulse-green 2s infinite' }}
          title="WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* ── MODAIS ── */}
      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
      {showAdmin    && <AdminPanel    onClose={() => setShowAdmin(false)}    />}

      <style>{`
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%      { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
