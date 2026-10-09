import "./AboutUs.css";

export const AboutUs = ({ user }) => {
    return (
        <>
            <div className="about-container">
                <div className="about-content">
                    <div className="about-header">
                        <div className="about-title">About FormCraft</div>
                        <div className="about-subtitle">
                            Learn more about our mission and vision
                        </div>
                    </div>

                    <div className="about-section">
                        <div className="about-section-title">Our Story</div>
                        <p className="about-text">
                            FormCraft was founded with a simple mission: to make form creation simple, intuitive, and accessible to everyone. 
                            Whether you're a small business owner, entrepreneur, or enterprise, we believe everyone deserves access to powerful 
                            form-building tools without the complexity.
                        </p>
                        <p className="about-text">
                            Our team is passionate about helping businesses collect data, engage with customers, and make informed decisions. 
                            We're committed to continuous innovation and improvement to serve your needs.
                        </p>
                    </div>

                    <div className="about-section">
                        <div className="about-section-title">Why Choose FormCraft?</div>
                        <div className="about-feature-grid">
                            <div className="about-feature-box">
                                <div className="about-feature-name">Easy to Use</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Intuitive interface that anyone can use without technical knowledge.
                                </p>
                            </div>
                            <div className="about-feature-box">
                                <div className="about-feature-name">Powerful Features</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Advanced functionality for professionals and enterprises.
                                </p>
                            </div>
                            <div className="about-feature-box">
                                <div className="about-feature-name">Secure & Reliable</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Enterprise-grade security to protect your data.
                                </p>
                            </div>
                            <div className="about-feature-box">
                                <div className="about-feature-name">Great Support</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Dedicated support team to help you succeed.
                                </p>
                            </div>
                            <div className="about-feature-box">
                                <div className="about-feature-name">Affordable</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Flexible pricing plans for all business sizes.
                                </p>
                            </div>
                            <div className="about-feature-box">
                                <div className="about-feature-name">Scalable</div>
                                <p className="about-text" style={{ marginBottom: 0 }}>
                                    Grows with your business needs and requirements.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="about-section">
                        <div className="about-section-title">Our Values</div>
                        <p className="about-text">
                            <strong>Innovation:</strong> We constantly seek to improve and evolve our platform to meet the changing needs of our users.
                        </p>
                        <p className="about-text">
                            <strong>User-Centric:</strong> Your success is our success. We design everything with you in mind.
                        </p>
                        <p className="about-text">
                            <strong>Transparency:</strong> We believe in honest communication and clear pricing with no hidden fees.
                        </p>
                        <p className="about-text">
                            <strong>Security:</strong> Your data is precious. We protect it with the highest standards of security.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};