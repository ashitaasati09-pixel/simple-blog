"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PostResult { id: string; title: string; snippet: string; author: string; createdAt: string; }
interface AuthorResult { id: string; username: string; bio: string; }
interface HistoryItem { query: string; timestamp: number; }

const HISTORY_KEY = "simpleblog_search_history";
const MAX_HISTORY = 8;
const RESULTS_PER_PAGE = 5;

function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveToHistory(query: string) {
  const t = query.trim(); if (!t) return;
  const h = getHistory().filter((x) => x.query !== t);
  h.unshift({ query: t, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
function removeFromHistory(query: string) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((x) => x.query !== query)));
}
function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now"; if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} style={{ background: "#fff3cd", color: "#92400e", fontWeight: 700, borderRadius: 2, padding: "0 1px" }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {name[0].toUpperCase()}
    </div>
  );
}
function getPaginationPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
  else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

type FilterTab = "all" | "posts" | "authors";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") || "";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inputVal, setInputVal] = useState(urlQ);
  const [query, setQuery] = useState(urlQ);
  const [focused, setFocused] = useState(false);

  // Server-paginated posts
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [postTotal, setPostTotal] = useState(0);       // total matching posts from server
  const [postTotalPages, setPostTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(urlPage);

  // Authors (always all returned — usually few)
  const [authors, setAuthors] = useState<AuthorResult[]>([]);

  const [loading, setLoading] = useState(!!urlQ);
  const [pageLoading, setPageLoading] = useState(false); // loading a new page only
  const [searched, setSearched] = useState(!!urlQ);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setHistory(getHistory()); }, []);

  // ── Core search — sends page to server ──────────────────────────────────
  const runSearch = useCallback(async (q: string, page = 1, isPageChange = false) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPosts([]); setAuthors([]); setPostTotal(0); setPostTotalPages(0);
      setSearched(false); setLoading(false); return;
    }
    if (isPageChange) setPageLoading(true);
    else { setLoading(true); setSearched(true); }

    try {
      const url = `/api/search?q=${encodeURIComponent(trimmed)}&page=${page}&limit=${RESULTS_PER_PAGE}`;
      const res = await fetch(url);
      const data = await res.json();

      setPosts(data.posts || []);
      setAuthors(data.authors || []);

      // Support both {total, totalPages} and fallback for older API
      const total = data.postTotal ?? data.total ?? (data.posts?.length ?? 0);
      const pages = data.postTotalPages ?? data.totalPages ?? Math.ceil(total / RESULTS_PER_PAGE);
      setPostTotal(total);
      setPostTotalPages(pages);
      setCurrentPage(page);
    } catch {
      setPosts([]); setAuthors([]);
    } finally {
      setLoading(false); setPageLoading(false);
    }
  }, []);

  // Run on URL ?q= or ?page= change
  useEffect(() => {
    if (urlQ) {
      setInputVal(urlQ); setQuery(urlQ);
      runSearch(urlQ, urlPage);
    } else {
      inputRef.current?.focus();
    }
  }, [urlQ, urlPage, runSearch]);

  // Debounced live search while typing (page always 1)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (inputVal.trim() && inputVal.trim() !== urlQ) runSearch(inputVal, 1);
      else if (!inputVal.trim() && !urlQ) {
        setPosts([]); setAuthors([]); setPostTotal(0); setPostTotalPages(0); setSearched(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputVal, runSearch, urlQ]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    saveToHistory(inputVal.trim()); setHistory(getHistory());
    setQuery(inputVal.trim()); setFocused(false); setActiveTab("all");
    inputRef.current?.blur();
    // Push to URL — triggers useEffect above
    router.push("/search?q=" + encodeURIComponent(inputVal.trim()));
  }

  // ── Page change — fetch from server, update URL ──────────────────────────
  function goToPage(page: number) {
    if (page < 1 || page > postTotalPages || page === currentPage) return;
    const q = query || urlQ;
    router.push(`/search?q=${encodeURIComponent(q)}&page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleHistoryClick(q: string) {
    setFocused(false); saveToHistory(q); setHistory(getHistory());
    setActiveTab("all");
    router.push("/search?q=" + encodeURIComponent(q));
  }
  function handleRemoveHistory(q: string, e: React.MouseEvent) {
    e.stopPropagation(); removeFromHistory(q); setHistory(getHistory());
  }

  const hasResults = posts.length > 0 || authors.length > 0;
  const showHistory = focused && !inputVal.trim() && history.length > 0;
  const totalResults = activeTab === "all" ? postTotal + authors.length
    : activeTab === "posts" ? postTotal : authors.length;
  const paginationPages = getPaginationPages(currentPage, postTotalPages);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: postTotal + authors.length },
    { key: "posts", label: "Posts", count: postTotal },
    { key: "authors", label: "Authors", count: authors.length },
  ];

  // ── Shared search box ────────────────────────────────────────────────────
  function SearchBox({ large }: { large: boolean }) {
    return (
      <div style={{
        display: "flex", alignItems: "center", overflow: "hidden",
        border: focused ? (large ? "2px solid #f97316" : "1.5px solid #f97316") : "1.5px solid #e5e7eb",
        borderRadius: large ? 12 : 8, background: "#f9fafb",
        boxShadow: focused ? "0 4px 20px rgba(249,115,22,0.15)" : large ? "0 2px 10px rgba(0,0,0,0.07)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s", width: "100%",
      }}>
        <span style={{ color: "#9ca3af", fontSize: large ? 20 : 16, marginLeft: large ? 18 : 12, flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef} value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Search posts, authors, topics..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: large ? 17 : 15, color: "#374151", background: "transparent", fontFamily: "inherit", padding: large ? "17px 14px" : "13px 12px" }}
        />
        {inputVal && (
          <button type="button"
            onClick={() => { setInputVal(""); setPosts([]); setAuthors([]); setPostTotal(0); setPostTotalPages(0); setSearched(false); inputRef.current?.focus(); }}
            style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: large ? 18 : 16, padding: "0 8px" }}>✕</button>
        )}
        <button type="submit"
          style={{ background: "#f97316", border: "none", color: "#fff", cursor: "pointer", padding: large ? "0 28px" : "0 22px", height: large ? 56 : 46, fontSize: large ? 15 : 14, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c0a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}>
          Search
        </button>
      </div>
    );
  }

  // ── Shared history dropdown ──────────────────────────────────────────────
  function HistoryDropdown() {
    if (!showHistory) return null;
    return (
      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 200, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>Recent searches</span>
          <button type="button" onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
            style={{ fontSize: 12, color: "#f97316", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>
        </div>
        {history.map((item) => (
          <div key={item.query} onClick={() => handleHistoryClick(item.query)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", cursor: "pointer", background: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>🕐</span>
              <span style={{ fontSize: 14, color: "#374151" }}>{item.query}</span>
            </div>
            <button type="button" onClick={(e) => handleRemoveHistory(item.query, e)}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    );
  }

  // ── HOMEPAGE ─────────────────────────────────────────────────────────────
  if (!searched && !loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", fontFamily: "'Segoe UI', sans-serif", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 54, fontWeight: 900, color: "#111", margin: 0, letterSpacing: -2 }}>
            Simple<span style={{ color: "#f97316" }}>Blog</span>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: "#9ca3af" }}>Search posts and authors</p>
        </div>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 620, position: "relative" }}>
          <SearchBox large={true} />
          <HistoryDropdown />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button type="button" onClick={() => router.push("/")}
              style={{ padding: "11px 28px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.color = "#f97316"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}>
              Browse All Posts
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── RESULTS VIEW ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#fff", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Filter tabs */}
      {searched && !loading && (
        <div style={{ width: "100%", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "center", padding: "12px 0", background: "#fff" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {tabs.map((tab) => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{ padding: "6px 18px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, cursor: "pointer", fontFamily: "inherit", background: activeTab === tab.key ? "#f97316" : "#f3f4f6", color: activeTab === tab.key ? "#fff" : "#374151", transition: "background 0.15s" }}
                onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = "#fff7ed"; }}
                onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = "#f3f4f6"; }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "#e5e7eb", color: activeTab === tab.key ? "#fff" : "#6b7280", borderRadius: 10, padding: "1px 7px" }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ width: "100%", maxWidth: 780, padding: "28px 32px 60px" }}>

        {loading && <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>Searching...</p>}

        {!loading && searched && (
          <p style={{ fontSize: 13, color: "#70757a", margin: "0 0 24px" }}>
            {hasResults
              ? `About ${totalResults} result${totalResults !== 1 ? "s" : ""} for `
              : "No results found for "}
            <strong>&ldquo;{query || urlQ}&rdquo;</strong>
          </p>
        )}

        {!loading && searched && !hasResults && (
          <div>
            <p style={{ fontSize: 15, color: "#374151", margin: "0 0 10px" }}>
              Your search — <strong>{query || urlQ}</strong> — did not match any posts or authors.
            </p>
            <ul style={{ fontSize: 14, color: "#70757a", margin: 0, paddingLeft: 22, lineHeight: 2 }}>
              <li>Check your spelling</li>
              <li>Try different or simpler keywords</li>
              <li>Try searching by author username</li>
            </ul>
          </div>
        )}

        {/* Authors */}
        {!loading && authors.length > 0 && (activeTab === "all" || activeTab === "authors") && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#70757a", textTransform: "uppercase", letterSpacing: "0.7px", margin: "0 0 16px" }}>Authors</p>
            {authors.map((author) => (
              <div key={author.id}
                onClick={() => { saveToHistory(author.username); setHistory(getHistory()); router.push("/profile/" + author.username); }}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 12px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", borderRadius: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Avatar name={author.username} size={48} />
                <div>
                  <p style={{ margin: 0, fontSize: 17, color: "#1a0dab", fontWeight: 600 }}>
                    <Highlight text={author.username} query={query || urlQ} />
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#70757a" }}>simpleblog.com/profile/{author.username}</p>
                  {author.bio && <p style={{ margin: "5px 0 0", fontSize: 14, color: "#4d5156" }}><Highlight text={author.bio} query={query || urlQ} /></p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts — server-paginated, overlay spinner on page change */}
        {!loading && posts.length > 0 && (activeTab === "all" || activeTab === "posts") && (
          <div style={{ position: "relative" }}>

            {/* Page-change loading overlay */}
            {pageLoading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 8 }}>
                <p style={{ color: "#f97316", fontSize: 14, fontWeight: 600 }}>Loading...</p>
              </div>
            )}

            {posts.map((post) => (
              <div key={post.id}
                style={{ marginBottom: 36, padding: "14px 12px", borderRadius: 8, opacity: pageLoading ? 0.5 : 1, transition: "opacity 0.2s" }}
                onMouseEnter={(e) => { if (!pageLoading) e.currentTarget.style.background = "#fff7ed"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Avatar name={post.author} size={18} />
                  <span style={{ fontSize: 12, color: "#70757a" }}>simpleblog.com › posts › {post.id.slice(-6)}</span>
                  {post.createdAt && <span style={{ fontSize: 11, color: "#9ca3af" }}>· {timeAgo(post.createdAt)}</span>}
                </div>
                <p onClick={() => { saveToHistory(query || urlQ); setHistory(getHistory()); router.push("/posts/" + post.id); }}
                  style={{ margin: "0 0 3px", fontSize: 20, color: "#1a0dab", fontWeight: 600, lineHeight: 1.3, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
                  <Highlight text={post.title} query={query || urlQ} />
                </p>
                <span style={{ fontSize: 12, color: "#f97316", fontWeight: 600, display: "inline-block", marginBottom: 6 }}>
                  by <Highlight text={post.author} query={query || urlQ} />
                </span>
                <p style={{ margin: "0 0 10px", fontSize: 14, color: "#4d5156", lineHeight: 1.7 }}>
                  <Highlight text={post.snippet} query={query || urlQ} />{post.snippet?.length >= 200 ? "..." : ""}
                </p>
                <button
                  onClick={() => { saveToHistory(query || urlQ); setHistory(getHistory()); router.push("/posts/" + post.id); }}
                  style={{ background: "none", border: "1.5px solid #f97316", color: "#f97316", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", padding: "5px 14px", borderRadius: 6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#f97316"; }}>
                  Read more →
                </button>
              </div>
            ))}

            {/* Server-side pagination */}
            {postTotalPages > 1 && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
                <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
                  Page {currentPage} of {postTotalPages} · {postTotal} posts
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>

                  {/* First */}
                  {currentPage > 2 && (
                    <button onClick={() => goToPage(1)}
                      style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>«</button>
                  )}

                  {/* Prev */}
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === 1 ? "#f9fafb" : "#fff", color: currentPage === 1 ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#f97316"; }}
                    onMouseLeave={(e) => { if (currentPage !== 1) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                    ← Prev
                  </button>

                  {/* Page numbers */}
                  {paginationPages.map((pg, i) =>
                    pg === "..." ? (
                      <span key={"e" + i} style={{ padding: "8px 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
                    ) : (
                      <button key={pg} onClick={() => goToPage(pg as number)}
                        style={{ width: 36, height: 36, borderRadius: 8, border: pg === currentPage ? "none" : "1.5px solid #e5e7eb", background: pg === currentPage ? "#f97316" : "#fff", color: pg === currentPage ? "#fff" : "#374151", fontSize: 13, fontWeight: pg === currentPage ? 700 : 500, cursor: pg === currentPage ? "default" : "pointer", fontFamily: "inherit" }}
                        onMouseEnter={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#f97316"; }}
                        onMouseLeave={(e) => { if (pg !== currentPage) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                        {pg}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === postTotalPages}
                    style={{ padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: currentPage === postTotalPages ? "#f9fafb" : "#fff", color: currentPage === postTotalPages ? "#d1d5db" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentPage === postTotalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => { if (currentPage !== postTotalPages) e.currentTarget.style.borderColor = "#f97316"; }}
                    onMouseLeave={(e) => { if (currentPage !== postTotalPages) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                    Next →
                  </button>

                  {/* Last */}
                  {currentPage < postTotalPages - 1 && (
                    <button onClick={() => goToPage(postTotalPages)}
                      style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f97316")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}>»</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}