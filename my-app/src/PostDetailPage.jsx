import "./App.css";
import "./postdetail.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import { useState } from "react";
import AppHeader from "./AppHeader.jsx";

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function PostDetailPage({
  username,
  post,
  onBack,
  onHome,
  onGoProfile,
  onLogout,
  onAddComment,   // 👈 optional callback to backend later
}) {
  const [showReport, setShowReport] = useState(false);
  const [commentText, setCommentText] = useState(""); // 👈 new input state

  if (!post) {
    return (
      <div className="cg-root">
        <AppHeader
          username={username}
          onBack={onBack}
          onHome={onHome}
          onGoProfile={onGoProfile}
          onLogout={onLogout}
          onReport={() => setShowReport(true)}
          showSearch={false}
        />
        <main className="cg-main">
          <p style={{ textAlign: "center", marginTop: 60 }}>Post not found.</p>
        </main>
      </div>
    );
  }

  // 👇 handle local add comment (frontend only)
  const handleAddComment = async () => {
  if (!commentText.trim()) return;

  // HTML-escape before sending
  const safeText = escapeHTML(commentText.trim());

  const payload = {
    action: "add_comment",
    post_id: post.id,
    username: username || "Anonymous",
    text: safeText,
  };

  try {
    const res = await fetch("http://localhost/Ulink/db.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Server response:", data);
  } catch (err) {
    console.error("Failed to send comment:", err);
  }

  // optional: add locally for instant feedback
  post.comments = [...(post.comments || []), { user: username || "Anonymous", text: commentText.trim() }];
  setCommentText("");
};

  return (
    <div className="cg-root">
      <AppHeader
        username={username}
        onBack={onBack}
        onHome={onHome}
        onGoProfile={onGoProfile}
        onLogout={onLogout}
        onReport={() => setShowReport(true)}
        showSearch={false}
      />

      <main className="cg-main post-detail">
        {/* Post Header */}
        <div className="pd-head">
          <div className="pd-user">
            <div className="pd-avatar">👩‍🎓</div>
            <div className="pd-user-info">
              <div className="pd-username">{post.username || "Anonymous"}</div>
              <div className="pd-time">
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="pd-menu">
            {/*<KebabMenu onReport={() => setShowReport(true)} >*/}
          </div>
        </div>

        {/* Post Title */}
        {post.title && <h2 className="pd-title">{post.title}</h2>}

        {/* Post Image */}
        {Array.isArray(post.pictures) && post.pictures[0] && (
          <div className="pd-media">
            <img src={post.pictures[0]} alt="" className="pd-img" loading="lazy" />
          </div>
        )}

        {/* Post Description */}
        {post.description && <p className="pd-desc">{post.description}</p>}
        {/* Post Price (if available) */}
        {post.price !== undefined && post.price !== null && post.price !== 0 && (
          <div className="pd-price">
            💲{parseFloat(post.price).toFixed(2)}
          </div>
        )}
        {/* Post Stats */}
        <div className="pd-stats">
          <span className="pd-eye">👁 {post.views ?? 0}</span>
          <span className="pd-cmt">💬 {post.comments?.length ?? 0}</span>
        </div>

        {/* Comments Section */}
        <div className="pd-comments">
          <h3>Comments</h3>
          {Array.isArray(post.comments) && post.comments.length > 0 ? (
            post.comments.map((c, i) => (
              <div key={i} className="pd-comment">
                <div className="pd-comment-avatar">🗣️</div>
                <div className="pd-comment-body">
                  <div className="pd-comment-user">{c.user || "User"}</div>
                  <div className="pd-comment-text">{c.text}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="pd-no-comments">No comments yet.</p>
          )}

          {/* 👇 New Comment Input Area */}
          <div className="pd-comment-input">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows="2"
            />
            <button onClick={handleAddComment}>Post</button>
          </div>
        </div>
      </main>

      <BugReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
    
  );
}
