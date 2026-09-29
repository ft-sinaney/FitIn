// Barcode scanning with html5-qrcode (uses the phone's native detector when available).
const LIB = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
let loading = null;

function loadLib() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = resolve;
      s.onerror = () => { loading = null; reject(new Error('Could not load the scanner. Check your internet connection.')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

function makeReader(elId) {
  const F = window.Html5QrcodeSupportedFormats;
  return new window.Html5Qrcode(elId, {
    verbose: false,
    formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128],
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  });
}

/** Start the camera in element #elId. Resolves to a stop() function. */
export async function startScanner(elId, onCode) {
  if (!window.isSecureContext) throw new Error('The camera needs HTTPS. It works once deployed on Netlify or Vercel.');
  await loadLib();
  const reader = makeReader(elId);
  let done = false;
  const stop = async () => {
    try { if (reader.isScanning) await reader.stop(); reader.clear(); } catch { /* already stopped */ }
  };
  await reader.start(
    { facingMode: 'environment' },
    {
      fps: 12,
      qrbox: (w, h) => ({ width: Math.round(Math.min(w * 0.85, 340)), height: Math.round(Math.min(h * 0.5, 170)) }),
    },
    (text) => {
      if (done) return;
      done = true;
      if (navigator.vibrate) navigator.vibrate(60);
      stop().then(() => onCode(text));
    },
    () => {},
  );
  return stop;
}

/** Read a barcode from a photo instead of the live camera. */
export async function scanImage(elId, file) {
  await loadLib();
  const reader = makeReader(elId);
  try {
    return await reader.scanFile(file, false);
  } finally {
    try { reader.clear(); } catch { /* ignore */ }
  }
}
