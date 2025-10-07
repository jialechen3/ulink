{filtered.map((item) => (
  <article
    key={item.id}
    className="mp-post"
    onClick={() => onOpenPost && onOpenPost(item)}      // 👈 click opens post detail
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onOpenPost && onOpenPost(item)}
    title="Open post"
  >
    {/* Post Header */}
    <div className="mp-post-head">
      <div className="mp-avatar sm">👩‍🎓</div>
      <div className="mp-post-texts">
        {item.title?.trim() ? (
          <div className="mp-post-title">{item.title}</div>
        ) : null}
        {item.description?.trim() ? (
          <div className="mp-post-desc">{item.description}</div>
        ) : null}
      </div>
    </div>

    {/* Post Image */}
    <div className="mp-post-media">
      <div className="mp-imgbox">
        {Array.isArray(item.pictures) && item.pictures[0] ? (
          <img
            src={item.pictures[0]}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px",
            }}
            loading="lazy"
          />
        ) : (
          <span className="mp-img-ic">🖼️</span>
        )}
      </div>
    </div>

    {/* Post Meta Info */}
    <div className="mp-post-meta">
      <span>{timeAgo(item.created_at)}</span>
      <span className="mp-dot" />
      <span className="mp-eye" aria-label="views">👁</span>
      <span>{item.views ?? 0}</span>
      <button
        className="mp-cmt"
        aria-label="comments"
        onClick={(e) => {
          e.stopPropagation();      // prevent outer click event
          onOpenPost && onOpenPost(item);
        }}
        title="Open comments"
      >
        💬
      </button>
    </div>

    <div className="mp-divider" />
  </article>
))}
