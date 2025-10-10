import { useState, useEffect } from "react";
import { API_BASE } from "./config";


function UniversitySelection({ userId, onConfirm }) {
    const [university, setUniversity] = useState(""); // 保存选择的大学 ID
    const [universities, setUniversities] = useState([]); // 保存大学列表

    // ✅ 组件加载时获取大学列表
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                // 拉取 universities.php
                //const res = await fetch("http://localhost/Ulink/universities.php");
                const res = await fetch(`${API_BASE}/universities.php`);

                const data = await res.json();
                if (data.items) {
                    setUniversities(data.items);
                }
            } catch (err) {
                console.error("Failed to load universities:", err);
            }
        };
        fetchUniversities();
    }, []);

    // ✅ 点击确认，提交选择
    const handleConfirm = async () => {
        if (!university) {
            alert("Please select a university");
            return;
        }

        // PATCH 请求，保存 university_id
        //const res = await fetch("http://localhost/Ulink/db.php", {
        const res = await fetch(`${API_BASE}/db.php`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, university_id: university }),
        });

        const data = await res.json();
        if (data.success) {
            alert("University saved!");
            if (onConfirm) onConfirm(university);
        } else {
            alert(data.message);
        }
    };

    return (
        <div className="card">
            <h1>Select Your University</h1>
            <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                style={{ padding: "0.5rem", fontSize: "1rem", margin: "1rem 0" }}
            >
                <option value="">Select Your University</option>
                {/* ✅ 动态渲染 */}
                {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name}
                    </option>
                ))}
            </select>
            <br />
            <button onClick={handleConfirm}>Confirm</button>
        </div>
    );
}

export default UniversitySelection;
