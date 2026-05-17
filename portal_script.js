// portal_script.js
// This content script runs on the evaluation list page (portal_index.php).
// It injects a button that, when clicked, collects the survey form URLs and instructs
// the background script to open them in separate tabs for automatic evaluation.

(() => {
  const DEFAULT_SCORE = 4;
  const SCORE_OPTIONS = [5, 4, 3, 2, 1];
  const FORM_URL_PATTERN = /open_frm\(['"]([^'"]+)['"]/;
  const SCORE_STORAGE_KEY = 'slcmEvaluatorScore';

  if (window.location.href.includes('ans_eva_form.php') || window.location.href.includes('survey_form.php')) {
    return;
  }

  function resolveFormUrl(value) {
    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      console.warn('SLCM Evaluator: skipped invalid form URL.', error);
      return null;
    }
  }

  function findFormUrls() {
    const urls = new Set();
    const icons = document.querySelectorAll('span[onclick]');

    icons.forEach(icon => {
      const onclick = icon.getAttribute('onclick') || '';
      const match = onclick.match(FORM_URL_PATTERN);
      if (!match) return;

      const url = resolveFormUrl(match[1]);
      if (url) urls.add(url);
    });

    return [...urls];
  }

  function addAutoButton() {
    // Avoid adding multiple buttons if the script runs more than once.
    if (document.getElementById('slcm-auto-eval-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'slcm-auto-eval-panel';
    Object.assign(panel.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '8px',
      padding: '10px',
      maxWidth: '360px',
      backgroundColor: '#ffffff',
      border: '1px solid #b8d7b8',
      borderRadius: '6px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      color: '#222222',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    });

    const controls = document.createElement('div');
    Object.assign(controls.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });

    const label = document.createElement('label');
    label.htmlFor = 'slcm-auto-eval-score';
    label.textContent = 'Point';
    Object.assign(label.style, {
      color: '#222222',
      fontWeight: 'bold'
    });

    const scoreSelect = document.createElement('select');
    scoreSelect.id = 'slcm-auto-eval-score';
    SCORE_OPTIONS.forEach(score => {
      const option = document.createElement('option');
      option.value = String(score);
      option.textContent = `${score}/5`;
      if (score === DEFAULT_SCORE) option.selected = true;
      scoreSelect.appendChild(option);
    });
    Object.assign(scoreSelect.style, {
      padding: '8px',
      border: '1px solid #a9a9a9',
      borderRadius: '4px',
      backgroundColor: '#ffffff',
      color: '#222222',
      fontSize: '14px'
    });

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ [SCORE_STORAGE_KEY]: DEFAULT_SCORE }, result => {
        const savedScore = Number(result[SCORE_STORAGE_KEY]);
        if (Number.isInteger(savedScore) && savedScore >= 1 && savedScore <= 5) {
          scoreSelect.value = String(savedScore);
        }
      });
    }

    const button = document.createElement('button');
    button.id = 'slcm-auto-eval-btn';
    button.textContent = 'Auto Evaluate All';
    Object.assign(button.style, {
      padding: '10px 15px',
      backgroundColor: '#4CAF50',
      color: '#ffffff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px'
    });

    const disclaimer = document.createElement('div');
    disclaimer.textContent = 'Disclaimer: This tool does not promote misuse. Use it only where allowed; the author accepts no responsibility for consequences.';
    Object.assign(disclaimer.style, {
      color: '#555555',
      fontSize: '11px',
      lineHeight: '1.35'
    });

    button.addEventListener('click', () => {
      const selectedScore = Number(scoreSelect.value);
      const urls = findFormUrls();

      if (urls.length > 0) {
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const startProcessing = () => {
              button.disabled = true;
              button.textContent = 'Processing...';
              chrome.runtime.sendMessage({ type: 'openForms', urls, score: selectedScore }, response => {
                button.disabled = false;
                button.textContent = 'Auto Evaluate All';

                if (chrome.runtime.lastError) {
                  console.error('SLCM Evaluator: message failed.', chrome.runtime.lastError);
                  alert('Could not communicate with the extension. Please reload the extension and try again.');
                  return;
                }

                if (!response || !response.ok) {
                  alert(response && response.error ? response.error : 'Could not start evaluation processing.');
                  return;
                }

                alert(`Started processing ${response.count} evaluation form(s) sequentially with ${response.score}/5.`);
              });
            };

            if (chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ [SCORE_STORAGE_KEY]: selectedScore }, startProcessing);
            } else {
              startProcessing();
            }
          } else {
            alert('Chrome extension API not available. Please make sure the extension is properly loaded.');
          }
        } catch (error) {
          console.error('Error sending message to background script:', error);
          alert('Error: Could not communicate with the extension. Please reload the extension and try again.');
        }
      } else {
        alert('No evaluation forms found on this page.');
      }
    });
    controls.appendChild(label);
    controls.appendChild(scoreSelect);
    controls.appendChild(button);
    panel.appendChild(controls);
    panel.appendChild(disclaimer);
    document.body.appendChild(panel);
  }
  // Run after DOM is ready.
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    addAutoButton();
  } else {
    document.addEventListener('DOMContentLoaded', addAutoButton);
  }
})();
