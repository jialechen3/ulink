// src/EditListingPage.jsx
import React, { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import BugReportModal from "../components/BugReportModal.jsx";
import "../App.css";

export default function EditListingPage({ onBack, onHome, onGoProfile, onLogout }) {
  const [listingId, setListingId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // 从 hash 参数读取 id
  useEffect(() => {
    let search = "";
    if (window.location.hash.includes("?")) {
      search = window.location.hash.split("?")[1];
    }
    const params = new URLSearchParams(search);
    const id = params.get("id");
    if (id) setListingId(id);
  }, []);

  return (
    <div className="cl-root">
      <AppHeader
        username="User"
        onBack={onBack}
        onHome={onHome}
        onGoProfile={onGoProfile}
        onLogout={onLogout}
        onReport={() => setShowReport(true)}
      />

      <main
        style={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          fontWeight: 600,
          color: "#444",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        🛠️ Edit listing coming soon…
        <button
          style={{
            marginTop: "10px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            borderRadius: "8px",
            padding: "8px 14px",
            cursor: "pointer",
          }}
          onClick={() => window.history.back()}
        >
          ← Back to Profile
        </button>
      </main>

      <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
