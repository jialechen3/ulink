import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import RegisterPage from "./RegisterPage";

function App() {
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
    };

    return (
        <Router>
            <div className="app-container">
                {loggedIn ? (
                    <div style={{ textAlign: "center", marginTop: "50px" }}>
                        <h1>You are logged in, {username}!</h1>
                        <button onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                ) : (
                    <Routes>
                        {/* Home page route */}
                        <Route path="/" element={
                            <div style={{ textAlign: "center", marginTop: "50px" }}>
                                <h1>Welcome to Our App</h1>
                                <p>Please register to continue</p>
                                <a href="/register">Go to Registration</a>
                            </div>
                        } />
                        
                        {/* Registration page route */}
                        <Route path="/register" element={
                            <RegisterPage
                                onRegister={handleRegister}
                                onBack={() => window.history.back()}
                            />
                        } />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;