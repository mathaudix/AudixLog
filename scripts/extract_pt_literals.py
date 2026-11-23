import re, pathlib, sys

root = pathlib.Path(sys.argv[1])
out = []

# 1) Valores de src/i18n/pt.ts (texto exibido, sem chaves)
pt = (root / "src/i18n/pt.ts").read_text(encoding="utf8")
for m in re.finditer(r"'([^'\\\n]{2,})'", pt):
    out.append(("src/i18n/pt.ts", m.group(1)))

# 2) Strings JSX, atributos e argumentos de toast/erro em componentes
pt_hint = re.compile(r"[ãõçéêíóúâô]|\b(não|nao|para|sem|nota|filial|volume|peso|valor|salvar|erro|excluir|cancelar|confirmar|usuário|usuario|dados|texto|chave|número|numero|fornecedor|responsável|responsavel)\b", re.I)
attr = re.compile(r'(placeholder|title|aria-label|alt|label)="([^"{}]{2,})"')
jsx = re.compile(r">([^<>{}\n]{3,})<")
toast = re.compile(r"text:\s*'([^'\n]{3,})'|text:\s*`([^`\n]{3,})`|throw new Error\('([^'\n]{3,})'\)|message:\s*'([^'\n]{3,})'|message:\s*`([^`\n]{3,})`")
for path in sorted((root / "src").rglob("*.tsx")) + sorted((root / "src").rglob("*.ts")):
    rel = str(path.relative_to(root))
    if rel.startswith("src/i18n/"):
        continue
    for i, line in enumerate(path.read_text(encoding="utf8").splitlines(), 1):
        for m in attr.finditer(line):
            out.append((f"{rel}:{i}", m.group(2)))
        for m in jsx.finditer(line):
            out.append((f"{rel}:{i}", m.group(1).strip()))
        for m in toast.finditer(line):
            text = next(g for g in m.groups() if g)
            out.append((f"{rel}:{i}", text))

# 3) index.html e README.md
for name in ["index.html", "README.md"]:
    p = root / name
    if p.exists():
        for i, line in enumerate(p.read_text(encoding="utf8").splitlines(), 1):
            if line.strip():
                out.append((f"{name}:{i}", line.strip()[:200]))

# Filtra: só o que parece português visível (ignora identificadores, classes, código)
seen, rows = set(), []
for where, text in out:
    t = text.strip()
    if not t or t in seen:
        continue
    if re.search(r"[{}();=<>]|=>|\.\w+\(|\bclassName\b|\bdata-|^[a-z0-9_\-\.]+$", t):
        continue
    if not (pt_hint.search(t) or re.search(r"[A-ZÀ-ÿ][a-zà-ÿ]+\s+\w+", t)):
        continue
    seen.add(t)
    rows.append((where, t))

tmp = root / "tmp"
tmp.mkdir(exist_ok=True)
with open(tmp / "literals.tsv", "w", encoding="utf8") as f:
    for idx, (where, text) in enumerate(rows, 1):
        f.write(f"{idx}\t{where}\t{text}\n")
print(len(rows))
