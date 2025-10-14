// src/App.jsx
import { useEffect, useState } from "react";
import RegisterPage from "./RegisterPage";
import UniversitySelection from "./UniversitySelection";
import SignInPage from "./SignInPage";
import ListingPage from "./ListingPage";
import CreateListingPage from "./CreateListingPage";
import CreateGroupPage from "./CreateGroupPage";
import ProfilePage from "./ProfilePage";
import MessagesPage from "./MessagesPage";
import PostDetailPage from "./PostDetailPage";
import { API_BASE } from "./config";

/** ======== 基于 API_BASE 自动推导部署前缀（子目录） ======== */
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

/** 规范化到 /xxx/（不含 BASE_PATH） */
function normPath(seg) {
    let s = (seg || "").trim();
    s = s.replace(/^\/+|\/+$/g, ""); // 去掉两端斜杠
    if (!s) return "/";
    return `/${s}/`;
}

/** 从实际 pathname 里剥掉 BASE_PATH，再解析出 step */
function parseStepFromLocation(pathname) {
    let p = pathname || "/";
    if (!p.startsWith("/")) p = "/" + p;
    if (p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length - 1); // 保留前导 /
    const seg = p.replace(/^\/+|\/+$/g, "");
    if (!seg) return "signin";
    const head = seg.split("/")[0].toLowerCase();
    const known = new Set([
        "signin", "register", "university", "listing",
        "createlisting", "creategroup", "profile",
        "messages", "postdetail"
    ]);
    return known.has(head) ? head : "signin";
}

export default function App() {
    const [step, setStep] = useState(() => parseStepFromLocation(window.location.pathname));
    const [user, setUser] = useState(null);
    const [university, setUniversity] = useState(null);
    const [username, setUsername] = useState("User name");
    const [listReloadTick, setListReloadTick] = useState(0);
    const [currentPost, setCurrentPost] = useState(null);

    /** 统一导航（基于 BASE_PATH），强制 /xxx/ 形式 */
    const navigate = (seg) => {
        const rel = normPath(seg); // 例如 "/profile/"
        const href = BASE_PATH.replace(/\/+$/,"/") + rel.replace(/^\/+/,""); // BASE_PATH + 相对
        if (window.location.pathname !== href) {
            window.history.pushState({}, "", href);
            // 让所有依赖 popstate 的组件同步
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
        setStep(parseStepFromLocation(href));
    };

    // 监听浏览器前进/后退
    useEffect(() => {
        const onPop = () => setStep(parseStepFromLocation(window.location.pathname));
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    // 启动：尝试恢复用户与大学，并决定落地页
    useEffect(() => {
        const savedUser = localStorage.getItem("userId");
        const savedUniversity = localStorage.getItem("university");
        const savedName = localStorage.getItem("username");
        if (savedName) setUsername(savedName);

        if (!savedUser) {
            const s = parseStepFromLocation(window.location.pathname);
            if (s !== "register" && s !== "university") navigate("/signin/");
            return;
        }

        setUser(savedUser);
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/db.php?user=${savedUser}`);
                const data = await res.json();
                const uni = data?.user?.university_id;
                const name = data?.user?.username;
                if (name) {
                    setUsername(name);
                    localStorage.setItem("username", name);
                }
                if (data?.success && uni != null) {
                    const uniStr = String(uni);
                    setUniversity(uniStr);
                    localStorage.setItem("university", uniStr);
                    if (parseStepFromLocation(window.location.pathname) === "signin") {
                        navigate("/listing/");
                    } else {
                        setStep(parseStepFromLocation(window.location.pathname));
                    }
                } else {
                    localStorage.removeItem("university");
                    navigate("/university/");
                }
            } catch {
                if (savedUniversity && savedUniversity !== "null" && savedUniversity !== "undefined") {
                    setUniversity(savedUniversity);
                    if (parseStepFromLocation(window.location.pathname) === "signin") navigate("/listing/");
                } else {
                    localStorage.removeItem("university");
                    navigate("/university/");
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** 登录成功 */
    const handleSignIn = async (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        try {
            const res = await fetch(`${API_BASE}/db.php?user=${id}`);
            const data = await res.json();
            const uni = data?.user?.university_id;
            const name = data?.user?.username;
            if (name) {
                setUsername(name);
                localStorage.setItem("username", name);
            }
            if (data?.success && uni != null) {
                const uniStr = String(uni);
                setUniversity(uniStr);
                localStorage.setItem("university", uniStr);
                navigate("/listing/");
            } else {
                localStorage.removeItem("university");
                navigate("/university/");
            }
        } catch {
            localStorage.removeItem("university");
            navigate("/university/");
        }
    };

    /** 注册成功 */
    const handleRegister = (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        navigate("/university/");
    };

    /** 选择大学确认 */
    const handleUniversityConfirm = (uni) => {
        const uniStr = String(uni);
        setUniversity(uniStr);
        localStorage.setItem("university", uniStr);
        navigate("/listing/");
    };

    /** 登出 */
    const handleLogout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("university");
        localStorage.removeItem("username");
        setUser(null);
        setUniversity(null);
        setUsername("User name");
        navigate("/signin/");
    };

    /** 回首页并刷新列表一次 */
    const goHomeToListing = () => {
        navigate("/listing/");
        setListReloadTick((t) => t + 1);
    };

    /** 统一“返回上一页”函数（供需要时传下去） */
    const goBackOne = () => window.history.back();

    return (
        <div className="app-container">
            {step === "signin" && (
                <SignInPage
                    onSignIn={handleSignIn}
                    // 返回上一页（比如从 register 来）
                    onBack={goBackOne}
                />
            )}

            {step === "register" && (
                <RegisterPage
                    onRegister={handleRegister}
                    onBack={goBackOne}
                />
            )}

            {step === "university" && (
                <UniversitySelection
                    userId={user}
                    onConfirm={handleUniversityConfirm}
                />
            )}

            {step === "listing" && (
                <ListingPage
                    user={user}
                    university={university}
                    onLogout={handleLogout}
                    onGoCreateListing={() => navigate("/createlisting/")}
                    onGoCreateGroup={() => navigate("/creategroup/")}
                    onGoProfile={() => navigate("/profile/")}
                    onGoMessages={() => navigate("/messages/")}
                    onOpenPost={(post) => { setCurrentPost(post); navigate("/postdetail/"); }}
                    reloadTick={listReloadTick}
                    onRequestRefresh={() => setListReloadTick((t) => t + 1)}
                    username={username}
                    // 顶层一般不需要返回，不传 onBack 让 Header 隐藏或使用默认
                />
            )}

            {step === "createlisting" && (
                <CreateListingPage
                    user={user}
                    university={university}
                    // ✅ 真实上一页返回（从这里去 profile，再点返回会回到 createlisting）
                    onBack={goBackOne}
                    onCreated={() => navigate("/listing/")}
                    onHome={goHomeToListing}
                    onGoProfile={() => navigate("/profile/")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            {step === "creategroup" && (
                <CreateGroupPage
                    onBack={goBackOne}
                    onHome={goHomeToListing}
                    onGoProfile={() => navigate("/profile/")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            {step === "profile" && (
                <ProfilePage
                    // ✅ 从任意页进入 profile，返回均回到“进入前那一页”
                    onBack={goBackOne}
                    onHome={goHomeToListing}
                    onLogout={handleLogout}
                    onGoProfile={() => navigate("/profile/")}
                    username={username}
                />
            )}

            {step === "messages" && (
                <MessagesPage
                    onBack={goBackOne}
                    onHome={goHomeToListing}
                    onGoProfile={() => navigate("/profile/")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            {step === "postdetail" && (
                <PostDetailPage
                    post={currentPost}
                    onBack={goBackOne}
                    onHome={goHomeToListing}
                    onGoProfile={() => navigate("/profile/")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}
        </div>
    );
}
