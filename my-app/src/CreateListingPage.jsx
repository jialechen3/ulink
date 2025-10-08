import { useEffect, useRef, useState } from "react";
import "./App.css";
import { API_BASE } from "./config";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";

export default function CreateListingPage({ user, university, onBack, onCreated, onHome }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const dropRef = useRef(null);

    const onPick = (e) => {
        const f = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...f]);
    };

    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;
        const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
        const onDrop = (e) => {
            prevent(e);
            const f = Array.from(e.dataTransfer.files || []);
            setFiles((prev) => [...prev, ...f]);
        };
        ["dragenter","dragover","dragleave","drop"].forEach(evt => el.addEventListener(evt, prevent));
        el.addEventListener("drop", onDrop);
        return () => {
            ["dragenter","dragover","dragleave","drop"].forEach(evt => el.removeEventListener(evt, prevent));
            el.removeEventListener("drop", onDrop);
        };
    }, []);

    useEffect(() => {
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [files]);

    const onSaveDraft = () => {
        localStorage.setItem("draftListing", JSON.stringify({ title, desc }));
        alert("Draft saved locally.");
    };

    const onSubmit = async () => {
        if (!title.trim()) { alert("Please enter title"); return; }

        const uniId = parseInt(university, 10);
        if (!uniId) { alert("Please select your university first."); return; }

        setLoading(true);
        try {
            let pictureUrls = [];
            if (files.length > 0) {
                const form = new FormData();
                files.forEach(f => form.append("files[]", f));
                const resp = await fetch(`${API_BASE}/upload.php`, { method: "POST", body: form, mode: "cors" });
                const raw = await resp.text();
                if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
                let upData = {};
                try { upData = JSON.parse(raw); } catch (e) { throw new Error("Upload returned non-JSON"); }
                if (!upData.success) throw new Error(upData.message || "Upload API error");
                pictureUrls = upData.urls || [];
            }

            const res = await fetch(`${API_BASE}/db.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_listing",
                    user_id: Number(user),
                    university_id: uniId,
                    title: title.trim(),
                    description: desc.trim(),
                    pictures: pictureUrls,
                    comments: [],
                }),
            });
            const data = await res.json();
            if (data?.success) {
                localStorage.removeItem("draftListing");
                alert("Created!");
                onCreated && onCreated();
            } else {
                alert(data.message || "Create failed");
            }
        } catch (e) {
            console.error(e);
            alert(e.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const d = localStorage.getItem("draftListing");
        if (d) {
            try {
                const obj = JSON.parse(d);
                if (obj.title) setTitle(obj.title);
                if (obj.desc) setDesc(obj.desc);
            } catch {}
        }
    }, []);

    return (
        <div className="cl-root">
            <header className="cl-header">
                <div className="cl-left">
                    <button className="cl-round" onClick={onBack} aria-label="Back">←</button>
                    <button className="cl-round" aria-label="Home" onClick={onHome}>🏠</button>
                </div>
                <div className="cl-brand">Ulink</div>
                <div className="cl-right">
                    <KebabMenu onReport={() => setShowReport(true)} />
                </div>
            </header>

            <main className="cl-main">
                <input
                    className="cl-input"
                    placeholder="Enter Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                />
                <textarea
                    className="cl-textarea"
                    placeholder="Description"
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    disabled={loading}
                />

                <div className="cl-upload" ref={dropRef}>
                    <div className="cl-upload-col">
                        <div className="cl-upload-ic">⤴</div>
                        <div className="cl-hint">Drag & drop or click to upload</div>
                        <input type="file" accept="image/*" multiple onChange={onPick} className="cl-file" disabled={loading} />
                    </div>
                    <div className="cl-upload-col">
                        <div className="cl-upload-ic">🖼️</div>
                        <div className="cl-hint">Preview</div>
                    </div>
                </div>

                {previews.length > 0 && (
                    <div className="cl-previews">
                        {previews.map((src, i) => (
                            <div key={i} className="cl-thumb">
                                <img src={src} alt="" />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="cl-actions">
                <button className="cl-btn" onClick={onSubmit} disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </button>
                <button className="cl-btn ghost" onClick={onSaveDraft} disabled={loading}>
                    Save
                </button>
            </footer>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
