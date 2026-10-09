import "./Portfolio.css";

export const Portfolio = () => {

    const projects = [
        { id: 1, title: "Project 1", emoji: "🎨" },
        { id: 2, title: "Project 2", emoji: "🚀" },
        { id: 3, title: "Project 3", emoji: "💡" },
        { id: 4, title: "Project 4", emoji: "🎯" },
        { id: 5, title: "Project 5", emoji: "✨" },
        { id: 6, title: "Project 6", emoji: "🔥" }
    ];

    return (
        <>
            <div className="portfolio-container">
            <div className="portfolio-header">
                <div className="portfolio-title">My Portfolio</div>
                <div className="portfolio-subtitle">Showcase of my best work and projects</div>
            </div>

            <div className="portfolio-grid">
                {projects.map((project) => (
                    <div 
                        key={project.id} 
                        className="portfolio-card"
                    >
                        <div className="portfolio-image">{project.emoji}</div>
                        <div className="portfolio-card-content">
                            <div className="portfolio-project-title">{project.title}</div>
                            <p style={{ color: "#666", margin: 0 }}>
                                Click to view project details
                            </p>
                        </div>
                    </div>
             ))}
            </div>
            </div>
        </>
    );
};
