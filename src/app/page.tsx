'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Send,
  Zap,
  BookOpen,
  Terminal,
  ExternalLink,
  Code2,
  Layers,
} from 'lucide-react';

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

export default function VibeCodingFeedbackPage() {
  const [studentName, setStudentName] = useState('');
  const [priorExperience, setPriorExperience] = useState('I know a little');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [favoriteConcept, setFavoriteConcept] = useState(
    'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)'
  );
  const [nextProjectWishlist, setNextProjectWishlist] = useState('');
  const [comments, setComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChipClick = (project: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nextProjectWishlist.trim()) {
      setErrorMessage('Please tell us what app or project you want to Vibecode next!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName || 'Anonymous Vibecoder',
          priorExperience,
          rating,
          favoriteConcept,
          nextProjectWishlist,
          comments,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
        });
      } else {
        setErrorMessage(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving feedback.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setNextProjectWishlist('');
    setComments('');
  };

  const renderStars = () => {
    const labels = ['', 'Need More Vibe 😴', 'Fair ⚡', 'Good 🚀', 'Awesome 🔥', 'Mind-Blowing 🤯'];
    const current = hoverRating || rating;

    return (
      <div className="star-rating-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= current ? 'active' : ''}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              size={28}
              fill={star <= current ? '#fbbf24' : 'none'}
              stroke={star <= current ? '#fbbf24' : '#475569'}
              strokeWidth={1.75}
            />
          </button>
        ))}
        <span className="rating-label-text">{labels[current]}</span>
      </div>
    );
  };

  return (
    <div className="main-container">
      {/* Header */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="badge-pill" style={{ marginBottom: 0 }}>
            <Zap size={14} />
            <span>VIBE CODING</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>From Idea to Live App</span>
        </div>
      </header>

      {/* Hero */}
      <section className="header-hero">
        <p style={{ fontSize: '1.2rem', color: '#c084fc', fontStyle: 'italic', fontWeight: 600, marginBottom: '0.5rem' }}>
          "You don't need to know everything to start building."
        </p>
        <h1 className="hero-title">VIBE CODING</h1>
        <p className="hero-subtitle" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase' }}>
          From an Idea to a Live Web App with AI
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>IDEA</span> ➔
          <span style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>AI</span> ➔
          <span style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>CODE</span> ➔
          <span style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>APP</span> ➔
          <span style={{ background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.4)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: '#f472b6', fontWeight: 700, fontSize: '0.75rem' }}>LIVE</span>
        </div>
      </section>

      {/* Main Glass Card Form */}
      <main className="glass-card">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Name */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <Code2 size={20} />
              </div>
              <h2 className="section-title">01. Your Name</h2>
            </div>
            <div className="field-group">
              <label className="field-label">
                Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional - leave empty for anonymous)</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Alex Smith"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Slide 2 Question - Prior Coding Experience */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <Terminal size={20} />
              </div>
              <h2 className="section-title">02. Coding Experience Before Today</h2>
            </div>
            <div className="field-group">
              <label className="field-label">How would you rate your coding experience before today's seminar?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
                {[
                  { value: "I don't know how to code yet", title: "I don't know how to code yet", sub: "Complete beginner" },
                  { value: "I know a little", title: "I know a little", sub: "Basic syntax & logic" },
                  { value: "I can build applications", title: "I can build applications", sub: "Experienced developer" },
                ].map((item) => (
                  <div
                    key={item.value}
                    onClick={() => setPriorExperience(item.value)}
                    style={{
                      border: priorExperience === item.value ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                      background: priorExperience === item.value ? 'rgba(6, 182, 212, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Overall Rating */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <Star size={20} />
              </div>
              <h2 className="section-title">03. Workshop Overall Rating</h2>
            </div>
            <div className="field-group">
              <label className="field-label">How would you rate the Vibe Coding Workshop?</label>
              {renderStars()}
            </div>
          </div>

          {/* Section 4: Favorite Slide Concept */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <Layers size={20} />
              </div>
              <h2 className="section-title">04. Key Takeaway or Resonated Slide Concept</h2>
            </div>
            <div className="field-group">
              <label className="field-label">Which slide concept resonated with you most?</label>
              <div className="topic-chips">
                {SLIDE_CONCEPTS.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={`chip-btn ${favoriteConcept === concept ? 'selected' : ''}`}
                    onClick={() => setFavoriteConcept(concept)}
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Next Project Wishlist */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <Sparkles size={20} />
              </div>
              <h2 className="section-title">05. Next Student Project Wishlist</h2>
            </div>
            <div className="field-group">
              <label className="field-label">
                What student app or utility do you want us to Vibecode in the next workshop? <span className="required-dot">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Freshers Hub, CGPA Calculator, Study Planner, Quiz Prep Bot..."
                value={nextProjectWishlist}
                onChange={(e) => setNextProjectWishlist(e.target.value)}
              />
              <div style={{ marginTop: '0.75rem' }}>
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
          </div>

          {/* Section 6: Comments */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <BookOpen size={20} />
              </div>
              <h2 className="section-title">06. Feedback & Speaker Q&A</h2>
            </div>
            <div className="field-group">
              <label className="field-label">Any feedback or questions for the senior speakers?</label>
              <textarea
                className="field-textarea"
                placeholder="Tell us what you liked, what broke during live demo, or what we should cover next..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span>Saving Feedback...</span>
            ) : (
              <>
                <Send size={20} />
                <span>Submit Vibe Coding Feedback 🚀</span>
              </>
            )}
          </button>
        </form>
      </main>

      {/* Success Modal */}
      {submitted && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon-wrap">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="modal-title">Feedback Saved! 🔥</h3>
            <p className="modal-text">
              Thank you! "You don't need to know everything to start building." Your response has been recorded and synced to Google Sheets!
            </p>
            <button type="button" className="btn-submit" onClick={handleResetForm}>
              Submit Another Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
