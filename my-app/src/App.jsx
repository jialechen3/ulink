import { useState } from "react";
import RegisterPage from "./RegisterPage";

function App() {
    const [step, setStep] = useState("signin");
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState(""); // 保存用户名
    const [loggedIn, setLoggedIn] = useState(false); // 是否登录成功

    // 登录成功
    const handleSignIn = (id, name) => {
        setUserId(id);
        setUsername(name);
        setLoggedIn(true); // 标记已登录
    };

    // 注册成功 → 跳大学选择页面
    const handleRegister = (id, name) => {
        setUserId(id);
        setUsername(name);
        setStep("university");
    };

    // 大学选择完成 → 跳登录页面
    const handleUniversityConfirm = (university) => {
        alert("University saved successfully! Please log in.");
        setStep("signin");
    };

    const handleLogout = () => {
        setUserId(null);
        setUsername("");
        setLoggedIn(false);
        setStep("signin");
    };

    return (
        <div className="app-container">
            {loggedIn ? (
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <h1>You are logged in, {username}!</h1>
                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: "20px",
                            padding: "10px 20px",
                            backgroundColor: "#4a76d9",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Log Out
                    </button>
                </div>
            ) : (
                <>
                    {step === "signin" && (
                        <SignInPage
                            onSignIn={handleSignIn}
                            onBack={() => setStep("register")}
                        />
                    )}
                    {step === "register" && (
                        <RegisterPage
                            onRegister={handleRegister}
                            onBack={() => setStep("signin")}
                        />
                    )}
                    {step === "university" && (
                        <UniversitySelection
                            userId={userId}
                            onConfirm={handleUniversityConfirm}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;