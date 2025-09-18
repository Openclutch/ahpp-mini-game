(function attachNeonDriftGarageOverlay() {
  const GAME_URL = 'https://openclutch.github.io/ahpp-mini-game/';
  const OVERLAY_ID = 'neon-drift-garage-overlay';
  const TOGGLE_ID = 'neon-drift-garage-toggle';
  const STYLE_ID = 'neon-drift-garage-overlay-style';
  const NO_SCROLL_CLASS = 'neon-drift-garage-overlay-open';

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.${NO_SCROLL_CLASS} {
        overflow: hidden;
      }

      #${TOGGLE_ID} {
        position: fixed;
        bottom: 90px;
        right: 20px;
        z-index: 2147483642;
        border: none;
        background: linear-gradient(135deg, #1a1740, #281864);
        color: #e4f7ff;
        padding: 0.65rem 1.2rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: 0.06em;
        box-shadow: 0 18px 36px -20px rgba(8, 18, 44, 0.92);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      #${TOGGLE_ID}:hover,
      #${TOGGLE_ID}:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 24px 40px -18px rgba(12, 22, 54, 0.95);
        outline: none;
      }

      #${TOGGLE_ID}:focus-visible {
        box-shadow: 0 0 0 3px rgba(59, 125, 255, 0.35);
      }

      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(16px, 5vw, 48px);
        background: rgba(5, 10, 26, 0.86);
        backdrop-filter: blur(6px);
        z-index: 2147483641;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.16s ease;
      }

      #${OVERLAY_ID}.open {
        opacity: 1;
        pointer-events: auto;
      }

      #${OVERLAY_ID} .embed-shell {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.65rem;
        width: min(92vw, 960px);
      }

      #${OVERLAY_ID} iframe {
        width: 100%;
        height: clamp(360px, 70vh, 640px);
        border: 0;
        border-radius: 14px;
        background: radial-gradient(circle at top, #131035, #04040f 65%);
        box-shadow: 0 20px 42px -24px rgba(0, 0, 0, 0.85);
      }

      #${OVERLAY_ID} .launch-link {
        align-self: flex-end;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        background: rgba(14, 22, 46, 0.94);
        color: #b3ecff;
        text-decoration: none;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      #${OVERLAY_ID} .launch-link:hover,
      #${OVERLAY_ID} .launch-link:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 12px 22px -14px rgba(0, 0, 0, 0.82);
        outline: none;
      }

      @media (max-width: 520px) {
        #${TOGGLE_ID} {
          bottom: 80px;
          right: 16px;
          padding: 0.55rem 1rem;
          font-size: 0.9rem;
        }

        #${OVERLAY_ID} .embed-shell {
          width: min(96vw, 520px);
          gap: 0.5rem;
        }

        #${OVERLAY_ID} iframe {
          height: clamp(240px, 65vh, 520px);
          border-radius: 12px;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const setOverlayVisible = (visible) => {
    const overlay = document.getElementById(OVERLAY_ID);
    const toggle = document.getElementById(TOGGLE_ID);

    if (!overlay || !toggle) {
      return;
    }

    overlay.classList.toggle('open', visible);
    overlay.setAttribute('aria-hidden', String(!visible));
    toggle.setAttribute('aria-expanded', String(visible));

    if (visible) {
      document.body.classList.add(NO_SCROLL_CLASS);
      toggle.style.display = 'none';
    } else {
      document.body.classList.remove(NO_SCROLL_CLASS);
      toggle.style.display = '';
      toggle.focus({ preventScroll: true });
    }
  };

  const ensureOverlay = () => {
    if (document.getElementById(OVERLAY_ID)) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    const shell = document.createElement('div');
    shell.className = 'embed-shell';

    const iframe = document.createElement('iframe');
    iframe.src = GAME_URL;
    iframe.title = 'AHPP Underground Garage Tycoon — Retro street racing garage sim';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';

    const link = document.createElement('a');
    link.className = 'launch-link';
    link.href = GAME_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open in browser';

    shell.appendChild(iframe);
    shell.appendChild(link);
    overlay.appendChild(shell);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        setOverlayVisible(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const isOpen = overlay.classList.contains('open');
        if (isOpen) {
          event.preventDefault();
          setOverlayVisible(false);
        }
      }
    });

    document.body.appendChild(overlay);
  };

  const ensureToggleButton = () => {
    if (document.getElementById(TOGGLE_ID)) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.id = TOGGLE_ID;
    toggle.type = 'button';
    toggle.textContent = 'Play AHPP Underground Garage Tycoon';
    toggle.setAttribute('aria-controls', OVERLAY_ID);
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      setOverlayVisible(true);
    });

    document.body.appendChild(toggle);
  };

  const init = () => {
    injectStyles();
    ensureOverlay();
    ensureToggleButton();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.requestAnimationFrame(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
