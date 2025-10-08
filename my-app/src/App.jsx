import { useState, useEffect } from "react";
import RegisterPage from "./RegisterPage";
import UniversitySelection from "./UniversitySelection";
import SignInPage from "./SignInPage";
import ListingPage from "./ListingPage";
import CreateListingPage from "./CreateListingPage";
import CreateGroupPage from "./CreateGroupPage";
import ProfilePage from "./ProfilePage";         // 👈 新增
import MessagesPage from "./MessagesPage";       // 👈 新增
import PostDetailPage from "./PostDetailPage";   // 👈 新增
import { API_BASE } from "./config";

function App() {
    const [step, setStep] = useState("signin");
    const [user, setUser] = useState(null);
    const [university, setUniversity] = useState(null);

    // 用于“在 listing 页面按 Home 时刷新”的计数器
    const [listReloadTick, setListReloadTick] = useState(0);

    // 用于“帖子详情占位页”
    const [currentPost, setCurrentPost] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("userId");
        const savedUniversity = localStorage.getItem("university");
        if (savedUser) {
            setUser(savedUser);
            if (savedUniversity && savedUniversity !== "null" && savedUniversity !== "undefined") {
                setUniversity(savedUniversity);
                setStep("listing");
            } else {
                localStorage.removeItem("university");
                setStep("university");
            }
        }
    }, []);

    const handleSignIn = async (id) => {
        setUser(id);
        localStorage.setItem("userId", id);
        try {
            const res = await fetch(`${API_BASE}/db.php?user=${id}`);
            const data = await res.json();
            const uni = data?.user?.university_id;
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
        setUser(null);
        setUniversity(null);
        setStep("signin");
    };

    // 所有“Home”在非 listing 页面都走这个
    const goHomeToListing = () => {
        setStep("listing");
        // 回到列表时顺便刷新一次
        setListReloadTick(t => t + 1);
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
                    onOpenPost={(post) => { setCurrentPost(post); setStep("postDetail"); }}
                    reloadTick={listReloadTick}          // 👈 供 ListingPage 感知“刷新”
                    onRequestRefresh={() => setListReloadTick(t => t + 1)} // 👈 ListingPage 点 Home 调用
                />
            )}

            {step === "createListing" && (
                <CreateListingPage
                    user={user}
                    university={university}
                    onBack={() => setStep("listing")}
                    onCreated={() => setStep("listing")}
                    onHome={goHomeToListing} // 👈 在非 listing 页，Home = 回到 listing
                />
            )}

            {step === "createGroup" && (
                <CreateGroupPage onBack={() => setStep("listing")} onHome={goHomeToListing} />
            )}

            {step === "profile" && (
                <ProfilePage onBack={() => setStep("listing")} onHome={goHomeToListing} />
            )}

            {step === "messages" && (
                <MessagesPage onBack={() => setStep("listing")} onHome={goHomeToListing} />
            )}

            {step === "postDetail" && (
                <PostDetailPage
                    post={currentPost}
                    onBack={() => setStep("listing")}
                    onHome={goHomeToListing}
                />
            )}
        </div>
    );
}

export default App;