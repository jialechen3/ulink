import { useMemo, useState } from "react";

const DEFAULT_UNIS = [
  { id: 1, name: "University at Buffalo" },
  { id: 2, name: "Cornell University" },
  { id: 3, name: "Stony Brook University" },
  { id: 4, name: "New York University" },
];

export default function UniversitySelection({
  userId,
  onConfirm,
  saveUniversity,              // injected later by integration; mocked for this task
  initialOptions = DEFAULT_UNIS
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q ? initialOptions : initialOptions.filter(u => u.name.toLowerCase().includes(q));
  }, [query, initialOptions]);

  const handleConfirm = async () => {
    setErr("");
    if (!selectedId) { alert("Please select a university"); return; }
    try {
      setSaving(true);
      const ok = saveUniversity ? await saveUniversity(userId, Number(selectedId)) : true; // mock success
      if (!ok) throw new Error("Save failed");
      const uni = options.find(u => u.id === Number(selectedId))?.name || "";
      alert("University saved!");
      onConfirm?.(uni);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" role="region" aria-label="Select University">
      <h1>Select Your University</h1>

      <input
        placeholder="Search universities…"
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        style={{ padding:"0.5rem", fontSize:"1rem", width:"100%", maxWidth:480 }}
      />

      <select
        value={selectedId}
        onChange={(e)=>setSelectedId(e.target.value)}
        style={{ padding:"0.5rem", fontSize:"1rem", margin:"0.5rem 0", width:"100%", maxWidth:480 }}
      >
        <option value="">Select Your University</option>
        {options.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {err && <div className="error-text" style={{color:"#b00020"}}>{err}</div>}

      <button onClick={handleConfirm} disabled={!selectedId || saving}>
        {saving ? "Saving…" : "Confirm"}
      </button>
    </div>
  );
}
