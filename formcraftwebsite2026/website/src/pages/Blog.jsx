import "./Blog.css";

export const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Why Most Craft Brands Keep Getting Design Wrong",
      category: "Strategy",
      excerpt:
        "Many teams move fast on product but fall behind on design. This post breaks down why that happens, how it holds you back, and what to do instead if you want to stay clear and competitive.",
      readTime: "5 min read",
      author: "by FormCraft",
      image:
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
      featured: true,
    },
    {
      id: 2,
      title: "The Real Cost of Bad Design (It's Not What You Think)",
      category: "Growth",
      excerpt:
        "Poor design slows down decisions, clutters your message and stalls growth.",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
    },
    {
      id: 3,
      title: "How to Get More Done Without Hiring a Full Design Team",
      category: "Operations",
      excerpt:
        "Lean teams are using design subscriptions to stay fast without hiring.",
      image:
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600",
    },
    {
      id: 4,
      title: "What Working With a Design Subscription Actually Looks Like",
      category: "Workflow",
      excerpt:
        "A behind the scenes look at how makers use design subscriptions to move faster.",
      image:
        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600",
    },
  ];

  const featuredPost = blogPosts.find((p) => p.featured);
  const regularPosts = blogPosts.filter((p) => !p.featured);

  return (
    <div className="blog-page">
      <div className="blog-container">
        {/* Header */}
        <header className="blog-header">
          <span className="blog-label">Blog</span>
          <h1>
            Practical reads to help
            <br />
            you move faster.
          </h1>
        </header>

        {/* Featured Post */}
        {featuredPost && (
          <article className="featured-post">
            <div className="featured-image">
              <img src={featuredPost.image} alt={featuredPost.title} />
            </div>
            <div className="featured-content">
              <span className="post-category">{featuredPost.category}</span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <div className="featured-meta">
                <span>{featuredPost.readTime}</span>
                <span>{featuredPost.author}</span>
              </div>
            </div>
          </article>
        )}

        {/* Regular Posts Grid */}
        <div className="posts-grid">
          {regularPosts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-image">
                <img src={post.image} alt={post.title} />
                <span className="post-category">{post.category}</span>
              </div>
              <div className="post-body">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};