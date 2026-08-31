import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap,
  Star,
  CheckCircle2,
  Send,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Users,
  Lightbulb,
  FileSpreadsheet,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SLIDE_CONCEPTS = [
  'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)',
  'Prompt Engineering (Bad Prompts vs Clear Requirements)',
  'Freshers Hub Live Demo (Timetable, CGPA, Planner)',
  'Don\'t Become a Copy-Paste Developer (Security & Code Reading)',
  'Vibe Coding vs Fundamental Programming',
  '1st Year Roadmap & 30-Day Build Challenge',
  'Developer Toolkit (VS Code, GitHub, Vercel, v0)',
];

const PROJECT_SUGGESTIONS = [
  'Freshers Hub App',
  'CGPA Calculator & Tracker',
  'Study Planner & Timetable',
  'AI Exam & Quiz Prep Bot',
  'Student Developer Portfolio',
  'Student Expense Tracker',
];

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname === '/analytics') {
    return <AnalyticsDashboard />;
  }

  return <FeedbackForm />;
}

// ----------------------------------------------------
// 1. STUDENT FEEDBACK FORM COMPONENT
// ----------------------------------------------------
function FeedbackForm() {
  const [studentName, setStudentName] = useState('');
  const [priorExperience, setPriorExperience] = useState("I don't know how to code yet");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [favoriteConcept, setFavoriteConcept] = useState(
    'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)'
  );
  const [nextProjectWishlist, setNextProjectWishlist] = useState('');
  const [comments, setComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChipClick = (project) => {
    if (nextProjectWishlist.includes(project)) {
      setNextProjectWishlist((prev) =>
        prev
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== project)
          .join(', ')
      );
    } else {
      setNextProjectWishlist((prev) =>
        prev.trim() ? `${prev.trim()}, ${project}` : project
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nextProjectWishlist.trim()) {
      setErrorMessage('Please tell us what app or project you want to Vibecode next!');
      return;
    }

    setLoading(true);

    const newEntry = {
      id: `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      studentName: studentName || 'Anonymous Vibecoder',
      priorExperience,
      rating,
      favoriteConcept,
      nextProjectWishlist,
      comments,
    };

    try {
      // 1. Save to localStorage database
      const existing = JSON.parse(localStorage.getItem('vibe_feedback_db') || '[]');
      existing.unshift(newEntry);
      localStorage.setItem('vibe_feedback_db', JSON.stringify(existing));

      // 2. Forward to serverless API or Google Sheets Webhook
      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || '';
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
      }

      setSubmitted(true);
      confetti({
        particleCount: 140,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
      });
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setNextProjectWishlist('');
    setComments('');
  };

  const ratingTexts = ['', 'Need More Vibe 😴', 'Fair ⚡', 'Good 🚀', 'Awesome 🔥', 'Mind-Blowing 🤯'];
  const currentRatingDisplay = hoverRating || rating;

  return (
    <div>
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-badge hud-label">⚡ VIBE CODING</div>
          <span className="hud-label" style={{ fontSize: '0.6rem', color: '#94a3b8' }}>From Idea to Live App</span>
        </div>
      </header>

      <section className="hero-section">
        <div>
          <span className="pill-badge hud-label">Senior-Junior Seminar & Workshop</span>
          <p className="hero-subtitle-quote">"You don't need to know everything to start building."</p>
          <h1 className="hero-title">VIBE CODING</h1>
          <p className="hero-subhead">From an Idea to a Live Web App with AI</p>

          <div className="visual-flow">
            <span className="flow-tag">IDEA</span> ➔
            <span className="flow-tag">AI</span> ➔
            <span className="flow-tag">CODE</span> ➔
            <span className="flow-tag">APP</span> ➔
            <span className="flow-tag" style={{ background: 'rgba(236,72,153,0.2)', color: '#f472b6' }}>LIVE</span>
          </div>

          <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px' }}>
            Your feedback helps us refine future workshops and pick the next student project to build live together!
          </p>
          <a href="#feedback" className="btn-scroll hud-label">Give feedback ↓</a>
        </div>

        {/* Featured Card */}
        <div className="featured-card">
          <span className="featured-badge hud-label">CORE WORKSHOP CONCEPT</span>
          <h2 className="featured-title">THE VIBE CODING LOOP</h2>
          <p className="featured-desc">AI-assisted development where you describe intent, generate, run, debug, and iterate.</p>

          <div className="loop-list">
            {[
              { num: 1, title: 'DESCRIBE', sub: 'Prompt your intent in clear natural language' },
              { num: 2, title: 'GENERATE', sub: 'AI generates modern UI & working code' },
              { num: 3, title: 'RUN & INSPECT', sub: 'Preview live web app & test features' },
              { num: 4, title: 'DEBUG & REFINE', sub: 'Fix errors, add features & deploy live' },
            ].map((step) => (
              <div key={step.num} className="loop-step">
                <div className="step-badge">{step.num}</div>
                <div>
                  <div className="step-text-title">{step.title}</div>
                  <div className="step-text-sub">{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="feedback" className="feedback-section">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {/* 01 Name */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">01</span>
                <h3 className="step-text">Name <span className="hud-label step-optional">[optional]</span></h3>
              </div>
              <input
                type="text"
                className="field-input"
                placeholder="Your name (or leave empty for anonymous)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            {/* 02 Coding Experience */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">02</span>
                <h3 className="step-text">How would you rate your coding experience before today's seminar?</h3>
              </div>
              <div className="option-cards-grid">
                {[
                  { value: "I don't know how to code yet", label: "I don't know how to code yet", sub: "Complete beginner" },
                  { value: "I know a little", label: "I know a little", sub: "Basic syntax & fundamentals" },
                  { value: "I can build applications", label: "I can build applications", sub: "Experienced developer" },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`opt-card ${priorExperience === opt.value ? 'selected' : ''}`}
                    onClick={() => setPriorExperience(opt.value)}
                  >
                    <input
                      type="radio"
                      name="priorExp"
                      checked={priorExperience === opt.value}
                      onChange={() => setPriorExperience(opt.value)}
                      style={{ accentColor: '#06b6d4', width: '18px', height: '18px' }}
                    />
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{opt.label}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 03 Rating */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">03</span>
                <h3 className="step-text">How would you rate the Vibe Coding Workshop overall?</h3>
              </div>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= currentRatingDisplay ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                ))}
                <span className="hud-label" style={{ fontSize: '0.75rem', color: '#22d3ee', marginLeft: '0.5rem' }}>
                  {ratingTexts[currentRatingDisplay]}
                </span>
              </div>
            </div>

            {/* 04 Concept */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">04</span>
                <h3 className="step-text">Which key takeaway or slide concept resonated with you most?</h3>
              </div>
              <div className="tech-pills">
                {SLIDE_CONCEPTS.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`pill-btn ${favoriteConcept === concept ? 'active' : ''}`}
                    onClick={() => setFavoriteConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>

            {/* 05 Wishlist */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">05</span>
                <h3 className="step-text">What student app do you want us to Vibecode in the next workshop? <span style={{ color: '#ec4899' }}>*</span></h3>
              </div>
              <input
                type="text"
                className="field-input"
                placeholder="Type your requested project (e.g., Freshers Hub, CGPA Calculator, Quiz Bot)..."
                value={nextProjectWishlist}
                onChange={(e) => setNextProjectWishlist(e.target.value)}
                required
              />

              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Popular project ideas (Click to add):</span>
                <div className="topic-chips">
                  {PROJECT_SUGGESTIONS.map((proj) => {
                    const isSel = nextProjectWishlist.includes(proj);
                    return (
                      <button
                        key={proj}
                        type="button"
                        className={`chip-btn ${isSel ? 'selected' : ''}`}
                        onClick={() => handleChipClick(proj)}
                      >
                        {isSel ? '✓ ' : '+ '} {proj}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 06 Comments */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">06</span>
                <h3 className="step-text">Any feedback or questions for the senior speakers? <span className="hud-label step-optional">[optional]</span></h3>
              </div>
              <textarea
                className="field-textarea"
                placeholder="Tell us what you liked, what broke during live demo, or what we should cover next..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* 07 Community */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="hud-label step-num">07</span>
                <h3 className="step-text">Developer Toolkit & Resources</h3>
              </div>
              <div className="insta-box">
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Access workshop starter code, Vercel deployment links, and 30-Day Challenge roadmap.</p>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="insta-link hud-label">
                  View Toolkit & Code ↗
                </a>
              </div>
            </div>

            {errorMessage && (
              <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <button type="submit" className="btn-neon hud-label" disabled={loading}>
              {loading ? 'Saving Feedback...' : 'Submit Vibe Coding Feedback 🚀'}
            </button>
          </form>
        </div>
      </section>

      {/* Modal */}
      {submitted && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔥</div>
            <h3 className="hud-label" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Feedback Saved!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Thank you! "You don't need to know everything to start building." Your response has been saved!
            </p>
            <button type="button" className="btn-neon hud-label" onClick={handleReset}>
              Submit Another Response
            </button>
          </div>
        </div>
      )}

      <footer>
        <p className="hud-label">⚡ VIBE CODING • From an Idea to a Live Web App with AI</p>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// 2. PASSWORD-PROTECTED ANALYTICS DASHBOARD
// ----------------------------------------------------
function AnalyticsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [dbEntries, setDbEntries] = useState([]);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem('admin_react_session');
    if (isUnlocked === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const loadData = () => {
    const raw = localStorage.getItem('vibe_feedback_db');
    let data = [];
    if (raw) {
      try { data = JSON.parse(raw); } catch (e) { data = []; }
    }
    if (data.length === 0) {
      // Seed default sample entries if empty
      data = [
        {
          id: 'vibe_101',
          studentName: 'Alex Rivera',
          priorExperience: 'I know a little',
          rating: 5,
          favoriteConcept: 'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)',
          nextProjectWishlist: 'Freshers Hub & Timetable App',
          comments: 'Seeing an idea go to a live web app in 90 minutes was mind-blowing!',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'vibe_102',
          studentName: 'Priya Sharma',
          priorExperience: "I don't know how to code yet",
          rating: 5,
          favoriteConcept: 'Don\'t Become a Copy-Paste Developer (Security & Code Reading)',
          nextProjectWishlist: 'CGPA Calculator & Study Planner',
          comments: 'Made me feel comfortable as a complete beginner!',
          timestamp: new Date().toISOString(),
        },
      ];
      localStorage.setItem('vibe_feedback_db', JSON.stringify(data));
    }
    setDbEntries(data);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_react_session', 'true');
      loadData();
    } else {
      setAuthError('Incorrect password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_react_session');
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleExportCsv = () => {
    if (dbEntries.length === 0) return;
    const headers = ['id', 'timestamp', 'studentName', 'priorExperience', 'rating', 'favoriteConcept', 'nextProjectWishlist', 'comments'];
    const rows = dbEntries.map(e => headers.map(h => `"${String(e[h] || '').replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vibe_coding_feedback_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '420px', margin: '5rem auto', padding: '1.5rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
          <h2 className="hud-label" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>⚡ VIBE CODING Analytics</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Enter password to view feedback submissions and export CSV data.
          </p>
          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label className="hud-label" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Admin Password</label>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.75rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                💡 Default password: <code style={{ color: '#22d3ee' }}>admin123</code>
              </span>
            </div>

            {authError && (
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {authError}
              </div>
            )}

            <button type="submit" className="btn-neon">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const totalCount = dbEntries.length;
  const avgRating = totalCount > 0 ? (dbEntries.reduce((a, b) => a + Number(b.rating), 0) / totalCount).toFixed(1) : '0';

  // Compute prior experience breakdown
  const expCounts = {};
  dbEntries.forEach(e => {
    const exp = e.priorExperience || 'I know a little';
    expCounts[exp] = (expCounts[exp] || 0) + 1;
  });
  const expData = Object.entries(expCounts).map(([name, value]) => ({ name, value }));

  // Rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dbEntries.forEach(e => {
    const r = Math.min(5, Math.max(1, Number(e.rating)));
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
  });
  const ratingData = [1, 2, 3, 4, 5].map(star => ({ star: `${star} Stars`, count: ratingCounts[star] }));

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '2rem 1.5rem 5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="brand-badge hud-label">📊 Database Sync: LocalStorage + Google Sheets</span>
          <h1 className="hud-label" style={{ fontSize: '1.75rem', marginTop: '0.35rem' }}>⚡ VIBE CODING Analytics Hub</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn-scroll" onClick={loadData} style={{ marginTop: 0 }}>🔄 Refresh</button>
          <button type="button" className="btn-neon" onClick={handleExportCsv} style={{ width: 'auto', padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            📥 Export CSV
          </button>
          <button type="button" className="btn-scroll" onClick={handleLogout} style={{ marginTop: 0, color: '#fca5a5' }}>Lock</button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ fontSize: '2rem' }}>👥</div>
          <div>
            <div className="hud-label" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Responses</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ fontSize: '2rem' }}>⭐</div>
          <div>
            <div className="hud-label" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{avgRating} / 5</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Avg Seminar Rating</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <h3 className="hud-label" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Prior Coding Background (Slide 2)</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {expData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f0724', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="hud-label" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Seminar Rating Distribution</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <XAxis dataKey="star" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f0724', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <h3 className="hud-label" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Records Log ({totalCount})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '0.85rem', color: '#cbd5e1' }}>Student</th>
                <th style={{ padding: '0.85rem', color: '#cbd5e1' }}>Prior Experience</th>
                <th style={{ padding: '0.85rem', color: '#cbd5e1' }}>Rating</th>
                <th style={{ padding: '0.85rem', color: '#cbd5e1' }}>Favorite Slide Concept</th>
                <th style={{ padding: '0.85rem', color: '#cbd5e1' }}>Next Project Wishlist</th>
              </tr>
            </thead>
            <tbody>
              {dbEntries.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem' }}><strong>{item.studentName}</strong></td>
                  <td style={{ padding: '0.85rem' }}><span className="brand-badge" style={{ fontSize: '0.7rem' }}>{item.priorExperience}</span></td>
                  <td style={{ padding: '0.85rem' }}>⭐ {item.rating} / 5</td>
                  <td style={{ padding: '0.85rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{item.favoriteConcept}</td>
                  <td style={{ padding: '0.85rem', color: '#22d3ee', fontWeight: 600 }}>{item.nextProjectWishlist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
