// src/ProfilePage.jsx
import "../styles/ProfilePage.css";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { API_BASE } from "../config.js";

export default function ProfilePage({ onBack, onHome, onGoProfile, onLogout }) {
  // ===== State =====
  const [user, setUser] = useState(null);
  const [uniName, setUniName] = useState("");
  const [universities, setUniversities] = useState([]);
  const [selectedUniId, setSelectedUniId] = useState(null);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 编辑态（四项：avatar, display_name, location, university）
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    avatar: "🐧",
    display_name: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);

  // 选中的 listing（用于 Edit / Delete）
  const [selectedId, setSelectedId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ===== Identity & Route =====
  const myId = useMemo(() => localStorage.getItem("userId"), []);
  const params = new URLSearchParams(window.location.search);
  const viewedId = params.get("id") || myId;
  const isSelf = String(viewedId || "") === String(myId || "");

  // ===== Local overrides (frontend-only) =====
  const loadOverrides = (uid) => {
    try {
      const raw = localStorage.getItem(`profile_overrides_${uid}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveOverrides = (uid, data) =>
    localStorage.setItem(`profile_overrides_${uid}`, JSON.stringify(data));

  // ===== Effects: load user, universities, listings =====
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);

        // 1) 用户
        const r1 = await fetch(`${API_BASE}/db.php?user=${encodeURIComponent(viewedId)}`);
        const d1 = await r1.json().catch(() => ({}));
        if (abort) return;

        if (d1?.user) {
          const overrides = loadOverrides(viewedId);
          const merged = { ...d1.user, ...overrides };
          setUser(merged);

          // 初始化编辑表单
          setForm({
            avatar: merged.avatar || "🐧",
            display_name: merged.display_name || merged.username || "",
            location: merged.location || "",
          });
        }

        // 2) 学校列表 + 当前学校
        const r2 = await fetch(`${API_BASE}/universities.php`);
        const d2 = await r2.json().catch(() => ({}));
        if (!abort) {
          const arr = Array.isArray(d2?.items) ? d2.items : Array.isArray(d2) ? d2 : [];
          setUniversities(arr);

          const initUniId =
            d1?.user?.university_id ??
            loadOverrides(viewedId)?.university_id ??
            localStorage.getItem("university");
          setSelectedUniId(initUniId ?? (arr[0]?.id ?? null));

          const hit = arr.find((x) => String(x.id) === String(initUniId));
          if (hit?.name) setUniName(hit.name);
        }

        // 3) 该用户的发布 —— 先按用户拉，失败再回退按学校拉后过滤
        let list = [];
        try {
          const r3 = await fetch(`${API_BASE}/db.php?listings_by_user=${encodeURIComponent(viewedId)}`);
          const d3 = await r3.json().catch(() => ({}));
          list = Array.isArray(d3?.listings) ? d3.listings : Array.isArray(d3?.items) ? d3.items : [];
        } catch (e) {
          // ignore
        }
        if (!list.length) {
          // 回退方案：按学校获取再过滤 user_id
          const uniIdForList = d1?.user?.university_id ?? localStorage.getItem("university");
          if (uniIdForList) {
            const r4 = await fetch(`${API_BASE}/db.php?listings_by_university=${encodeURIComponent(uniIdForList)}`);
            const d4 = await r4.json().catch(() => ({}));
            const all = Array.isArray(d4?.items) ? d4.items : [];
            list = all.filter(x => String(x.user_id) === String(viewedId));
          }
        }
        // 按时间倒序
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        if (!abort) setListings(list);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [viewedId]);

  // ===== Derived display =====
  const displayName = user?.display_name || user?.username || "User Name";
  const displayLoc  = user?.location || "Location";
  const displayUni  = uniName || "University";
  const avatarValue = user?.avatar || "🐧";

  // ===== Helpers =====
  function timeAgo(isoLike) {
    if (!isoLike) return "12 Hours ago";
    const t = new Date(isoLike).getTime();
    if (isNaN(t)) return "12 Hours ago";
    const diff = Math.max(0, Date.now() - t) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60) || 1} mins ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)} Hours ago`;
    return `${Math.floor(diff/86400)} days ago`;
  }
  
  function isUrlLike(s) {
    return /^(https?:)?\/\//.test(s || "");
  }
  
  async function fileToDataURL(file) {
    if (!file || !file.type.startsWith("image/")) throw new Error("请选择图片文件");
    const raw = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("读取文件失败"));
      r.readAsDataURL(file);
    });
    // 压缩至最长边 256，减小体积
    const img = new Image();
    const dataUrl = await new Promise((resolve) => {
      img.onload = () => {
        const max = 256;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const cvs = document.createElement("canvas");
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cvs.toDataURL("image/png"));
      };
      img.onerror = () => resolve(raw); // 兜底：用原始
      img.src = raw;
    });
    return dataUrl;
  }
  
  const AvatarPreview = ({ value, size = 72 }) => {
    const styleBox = {
      width: size, 
      height: size, 
      borderRadius: "50%",
      border: "1px solid #e5e8eb", 
      background: "#f8fafc",
      display: "grid", 
      placeItems: "center", 
      fontSize: size * 0.5, 
      overflow: "hidden"
    };
    const showImg = isUrlLike(value) || (value || "").startsWith("data:");
    return (
      <div style={styleBox} title="Avatar">
        {showImg ? <img src={value} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (value || "🙂")}
      </div>
    );
  };

  // ===== Save (frontend-only) =====
  const handleSave = async () => {
    setSaving(true);
    try {
      const uniHit = universities.find((u) => String(u.id) === String(selectedUniId));
      const overrides = {
        avatar: (form.avatar || "🐧").trim(),
        display_name: (form.display_name || "").trim() || user?.username || "",
        location: (form.location || "").trim(),
        university_id: selectedUniId,
        university_name: uniHit?.name || uniName,
        // 其余字段保持（不编辑）
        bio: user?.bio,
        contact: user?.contact,
      };
      saveOverrides(viewedId, overrides);
      setUser((u) => ({ ...u, ...overrides }));
      setUniName(overrides.university_name);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // ===== Listing operations =====
  const editListing = (id) => {
    const base = `${location.origin}${location.pathname}`.replace(/\/$/, "");
    window.location.href = `${base}#/createlisting/?edit=${encodeURIComponent(id)}`;
  };

  async function deleteListing(id) {
    if (!confirm("Delete this listing?")) return;
    try {
      const fd = new FormData();
      fd.append("action", "delete_listing");
      fd.append("id", id);
      await fetch(`${API_BASE}/db.php`, { method: "POST", body: fd }).catch(() => {});
    } finally {
      setListings((prev) => prev.filter((x) => String(x.id) !== String(id)));
      if (String(selectedId) === String(id)) setSelectedId(null);
    }
  }

  async function uploadAvatar(file) {
    if (!file || !file.type.startsWith("image/")) throw new Error("请选择图片文件");
    if (file.size > 5 * 1024 * 1024) throw new Error("图片过大（≤5MB）");

    const fd = new FormData();
    fd.append("file", file);

    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_BASE}/upload.php`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      const url = Array.isArray(data?.urls) ? data.urls[0] : null;
      if (!url) throw new Error(data?.message || "上传失败");
      return url;
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ===== Render =====
  return (
    <div className="pf-scope">
      <AppHeader
        username={displayName}
        onBack={onBack}
        onHome={onHome}
        onGoProfile={onGoProfile}
        onLogout={onLogout}
      />

      <main className="pf-container">
        {/* 顶部卡片 */}
        <section className="pf-topcard">
          <div className="pf-top-left">
            <div className="pf-avatar" aria-hidden>
              <AvatarPreview value={avatarValue} size={72} />
            </div>
          </div>
          <div className="pf-top-right">
            <div className="pf-pill">{displayName}</div>
            <div className="pf-pill">📍 {displayLoc}</div>
            <div className="pf-pill">{displayUni}</div>
          </div>
        </section>

        {/* 行为条：自己=Edit；他人=DM */}
        <section className={`pf-actionbar ${isSelf ? "self" : ""}`}>
          {!isSelf && <div className="pf-bubble" aria-hidden>💬</div>}
          {isSelf ? (
            <button className="pf-cta" onClick={() => setEditing(true)}>✏️ Edit Information</button>
          ) : (
            <button className="pf-cta">DM</button>
          )}
        </section>

        {/* 编辑表单（仅自己 & 编辑态） */}
        {isSelf && editing && (
          <section className="pf-editcard">
            <h3 className="pf-edit-title">Edit Profile</h3>
            <div className="pf-edit-grid">
              {/* Avatar：文本/URL/emoji + 纯前端上传 */}
              <label className="pf-field">
                <span className="pf-field-label">Avatar</span>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input
                    className="pf-input"
                    value={form.avatar}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadAvatar(file);
                        setForm((s) => ({ ...s, avatar: url }));
                      } catch (err) {
                        alert(err.message || "上传失败");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                  <label className="pf-btn" style={{ cursor:"pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display:"none" }}
                      onChange={async (e)=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await fileToDataURL(file);
                          setForm(s => ({ ...s, avatar: dataUrl }));
                        } catch (err) {
                          alert(err.message || "上传失败");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                    />
                    Upload
                  </label>
                  <div className="pf-avatar-preview" title="Preview">
                    {(isUrlLike(form.avatar) || (form.avatar || "").startsWith("data:"))
                      ? <img src={form.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : (form.avatar || "🙂")}
                  </div>
                </div>
              </label>

              <LabeledInput
                label="Display Name"
                value={form.display_name}
                onChange={(v)=>setForm(s=>({...s, display_name:v}))}
                placeholder="Your name"
              />

              <LabeledInput
                label="Location"
                value={form.location}
                onChange={(v)=>setForm(s=>({...s, location:v}))}
                placeholder="Buffalo, NY"
              />

              <label className="pf-field">
                <span className="pf-field-label">University</span>
                <select
                  className="pf-input"
                  value={selectedUniId ?? ""}
                  onChange={(e)=>setSelectedUniId(e.target.value)}
                >
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pf-edit-actions">
              <button className="pf-btn pf-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="pf-btn"
                onClick={()=>{
                  setForm({
                    avatar: avatarValue,
                    display_name: displayName,
                    location: displayLoc === "Location" ? "" : displayLoc,
                  });
                  setSelectedUniId(user?.university_id ?? selectedUniId);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <hr className="pf-divider" />

        {/* 列表区 */}
        <section className="pf-list">
          {/* 标题 + 操作按钮（仅自己可见） */}
          <div className="pf-list-header">
            {isSelf ? "My Listings" : "Listings"}
            {listings.length ? ` · ${listings.length}` : ""}
          </div>

          {loading ? (
            <div className="pf-empty">Loading…</div>
          ) : listings.length === 0 ? (
            <div className="pf-empty">No listings yet.</div>
          ) : (
            listings.map((it) => {
              // 解析图片
              let pics = [];
              try {
                if (typeof it.pictures === "string") {
                  pics = it.pictures.trim().startsWith("[")
                    ? JSON.parse(it.pictures)
                    : it.pictures.split(",").map(s => s.trim()).filter(Boolean);
                } else if (Array.isArray(it.pictures)) {
                  pics = it.pictures;
                }
              } catch {}
              const showCount = isSelf ? 2 : 1;
              const boxes = Array.from({ length: showCount });

              return (
                <article
                  key={it.id}
                  className={`pf-post ${String(selectedId) === String(it.id) ? 'pf-post-selected' : ''}`}
                  onClick={() => setSelectedId(it.id)}
                >
                  <header className="pf-post-head">
                    <div className="pf-post-left">
                      <span className="pf-mini-avatar" aria-hidden>
                        <AvatarPreview value={avatarValue} size={24} />
                      </span>
                      <div className="pf-post-titlewrap">
                        <div className="pf-post-title">{it.title || "Title"}</div>
                        <div className="pf-post-sub">I'm selling… {it?.description?.slice?.(0, 24) || "..."}</div>
                      </div>
                    </div>

                    {isSelf && (
                      <div className="pf-post-tools" onClick={(e)=>e.stopPropagation()}>
                        <button className="pf-iconbtn" title="Edit this" onClick={() => editListing(it.id)}>✏️</button>
                        <button className="pf-iconbtn" title="Delete this" onClick={() => deleteListing(it.id)}>🗑️</button>
                      </div>
                    )}
                  </header>

                  <div className="pf-post-images">
                    {boxes.map((_, i) => {
                      const url = pics[i];
                      return (
                        <div key={i} className="pf-imgbox">
                          {url ? <img src={url} alt="" /> : <span className="pf-imgph">🖼️</span>}
                        </div>
                      );
                    })}
                  </div>

                  <footer className="pf-post-foot">
                    <span className="pf-time">{timeAgo(it.created_at)}</span>
                    {(() => {
                      const safeViews =
                        Number.isFinite(+it.views) ? +it.views :
                        Number.isFinite(+it.view_count) ? +it.view_count : 0;
                      return (
                        <span className="pf-views" title={`${safeViews} views`}>
                          👁️ {formatViews(safeViews)}
                        </span>
                      );
                    })()}
                    <span className="pf-comment" aria-label="comment">💬</span>
                  </footer>
                </article>
              );
            })
          )}
        </section>

        <hr className="pf-divider tail"/>
      </main>
    </div>
  );
}

/* —— 小组件 —— */
function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label className="pf-field">
      <span className="pf-field-label">{label}</span>
      <input
        className="pf-input"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function formatViews(v) {
  const n = Number(v);
  const x = Number.isFinite(n) && n >= 0 ? n : 0;
  if (x < 1000) return String(x);
  if (x < 1e6)  return (x / 1000).toFixed(x % 1000 >= 100 ? 1 : 0) + "k";
  return (x / 1e6).toFixed(x % 1e6 >= 100000 ? 1 : 0) + "M";
}