import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "./config";
import "./App.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import AppHeader from "./AppHeader";

function timeAgo(ts) {
    const d = new Date(ts);
    const diff = Math.max(0, Date.now() - d.getTime());
    const h = Math.floor(diff / (1000 * 60 * 60));
    if (h < 24) return `${h || 1} Hours ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
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

    // 首次 & 大学变化 & 外部刷新信号 时拉取
    useEffect(() => {
        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [university, reloadTick]);

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
                ) : (
                    <GroupsView />
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
