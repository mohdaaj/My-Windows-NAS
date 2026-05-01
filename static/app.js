const searchInput = document.querySelector('#fileSearch');
const viewGridBtn = document.querySelector('#viewGrid');
const viewListBtn = document.querySelector('#viewList');
const fileGrid = document.querySelector('#fileGrid');
const mobileMenuToggle = document.querySelector('#mobileMenuToggle');
const sidebar = document.querySelector('#sidebar');
const sidebarBackdrop = document.querySelector('#sidebarBackdrop');

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

const openSidebar = () => {
  if (!sidebar) return;
  sidebar.classList.add('open');
  if (sidebarBackdrop) {
    sidebarBackdrop.classList.add('active');
  }
};

const closeSidebar = () => {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  if (sidebarBackdrop) {
    sidebarBackdrop.classList.remove('active');
  }
};

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    if (sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', closeSidebar);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
  }
});
