// KebabMenu.jsx
import { useEffect, useRef, useState } from "react";

export default function KebabMenu({ onReport }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Basic roving focus inside the menu (only one item for now)
  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector('[role="menuitem"]');
      first && first.focus();
    }
  }, [open]);

  const handleKeyDownButton = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  const handleReport = () => {
    setOpen(false);
    onReport && onReport();
  };

  return (
    <div className="kebab-wrapper">
      <button
        ref={btnRef}
        className="icon-btn"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDownButton}
      >
        ⋮
      </button>

      {open && (
        <div
          ref={menuRef}
          className="kebab-menu"
          role="menu"
          aria-label="More actions"
        >
          <button
            role="menuitem"
            tabIndex={0}
            className="kebab-item"
            onClick={handleReport}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleReport();
              if (e.key === "Escape") setOpen(false);
            }}
          >
            Report a bug
          </button>
        </div>
      )}
    </div>
  );
}
