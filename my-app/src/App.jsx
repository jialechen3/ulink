import { useState } from "react";
import RegisterPage from "./RegisterPage";
import UniversitySelection from "./UniversitySelection";
import SignInPage from "./SignInPage";

function App() {
    const [step, setStep] = useState("signin"); // 默认 Sign In
    const [userId, setUserId] = useState(null);

    // 登录成功
    const handleSignIn = (id) => {
        setUserId(id);
        alert("Login successful!");
    };

    // 注册成功 → 跳大学选择页面
    const handleRegister = (id) => {
        setUserId(id); // 保存用户ID
        setStep("university"); // 注册后直接选大学
    };

    // 大学选择完成 → 跳登录页面
    const handleUniversityConfirm = (university) => {
        alert("University saved successfully! Please log in.");
        setStep("signin");
    };

    return (
        <div className="app-container">
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
        </div>
    );
}

export default App;
