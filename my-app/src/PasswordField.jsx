import { useState } from "react";

export default function PasswordField({
                                          label = "Password",
                                          value,
                                          onChange,
                                          disabled = false,
                                          required = true,
                                          name,
                                          placeholder,
                                      }) {
    const [show, setShow] = useState(false);

    return (
        <div className="form-group eye-wrap">
            <label>{label}:</label>
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                name={name}
                placeholder={placeholder}
                className="password-input"
                autoComplete={name === "new-password" ? "new-password" : "current-password"}
            />
            <button
                type="button"
                className="eye-btn"
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                onClick={() => setShow((s) => !s)}
            >
                {show ? "🙈" : "👁"}
            </button>
        </div>
    );
}
