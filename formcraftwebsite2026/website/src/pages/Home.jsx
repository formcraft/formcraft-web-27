import "./Home.css";

export const Home = ({ user }) => {
    return (
        <>
            <div className="home-container">
                <div className="home-content">
                    <div className="home-header">
                        <div className="home-welcome">Welcome to FormCraft</div>
                        <div className="home-user-info">
                            {user ? `Logged in as: ${user.email}` : "Welcome Visitor"}
                        </div>
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "20px",
                        marginTop: "30px"
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "30px",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.3s ease, box-shadow 0.3s ease"
                        }}>
                            <h2>📝 Create Form</h2>
                            <p>Build and customize your own forms with ease</p>
                            <button style={{padding: "12px 24px", fontSize: "16px", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", transition: "background-color 0.3s ease"}}>Create New</button>
                        </div>

                        <div style={{
                            backgroundColor: "white",
                            padding: "30px",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.3s ease, box-shadow 0.3s ease"
                        }}>
                            <h2>📊 View Forms</h2>
                            <p>Access and manage all your existing forms</p>
                            <button style={{padding: "12px 24px", fontSize: "16px", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", transition: "background-color 0.3s ease"}}>View All</button>
                        </div>

                        <div style={{
                            backgroundColor: "white",
                            padding: "30px",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.3s ease, box-shadow 0.3s ease"
                        }}>
                            <h2>📈 Analytics</h2>
                            <p>Track responses and analyze your form data</p>
                            <button style={{padding: "12px 24px", fontSize: "16px", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", transition: "background-color 0.3s ease"}}>Check Stats</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
