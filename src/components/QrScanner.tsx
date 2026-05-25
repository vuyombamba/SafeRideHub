import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onResult: (text: string) => void;
  onError?: (err: string) => void;
}

export function QrScanner({ onResult, onError }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const id = `qr-reader-${Math.random().toString(36).slice(2, 8)}`;
    el.id = id;

    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().catch(() => undefined).finally(() => onResultRef.current(decoded));
        },
        () => {} // ignore per-frame decode failures
      )
      .catch((err) => onError?.(err?.message ?? String(err)));

    return () => {
      stopped = true;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => undefined);
      }
    };
  }, [onError]);

  return <div ref={containerRef} className="w-full aspect-square rounded-2xl overflow-hidden bg-black" />;
}
