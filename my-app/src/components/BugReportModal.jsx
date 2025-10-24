// BugReportModal.jsx
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../config.js";

export default function BugReportModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const [desc, setDesc] = useState("");
  const [steps, setSteps] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("UI");
  const [toast, setToast] = useState("");

  const pageName = document.title || "Unknown Page";
  const url = window.location.href;

  useEffect(() => {
    if (isOpen && dialogRef.current) dialogRef.current.focus();
  }, [isOpen]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      action: "report_bug",
      user_id: localStorage.getItem("userId") || 0,  // 未登录就用 0
      page_name: pageName,
      url,
      category,
      desc,
      steps,
      contact,
    };

    try {
      const res = await fetch(`${API_BASE}/db.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast("✅ Report submitted successfully!");
        setDesc(""); setSteps(""); setContact(""); setCategory("UI");
        onClose && onClose();
      } else {
        showToast("❌ Failed to submit report.");
      }
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network or server error.");
    }
  };

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 500,
            zIndex: 9999,
            animation: "fadeInOut 2.5s ease-in-out",
          }}
        >
          {toast}
        </div>
      )}

      {isOpen && (
        <div className="modal-backdrop" onClick={onClose}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Report a bug"
            tabIndex={-1}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          >
            <h2>Report a bug</h2>
            <div className="modal-meta">
              <div><strong>Page:</strong> {pageName}</div>
              <div className="truncate"><strong>URL:</strong> {url}</div>
            </div>

            <form onSubmit={submit} className="modal-form">
              <label className="modal-row">
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>UI</option>
                  <option>Functional</option>
                  <option>Performance</option>
                  <option>Data</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="modal-row">
                <span>Description</span>
                <textarea
                  required
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What happened? What did you expect?"
                />
              </label>

              <label className="modal-row">
                <span>Steps to Reproduce</span>
                <textarea
                  rows={3}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1) ... 2) ... 3) ..."
                />
              </label>

              <label className="modal-row">
                <span>Contact (optional)</span>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or Discord"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={onClose}>Cancel</button>
                <button type="submit" className="signup-btn">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
