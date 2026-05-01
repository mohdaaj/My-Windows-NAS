const searchInput = document.querySelector('#fileSearch');
const viewGridBtn = document.querySelector('#viewGrid');
const viewListBtn = document.querySelector('#viewList');
const fileGrid = document.querySelector('#fileGrid');
const mobileMenuToggle = document.querySelector('#mobileMenuToggle');
const sidebar = document.querySelector('#sidebar');
const sidebarBackdrop = document.querySelector('#sidebarBackdrop');
const navLinks = document.querySelectorAll('.nav-item');
const openFolderModalBtn = document.querySelector('#openFolderModal');
const openFolderModalSidebarBtn = document.querySelector('#openFolderModalSidebar');
const refreshPageBtn = document.querySelector('#refreshPage');
const folderModal = document.querySelector('#folderModal');
const folderModalClose = document.querySelector('#closeFolderModal');
const firstModalInput = document.querySelector('.folder-add-form input');
const previewModal = document.querySelector('#previewModal');
const previewVideo = document.querySelector('#previewVideo');
const closePreviewModalBtn = document.querySelector('#closePreviewModal');

const setBodyModalState = (isOpen) => {
  document.body.classList.toggle('modal-open', isOpen);
};

if (searchInput && fileGrid) {
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
  if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
};

const closeSidebar = () => {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
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

const closeFolderModal = () => {
  if (!folderModal) return;
  folderModal.classList.remove('active');
  setBodyModalState(false);
};

const openFolderModal = () => {
  if (!folderModal) return;
  folderModal.classList.add('active');
  setBodyModalState(true);
  if (firstModalInput) firstModalInput.focus();
};

if (openFolderModalBtn) {
  openFolderModalBtn.addEventListener('click', openFolderModal);
}

if (openFolderModalSidebarBtn) {
  openFolderModalSidebarBtn.addEventListener('click', openFolderModal);
}

if (refreshPageBtn) {
  refreshPageBtn.addEventListener('click', () => window.location.reload());
}

if (folderModalClose) {
  folderModalClose.addEventListener('click', closeFolderModal);
}

if (closePreviewModalBtn) {
  closePreviewModalBtn.addEventListener('click', closePreviewModal);
}

if (folderModal) {
  folderModal.addEventListener('click', (event) => {
    if (event.target === folderModal) {
      closeFolderModal();
    }
  });
}

if (previewModal) {
  previewModal.addEventListener('click', (event) => {
    if (event.target === previewModal) {
      closePreviewModal();
    }
  });
}

if (fileGrid) {
  fileGrid.addEventListener('click', (event) => {
    const previewButton = event.target.closest('.preview-btn');
    if (!previewButton) return;
    const previewUrl = previewButton.dataset.previewUrl;
    if (previewUrl) {
      openPreviewModal(previewUrl);
    }
  });
}

function getFileCards() {
  return Array.from(document.querySelectorAll('.file-card'));
}

function getGridColumns() {
  if (!fileGrid) return 1;
  return getComputedStyle(fileGrid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
}

function focusAdjacentCard(delta) {
  const cards = getFileCards();
  const activeIndex = cards.indexOf(document.activeElement);
  if (activeIndex < 0) return;
  const nextIndex = activeIndex + delta;
  if (nextIndex >= 0 && nextIndex < cards.length) {
    cards[nextIndex].focus();
  }
}

function handleRemoteNavigation(event) {
  if (!fileGrid) return;
  const cards = getFileCards();
  if (!cards.length) return;
  const activeIndex = cards.indexOf(document.activeElement);
  if (event.key === 'ArrowRight' && activeIndex >= 0) {
    event.preventDefault();
    focusAdjacentCard(1);
    return;
  }
  if (event.key === 'ArrowLeft' && activeIndex >= 0) {
    event.preventDefault();
    focusAdjacentCard(-1);
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const columns = getGridColumns();
    if (activeIndex < 0) {
      cards[0].focus();
      return;
    }
    focusAdjacentCard(columns);
    return;
  }
  if (event.key === 'ArrowUp' && activeIndex >= 0) {
    event.preventDefault();
    const columns = getGridColumns();
    focusAdjacentCard(-columns);
    return;
  }
  if (event.key === 'Enter' && activeIndex >= 0) {
    event.preventDefault();
    const card = cards[activeIndex];
    const previewButton = card.querySelector('.preview-btn');
    const fileLink = card.querySelector('.file-card-link');
    if (previewButton) {
      previewButton.click();
      return;
    }
    if (fileLink) {
      fileLink.click();
    }
  }
}

if (navLinks.length) {
  navLinks.forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
    closeFolderModal();
    closePreviewModal();
  }
  handleRemoteNavigation(event);
});

function openPreviewModal(url) {
  if (!previewModal || !previewVideo) return;
  previewVideo.src = url;
  previewModal.classList.add('active');
  setBodyModalState(true);
  previewVideo.play().catch(() => {});
}

function closePreviewModal() {
  if (!previewModal || !previewVideo) return;
  previewVideo.pause();
  previewVideo.removeAttribute('src');
  previewVideo.load();
  previewModal.classList.remove('active');
  setBodyModalState(false);
}

