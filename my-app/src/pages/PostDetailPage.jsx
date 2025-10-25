import "../App.css";
import "../styles/postdetail.css";
import KebabMenu from "../components/KebabMenu.jsx";
import BugReportModal from "../components/BugReportModal.jsx";
import { useState } from "react";
import AppHeader from "../components/AppHeader.jsx";

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
  onAddComment,
}) {
  const [showReport, setShowReport] = useState(false);
  const [commentText, setCommentText] = useState("");

  if (!post) {
    return (
      <div className="pd-scope">
        <AppHeader
          username={username}
          onBack={onBack}
          onHome={onHome}
          onGoProfile={onGoProfile}
          onLogout={onLogout}
          onReport={() => setShowReport(true)}
          showSearch={false}
        />
        <div className="pd-container">
          <p style={{ textAlign: "center", marginTop: 60 }}>Post not found.</p>
        </div>
      </div>
    );
  }

  // 👇 Handle author profile click
  const handleAuthorClick = () => {
    const authorData = {
      action: "view_profile",
      author_id: post.user_id || post.username,
      author_name: post.username || "Anonymous",
      post_id: post.id,
      timestamp: new Date().toISOString()
    };
    
    console.log("Author profile clicked:", authorData);
    
    // Send to backend (optional)
    fetch("http://localhost/Ulink/db.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authorData)
    }).catch(err => console.error("Failed to send author data:", err));
    
    // Navigate to profile page (you'll implement this)
    if (onGoProfile) {
      onGoProfile(post.user_id || post.username);
    } else {
      // Fallback: alert for now
      alert(`Navigating to ${post.username || "Anonymous"}'s profile\nData sent: ${JSON.stringify(authorData)}`);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

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

    post.comments = [...(post.comments || []), { user: username || "Anonymous", text: commentText.trim() }];
    setCommentText("");
  };

  return (
    <div className="pd-scope">
      <AppHeader
        username={username}
        onBack={onBack}
        onHome={onHome}
        onGoProfile={onGoProfile}
        onLogout={onLogout}
        onReport={() => setShowReport(true)}
        showSearch={false}
      />

      <div className="pd-container">
        <main className="post-detail">
          
          {/* Post Header - Now clickable */}
          <div className="pd-head">
            <div className="pd-user" onClick={handleAuthorClick} style={{cursor: 'pointer'}}>
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
          
          {/* Post Price */}
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

            {/* Comment Input Area */}
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
      </div>

      <BugReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}