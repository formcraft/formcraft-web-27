import "./Construction.css";

export const Construction = ({ user }) => {
    return (
        <>
            <div className="construction-container">
                <div className="construction-content">
                    <div className="construction-icon">🏗️</div>
                    <div className="construction-title">Page Under Construction</div>
                    <p className="construction-message">
                        We're working hard to bring you this page. Check back soon!
                    </p>
                </div>
            </div>
        </>
    );
};
