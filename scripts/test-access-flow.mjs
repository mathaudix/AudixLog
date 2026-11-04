import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const bundle = await build({
  stdin: { contents: "export { accessState } from './src/services/accessState.ts'; export { authErrorKey } from './src/services/authErrors.ts';", resolveDir: root.pathname, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'neutral', write: false,
});
const code = bundle.outputFiles[0].text;
const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const { accessState, authErrorKey } = await import(dataUrl);

// Estado de acesso
assert.equal(accessState({ emailVerified: true, profile: null }), 'semPerfil');
assert.equal(accessState({ emailVerified: false, profile: { ativo: false, status: 'pendente' } }), 'naoVerificado');
assert.equal(accessState({ emailVerified: true, profile: { ativo: false, status: 'pendente' } }), 'pendente');
assert.equal(accessState({ emailVerified: true, profile: { ativo: true, status: 'ativo' } }), 'ativo');
assert.equal(accessState({ emailVerified: true, profile: { ativo: false, status: 'desativado' } }), 'desativado');
assert.equal(accessState({ emailVerified: false, profile: { ativo: false, status: 'desativado' } }), 'desativado');
// Perfil antigo (sem status): segue só o flag ativo, sem exigir e-mail verificado
assert.equal(accessState({ emailVerified: false, profile: { ativo: true } }), 'ativo');
assert.equal(accessState({ emailVerified: false, profile: { ativo: false } }), 'desativado');

// Mapeamento de erros
assert.equal(authErrorKey('auth/email-already-in-use'), 'access.errEmailInUse');
assert.equal(authErrorKey('auth/weak-password'), 'access.errWeakPassword');
assert.equal(authErrorKey('auth/invalid-email'), 'access.errInvalidEmail');
assert.equal(authErrorKey('auth/too-many-requests'), 'access.errTooMany');
assert.equal(authErrorKey('auth/invalid-credential'), 'access.errInvalidCredential');
assert.equal(authErrorKey('auth/network-request-failed'), 'access.errNetwork');
assert.equal(authErrorKey('auth/outro'), 'access.errGeneric');
assert.equal(authErrorKey(undefined), 'access.errGeneric');

// Regras: autocadastro só cria perfil pendente do próprio uid; sem auto-promoção; perfis antigos preservados.
const rules = await readFile(new URL('firestore.rules', root), 'utf8');
assert.match(rules, /request\.auth\.uid == uid[\s\S]*?ativo == false/, 'create próprio exige ativo == false');
assert.match(rules, /role == 'operador'/, 'create próprio exige role operador');
assert.match(rules, /status == 'pendente'/, 'create próprio exige status pendente');
assert.match(rules, /email == request\.auth\.token\.email/, 'create próprio exige o e-mail do token');
assert.match(rules, /'status' in userDoc\(appId\)\.data/, 'perfil antigo sem status segue só o flag ativo');
assert.match(rules, /email_verified == true/, 'cadastros novos exigem e-mail verificado');

console.log('Access flow assertions passed: estados, erros de autenticação e regras.');
