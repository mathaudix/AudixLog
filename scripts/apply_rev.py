import json, pathlib, sys

root = pathlib.Path(sys.argv[1])
# (arquivo, antes, depois) - só texto exibido, nunca chaves de i18n
R = [
    ("src/i18n/pt.ts", "Atualizado com sucesso!", "Atualizado com sucesso."),
    ("src/i18n/pt.ts", "Nota registrada!", "Nota registrada."),
    ("src/i18n/pt.ts", "Registro excluído!", "Registro excluído."),
    ("src/i18n/pt.ts", "Nota expedida!", "Nota expedida."),
    ("src/i18n/pt.ts", "Planilha exportada com sucesso!", "Planilha exportada com sucesso."),
    ("src/i18n/pt.ts", "data indisponível", "Data indisponível"),
    ("src/i18n/pt.ts", "Padrão 0.", "Padrão: 0."),
    ("src/i18n/pt.ts", "Padrão 2%.", "Padrão: 2%."),
    ("src/i18n/pt.ts", "0 desliga.", "Use 0 para desligar."),
    ("src/i18n/pt.ts", "CNPJ deve ter 14 dígitos e filial deve ser informada.", "CNPJ deve ter 14 dígitos e a filial deve ser informada."),
    ("src/i18n/pt.ts", "Ajuste NF", "Ajuste de NF"),
    ("src/i18n/pt.ts", "Ajuste só se a impressão sair cortada ou deslocada. Os valores valem neste computador.", "Ajuste somente se a impressão sair cortada ou deslocada. Os valores valem apenas neste computador."),
]

log = []
for f, old, new in R:
    p = root / f
    s = p.read_text(encoding="utf8")
    n = s.count(old)
    if n and old != new:
        p.write_text(s.replace(old, new), encoding="utf8")
    log.append({"arquivo": f, "antes": old, "depois": new, "ocorrencias": n})

out = root / "tmp" / "rev_log.json"
out.write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf8")
print(sum(1 for x in log if x["ocorrencias"] and x["antes"] != x["depois"]), "alteradas;", [x["antes"][:20] for x in log if not x["ocorrencias"]], "sem ocorrencia")
