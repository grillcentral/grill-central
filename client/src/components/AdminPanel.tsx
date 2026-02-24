import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2, Trash2, CheckCircle, Cloud } from 'lucide-react';
import { products } from '@/data/products';
import { toast } from 'sonner';

interface AdminPanelProps {
  onClose: () => void;
}

const ADMIN_PASSWORD = '@grill2025';
const IMGBB_API_KEY = '168636329f99c2f019368c3c7d628d83';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Helpers para localStorage de URLs (não mais base64)
function getStoredImages(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('productImages') || '{}');
  } catch {
    return {};
  }
}

function saveImageUrl(productId: string, url: string) {
  const stored = getStoredImages();
  stored[productId] = url;
  localStorage.setItem('productImages', JSON.stringify(stored));
  window.dispatchEvent(new Event('productImagesUpdated'));
}

function removeImageUrl(productId: string) {
  const stored = getStoredImages();
  delete stored[productId];
  localStorage.setItem('productImages', JSON.stringify(stored));
  window.dispatchEvent(new Event('productImagesUpdated'));
}

// Redimensiona imagem e retorna base64
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
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível'));
        ctx.drawImage(img, 0, 0, width, height);
        // Remover o prefixo "data:image/jpeg;base64,"
        const base64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
        resolve(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Faz upload para ImgBB e retorna a URL pública
async function uploadToImgBB(base64: string, name: string): Promise<string> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64);
  formData.append('name', name);

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Erro no ImgBB');
  }

  return data.data.display_url as string;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>(getStoredImages);

  const refreshImages = () => {
    setImages(getStoredImages());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('✅ Login realizado!');
    } else {
      toast.error('❌ Senha incorreta!');
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string,
    productName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 32 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máximo 32MB.');
      return;
    }

    setUploadingId(productId);

    try {
      toast.info('📤 Redimensionando e enviando para a nuvem...');

      const base64 = await resizeImage(file);
      const url = await uploadToImgBB(base64, productName);

      saveImageUrl(productId, url);
      refreshImages();

      toast.success('✅ Foto salva na nuvem! Aparece em todos os dispositivos.');
    } catch (err) {
      console.error(err);
      toast.error('❌ Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploadingId(null);
      // Limpar o input para permitir re-upload do mesmo arquivo
      e.target.value = '';
    }
  };

  const handleRemove = (productId: string) => {
    removeImageUrl(productId);
    refreshImages();
    toast.success('🗑️ Foto removida!');
  };

  // ── Tela de login ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🔐 Painel Admin</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ── Painel autenticado ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">📸 Gerenciar Fotos</h2>
            <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
              <Cloud className="w-4 h-4 text-blue-400" />
              Fotos salvas na nuvem — aparecem em todos os dispositivos
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Aviso informativo */}
        <div className="mx-6 mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Como usar:</strong> Clique em <strong>"Adicionar Foto"</strong> em cada produto,
            escolha a foto do seu celular/computador (até 32MB, suporta 4K) e ela será enviada
            automaticamente para a nuvem.
          </p>
        </div>

        {/* Grade de produtos */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => {
            const currentImage = images[product.id];
            const isUploading = uploadingId === product.id;

            return (
              <Card key={product.id} className="bg-zinc-800 border-zinc-700 p-4">
                {/* Nome e preço */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sm">{product.name}</h3>
                    <p className="text-yellow-500 text-sm font-semibold">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  {currentImage && (
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-3 h-3" /> Na nuvem
                    </span>
                  )}
                </div>

                {/* Preview da foto atual */}
                {currentImage && (
                  <div className="mb-3 rounded overflow-hidden border border-zinc-600">
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-36 object-cover"
                    />
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-2">
                  {/* Input file oculto */}
                  <Input
                    type="file"
                    accept="image/*"
                    id={`upload-${product.id}`}
                    className="hidden"
                    disabled={isUploading}
                    onChange={e => handleFileChange(e, product.id, product.name)}
                  />

                  {/* Label estilizado como botão de upload */}
                  <Label
                    htmlFor={`upload-${product.id}`}
                    className={`flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                      isUploading
                        ? 'bg-zinc-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {currentImage ? 'Trocar Foto' : 'Adicionar Foto'}
                      </>
                    )}
                  </Label>

                  {/* Botão remover (só aparece se há foto) */}
                  {currentImage && !isUploading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(product.id)}
                      className="px-3 border-zinc-600 hover:bg-red-950 hover:border-red-800"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="border-t border-zinc-800 p-4 text-center">
          <p className="text-xs text-zinc-500">
            🔒 Painel protegido por senha · Fotos hospedadas no ImgBB
          </p>
        </div>
      </Card>
    </div>
  );
}
