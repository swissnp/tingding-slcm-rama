// background.js
// Service worker to open survey forms in new tabs when requested.

const DEFAULT_SCORE = 4;
const MIN_SCORE = 1;
const MAX_SCORE = 5;
const TAB_POLL_INTERVAL_MS = 1000;
const BETWEEN_FORMS_DELAY_MS = 2000;
const FORM_TIMEOUT_MS = 30000;

function normalizeScore(score) {
  const numericScore = Number(score);
  return Number.isInteger(numericScore) && numericScore >= MIN_SCORE && numericScore <= MAX_SCORE
    ? numericScore
    : DEFAULT_SCORE;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'openForms') {
    return false;
  }

  if (!Array.isArray(message.urls) || message.urls.length === 0) {
    sendResponse({ ok: false, error: 'No form URLs were provided.' });
    return false;
  }

  const urls = [...new Set(message.urls.filter(url => typeof url === 'string' && url.startsWith('https://www.rama.mahidol.ac.th/slcm/survey/')))];
  const selectedScore = normalizeScore(message.score);
  let currentIndex = 0;
  const activeTabs = new Set();

  if (urls.length === 0) {
    sendResponse({ ok: false, error: 'No supported Mahidol SLCM form URLs were provided.' });
    return false;
  }

  function scheduleNextForm() {
    currentIndex += 1;
    setTimeout(openNextForm, BETWEEN_FORMS_DELAY_MS);
  }

  function openNextForm() {
    if (currentIndex >= urls.length) {
      console.info('Mahidol Evaluator: all forms have been processed.');
      return;
    }

    const url = urls[currentIndex];
    console.info(`Mahidol Evaluator: opening form ${currentIndex + 1}/${urls.length}.`);

    chrome.tabs.create({ url, active: false }, tab => {
      if (!tab || !tab.id) {
        console.error(`Mahidol Evaluator: failed to open form ${currentIndex + 1}.`);
        scheduleNextForm();
        return;
      }

      activeTabs.add(tab.id);

      const checkTabClosed = setInterval(() => {
        chrome.tabs.get(tab.id, tabInfo => {
          if (chrome.runtime.lastError || !tabInfo) {
            activeTabs.delete(tab.id);
            clearInterval(checkTabClosed);
            scheduleNextForm();
          }
        });
      }, TAB_POLL_INTERVAL_MS);

      setTimeout(() => {
        if (!activeTabs.has(tab.id)) return;

        clearInterval(checkTabClosed);
        activeTabs.delete(tab.id);
        console.warn(`Mahidol Evaluator: form ${currentIndex + 1} timed out.`);
        scheduleNextForm();
      }, FORM_TIMEOUT_MS);
    });
  }

  chrome.storage.local.set({ mahidolEvaluatorScore: selectedScore }, openNextForm);
  sendResponse({ ok: true, count: urls.length, score: selectedScore });
  return false;
});
