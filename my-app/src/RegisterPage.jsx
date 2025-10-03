import { useState } from "react";
import "./App.css";

function RegisterPage({ onRegister, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    // 密码规则
    const rules = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password),
    };

    const allValid = Object.values(rules).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!allValid) {
            setError("Password does not meet requirements.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            //const res = await fetch("http://localhost/Ulink/db.php", {
            const res = await fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z/db.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "register", username, password })
            });

            const data = await res.json();

            if (data.success) {
                alert("Registered successfully!");
                if (onRegister) onRegister(data.id); // ✅ 用 id
            } else {
                setError(data.message || "Registration failed.");
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

            <h1 className="register-title">Create Account</h1>

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
                    />
                </div>

                {error && <div className="error-text">{error}</div>}

                <button type="submit" className="signup-btn">Sign Up</button>
            </form>
        </div>
    );
}

export default RegisterPage;