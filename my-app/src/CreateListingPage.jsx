import "./App.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import { useState } from "react";
import AppHeader from "./AppHeader.jsx";

export default function CreateGroupPage({ username,
                                            onBack,
                                            onHome,
                                            onGoProfile,
                                            onLogout, }) {
    const [showReport, setShowReport] = useState(false);

    return (
        <div className="cg-root">
            <AppHeader
                username={username}
                onBack={onBack}
                onHome={onHome}
                onGoProfile={onGoProfile}
                onLogout={onLogout}
                onReport={() => setShowReport(true)}
            />

            <main className="cg-main">
                <h2>Create Listing</h2>
                <p>Coming soon…</p>
            </main>

            <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
        </div>
    );
}
