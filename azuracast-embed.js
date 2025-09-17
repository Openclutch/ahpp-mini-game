(function attachGardenHarvsterEmbed() {
  const GAME_URL = 'https://openclutch.github.io/GardenHarvster/';
  const SECTION_ID = 'garden-harvster-embed';
  const STYLE_ID = 'garden-harvster-embed-style';

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${SECTION_ID} {
        margin: 2rem auto;
        max-width: 960px;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 12px;
        box-shadow: 0 18px 40px -24px rgba(18, 26, 33, 0.8);
        padding: 1.75rem;
        color: #102029;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        backdrop-filter: blur(6px);
      }

      #${SECTION_ID} h2 {
        margin: 0 0 0.5rem;
        font-size: 1.6rem;
        color: #1f3b4d;
      }

      #${SECTION_ID} p {
        margin: 0 0 1rem;
        line-height: 1.45;
        color: #1b2a33;
      }

      #${SECTION_ID} .embed-frame {
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid rgba(18, 26, 33, 0.15);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      }

      #${SECTION_ID} iframe {
        display: block;
        width: 100%;
        min-height: clamp(420px, 60vh, 640px);
        border: 0;
        background: #dfeee3;
      }

      #${SECTION_ID} a.launch-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.75rem;
        padding: 0.55rem 1.1rem;
        border-radius: 999px;
        font-weight: 600;
        text-decoration: none;
        background: #1f3b4d;
        color: #f4fbff;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }

      #${SECTION_ID} a.launch-link:hover,
      #${SECTION_ID} a.launch-link:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 10px 24px -12px rgba(16, 32, 45, 0.7);
        outline: none;
      }

      @media (max-width: 720px) {
        #${SECTION_ID} {
          margin: 1.25rem;
          padding: 1.25rem;
        }

        #${SECTION_ID} iframe {
          min-height: clamp(360px, 55vh, 520px);
        }
      }
    `;

    document.head.appendChild(style);
  };

  const renderEmbed = () => {
    if (document.getElementById(SECTION_ID)) {
      return;
    }

    const host =
      document.querySelector('[data-role="content"]') ||
      document.querySelector('main') ||
      document.querySelector('#app') ||
      document.body;

    if (!host) {
      return;
    }

    const section = document.createElement('section');
    section.id = SECTION_ID;

    const heading = document.createElement('h2');
    heading.textContent = 'Play Garden Harvster';

    const description = document.createElement('p');
    description.innerHTML =
      'Take a co-op farming break with <strong>Garden Harvster</strong>, a 2-player browser game that runs right in your station\'s public page.';

    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'embed-frame';

    const iframe = document.createElement('iframe');
    iframe.src = GAME_URL;
    iframe.title = 'Garden Harvster — 2-player co-op game';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';

    const link = document.createElement('a');
    link.className = 'launch-link';
    link.href = GAME_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open Garden Harvster in a new tab';

    frameWrapper.appendChild(iframe);
    section.appendChild(heading);
    section.appendChild(description);
    section.appendChild(frameWrapper);
    section.appendChild(link);

    host.appendChild(section);
  };

  const init = () => {
    injectStyles();
    renderEmbed();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.requestAnimationFrame(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
