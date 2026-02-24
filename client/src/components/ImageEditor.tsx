import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, RotateCw, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedImageBlob: Blob) => void;
  onCancel: () => void;
}

type AspectRatio = '3:2' | '16:9' | '4:3' | 'free';

export default function ImageEditor({ imageFile, onSave, onCancel }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:2');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      drawImage();
    }
  }, [imageSrc, zoom, brightness, contrast, rotation, aspectRatio]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageSrc) return;

    const img = new Image();
    img.onload = () => {
      // Definir dimensões do canvas baseado no aspect ratio
      let canvasWidth = 800;
      let canvasHeight = 600;

      switch (aspectRatio) {
        case '3:2':
          canvasWidth = 800;
          canvasHeight = 533;
          break;
        case '16:9':
          canvasWidth = 800;
          canvasHeight = 450;
          break;
        case '4:3':
          canvasWidth = 800;
          canvasHeight = 600;
          break;
        case 'free':
          canvasWidth = img.width;
          canvasHeight = img.height;
          break;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Limpar canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Aplicar filtros
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Calcular posição e escala com zoom
      const scale = zoom / 100;
      const scaledWidth = canvasWidth * scale;
      const scaledHeight = canvasHeight * scale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;

      // Salvar contexto
      ctx.save();

      // Aplicar rotação
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

      // Desenhar imagem
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Restaurar contexto
      ctx.restore();
    };
    img.src = imageSrc;
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const aspectRatioButtons: { value: AspectRatio; label: string }[] = [
    { value: '3:2', label: '3:2 (Padrão)' },
    { value: '16:9', label: '16:9 (Largo)' },
    { value: '4:3', label: '4:3 (Quadrado)' },
    { value: 'free', label: 'Livre' },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🖼️ Editor de Imagem
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview Canvas */}
          <div className="flex justify-center bg-zinc-950 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-zinc-700 rounded"
            />
          </div>

          {/* Controles */}
          <div className="space-y-6">
            {/* Aspect Ratio */}
            <div>
              <label className="text-sm font-semibold mb-3 block">📐 Formato</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {aspectRatioButtons.map((ar) => (
                  <Button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    variant={aspectRatio === ar.value ? 'default' : 'outline'}
                    className={aspectRatio === ar.value ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {ar.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                🔍 Zoom: {zoom}%
              </label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={50}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            {/* Brilho */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                ☀️ Brilho: {brightness}%
              </label>
              <Slider
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                min={50}
                max={150}
                step={5}
                className="w-full"
              />
            </div>

            {/* Contraste */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                🎨 Contraste: {contrast}%
              </label>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                min={50}
                max={150}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <Button
              onClick={handleRotate}
              variant="outline"
              className="flex-1"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Rotacionar 90°
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              Resetar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
