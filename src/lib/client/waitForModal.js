// Small utility to wait for a modal custom element instance to be ready
export function waitForModal(id, timeout = 3000, interval = 50) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const el = document.getElementById(id);
      if (el && typeof el.openModal === 'function') return resolve(el);
      if (Date.now() - start >= timeout) return reject(new Error('Modal not ready'));
      setTimeout(check, interval);
    })();
  });
}
