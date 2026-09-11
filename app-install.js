(() => {
  'use strict';
  const button = document.querySelector('#install-app');
  const status = document.querySelector('#install-status');
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let installPrompt = null;

  function show(message) {
    if (!status) return;
    status.textContent = message;
    window.setTimeout(() => { if (status.textContent === message) status.textContent = ''; }, 9000);
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}));
  }

  if (!button || standalone) return;
  button.hidden = false;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
    show('SHIMORA is installed on this device.');
  });

  button.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      installPrompt = null;
      if (choice.outcome === 'accepted') button.hidden = true;
      else show('You can install SHIMORA later from your browser menu.');
      return;
    }
    const isiPhone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    show(isiPhone
      ? 'On iPhone or iPad: tap Share, then choose Add to Home Screen.'
      : 'Open your browser menu and choose Install app or Add to Home screen.');
  });
})();
