import { Mail, MessageSquare, Send } from 'lucide-react';

export function Contact() {
  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>Contact Us</h1>
        <p>Have questions or feedback? We'd love to hear from you.</p>
      </div>
      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-card">
            <Mail className="icon" />
            <h3>Email Us</h3>
            <p>support@animevault.com</p>
          </div>
          <div className="contact-card">
            <MessageSquare className="icon" />
            <h3>Community</h3>
            <p>Join our Discord server</p>
          </div>
        </div>
        <form className="contact-form" onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Your email" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea placeholder="How can we help?" rows={5}></textarea>
          </div>
          <button className="btn-play-v2">
            <Send size={18} /> Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

export function FAQ() {
  const faqs = [
    { q: "Is AnimeVault free?", a: "Yes, our platform is completely free to use." },
    { q: "Do I need an account to watch?", a: "No, you can start watching immediately without any registration." },
    { q: "How often is the content updated?", a: "We update our library daily with the latest episodes and manga chapters." },
    { q: "Can I download episodes?", a: "Streaming is our primary focus, but some mirrors provide download options." }
  ];

  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about the platform.</p>
      </div>
      <div className="faq-list">
        {faqs.map((f, i) => (
          <div key={i} className="faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>Terms of Service</h1>
        <p>Last updated: May 2026</p>
      </div>
      <div className="legal-content">
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing AnimeVault, you agree to comply with these terms.</p>
        <h3>2. Use of Service</h3>
        <p>AnimeVault is for personal, non-commercial use only.</p>
        <h3>3. Third-Party Content</h3>
        <p>We do not host files. We only link to content provided by third-party services.</p>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>Privacy Policy</h1>
        <p>Your privacy is important to us.</p>
      </div>
      <div className="legal-content">
        <h3>Data Collection</h3>
        <p>We do not collect personal identification information from our users.</p>
        <h3>Cookies</h3>
        <p>We use local storage only to save your watch history and favorites locally on your device.</p>
      </div>
    </div>
  );
}

export function DMCA() {
  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>DMCA Policy</h1>
        <p>Content removal requests.</p>
      </div>
      <div className="legal-content">
        <p>AnimeVault respects the intellectual property rights of others. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please contact us at dmca@animevault.com.</p>
        <p>Please note that we do not host any content on our servers. We merely link to publicly available content.</p>
      </div>
    </div>
  );
}

export function RequestAnime() {
  return (
    <div className="static-page-v2">
      <div className="static-header">
        <h1>Request Anime</h1>
        <p>Missing your favorite series? Let us know.</p>
      </div>
      <form className="contact-form" onSubmit={e => e.preventDefault()}>
        <div className="form-group">
          <label>Anime Title</label>
          <input type="text" placeholder="e.g. One Piece" />
        </div>
        <div className="form-group">
          <label>Additional Details</label>
          <textarea placeholder="Specific season or version?" rows={3}></textarea>
        </div>
        <button className="btn-play-v2">Submit Request</button>
      </form>
    </div>
  );
}
