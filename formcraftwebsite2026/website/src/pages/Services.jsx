import "./Services.css";

export const Services = ({ user }) => {

    const services = [
        {
            id: 1,
            name: "Form Design",
            icon: "✏️",
            description: "Create beautiful and functional forms tailored to your specific needs."
        },
        {
            id: 2,
            name: "Data Collection",
            icon: "📊",
            description: "Easily collect and organize responses from your users and customers."
        },
        {
            id: 3,
            name: "Analytics",
            icon: "📈",
            description: "Gain insights from your form data with powerful analytics tools."
        },
        {
            id: 4,
            name: "Integration",
            icon: "🔗",
            description: "Seamlessly integrate with your existing tools and workflows."
        },
        {
            id: 5,
            name: "Support",
            icon: "🎯",
            description: "Get dedicated support from our expert team whenever you need it."
        },
        {
            id: 6,
            name: "Security",
            icon: "🔒",
            description: "Your data is protected with enterprise-grade security measures."
        }
    ];

    return (
        <>
            <div className="services-container">
                <div className="services-content">
                    <div className="services-header">
                        <div className="services-title">Our Services</div>
                        <div className="services-subtitle">
                            Comprehensive solutions for your form management needs
                        </div>
                    </div>

                    <div className="services-grid">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="service-card"
                            >
                                <div className="service-icon">{service.icon}</div>
                                <div className="service-name">{service.name}</div>
                                <div className="service-desc">{service.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
