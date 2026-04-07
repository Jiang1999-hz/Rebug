export const widgetStyles = `
  :host {
    all: initial;
  }

  .bfw-shell {
    position: fixed;
    inset: auto 24px 24px auto;
    z-index: 2147483000;
    font-family: "Segoe UI", Arial, sans-serif;
    color: #172026;
  }

  .bfw-shell--bottom-left {
    inset: auto auto 24px 24px;
  }

  .bfw-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 58px;
    min-height: 58px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, #d64f33, #ef846f);
    color: #fff;
    box-shadow: 0 20px 40px rgba(214, 79, 51, 0.28);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .bfw-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 22px 44px rgba(214, 79, 51, 0.32);
  }

  .bfw-button__icon {
    font-size: 20px;
    line-height: 1;
  }

  .bfw-panel {
    position: absolute;
    right: 0;
    bottom: 74px;
    width: min(92vw, 360px);
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 243, 0.97));
    border: 1px solid rgba(20, 32, 38, 0.1);
    box-shadow: 0 26px 50px rgba(23, 32, 38, 0.18);
    overflow: hidden;
    animation: bfw-slide-up 180ms ease;
  }

  .bfw-shell--bottom-left .bfw-panel {
    left: 0;
    right: auto;
  }

  .bfw-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    padding: 18px 18px 0;
  }

  .bfw-header h2,
  .bfw-success h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .bfw-header p,
  .bfw-help,
  .bfw-success p,
  .bfw-error {
    margin: 6px 0 0;
    color: #58656e;
    font-size: 13px;
    line-height: 1.45;
  }

  .bfw-close {
    border: 0;
    background: rgba(23, 32, 38, 0.06);
    color: #172026;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    cursor: pointer;
  }

  .bfw-form,
  .bfw-success {
    display: grid;
    gap: 12px;
    padding: 18px;
  }

  .bfw-field {
    display: grid;
    gap: 6px;
  }

  .bfw-field label,
  .bfw-inline label {
    font-size: 13px;
    font-weight: 600;
    color: #42505a;
  }

  .bfw-field input,
  .bfw-field textarea,
  .bfw-field select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(23, 32, 38, 0.14);
    border-radius: 14px;
    padding: 12px 13px;
    font: inherit;
    color: #172026;
    background: rgba(255, 255, 255, 0.96);
  }

  .bfw-field textarea {
    resize: vertical;
    min-height: 92px;
  }

  .bfw-inline {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: end;
  }

  .bfw-secondary,
  .bfw-submit,
  .bfw-retry {
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .bfw-secondary {
    min-height: 44px;
    padding: 0 14px;
    background: rgba(23, 32, 38, 0.08);
    color: #172026;
  }

  .bfw-submit,
  .bfw-retry {
    min-height: 48px;
    padding: 0 18px;
    background: linear-gradient(135deg, #d64f33, #ef846f);
    color: #fff;
  }

  .bfw-error {
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(214, 79, 51, 0.1);
    color: #9a3412;
  }

  .bfw-file-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .bfw-file-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bfw-file-pill {
    display: inline-flex;
    width: fit-content;
    gap: 6px;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(23, 32, 38, 0.07);
    font-size: 12px;
    color: #42505a;
  }

  .bfw-spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    animation: bfw-spin 700ms linear infinite;
  }

  .bfw-success {
    text-align: left;
  }

  .bfw-success__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: rgba(43, 140, 96, 0.12);
    color: #1f7a52;
    font-size: 20px;
  }

  .bfw-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .bfw-muted {
    color: #58656e;
    font-size: 12px;
  }

  @keyframes bfw-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes bfw-slide-up {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
