import { useState } from "react";
import "./App.css";

function SignInPage({ onSignIn, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch("http://localhost/Ulink/db.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "login", username, password })
            });

            const data = await res.json();

            if (data.success) {
                alert("Login successful!");
                if (onSignIn) onSignIn(data.id); // ✅ 用 id
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="register-container">
            <div className="register-header">
                <button className="icon-btn" onClick={onBack}>←</button>
                <div className="spacer" />
                <button className="icon-btn">⋮</button>
            </div>

            <h1 className="register-title">Sign In</h1>

            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error-text">{error}</div>}
                <button type="submit" className="signup-btn">Log In</button>
            </form>
        </div>
    );
}

export default SignInPage;
