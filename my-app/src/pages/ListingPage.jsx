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

// 简单的 Groups 视图（占位，可改成真实 DB）
function GroupsView() {
    return (
        <div className="mp-empty" style={{ paddingTop: 24 }}>
            Groups list coming soon…
        </div>
    );
}

export default function ListingPage({
                                        user,
                                        university,
                                        onLogout,
                                        onGoCreateListing,
                                        onGoCreateGroup,
                                        onGoProfile,        // ✅ 点击用户名跳转
                                        onGoMessages,
                                        onOpenPost,
                                        reloadTick = 0,
                                        onRequestRefresh,
                                        username = "User name",   // ✅ 新增：从外部传入要显示的用户名
                                    }) {
    const [listings, setListings] = useState([]);
    const [q, setQ] = useState("");
    const [showReport, setShowReport] = useState(false);
    const [openFab, setOpenFab] = useState(false);
    const [activeTab, setActiveTab] = useState("listings"); // "listings" | "groups"
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);


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

    async function fetchGroupsMock() {
        setGroupsLoading(true);
        try {
            // Simulated network delay
            await new Promise(r => setTimeout(r, 300));

            // Build 5 demo groups. Feel free to tweak copy/pics.
            const now = new Date().toISOString();
            const demo = [
                {
                    id: 9001, title: "CSE 331 — Algorithm Grind",
                    description: "Weekly DP/Greedy review",
                    pictures: [], category: "study",
                    capacity: 3, member_count: 2, views: 42, created_at: now
                },
                {
                    id: 9002, title: "CSE 474 — ML Review",
                    description: "Paper reading + LeetML",
                    pictures: [], category: "study",
                    capacity: 2, member_count: 2, views: 81, created_at: now
                },
                {
                    id: 9003, title: "CSE 250 — DS Q&A",
                    description: "Sunday office hours (Zoom)",
                    pictures: [], category: "qa",
                    capacity: null, member_count: 1, views: 12, created_at: now
                },
                {
                    id: 9004, title: "CSE 442 — Project Sync",
                    description: "Standup + code review",
                    pictures: [], category: "project",
                    capacity: 6, member_count: 4, views: 5, created_at: now
                },
                {
                    id: 9005, title: "Exam Prep — Algorithms",
                    description: "Past papers & tricks",
                    pictures: [], category: "exam",
                    capacity: 5, member_count: 3, views: 19, created_at: now
                },
        ];

    // OPTIONAL: if you have listing photos, copy first image into groups for nicer cards
    // e.g., if (listings?.[0]?.pictures) demo[0].pictures = [listings[0].pictures[0]];
    setGroups(demo);
  } finally {
    setGroupsLoading(false);
  }
}

    // 首次 & 大学变化 & 外部刷新信号 时拉取
    useEffect(() => {
        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [university, reloadTick]);

    // NEW: only fetch groups when the Groups tab is active
    useEffect(() => {
        if (activeTab !== "groups") return;   // guard
        fetchGroupsMock();                    // or fetchGroups()
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
            {/* Header */}
            <AppHeader
              username={username ||user?.name || user?.username}
              showBack={false}                          // 首页不显示返回
              showSearch={true}                         // 首页需要搜索框
              searchPlaceholder="Search"
              searchValue={q}                           // 绑定现有状态
              onSearchChange={setQ}                    // 绑定 setter
              onHome={() => onRequestRefresh?.()}      // “Home”=触发刷新
              onGoProfile={onGoProfile}                // 点击头像/用户名
              onReport={() => setShowReport(true)}     // 三点上报
              onLogout={onLogout}                      // 退出
            />

            {/* Feed / Groups */}
            <main className="mp-feed">
                {activeTab === "listings" ? (
                    filtered.length > 0 ? (
                        filtered.map((item) => (
                            <article
                                key={item.id}
                                className="mp-post"
                                onClick={() => onOpenPost && onOpenPost(item)}      // 👈 整卡可点击
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
                        <div className="mp-empty">No listings found for this university.</div>
                    )
                ) : activeTab === "groups" ? (
                        groupsLoading ? (
                        <div className="mp-empty" style={{ paddingTop: 24 }}>Loading groups…</div>
                        ) : groups.length === 0 ? (
                        <div className="mp-empty" style={{ paddingTop: 24 }}>No groups yet.</div>
                        ) : (
                        groups.map((g) => {
                            const pics = parsePics(g.pictures);
                            const capText = g.capacity == null ? `${g.member_count || 0}/∞` : `${g.member_count || 0}/${g.capacity}`;
                            const previews = makeEmojiMembers(g.member_count || 0);
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
                                    {pics[0] ? (
                                    <img src={pics[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8 }} loading="lazy" />
                                    ) : <span className="mp-img-ic">🖼️</span>}
                                </div>
                                </div>

                                <div className="gp-avatars">
                                {previews.map((emj, i) => <div className="gp-avatar" key={i} aria-hidden>{emj}</div>)}
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
                            );
                        })
                        )
                    ) : (
                        /* Messages (or placeholder) */
                        <div className="mp-empty" style={{ paddingTop: 24 }}>Messages coming soon…</div>
                    )}
                    </main>

            {/* Tabs + 右下角 FAB */}
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

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
