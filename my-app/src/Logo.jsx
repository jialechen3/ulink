// src/Logo.jsx
import React from "react";
import "./App.css";   // 包含 .ulink-logo 的样式

export default function Logo({ size = 36, align = "center" }) {
    return (
        <div
            className="ulink-logo"
            style={{
                fontSize: size,
                textAlign: align,
                userSelect: "none",
            }}
        >
            <span className="ulink-u">U</span>Link
        </div>
    );
}
