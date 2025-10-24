import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";
import "../App.css";
import "../styles/ListingPage.css";
import "../styles/Header.css";

import KebabMenu from "../components/KebabMenu";
import BugReportModal from "../components/BugReportModal";
import AppHeader from "../components/AppHeader";

function timeAgo(ts) {
    const d = new Date(ts);
    const diff = Math.max(0, Date.now() - d.getTime());
    const h = Math.floor(diff / (1000 * 60 * 60));
    if (h < 24) return `${h || 1} Hours ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
}
function parsePics(pictures) {
  try {
    if (Array.isArray(pictures)) return pictures;
    if (typeof pictures === "string") {
      if (pictures.trim().startsWith("[")) return JSON.parse(pictures);
      return pictures.split(",").map(s => s.trim()).filter(Boolean);
    }
  } catch {}
  return [];
}
const EMOJI_POOL = ["🐧","🦊","🐼","🐯","🦉","🐨","🐸","🐵","🦁","🐮","🐱","🐶","🐻","🦄"];
function makeEmojiMembers(n) {
  const arr = [];
  const lim = Math.max(0, Math.min(n, 5)); // show up to 5
  for (let i = 0; i < lim; i++) {
    arr.push(EMOJI_POOL[(Math.floor(Math.random()*EMOJI_POOL.length))]);
  }
  return arr;
}
// stable per-user emoji
function emojiForUser(userId) {
  const n = Math.abs(Number(userId));
  return EMOJI_POOL[n % EMOJI_POOL.length];
}

// simple index-based pick (if you still want it)
function pickEmoji(i) {
  return EMOJI_POOL[i % EMOJI_POOL.length];
}

// detect URL/data URLs
function isUrlLike(s) {
  return /^(https?:)?\/\//.test(s || "") || (s || "").startsWith("data:");
}

export default function ListingPage({
                                        user,
                                        university,
                                        onLogout,
                                        onGoCreateListing,
                                        onGoCreateGroup,
                                        onGoProfile,
                                        onGoMessages,
                                        onOpenPost,
                                        reloadTick = 0,
                                        onRequestRefresh,
                                        username = "User name",
                                    }) {
    const [listings, setListings] = useState([]);
    const [q, setQ] = useState("");
    const [showReport, setShowReport] = useState(false);
    const [openFab, setOpenFab] = useState(false);
    const [activeTab, setActiveTab] = useState("listings");
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [hoveredPostId, setHoveredPostId] = useState(null);

    const fetchListings = async () => {
        if (!university) return;
        try {
            const res = await fetch(`${API_BASE}/db.php?listings_by_university=${university}`);
            const data = await res.json();
            if (data?.success) setListings(data.items || []);
        } catch (e) {
            console.error("Failed to fetch listings:", e);
        }
    };

    async function fetchGroups() {
        if (!university) return;
        setGroupsLoading(true);
        try {
            const url = `${API_BASE}/db.php?groups_by_university=${encodeURIComponent(university)}&limit=100&previews=1`;
            const res = await fetch(url);
            const data = await res.json().catch(() => ({}));

            const items = Array.isArray(data?.items) ? data.items
                        : (Array.isArray(data) ? data : []);

            const normalized = items.map(g => ({
            ...g,
            pictures: parsePics(g.pictures),
            comments: parsePics(g.comments),
            member_previews: Array.isArray(g.member_previews) ? g.member_previews : []
            }));

            // newest first
            normalized.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
            setGroups(normalized);
        } catch (e) {
            console.error("fetchGroups failed:", e);
            setGroups([]);
        } finally {
            setGroupsLoading(false);
        }
        }

    useEffect(() => {
        fetchListings();
    }, [university, reloadTick]);

    useEffect(() => {
        if (activeTab !== "groups") return;   // guard
        fetchGroups();                    // 10242025从mockfetch替换为真实fetch
        // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, university, reloadTick]);
    

    const filtered = useMemo(() => {
        const k = q.trim().toLowerCase();
        if (!k) return listings;
        return listings.filter(
            (x) =>
                x.title?.toLowerCase().includes(k) ||
                x.description?.toLowerCase().includes(k)
        );
    }, [q, listings]);

    return (
        <div className="mp-root">
            <AppHeader
              username={username ||user?.name || user?.username}
              showBack={false}
              showSearch={true}
              searchPlaceholder="Search"
              searchValue={q}
              onSearchChange={setQ}
              onHome={() => onRequestRefresh?.()}
              onGoProfile={onGoProfile}
              onReport={() => setShowReport(true)}
              onLogout={onLogout}
            />

            <div className="mp-content-wrapper">
                <main className="mp-feed">
                    {activeTab === "listings" ? (
                        filtered.length > 0 ? (
                            filtered.map((item) => (
                                <article
                                    key={item.id}
                                    className={`mp-post ${hoveredPostId === item.id ? 'mp-post-hover' : ''}`}
                                    onClick={() => onOpenPost && onOpenPost(item)}
                                    onMouseEnter={() => setHoveredPostId(item.id)}
                                    onMouseLeave={() => setHoveredPostId(null)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && onOpenPost && onOpenPost(item)}
                                    title="Open post"
                                >
                                    <div className="mp-post-texts">
                                        {item.title?.trim() && <div className="mp-post-title">{item.title}</div>}
                                        {item.description?.trim() && <div className="mp-post-desc">{item.description}</div>}
                                        {item.price !== undefined && <div className="mp-post-price">${item.price}</div>}
                                    </div>

                                    <div className="mp-post-media">
                                        <div className="mp-imgbox">
                                            {Array.isArray(item.pictures) && item.pictures[0] ? (
                                                <img
                                                    src={item.pictures[0]}
                                                    alt=""
                                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span className="mp-img-ic">🖼️</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mp-post-meta">
                                        <span>{timeAgo(item.created_at)}</span>
                                        <span className="mp-dot" />
                                        <span className="mp-eye" aria-label="views">👁</span>
                                        <span>999</span>
                                        <button
                                            className="mp-cmt"
                                            aria-label="comments"
                                            onClick={(e) => { e.stopPropagation(); onOpenPost && onOpenPost(item); }}
                                            title="Open comments"
                                        >
                                            💬
                                        </button>
                                    </div>

                                    <div className="mp-divider" />
                                </article>
                            ))
                        ) : (
                        groups.map((g) => {
                            const pics = parsePics(g.pictures);
                            const capText = g.capacity == null ? `${g.member_count || 0}/∞` : `${g.member_count || 0}/${g.capacity}`;
                            const previews = (Array.isArray(g.member_previews) && g.member_previews.length)
                                // have previews: use avatar_url if present, otherwise fallback emoji
                                ? g.member_previews.slice(0,5).map((m,i) => m.avatar_url || pickEmoji(i))
                                // no previews: fabricate up to 5 emojis from member_count
                                : makeEmojiMembers(g.member_count || 0);
                            const overflow = Math.max(0, (g.member_count || 0) - previews.length);
                            return (
                            <article key={g.id} className="mp-post" title="Open group">
                                <div className="mp-post-head" style={{ gridTemplateColumns: "1fr auto" }}>
                                <div className="mp-post-texts">
                                    {g.title?.trim() && <div className="mp-post-title">{g.title}</div>}
                                    {g.description?.trim() && <div className="mp-post-desc">{g.description}</div>}
                                </div>
                                <div className="gp-badge" title="Category">{g.category?.trim() || "Group"}</div>
                                </div>

                                    <div className="mp-post-media" style={{ paddingLeft: 0, marginTop: 8 }}>
                                    <div className="mp-imgbox">
                                        {parsePics(g.pictures)[0] ? (
                                        <img src={parsePics(g.pictures)[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8 }} loading="lazy" />
                                        ) : <span className="mp-img-ic">🖼️</span>}
                                    </div>
                                    </div>

                                <div className="gp-avatars">
                                {previews.map((val, i) => (
                                    <div className="gp-avatar" key={i} aria-hidden>
                                    {isUrlLike(val) || (val||"").startsWith("uploads/") || (val||"").startsWith("data:")
                                        ? <img src={val} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                        : val}
                                    </div>
                                ))}
                                {overflow > 0 && <div className="gp-overflow">+{overflow}</div>}
                                </div>


                                <div className="mp-post-meta" style={{ paddingLeft: 0 }}>
                                <span>{timeAgo(g.created_at)}</span>
                                <span className="mp-dot" />
                                <span className="mp-eye" aria-label="views">👁</span>
                                <span>{Number.isFinite(+g.views) ? +g.views : 0}</span>
                                <span className="gp-cap" title="Members / Capacity">👥 {capText}</span>
                                </div>

                                    <div className="mp-divider" />
                                </article>
                            ))
                            )
                        ) : (
                            <div className="mp-empty" style={{ paddingTop: 24 }}>Messages coming soon…</div>
                        )}
                </main>

                <footer className="mp-tabs">
                    <button
                        className={`tab ${activeTab === "listings" ? "active" : ""}`}
                        onClick={() => setActiveTab("listings")}
                    >
                        Listings
                    </button>
                    <button
                        className={`tab ${activeTab === "groups" ? "active" : ""}`}
                        onClick={() => setActiveTab("groups")}
                    >
                        Groups
                    </button>
                    <button className="tab" onClick={onGoMessages}>Messages</button>

                    <button
                        className="mp-fab-right"
                        aria-label="create"
                        onClick={() => setOpenFab((v) => !v)}
                    >
                        +
                    </button>

                    {openFab && (
                        <div className="fab-menu" role="menu">
                            <button
                                className="fab-item"
                                onClick={() => { setOpenFab(false); onGoCreateGroup && onGoCreateGroup(); }}
                            >
                                Create group
                            </button>
                            <button
                                className="fab-item"
                                onClick={() => { setOpenFab(false); onGoCreateListing && onGoCreateListing(); }}
                            >
                                Create listing
                            </button>
                        </div>
                    )}
                </footer>
            </div>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}