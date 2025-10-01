import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_UNIS = [
  { id: 1, name: "University at Buffalo" },
  { id: 2, name: "Cornell University" },
  { id: 3, name: "Stony Brook University" },
  { id: 4, name: "NYU" },
];

export default function UniversitySelection({
  userId = 1,
  options = DEFAULT_UNIS,
  onConfirm,
  saveUniversity, // optional async (userId, universityId) => boolean
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [highlight, setHighlight] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.name.toLowerCase().includes(q)) : options;
  }, [query, options]);

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    if (open && filtered.length > 0 && highlight === -1) setHighlight(0);
    if (!open) setHighlight(-1);
  }, [open, filtered.length, highlight]);

  const choose = (opt) => {
    setSelected(opt);
    setQuery(opt.name);
    setOpen(false);
  };

  const clear = () => {
    setSelected(null);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      setHighlight(0);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => Math.min((h < 0 ? 0 : h) + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max((h <= 0 ? 0 : h - 1), 0));
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

  return (
    <div className="page center">
      <div className="select-card" ref={rootRef}>
        <h1 className="page-title">Select Your University</h1>

        <div className="combo" role="combobox" aria-expanded={open}>
          <label htmlFor="uni" className="combo-label">Schools</label>
          <div className="combo-input-wrap">
            <input
              id="uni"
              ref={inputRef}
              className="combo-input"
              placeholder="Search or select a university"
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
            <ul className="combo-list" role="listbox">
              {filtered.length === 0 && <li className="combo-empty">No matches</li>}
              {filtered.map((opt, i) => (
                <li
                  key={opt.id}
                  className={`combo-option ${i === highlight ? "active" : ""}`}
                  role="option"
                  aria-selected={selected?.id === opt.id}
                  onMouseEnter={() => setHighlight(i)}
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

        <button className="confirm-btn" disabled={!selected || saving} onClick={handleConfirm}>
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
