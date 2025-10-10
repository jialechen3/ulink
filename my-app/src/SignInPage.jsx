import { useState } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import Logo from "./Logo";

export default function SignInPage({ onSignIn, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showReport, setShowReport] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/db.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "login", username, password }),
            });
            const data = await res.json();

            if (data.success) {
                // ✅ 不再弹 "Successfully logged in!"
                onSignIn && onSignIn(data.id);
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            {/* 顶部工具行（可保留你的 KebabMenu） */}
            <div className="register-header header-without-search">
                <button className="signup-btn" onClick={onBack} disabled={loading}>
                    Sign Up
                </button>
                <div className="spacer" />
                <KebabMenu onReport={() => setShowReport(true)} />
            </div>

            {/* ✅ 居中的 ULink Logo（标题上方） */}
            <div className="auth-logo-spot">
                <Logo size={36} />
            </div>

            <h1 className="register-title">Sign In</h1>

            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        disabled={loading}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error-text">{error}</div>}

                <button type="submit" className="signup-btn" disabled={loading}>
                    {loading ? "Logging in..." : "Log In"}
                </button>
            </form>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
