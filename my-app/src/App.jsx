// src/App.jsx — Hash 路由版（#/path/，刷新不会 404）+ 已有大学后禁止访问选大学页
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

/** 解析当前 step（基于 location.hash） */
function parseStepFromHash() {
    const raw = window.location.hash || "#/signin/";
    const seg = raw.replace(/^#\/?|\/+$/g, ""); // 去掉 #/ 和尾部 /
    const head = seg.split("/")[0].toLowerCase();
    const known = new Set([
        "signin", "register", "university", "listing",
        "createlisting", "creategroup", "profile",
        "messages", "postdetail"
    ]);
    return known.has(head) ? head : "signin";
}

/** 规范化成 "#/xxx/" */
function toHash(seg) {
    let s = (seg || "").trim().replace(/^\/+|\/+$/g, "");
    if (!s) s = "signin";
    return `#/${s}/`;
}

export default function App() {
    const [step, setStep] = useState(() => parseStepFromHash());
    const [user, setUser] = useState(null);
    const [university, setUniversity] = useState(null);
    const [username, setUsername] = useState("User name");
    const [listReloadTick, setListReloadTick] = useState(0);
    const [currentPost, setCurrentPost] = useState(null);
    const [blockTipTick, setBlockTipTick] = useState(0); // 触发重新渲染提示的小计数

    /** 是否“锁定选大学页”：已有 university 则锁定 */
    const universityLocked = !!(university && university !== "null" && university !== "undefined");

    /** Hash 导航（不会整页请求，刷新不 404） */
    const navigate = (seg) => {
        const target = toHash(seg);

        // ✅ 禁止导航到 /university/（已有大学时）
        if (universityLocked && target === "#/university/") {
            // 不跳转、不改变 hash，只刷新提示
            setBlockTipTick((t) => t + 1);
            return;
        }

        if (window.location.hash !== target) {
            window.location.hash = target; // 触发 hashchange
        } else {
            // 触发一次 hashchange 以便同页刷新时也能重渲染
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
    };

    // 监听前进/后退（hashchange）
    useEffect(() => {
        const onHash = () => {
            const next = parseStepFromHash();
            // ✅ 用户手动在地址栏输入 #/university/：已有大学则不切换 step，仅刷新提示
            if (universityLocked && next === "university") {
                setBlockTipTick((t) => t + 1);
                return; // 不更新 step，保持当前页面
            }
            setStep(next);
        };
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, [universityLocked]);

    // 启动时恢复用户与大学，并决定落地页（不做任何强制跳转到其他功能）
    useEffect(() => {
        const savedUser = localStorage.getItem("userId");
        const savedUniversity = localStorage.getItem("university");
        const savedName = localStorage.getItem("username");
        if (savedName) setUsername(savedName);

        // 未登录：允许直接去 /register 和 /university，其余统一回 signin
        if (!savedUser) {
            const s = parseStepFromHash();
            if (s !== "register" && s !== "university") {
                navigate("/signin/");
            }
            return;
        }

        setUser(savedUser);

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/db.php?user=${encodeURIComponent(savedUser)}`);
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
                    // 不强行改路由；仅当当前是 signin 时，给个默认入口到 listing
                    if (parseStepFromHash() === "signin") {
                        navigate("/listing/");
                    } else {
                        setStep(parseStepFromHash());
                    }
                } else {
                    localStorage.removeItem("university");
                    // 未设置大学时，若当前不是 register/university/signin，则引导去 university
                    const cur = parseStepFromHash();
                    if (cur !== "register" && cur !== "university" && cur !== "signin") {
                        navigate("/university/");
                    }
                }
            } catch {
                // API 不可用时：若本地有大学缓存保持现状；否则引导去 university
                if (savedUniversity && savedUniversity !== "null" && savedUniversity !== "undefined") {
                    setUniversity(savedUniversity);
                    if (parseStepFromHash() === "signin") setStep("listing");
                } else {
                    localStorage.removeItem("university");
                    const cur = parseStepFromHash();
                    if (cur !== "register" && cur !== "university" && cur !== "signin") {
                        navigate("/university/");
                    }
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignIn = async (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        try {
            const res = await fetch(`${API_BASE}/db.php?user=${encodeURIComponent(id)}`);
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

    const handleRegister = (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        navigate("/university/");
    };

    const handleUniversityConfirm = (uni) => {
        const uniStr = String(uni);
        setUniversity(uniStr);
        localStorage.setItem("university", uniStr);
        navigate("/listing/");
    };

    const handleLogout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("university");
        localStorage.removeItem("username");
        setUser(null);
        setUniversity(null);
        setUsername("User name");
        navigate("/signin/");
    };

    const goHomeToListing = () => {
        localStorage.removeItem("currentPost"); 
        navigate("/listing/");
        setListReloadTick((t) => t + 1);
    };

    const goBackOne = () => window.history.back();

    // ===== 403 提示（仅在当前 hash 是 #/university/ 且已锁定时显示，不做跳转） =====
    const renderUniversityLocked = () => (
        <div className="uni-locked" style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
            <h1 style={{ marginBottom: 12 }}>University selection is locked</h1>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
                Your account already has a university set. Returning to the university selection page is disabled.
            </p>
            {/* 不提供跳转按钮，保持“不要丢到别的功能”的要求 */}
            {/* 你可以放一个关闭提示的按钮，仅刷新本页提示： */}
            <button
                type="button"
                style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8, border: "1px solid #ccc" }}
                onClick={() => setBlockTipTick((t) => t + 1)}
            >
                OK
            </button>
        </div>
    );
    useEffect(() => {
  if (!currentPost) {
    const savedPost = localStorage.getItem("currentPost");
    if (savedPost) {
      try {
        setCurrentPost(JSON.parse(savedPost));
      } catch {
        console.warn("Invalid saved post data");
      }
    }
  }
}, []);

    return (
        <div className="app-container">
            {step === "signin" && (
                <SignInPage
                    onSignIn={handleSignIn}
                    // 你原来用 onBack 当成“去注册”的触发，这里保持兼容
                    onBack={() => navigate("/register/")}
                />
            )}

            {step === "register" && (
                <RegisterPage
                    onRegister={handleRegister}
                    onBack={goBackOne}
                />
            )}

            {step === "university" && (
                universityLocked
                    ? renderUniversityLocked()
                    : (
                        <UniversitySelection
                            userId={user}
                            onConfirm={handleUniversityConfirm}
                        />
                    )
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
                    onOpenPost={(post) => {
                    setCurrentPost(post);
                    localStorage.setItem("currentPost", JSON.stringify(post));
                    navigate("/postdetail/");
                    }}                    reloadTick={listReloadTick}
                    onRequestRefresh={() => setListReloadTick((t) => t + 1)}
                    username={username}
                />
            )}

            {step === "createlisting" && (
                <CreateListingPage
                    user={user}
                    university={university}
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
            
            {
            
            step === "postdetail" && (
                
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
