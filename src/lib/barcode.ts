export async function scanBarcode(): Promise<string | null> {
  if (!('BarcodeDetector' in window)) {
    throw new Error('BarcodeDetector not supported');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 640, height: 480 },
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    const detector = new (window as unknown as { BarcodeDetector: new (o?: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'codabar', 'qr_code'],
    });

    const timeout = 15000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          stream.getTracks().forEach(t => t.stop());
          video.remove();
          return codes[0].rawValue;
        }
      } catch { return undefined; }
      await new Promise(r => setTimeout(r, 300));
    }

    stream.getTracks().forEach(t => t.stop());
    video.remove();
    return null;
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : 'Camera access denied');
  }
}

export async function scanBarcodeWithFallback(): Promise<string | null> {
  try {
    return await scanBarcode();
  } catch {
    return null;
  }
}
