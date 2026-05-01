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
    closeFolderModal();
  }
});

const openFolderModalBtn = document.querySelector('#openFolderModal');
const openFolderModalSidebarBtn = document.querySelector('#openFolderModalSidebar');
const folderModal = document.querySelector('#folderModal');
const folderModalClose = document.querySelector('#closeFolderModal');
const browsePathText = document.querySelector('#browsePathText');
const folderList = document.querySelector('#folderList');
const manualFolderPath = document.querySelector('#manualFolderPath');
const chooseCurrentFolderBtn = document.querySelector('#chooseCurrentFolderBtn');
const parentFolderBtn = document.querySelector('#parentFolderBtn');
const refreshFolderBtn = document.querySelector('#refreshFolderBtn');

let currentBrowsePath = '';
let parentBrowsePath = '';

const buildBrowsePath = (base, entry) => {
  if (!base) return entry;
  if (base.endsWith('\\') || base.endsWith('/')) return `${base}${entry}`;
  return `${base}\\${entry}`;
};

const closeFolderModal = () => {
  if (!folderModal) return;
  folderModal.classList.remove('active');
};

const openFolderModal = () => {
  if (!folderModal) return;
  folderModal.classList.add('active');
  fetchFolderPaths();
};

const renderFolderEntries = (data) => {
  currentBrowsePath = data.path || '';
  parentBrowsePath = data.parent || '';
  browsePathText.textContent = currentBrowsePath || 'Choose a drive or folder';
  if (manualFolderPath) {
    manualFolderPath.value = currentBrowsePath;
  }
  parentFolderBtn.disabled = !parentBrowsePath;
  folderList.innerHTML = data.entries
    .map((entry) => {
      const folderPath = data.path ? buildBrowsePath(data.path, entry) : entry;
      return `<li><button type="button" class="folder-item" data-path="${folderPath}">${entry}</button></li>`;
    })
    .join('');
};

const fetchFolderPaths = async (path = '') => {
  const url = `/browse-folders${path ? `?path=${encodeURIComponent(path)}` : ''}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load folders');
    const data = await response.json();
    renderFolderEntries(data);
  } catch (error) {
    console.error(error);
  }
};

if (openFolderModalBtn) {
  openFolderModalBtn.addEventListener('click', openFolderModal);
}

if (openFolderModalSidebarBtn) {
  openFolderModalSidebarBtn.addEventListener('click', openFolderModal);
}

if (folderModalClose) {
  folderModalClose.addEventListener('click', closeFolderModal);
}

if (folderModal) {
  folderModal.addEventListener('click', (event) => {
    if (event.target === folderModal) {
      closeFolderModal();
    }
  });
}

if (folderList) {
  folderList.addEventListener('click', (event) => {
    const target = event.target.closest('.folder-item');
    if (!target) return;
    const nextPath = target.dataset.path;
    fetchFolderPaths(nextPath);
  });
}

if (chooseCurrentFolderBtn) {
  chooseCurrentFolderBtn.addEventListener('click', () => {
    if (manualFolderPath && currentBrowsePath) {
      manualFolderPath.value = currentBrowsePath;
    }
  });
}

if (parentFolderBtn) {
  parentFolderBtn.addEventListener('click', () => {
    if (parentBrowsePath) {
      fetchFolderPaths(parentBrowsePath);
    }
  });
}

if (refreshFolderBtn) {
  refreshFolderBtn.addEventListener('click', () => {
    fetchFolderPaths(currentBrowsePath);
  });
}
