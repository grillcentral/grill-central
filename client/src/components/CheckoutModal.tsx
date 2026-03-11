import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { X, MapPin, Truck, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

// ── Configurações de frete ──────────────────────────────────────────
const RESTAURANT_LAT = -28.7518006;
const RESTAURANT_LNG = -49.4729225;
const FRETE_POR_KM    = 1.00;  // R$ 1,00 por km
const FRETE_MINIMO    = 3.00;  // taxa mínima R$ 3,00
const RAIO_MAXIMO_KM  = 14;    // limite de entrega
const FATOR_ROTA      = 1.25;  // correção linha reta → rua real
const PEDIDO_MINIMO   = 25.00; // pedido mínimo para entrega R$ 25,00

interface CheckoutModalProps {
  onClose: () => void;
}

// Fórmula de Haversine — distância em linha reta (km)
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
  });
  const [location, setLocation]           = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [distanciaKm, setDistanciaKm]     = useState<number | null>(null);
  const [freteValor, setFreteValor]       = useState<number>(0);
  const [foraDeArea, setForaDeArea]       = useState(false);

  // Recalcula frete sempre que localização ou tipo de pedido muda
  useEffect(() => {
    if (formData.deliveryType !== 'delivery' || !location) {
      setDistanciaKm(null);
      setFreteValor(0);
      setForaDeArea(false);
      return;
    }
    const distReta = haversineKm(location.lat, location.lng, RESTAURANT_LAT, RESTAURANT_LNG);
    const distReal = distReta * FATOR_ROTA;
    const kmArredondado = Math.ceil(distReal * 10) / 10; // arredonda p/ cima em 0,1 km
    setDistanciaKm(kmArredondado);

    if (kmArredondado > RAIO_MAXIMO_KM) {
      setForaDeArea(true);
      setFreteValor(0);
    } else {
      setForaDeArea(false);
      const calculado = kmArredondado * FRETE_POR_KM;
      setFreteValor(Math.max(calculado, FRETE_MINIMO)); // mínimo R$ 3,00
    }
  }, [location, formData.deliveryType]);

  const totalComFrete = total + freteValor;

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        toast.success('Localização capturada!');
        setLoadingLocation(false);
      },
      (error) => {
        console.error(error);
        toast.error('Não foi possível obter sua localização. Verifique as permissões.');
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Preencha nome e telefone!');
      return;
    }
    if (formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO) {
      toast.error(`Pedido mínimo para entrega é R$ ${PEDIDO_MINIMO.toFixed(2)}. Adicione mais itens!`);
      return;
    }
    if (formData.deliveryType === 'delivery' && !formData.address) {
      toast.error('Preencha o endereço para entrega!');
      return;
    }
    if (formData.deliveryType === 'delivery' && foraDeArea) {
      toast.error(`Endereço fora da área de entrega (máximo ${RAIO_MAXIMO_KM} km).`);
      return;
    }

    const itemsList = items
      .map(item => `${item.quantity}x ${item.name} — R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    const locationInfo = location
      ? `\n📍 *Localização GPS:*\nhttps://www.google.com/maps?q=${location.lat},${location.lng}`
      : '';

    const freteInfo =
      formData.deliveryType === 'delivery' && freteValor > 0
        ? `\n🚗 *Frete (${distanciaKm?.toFixed(1)} km):* R$ ${freteValor.toFixed(2)}`
        : '';

    const deliveryInfo =
      formData.deliveryType === 'delivery'
        ? `\n\n📍 *Endereço de Entrega:*\n${formData.address}, ${formData.number}${
            formData.reference ? `\nReferência: ${formData.reference}` : ''
          }${locationInfo}${freteInfo}`
        : '\n\n🏪 *Retirada no local*';

    const message =
      `🍔 *Novo Pedido - Grill Central*\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `📱 *Telefone:* ${formData.phone}` +
      `${deliveryInfo}\n\n` +
      `🛒 *Itens do Pedido:*\n${itemsList}\n\n` +
      `💰 *Subtotal:* R$ ${total.toFixed(2)}\n` +
      (freteValor > 0 ? `🚗 *Frete:* R$ ${freteValor.toFixed(2)}\n` : '') +
      `✅ *Total: R$ ${totalComFrete.toFixed(2)}*` +
      (formData.observations ? `\n\n📝 *Observações:* ${formData.observations}` : '');

    const whatsappUrl = `https://wa.me/5548988362576?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    clearCart();
    toast.success('Pedido enviado! Aguarde o retorno pelo WhatsApp.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seus Dados</h3>
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone/WhatsApp *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(48) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Tipo de Pedido */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo de Pedido</h3>
            <RadioGroup
              value={formData.deliveryType}
              onValueChange={value => setFormData({ ...formData, deliveryType: value })}
            >
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
                <MapPin className="w-5 h-5" />
                Dados de Entrega
              </h3>
              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Avenida..."
                  required={formData.deliveryType === 'delivery'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Ponto de referência</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Próximo ao mercado X"
                  />
                </div>
              </div>

              {/* Botão GPS */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={getLocation}
                  disabled={loadingLocation}
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {loadingLocation
                    ? 'Obtendo localização...'
                    : location
                    ? '✅ Localização capturada'
                    : 'Enviar Minha Localização'}
                </Button>

                {/* Resultado do frete */}
                {location && !foraDeArea && distanciaKm !== null && (
                  <div className="mt-3 bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">
                        Entrega disponível — {distanciaKm.toFixed(1)} km
                      </p>
                      <p className="text-xs text-zinc-400">
                        Frete: R$ {freteValor.toFixed(2)} (R$ 1,00/km)
                      </p>
                    </div>
                  </div>
                )}

                {/* Fora da área */}
                {location && foraDeArea && (
                  <div className="mt-3 bg-red-950 border border-red-700 rounded-xl p-3 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">
                        Fora da área de entrega
                      </p>
                      <p className="text-xs text-zinc-400">
                        Sua localização está a {distanciaKm?.toFixed(1)} km — limite: {RAIO_MAXIMO_KM} km
                      </p>
                    </div>
                  </div>
                )}

                {location && !foraDeArea && (
                  <p className="text-xs text-green-500 mt-2">
                    📍 Localização GPS será enviada junto com o pedido
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label htmlFor="observations">Observações de entrega</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Ex: Portão verde, interfone 201..."
              rows={3}
            />
          </div>

          {/* Resumo de valores */}
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
                  Pedido mínimo para entrega: <strong>R$ {PEDIDO_MINIMO.toFixed(2)}</strong><br/>
                  Faltam <strong>R$ {(PEDIDO_MINIMO - total).toFixed(2)}</strong> para atingir o mínimo
                </p>
              </div>
            )}
            {formData.deliveryType === 'delivery' && !location && total >= PEDIDO_MINIMO && (
              <p className="text-xs text-yellow-500">
                ⚠️ Envie sua localização para calcular o frete
              </p>
            )}
            <div className="flex justify-between text-xl font-bold pt-2">
              <span>Total:</span>
              <span className="text-yellow-500">R$ {totalComFrete.toFixed(2)}</span>
            </div>

            <Button
              type="submit"
              disabled={
                (formData.deliveryType === 'delivery' && foraDeArea) ||
                (formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO)
              }
              className="w-full bg-red-600 hover:bg-red-700 text-lg py-6 mt-2 disabled:bg-zinc-700 disabled:cursor-not-allowed"
            >
              {foraDeArea
                ? '❌ Fora da área de entrega'
                : formData.deliveryType === 'delivery' && total < PEDIDO_MINIMO
                ? `⚠️ Mínimo R$ ${PEDIDO_MINIMO.toFixed(2)} para entrega`
                : 'Enviar Pedido via WhatsApp'}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
