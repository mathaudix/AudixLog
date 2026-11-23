// Falha se houver componente (nome com maiuscula) declarado dentro de outra função,
// o que faz o React remontar a árvore e perder o foco dos campos a cada render.
// Simpler regex-based check since TypeScript 7 changed its API.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = decodeURIComponent(new URL('../', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, '') + 'src/');
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
}
walk(root);

const problems = [];

// Pattern to detect component declarations inside functions
// This is a simplified check - looks for: function X() { ... function Y() ... } or const Y = () => ...
const componentInsideFunctionPattern = /function\s+[A-Z][a-zA-Z]*\s*\([^)]*\)\s*\{[^}]*?(?:function|const|let|var)\s+[A-Z][a-zA-Z]*\s*[=:]/g;

for (const file of files) {
  const text = readFileSync(file, 'utf8');

  // Check for nested component patterns
  let match;
  while ((match = componentInsideFunctionPattern.exec(text)) !== null) {
    const line = text.substring(0, match.index).split('\n').length;
    problems.push(`${relative(root, file)}:${line} possível componente aninhado detectado: ${match[0].substring(0, 80)}`);
  }

  // Also check for arrow function components inside other functions
  const arrowInsideFnPattern = /(?:function|const|let|var)\s+[a-z][a-zA-Z]*\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*?(?:const|let|var)\s+[A-Z][a-zA-Z]*\s*=\s*(?:\([^)]*\)\s*=>|function)/g;
  while ((match = arrowInsideFnPattern.exec(text)) !== null) {
    const line = text.substring(0, match.index).split('\n').length;
    problems.push(`${relative(root, file)}:${line} possível componente arrow aninhado: ${match[0].substring(0, 80)}`);
  }
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