import { useState } from "react";
import "./App.css";

function RegisterPage({ onRegister, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 密码规则
    const rules = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password),
    };

    const allValid = Object.values(rules).every(Boolean);

    // HTML Injection Prevention
    const containsHTML = (text) => {
        return /<[^>]*>|&[^;]+;|javascript:|on\w+\s*=/.test(text);
    };

    // SQL Injection Prevention
    const containsSQLInjection = (text) => {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b)/i,
            /('|"|;|--|\/\*|\*\/|\\\\)/,
            /(\b(1=1|0=0)\b)/i
        ];
        return sqlPatterns.some(pattern => pattern.test(text));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // HTML Injection Check
        if (containsHTML(username)) {
            setError("Invalid characters in username - HTML tags not allowed");
            return;
        }

        // SQL Injection Check
        if (containsSQLInjection(username)) {
            setError("Invalid characters in username - SQL injection detected");
            return;
        }

        if (!allValid) {
            setError("Password does not meet requirements.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("./db.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "register", name: username, password })
            });

            // Handle 409 (duplicate username) specifically
            if (res.status === 409) {
                setError("Username already taken.");
                return;
            }

            const data = await res.json();

            if (res.ok && data.ok) {
                alert("Registered successfully!");
                if (onRegister) onRegister(data.id);
            } else {
                setError(data?.message || "Registration failed.");
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
            <div className="register-header">
                <button className="icon-btn" onClick={onBack} disabled={loading}>←</button>
                <div className="spacer" />
                <button className="icon-btn" disabled>⋮</button>
            </div>

            <h1 className="register-title">Create Account</h1>

            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                        pattern="[A-Za-z0-9_]{3,20}"
                        title="3-20 characters, only letters, numbers, and underscores"
                    />
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <ul className="password-rules">
                    <li className={rules.length ? "valid" : "invalid"}>
                        {rules.length ? "✔" : "✘"} At least 8 characters
                    </li>
                    <li className={rules.uppercase ? "valid" : "invalid"}>
                        {rules.uppercase ? "✔" : "✘"} One uppercase letter
                    </li>
                    <li className={rules.lowercase ? "valid" : "invalid"}>
                        {rules.lowercase ? "✔" : "✘"} One lowercase letter
                    </li>
                    <li className={rules.special ? "valid" : "invalid"}>
                        {rules.special ? "✔" : "✘"} One special character
                    </li>
                </ul>

                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                {error && <div className="error-text">{error}</div>}

                <button type="submit" className="signup-btn" disabled={loading || !allValid}>
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;