// BugReportModal.jsx
import { useEffect, useRef, useState } from "react";

export default function BugReportModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const [desc, setDesc] = useState("");
  const [steps, setSteps] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("UI");

  const pageName = document.title || "Unknown Page";
  const url = window.location.href;

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = (e) => {
    e.preventDefault();
    const payload = { pageName, url, category, desc, steps, contact, ts: new Date().toISOString() };
    console.log("[BugReport] submit", payload);
    alert("Thanks! Your bug report was captured in console for now.");
    onClose && onClose();
  };

  return (
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
  );
}
