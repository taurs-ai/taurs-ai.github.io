(() => {
  const cards = Array.from(document.querySelectorAll('.post-card')).map((element) => ({
    element,
    tags: JSON.parse(element.dataset.tags),
  }));
  const filters = document.getElementById('tag-filters');
  const count = document.getElementById('post-count');
  const empty = document.getElementById('blog-empty');
  const buttons = Array.from(document.querySelectorAll('.tag-filter'));

  function applyFilter() {
    const tag = new URL(window.location.href).searchParams.get('tag') || '';
    let visible = 0;
    for (const card of cards) {
      card.element.hidden = Boolean(tag && !card.tags.includes(tag));
      if (!card.element.hidden) visible++;
    }
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.filterTag === tag));
    }
    count.textContent = `${visible} ${visible === 1 ? 'post' : 'posts'}${tag ? ` tagged “${tag}”` : ''}`;
    empty.hidden = visible > 0;
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-filter-tag]');
    if (!target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    const tag = target.dataset.filterTag;
    if (tag) url.searchParams.set('tag', tag);
    else url.searchParams.delete('tag');
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    applyFilter();
  });

  window.addEventListener('popstate', applyFilter);
  filters.hidden = false;
  applyFilter();
})();
