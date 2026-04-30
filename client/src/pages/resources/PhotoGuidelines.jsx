import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Logo from "../../components/Logo";
const tips = [
  {
    icon: "📐",
    title: "Recommended Dimensions",
    content: `Upload images at a minimum of 1200 × 800 px (landscape orientation preferred). For cover/hero photos, aim for 1600 × 900 px or wider. Images below 800px wide will appear blurry on high-resolution screens and may be flagged for quality review. Evencers auto-compresses large files — no need to manually resize above 4MB.`,
    tag: "Technical",
  },
  {
    icon: "🎨",
    title: "Color & Lighting",
    content: `Well-lit photos convert dramatically better. Avoid harsh flash photography — natural light or professionally diffused light creates a warm, inviting look clients respond to. Keep colour grading consistent across your gallery. Overly dark, heavily filtered, or desaturated images underperform. When in doubt, bright and warm wins.`,
    tag: "Quality",
  },
  {
    icon: "🖼️",
    title: "Composition & Framing",
    content: `Follow the rule of thirds — avoid centring every subject. Leave breathing room around your subject. For decor photos, capture both overview shots (to show scale) and macro/detail shots (to show craft). For catering, shoot at eye level or slightly above. For photography portfolios, variety is key: don't upload 10 similar shots.`,
    tag: "Quality",
  },
  {
    icon: "🚫",
    title: "What to Avoid",
    content: `Do not upload: stock photos, heavily watermarked images, blurry or out-of-focus shots, screenshots from social media, images with visible text overlays or promotional graphics, or images that don't represent your actual work. Misrepresentation leads to poor reviews and account suspension. Only upload your own original work.`,
    tag: "Policy",
  },
  {
    icon: "📁",
    title: "File Formats & Limits",
    content: `Accepted formats: JPG, JPEG, PNG, WEBP. Maximum file size: 10MB per image. You can upload up to 15 images per service listing. We recommend uploading at least 8 for best visibility. HEIC files from iPhones should be converted to JPG before uploading. PDF, GIF, and video formats are not currently supported.`,
    tag: "Technical",
  },
  {
    icon: "🏆",
    title: "Cover Photo Strategy",
    content: `Your first uploaded image becomes the listing cover — the one clients see in search results. Make it your absolute best shot. It should be visually striking, clearly represent your service, and have no text overlays. Think of it as the cover of a magazine. You can reorder images any time from your service editor.`,
    tag: "Strategy",
  },
  {
    icon: "✂️",
    title: "Before vs After (Decor & Florals)",
    content: `If you work in decor, florals, or venue styling — before/after pairs are extremely compelling. Show the empty space, then the dressed space. Upload them in sequence. These types of images have the highest engagement on the platform and communicate value in a way words simply cannot. Label context in your description.`,
    tag: "Strategy",
  },
];

const tagColors = {
  Technical: "rgba(100,150,255,0.12)",
  Quality:   "rgba(201,168,76,0.12)",
  Policy:    "rgba(184,92,92,0.12)",
  Strategy:  "rgba(100,180,100,0.12)",
};
const tagText = {
  Technical: "#5577cc",
  Quality:   "#c9a84c",
  Policy:    "#b85c5c",
  Strategy:  "#3a8a3a",
};

export default function PhotoGuidelines() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="pg-root">
        <Navbar />

        <div className="pg-hero">
          <div className="pg-hero-bg">
            <div className="pg-orb pg-orb1" />
            <div className="pg-orb pg-orb2" />
          </div>
          <div className="pg-hero-inner">
            <button className="pg-back" onClick={() => navigate(-1)}>← Back</button>
            <span className="pg-eyebrow"> Vendor Resources</span>
            <div className="pg-icon-wrap">📸</div>
            <h1 className="pg-title">Photo Guidelines</h1>
            <p className="pg-subtitle">
              Tips, specs, and best practices to make your portfolio irresistible to clients.
            </p>
            <div className="pg-meta">
              <span>7 guidelines</span>
              <span className="pg-dot">·</span>
              <span>~8 min read</span>
              <span className="pg-dot">·</span>
              <span>Last updated April 2025</span>
            </div>
          </div>
        </div>

        <div className="pg-body">
          <div className="pg-intro">
            <p>
              Your photos are your strongest sales tool. Listings with professional, high-quality images
              receive up to <strong>4× more bookings</strong> than those with poor or insufficient photography.
              Follow these guidelines to put your best work forward.
            </p>
          </div>

          <div className="pg-grid">
            {tips.map((tip, i) => (
              <div key={i} className="pg-card">
                <div className="pg-card-top">
                  <span className="pg-card-icon">{tip.icon}</span>
                  <span
                    className="pg-tag"
                    style={{ background: tagColors[tip.tag], color: tagText[tip.tag] }}
                  >
                    {tip.tag}
                  </span>
                </div>
                <h3 className="pg-card-title">{tip.title}</h3>
                <p className="pg-card-text">{tip.content}</p>
              </div>
            ))}
          </div>

          <div className="pg-checklist">
            <p className="pg-cl-label"><Logo /> Quick Upload Checklist</p>
            <div className="pg-cl-grid">
              {[
                "Minimum 5 images uploaded",
                "Cover photo is your best shot",
                "No stock or watermarked photos",
                "Images are at least 1200px wide",
                "File format is JPG, PNG, or WEBP",
                "Consistent colour grading throughout",
                "Mix of wide and detail shots",
                "No text overlays or promotional graphics",
              ].map((item, i) => (
                <div key={i} className="pg-cl-item">
                  <span className="pg-cl-check">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0e0c0a; --cream: #f5f0e8; --gold: #c9a84c;
    --gold-light: #e8d5a3; --muted: #7a7265;
    --border: rgba(201,168,76,0.2); --surface: #faf7f2; --white: #ffffff;
  }
  .pg-root { font-family: 'DM Sans', sans-serif; background: var(--cream); min-height: 100vh; color: var(--ink); }

  .pg-hero { position: relative; background: var(--ink); overflow: hidden; padding: 80px 32px 64px; text-align: center; }
  .pg-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .pg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
  .pg-orb1 { width: 400px; height: 400px; background: #7b5ea7; top: -100px; left: -80px; }
  .pg-orb2 { width: 300px; height: 300px; background: var(--gold); bottom: -60px; right: -60px; }
  .pg-hero-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
  .pg-back { background: none; border: 1px solid rgba(201,168,76,0.25); color: var(--gold-light); font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; display: inline-block; }
  .pg-back:hover { background: rgba(201,168,76,0.1); }
  .pg-eyebrow { display: block; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .pg-icon-wrap { font-size: 3rem; margin-bottom: 16px; display: block; }
  .pg-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 300; color: var(--white); margin-bottom: 16px; }
  .pg-subtitle { font-size: 15px; color: rgba(245,240,232,0.6); line-height: 1.7; margin-bottom: 20px; }
  .pg-meta { display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 12px; color: var(--muted); }
  .pg-dot { color: rgba(201,168,76,0.4); }

  .pg-body { max-width: 1060px; margin: 0 auto; padding: 60px 32px; }

  .pg-intro { background: var(--white); border: 1px solid var(--border); border-left: 3px solid var(--gold); border-radius: 10px; padding: 22px 24px; margin-bottom: 40px; font-size: 14.5px; color: var(--muted); line-height: 1.8; }
  .pg-intro strong { color: var(--ink); }

  .pg-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 48px; }
  @media (max-width: 700px) { .pg-grid { grid-template-columns: 1fr; } }

  .pg-card { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 28px 24px; transition: all 0.25s; }
  .pg-card:hover { box-shadow: 0 8px 32px rgba(201,168,76,0.12); transform: translateY(-3px); }
  .pg-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .pg-card-icon { font-size: 1.8rem; }
  .pg-tag { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
  .pg-card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .pg-card-text { font-size: 13.5px; color: var(--muted); line-height: 1.8; }

  .pg-checklist { background: var(--ink); border-radius: 16px; padding: 40px 36px; }
  .pg-cl-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 24px; display: block; }
  .pg-cl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  @media (max-width: 600px) { .pg-cl-grid { grid-template-columns: 1fr; } }
  .pg-cl-item { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: var(--gold-light); }
  .pg-cl-check { color: var(--gold); flex-shrink: 0; margin-top: 1px; }
`;