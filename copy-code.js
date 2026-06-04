<script>
/* Copy code blocks | robertbirming.com */
(function () {
  'use strict';

  const ICON_COPY = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3 10V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
  const ICON_CHECK = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.highlight').forEach(function (highlight) {
      if (highlight.querySelector('.copy-code-button')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-code-button';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.innerHTML = ICON_COPY;

      let resetTimer;

      btn.addEventListener('click', function () {
        const code = highlight.querySelector('pre')?.textContent || '';

        navigator.clipboard.writeText(code).then(function () {
          btn.innerHTML = ICON_CHECK;
          btn.setAttribute('aria-label', 'Copied');

          clearTimeout(resetTimer);
          resetTimer = setTimeout(function () {
            btn.innerHTML = ICON_COPY;
            btn.setAttribute('aria-label', 'Copy code to clipboard');
          }, 1000);
        }).catch(function (err) {
          console.error('Failed to copy code:', err);
        });
      });

      highlight.appendChild(btn);
    });
  });
})();
</script>
