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
            {/* 顶部工具栏 */}
            <div className="register-header header-without-search">
                {/* 用按钮 + 改 hash；并阻止默认与冒泡，避免被父级 <a href="/register/"> 抢走 */}
                <button
                    type="button"
                    className="signup-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 只改哈希，保证得到 #/register/，不会被服务器路径重写
                        window.location.hash = "/register/";
                    }}
                >
                    Sign Up
                </button>
                <div className="spacer" />
                <KebabMenu onReport={() => setShowReport(true)} />
            </div>

            {/* LOGO 区域 */}
            <div className="auth-logo-spot">
                <Logo size={36} />
            </div>

            <h1 className="register-title">Sign In</h1>

            {/* 登录表单 */}
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
