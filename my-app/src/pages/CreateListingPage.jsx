import { useEffect, useRef, useState } from "react";
import "../App.css";
import { API_BASE } from "../config";
import KebabMenu from "../components/KebabMenu";
import BugReportModal from "../components/BugReportModal";
import Logo from "../components/Logo"
import AppHeader from "../components/AppHeader";


export default function CreateListingPage({
                                              user,
                                              username = "User name", // ✅ username prop (default)
                                              university,
                                              onBack,
                                              onCreated,
                                              onHome,
                                              onLogout,
                                              onGoProfile, // ✅ new
                                          }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const dropRef = useRef(null);


    useEffect(() => {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
        };
    }, []);





    /** 文件选择上传 */
    const onPick = (e) => {
        const selectedFiles = Array.from(e.target.files || []).filter((f) =>
            f.type.startsWith("image/")
        );
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    /** 拖拽上传 */
    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;
        const prevent = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const onDrop = (e) => {
            prevent(e);
            const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
                f.type.startsWith("image/")
            );
            setFiles((prev) => [...prev, ...dropped]);
        };
        ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) =>
            el.addEventListener(evt, prevent)
        );
        el.addEventListener("drop", onDrop);
        return () => {
            ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) =>
                el.removeEventListener(evt, prevent)
            );
            el.removeEventListener("drop", onDrop);
        };
    }, []);

    /** 图片预览 URL */
    useEffect(() => {
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [files]);

    /** 提交 */
    const onSubmit = async () => {
        if (!title.trim()) return alert("Please enter title");
        if (!category) return alert("Please select category");
        if (!price) return alert("Please enter price");
        if (!location.trim()) return alert("Please enter location");

        const uniId = parseInt(university, 10);
        if (!uniId) return alert("Please select your university first.");

        setLoading(true);
        try {
            // 上传图片
            let pictureUrls = [];
            if (files.length > 0) {
                const form = new FormData();
                files.forEach((f) => form.append("files[]", f));
                const resp = await fetch(`${API_BASE}/upload.php`, {
                    method: "POST",
                    body: form,
                });
                const raw = await resp.text();
                const upData = JSON.parse(raw);
                if (!upData.success) throw new Error(upData.message || "Upload failed");
                pictureUrls = upData.urls || [];
            }

            // 创建 listing
            const res = await fetch(`${API_BASE}/db.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_listing",
                    user_id: Number(user),
                    university_id: uniId,
                    title: title.trim(),
                    description: desc.trim(),
                    category,
                    price: parseFloat(price),
                    location: location.trim(),
                    contact: contact.trim(),
                    pictures: pictureUrls,
                    comments: [],
                }),
            });

            const data = await res.json();
            if (data?.success) {
                alert("Listing created!");
                onCreated && onCreated();
            } else {
                alert(data.message || "Create failed");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cl-root">
            {/* ✅ Header identical to ListingPage */}
            <AppHeader
                username={username}
                onBack={onBack}
                onHome={onHome}
                onGoProfile={onGoProfile}
                onLogout={onLogout}
                onReport={() => setShowReport(true)}
            />


            {/* === Main Content === */}
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
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    disabled={loading}
                />

                <select
                    className="cl-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading}
                >
                    <option value="">Select category</option>
                    <option value="furniture">Furniture</option>
                    <option value="electronics">Electronics</option>
                    <option value="books">Books</option>
                    <option value="clothing">Clothing</option>
                    <option value="services">Services</option>
                    <option value="others">Others</option>
                </select>

                <input
                    type="number"
                    className="cl-input"
                    placeholder="Enter Price $"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                />
                <input
                    className="cl-input"
                    placeholder="📍 Enter location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                />
                <input
                    className="cl-input"
                    placeholder="📞 Enter contact info (optional)"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    disabled={loading}
                />

                {/* Upload Box */}
                <div className="cl-upload" ref={dropRef}>
                    <div className="cl-upload-col">
                        <div className="cl-upload-ic">⬆️</div>
                        <div className="cl-hint">Drag & drop or click to upload</div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onPick}
                            className="cl-file"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                    <div className="cl-previews">
                        {previews.map((src, i) => (
                            <div key={i} className="cl-thumb">
                                <img src={src} alt="preview" />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="cl-actions">
                <button
                    className="cl-btn primary"
                    onClick={onSubmit}
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </footer>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}