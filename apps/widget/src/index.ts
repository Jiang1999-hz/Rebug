import { capturePageScreenshot } from './capture';
import { renderWidget, type WidgetPosition, type WidgetSeverity, type WidgetState } from './form';

type WidgetConfig = {
  apiKey: string;
  apiBaseUrl?: string;
  position?: WidgetPosition;
};

declare global {
  interface Window {
    BugWidget?: Partial<WidgetConfig>;
    __BUG_WIDGET_MOUNTED__?: boolean;
  }
}

const currentScript = document.currentScript as HTMLScriptElement | null;
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxUploadBytes = 5 * 1024 * 1024;

function getDefaultConfig(): WidgetConfig | null {
  const config = window.BugWidget;

  if (!config?.apiKey) {
    console.warn('BugWidget: window.BugWidget.apiKey is required.');
    return null;
  }

  let inferredBaseUrl = window.location.origin;

  if (currentScript?.src) {
    inferredBaseUrl = new URL(currentScript.src).origin;
  }

  return {
    apiKey: config.apiKey,
    apiBaseUrl: config.apiBaseUrl ?? inferredBaseUrl,
    position: config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right'
  };
}

function createInitialState(position: WidgetPosition): WidgetState {
  return {
    open: false,
    status: 'idle',
    title: '',
    description: '',
    severity: 'MEDIUM',
    files: [],
    email: '',
    error: '',
    captureBusy: false,
    position
  };
}

function validateFile(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error('Only PNG, JPG, or WEBP screenshots are allowed.');
  }

  if (file.size > maxUploadBytes) {
    throw new Error(`${file.name} is larger than 5MB.`);
  }
}

async function uploadFile(file: File, config: WidgetConfig) {
  validateFile(file);

  try {
    const { upload } = await import('@vercel/blob/client');
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: `${config.apiBaseUrl}/api/upload/client`,
      clientPayload: JSON.stringify({
        apiKey: config.apiKey
      }),
      multipart: true
    });

    return blob.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (
      !message.includes('BLOB_NOT_CONFIGURED') &&
      !message.includes('Vercel Blob is not configured') &&
      !message.includes('Cannot find module') &&
      !message.includes('404')
    ) {
      // Direct upload exists in production for files larger than the Vercel function body limit.
      // If it fails for a real auth or request issue, surface that error instead of masking it.
      throw error;
    }
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${config.apiBaseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'X-API-Key': config.apiKey
    },
    body: formData
  });

  const payload = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? 'Screenshot upload failed.');
  }

  return payload.url;
}

async function submitBug(state: WidgetState, config: WidgetConfig) {
  const screenshotUrls: string[] = [];

  for (const file of state.files) {
    const url = await uploadFile(file, config);
    screenshotUrls.push(url);
  }

  const response = await fetch(`${config.apiBaseUrl}/api/bugs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey
    },
    body: JSON.stringify({
      title: state.title.trim(),
      description: state.description.trim(),
      severity: state.severity,
      screenshots: screenshotUrls,
      pageUrl: window.location.href,
      userAgent: window.navigator.userAgent,
      contactEmail: state.email.trim() || undefined
    })
  });

  const payload = (await response.json()) as { referenceId?: number; error?: string };

  if (!response.ok || !payload.referenceId) {
    throw new Error(payload.error ?? 'Bug submission failed.');
  }

  return payload.referenceId;
}

function mountWidget() {
  if (window.__BUG_WIDGET_MOUNTED__) {
    return;
  }

  const config = getDefaultConfig();

  if (!config) {
    return;
  }

  const widgetConfig = config;

  if (!document.body) {
    window.addEventListener('DOMContentLoaded', mountWidget, { once: true });
    return;
  }

  window.__BUG_WIDGET_MOUNTED__ = true;

  const host = document.createElement('div');
  host.id = 'bug-feedback-widget-host';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  let state = createInitialState(widgetConfig.position ?? 'bottom-right');

  function render() {
    renderWidget(shadowRoot, state, {
      onToggle() {
        if (state.open) {
          state = { ...state, open: false, error: '' };
        } else if (state.status === 'success') {
          state = { ...createInitialState(state.position), open: true };
        } else {
          state = { ...state, open: true, error: '' };
        }
        render();
      },
      onClose() {
        if (state.status === 'success') {
          state = createInitialState(state.position);
        } else {
          state = { ...state, open: false, error: '' };
        }
        render();
      },
      onFieldChange(field, value) {
        state = {
          ...state,
          [field]: field === 'severity' ? (value as WidgetSeverity) : value,
          status: state.status === 'error' ? 'idle' : state.status,
          error: ''
        };
        render();
      },
      onFilesSelected(files) {
        try {
          files.forEach(validateFile);
          state = {
            ...state,
            files: [...state.files, ...files].slice(0, 4),
            status: state.status === 'error' ? 'idle' : state.status,
            error: ''
          };
        } catch (error) {
          state = {
            ...state,
            status: 'error',
            error: error instanceof Error ? error.message : 'Invalid screenshot.'
          };
        }
        render();
      },
      async onCapture() {
        try {
          state = { ...state, captureBusy: true, error: '', status: state.status === 'error' ? 'idle' : state.status };
          render();
          const file = await capturePageScreenshot(host);
          validateFile(file);
          state = { ...state, captureBusy: false, files: [...state.files, file].slice(0, 4) };
        } catch (error) {
          state = {
            ...state,
            captureBusy: false,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unable to capture this page.'
          };
        }
        render();
      },
      async onSubmit() {
        if (!state.title.trim()) {
          state = {
            ...state,
            status: 'error',
            error: 'Please add a short title before submitting.',
            open: true
          };
          render();
          return;
        }

        if (state.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
          state = {
            ...state,
            status: 'error',
            error: 'Please enter a valid email address or leave the field blank.'
          };
          render();
          return;
        }

        try {
          state = { ...state, status: 'submitting', error: '' };
          render();
          const referenceId = await submitBug(state, widgetConfig);
          state = {
            ...createInitialState(state.position),
            open: true,
            status: 'success',
            referenceId
          };
        } catch (error) {
          state = {
            ...state,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to submit. Try again.',
            open: true
          };
        }
        render();
      }
    });
  }

  render();
}

mountWidget();
