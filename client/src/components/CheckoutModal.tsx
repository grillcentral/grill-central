import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { X, MapPin } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface CheckoutModalProps {
  onClose: () => void;
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

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
        toast.success('Localização capturada com sucesso!');
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
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

    if (formData.deliveryType === 'delivery' && !formData.address) {
      toast.error('Preencha o endereço para entrega!');
      return;
    }

    // Montar mensagem WhatsApp
    const itemsList = items
      .map(item => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    const locationInfo = location
      ? `\n\n📍 *Localização GPS:*\nhttps://www.google.com/maps?q=${location.lat},${location.lng}`
      : '';

    const deliveryInfo =
      formData.deliveryType === 'delivery'
        ? `\n\n📍 *Endereço de Entrega:*\n${formData.address}, ${formData.number}\n${formData.reference ? `Referência: ${formData.reference}` : ''}${locationInfo}`
        : '\n\n🏪 *Retirada no local*';

    const message = `🍔 *Novo Pedido - Grill Central*\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `📱 *Telefone:* ${formData.phone}\n` +
      `${deliveryInfo}\n\n` +
      `🛒 *Itens do Pedido:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${total.toFixed(2)}*\n` +
      `${formData.observations ? `\n📝 *Observações:* ${formData.observations}` : ''}`;

    const whatsappUrl = `https://wa.me/5548988362576?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    clearCart();
    toast.success('Pedido enviado! Aguarde o retorno pelo WhatsApp.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder="(00) 00000-0000"
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
                  <Label htmlFor="number">Número da casa</Label>
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
              
              {/* Botão Enviar Localização */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={getLocation}
                  disabled={loadingLocation}
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {loadingLocation ? 'Obtendo localização...' : location ? '✅ Localização capturada' : 'Enviar Localização'}
                </Button>
                {location && (
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

          {/* Resumo */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex justify-between text-xl font-bold mb-4">
              <span>Subtotal:</span>
              <span className="text-yellow-500">R$ {total.toFixed(2)}</span>
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg py-6">
              Enviar Pedido via WhatsApp
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
