import { useEffect, useState } from "react";
import UniversitySelection from "./UniversitySelect"; // CHANGED: add UniversitySelection import

function App() {
    // NEW: dev toggle to show the Select-University page first
    const [showSelect, setShowSelect] = useState(true);

    // NEW: mock save for frontend-only task
    const mockSave = async (_userId, _universityId) => {
        await new Promise(r => setTimeout(r, 400));
        return true; // change to false to simulate failure
    };

    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState("");
    const fetchUsers = () => {
        fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z/db.php")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error("Fetch error:", err));
    };

    useEffect(() => {
        // only run the users demo when NOT on the select page
        if (!showSelect) fetchUsers(); // NEW (guard)
    }, [showSelect]); // CHANGED (dependency)

    const addUser = () => {
        if (!newUser) return;
        fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z/db.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newUser }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setNewUser("");
                fetchUsers();
            })
            .catch((err) => console.error("Add user error:", err));
    };

    // NEW: render your task screen first; after confirm, show the old demo UI
    if (showSelect) {
        return (
          <div style={{ padding: 24 }}>
            <UniversitySelection
              userId={1}
              saveUniversity={mockSave}                 // frontend-only; no backend call
              onConfirm={() => setShowSelect(false)}    // after saving, go to the rest of the app
            />
          </div>
        );
    }
    // (original demo UI below)
    return (
        <div>
            <h1>Users from DB</h1>
            <ul>
                {users.map((u) => (
                    <li key={u.id}>{u.name}</li>
                ))}
            </ul>

            <h2>Add User</h2>
            <input
                type="text"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                placeholder="Enter new user"
            />
            <button onClick={addUser}>Add</button>
        </div>
    );
}

export default App;
