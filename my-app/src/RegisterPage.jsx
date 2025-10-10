import { useState } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import Logo from "./Logo";

/** ✅ 统一的本地校验规则（与后端保持一致） */
function usernameIssues(name) {
    const issues = [];
    if (name.length < 3 || name.length > 20) issues.push("Username must be 3–20 characters.");
    if (!/^[A-Za-z0-9_]+$/.test(name)) issues.push("Only letters, numbers, and underscore are allowed.");
    return issues;
}

function passwordIssues(pwd) {
    const issues = [];
    if (pwd.length < 8) issues.push("At least 8 characters.");
    if (!/[A-Z]/.test(pwd)) issues.push("At least one uppercase letter.");
    if (!/[a-z]/.test(pwd)) issues.push("At least one lowercase letter.");
    if (!/[^a-zA-Z0-9]/.test(pwd)) issues.push("At least one special character.");
    return issues;
}

export default function RegisterPage({ onRegister, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // 实时规则状态（用于打勾/打叉显示）
    const unameIssues = usernameIssues(username);
    const pwdIssues = passwordIssues(password);
    const allValid = unameIssues.length === 0 && pwdIssues.length === 0 && password === confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 1) 本地先给出“具体哪里不对”的提示并拦截提交
        if (unameIssues.length > 0) {
            setError(`Invalid username:\n- ${unameIssues.join("\n- ")}`);
            return;
        }
        if (pwdIssues.length > 0) {
            setError(`Invalid password:\n- ${pwdIssues.join("\n- ")}`);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        // 2) 通过本地校验后再请求后端
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/db.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "register", username, password }),
            });

            // 兼容：后端可能不是严格 JSON，先拿文本再尝试 JSON（避免直接进 catch 只剩通用报错）
            const raw = await res.text();
            let data = {};
            try { data = JSON.parse(raw); } catch {}

            if (res.ok && data?.success) {
                onRegister && onRegister(data.id);
                return;
            }

            // 失败分支：尽可能从内容里抽取可读原因
            const msg = String(data?.message || raw || "").toLowerCase();
            if (res.status === 409 || msg.includes("username already taken") || msg.includes("duplicate")) {
                setError("Username already taken. Please choose a different username.");
            } else if (res.status === 400 && msg.includes("invalid username")) {
                setError("Invalid username. Use 3–20 characters: letters, numbers, or underscore.");
            } else if (res.status === 400 && msg.includes("invalid password")) {
                setError("Invalid password. Must be at least 8 characters with upper, lower, and a special symbol.");
            } else if (res.status === 400 && msg.includes("missing")) {
                setError("Missing username or password.");
            } else if (msg) {
                setError(data.message || raw);
            } else {
                setError("Registration failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            {/* 顶部工具行 */}
            <div className="register-header header-without-search">
                <button className="icon-btn" onClick={onBack} disabled={loading} aria-label="Back">←</button>
                <div className="spacer" />
                <KebabMenu onReport={() => setShowReport(true)} />
            </div>

            {/* 居中的 Logo */}
            <div className="auth-logo-spot"><Logo size={36} /></div>

            <h1 className="register-title">Create Account</h1>

            <form onSubmit={handleSubmit} className="register-form">
                {/* Username */}
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        disabled={loading}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        // 仍然保留你的原生约束，双保险
                        pattern="[A-Za-z0-9_]{3,20}"
                        title="3-20 characters, only letters, numbers, and underscores"
                    />
                </div>

                {/* Username 规则提示（实时勾选） */}
                <ul className="password-rules" style={{ marginTop: -8 }}>
                    <li className={unameIssues.some(s => s.includes("3–20") || s.includes("3-20")) ? "invalid" : "valid"}>
                        {unameIssues.some(s => s.includes("3–20") || s.includes("3-20")) ? "✘" : "✔"} 3–20 characters
                    </li>
                    <li className={unameIssues.some(s => s.includes("letters") || s.includes("underscore")) ? "invalid" : "valid"}>
                        {unameIssues.some(s => s.includes("letters") || s.includes("underscore")) ? "✘" : "✔"} Letters / numbers / underscore
                    </li>
                </ul>

                {/* Password */}
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

                {/* Password 规则提示（实时勾选） */}
                <ul className="password-rules">
                    <li className={password.length >= 8 ? "valid" : "invalid"}>
                        {password.length >= 8 ? "✔" : "✘"} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? "valid" : "invalid"}>
                        {/[A-Z]/.test(password) ? "✔" : "✘"} One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? "valid" : "invalid"}>
                        {/[a-z]/.test(password) ? "✔" : "✘"} One lowercase letter
                    </li>
                    <li className={/[^a-zA-Z0-9]/.test(password) ? "valid" : "invalid"}>
                        {/[^a-zA-Z0-9]/.test(password) ? "✔" : "✘"} One special character
                    </li>
                </ul>

                {/* Confirm Password */}
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        disabled={loading}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                {/* 统一错误输出 */}
                {error && <div className="error-text" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}

                <button type="submit" className="signup-btn" disabled={loading || !allValid}>
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </form>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
