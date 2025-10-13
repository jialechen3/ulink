import { useState, useEffect } from "react";
import { API_BASE } from "./config";
import Logo from "./Logo";

function UniversitySelection({ userId, onConfirm }) {
    const [university, setUniversity] = useState(""); // 保存选择的大学 ID
    const [universities, setUniversities] = useState([]); // 保存大学列表
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ✅ 加载大学列表
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const res = await fetch(`${API_BASE}/universities.php`);
                const data = await res.json();
                if (data.items) {
                    setUniversities(data.items);
                }
            } catch (err) {
                console.error("Failed to load universities:", err);
                setError("Failed to load universities.");
            } finally {
                setLoading(false);
            }
        };
        fetchUniversities();
    }, []);

    // ✅ 点击确认
    const handleConfirm = async () => {
        if (!university || saving) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/db.php`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, university_id: university }),
            });
            const data = await res.json();
            if (data.success) {
                if (onConfirm) onConfirm(university);
            } else {
                setError(data.message || "Failed to save university.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error, please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="screen-university">
            <div className="card">
                <div className="auth-logo-spot">
                    <Logo size={36} />
                </div>
                <h1>Select Your University</h1>

                {error && (
                    <div
                        style={{
                            color: "#d32f2f",
                            background: "#ffebee",
                            border: "1px solid #ffcdd2",
                            padding: "8px",
                            borderRadius: "6px",
                            marginBottom: "12px",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    style={{
                        padding: "0.6rem",
                        fontSize: "1rem",
                        margin: "1rem 0",
                        width: "100%",
                        borderRadius: "8px",
                    }}
                    disabled={loading}
                >
                    <option value="">Select Your University</option>
                    {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleConfirm}
                    disabled={!university || saving || loading}
                    style={{
                        backgroundColor: "#57a9ff",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.7rem 1rem",
                        width: "100%",
                        cursor: !university || saving ? "not-allowed" : "pointer",
                        opacity: !university || saving ? 0.6 : 1,
                        fontWeight: 600,
                        transition: "background 0.2s ease",
                    }}
                >
                    {loading ? "Loading..." : saving ? "Saving..." : "Confirm"}
                </button>
            </div>
        </div>
    );
}

export default UniversitySelection;
