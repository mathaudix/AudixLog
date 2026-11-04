"""Monta preview_etapa2_v78.png: linha 1 = claro (Configurações | Nota), linha 2 = escuro."""
import sys
from PIL import Image, ImageDraw

base = 'tmp/etapa2'
out = sys.argv[1] if len(sys.argv) > 1 else 'preview_etapa2_v78.png'
GAP = 24
PAD = 20
BG = (241, 245, 249)

def load(name):
    return Image.open(f'{base}/{name}').convert('RGB')

rows = []
for theme in ('light', 'dark'):
    s = load(f'settings.{theme}.png')
    n = load(f'nf.{theme}.png')
    h = max(s.height, n.height)
    w = s.width + GAP + n.width
    row = Image.new('RGB', (w, h), (15, 23, 42) if theme == 'dark' else (255, 255, 255))
    row.paste(s, (0, 0))
    row.paste(n, (s.width + GAP, 0))
    rows.append(row)

W = max(r.width for r in rows) + PAD * 2
H = sum(r.height for r in rows) + GAP * (len(rows) - 1) + PAD * 2 + 28
canvas = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(canvas)
draw.text((PAD, 6), 'Claro (topo) · Escuro (base)  |  esquerda: Configurações, direita: janela da nota', fill=(30, 41, 59))
y = PAD + 22
for r in rows:
    canvas.paste(r, (PAD, y))
    y += r.height + GAP
canvas.save(out)
print(out, canvas.size)
