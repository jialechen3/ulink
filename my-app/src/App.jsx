import { useState, useEffect } from "react";
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

function App() {
    const [step, setStep] = useState("signin");
    const [user, setUser] = useState(null);
    const [university, setUniversity] = useState(null);
    const [username, setUsername] = useState("User name");   // ✅ 新增：展示在 Header 的用户名

    // 用于“在 listing 页面按 Home 时刷新”的计数器
    const [listReloadTick, setListReloadTick] = useState(0);

    // 用于“帖子详情占位页”
    const [currentPost, setCurrentPost] = useState(null);

    // ✅ 启动时：恢复 user/university，并尽量拉一次用户资料以拿到 username
    useEffect(() => {
        const savedUser = localStorage.getItem("userId");
        const savedUniversity = localStorage.getItem("university");

        if (savedUser) {
            setUser(savedUser);
            // 先尝试从本地恢复用户名（可选）
            const savedName = localStorage.getItem("username");
            if (savedName) setUsername(savedName);

            // 从后端拉最新用户信息，拿 username + university
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
                        setStep("listing");
                    } else {
                        localStorage.removeItem("university");
                        setStep("university");
                    }
                } catch {
                    // 如果失败，则根据本地的 university 决定去 listing 还是 university
                    if (savedUniversity && savedUniversity !== "null" && savedUniversity !== "undefined") {
                        setUniversity(savedUniversity);
                        setStep("listing");
                    } else {
                        localStorage.removeItem("university");
                        setStep("university");
                    }
                }
            })();
        }
    }, []);

    // ✅ 登录后：设置 user，并拉取 username + university
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
                setStep("listing");
            } else {
                localStorage.removeItem("university");
                setStep("university");
            }
        } catch {
            localStorage.removeItem("university");
            setStep("university");
        }
    };

    const handleRegister = (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        // 注册后还不知道学校，下一步去选学校
        setStep("university");
    };

    const handleUniversityConfirm = (uni) => {
        const uniStr = String(uni);
        setUniversity(uniStr);
        localStorage.setItem("university", uniStr);
        setStep("signin"); // 或者 setStep("listing")
    };

    const handleLogout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("university");
        localStorage.removeItem("username");   // ✅ 清理
        setUser(null);
        setUniversity(null);
        setUsername("User name");
        setStep("signin");
    };

    // 所有“Home”在非 listing 页面都走这个
    const goHomeToListing = () => {
        setStep("listing");
        // 回到列表时顺便刷新一次
        setListReloadTick((t) => t + 1);
    };

    return (
        <div className="app-container">
            {step === "signin" && (
                <SignInPage onSignIn={handleSignIn} onBack={() => setStep("register")} />
            )}

            {step === "register" && (
                <RegisterPage onRegister={handleRegister} onBack={() => setStep("signin")} />
            )}

            {step === "university" && (
                <UniversitySelection userId={user} onConfirm={handleUniversityConfirm} />
            )}

            {step === "listing" && (
                <ListingPage
                    user={user}
                    university={university}
                    onLogout={handleLogout}
                    onGoCreateListing={() => setStep("createListing")}
                    onGoCreateGroup={() => setStep("createGroup")}
                    onGoProfile={() => setStep("profile")}
                    onGoMessages={() => setStep("messages")}
                    onOpenPost={(post) => {
                        setCurrentPost(post);
                        setStep("postDetail");
                    }}
                    reloadTick={listReloadTick}
                    onRequestRefresh={() => setListReloadTick((t) => t + 1)}
                    username={username}
                />
            )}

            {step === "createListing" && (
                <CreateListingPage
                    user={user}
                    university={university}
                    onBack={() => setStep("listing")}
                    onCreated={() => setStep("listing")}
                    onHome={goHomeToListing}
                    // ✅ 关键：给 Header 用
                    onGoProfile={() => setStep("profile")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            {step === "createGroup" && (
                <CreateGroupPage
                    onBack={() => setStep("listing")}
                    onHome={goHomeToListing}
                    // 如果也用了统一 Header，这里同理可传：
                    // onGoProfile={() => setStep("profile")}
                    // onLogout={handleLogout}
                    // username={username}
                />
            )}

            {step === "profile" && (
                <ProfilePage
                    onBack={() => setStep("listing")}
                    onHome={goHomeToListing}
                    // 如果 Profile 里也显示 Header，可以把下面也传入：
                    // onLogout={handleLogout}
                    // onGoProfile={() => setStep("profile")}
                    // username={username}
                />
            )}

            {step === "messages" && (
                <MessagesPage
                    onBack={() => setStep("listing")}
                    onHome={goHomeToListing}
                    // ✅ 关键：给 Header 用
                    onGoProfile={() => setStep("profile")}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            {step === "postDetail" && (
                <PostDetailPage
                    post={currentPost}
                    onBack={() => setStep("listing")}
                    onHome={goHomeToListing}
                    // 若也统一 header，同样传：
                    // onGoProfile={() => setStep("profile")}
                    // onLogout={handleLogout}
                    // username={username}
                />
            )}
        </div>
    );
}

export default App;
