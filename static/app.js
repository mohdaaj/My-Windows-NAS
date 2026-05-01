/* =============================================
   PyTV — TV Remote / D-pad Navigation Engine
   Samsung TV Browser Optimized
   ============================================= */

'use strict';

// ─── ELEMENT REFS ────────────────────────────
const playerOverlay   = document.getElementById('playerOverlay');
const mainPlayer      = document.getElementById('mainPlayer');
const playerUI        = document.getElementById('playerUI');
const playerBack      = document.getElementById('playerBack');
const playerFilename  = document.getElementById('playerFilename');
const playerHint      = document.getElementById('playerHint');
const progressFill    = document.getElementById('progressFill');
const progressThumb   = document.getElementById('progressThumb');
const progressBar     = document.getElementById('progressBar');
const playerCurrentTime = document.getElementById('playerCurrentTime');
const playerDuration  = document.getElementById('playerDuration');
const btnPlayPause    = document.getElementById('btnPlayPause');
const playIcon        = document.getElementById('playIcon');
const btnRewind       = document.getElementById('btnRewind');
const btnForward      = document.getElementById('btnForward');
const btnFullscreen   = document.getElementById('btnFullscreen');
const folderModal     = document.getElementById('folderModal');
const closeFolderModal = document.getElementById('closeFolderModal');
const fileGrid        = document.getElementById('fileGrid');

// ─── STATE ───────────────────────────────────
let uiHideTimer = null;
let isPlayerOpen = false;
let focusedCardIndex = -1;

// ─── DELETE MODAL ────────────────────────────
const deleteModal         = document.getElementById('deleteModal');
const deleteModalForm     = document.getElementById('deleteModalForm');
const deleteModalFilename = document.getElementById('deleteModalFilename');
const closeDeleteModal    = document.getElementById('closeDeleteModal');
const deleteModalCancel   = document.getElementById('deleteModalCancel');

function openDeleteModal(filename, deleteUrl) {
    if (!deleteModal) return;
    deleteModalFilename.textContent = filename;
    deleteModalForm.action = deleteUrl;
    deleteModal.classList.add('active');
    deleteModal.setAttribute('aria-hidden', 'false');
    // focus the cancel button by default (safer choice)
    setTimeout(() => deleteModalCancel?.focus(), 50);
}

function closeDeleteModalFn() {
    if (!deleteModal) return;
    deleteModal.classList.remove('active');
    deleteModal.setAttribute('aria-hidden', 'true');
}

closeDeleteModal?.addEventListener('click', closeDeleteModalFn);
deleteModalCancel?.addEventListener('click', closeDeleteModalFn);
deleteModal?.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModalFn(); });

// Delegate click on delete buttons inside file grid
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    openDeleteModal(btn.dataset.filename, btn.dataset.deleteUrl);
}, true); // capture phase — fires before the card's click handler

// Escape closes delete modal too
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal?.classList.contains('active')) {
        closeDeleteModalFn();
    }
}, true);


function openModal() {
    if (!folderModal) return;
    folderModal.classList.add('active');
    folderModal.setAttribute('aria-hidden', 'false');
    const firstInput = folderModal.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeModal() {
    if (!folderModal) return;
    folderModal.classList.remove('active');
    folderModal.setAttribute('aria-hidden', 'true');
}

const openBtns = document.querySelectorAll('#openFolderModalBtn, #openFolderModalBtnEmpty');
openBtns.forEach(btn => btn?.addEventListener('click', openModal));
closeFolderModal?.addEventListener('click', closeModal);
folderModal?.addEventListener('click', (e) => { if (e.target === folderModal) closeModal(); });

// Refresh button
document.getElementById('refreshPage')?.addEventListener('click', () => window.location.reload());

// ─── TIME FORMATTING ─────────────────────────
function fmtTime(secs) {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── PLAYER UI SHOW/HIDE ─────────────────────
function showPlayerUI() {
    playerUI?.classList.remove('hidden');
    playerHint && (playerHint.style.opacity = '1');
    clearTimeout(uiHideTimer);
    uiHideTimer = setTimeout(hidePlayerUI, 3500);
}

function hidePlayerUI() {
    if (!mainPlayer || mainPlayer.paused) return; // keep visible when paused
    playerUI?.classList.add('hidden');
    playerHint && (playerHint.style.opacity = '0');
}

// ─── VIDEO PLAYER ────────────────────────────
function openPlayer(url, name) {
    if (!playerOverlay || !mainPlayer) return;
    isPlayerOpen = true;
    mainPlayer.src = url;
    playerFilename && (playerFilename.textContent = name || 'Video');
    playerOverlay.classList.add('active');
    playerOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    mainPlayer.play().catch(() => {});
    showPlayerUI();
}

function closePlayer() {
    if (!playerOverlay || !mainPlayer) return;
    isPlayerOpen = false;
    mainPlayer.pause();
    mainPlayer.src = '';
    playerOverlay.classList.remove('active');
    playerOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearTimeout(uiHideTimer);
    // restore focus to the card that was playing
    restoreFocus();
}

playerBack?.addEventListener('click', closePlayer);

// Play / Pause
function togglePlayPause() {
    if (!mainPlayer) return;
    if (mainPlayer.paused) {
        mainPlayer.play().catch(() => {});
    } else {
        mainPlayer.pause();
    }
    showPlayerUI();
}

btnPlayPause?.addEventListener('click', togglePlayPause);

mainPlayer?.addEventListener('play', () => {
    playIcon?.classList.replace('fa-play', 'fa-pause');
    showPlayerUI();
});

mainPlayer?.addEventListener('pause', () => {
    playIcon?.classList.replace('fa-pause', 'fa-play');
    showPlayerUI(); // keep visible when paused
    clearTimeout(uiHideTimer);
});

mainPlayer?.addEventListener('ended', () => {
    playIcon?.classList.replace('fa-pause', 'fa-play');
    showPlayerUI();
    clearTimeout(uiHideTimer);
});

// Rewind / Forward
btnRewind?.addEventListener('click', () => {
    if (!mainPlayer) return;
    mainPlayer.currentTime = Math.max(0, mainPlayer.currentTime - 10);
    showPlayerUI();
});

btnForward?.addEventListener('click', () => {
    if (!mainPlayer) return;
    mainPlayer.currentTime = Math.min(mainPlayer.duration || Infinity, mainPlayer.currentTime + 10);
    showPlayerUI();
});

// Fullscreen
btnFullscreen?.addEventListener('click', () => {
    const el = playerOverlay;
    if (!el) return;
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
    } else {
        el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    }
    showPlayerUI();
});

// Progress bar
function updateProgress() {
    if (!mainPlayer || !mainPlayer.duration) return;
    const pct = (mainPlayer.currentTime / mainPlayer.duration) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressThumb) progressThumb.style.left  = pct + '%';
    if (playerCurrentTime) playerCurrentTime.textContent = fmtTime(mainPlayer.currentTime);
    if (playerDuration)    playerDuration.textContent    = fmtTime(mainPlayer.duration);
}

mainPlayer?.addEventListener('timeupdate', updateProgress);
mainPlayer?.addEventListener('loadedmetadata', updateProgress);

progressBar?.addEventListener('click', (e) => {
    if (!mainPlayer || !mainPlayer.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    mainPlayer.currentTime = pct * mainPlayer.duration;
    showPlayerUI();
});

// Move mouse → show UI
playerOverlay?.addEventListener('mousemove', showPlayerUI);
playerOverlay?.addEventListener('click', (e) => {
    // clicking video itself toggles play
    if (e.target === mainPlayer) { togglePlayPause(); return; }
    showPlayerUI();
});

// ─── D-PAD NAVIGATION ────────────────────────
// Samsung TV remote sends standard arrow keys + Enter + Escape/Return

function getFocusables(group) {
    if (group) return Array.from(document.querySelectorAll(`.focusable[data-nav-group="${group}"]`))
                          .filter(el => el.offsetParent !== null);
    return Array.from(document.querySelectorAll('.focusable'))
                .filter(el => el.offsetParent !== null);
}

function getCurrentFocused() {
    return document.activeElement;
}

// Grid-aware D-pad navigation
function navigateGrid(direction) {
    const cards = getFocusables('files');
    if (!cards.length) return false;

    const active = getCurrentFocused();
    const idx = cards.indexOf(active);

    if (idx < 0) {
        cards[0].focus();
        focusedCardIndex = 0;
        return true;
    }

    // Calculate grid columns
    let cols = 1;
    if (fileGrid) {
        const style = getComputedStyle(fileGrid);
        cols = style.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    }

    let next = -1;
    if (direction === 'right' && idx < cards.length - 1)  next = idx + 1;
    if (direction === 'left'  && idx > 0)                  next = idx - 1;
    if (direction === 'down'  && idx + cols < cards.length) next = idx + cols;
    if (direction === 'up'    && idx - cols >= 0)           next = idx - cols;

    if (next >= 0 && next < cards.length) {
        cards[next].focus();
        cards[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        focusedCardIndex = next;
        return true;
    }
    return false;
}

function navigateLibraries(direction) {
    const cards = getFocusables('libraries');
    if (!cards.length) return false;

    const active = getCurrentFocused();
    const idx = cards.indexOf(active);

    if (idx < 0) {
        cards[0].focus();
        return true;
    }

    let next = -1;
    if (direction === 'right' && idx < cards.length - 1) next = idx + 1;
    if (direction === 'left'  && idx > 0)                 next = idx - 1;

    if (next >= 0) {
        cards[next].focus();
        return true;
    }
    return false;
}

function restoreFocus() {
    const cards = getFocusables('files');
    if (focusedCardIndex >= 0 && focusedCardIndex < cards.length) {
        cards[focusedCardIndex].focus();
    }
}

// ─── KEYBOARD / REMOTE HANDLER ───────────────
window.addEventListener('keydown', (e) => {

    // ── PLAYER OPEN ──
    if (isPlayerOpen) {
        switch (e.key) {
            case 'Escape':
            case 'XF86Back':       // Samsung back button
            case 'BrowserBack':
                e.preventDefault();
                closePlayer();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (mainPlayer) mainPlayer.currentTime = Math.max(0, mainPlayer.currentTime - 10);
                showPlayerUI();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (mainPlayer) mainPlayer.currentTime = Math.min(mainPlayer.duration || 1e9, mainPlayer.currentTime + 10);
                showPlayerUI();
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (mainPlayer) mainPlayer.volume = Math.min(1, mainPlayer.volume + 0.1);
                showPlayerUI();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (mainPlayer) mainPlayer.volume = Math.max(0, mainPlayer.volume - 0.1);
                showPlayerUI();
                break;
        }
        return; // swallow all keys when player open
    }

    // ── MODAL OPEN ──
    if (folderModal?.classList.contains('active')) {
        if (e.key === 'Escape') closeModal();
        return;
    }

    // ── NAVIGATION ──
    const active = getCurrentFocused();
    const group = active?.dataset?.navGroup;

    switch (e.key) {
        case 'ArrowRight':
            e.preventDefault();
            if (group === 'libraries') { navigateLibraries('right'); break; }
            navigateGrid('right');
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (group === 'libraries') { navigateLibraries('left'); break; }
            navigateGrid('left');
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (group === 'libraries') { /* fall through to files */ break; }
            navigateGrid('down');
            break;
        case 'ArrowUp':
            e.preventDefault();
            navigateGrid('up');
            break;
        case 'Enter':
        case ' ':
            if (active && active.classList.contains('file-card')) {
                e.preventDefault();
                const url  = active.dataset.previewUrl;
                const name = active.dataset.fileName;
                if (url && active.dataset.isVideo === 'true') {
                    openPlayer(url, name);
                }
            }
            break;
        case 'Escape':
        case 'XF86Back':
            closeModal();
            break;
    }
});

// ─── FILE CARD CLICK ─────────────────────────
fileGrid?.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) return; // ignore delete clicks
    const card = e.target.closest('.file-card');
    if (!card) return;
    const url  = card.dataset.previewUrl;
    const name = card.dataset.fileName;
    if (url && card.dataset.isVideo === 'true') {
        focusedCardIndex = getFocusables('files').indexOf(card);
        openPlayer(url, name);
    }
});

// ─── AUTO-FOCUS FIRST ITEM ───────────────────
window.addEventListener('DOMContentLoaded', () => {
    const first = document.querySelector('.focusable[data-nav-group="files"], .focusable[data-nav-group="libraries"]');
    if (first) {
        setTimeout(() => first.focus(), 200);
    }
});

// ─── SAMSUNG TV: prevent scroll bounce ───────
document.addEventListener('touchmove', (e) => {
    if (isPlayerOpen) e.preventDefault();
}, { passive: false });