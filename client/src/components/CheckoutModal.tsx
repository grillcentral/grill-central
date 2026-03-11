import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { X, MapPin, Truck, AlertCircle, Printer } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ── Configurações ────────────────────────────────────────────────────
const RESTAURANT_LAT  = -28.7518006;
const RESTAURANT_LNG  = -49.4729225;
const FRETE_POR_KM    = 1.00;
const FRETE_MINIMO    = 3.00;
const RAIO_MAXIMO_KM  = 14;
const FATOR_ROTA      = 1.25;
const PEDIDO_MINIMO   = 25.00;
const WHATSAPP_NUMBER = '5548988362576';

interface CheckoutModalProps {
  onClose: () => void;
}

// Haversine
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Formata cupom 80mm para impressão térmica
function gerarCupom(pedido: any): string {
  const linha  = '─'.repeat(42);
  const centro = (txt: string) => txt.padStart(Math.floor((42 + txt.length) / 2)).padEnd(42);

  const itens = pedido.items
    .map((i: any) => {
      const nome  = `${i.quantity}x ${i.name}`.substring(0, 28);
      const preco = `R$ ${(i.price * i.quantity).toFixed(2)}`;
      return `${nome.padEnd(30)}${preco.padStart(10)}`;
    })
    .join('\n');

  const freteLinha = pedido.freight > 0
    ? `${'Frete'.padEnd(30)}${ `R$ ${pedido.freight.toFixed(2)}`.padStart(10)}\n`
    : '';

  const pagamento =
    pedido.paymentMethod === 'pix'    ? 'PIX'    :
    pedido.paymentMethod === 'cartao' ? 'Cartão' : 'Dinheiro';

  const trocoLinha = pedido.paymentMethod === 'dinheiro' && pedido.troco
    ? `Troco para: R$ ${parseFloat(pedido.troco).toFixed(2)}\n`
    : '';

  const entrega = pedido.deliveryType === 'delivery'
    ? `Entrega: ${pedido.address}, ${pedido.number}\n${pedido.reference ? `Ref: ${pedido.reference}\n` : ''}`
    : 'Retirada no local\n';

  return `
${centro('GRILL CENTRAL')}
${centro('Forquilhinha - SC')}
${centro('(48) 98836-2576')}
${linha}
Pedido #${String(pedido.id).substring(0, 8).toUpperCase()}
${new Date(pedido.created_at).toLocaleString('pt-BR')}
${linha}
Cliente: ${pedido.customerName}
Tel: ${pedido.customerPhone}
${linha}
${entrega}${linha}
ITEM                          VALOR
${linha}
${itens}
${linha}
${freteLinha}${'TOTAL'.padEnd(30)}${`R$ ${pedido.total.toFixed(2)}`.padStart(10)}
${linha}
Pagamento: ${pagamento}
${trocoLinha}${linha}
${centro('Obrigado pela preferência!')}
${centro('Bom apetite! 🍔')}
`.trim();
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { items, total, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryType: 'delivery',
    address: '',
    number: '',
    reference: '',
    observations: '',
    paymentMethod: 'pix',
    troco: '',
  });
  const [location, setLocation]               = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [distanciaKm, setDistanciaKm]         = useState<number | null>(null);
  const [freteValor, setFreteValor]           = useState<number>(0);
  const [foraDeArea, setForaDeArea]           = useState(false);

  // Recalcula frete
  useEffect(() => {
    if (formData.deliveryType !== 'delivery' || !location) {
      setDistanciaKm(null);
      setFreteValor(0);
      setForaDeArea(false);
      return;
    }
    const distReta = haversineKm(location.lat, location.lng, RESTAURANT_LAT, RESTAURANT_LNG);
    const distReal = distReta * FATOR_ROTA;
    const km = Math.ceil(distReal * 10) / 10;
    setDistanciaKm(km);
    if (km > RAIO_MAXIMO_KM) {
      setForaDeArea(true);
      setFreteValor(0);
    } else {
      setForaDeArea(false);
      setFreteValor(Math.max(km * FRETE_POR_KM, FRETE_MINIMO));
    }
  }, [location, formData.deliveryType]);

  const totalComFrete = total + freteValor;

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocalização não suportada'); return; }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        toast.success('Localização capturada!');
        setLoadingLocation(false);
      },
      () => {
        toast.error('Não foi possível obter localização. Verifique as permissões.');
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) { toast.error('Preencha nome e telefone!'); return; }
    if (formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO) {
      toast.error(`Pedido mínimo para entrega é R$ ${PEDIDO_MINIMO.toFixed(2)}`); return;
    }
    if (formData.deliveryType === 'delivery' && !formData.address) {
      toast.error('Preencha o endereço!'); return;
    }
    if (formData.deliveryType === 'delivery' && foraDeArea) {
      toast.error(`Fora da área de entrega (máximo ${RAIO_MAXIMO_KM} km)`); return;
    }
    if (formData.paymentMethod === 'dinheiro' && !formData.troco) {
      toast.error('Informe o valor para troco!'); return;
    }

    // Monta pedido para salvar no Supabase
    const pedidoData = {
      customer_name:   formData.name,
      customer_phone:  formData.phone,
      delivery_type:   formData.deliveryType,
      address:         formData.address,
      number:          formData.number,
      reference:       formData.reference,
      observations:    formData.observations,
      payment_method:  formData.paymentMethod,
      troco:           formData.troco ? parseFloat(formData.troco) : null,
      items:           items,
      subtotal:        total,
      freight:         freteValor,
      total:           totalComFrete,
      gps_lat:         location?.lat ?? null,
      gps_lng:         location?.lng ?? null,
      status:          'novo',
      created_at:      new Date().toISOString(),
    };

    // Monta mensagem WhatsApp
    const pagamentoLabel =
      formData.paymentMethod === 'pix'    ? '💳 PIX'    :
      formData.paymentMethod === 'cartao' ? '💳 Cartão' : '💵 Dinheiro';

    const trocoInfo = formData.paymentMethod === 'dinheiro' && formData.troco
      ? `\n💵 *Troco para:* R$ ${parseFloat(formData.troco).toFixed(2)}`
      : '';

    const locationInfo = location
      ? `\n📍 *GPS:* https://www.google.com/maps?q=${location.lat},${location.lng}`
      : '';

    const freteInfo = freteValor > 0
      ? `\n🚗 *Frete (${distanciaKm?.toFixed(1)} km):* R$ ${freteValor.toFixed(2)}`
      : '';

    const deliveryInfo =
      formData.deliveryType === 'delivery'
        ? `\n\n📍 *Endereço:*\n${formData.address}, ${formData.number}${formData.reference ? `\nRef: ${formData.reference}` : ''}${locationInfo}${freteInfo}`
        : '\n\n🏪 *Retirada no local*';

    const itemsList = items
      .map(i => `${i.quantity}x ${i.name} — R$ ${(i.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const message =
      `🍔 *Novo Pedido - Grill Central*\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `📱 *Telefone:* ${formData.phone}` +
      `${deliveryInfo}\n\n` +
      `🛒 *Itens:*\n${itemsList}\n\n` +
      `💰 *Subtotal:* R$ ${total.toFixed(2)}\n` +
      (freteValor > 0 ? `🚗 *Frete:* R$ ${freteValor.toFixed(2)}\n` : '') +
      `✅ *Total: R$ ${totalComFrete.toFixed(2)}*\n\n` +
      `💳 *Pagamento:* ${pagamentoLabel}${trocoInfo}` +
      (formData.observations ? `\n\n📝 *Obs:* ${formData.observations}` : '');

    // 1️⃣ WhatsApp PRIMEIRO — sempre funciona
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    clearCart();
    toast.success('Pedido enviado! Aguarde o retorno pelo WhatsApp.');
    onClose();

    // 2️⃣ Supabase em background — não bloqueia o WhatsApp
    supabase.from('orders').insert(pedidoData).select().single()
      .then(({ data }) => {
        window.dispatchEvent(new CustomEvent('novoPedido', { detail: data ?? pedidoData }));
      })
      .catch(err => console.warn('Supabase orders insert:', err));
  };

  const isButtonDisabled =
    (formData.deliveryType === 'delivery' && foraDeArea) ||
    (formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO);

  const buttonLabel =
    foraDeArea                                              ? '❌ Fora da área de entrega' :
    formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO ? `⚠️ Mínimo R$ ${PEDIDO_MINIMO.toFixed(2)} para entrega` :
    'Enviar Pedido via WhatsApp';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seus Dados</h3>
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome" required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone/WhatsApp *</Label>
              <Input id="phone" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(48) 99999-9999" required />
            </div>
          </div>

          {/* Tipo de Pedido */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Pedido</h3>
            <RadioGroup value={formData.deliveryType}
              onValueChange={v => setFormData({ ...formData, deliveryType: v })}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">Entrega</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">Retirada no local</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dados de Entrega */}
          {formData.deliveryType === 'delivery' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Dados de Entrega
              </h3>
              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input id="address" value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Avenida..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123" />
                </div>
                <div>
                  <Label htmlFor="reference">Ponto de referência</Label>
                  <Input id="reference" value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Próximo ao mercado X" />
                </div>
              </div>

              {/* GPS */}
              <div className="pt-2">
                <Button type="button" onClick={getLocation} disabled={loadingLocation}
                  variant="outline" className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  {loadingLocation ? 'Obtendo localização...' : location ? '✅ Localização capturada' : 'Enviar Minha Localização'}
                </Button>

                {location && !foraDeArea && distanciaKm !== null && (
                  <div className="mt-3 bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">Entrega disponível — {distanciaKm.toFixed(1)} km</p>
                      <p className="text-xs text-zinc-400">Frete: R$ {freteValor.toFixed(2)} (mín. R$ {FRETE_MINIMO.toFixed(2)})</p>
                    </div>
                  </div>
                )}

                {location && foraDeArea && (
                  <div className="mt-3 bg-red-950 border border-red-700 rounded-xl p-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Fora da área de entrega</p>
                      <p className="text-xs text-zinc-400">Distância: {distanciaKm?.toFixed(1)} km — limite: {RAIO_MAXIMO_KM} km</p>
                    </div>
                  </div>
                )}

                {location && !foraDeArea && (
                  <p className="text-xs text-green-500 mt-2">📍 GPS será enviado com o pedido</p>
                )}
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">💳 Forma de Pagamento</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'pix',    label: '🔵 PIX',     desc: 'À vista' },
                { value: 'cartao', label: '💳 Cartão',  desc: 'Débito/Crédito' },
                { value: 'dinheiro', label: '💵 Dinheiro', desc: 'Na entrega' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: opt.value, troco: '' })}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.paymentMethod === opt.value
                      ? 'border-red-500 bg-red-950 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                  }`}>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-zinc-400 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Troco */}
            {formData.paymentMethod === 'dinheiro' && (
              <div>
                <Label htmlFor="troco">Troco para quanto? *</Label>
                <Input id="troco" type="number" step="0.01" value={formData.troco}
                  onChange={e => setFormData({ ...formData, troco: e.target.value })}
                  placeholder={`Ex: 50.00 (total é R$ ${totalComFrete.toFixed(2)})`}
                  required />
                {formData.troco && parseFloat(formData.troco) >= totalComFrete && (
                  <p className="text-xs text-green-400 mt-1">
                    💵 Troco: R$ {(parseFloat(formData.troco) - totalComFrete).toFixed(2)}
                  </p>
                )}
                {formData.troco && parseFloat(formData.troco) < totalComFrete && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Valor menor que o total do pedido
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea id="observations" value={formData.observations}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Ex: Portão verde, interfone 201..." rows={3} />
          </div>

          {/* Resumo */}
          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {formData.deliveryType === 'delivery' && freteValor > 0 && (
              <div className="flex justify-between text-sm text-zinc-400">
                <span>🚗 Frete ({distanciaKm?.toFixed(1)} km)</span>
                <span>R$ {freteValor.toFixed(2)}</span>
              </div>
            )}
            {formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO && (
              <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-400">
                  Mínimo para entrega: <strong>R$ {PEDIDO_MINIMO.toFixed(2)}</strong> —
                  Faltam <strong>R$ {(PEDIDO_MINIMO - total).toFixed(2)}</strong>
                </p>
              </div>
            )}
            {formData.deliveryType === 'delivery' && !location && total >= PEDIDO_MINIMO && (
              <p className="text-xs text-yellow-500">⚠️ Envie sua localização para calcular o frete</p>
            )}
            <div className="flex justify-between text-xl font-bold pt-2">
              <span>Total:</span>
              <span className="text-yellow-500">R$ {totalComFrete.toFixed(2)}</span>
            </div>
            <Button type="submit" disabled={isButtonDisabled}
              className="w-full bg-red-600 hover:bg-red-700 text-lg py-6 mt-2 disabled:bg-zinc-700 disabled:cursor-not-allowed">
              {buttonLabel}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
