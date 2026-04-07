type Html2CanvasFn = (target: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
  }
}

let loaderPromise: Promise<Html2CanvasFn> | null = null;

function loadHtml2Canvas() {
  if (window.html2canvas) {
    return Promise.resolve(window.html2canvas);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    script.onload = () => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
      } else {
        reject(new Error('html2canvas loaded but did not initialize.'));
      }
    };
    script.onerror = () => reject(new Error('Unable to load the screenshot helper.'));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function capturePageScreenshot(hideTarget?: HTMLElement) {
  const html2canvas = await loadHtml2Canvas();
  const previousDisplay = hideTarget?.style.display ?? '';

  if (hideTarget) {
    hideTarget.style.display = 'none';
  }

  try {
    const canvas = await html2canvas(document.body, {
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error('Screenshot capture failed.'));
        }
      }, 'image/png');
    });

    return new File([blob], `bug-capture-${Date.now()}.png`, { type: 'image/png' });
  } finally {
    if (hideTarget) {
      hideTarget.style.display = previousDisplay;
    }
  }
}
