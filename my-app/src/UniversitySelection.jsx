// src/UniversitySelection.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import Logo from "./Logo";

export default function UniversitySelection({ userId, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("");

  // 拉取大学列表
  useEffect(() => {
    let abort = false;
    const fetchUnis = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/universities.php${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!abort && Array.isArray(data?.items)) {
          setUniversities(data.items);
        }
      } catch (_) {
        if (!abort) setUniversities([]);
      } finally {
        if (!abort) setLoading(false);
      }
    };
    fetchUnis();
    return () => { abort = true; };
  }, [q]);

  const canConfirm = useMemo(() => !!selected, [selected]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    // 回调给上层
    onConfirm?.(selected);
  };

  return (
      <div className="uni-page">
        <div className="uni-card">
          {/* 顶部 Logo + 菜单 */}
          <div className="uni-header">
            <div className="logo"><Logo size={30} /></div>
            <div className="kebab-wrapper">
              <KebabMenu onReport={() => { /* 可接 BugReportModal */ }} />
            </div>
          </div>

          <h1 className="uni-title">Select your university</h1>
          <p className="uni-sub">We’ll personalize your feed based on your campus.</p>

          {/* 搜索框 */}
          <div className="uni-search">
            <input
                className="uni-input"
                type="search"
                placeholder="Search university…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search university"
            />
          </div>

          {/* 选项列表（自定义列表，避免 <select> 在暗色下样式受限） */}
          <div className="uni-list" role="listbox" aria-label="Universities">
            {loading && <div className="uni-empty">Loading…</div>}

            {!loading && universities.length === 0 && (
                <div className="uni-empty">No results</div>
            )}

            {!loading && universities.map((u) => {
              const active = String(selected) === String(u.id);
              return (
                  <button
                      key={u.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`uni-item${active ? " is-active" : ""}`}
                      onClick={() => setSelected(String(u.id))}
                  >
                    <span className="uni-item-name">{u.name}</span>
                    <span className="uni-dot" aria-hidden>●</span>
                  </button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="uni-actions">
            <button
                type="button"
                className="uni-btn ghost"
                onClick={() => window.history.back()}
            >
              Back
            </button>
            <button
                type="button"
                className="uni-btn primary"
                disabled={!canConfirm}
                onClick={handleConfirm}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
  );
}
