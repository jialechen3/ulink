import { useState } from "react";
import "./App.css";

function RegisterPage({ onRegister, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 与后端 V2 对齐：≥8 且包含字母和数字（符号可选）
  const rules = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
  };
  const allValid = rules.length && rules.letter && rules.digit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    const name = username.trim();
    if (name !== username) {
      setError("Username cannot have leading/trailing spaces.");
      return;
    }
    if (!allValid) {
      setError("Password must be ≥8 chars and include letters and digits.");
      return;
    }


    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost/Ulink/db.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", name, password }),
        }
      );

      if (res.status === 409) {
        const data = await res.json().catch(() => null);
        setError("Username already taken.");
        return;
      }

      if (res.status === 400) {
        const data = await res.json().catch(() => null);
        if (data?.error === "INVALID_USERNAME") {
          setError("Username must be 3–20 chars, letters/digits/underscore only.");
        } else if (data?.error === "WEAK_PASSWORD") {
          setError("Password must be ≥8 chars and include letters and digits.");
        } else {
          setError("Invalid input.");
        }
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        alert("Registered successfully!");
        onRegister?.(name);
      } else {
        setError(data?.message || `Registration failed (${res.status}).`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error or server unavailable.");
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
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <ul className="password-rules">
          <li className={rules.length ? "valid" : "invalid"}>
            {rules.length ? "✔" : "✘"} At least 8 characters
          </li>
          <li className={rules.letter ? "valid" : "invalid"}>
            {rules.letter ? "✔" : "✘"} Contains a letter
          </li>
          <li className={rules.digit ? "valid" : "invalid"}>
            {rules.digit ? "✔" : "✘"} Contains a digit
          </li>
        </ul>

        <div className="form-group">
          <label>Confirm Password:</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
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