import "./App.css";
import KebabMenu from "./KebabMenu";
import BugReportModal from "./BugReportModal";
import { useState } from "react";
import AppHeader from "./AppHeader.jsx"; // ✅ 改这里

export default function PostDetailPage({
                                           username,
                                           post,            // ✅ 新增
                                           onBack,
                                           onHome,
                                           onGoProfile,
                                           onLogout,
                                       }) {
    const [showReport, setShowReport] = useState(false);

    return (
        <div className="cg-root">
            {/* ✅ 通用 Header */}
            <AppHeader
                username={username}
                onBack={onBack}
                onHome={onHome}
                onGoProfile={onGoProfile}
                onLogout={onLogout}
                onReport={() => setShowReport(true)}
                showSearch={false}
            />

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
