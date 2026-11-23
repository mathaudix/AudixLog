export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler imagem'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') { reject(new Error('Imagem inválida')); return; }
      const image = new Image(); image.onerror = () => reject(new Error('Não foi possível decodificar imagem'));
      image.onload = () => {
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d'); if (!context) { reject(new Error('Canvas indisponível')); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
