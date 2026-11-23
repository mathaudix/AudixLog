"""Monta preview_etapa2_v79.png: linha 1 = claro (Usuarios | Historico), linha 2 = escuro."""
import sys
from PIL import Image, ImageDraw

base = 'tmp/people'
out = sys.argv[1] if len(sys.argv) > 1 else 'preview_etapa2_v79.png'
GAP = 24
PAD = 20
BG = (241, 245, 249)

def load(name):
    return Image.open(f'{base}/{name}').convert('RGB')

rows = []
for theme in ('light', 'dark'):
    u = load(f'users.{theme}.png')
    h = load(f'history.{theme}.png')
    H = max(u.height, h.height)
    row = Image.new('RGB', (u.width + GAP + h.width, H), (15, 23, 42) if theme == 'dark' else (255, 255, 255))
    row.paste(u, (0, 0))
    row.paste(h, (u.width + GAP, 0))
    rows.append(row)

W = max(r.width for r in rows) + PAD * 2
Ht = sum(r.height for r in rows) + GAP * (len(rows) - 1) + PAD * 2 + 28
canvas = Image.new('RGB', (W, Ht), BG)
d = ImageDraw.Draw(canvas)
d.text((PAD, 6), 'Claro (topo) · Escuro (base)  |  esquerda: Usuarios, direita: Historico', fill=(30, 41, 59))
y = PAD + 22
for r in rows:
    canvas.paste(r, (PAD, y))
    y += r.height + GAP
canvas.save(out)
print(out, canvas.size)
