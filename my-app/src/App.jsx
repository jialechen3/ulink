import { useState } from "react";
import "./App.css";
import UniversitySelection from "./UniversitySelect";

export default function App() {
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState("");

  const mockSave = async () => {
    await new Promise(r => setTimeout(r, 400));
    return true; // set to false to see error state
  };

  if (done) {
    return (
      <div className="page center">
        <div className="select-card">
          <h2>Next step → Home/Profile</h2>
          <p>Saved university: <b>{saved}</b></p>
          <button className="confirm-btn" onClick={()=>setDone(false)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <UniversitySelection
      userId={1}
      saveUniversity={mockSave}
      onConfirm={(name)=>{ setSaved(name); setDone(true); }}
    />
  );
}
