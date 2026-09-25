// =========================
// LIVE CHAT WIDGET
// =========================
// Entirely self-contained — injects its own HTML and CSS, so adding
// chat to any page is just one script tag, not editing that page's
// markup. Depends on api.js already being loaded first (uses
// apiFetch, escapeHtml).

(function () {
    const STORAGE_KEY = "fss_chat_conversation_id";
    let conversationId = localStorage.getItem(STORAGE_KEY);
    let pollInterval = null;
    let isOpen = false;

    const styles = `
        #fss-chat-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--color-navy-deep, #081f5c);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,.2);
            z-index: 9998;
        }
        #fss-chat-panel {
            position: fixed;
            bottom: 92px;
            right: 24px;
            width: 320px;
            max-width: calc(100vw - 32px);
            height: 420px;
            max-height: calc(100vh - 140px);
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,.25);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            font-family: inherit;
        }
        #fss-chat-panel.open { display: flex; }
        #fss-chat-header {
            background: var(--color-navy-deep, #081f5c);
            color: white;
            padding: 14px 16px;
            font-weight: 700;
            font-size: .9rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #fss-chat-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.1rem;
        }
        #fss-chat-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .fss-chat-msg {
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: .85rem;
            line-height: 1.4;
        }
        .fss-chat-msg.customer {
            align-self: flex-end;
            background: var(--color-cyan, #08b6d6);
            color: white;
        }
        .fss-chat-msg.admin {
            align-self: flex-start;
            background: #f1f5f9;
            color: #0f172a;
        }
        #fss-chat-start-form, #fss-chat-input-row {
            padding: 10px;
            border-top: 1px solid #e7edf3;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        #fss-chat-input-row { flex-direction: row; }
        #fss-chat-start-form input, #fss-chat-input-row input {
            padding: 9px 12px;
            border: 1px solid #e7edf3;
            border-radius: 8px;
            font-size: .85rem;
            font-family: inherit;
        }
        #fss-chat-input-row input { flex: 1; }
        #fss-chat-start-form button, #fss-chat-input-row button {
            padding: 9px 14px;
            background: var(--color-navy-deep, #081f5c);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: .85rem;
            cursor: pointer;
        }
        #fss-chat-error {
            padding: 0 10px;
            color: #dc2626;
            font-size: .75rem;
        }
        #fss-chat-closed-notice {
            padding: 12px;
            text-align: center;
            color: #64748b;
            font-size: .8rem;
        }
    `;

    const styleTag = document.createElement("style");
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);

    const bubble = document.createElement("button");
    bubble.id = "fss-chat-bubble";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    document.body.appendChild(bubble);

    const panel = document.createElement("div");
    panel.id = "fss-chat-panel";
    panel.innerHTML = `
        <div id="fss-chat-header">
            <span>FSS Transport Support</span>
            <button id="fss-chat-close" aria-label="Close chat">✕</button>
        </div>
        <div id="fss-chat-body"></div>
        <p id="fss-chat-error" style="display:none;"></p>
        <form id="fss-chat-start-form">
            <input type="text" id="fss-chat-name" placeholder="Your name" required>
            <input type="email" id="fss-chat-email" placeholder="Your email (optional)">
            <input type="text" id="fss-chat-first-message" placeholder="How can we help?" required>
            <button type="submit">Start Chat</button>
        </form>
        <form id="fss-chat-input-row" style="display:none;">
            <input type="text" id="fss-chat-message-input" placeholder="Type a message…">
            <button type="submit">Send</button>
        </form>
    `;
    document.body.appendChild(panel);

    const body = panel.querySelector("#fss-chat-body");
    const errorEl = panel.querySelector("#fss-chat-error");
    const startForm = panel.querySelector("#fss-chat-start-form");
    const inputRow = panel.querySelector("#fss-chat-input-row");
    const messageInput = panel.querySelector("#fss-chat-message-input");

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
    }

    function renderMessages(messages, status) {
        body.innerHTML = messages.map(m => `
            <div class="fss-chat-msg ${m.sender}">${escapeHtml(m.message)}</div>
        `).join("");
        body.scrollTop = body.scrollHeight;

        if (status === "closed") {
            inputRow.style.display = "none";
            if (!body.querySelector(".fss-chat-closed-notice")) {
                body.insertAdjacentHTML("beforeend", `<p class="fss-chat-closed-notice">This conversation has been closed.</p>`);
            }
        }
    }

    async function pollMessages() {
        if (!conversationId) return;
        try {
            const result = await apiFetch(`/api/chat/conversations/${conversationId}/messages`);
            renderMessages(result.messages, result.status);
        } catch (err) {
            // A vanished/invalid conversation just quietly resets —
            // no need to alarm the customer over a stale local id.
            localStorage.removeItem(STORAGE_KEY);
            conversationId = null;
        }
    }

    function startPolling() {
        clearInterval(pollInterval);
        pollInterval = setInterval(pollMessages, 4000);
    }

    async function openPanel() {
        isOpen = true;
        panel.classList.add("open");

        if (conversationId) {
            startForm.style.display = "none";
            inputRow.style.display = "flex";
            await pollMessages();
            startPolling();
        } else {
            startForm.style.display = "flex";
            inputRow.style.display = "none";
        }
    }

    function closePanel() {
        isOpen = false;
        panel.classList.remove("open");
        clearInterval(pollInterval);
    }

    bubble.addEventListener("click", () => {
        if (isOpen) closePanel();
        else openPanel();
    });

    panel.querySelector("#fss-chat-close").addEventListener("click", closePanel);

    startForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorEl.style.display = "none";

        const name = panel.querySelector("#fss-chat-name").value.trim();
        const email = panel.querySelector("#fss-chat-email").value.trim();
        const message = panel.querySelector("#fss-chat-first-message").value.trim();

        if (!name || !message) return;

        try {
            const result = await apiFetch("/api/chat/conversations", {
                method: "POST",
                body: JSON.stringify({ customerName: name, customerEmail: email || null, message })
            });

            conversationId = result.conversationId;
            localStorage.setItem(STORAGE_KEY, conversationId);

            startForm.style.display = "none";
            inputRow.style.display = "flex";

            await pollMessages();
            startPolling();
        } catch (err) {
            showError(err.message);
        }
    });

    inputRow.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message || !conversationId) return;

        messageInput.value = "";
        errorEl.style.display = "none";

        try {
            await apiFetch(`/api/chat/conversations/${conversationId}/messages`, {
                method: "POST",
                body: JSON.stringify({ message })
            });
            await pollMessages();
        } catch (err) {
            showError(err.message);
        }
    });
})();