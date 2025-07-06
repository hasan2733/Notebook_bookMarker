document.addEventListener('DOMContentLoaded', init);

function init() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Load saved note
  chrome.storage.local.get(['userNote'], (result) => {
    document.getElementById('note').value = result.userNote || '';
  });

  // Save note
  document.getElementById('save-note').addEventListener('click', () => {
    const note = document.getElementById('note').value;
    if (!note.trim()) {
      showStatus('note-status', 'Please write something to save!', true);
      return;
    }
    
    chrome.storage.local.set({ userNote: note }, () => {
      showStatus('note-status', 'Note saved successfully!');
    });
  });

  // Save bookmark
  document.getElementById('save-bookmark').addEventListener('click', saveBookmark);
  
  // Load initial bookmarks
  loadBookmarks();
}

function saveBookmark() {
  const url = document.getElementById('url').value;
  const title = document.getElementById('title').value;
  
  if (!url || !title) {
    showStatus('bookmark-status', 'Please fill both fields!', true);
    return;
  }
  
  // Validate URL format
  if (!isValidUrl(url)) {
    showStatus('bookmark-status', 'Please enter a valid URL!', true);
    return;
  }
  
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    
    // Check for duplicates
    if (bookmarks.some(bm => bm.url === url)) {
      showStatus('bookmark-status', 'This URL is already bookmarked!', true);
      return;
    }
    
    bookmarks.push({ url, title });
    chrome.storage.local.set({ bookmarks }, () => {
      document.getElementById('url').value = '';
      document.getElementById('title').value = '';
      showStatus('bookmark-status', 'Bookmark added successfully!');
      loadBookmarks();
    });
  });
}

function loadBookmarks() {
  const list = document.getElementById('bookmarks-list');
  list.innerHTML = '';
  
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    if (result.bookmarks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔖</div>
          <p>No bookmarks saved yet</p>
          <p>Add your first bookmark above!</p>
        </div>
      `;
      return;
    }
    
    result.bookmarks.forEach((bm, index) => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.innerHTML = `
        <div class="bookmark-title">${bm.title}</div>
        <a href="${bm.url}" target="_blank" class="bookmark-url">${bm.url}</a>
        <div class="bookmark-actions">
          <button class="action-btn delete-btn" data-index="${index}">
            <span>🗑️</span> Delete
          </button>
        </div>
      `;
      list.appendChild(item);
    });
    
    // Add delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        deleteBookmark(index);
      });
    });
  });
}

function deleteBookmark(index) {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    const deletedTitle = bookmarks[index].title;
    bookmarks.splice(index, 1);
    chrome.storage.local.set({ bookmarks }, () => {
      showStatus('bookmark-status', `Deleted: ${deletedTitle}`);
      loadBookmarks();
    });
  });
}

function showStatus(elementId, message, isError = false) {
  const status = document.getElementById(elementId);
  status.textContent = message;
  status.className = `status ${isError ? 'error' : 'success'} visible`;
  
  setTimeout(() => {
    if (status.textContent === message) {
      status.className = 'status';
    }
  }, 3000);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}