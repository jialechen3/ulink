import { useEffect, useMemo, useRef, useState } from "react";

/** Default options (frontend-only for #52) */
const DEFAULT_UNIS = [
  { id: 1, name: "University at Buffalo" },
  { id: 2, name: "Cornell University" },
  { id: 3, name: "Stony Brook University" },
  { id: 4, name: "NYU" },
];

export default function UniversitySelection({
  userId = 1,
  onConfirm,
  saveUniversity,                  // optional mock/injected later
  options = DEFAULT_UNIS,
  title = "Select Your University"
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [highlight, setHighlight] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // filter options live
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.name.toLowerCase().includes(q));
  }, [query, options]);

  // close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // keep highlight in range when list changes
  useEffect(() => {
    if (filtered.length === 0) setHighlight(-1);
    else if (highlight > filtered.length - 1) setHighlight(filtered.length - 1);
  }, [filtered, highlight]);

  const choose = (opt) => {
    setSelected(opt);
    setQuery(opt.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      e.preventDefault();
      setHighlight(0);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => Math.min((h < 0 ? -1 : h) + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max((h < 0 ? 0 : h) - 1, 0));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && filtered[highlight]) {
        e.preventDefault();
        choose(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleConfirm = async () => {
    setErr("");
    if (!selected) {
      alert("Please select a university");
      return;
    }
    try {
      setSaving(true);
      const ok = saveUniversity ? await saveUniversity(userId, selected.id) : true;
      if (!ok) throw new Error("Save failed");
      alert("University saved!");
      onConfirm?.(selected.name);
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div className="page center">
      <div className="select-card" ref={rootRef}>
        <h1 className="page-title">{title}</h1>

        {/* Combobox */}
        <div
          className={`combo ${open ? "open" : ""}`}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          onMouseEnter={() => setOpen(true)}
        >
          <label htmlFor="uni-input" className="combo-label">Schools</label>
          <div className="combo-input-wrap">
            <input
              id="uni-input"
              ref={inputRef}
              className="combo-input"
              placeholder="Select Your University"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="combo-clear" aria-label="Clear" onClick={clear}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {open && (
            <ul
              ref={listRef}
              className="combo-list"
              role="listbox"
            >
              {filtered.length === 0 && (
                <li className="combo-empty">No matches</li>
              )}
              {filtered.map((opt, idx) => (
                <li
                  key={opt.id}
                  role="option"
                  aria-selected={selected?.id === opt.id}
                  className={`combo-option ${idx === highlight ? "active" : ""}`}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                >
                  {opt.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {err && <div className="error-text" role="alert">{err}</div>}

        <button
          className="confirm-btn"
          disabled={!selected || saving}
          onClick={handleConfirm}
        >
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
