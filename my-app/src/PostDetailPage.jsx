import "./App.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import { useState } from "react";

export default function PostDetailPage({ post, onBack, onHome }) {
    const [showReport, setShowReport] = useState(false);

    return (
        <div className="cg-root">
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

            <main className="cg-main">
                <h2>Post detail</h2>
                <p>Coming soon…</p>
                {post ? (
                    <div style={{ opacity: 0.7, fontSize: 14, marginTop: 10 }}>
                        (id: {post.id}{post.title ? `, title: ${post.title}` : ""})
                    </div>
                ) : null}
            </main>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
