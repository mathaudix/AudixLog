"""Monta preview_logo_login_v79.png: login 1440x900 claro em cima; faixa com as 3 opcoes de fonte embaixo."""
import sys
from PIL import Image, ImageDraw

login = Image.open('tmp/login/login.light.png').convert('RGB')
fonts = Image.open('tmp/login/fonts.png').convert('RGB')
W = max(login.width, fonts.width) + 40
H = login.height + fonts.height + 80
canvas = Image.new('RGB', (W, H), (241, 245, 249))
d = ImageDraw.Draw(canvas)
d.text((20, 12), 'Tela de login (Sora 700 aplicada no wordmark)', fill=(30, 41, 59))
canvas.paste(login, (20, 36))
y = 36 + login.height + 20
d.text((20, y), 'Comparacao de fontes do wordmark (sobre navy, so para preview)', fill=(30, 41, 59))
canvas.paste(fonts, (20, y + 24))
out = sys.argv[1] if len(sys.argv) > 1 else 'preview_logo_login_v79.png'
canvas.save(out)
print(out, canvas.size)
