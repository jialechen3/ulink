import { useEffect, useRef, useState } from "react";
import "../styles/CreateListingPage.css";
import { API_BASE } from "../config";
import KebabMenu from "../components/KebabMenu";
import BugReportModal from "../components/BugReportModal";
import Logo from "../components/Logo";
import AppHeader from "../components/AppHeader";

export default function CreateListingPage({
                                              user,
                                              username = "User name",
                                              university,
                                              onBack,
                                              onCreated,
                                              onHome,
                                              onLogout,
                                              onGoProfile,
                                          }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [idx, setIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const dropRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
        };
    }, []);

    // 选择文件
    const onPick = (e) => {
        const selected = Array.from(e.target.files || []).filter((f) =>
            f.type.startsWith("image/")
        );
        if (!selected.length) return;
        setFiles((prev) => [...prev, ...selected]);
    };

    // 拖拽
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
            if (!dropped.length) return;
            setFiles((prev) => [...prev, ...dropped]);
            el.classList.remove("dz-hover");
        };
        const onDragEnter = (e) => {
            prevent(e);
            el.classList.add("dz-hover");
        };
        const onDragOver = prevent;
        const onDragLeave = (e) => {
            prevent(e);
            el.classList.remove("dz-hover");
        };

        el.addEventListener("drop", onDrop);
        el.addEventListener("dragenter", onDragEnter);
        el.addEventListener("dragover", onDragOver);
        el.addEventListener("dragleave", onDragLeave);

        return () => {
            el.removeEventListener("drop", onDrop);
            el.removeEventListener("dragenter", onDragEnter);
            el.removeEventListener("dragover", onDragOver);
            el.removeEventListener("dragleave", onDragLeave);
        };
    }, []);

    // 预览 URL
    useEffect(() => {
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        setIdx((i) => Math.min(i, Math.max(0, urls.length - 1)));
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [files]);

    const onPrev = () => {
        if (!previews.length) return;
        setIdx((i) => (i - 1 + previews.length) % previews.length);
    };
    const onNext = () => {
        if (!previews.length) return;
        setIdx((i) => (i + 1) % previews.length);
    };
    const removeCurrent = () => {
        if (!previews.length) return;
        const i = idx;
        setFiles((prev) => prev.filter((_, k) => k !== i));
    };
    const pickByButton = () => fileInputRef.current?.click();

    // 提交 保持你的接口与逻辑不变
    const onSubmit = async () => {
        if (!title.trim()) return alert("Please enter title");
        if (!category) return alert("Please select category");
        if (!price) return alert("Please enter price");
        if (!location.trim()) return alert("Please enter location");

        const uniId = parseInt(university, 10);
        if (!uniId) return alert("Please select your university first.");

        setLoading(true);
        try {
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
                // 重置
                setTitle("");
                setDesc("");
                setCategory("");
                setPrice("");
                setLocation("");
                setContact("");
                setFiles([]);
                setPreviews([]);
                setIdx(0);
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
        <div className="clp-page">
            <AppHeader
                username={username}
                onBack={onBack}
                onHome={onHome}
                onGoProfile={onGoProfile}
                onLogout={onLogout}
                onReport={() => setShowReport(true)}
            />

            <h1 className="page-title">Create Listing</h1>

            {/* 行一 标题与价格 */}
            
            <div className="clp-grid-2">
                <div className="clp-field">
                    <div className="row">
                        <label>Title</label>
                        <span className="count">{title.length}/120</span>
                    </div>
                    <input
                        className="cl-input"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                        disabled={loading}
                    />
                </div>

                <div className="clp-field">
                    <label>Price</label>
                    <div className="clp-price">
                        <span className="clp-dollar">$</span>
                        <input
                            type="number"
                            className="cl-input"
                            placeholder="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            onBlur={() => {
                                if (!price) return;
                                const num = Number(price);
                                if (!Number.isNaN(num)) setPrice(num.toFixed(2));
                            }}
                            min="0"
                            step="0.01"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* 行二 分类与地点 */}
            <div className="clp-grid-2">
                <div className="clp-field">
                    <label>Category</label>
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
                </div>

                <div className="clp-field">
                    <label>Location</label>
                    <input
                        className="cl-input"
                        placeholder="Address"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* 媒体区 左大图 右侧缩略图与加图 */}
            <div className="clp-media-row">
                <div className="clp-gallery" ref={dropRef}>
                    {previews.length ? (
                        <>
                            <button className="nav-btn left" type="button" onClick={onPrev} aria-label="Previous">‹</button>
                            <img src={previews[idx]} alt={`preview ${idx + 1}`} />
                            <button className="nav-btn right" type="button" onClick={onNext} aria-label="Next">›</button>
                            <button className="remove-btn" type="button" onClick={removeCurrent} title="Remove current">×</button>
                        </>
                    ) : (
                        <div className="clp-empty">
                            <div className="empty-main">img 1</div>
                            <div className="empty-sub">Drag and drop images here</div>
                        </div>
                    )}
                </div>

                <div className="clp-side-uploader">
                    <button className="add-btn" type="button" onClick={pickByButton} disabled={loading}>+ image</button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onPick}
                        className="cl-file"
                        style={{ display: "none" }}
                        disabled={loading}
                    />
                    <ul className="thumb-list">
                        {previews.map((src, i) => (
                            <li key={i} className={i === idx ? "on" : ""} onClick={() => setIdx(i)}>
                                <img src={src} alt={`thumb ${i + 1}`} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 描述与联系方式 */}
            <div className="clp-field">
                <div className="row">
                    <label>Description</label>
                    <span className="count">{desc.length}/1000</span>
                </div>
                <textarea
                    rows={5}
                    className="cl-textarea"
                    placeholder="Description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value.slice(0, 1000))}
                    disabled={loading}
                />
            </div>

            <div className="clp-bottom-row">
                <div className="clp-field contact">
                    <label>Contact info</label>
                    <input
                        className="cl-input"
                        placeholder="Email phone or preferred method"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="clp-actions">
                    <button className="ghost" type="button" onClick={onBack} disabled={loading}>Cancel</button>
                    <button className="primary" type="button" onClick={onSubmit} disabled={loading}>
                        {loading ? "Submitting..." : "Publish"}
                    </button>
                </div>
            </div>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
