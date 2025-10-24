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
  const [selectedId, setSelectedId] = useState(null);

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({
    display_name: "",
    location: "",
    university_id: null
  });

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ===== Identity & Route =====
  const myId = useMemo(() => localStorage.getItem("userId"), []);
  const params = new URLSearchParams(window.location.search);
  const viewedId = params.get("id") || myId;
  const isSelf = String(viewedId || "") === String(myId || "");

  console.log("🚀 ProfilePage Debug:", { 
    myId, 
    viewedId, 
    isSelf, 
    userId: localStorage.getItem("userId"),
    API_BASE 
  });

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
        console.log("📥 Starting to load profile data...");

        // 1) 用户
        console.log("👤 Fetching user data from:", `${API_BASE}/db.php?user=${encodeURIComponent(viewedId)}`);
        const r1 = await fetch(`${API_BASE}/db.php?user=${encodeURIComponent(viewedId)}`);
        console.log("📊 User response status:", r1.status);
        const responseText = await r1.text();
        console.log("📄 Raw user response:", responseText);
        
        let d1;
        try {
          d1 = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError);
          d1 = {};
        }
        
        console.log("👤 User data parsed:", d1);
        if (abort) return;

        if (d1?.user) {
          console.log("✅ Found user data:", d1.user);
          const overrides = loadOverrides(viewedId);
          console.log("📋 Overrides:", overrides);
          const merged = { ...d1.user, ...overrides };
          setUser(merged);
        } else {
          console.log("❌ No user data found in API response");
          const defaultUser = {
            id: viewedId,
            username: "User" + viewedId,
            display_name: "User Name",
            location: "Location",
            university_id: null
          };
          setUser(defaultUser);
        }

        // 2) 学校列表 + 当前学校
        console.log("🎓 Fetching universities from:", `${API_BASE}/universities.php`);
        const r2 = await fetch(`${API_BASE}/universities.php`);
        console.log("📊 Universities response status:", r2.status);
        const uniResponseText = await r2.text();
        console.log("📄 Raw universities response:", uniResponseText);
        
        let d2;
        try {
          d2 = JSON.parse(uniResponseText);
        } catch (parseError) {
          console.error("❌ Universities JSON parse error:", parseError);
          d2 = {};
        }
        
        console.log("🎓 Universities data parsed:", d2);
        if (!abort) {
          const arr = Array.isArray(d2?.items) ? d2.items : Array.isArray(d2) ? d2 : [];
          console.log("🏫 Universities array:", arr);
          setUniversities(arr);

          const initUniId = d1?.user?.university_id ?? loadOverrides(viewedId)?.university_id ?? localStorage.getItem("university");
          console.log("🎯 Initial university ID:", initUniId);
          setSelectedUniId(initUniId ?? (arr[0]?.id ?? null));

          const hit = arr.find((x) => String(x.id) === String(initUniId));
          if (hit?.name) {
            setUniName(hit.name);
            console.log("🏷️ University name set to:", hit.name);
          }
        }

        // 3) 该用户的发布
        console.log("📝 Fetching listings...");
        let list = [];
        try {
          const r3 = await fetch(`${API_BASE}/db.php?listings_by_user=${encodeURIComponent(viewedId)}`);
          const d3 = await r3.json().catch(() => ({}));
          list = Array.isArray(d3?.listings) ? d3.listings : Array.isArray(d3?.items) ? d3.items : [];
          console.log("📦 Listings from user endpoint:", list);
        } catch (e) {
          console.log("❌ User listings endpoint failed:", e);
        }
        
        if (!list.length) {
          console.log("🔍 No listings from user endpoint, trying university endpoint...");
          const uniIdForList = d1?.user?.university_id ?? localStorage.getItem("university");
          if (uniIdForList) {
            const r4 = await fetch(`${API_BASE}/db.php?listings_by_university=${encodeURIComponent(uniIdForList)}`);
            const d4 = await r4.json().catch(() => ({}));
            const all = Array.isArray(d4?.items) ? d4.items : [];
            list = all.filter(x => String(x.user_id) === String(viewedId));
            console.log("📦 Listings from university endpoint:", list);
          }
        }
        
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        if (!abort) setListings(list);
        console.log("✅ Final listings:", list);
      } catch (error) {
        console.error("💥 Error loading profile:", error);
      } finally {
        if (!abort) {
          setLoading(false);
          console.log("🏁 Loading complete");
        }
      }
    })();
    return () => { abort = true; };
  }, [viewedId]);

  // ===== TEMPORARY FALLBACK - If APIs fail =====
  useEffect(() => {
    if (!user && !loading) {
      console.log("🆘 No user data after loading, creating fallback...");
      setUser({
        id: viewedId,
        username: "demo_user",
        display_name: "Demo User", 
        location: "Buffalo, NY",
        university_id: 1
      });
      setUniName("University at Buffalo");
      setListings([]);
    }
  }, [user, loading, viewedId]);

  // ===== Derived display =====
  const displayName = user?.display_name || user?.username || "User Name";
  const displayLoc  = user?.location || "Location";
  const displayUni  = uniName || "University";
  const avatarValue = user?.avatar || "🐧";

  console.log("🎨 Derived display values:", { displayName, displayLoc, displayUni, avatarValue });

  // ===== Show loading state =====
  if (loading) {
    return (
      <div className="pf-scope">
        <AppHeader
          username="Loading..."
          onBack={onBack}
          onHome={onHome}
          onGoProfile={onGoProfile}
          onLogout={onLogout}
        />
        <main className="pf-container">
          <div className="pf-empty">Loading profile...</div>
        </main>
      </div>
    );
  }

  // ===== Show fallback if no data =====
  if (!user) {
    return (
      <div className="pf-scope">
        <AppHeader
          username="User"
          onBack={onBack}
          onHome={onHome}
          onGoProfile={onGoProfile}
          onLogout={onLogout}
        />
        <main className="pf-container">
          <section className="pf-topcard">
            <div className="pf-top-left">
              <div className="pf-avatar" aria-hidden>🙂</div>
            </div>
            <div className="pf-top-right">
              <div className="pf-pill">User Name</div>
              <div className="pf-pill">📍 Location</div>
              <div className="pf-pill">University</div>
            </div>
          </section>
          <div className="pf-empty">No profile data available</div>
        </main>
      </div>
    );
  }

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

  // ===== Inline Editing Functions =====
  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValues(prev => ({
      ...prev,
      [field]: currentValue
    }));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValues({
      display_name: "",
      location: "",
      university_id: null
    });
  };

  const saveField = async (field) => {
    const uniHit = universities.find((u) => String(u.id) === String(tempValues.university_id || selectedUniId));
    const overrides = {
      ...loadOverrides(viewedId),
      [field]: tempValues[field],
      university_id: tempValues.university_id || selectedUniId,
      university_name: uniHit?.name || uniName,
    };
    
    saveOverrides(viewedId, overrides);
    setUser((u) => ({ ...u, ...overrides }));
    if (field === 'university_id' && uniHit?.name) {
      setUniName(uniHit.name);
    }
    setEditingField(null);
    setTempValues({
      display_name: "",
      location: "",
      university_id: null
    });
  };

  // ===== Avatar Upload =====
  async function uploadAvatar(file) {
    if (!file || !file.type.startsWith("image/")) throw new Error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image too large (≤5MB)");

    const fd = new FormData();
    fd.append("file", file);

    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_BASE}/upload.php`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      const url = Array.isArray(data?.urls) ? data.urls[0] : null;
      if (!url) throw new Error(data?.message || "Upload failed");
      
      // Save the avatar URL
      const overrides = {
        ...loadOverrides(viewedId),
        avatar: url
      };
      saveOverrides(viewedId, overrides);
      setUser((u) => ({ ...u, avatar: url }));
      return url;
    } finally {
      setUploadingAvatar(false);
    }
  }

const AvatarPreview = ({ value, size = 88 }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const styleBox = {
    width: size, 
    height: size, 
    borderRadius: "50%",
    border: "1px solid #e5e8eb", 
    background: "#f8fafc",
    display: "grid", 
    placeItems: "center", 
    fontSize: size * 0.5, 
    overflow: "hidden",
    cursor: isSelf ? "pointer" : "default",
    position: 'relative'
  };
  
  const showImg = isUrlLike(value) || (value || "").startsWith("data:");
  
  const handleAvatarClick = () => {
    if (isSelf) {
      document.getElementById('avatar-upload-input')?.click();
    }
  };

  const handleMouseEnter = () => {
    if (isSelf) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <>
      <div 
        style={styleBox} 
        title={isSelf ? "Click to change avatar" : "Avatar"} 
        onClick={handleAvatarClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showImg ? (
          <img src={value} alt="Profile avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        ) : (
          value || "🙂"
        )}
        
        {isSelf && isHovering && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(12, size * 0.15),
            fontWeight: '500',
            borderRadius: '50%'
          }}>
            Edit
          </div>
        )}
      </div>
      <input
        id="avatar-upload-input"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            await uploadAvatar(file);
          } catch (err) {
            alert(err.message || "Upload failed");
          } finally {
            e.target.value = "";
          }
        }}
      />
    </>
  );
};

  // ===== Listing operations =====
  const editListing = (id) => {
    const base = `${location.origin}${location.pathname}`.replace(/\/$/, "");
    window.location.href = `${base}#/createlisting/?edit=${encodeURIComponent(id)}`;
  };

  const confirmDelete = (id) => {
    setListingToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!listingToDelete) return;
    
    try {
      const fd = new FormData();
      fd.append("action", "delete_listing");
      fd.append("id", listingToDelete);
      await fetch(`${API_BASE}/db.php`, { method: "POST", body: fd }).catch(() => {});
    } finally {
      setListings((prev) => prev.filter((x) => String(x.id) !== String(listingToDelete)));
      setShowDeleteModal(false);
      setListingToDelete(null);
    }
  };

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
        {/* Enhanced Top Card */}
        <section className="pf-topcard">
          <div className="pf-top-left">
            <div className="pf-avatar" aria-hidden>
              <AvatarPreview value={avatarValue} size={88} />
          
            </div>
          </div>
          <div className="pf-top-right">
            <div className="pf-user-info">
              {/* Display Name */}
              {/* Display Name - Inline Editable */}
<div className="pf-pill-editable">
  {editingField === 'display_name' ? (
    <div className="pf-edit-row">
      <input
        className="pf-edit-input"
        value={tempValues.display_name}
        onChange={(e) => setTempValues(prev => ({...prev, display_name: e.target.value}))}
        placeholder="Enter your display name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveField('display_name');
          if (e.key === 'Escape') cancelEditing();
        }}
      />
      <button 
        type="button"
        className="pf-save-btn" 
        onClick={(e) => {
          e.stopPropagation();
          saveField('display_name');
        }}
        title="Save"
      >
        ✓
      </button>
      <button 
        type="button"
        className="pf-cancel-btn" 
        onClick={(e) => {
          e.stopPropagation();
          cancelEditing();
        }}
        title="Cancel"
      >
        ✕
      </button>
    </div>
  ) : (
    <div 
      className="pf-pill pf-editable"
      onClick={() => isSelf && startEditing('display_name', displayName)}
      title={isSelf ? "Click to edit" : ""}
    >
      👤 {displayName}
      {isSelf && <span className="pf-edit-hint">Edit</span>}
    </div>
  )}
</div>

{/* Location - Inline Editable */}
<div className="pf-pill-editable">
  {editingField === 'location' ? (
    <div className="pf-edit-row">
      <input
        className="pf-edit-input"
        value={tempValues.location}
        onChange={(e) => setTempValues(prev => ({...prev, location: e.target.value}))}
        placeholder="Enter your location"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveField('location');
          if (e.key === 'Escape') cancelEditing();
        }}
      />
      <button 
        type="button"
        className="pf-save-btn" 
        onClick={(e) => {
          e.stopPropagation();
          saveField('location');
        }}
      >
        ✓
      </button>
      <button 
        type="button"
        className="pf-cancel-btn" 
        onClick={(e) => {
          e.stopPropagation();
          cancelEditing();
        }}
      >
        ✕
      </button>
    </div>
  ) : (
    <div 
      className="pf-pill pf-editable"
      onClick={() => isSelf && startEditing('location', displayLoc === "Location" ? "" : displayLoc)}
      title={isSelf ? "Click to edit" : ""}
    >
      📍 {displayLoc}
      {isSelf && <span className="pf-edit-hint">Edit</span>}
    </div>
  )}
</div>

{/* University - Inline Editable */}
<div className="pf-pill-editable">
  {editingField === 'university_id' ? (
    <div className="pf-edit-row">
      <select
        className="pf-edit-select"
        value={tempValues.university_id || selectedUniId}
        onChange={(e) => setTempValues(prev => ({...prev, university_id: e.target.value}))}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveField('university_id');
          if (e.key === 'Escape') cancelEditing();
        }}
      >
        <option value="">Select University</option>
        {universities.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <button 
        type="button"
        className="pf-save-btn" 
        onClick={(e) => {
          e.stopPropagation();
          saveField('university_id');
        }}
      >
        ✓
      </button>
      <button 
        type="button"
        className="pf-cancel-btn" 
        onClick={(e) => {
          e.stopPropagation();
          cancelEditing();
        }}
      >
        ✕
      </button>
    </div>
  ) : (
    <div 
      className="pf-pill pf-editable"
      onClick={() => isSelf && startEditing('university_id', selectedUniId)}
      title={isSelf ? "Click to edit" : ""}
    >
      🎓 {displayUni}
      {isSelf && <span className="pf-edit-hint">Edit</span>}
    </div>
  )}
</div>
            </div>
          </div>
        </section>

        <hr className="pf-divider" />

        {/* Listings Section */}
        <section className="pf-list">
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
                        <button className="pf-iconbtn" title="Delete this" onClick={() => confirmDelete(it.id)}>🗑️</button>
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

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="pf-modal-backdrop">
          <div className="pf-modal">
            <h3>Delete Listing</h3>
            <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
            <div className="pf-modal-actions">
              <button className="pf-btn pf-btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="pf-btn pf-btn-danger" onClick={executeDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatViews(v) {
  const n = Number(v);
  const x = Number.isFinite(n) && n >= 0 ? n : 0;
  if (x < 1000) return String(x);
  if (x < 1e6)  return (x / 1000).toFixed(x % 1000 >= 100 ? 1 : 0) + "k";
  return (x / 1e6).toFixed(x % 1e6 >= 100000 ? 1 : 0) + "M";
}