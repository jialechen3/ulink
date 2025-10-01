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

  // HTML escaping function for security
  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Comprehensive username validation
  const validateUsername = (username) => {
    const sanitized = username.trim();
    
    // Check for leading/trailing spaces
    if (sanitized !== username) {
      return "Username cannot have leading or trailing spaces.";
    }
    
    // Check length
    if (sanitized.length < 3) {
      return "Username must be at least 3 characters long.";
    }
    
    if (sanitized.length > 20) {
      return "Username cannot exceed 20 characters.";
    }
    
    // Check allowed characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      return "Username can only contain letters, numbers, underscores, and hyphens.";
    }
    
    return null; // No errors
  };

  // Password validation rules
  const rules = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
  };
  const allValid = rules.length && rules.letter && rules.digit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      setError(usernameValidation);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!allValid) {
      setError("Password must be at least 8 characters and include both letters and numbers.");
      return;
    }

    setLoading(true);

    try {
      const sanitizedUsername = username.trim();
      
      const res = await fetch("./db.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "register", 
          name: sanitizedUsername, 
          password: password 
        }),
      });

      // Debug logging
      console.log("Status:", res.status);
      const responseText = await res.text();
      console.log("Raw response:", responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log("Parsed JSON:", data);
        
        if (res.ok && data.ok) {
          alert("Registered successfully!");
          onRegister?.(sanitizedUsername);
        } else {
          // Use escaped error message from server
          const safeMessage = escapeHtml(data?.message || `Registration failed (${res.status}).`);
          setError(safeMessage);
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        setError("Invalid server response. Please try again.");
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error or server unavailable. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time username validation feedback
  const [usernameError, setUsernameError] = useState("");

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // Only show validation errors after user starts typing
    if (value.length > 0) {
      const validationError = validateUsername(value);
      setUsernameError(validationError || "");
    } else {
      setUsernameError("");
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <button 
          className="icon-btn" 
          onClick={onBack} 
          disabled={loading}
          type="button"
        >
          ←
        </button>
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
            onChange={handleUsernameChange}
            required
            disabled={loading}
            placeholder="3-20 characters, letters, numbers, _-"
          />
          {usernameError && (
            <div className="error-text small">{usernameError}</div>
          )}
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
              placeholder="At least 8 characters with letters and numbers"
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
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
              placeholder="Re-enter your password"
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <div 
            className="error-text" 
            dangerouslySetInnerHTML={{ __html: error }}
          />
        )}

        <button 
          type="submit" 
          className="signup-btn" 
          disabled={loading || !allValid || usernameError}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;