import { useState, useEffect } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import Logo from "./Logo"; // ✅ 你已有 Logo.jsx 或可用文字替代
import { API_BASE } from "./config";


export default function UniversitySelection({ userId, onConfirm }) {
  const [universities, setUniversities] = useState([]);
  const [filter, setFilter] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase())
  );
    // ✅ 组件加载时获取大学列表
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                // 拉取 universities.php
                //const res = await fetch("http://localhost/Ulink/universities.php");
                const res = await fetch(`${API_BASE}/universities.php`);

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
    } catch (err) {
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
        // PATCH 请求，保存 university_id
        //const res = await fetch("http://localhost/Ulink/db.php", {
        const res = await fetch(`${API_BASE}/db.php`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, university_id: university }),
        });

        {/* ✅ 搜索 + 选择合并组件 */}
            <div className="search-select">
            <input
                    type="text"
                    value={filter}
                    placeholder="🔍 Search or select university..."
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilter(val);
                        // ✅ 检查是否匹配某个大学名，匹配则设置 ID
                        const match = universities.find(
                        (u) => u.name.toLowerCase() === val.toLowerCase()
                        );
                        setUniversity(match ? match.id : "");
                    }}
                    className="uni-search"
                    list="uni-list"
                    />

            <datalist id="uni-list">
                {filtered.map((u) => (
                <option key={u.id} value={u.name} />
                ))}
            </datalist>
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
