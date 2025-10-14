// src/UniversitySelection.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import Logo from "./Logo";

export default function UniversitySelection({ userId, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const DB_URL = `${API_BASE}/db.php`;
  const UNI_URL = `${API_BASE}/universities.php`;

  // 拉取大学列表（支持搜索）
  useEffect(() => {
    let abort = false;
    const fetchUnis = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${UNI_URL}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!abort) {
          if (Array.isArray(data?.items)) {
            setUniversities(data.items);
          } else if (Array.isArray(data)) {
            // 兼容直接返回数组的旧 universities.php
            setUniversities(data);
          } else {
            setUniversities([]);
          }
        }
      } catch (e) {
        if (!abort) {
          setUniversities([]);
          setError("Failed to load universities.");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    };
    fetchUnis();
    return () => { abort = true; };
  }, [q]);

  const canConfirm = useMemo(() => !!selected && !!userId && !saving, [selected, userId, saving]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    setError("");

    try {
      // 将所选大学保存到后端（PATCH 到 db.php）
      const res = await fetch(DB_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(userId),
          university_id: Number(selected),
        }),
      });

      // 后端约定：成功时通常返回 { success: true, ... }，
      // 但也可能返回 { success: false, message: ... }
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success === undefined || data.success === true)) {
        // 通知上层完成 & 传回已选的 university_id
        onConfirm?.(String(selected));
      } else {
        const msg =
            data?.message ||
            `Failed to save university (HTTP ${res.status}).`;
        setError(msg);
      }
    } catch (e) {
      setError("Network error while saving university.");
    } finally {
      setSaving(false);
    }
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

          {/* 状态/错误 */}
          {error && <div className="uni-error" role="alert">{error}</div>}

          {/* 选项列表（用按钮保证暗色可控样式） */}
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
                disabled={saving}
            >
              Back
            </button>
            <button
                type="button"
                className="uni-btn primary"
                disabled={!canConfirm}
                onClick={handleConfirm}
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
  );
}
