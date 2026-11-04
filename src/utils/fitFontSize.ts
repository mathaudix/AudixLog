/** Calcula um tamanho de fonte que cabe na caixa, usando a medição real do navegador. */
export function fitFontSize(text: string, requested: number, width: number, height: number, family = 'Arial', weight = 'normal', min = 5): number {
  const base = Math.max(min, requested);
  if (typeof document === 'undefined' || width <= 0 || height <= 0) return base;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return base;
  const lines = text.split('\n');
  let size = base;
  while (size > min) {
    context.font = `${weight} ${size}px ${family}`;
    const widest = Math.max(0, ...lines.map(line => context.measureText(line).width));
    if (widest <= width && lines.length * size * 1.1 <= height) break;
    size -= 0.5;
  }
  return Math.max(min, size);
}
