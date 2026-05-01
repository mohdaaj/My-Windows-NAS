const searchInput = document.querySelector('#fileSearch');
const viewGridBtn = document.querySelector('#viewGrid');
const viewListBtn = document.querySelector('#viewList');
const fileGrid = document.querySelector('#fileGrid');

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase().trim();
    const cards = fileGrid.querySelectorAll('.file-card');

    cards.forEach((card) => {
      const name = card.dataset.name || '';
      const match = name.includes(query);
      card.style.display = match ? 'flex' : 'none';
    });
  });
}

if (viewGridBtn && viewListBtn && fileGrid) {
  const setActiveView = (view) => {
    viewGridBtn.classList.toggle('active', view === 'grid');
    viewListBtn.classList.toggle('active', view === 'list');
    fileGrid.classList.toggle('list-view', view === 'list');
  };

  viewGridBtn.addEventListener('click', () => setActiveView('grid'));
  viewListBtn.addEventListener('click', () => setActiveView('list'));
}
