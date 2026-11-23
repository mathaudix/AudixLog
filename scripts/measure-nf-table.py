import json, sys, pathlib
from playwright.sync_api import sync_playwright

# Renderiza a tabela de notas com o CSS real do projeto (nf-table.css + nf-table-fit.css).
root = pathlib.Path(sys.argv[1])
css = (root / "src/components/nf/nf-table.css").read_text(encoding="utf8") + "\n" + (root / "src/components/nf/nf-table-fit.css").read_text(encoding="utf8")
cols = ["col-check", "col-status", "col-data", "col-nf", "col-fornecedor", "col-vol", "col-peso", "col-valor", "col-acoes"]
head = "".join(f'<th class="{c}">{t}</th>' for c, t in zip(cols, ["", "Status", "Data", "NF", "Fornecedor", "Volumes", "Peso", "Valor", "Ações"]))
suppliers = ["ROZENDO VICENTE TEIXEIRA SITIO SAO MARCOS"] * 5 + ["A" * 80]
rows = ""
for i, sup in enumerate(suppliers):
    rows += (
        '<tr>'
        '<td class="col-check"><input type="checkbox"></td>'
        '<td class="col-status"><span>Pendente</span></td>'
        f'<td class="col-data">03/11/2026</td>'
        f'<td class="col-nf"><button class="nf-number-button"><span class="nf-number">{63900 + i}</span></button></td>'
        f'<td class="col-fornecedor"><div class="nf-supplier" title="{sup}">{sup}</div><span class="nf-branch-badge">Filial 03</span></td>'
        '<td class="nf-numeric col-vol">12</td>'
        '<td class="nf-numeric col-peso">99,13 kg</td>'
        '<td class="nf-numeric nf-money col-valor">R$ 1.234,56</td>'
        '<td class="nf-actions-cell col-acoes"><div class="nf-actions">'
        + "".join(f'<button aria-label="a{k}">x</button>' for k in range(4))
        + '</div></td></tr>'
    )
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
body{{margin:0;font-family:Arial,sans-serif;font-size:13px}}
.nf-table-shell{{width:100%}}
.nf-table-scroll{{width:100%}}
.nf-numeric{{text-align:right}}
.nf-actions{{display:flex}}
.nf-actions button{{min-width:28px;height:28px}}
{css}
</style></head><body><div class="nf-table-shell"><div class="nf-table-scroll" id="c"><table class="nf-table"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div></div></body></html>"""
out = root / "tmp" / "lista.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf8")

JS = """() => {
  const c = document.getElementById('c');
  const table = c.querySelector('table');
  const ths = [...table.querySelectorAll('thead th')];
  const rows = [...table.querySelectorAll('tbody tr')];
  const rect = e => e.getBoundingClientRect();
  // (b) sobreposição entre células vizinhas na mesma linha
  let overlap = 0;
  for (const tr of rows) {
    const tds = [...tr.children];
    for (let i = 0; i < tds.length - 1; i++) {
      if (rect(tds[i]).right > rect(tds[i + 1]).left + 0.5) overlap++;
    }
  }
  // (c) alinhamento x do cabeçalho com o corpo (mesma classe)
  let misaligned = 0;
  const cls = ths.map(th => th.className.split(' ').find(x => x.startsWith('col-')));
  cls.forEach(k => {
    if (!k) return;
    const h = rect(table.querySelector('thead th.' + k));
    const b = rect(table.querySelector('tbody tr td.' + k));
    if (Math.abs(h.left - b.left) > 1 || Math.abs(h.width - b.width) > 1) misaligned++;
  });
  // (d) nome inteiro sem reticências
  const sup = table.querySelector('tbody tr:first-child .nf-supplier');
  const fullName = sup.scrollWidth <= sup.clientWidth + 1;
  const dataCell = table.querySelector('tbody tr:first-child td.col-data');
  const dataFits = dataCell.scrollWidth <= dataCell.clientWidth + 1;
  const lastSup = table.querySelector('tbody tr:nth-child(6) td.col-fornecedor');
  const supText = lastSup.querySelector('.nf-supplier');
  const volStart = rect(table.querySelector('tbody tr:first-child td.col-vol')).left;
  const supEndText = supText.getBoundingClientRect().right;
  // (e) espaço entre fim da NF e início do fornecedor
  const nfEnd = rect(table.querySelector('tbody tr:first-child td.col-nf')).right;
  const supStart = rect(table.querySelector('tbody tr:first-child td.col-fornecedor')).left;
  // (f) botões de ação visíveis
  const btns = [...table.querySelectorAll('tbody tr:first-child .nf-actions button')];
  const visible = btns.every(b => { const r = rect(b); return r.width > 0 && r.right <= rect(c).right + 0.5; });
  return {
    scrollOk: c.scrollWidth <= c.clientWidth + 1,
    overlap, misaligned,
    dataFits, volGap: Math.round(volStart - rect(supText).right),
    fullName, gap: Math.round(supStart - nfEnd),
    actionsVisible: visible && btns.length === 4,
    tableWidth: Math.round(rect(table).width), containerWidth: c.clientWidth,
    headActions: Math.round(rect(table.querySelector('thead th.col-acoes')).right),
  };
}"""

results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for w in [1280, 1366, 1536, 1920]:
        page = browser.new_page(viewport={"width": w, "height": 600})
        page.goto(out.as_uri())
        r = page.evaluate(JS)
        r["width"] = w
        results.append(r)
        if w == 1536:
            page.screenshot(path=str(root / "preview_lista_1536.png"), full_page=True)
        page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False))
