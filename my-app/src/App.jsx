import { useState } from "react";
import RegisterPage from "./RegisterPage";

function App() {
    const [step, setStep] = useState("register"); // Start with register page
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);

    const handleRegister = (name) => {
        setUsername(name);
        setLoggedIn(true);
    };

    const handleLogout = () => {
        setUserId(null);
        setUsername("");
        setLoggedIn(false);
        setStep("register");
    };

    return (
        <div className="app-container">
            {loggedIn ? (
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <h1>You are logged in, {username}!</h1>
                    <button onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
            ) : (
                <RegisterPage
                    onRegister={handleRegister}
                    onBack={() => console.log("Back clicked")}
                />
            )}
        </div>
    );
}

export default App;