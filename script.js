(function () {
  var body = document.body;
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var nav = document.querySelector('.nav');
  function updateNav() {
    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 8);
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  var pressDemo = document.getElementById('pressDemo');
  var demoToggle = document.getElementById('demoToggle');
  if (pressDemo && demoToggle) {
    demoToggle.addEventListener('click', function () {
      var pressed = pressDemo.classList.toggle('is-pressed');
      demoToggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      demoToggle.textContent = pressed ? 'Zurücksetzen' : 'Pressvorgang simulieren';
    });

    if ('IntersectionObserver' in window && !reduce) {
      var demoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            window.setTimeout(function () { pressDemo.classList.add('is-pressed'); }, 350);
            demoObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.55 });
      demoObserver.observe(pressDemo);
    }
  }
})();
