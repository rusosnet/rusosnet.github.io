import 'flowbite/dist/flowbite.turbo';

document.addEventListener('turbo:load', () => {
  const STORAGE_KEY = 'color-theme';

  const rootEl = document.documentElement;
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');

  const isSystemDark =
    !(STORAGE_KEY in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Change the icons inside the button based on previous settings
  if (localStorage.getItem(STORAGE_KEY) === 'dark' || isSystemDark) {
    lightIcon.classList.remove('hidden');
  } else {
    darkIcon.classList.remove('hidden');
  }

  const toggleBtn = document.getElementById('theme-toggle');

  console.log('setup');

  toggleBtn.addEventListener('click', function () {
    console.log('toggle');
    // toggle icons inside button
    darkIcon.classList.toggle('hidden');
    lightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem(STORAGE_KEY)) {
      if (localStorage.getItem(STORAGE_KEY) === 'light') {
        rootEl.classList.add('dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
      } else {
        rootEl.classList.remove('dark');
        localStorage.setItem(STORAGE_KEY, 'light');
      }

      // if NOT set via local storage previously
    } else {
      if (rootEl.classList.contains('dark')) {
        rootEl.classList.remove('dark');
        localStorage.setItem(STORAGE_KEY, 'light');
      } else {
        rootEl.classList.add('dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
      }
    }
  });
});
