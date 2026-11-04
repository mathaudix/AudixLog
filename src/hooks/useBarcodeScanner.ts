import { useCallback, useEffect, useRef, useState } from 'react';
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode';
export function useBarcodeScanner(onDecoded: (text: string) => void, onError: (message: string) => void) {
  const regionRef = useRef<HTMLDivElement>(null); const scannerRef = useRef<Html5QrcodeType | null>(null); const [scanning, setScanning] = useState(false);
  const stop = useCallback(async () => { const scanner = scannerRef.current; scannerRef.current = null; if (scanner) { try { if (scanner.isScanning) await scanner.stop(); await scanner.clear(); } catch { /* câmera já encerrada */ } } setScanning(false); }, []);
  const start = useCallback(async () => {
    if (!regionRef.current || scannerRef.current) return;
    try { const { Html5Qrcode } = await import('html5-qrcode'); const scanner = new Html5Qrcode(regionRef.current.id); scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: Math.min(350, window.innerWidth - 40), height: 110 } }, decoded => { void (async () => { try { await stop(); } catch { /* Scanner may already be stopped. */ } onDecoded(decoded); })(); }, () => undefined); setScanning(true);
    } catch { scannerRef.current = null; setScanning(false); onError('Erro ao acessar a câmera. Verifique as permissões do navegador.'); }
  }, [onDecoded, onError, stop]);
  useEffect(() => () => { void stop(); }, [stop]);
  return { regionRef, scanning, start, stop };
}
