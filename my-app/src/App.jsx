import { useState } from "react";
import RegisterPage from "./RegisterPage";
import UniversitySelection from "./UniversitySelection";
import SignInPage from "./SignInPage";

function App() {
    const [step, setStep] = useState("signin");
    const [userId, setUserId] = useState(null);

    const handleSignIn = (id) => {
        setUserId(id);
        alert("Login successful!");
    };

    const handleRegister = (id) => {
        setUserId(id);
        setStep("university");
    };

    const handleUniversityConfirm = (university) => {
        alert(`University ${university} saved successfully! Please log in.`);
        setStep("signin");
    };

    return (
        <div className="app-container">
            {step === "signin" && (
                <SignInPage
                    onSignIn={handleSignIn}
                    onBack={() => setStep("register")}  // ← Change back to onBack
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