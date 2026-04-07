import { widgetStyles } from './styles';

export type WidgetStatus = 'idle' | 'submitting' | 'success' | 'error';
export type WidgetSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WidgetPosition = 'bottom-right' | 'bottom-left';

export type WidgetState = {
  open: boolean;
  status: WidgetStatus;
  title: string;
  description: string;
  severity: WidgetSeverity;
  files: File[];
  email: string;
  error: string;
  referenceId?: number;
  captureBusy: boolean;
  position: WidgetPosition;
};

export type WidgetActions = {
  onToggle: () => void;
  onClose: () => void;
  onFieldChange: (field: 'title' | 'description' | 'severity' | 'email', value: string) => void;
  onFilesSelected: (files: File[]) => void;
  onSubmit: () => void;
  onCapture: () => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderWidget(root: ShadowRoot, state: WidgetState, actions: WidgetActions) {
  const disabled = state.status === 'submitting';
  const positionClass = state.position === 'bottom-left' ? 'bfw-shell--bottom-left' : 'bfw-shell--bottom-right';
  const fileList =
    state.files.length > 0
      ? `<ul class="bfw-file-list">${state.files
          .map((file) => `<li class="bfw-file-pill">${escapeHtml(file.name)}</li>`)
          .join('')}</ul>`
      : '';

  const panelMarkup = state.open
    ? state.status === 'success'
      ? `
        <div class="bfw-panel" role="dialog" aria-modal="false" aria-label="Bug report submitted">
          <section class="bfw-success">
            <div class="bfw-success__badge">OK</div>
            <div>
              <h2>Submitted successfully</h2>
              <p>Reference #${state.referenceId ?? ''}. Share this ID if the team needs more detail.</p>
            </div>
            <button class="bfw-secondary" data-action="close-success" type="button">Close</button>
          </section>
        </div>
      `
      : `
        <div class="bfw-panel" role="dialog" aria-modal="false" aria-label="Report a bug">
          <div class="bfw-header">
            <div>
              <h2>Report a bug</h2>
              <p>Share what happened on this page and the team will pick it up.</p>
            </div>
            <button class="bfw-close" data-action="close" type="button" aria-label="Close bug form">X</button>
          </div>
          <form class="bfw-form">
            ${
              state.status === 'error'
                ? `<div class="bfw-error">${escapeHtml(state.error || 'Failed to submit. Try again.')}</div>`
                : ''
            }
            <div class="bfw-field">
              <label for="bfw-title">Title</label>
              <input id="bfw-title" maxlength="160" name="title" placeholder="Short description of the bug" value="${escapeHtml(state.title)}" ${
                disabled ? 'disabled' : ''
              } />
            </div>
            <div class="bfw-field">
              <label for="bfw-description">Description</label>
              <textarea id="bfw-description" name="description" placeholder="What happened? Steps to reproduce?" ${
                disabled ? 'disabled' : ''
              }>${escapeHtml(state.description)}</textarea>
            </div>
            <div class="bfw-field">
              <label for="bfw-severity">Severity</label>
              <select id="bfw-severity" name="severity" ${disabled ? 'disabled' : ''}>
                <option value="CRITICAL" ${state.severity === 'CRITICAL' ? 'selected' : ''}>Critical</option>
                <option value="HIGH" ${state.severity === 'HIGH' ? 'selected' : ''}>High</option>
                <option value="MEDIUM" ${state.severity === 'MEDIUM' ? 'selected' : ''}>Medium</option>
                <option value="LOW" ${state.severity === 'LOW' ? 'selected' : ''}>Low</option>
              </select>
            </div>
            <div class="bfw-field">
              <label for="bfw-email">Email for updates (optional)</label>
              <input id="bfw-email" name="email" placeholder="name@example.com" type="email" value="${escapeHtml(state.email)}" ${
                disabled ? 'disabled' : ''
              } />
            </div>
            <div class="bfw-field">
              <label for="bfw-file">Screenshot</label>
              <div class="bfw-file-row">
                <input id="bfw-file" accept="image/png,image/jpeg,image/webp" ${disabled ? 'disabled' : ''} multiple type="file" />
                <button class="bfw-secondary" data-action="capture" type="button" ${disabled || state.captureBusy ? 'disabled' : ''}>
                  ${state.captureBusy ? 'Capturing...' : 'Auto-capture'}
                </button>
              </div>
              ${fileList}
              <p class="bfw-help">PNG, JPG, or WEBP only. Max 5MB each.</p>
            </div>
            <div class="bfw-footer">
              <span class="bfw-muted">We automatically include this page URL and browser details.</span>
              <button class="bfw-submit" type="submit" ${disabled ? 'disabled' : ''}>
                ${
                  state.status === 'submitting'
                    ? '<span class="bfw-spinner" aria-hidden="true"></span>Submitting...'
                    : state.status === 'error'
                      ? 'Retry submit'
                      : 'Submit bug'
                }
              </button>
            </div>
          </form>
        </div>
      `
    : '';

  root.innerHTML = `
    <style>${widgetStyles}</style>
    <div class="bfw-shell ${positionClass}">
      <button class="bfw-button" data-action="toggle" type="button" aria-expanded="${state.open}">
        <span class="bfw-button__icon">!</span>
        <span>${state.open ? 'Close' : 'Report bug'}</span>
      </button>
      ${panelMarkup}
    </div>
  `;

  root.querySelector('[data-action="toggle"]')?.addEventListener('click', actions.onToggle);
  root.querySelector('[data-action="close"]')?.addEventListener('click', actions.onClose);
  root.querySelector('[data-action="close-success"]')?.addEventListener('click', actions.onClose);
  root.querySelector('[data-action="capture"]')?.addEventListener('click', actions.onCapture);
  root.querySelector('.bfw-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    actions.onSubmit();
  });

  root.querySelector<HTMLInputElement>('#bfw-title')?.addEventListener('input', (event) => {
    actions.onFieldChange('title', (event.target as HTMLInputElement).value);
  });
  root.querySelector<HTMLTextAreaElement>('#bfw-description')?.addEventListener('input', (event) => {
    actions.onFieldChange('description', (event.target as HTMLTextAreaElement).value);
  });
  root.querySelector<HTMLSelectElement>('#bfw-severity')?.addEventListener('change', (event) => {
    actions.onFieldChange('severity', (event.target as HTMLSelectElement).value);
  });
  root.querySelector<HTMLInputElement>('#bfw-email')?.addEventListener('input', (event) => {
    actions.onFieldChange('email', (event.target as HTMLInputElement).value);
  });
  root.querySelector<HTMLInputElement>('#bfw-file')?.addEventListener('change', (event) => {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    actions.onFilesSelected(files);
  });
}
