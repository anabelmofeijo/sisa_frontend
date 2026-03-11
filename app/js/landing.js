document.addEventListener('DOMContentLoaded', function () {
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!revealItems.length) {
    return;
  }

  const revealGroups = Array.from(document.querySelectorAll('[data-reveal-group]'));
  revealGroups.forEach(function (group) {
    let groupItems = [];
    try {
      groupItems = Array.from(group.querySelectorAll(':scope > [data-reveal]'));
    } catch (error) {
      groupItems = Array.from(group.querySelectorAll('[data-reveal]'));
    }

    groupItems.forEach(function (item, index) {
      if (item.getAttribute('data-reveal-delay')) {
        item.style.setProperty('--reveal-delay', item.getAttribute('data-reveal-delay'));
        return;
      }
      item.style.setProperty('--reveal-delay', (index * 90) + 'ms');
    });
  });

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px'
  });

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
});
