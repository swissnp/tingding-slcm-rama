// form_script.js
// This content script runs on individual evaluation form pages (ans_eva_form.php).
// It automatically selects the configured score for each question and submits the form.

(() => {
  const DEFAULT_SCORE = 4;
  const MIN_SCORE = 1;
  const MAX_SCORE = 5;
  const FORM_READY_DELAY_MS = 800;
  const CLOSE_AFTER_SUBMIT_DELAY_MS = 6000;
  const SCORE_STORAGE_KEY = 'slcmEvaluatorScore';

  function getConfiguredScore() {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        resolve(DEFAULT_SCORE);
        return;
      }

      chrome.storage.local.get({ [SCORE_STORAGE_KEY]: DEFAULT_SCORE }, result => {
        const score = Number(result[SCORE_STORAGE_KEY]);
        resolve(Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE ? score : DEFAULT_SCORE);
      });
    });
  }

  function getRadioPoint(radio) {
    const hiddenPointInput = radio.parentElement && radio.parentElement.querySelector('input[type="hidden"][name*="_point"]');
    if (!hiddenPointInput) return null;

    const point = Number.parseFloat(hiddenPointInput.value);
    return Number.isNaN(point) ? null : point;
  }

  function selectRadio(radio) {
    radio.checked = true;
    try {
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (_) {}
  }

  async function fillAndSubmit() {
    try {
      const selectedScore = await getConfiguredScore();
      const selectedPoint = Number.parseFloat(`${selectedScore}.0`);
      const radioGroups = {};
      const radios = document.querySelectorAll('input[type="radio"]');

      radios.forEach(radio => {
        const name = radio.name;
        if (!radioGroups[name]) {
          radioGroups[name] = [];
        }
        radioGroups[name].push(radio);
      });

      // For each group, select the radio whose hidden point input matches the configured score.
      Object.keys(radioGroups).forEach(groupName => {
        const group = radioGroups[groupName];
        const matchedRadio = group.find(radio => getRadioPoint(radio) === selectedPoint);

        if (matchedRadio) {
          selectRadio(matchedRadio);
          return;
        }

        const fallbackIndex = 5 - selectedScore;
        if (group[fallbackIndex]) {
          selectRadio(group[fallbackIndex]);
        }
      });

      setTimeout(() => {
        const form = document.getElementById('form1') || document.forms[0] || document.querySelector('form');
        if (form) {
          try { form.setAttribute('action', 'ans_eva_process.php'); } catch (_) {}

          try {
            HTMLFormElement.prototype.submit.call(form);
          } catch (e) {
            console.warn('Direct submit failed, trying form.submit()', e);
            try { form.submit(); } catch (e2) { console.error('Form submit failed', e2); }
          }
        } else {
          console.error('Form element not found');
        }

        setTimeout(() => {
          window.close();
        }, CLOSE_AFTER_SUBMIT_DELAY_MS);
      }, FORM_READY_DELAY_MS);

    } catch (err) {
      console.error('SLCM Evaluator: error auto filling form', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fillAndSubmit();
  } else {
    document.addEventListener('DOMContentLoaded', fillAndSubmit);
  }
})();
