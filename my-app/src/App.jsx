import { useEffect, useState } from "react";

function App() {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState("");
    const fetchUsers = () => {
        fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z/db.php")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error("Fetch error:", err));
    };

    useEffect(() => {
        fetchUsers(); 
    }, []);

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
