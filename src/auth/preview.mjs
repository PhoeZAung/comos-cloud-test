// No provider, network, browser storage or authenticated identity in this module.
import { validateAuth, validateProfile } from './validation.mjs';
export function mountPreviewForms(document) {
  for (const form of document.querySelectorAll('[data-auth-form]')) {
    const button = form.querySelector('[type="submit"]');button.disabled = false;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      const errors = form.dataset.authForm === 'profile' ? validateProfile(values) : validateAuth(form.dataset.authForm, values);
      let first;
      for (const input of form.querySelectorAll('input')) {
        const message = errors[input.name] || '';
        document.getElementById(input.id + '-error').textContent = message;
        input.setAttribute('aria-invalid', String(Boolean(message)));
        if (message && !first) first = input;
      }
      const status = form.querySelector('.auth-status');
      status.textContent = first ? 'Check the highlighted fields.' : 'Form looks good. Preview only — nothing was sent or saved.';
      if (first) first.focus();else status.focus();
    });
  }
  for (const button of document.querySelectorAll('.show-password')) {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const show = input.type === 'password';input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';button.setAttribute('aria-pressed', String(show));
    });
  }
}
if (typeof document !== 'undefined') mountPreviewForms(document);
