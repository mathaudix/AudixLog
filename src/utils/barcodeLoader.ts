import type JsBarcodeType from 'jsbarcode';

type JsBarcodeFn = typeof JsBarcodeType;
let loaded: JsBarcodeFn | null = null;
let loading: Promise<JsBarcodeFn> | null = null;

/** Carrega o jsbarcode uma unica vez (import dinamico). */
export function loadJsBarcode(): Promise<JsBarcodeFn> {
  if (loaded) return Promise.resolve(loaded);
  loading ??= import('jsbarcode').then(module => { loaded = module.default; return loaded; });
  return loading;
}

/** Versao sincrona: retorna null ate o modulo ser carregado. */
export function getJsBarcode(): JsBarcodeFn | null {
  return loaded;
}
