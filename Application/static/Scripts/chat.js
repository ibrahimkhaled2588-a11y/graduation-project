(function () {
    'use strict';

    const STORAGE_KEY = 'shifaa_chat_history';

    const chatContainer = document.getElementById('chat-container');
    const chatInput    = document.getElementById('chat-input');
    const chatForm     = document.getElementById('chatForm');
    const defaultWelcome = document.getElementById('default-welcome');
    const historyList  = document.getElementById('history-list');
    const clearBtn     = document.getElementById('clear-chat');
    const navbar       = document.getElementById('Navebar');
    const menu         = document.getElementById('menu');
    const rightNav     = document.getElementById('n-right');

    // ── Helpers ──────────────────────────────────────────────────────────────

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function scrollToBottom() {
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showDefault(show) {
        if (defaultWelcome) defaultWelcome.style.display = show ? '' : 'none';
    }

    // ── History (localStorage) ────────────────────────────────────────────────

    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    let history = loadHistory();

    // ── DOM builders ──────────────────────────────────────────────────────────

    function buildBubble(text, type) {
        const wrap = document.createElement('div');
        wrap.className = `chat ${type}`;
        const content = document.createElement('div');
        content.className = 'chat-content';
        const p = document.createElement('p');
        p.className = 'chat-message';
        if (type === 'incoming') {
            p.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
        } else {
            p.textContent = text;
        }
        content.appendChild(p);
        wrap.appendChild(content);
        return wrap;
    }

    function buildTypingIndicator() {
        const wrap = document.createElement('div');
        wrap.className = 'chat incoming typing-indicator-wrap';
        wrap.innerHTML = `
            <div class="chat-content">
                <div class="typing-animation">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>`;
        return wrap;
    }

    // ── Sidebar history list ──────────────────────────────────────────────────

    function renderSidebar() {
        if (!historyList) return;
        historyList.innerHTML = '';

        if (history.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'no-history';
            empty.textContent = 'No conversations yet';
            historyList.appendChild(empty);
            return;
        }

        history.slice().reverse().forEach(({ question }) => {
            const btn = document.createElement('button');
            btn.className = 'history-item';
            btn.title = question;
            btn.textContent = question.length > 42 ? question.slice(0, 42) + '…' : question;
            historyList.appendChild(btn);
        });
    }

    // ── Chat rendering ────────────────────────────────────────────────────────

    function renderAllMessages() {
        if (!chatContainer) return;

        // Remove previous chat bubbles, keep bg decoration and welcome card
        chatContainer.querySelectorAll('.chat').forEach(el => el.remove());

        if (history.length === 0) {
            showDefault(true);
            return;
        }

        showDefault(false);
        history.forEach(({ question, answer }) => {
            chatContainer.appendChild(buildBubble(question, 'outgoing'));
            chatContainer.appendChild(buildBubble(answer, 'incoming'));
        });
        scrollToBottom();
    }

    // ── API call ──────────────────────────────────────────────────────────────

    async function askBot(question) {
        const formData = new FormData();
        formData.append('question', question);
        const resp = await fetch('/chat_api', { method: 'POST', body: formData });
        const data = await resp.json();
        if (!resp.ok || data.error) throw new Error(data.error || 'Server error');
        return data.answer;
    }

    // ── Form submit ───────────────────────────────────────────────────────────

    async function handleSubmit(e) {
        if (e) e.preventDefault();
        if (!chatInput || !chatContainer) return;

        const question = chatInput.value.trim();
        if (!question) return;

        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';

        showDefault(false);

        // User bubble
        chatContainer.appendChild(buildBubble(question, 'outgoing'));
        scrollToBottom();

        // Typing indicator
        const typing = buildTypingIndicator();
        chatContainer.appendChild(typing);
        scrollToBottom();

        // Disable send
        const sendBtn = chatForm && chatForm.querySelector('.send-btn');
        if (sendBtn) sendBtn.disabled = true;

        try {
            const answer = await askBot(question);
            typing.remove();
            chatContainer.appendChild(buildBubble(answer, 'incoming'));
            scrollToBottom();

            history.push({ question, answer });
            saveHistory(history);
            renderSidebar();
        } catch (err) {
            typing.remove();
            const errWrap = document.createElement('div');
            errWrap.className = 'chat incoming';
            errWrap.innerHTML = `<div class="chat-content error-content">
                <p><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}</p>
            </div>`;
            chatContainer.appendChild(errWrap);
            scrollToBottom();
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────────

    if (chatForm) {
        chatForm.addEventListener('submit', handleSubmit);
    }

    if (chatInput) {
        chatInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 180) + 'px';
        });

        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.value.trim()) handleSubmit(null);
            }
        });
    }

    // Chip buttons (example questions)
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const q = chip.getAttribute('data-question');
            if (!q || !chatInput) return;
            chatInput.value = q;
            chatInput.dispatchEvent(new Event('input'));
            handleSubmit(null);
        });
    });

    // Clear history button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('Clear all chat history?')) return;
            history = [];
            saveHistory(history);
            renderAllMessages();
            renderSidebar();
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Mobile menu toggle
    if (menu) {
        menu.addEventListener('click', e => {
            e.stopPropagation();
            if (rightNav) rightNav.classList.toggle('open');
        });
    }

    document.addEventListener('click', e => {
        if (!rightNav || !menu) return;
        if (!rightNav.contains(e.target) && !menu.contains(e.target)) {
            rightNav.classList.remove('open');
        }
    });

    // ── Init ──────────────────────────────────────────────────────────────────

    renderAllMessages();
    renderSidebar();

})();
