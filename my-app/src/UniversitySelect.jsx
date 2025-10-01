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
  saveUniversity,                 // injected later by integration; mocked for this task
  initialOptions = DEFAULT_UNIS,  // lets us unit-test without backend
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
    if (!selectedId) {
      alert("Please select a university");
      return;
    }
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
    <div className="card" role="region" aria-label="Select University" style={{ maxWidth: 520 }}>
      <h1>Select Your University</h1>

      <input
        placeholder="Search universities…"
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        style={{ padding:"0.5rem", fontSize:"1rem", width:"100%", marginTop: 8 }}
      />

      <label htmlFor="uni" style={{ display:"block", marginTop: 10 }}>University</label>
      <select
        id="uni"
        value={selectedId}
        onChange={(e)=>setSelectedId(e.target.value)}
        style={{ padding:"0.5rem", fontSize:"1rem", width:"100%", margin:"6px 0 10px" }}
      >
        <option value="">Select Your University</option>
        {options.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {err && <div className="error-text" role="alert" style={{ color:"#b00020", marginBottom:8 }}>{err}</div>}

      <button onClick={handleConfirm} disabled={!selectedId || saving} style={{ minWidth:140 }}>
        {saving ? "Saving…" : "Confirm"}
      </button>
    </div>
  );
}
