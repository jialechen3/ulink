import { useState, useEffect, useRef } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import Logo from "./Logo";

export default function UniversitySelection({ userId, onConfirm }) {
  const [universities, setUniversities] = useState([]);
  const [filter, setFilter] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch(`${API_BASE}/universities.php`);
        const data = await res.json();
        if (data.items) setUniversities(data.items);
      } catch (err) {
        console.error("Failed to load universities:", err);
      }
    };
    fetchUniversities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!university) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/db.php`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, university_id: university }),
      });
      const data = await res.json();
      if (data.success) {
        alert("University saved!");
        onConfirm && onConfirm(university);
      } else {
        alert(data.message || "Failed to save.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uni-page">
      <div className="uni-card">
        <div className="uni-header">
          <Logo />
          <KebabMenu onReport={() => setShowReport(true)} />
        </div>

        <h2 className="uni-title">Choose Your University</h2>

        {/* ✅ 自定义可控 Select */}
        <div className="uni-select-box" ref={boxRef}>
          <input
            type="text"
            className="uni-dropdown"
            placeholder="Search or select university"
            value={filter}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              const val = e.target.value;
              setFilter(val);
              const match = universities.find(
                (u) => u.name.toLowerCase() === val.toLowerCase()
              );
              setUniversity(match ? match.id : "");
            }}
          />
          {open && filtered.length > 0 && (
            <div className="uni-dropdown-menu">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className={`uni-option ${
                    university === u.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setUniversity(u.id);
                    setFilter(u.name);
                    setOpen(false);
                  }}
                >
                  {u.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="uni-btn"
          onClick={handleConfirm}
          disabled={!university || loading}
        >
          {loading ? "Saving..." : "Confirm"}
        </button>
      </div>

      <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
