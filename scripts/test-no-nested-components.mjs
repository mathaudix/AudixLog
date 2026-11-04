// Falha se houver componente (nome com maiuscula) declarado dentro de outra função,
// o que faz o React remontar a árvore e perder o foco dos campos a cada render.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = new URL('../src/', import.meta.url).pathname;
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
}
walk(root);

const isFnNode = node => ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node);
const problems = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node, insideFn) => {
    let name = null;
    if (ts.isFunctionDeclaration(node) && node.name) name = node.name.text;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = node.initializer;
      const isComponentValue = isFnNode(init) || (ts.isCallExpression(init) && ts.isIdentifier(init.expression) && ['memo', 'forwardRef'].includes(init.expression.text));
      if (isComponentValue) name = node.name.text;
    }
    if (name && /^[A-Z]/.test(name) && insideFn) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      problems.push(`${relative(root, file)}:${line + 1} componente "${name}" declarado dentro de outra função`);
    }
    const nextInside = insideFn || isFnNode(node);
    ts.forEachChild(node, child => visit(child, nextInside));
  };
  visit(sf, false);
}

// O efeito de foco do Modal não pode depender de onClose (identidade muda a cada render do pai).
const modal = readFileSync(join(root, 'components/ui/Modal.tsx'), 'utf8');
if (/\}, \[open, onClose\]\);/.test(modal)) {
  problems.push('components/ui/Modal.tsx: efeito de foco depende de onClose (o foco volta ao primeiro campo a cada tecla)');
}

if (problems.length) {
  console.error('Componentes aninhados encontrados:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`test-no-nested-components: ${files.length} arquivos .tsx verificados, OK`);
