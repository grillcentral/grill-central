import { useState, useEffect } from 'react';

export function useProductImages(): Record<string, string> {
  const [images, setImages] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('productImages') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const loadImages = () => {
      try {
        const saved = localStorage.getItem('productImages');
        setImages(saved ? JSON.parse(saved) : {});
      } catch (e) {
        console.error('Erro ao carregar imagens:', e);
      }
    };

    // Escuta mudanças feitas em outras abas do navegador
    window.addEventListener('storage', loadImages);
    // Escuta evento disparado pelo AdminPanel após upload
    window.addEventListener('productImagesUpdated', loadImages);

    return () => {
      window.removeEventListener('storage', loadImages);
      window.removeEventListener('productImagesUpdated', loadImages);
    };
  }, []);

  return images;
}
