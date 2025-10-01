import { useState } from "react";
import "./App.css";
import UniversitySelection from "./UniversitySelect";

export default function App() {
  const [showSelect, setShowSelect] = useState(true);     // dev toggle
  const [lastSaved, setLastSaved] = useState("");

  // MOCK: succeed after a short delay. Flip to "false" to simulate failure.
  const mockSave = async (_userId, _universityId) => {
    await new Promise(r => setTimeout(r, 400));
    return true; // set to false to test error path
  };

  if (showSelect) {
    return (
      <div className="page" style={{ padding: 24 }}>
        <UniversitySelection
          userId={1}
          saveUniversity={mockSave}             // no backend in this task
          onConfirm={(name)=>{ setLastSaved(name); setShowSelect(false); }}
        />
      </div>
    );
  }

  // simple "next" screen to prove flow worked
  return (
    <div className="card" style={{ padding: 24 }}>
      <h2>Next step → Home/Profile</h2>
      <p>Saved university: <strong>{lastSaved || "(none)"}</strong></p>
      <button onClick={()=>setShowSelect(true)}>Back to Select (dev)</button>
    </div>
  );
}
