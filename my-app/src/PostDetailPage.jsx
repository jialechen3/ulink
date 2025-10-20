import "./App.css";
import "./postdetail.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import { useState } from "react";
import AppHeader from "./AppHeader.jsx";

export default function PostDetailPage({
  username,
  post,
  onBack,
  onHome,
  onGoProfile,
  onLogout,
}) {
  const [showReport, setShowReport] = useState(false);

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

  return (
    <div className="cg-root">
      {/* ✅ Keep your universal header */}
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
        {/* Post Header Info */}
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
            <KebabMenu onReport={() => setShowReport(true)} />
          </div>
        </div>

        {/* Post Title */}
        {post.title && <h2 className="pd-title">{post.title}</h2>}

        {/* Post Image (if available) */}
        {Array.isArray(post.pictures) && post.pictures[0] && (
          <div className="pd-media">
            <img
              src={post.pictures[0]}
              alt=""
              className="pd-img"
              loading="lazy"
            />
          </div>
        )}

        {/* Post Description */}
        {post.description && (
          <p className="pd-desc">{post.description}</p>
        )}

        {/* Post Stats */}
        <div className="pd-stats">
          <span className="pd-eye">👁 {post.views ?? 0}</span>
          <span className="pd-cmt">💬 {post.comments?.length ?? 0}</span>
        </div>

        {/* Comments Section Placeholder */}
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
        </div>
      </main>

      <BugReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
