import "../App.css";
import KebabMenu from "../components/KebabMenu.jsx";
import BugReportModal from "../components/BugReportModal.jsx";
import { useState } from "react";
import AppHeader from "../components/AppHeader.jsx";

export default function MessagesPage({ username,
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
                    <h2>Messages</h2>
                    <p>Coming soon…</p>
                </main>

                <BugReportModal isOpen={showReport} onClose={() => setShowReport(false)}/>
            </div>
            );
            }
