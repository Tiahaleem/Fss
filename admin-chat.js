// =========================
// ADMIN LIVE CHAT
// =========================

let conversations = [];
let activeConversationId = null;
let refreshInterval = null;

const listEl = document.getElementById("chat-conversation-list");
const threadEmpty = document.getElementById("chat-thread-empty");
const threadActive = document.getElementById("chat-thread-active");
const threadName = document.getElementById("chat-thread-name");
const threadEmail = document.getElementById("chat-thread-email");
const threadMessages = document.getElementById("chat-thread-messages");
const replyForm = document.getElementById("chat-reply-form");
const replyInput = document.getElementById("chat-reply-input");
const closeBtn = document.getElementById("chat-close-btn");

function timeAgo(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

async function loadConversations() {
    try {
        conversations = await apiFetch("/api/chat/conversations");
        renderConversationList();
    } catch (err) {
        listEl.innerHTML = `<div class="admin-empty">Couldn't load conversations.</div>`;
    }
}

function renderConversationList() {
    if (conversations.length === 0) {
        listEl.innerHTML = `<div class="admin-empty">No conversations yet.</div>`;
        return;
    }

    listEl.innerHTML = conversations.map(c => `
        <button class="admin-chat-conversation-item ${c.id === activeConversationId ? "active" : ""}" data-id="${c.id}">
            <div class="name-row">
                <strong>${escapeHtml(c.customerName)}</strong>
                ${c.unreadByAdmin ? '<span class="unread-dot"></span>' : ""}
            </div>
            <time>${timeAgo(c.lastMessageAt)} · ${c.status === "closed" ? "Closed" : "Open"}</time>
        </button>
    `).join("");

    listEl.querySelectorAll("[data-id]").forEach(btn => {
        btn.addEventListener("click", () => openConversation(btn.dataset.id));
    });
}

async function openConversation(id) {
    activeConversationId = id;
    renderConversationList(); // re-render so the active highlight and cleared unread dot show immediately

    try {
        const result = await apiFetch(`/api/chat/conversations/${id}`);

        threadEmpty.style.display = "none";
        threadActive.style.display = "flex";

        threadName.textContent = result.conversation.customerName;
        threadEmail.textContent = result.conversation.customerEmail || "";
        closeBtn.style.display = result.conversation.status === "closed" ? "none" : "";
        replyForm.style.display = result.conversation.status === "closed" ? "none" : "flex";

        renderMessages(result.messages);

        // Reflect the now-cleared unread state locally too, so the
        // next automatic list refresh doesn't show a flash of the
        // old "unread" dot before the server's own refresh catches up.
        const conv = conversations.find(c => c.id === id);
        if (conv) conv.unreadByAdmin = false;
    } catch (err) {
        showToast(err.message);
    }
}

function renderMessages(messages) {
    threadMessages.innerHTML = messages.map(m => `
        <div class="admin-chat-msg ${m.sender}">${escapeHtml(m.message)}</div>
    `).join("");
    threadMessages.scrollTop = threadMessages.scrollHeight;
}

replyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = replyInput.value.trim();
    if (!message || !activeConversationId) return;

    replyInput.value = "";

    try {
        await apiFetch(`/api/chat/conversations/${activeConversationId}/reply`, {
            method: "POST",
            body: JSON.stringify({ message })
        });
        await openConversation(activeConversationId);
        await loadConversations();
    } catch (err) {
        showToast(err.message);
    }
});

closeBtn.addEventListener("click", async () => {
    if (!activeConversationId) return;

    try {
        await apiFetch(`/api/chat/conversations/${activeConversationId}/close`, { method: "PUT" });
        showToast("Conversation closed.", "success");
        await openConversation(activeConversationId);
        await loadConversations();
    } catch (err) {
        showToast(err.message);
    }
});

loadConversations();

// Keep the inbox feeling reasonably live without needing a full
// real-time connection — matches the same polling interval the
// customer-facing widget uses.
refreshInterval = setInterval(async () => {
    await loadConversations();
    if (activeConversationId) {
        try {
            const result = await apiFetch(`/api/chat/conversations/${activeConversationId}`);
            renderMessages(result.messages);
        } catch (err) {
            // Conversation might have been removed — just leave the
            // last-known state showing rather than erroring loudly.
        }
    }
}, 5000);