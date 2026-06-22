/**
 * toast.js — Sistema global de notificações toast
 * Uso: toast.sucesso('Mensagem'), toast.erro('Mensagem'), toast.aviso('Mensagem'), toast.info('Mensagem')
 */

(function () {
  const DURACAO_PADRAO = 4000;

  const ICONES = {
    sucesso: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    erro:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    aviso:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const CORES = {
    sucesso: { bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.35)',  text: '#4ade80', icon: '#22c55e' },
    erro:    { bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.35)',  text: '#f87171', icon: '#ef4444' },
    aviso:   { bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.35)',  text: '#fbbf24', icon: '#f59e0b' },
    info:    { bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.35)', text: '#ffcba8', icon: '#ff6b35' },
  };

  function injetarEstilos() {
    if (document.getElementById('toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      #toast-container {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        pointer-events: none;
        max-width: 360px;
        width: calc(100vw - 3rem);
      }

      .toast-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 0.75rem;
        border: 1px solid;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
        pointer-events: all;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
        animation: toastEntrar 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        position: relative;
        overflow: hidden;
      }

      .toast-item:hover {
        transform: translateY(-2px);
      }

      .toast-item.saindo {
        animation: toastSair 0.3s ease forwards;
      }

      .toast-icone {
        flex-shrink: 0;
        margin-top: 1px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-corpo {
        flex: 1;
        min-width: 0;
      }

      .toast-titulo {
        font-size: 0.8125rem;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: 0.01em;
        margin-bottom: 0.125rem;
      }

      .toast-mensagem {
        font-size: 0.8125rem;
        font-weight: 400;
        opacity: 0.85;
        line-height: 1.4;
        word-break: break-word;
      }

      .toast-fechar {
        flex-shrink: 0;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        opacity: 0.5;
        transition: opacity 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        margin-top: -2px;
      }

      .toast-fechar:hover { opacity: 1; }

      .toast-barra {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        border-radius: 0 0 0.75rem 0.75rem;
        animation: toastBarra linear forwards;
      }

      @keyframes toastEntrar {
        from { opacity: 0; transform: translateX(calc(100% + 1.5rem)); }
        to   { opacity: 1; transform: translateX(0); }
      }

      @keyframes toastSair {
        from { opacity: 1; transform: translateX(0); max-height: 200px; margin-bottom: 0; }
        to   { opacity: 0; transform: translateX(calc(100% + 1.5rem)); max-height: 0; margin-bottom: -0.625rem; }
      }

      @keyframes toastBarra {
        from { width: 100%; }
        to   { width: 0%; }
      }

      @media (max-width: 480px) {
        #toast-container {
          bottom: 1rem;
          right: 1rem;
          left: 1rem;
          width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function obterContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function removerToast(el) {
    el.classList.add('saindo');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  const TITULOS = {
    sucesso: 'Sucesso',
    erro:    'Erro',
    aviso:   'Atenção',
    info:    'Informação',
  };

  /**
   * Exibe um toast
   * @param {'sucesso'|'erro'|'aviso'|'info'} tipo
   * @param {string} mensagem
   * @param {object} [opcoes]
   * @param {string}  [opcoes.titulo]     — título customizado
   * @param {number}  [opcoes.duracao]    — ms até fechar (0 = não fecha)
   */
  function mostrar(tipo, mensagem, opcoes = {}) {
    injetarEstilos();
    const container = obterContainer();
    const cor = CORES[tipo] || CORES.info;
    const titulo = opcoes.titulo || TITULOS[tipo] || tipo;
    const duracao = opcoes.duracao !== undefined ? opcoes.duracao : DURACAO_PADRAO;

    const el = document.createElement('div');
    el.className = 'toast-item';
    el.style.cssText = `
      background: ${cor.bg};
      border-color: ${cor.border};
      color: ${cor.text};
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    `;

    el.innerHTML = `
      <div class="toast-icone" style="color: ${cor.icon}">${ICONES[tipo] || ICONES.info}</div>
      <div class="toast-corpo">
        <div class="toast-titulo">${titulo}</div>
        <div class="toast-mensagem">${mensagem}</div>
      </div>
      <button class="toast-fechar" aria-label="Fechar notificação">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      ${duracao > 0 ? `<div class="toast-barra" style="background: ${cor.icon}; animation-duration: ${duracao}ms;"></div>` : ''}
    `;

    el.querySelector('.toast-fechar').addEventListener('click', (e) => {
      e.stopPropagation();
      removerToast(el);
    });

    el.addEventListener('click', () => removerToast(el));

    container.appendChild(el);

    if (duracao > 0) {
      setTimeout(() => {
        if (el.parentNode) removerToast(el);
      }, duracao);
    }

    return el;
  }

  // API pública
  window.toast = {
    sucesso: (msg, opts) => mostrar('sucesso', msg, opts),
    erro:    (msg, opts) => mostrar('erro',    msg, opts),
    aviso:   (msg, opts) => mostrar('aviso',   msg, opts),
    info:    (msg, opts) => mostrar('info',    msg, opts),
  };
})();