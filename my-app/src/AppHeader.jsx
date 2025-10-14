// src/AppHeader.jsx
import "./App.css";
import KebabMenu from "./KebabMenu";
import Logo from "./Logo.jsx";
import { API_BASE } from "./config";

/** ✅ 自动计算部署路径前缀（根据 API_BASE 自动匹配 aptitude/cattle 环境） */
function getBaseFromAPI() {
    try {
        const u = new URL(API_BASE);
        let p = u.pathname || "/";
        if (!p.startsWith("/")) p = "/" + p;
        if (!p.endsWith("/")) p = p + "/";
        return p;
    } catch {
        const a = document.createElement("a");
        a.href = API_BASE;
        let p = a.pathname || "/";
        if (!p.startsWith("/")) p = "/" + p;
        if (!p.endsWith("/")) p = p + "/";
        return p;
    }
}

const BASE_PATH = getBaseFromAPI();

/** ✅ 统一路径拼接（自动补 /，并加 BASE_PATH 前缀） */
function toHref(seg) {
    if (!seg) return BASE_PATH;
    let s = seg.trim().replace(/^\/+|\/+$/g, ""); // 去掉前后斜杠
    return BASE_PATH.replace(/\/+$/g, "/") + (s ? s + "/" : "");
}

export default function AppHeader({
                                      username = "User name",
                                      onBack,
                                      onHome = () => {},
                                      onGoProfile = () => {},
                                      onLogout = () => {},
                                      onReport = () => {},
                                      showSearch = false,
                                      searchValue = "",
                                      onSearchChange = () => {},
                                      searchPlaceholder = "Search",
                                      showBack = true,
                                  }) {
    /** ✅ 统一返回逻辑：优先 onBack，否则 history.back() */
    const handleBack = () => {
        if (typeof onBack === "function") {
            try {
                onBack();
                return;
            } catch (_) {}
        }
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
        }
    };

    /** ✅ 通用跳转函数：支持字符串路径和函数 */
    const safeNavigate = (fnOrPath) => {
        if (typeof fnOrPath === "function") return fnOrPath();
        if (typeof fnOrPath === "string") {
            const href = toHref(fnOrPath);
            if (window.location.pathname !== href) {
                window.history.pushState({}, "", href);
                // 手动触发 popstate，让 App.jsx 同步 step
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
    };

    /** ✅ 点击头像 */
    const handleGoProfile = (e) => {
        e.stopPropagation();
        safeNavigate(onGoProfile);
    };

    /** ✅ 点击主页图标 */
    const handleHome = (e) => {
        e.stopPropagation();
        safeNavigate(onHome);
    };
return (
    <header
        className="mp-header mp-header--safe"
        style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr", // 左中右三列
            alignItems: "center",
            height: "64px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: "0 1rem",
            boxSizing: "border-box",
        }}
    >
        {/* === 左侧：返回 + 主页 + 用户 === */}
        <div className="mp-left" style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            {showBack && (
                <button
                    type="button"
                    className="mp-icon mp-round"
                    onClick={handleBack}
                    aria-label="Back"
                    title="Back"
                >
                    ←
                </button>
            )}

            <button
                type="button"
                className="mp-icon mp-round"
                aria-label="Home"
                onClick={handleHome}
                title="Home"
            >
                🏠
            </button>

            <div
                className="mp-user"
                role="button"
                tabIndex={0}
                onClick={handleGoProfile}
                onKeyDown={(e) => e.key === "Enter" && handleGoProfile(e)}
                title="Go to profile"
            >
                <div className="mp-avatar">🐧</div>
                <span className="mp-username">{username}</span>
            </div>
        </div>

        {/* === 中间：Logo 居中 === */}
        <div
            className="mp-center"
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gridColumn: "2", // ✅ 明确在中间那一列
                pointerEvents: "none", // ✅ 避免拦截点击
            }}
        >
            <Logo size={36} />
        </div>

        {/* === 右侧：Search + 菜单 + Logout === */}
        <div
            className="mp-right"
            style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "0.6rem",
            }}
        >
            {showSearch && (
                <div className="mp-search-wrap spaced">
                    <input
                        className="mp-search"
                        type="search"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}

            <KebabMenu onReport={onReport} />

            <button
                type="button"
                className="mp-logout"
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
            >
                Logout
            </button>
        </div>
    </header>
);

   
}
