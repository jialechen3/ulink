import "./App.css";
import KebabMenu from "./KebabMenu";
import Logo from "./Logo.jsx";

export default function AppHeaderListing({
                                             username = "User name",
                                             onBack = () => {},
                                             onHome = () => {},
                                             onGoProfile = () => console.warn("onGoProfile not provided"),
                                             onLogout = () => console.warn("onLogout not provided"),
                                             onReport = () => {},
                                             showSearch = true,
                                             searchValue = "",
                                             onSearchChange = () => {},
                                             searchPlaceholder = "Search",
                                         }) {
    return (
        <header className="mp-header mp-header--safe">
            <div className="mp-left" data-zone="left">
                <button
                    className="mp-icon mp-round"
                    onClick={onBack}
                    aria-label="Back"
                    title="Back"
                >
                    ←
                </button>

                <button
                    className="mp-icon mp-round"
                    aria-label="Home"
                    onClick={onHome}
                    title="Home"
                >
                    🏠
                </button>

                {/* ✅ 整块可点去 Profile */}
                <div
                    className="mp-user"
                    role="button"
                    tabIndex={0}
                    onClick={onGoProfile}
                    onKeyDown={(e) => e.key === "Enter" && onGoProfile()}
                    title="Go to profile"
                >
                    <div className="mp-avatar">🐧</div>
                    <span className="mp-username">{username}</span>
                </div>
            </div>


            <div className="mp-center">
                <Logo size={36}/>
            </div>

            <div className="mp-right" data-zone="right">
                <KebabMenu onReport={onReport}/>
                <button
                    className="mp-logout"
                    onClick={onLogout}
                    aria-label="Logout"
                    title="Logout"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
