import "./App.css";
import KebabMenu from "./KebabMenu.jsx";
import BugReportModal from "./BugReportModal.jsx";
import { useState } from "react";

export default function MessagesPage({ onBack, onHome }) {
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
                <h2>Messages</h2>
                <p>Coming soon…</p>
            </main>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
