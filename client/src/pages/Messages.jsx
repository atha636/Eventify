import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getConversations, getMessages, sendMessage } from "../services/chatService";

function timeShort(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const me = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [activeId, setActiveId] = useState(searchParams.get("c") || null);
  const [thread, setThread]     = useState(null);   // { other, service }
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [draft, setDraft]   = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState("");

  const scrollRef = useRef(null);
  const listPollRef   = useRef(null);
  const threadPollRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
  }, [token, navigate]);

  // ── Conversation list: load + poll every 15s ─────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch { /* keep last known list on transient failure */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadConversations();
    listPollRef.current = setInterval(loadConversations, 15000);
    return () => clearInterval(listPollRef.current);
  }, [token, loadConversations]);

  // ── Active thread: load + poll every 4s while open ───────────────
  const loadThread = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return;
    if (!silent) setLoadingThread(true);
    try {
      const data = await getMessages(id);
      setThread(data.conversation);
      setMessages(data.messages || []);
      // Opening/polling a thread clears its unread badge server-side —
      // reflect that locally too so the list doesn't lag behind.
      setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)));
    } catch {
      if (!silent) setError("Couldn't load this conversation.");
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    clearInterval(threadPollRef.current);
    if (!activeId) { setThread(null); setMessages([]); return; }
    loadThread(activeId);
    threadPollRef.current = setInterval(() => loadThread(activeId, { silent: true }), 4000);
    return () => clearInterval(threadPollRef.current);
  }, [activeId, loadThread]);

  // Keep the URL's ?c= in sync so a refresh/share reopens the same thread
  useEffect(() => {
    if (activeId) setSearchParams({ c: activeId }, { replace: true });
  }, [activeId, setSearchParams]);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    setError("");
    // Optimistic append
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, senderId: me.id, text, createdAt: new Date().toISOString(), pending: true }]);
    setDraft("");
    try {
      const res = await sendMessage(activeId, text);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? res.message : m)));
      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError(typeof err === "string" ? err : "Message failed to send.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (id) => setActiveId(id);
  const backToList = () => setActiveId(null);

  const isMine = (m) => (m.senderId?._id || m.senderId) === me.id || (m.senderId?._id || m.senderId) === me._id;

  return (
    <>
      <style>{styles}</style>
      <div className="msg-root">
        <Navbar />
        <div className="msg-shell">
          {/* ── Conversation list ── */}
          <aside className={`msg-sidebar ${activeId ? "msg-sidebar-hide-mobile" : ""}`}>
            <div className="msg-sidebar-header">
              <h1 className="msg-title">Messages</h1>
            </div>
            {loadingList ? (
              <div className="msg-empty-state">Loading conversations…</div>
            ) : conversations.length === 0 ? (
              <div className="msg-empty-state">
                <p>No conversations yet.</p>
                <p className="msg-empty-sub">Message a vendor from their service page to start one.</p>
              </div>
            ) : (
              <div className="msg-conv-list">
                {conversations.map((c) => (
                  <button
                    key={c._id}
                    className={`msg-conv-row ${activeId === c._id ? "active" : ""}`}
                    onClick={() => selectConversation(c._id)}
                  >
                    <span className="msg-conv-avatar">{(c.other?.name || "?").charAt(0).toUpperCase()}</span>
                    <span className="msg-conv-main">
                      <span className="msg-conv-top">
                        <span className="msg-conv-name">{c.other?.name || "Unknown"}</span>
                        {c.lastMessage?.createdAt && <span className="msg-conv-time">{timeShort(c.lastMessage.createdAt)}</span>}
                      </span>
                      <span className="msg-conv-bottom">
                        <span className="msg-conv-preview">
                          {c.service?.title && <span className="msg-conv-service">{c.service.title}: </span>}
                          {c.lastMessage?.text || "No messages yet"}
                        </span>
                        {c.unreadCount > 0 && <span className="msg-conv-badge">{c.unreadCount > 9 ? "9+" : c.unreadCount}</span>}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* ── Active thread ── */}
          <main className={`msg-thread ${!activeId ? "msg-thread-hide-mobile" : ""}`}>
            {!activeId ? (
              <div className="msg-no-thread">
                <p>Select a conversation to start chatting.</p>
              </div>
            ) : (
              <>
                <div className="msg-thread-header">
                  <button className="msg-back-btn" onClick={backToList} aria-label="Back to conversations">←</button>
                  <span className="msg-conv-avatar">{(thread?.other?.name || "?").charAt(0).toUpperCase()}</span>
                  <div className="msg-thread-header-info">
                    <span className="msg-thread-name">{thread?.other?.name || "…"}</span>
                    {thread?.service?.title && <span className="msg-thread-service">Re: {thread.service.title}</span>}
                  </div>
                </div>

                <div className="msg-scroll" ref={scrollRef}>
                  {loadingThread ? (
                    <div className="msg-empty-state">Loading…</div>
                  ) : messages.length === 0 ? (
                    <div className="msg-empty-state">Say hello 👋</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id} className={`msg-bubble-row ${isMine(m) ? "mine" : ""}`}>
                        <div className={`msg-bubble ${isMine(m) ? "mine" : ""} ${m.pending ? "pending" : ""}`}>
                          {m.text}
                          <span className="msg-bubble-time">{timeShort(m.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {error && <div className="msg-error">{error}</div>}

                <div className="msg-composer">
                  <input
                    className="msg-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    maxLength={2000}
                  />
                  <button className="msg-send-btn" onClick={handleSend} disabled={sending || !draft.trim()}>
                    Send
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

const styles = `
  .msg-root { font-family: 'DM Sans', sans-serif; background: #f5f0e8; min-height: 100vh; }
  .msg-shell {
    max-width: 1100px; margin: 0 auto; padding: 96px 20px 24px;
    display: grid; grid-template-columns: 320px 1fr; gap: 20px;
    height: 100vh; box-sizing: border-box;
  }

  .msg-sidebar {
    background: #fff; border: 1px solid rgba(201,168,76,0.2); border-radius: 14px;
    display: flex; flex-direction: column; overflow: hidden;
    max-height: calc(100vh - 120px);
  }
  .msg-sidebar-header { padding: 18px 18px 12px; border-bottom: 1px solid rgba(201,168,76,0.12); }
  .msg-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: #0e0c0a; margin: 0; }

  .msg-conv-list { overflow-y: auto; flex: 1; }
  .msg-conv-row {
    width: 100%; display: flex; gap: 10px; align-items: flex-start;
    padding: 12px 16px; background: none; border: none; border-bottom: 1px solid rgba(201,168,76,0.08);
    cursor: pointer; text-align: left; transition: background 0.15s;
  }
  .msg-conv-row:hover { background: #faf7f2; }
  .msg-conv-row.active { background: rgba(201,168,76,0.08); }
  .msg-conv-avatar {
    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
    background: #0e0c0a; color: #c9a84c; font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1.05rem;
    display: flex; align-items: center; justify-content: center; border: 2px solid rgba(201,168,76,0.3);
  }
  .msg-conv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .msg-conv-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .msg-conv-name { font-size: 13px; font-weight: 600; color: #0e0c0a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .msg-conv-time { font-size: 10.5px; color: #a09888; flex-shrink: 0; }
  .msg-conv-bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .msg-conv-preview { font-size: 12px; color: #7a7265; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .msg-conv-service { color: #a07b28; font-weight: 500; }
  .msg-conv-badge {
    min-width: 17px; height: 17px; border-radius: 9px; background: #c9a84c; color: #0e0c0a;
    font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; flex-shrink: 0;
  }

  .msg-empty-state { padding: 32px 18px; text-align: center; color: #a09888; font-size: 12.5px; }
  .msg-empty-sub { font-size: 11.5px; margin-top: 6px; }

  .msg-thread {
    background: #fff; border: 1px solid rgba(201,168,76,0.2); border-radius: 14px;
    display: flex; flex-direction: column; overflow: hidden; max-height: calc(100vh - 120px);
  }
  .msg-no-thread { flex: 1; display: flex; align-items: center; justify-content: center; color: #a09888; font-size: 13px; }

  .msg-thread-header {
    display: flex; align-items: center; gap: 10px; padding: 14px 18px;
    border-bottom: 1px solid rgba(201,168,76,0.12); background: #faf7f2; flex-shrink: 0;
  }
  .msg-back-btn { display: none; background: none; border: none; font-size: 18px; cursor: pointer; color: #0e0c0a; padding: 4px; }
  .msg-thread-header-info { display: flex; flex-direction: column; min-width: 0; }
  .msg-thread-name { font-size: 13.5px; font-weight: 600; color: #0e0c0a; }
  .msg-thread-service { font-size: 11px; color: #a07b28; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .msg-scroll { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }

  .msg-bubble-row { display: flex; }
  .msg-bubble-row.mine { justify-content: flex-end; }
  .msg-bubble {
    max-width: 72%; background: #faf7f2; border: 1px solid rgba(201,168,76,0.18);
    border-radius: 14px 14px 14px 4px; padding: 9px 13px; font-size: 13px; color: #0e0c0a;
    line-height: 1.5; position: relative; word-wrap: break-word;
  }
  .msg-bubble.mine {
    background: #0e0c0a; color: #f5f0e8; border-color: #0e0c0a;
    border-radius: 14px 14px 4px 14px;
  }
  .msg-bubble.pending { opacity: 0.6; }
  .msg-bubble-time { display: block; font-size: 9.5px; opacity: 0.6; margin-top: 4px; text-align: right; }

  .msg-error { padding: 6px 18px; font-size: 11.5px; color: #b85c5c; }

  .msg-composer { display: flex; gap: 8px; padding: 14px 16px; border-top: 1px solid rgba(201,168,76,0.12); flex-shrink: 0; }
  .msg-input {
    flex: 1; padding: 10px 14px; border: 1px solid rgba(201,168,76,0.25); border-radius: 22px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; background: #faf7f2;
  }
  .msg-input:focus { border-color: #c9a84c; }
  .msg-send-btn {
    background: #0e0c0a; color: #fff; border: none; border-radius: 22px; padding: 10px 20px;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;
  }
  .msg-send-btn:hover:not(:disabled) { background: #c9a84c; color: #0e0c0a; }
  .msg-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 760px) {
    .msg-shell { grid-template-columns: 1fr; padding: 84px 12px 12px; height: 100vh; }
    .msg-sidebar, .msg-thread { max-height: calc(100vh - 96px); }
    .msg-sidebar-hide-mobile { display: none; }
    .msg-thread-hide-mobile { display: none; }
    .msg-back-btn { display: block; }
  }
`;