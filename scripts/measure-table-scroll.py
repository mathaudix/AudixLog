import json, sys
from playwright.sync_api import sync_playwright

# Renderiza a tabela de notas isolada (mesmas regras CSS) com fornecedor longo e mede a largura.
html = """<!doctype html><html><head><meta charset="utf-8">
<style>body{margin:0;font-family:sans-serif;font-size:14px}</style>
<link rel="stylesheet" href="file://%s"><link rel="stylesheet" href="file://%s">
</head><body><div id="host" style="padding:16px"><div class="nf-table-shell"><div class="nf-table-scroll"><table class="nf-table">
<thead><tr><th class="nf-check-cell"></th><th>Status</th><th>NF</th><th>Fornecedor</th><th class="text-right">Vol.</th><th class="text-right">Peso</th><th class="text-right">Valor</th><th class="text-right">Ações</th></tr></thead>
<tbody><tr class="nf-desktop-row"><td class="nf-check-cell"><input type="checkbox"></td><td><span>Recebido</span></td>
<td><button class="nf-number-button"><span class="nf-number">123456789</span><span class="nf-date">01/11/2026</span></button></td>
<td><div class="nf-supplier">FORNECEDOR EXTREMAMENTE LONGO LTDA INDUSTRIA E COMERCIO DE PRODUTOS ELETRONICOS DO BRASIL</div><span class="nf-branch-badge">Filial Campo Grande Centro Norte</span></td>
<td class="nf-numeric">12</td><td class="nf-numeric">1.234,50 kg</td><td class="nf-numeric nf-money">R$ 99.999,99</td>
<td class="nf-actions-cell"><div class="nf-actions"><button>T</button><button>L</button><button>X</button><button>I</button></div></td></tr></tbody></table></div></div></div></body></html>"""

css_table = "%s/src/components/nf/nf-table.css"
css_fit = "%s/src/components/nf/nf-table-fit.css"
root = sys.argv[1]
page_html = html % (css_table % root, css_fit % root)
path = root + "/tmp_table.html"
open(path, "w", encoding="utf-8").write(page_html)
css_hack = page_html.replace("file://" + css_table % root, "file://" + css_table % root)

results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [375, 1280, 1366, 1440, 1920]:
        page = browser.new_page(viewport={"width": width, "height": 800})
        page.goto("file://" + path)
        m = page.evaluate("""() => {
          const s = document.querySelector('.nf-table-scroll');
          const btns = [...document.querySelectorAll('.nf-actions button')].map(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.right <= s.getBoundingClientRect().right + 1; });
          return { scroll: s.scrollWidth, client: s.clientWidth, actionsVisible: btns.every(Boolean) };
        }""")
        results.append({"width": width, **m, "ok": m["scroll"] <= m["client"]})
        page.close()
    browser.close()
print(json.dumps(results, ensure_ascii=False))
