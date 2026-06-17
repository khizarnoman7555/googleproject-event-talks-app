document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releasesData = [];
    let activeFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const refreshIcon = btnRefresh.querySelector('.spinner-icon');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const notesFeed = document.getElementById('notes-feed');
    
    const loadingContainer = document.getElementById('loading-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const btnRetry = document.getElementById('btn-retry');
    const emptyContainer = document.getElementById('empty-container');
    const btnClearFilters = document.getElementById('btn-clear-filters');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statAnnouncements = document.getElementById('stat-announcements');
    const statBreaking = document.getElementById('stat-breaking');
    const statCards = document.querySelectorAll('.stat-card');

    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnCopyTweet = document.getElementById('btn-copy-tweet');
    const btnPublishTweet = document.getElementById('btn-publish-tweet');

    // Toast element
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Fetch and load data
    async function fetchReleases(isRefresh = false) {
        // UI loading state
        showState('loading');
        if (isRefresh) {
            refreshIcon.classList.add('spinning');
            btnRefresh.disabled = true;
        }

        try {
            const response = await fetch('/api/releases');
            if (!response.ok) throw new Error('API server returned error');
            const data = await response.json();
            
            if (data.success) {
                releasesData = data.updates;
                updateStats();
                renderFeed();
                showState('feed');
            } else {
                throw new Error(data.error || 'Failed to fetch release notes');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            errorMessage.textContent = error.message;
            showState('error');
        } finally {
            if (isRefresh) {
                refreshIcon.classList.remove('spinning');
                btnRefresh.disabled = false;
            }
        }
    }

    // Helper to calculate and display statistics
    function updateStats() {
        statTotal.textContent = releasesData.length;
        statFeatures.textContent = releasesData.filter(u => u.type === 'Feature').length;
        statAnnouncements.textContent = releasesData.filter(u => u.type === 'Announcement').length;
        statBreaking.textContent = releasesData.filter(u => u.type === 'Breaking').length;
    }

    // Render logic for the main feed
    function renderFeed() {
        // Clear previous notes
        notesFeed.innerHTML = '';

        // Filter releases
        const filtered = releasesData.filter(item => {
            const matchesFilter = activeFilter === 'all' || item.type.toLowerCase() === activeFilter.toLowerCase();
            const matchesSearch = searchQuery === '' || 
                item.text.toLowerCase().includes(searchQuery) ||
                item.type.toLowerCase().includes(searchQuery) ||
                item.date.toLowerCase().includes(searchQuery);
            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            showState('empty');
            return;
        }

        showState('feed');

        // Build release cards
        filtered.forEach(item => {
            const card = document.createElement('article');
            card.className = 'note-card';
            card.dataset.id = item.id;
            
            const badgeClass = `badge badge-${item.type.toLowerCase()}`;
            
            card.innerHTML = `
                <div class="note-header">
                    <div class="note-meta">
                        <span class="${badgeClass}">${item.type}</span>
                        <span class="note-date">${item.date}</span>
                    </div>
                    ${item.link ? `
                    <a href="${item.link}" target="_blank" class="note-link" title="Open original release note page">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                    ` : ''}
                </div>
                <div class="note-body">
                    ${item.html}
                </div>
                <div class="note-actions">
                    <button class="btn-card btn-copy" title="Copy text contents">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn-card btn-tweet" title="Tweet about this release">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet</span>
                    </button>
                </div>
            `;

            // Event Listeners for actions
            card.querySelector('.btn-copy').addEventListener('click', () => {
                copyToClipboard(item.text, 'Release note copied to clipboard!');
            });

            card.querySelector('.btn-tweet').addEventListener('click', () => {
                openTweetModal(item.tweet_text);
            });

            notesFeed.appendChild(card);
        });
    }

    // Manage container state displays
    function showState(state) {
        loadingContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        emptyContainer.classList.add('hidden');
        notesFeed.classList.add('hidden');

        if (state === 'loading') {
            loadingContainer.classList.remove('hidden');
        } else if (state === 'error') {
            errorContainer.classList.remove('hidden');
        } else if (state === 'empty') {
            emptyContainer.classList.remove('hidden');
        } else if (state === 'feed') {
            notesFeed.classList.remove('hidden');
        }
    }

    // Copy to clipboard helper
    function copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            // Fallback copy
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(successMessage);
            } catch (err) {
                showToast('Failed to copy text.');
            }
            document.body.removeChild(textArea);
        });
    }

    // Toast Notifications
    let toastTimeout;
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Tweet Composer Modal
    function openTweetModal(defaultText) {
        tweetTextarea.value = defaultText;
        updateCharCount();
        tweetModal.classList.remove('hidden');
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.add('hidden');
    }

    function updateCharCount() {
        const textLength = tweetTextarea.value.length;
        const remaining = 280 - textLength;
        charCounter.textContent = remaining;

        charCounter.classList.remove('warning', 'error');
        if (remaining <= 20 && remaining >= 0) {
            charCounter.classList.add('warning');
        } else if (remaining < 0) {
            charCounter.classList.add('error');
        }
    }

    // Modal Events
    btnCloseModal.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    tweetTextarea.addEventListener('input', updateCharCount);

    btnCopyTweet.addEventListener('click', () => {
        copyToClipboard(tweetTextarea.value, 'Tweet content copied!');
    });

    btnPublishTweet.addEventListener('click', () => {
        const tweetText = tweetTextarea.value;
        if (tweetText.length > 280) {
            showToast('Tweet exceeds character limit.');
            return;
        }
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
    });

    // Refresh and Search Event Handlers
    btnRefresh.addEventListener('click', () => fetchReleases(true));
    btnRetry.addEventListener('click', () => fetchReleases(false));
    
    btnClearFilters.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        activeFilter = 'all';
        filterButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.filter === 'all');
        });
        renderFeed();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().strip ? e.target.value.toLowerCase().strip() : e.target.value.toLowerCase();
        renderFeed();
    });

    // Sidebar and controls filter interactions
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderFeed();
        });
    });

    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterVal = card.dataset.stat;
            activeFilter = filterVal;
            
            // Sync control button state
            filterButtons.forEach(b => {
                b.classList.toggle('active', b.dataset.filter.toLowerCase() === filterVal.toLowerCase());
            });
            renderFeed();
        });
    });

    // Initialize
    fetchReleases();
});
