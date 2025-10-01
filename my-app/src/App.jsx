import RegisterPage from "./RegisterPage";
import SignInPage from "./SignInPage";

function App() {
    const [step, setStep] = useState("signin");
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState(""); 
    const [loggedIn, setLoggedIn] = useState(false);

    // sigin succseeful
    const handleSignIn = (id, name) => {
        setUserId(id);
        setUsername(name);
        setLoggedIn(true);
    };

    // Successful registration → Jump directly to login
    const handleRegister = (id, name) => {
        setUserId(id);
        setUsername(name);
        setStep("signin"); // Return to login after registration is completed
    };

    const handleLogout = () => {
        setUserId(null);
        setUsername("");
        setLoggedIn(false);
        setStep("signin");
    };

    return (
        <div className="app-container">
            {loggedIn ? (
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <h1>You are logged in, {username}!</h1>
                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: "20px",
                            padding: "10px 20px",
                            backgroundColor: "#4a76d9",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Log Out
                    </button>
                </div>
            ) : (
                <>
                    {step === "signin" && (
                        <SignInPage
                            onSignIn={handleSignIn}
                            onBack={() => setStep("register")}
                        />
                    )}
                    {step === "register" && (
                        <RegisterPage
                            onRegister={handleRegister}
                            onBack={() => setStep("signin")}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;
