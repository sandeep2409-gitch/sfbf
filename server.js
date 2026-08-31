const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_TOKEN = Buffer.from(`admin_session_${ADMIN_PASSWORD}`).toString('base64');
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';

const CSV_DIR = path.join(__dirname, 'data');
const CSV_FILE = path.join(CSV_DIR, 'feedback.csv');

const CSV_HEADERS = [
  'id',
  'timestamp',
  'studentName',
  'priorExperience',
  'rating',
  'favoriteConcept',
  'nextProjectWishlist',
  'comments',
];

function ensureCsvFile() {
  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
  }
  if (!fs.existsSync(CSV_FILE)) {
    const headerLine = CSV_HEADERS.join(',') + '\n';
    fs.writeFileSync(CSV_FILE, headerLine, 'utf8');
  }
}

function escapeCsvField(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Forward entry to Google Sheets via Webhook / Apps Script
async function sendToGoogleSheets(entry) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) return;

  try {
    const payload = JSON.stringify(entry);
    const parsedUrl = url.parse(GOOGLE_SHEET_WEBHOOK_URL);

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const protocol = parsedUrl.protocol === 'https:' ? require('https') : require('http');

    const req = protocol.request(reqOptions, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        console.log(`[Google Sheets Sync] Response status: ${res.statusCode}`);
      });
    });

    req.on('error', (err) => {
      console.error('[Google Sheets Sync Error]:', err.message);
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error('[Google Sheets Sync Exception]:', err);
  }
}

function saveFeedbackToCsv(data) {
  ensureCsvFile();
  const id = `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const entry = {
    id,
    timestamp,
    studentName: data.studentName || 'Anonymous Vibecoder',
    priorExperience: data.priorExperience || 'I know a little',
    rating: data.rating || 5,
    favoriteConcept: data.favoriteConcept || 'The Vibe Coding Loop',
    nextProjectWishlist: data.nextProjectWishlist || 'Freshers Hub Dashboard',
    comments: data.comments || '',
  };

  const line = CSV_HEADERS.map((h) => escapeCsvField(entry[h])).join(',') + '\n';
  fs.appendFileSync(CSV_FILE, line, 'utf8');

  // Asynchronously sync to Google Sheets
  sendToGoogleSheets(entry);

  return entry;
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function readFeedbackFromCsv() {
  ensureCsvFile();
  const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    if (vals.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] !== undefined ? vals[idx] : '';
    });

    records.push({
      id: row.id || `vibe_${i}`,
      timestamp: row.timestamp || new Date().toISOString(),
      studentName: row.studentName || 'Anonymous Vibecoder',
      priorExperience: row.priorExperience || 'I know a little',
      rating: Number(row.rating) || 5,
      favoriteConcept: row.favoriteConcept || 'The Vibe Coding Loop',
      nextProjectWishlist: row.nextProjectWishlist || 'Freshers Hub Dashboard',
      comments: row.comments || '',
    });
  }

  return records;
}

function seedMockData() {
  const mockEntries = [
    {
      studentName: 'Alex Rivera',
      priorExperience: 'I know a little',
      rating: 5,
      favoriteConcept: 'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)',
      nextProjectWishlist: 'Freshers Hub & Timetable App',
      comments: 'Seeing an idea go to a live web app in 90 minutes was mind-blowing!',
    },
    {
      studentName: 'Priya Sharma',
      priorExperience: "I don't know how",
      rating: 5,
      favoriteConcept: 'Don\'t Become a Copy-Paste Developer (Understand the Code)',
      nextProjectWishlist: 'CGPA Calculator & Study Planner',
      comments: 'Made me feel comfortable as a complete beginner. The 1st year roadmap was super helpful!',
    },
    {
      studentName: 'Rahul Patel',
      priorExperience: 'I can build one',
      rating: 4,
      favoriteConcept: 'Vibe Coding vs Programming (Build vs Understand)',
      nextProjectWishlist: 'AI Exam & Quiz Prep Assistant',
      comments: 'Loved the breakdown of Bad Prompt vs Good Prompt!',
    },
    {
      studentName: 'Anonymous Vibecoder',
      priorExperience: "I don't know how",
      rating: 5,
      favoriteConcept: 'Live Demo (Freshers Hub Web App)',
      nextProjectWishlist: 'Developer Portfolio Website',
      comments: 'Excited to take on the 30-Day 30-Builds Challenge!',
    },
    {
      studentName: 'Ananya Verma',
      priorExperience: 'I know a little',
      rating: 5,
      favoriteConcept: 'Developer Toolkit (VS Code, GitHub, Vercel, v0)',
      nextProjectWishlist: 'Student Expense & Budget Tracker',
      comments: 'Best workshop of the semester. Seniors explained everything clearly!',
    },
  ];

  mockEntries.forEach((item) => saveFeedbackToCsv(item));
}

// Vibecoding Slide-Aligned Feedback Form HTML
function getFeedbackFormHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VIBE CODING • Workshop Feedback & Project Wishlist</title>
  <meta name="description" content="Share your feedback for the Vibe Coding workshop — From an Idea to a Live Web App with AI. You don't need to know everything to start building." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>
  <style>
    :root {
      --font-orbitron: 'Orbitron', sans-serif;
      --font-display: 'Space Grotesk', sans-serif;
      --font-sans: 'Inter', sans-serif;
      --bg-dark: #08031a;
      --primary: #06b6d4;
      --primary-glow: #3b82f6;
      --accent-pink: #ec4899;
      --accent-violet: #8b5cf6;
      --card-bg: rgba(15, 7, 36, 0.65);
      --glass-border: rgba(6, 182, 212, 0.28);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
    }

    /* Ambient glow orbs */
    .glow-orb-1 {
      pointer-events: none; position: fixed; left: 10%; top: -100px; z-index: 0;
      width: 480px; height: 480px; border-radius: 50%; opacity: 0.35;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%);
    }
    .glow-orb-2 {
      pointer-events: none; position: fixed; right: 5%; top: 30%; z-index: 0;
      width: 450px; height: 450px; border-radius: 50%; opacity: 0.3;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%);
    }

    .hud-label {
      font-family: var(--font-orbitron);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    header {
      position: relative; z-index: 10;
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.5rem 2.5rem;
    }

    .brand-badge {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.4);
      padding: 0.35rem 0.85rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700; color: #22d3ee;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
    }

    /* Hero Section */
    .hero-section {
      position: relative; z-index: 10;
      max-width: 1200px; margin: 0 auto;
      min-height: 75vh; display: grid; align-items: center;
      gap: 3rem; padding: 2.5rem 1.5rem;
      grid-template-columns: 1.15fr 0.85fr;
    }

    @media (max-width: 992px) {
      .hero-section { grid-template-columns: 1fr; text-align: center; }
    }

    .pill-badge {
      display: inline-block; border-radius: 9999px;
      border: 1px solid rgba(6, 182, 212, 0.4);
      background: rgba(15, 7, 36, 0.6);
      padding: 0.5rem 1.25rem; font-size: 0.65rem; color: #22d3ee;
      backdrop-filter: blur(12px); box-shadow: 0 0 22px rgba(6, 182, 212, 0.3);
      margin-bottom: 1.75rem;
    }

    .hero-subtitle-quote {
      font-family: var(--font-display); font-size: 1.2rem; font-weight: 600;
      color: #c084fc; font-style: italic; margin-bottom: 0.5rem;
    }

    .hero-title {
      font-family: var(--font-orbitron);
      font-size: 4rem; font-weight: 900; text-transform: uppercase;
      line-height: 0.95; margin-top: 0.3rem;
      background: linear-gradient(135deg, #ffffff 0%, #a5f3fc 40%, #c084fc 80%, #f472b6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    @media (max-width: 640px) {
      .hero-title { font-size: 2.75rem; }
    }

    .hero-subhead {
      font-family: var(--font-display); font-size: 1.6rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.15em; color: #22d3ee;
      margin-top: 1rem;
      text-shadow: 0 0 16px rgba(6, 182, 212, 0.6), 0 0 40px rgba(139, 92, 246, 0.4);
    }

    .visual-flow {
      display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      margin-top: 1.5rem; font-family: var(--font-orbitron); font-size: 0.75rem;
      color: #94a3b8; font-weight: 700;
    }
    @media (max-width: 992px) { .visual-flow { justify-content: center; } }

    .flow-tag {
      background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.35);
      padding: 0.25rem 0.65rem; border-radius: 6px; color: #22d3ee;
    }

    .btn-scroll {
      display: inline-block; margin-top: 2.5rem; border-radius: 1rem;
      border: 1px solid rgba(6, 182, 212, 0.45); padding: 1rem 2rem;
      font-size: 0.75rem; color: #fff; text-decoration: none;
      transition: all 0.3s ease; background: rgba(6, 182, 212, 0.1);
    }
    .btn-scroll:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(6, 182, 212, 0.5);
      border-color: rgba(6, 182, 212, 0.8);
      background: rgba(6, 182, 212, 0.2);
    }

    /* Single Featured Showcase Card */
    .featured-card {
      background: var(--card-bg); backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border); border-radius: 1.75rem;
      padding: 2rem; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
      position: relative; overflow: hidden;
    }
    .featured-card::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at top right, rgba(6,182,212,0.15), transparent 70%);
      pointer-events: none;
    }
    .featured-badge {
      display: inline-block; background: rgba(139, 92, 246, 0.2);
      border: 1px solid rgba(168, 85, 247, 0.4); color: #c084fc;
      padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 700;
      margin-bottom: 1rem;
    }
    .featured-title {
      font-family: var(--font-orbitron); font-size: 1.35rem; font-weight: 800;
      color: #fff; text-transform: uppercase; margin-bottom: 0.5rem;
    }
    .featured-desc {
      font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.5rem;
    }

    .loop-list {
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .loop-step {
      display: flex; align-items: center; gap: 0.85rem;
      background: rgba(15, 7, 36, 0.7); border: 1px solid rgba(6, 182, 212, 0.2);
      padding: 0.75rem 1rem; border-radius: 0.85rem; transition: all 0.25s ease;
    }
    .loop-step:hover {
      border-color: rgba(6, 182, 212, 0.5); transform: translateX(4px);
    }
    .step-badge {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4, #7c3aed); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-orbitron); font-size: 0.75rem; font-weight: 800; flex-shrink: 0;
    }
    .step-text-title {
      font-family: var(--font-display); font-size: 0.88rem; font-weight: 700; color: #fff;
    }
    .step-text-sub {
      font-size: 0.75rem; color: #94a3b8;
    }

    /* Feedback Form Section */
    .feedback-section {
      position: relative; z-index: 10; padding: 2rem 1.5rem 6rem 1.5rem;
      max-width: 820px; margin: 0 auto;
    }

    .form-card {
      background: var(--card-bg); backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border); border-radius: 2rem;
      padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
    }

    .form-step { margin-bottom: 2.25rem; }
    .form-step-title {
      display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem;
    }
    .step-num { font-size: 0.75rem; color: #22d3ee; }
    .step-text {
      font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: #fff;
    }
    .step-optional { font-size: 0.65rem; color: #64748b; margin-left: 0.5rem; }

    .field-input, .field-textarea, .field-select {
      width: 100%; border-radius: 1rem;
      border: 1px solid rgba(6, 182, 212, 0.28);
      background: rgba(15, 7, 36, 0.6);
      padding: 0.9rem 1.1rem; color: #fff; font-family: inherit; font-size: 0.95rem;
      outline: none; transition: all 0.3s ease;
    }
    .field-input:focus, .field-textarea:focus, .field-select:focus {
      border-color: rgba(6, 182, 212, 0.8);
      box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.45), 0 0 26px rgba(6, 182, 212, 0.3);
    }
    .field-select option { background: #0f0724; color: #fff; }
    .field-textarea { min-height: 100px; resize: vertical; }

    /* Radio / Selection Option Cards (Slide 2: "Start with a Question") */
    .option-cards-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem;
    }
    .opt-card {
      border: 1px solid rgba(6, 182, 212, 0.25); background: rgba(15, 7, 36, 0.6);
      border-radius: 1rem; padding: 1rem; cursor: pointer; transition: all 0.3s ease;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .opt-card:hover {
      border-color: rgba(6, 182, 212, 0.6); transform: translateY(-2px);
    }
    .opt-card.selected {
      border-color: #22d3ee; background: rgba(6, 182, 212, 0.2);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
    }
    .opt-radio { accent-color: #06b6d4; width: 18px; height: 18px; }

    /* Star Rating Buttons */
    .stars-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .star-btn {
      width: 3.5rem; height: 3.5rem; display: grid; place-items: center;
      border-radius: 1rem; border: 1px solid rgba(6, 182, 212, 0.28);
      background: rgba(15, 7, 36, 0.6); color: var(--text-muted);
      font-size: 1.6rem; cursor: pointer; transition: all 0.3s ease;
    }
    .star-btn:hover {
      transform: scale(1.08); border-color: rgba(6, 182, 212, 0.6);
    }
    .star-btn.active {
      border-color: rgba(6, 182, 212, 0.8); background: rgba(6, 182, 212, 0.2);
      color: #fbbf24; text-shadow: 0 0 12px rgba(251,191,36,0.6);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }

    /* Concept Pills */
    .tech-pills { display: flex; flex-wrap: wrap; gap: 0.65rem; }
    .pill-btn {
      border-radius: 9999px; border: 1px solid rgba(6, 182, 212, 0.28);
      background: rgba(15, 7, 36, 0.6); color: var(--text-muted);
      padding: 0.75rem 1.25rem; font-family: var(--font-display);
      font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    }
    .pill-btn:hover {
      transform: translateY(-2px); border-color: rgba(6, 182, 212, 0.65); color: #fff;
    }
    .pill-btn.active {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(139, 92, 246, 0.4));
      border-color: rgba(6, 182, 212, 0.9); color: #fff;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }

    /* Quick Wishlist Chips (Slide 8, 10 & 22) */
    .topic-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.65rem; }
    .chip-btn {
      background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px; padding: 0.35rem 0.85rem; font-size: 0.8rem; color: #cbd5e1;
      cursor: pointer; transition: all 0.2s ease;
    }
    .chip-btn:hover { background: rgba(6, 182, 212, 0.2); border-color: rgba(6, 182, 212, 0.5); color: #fff; }
    .chip-btn.selected {
      background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #fff; font-weight: 600; border-color: transparent;
    }

    /* Community / Toolkit Banner (Slide 20) */
    .insta-box {
      display: flex; flex-direction: column; gap: 1rem;
      border-radius: 1rem; border: 1px solid rgba(6, 182, 212, 0.25);
      background: rgba(15, 7, 36, 0.5); padding: 1.25rem;
    }
    @media (min-width: 640px) {
      .insta-box { flex-direction: row; align-items: center; justify-content: space-between; }
    }
    .insta-link {
      display: inline-block; border-radius: 0.75rem;
      border: 1px solid rgba(236,72,153,0.4);
      background: linear-gradient(120deg, rgba(236,72,153,0.22), rgba(6,182,212,0.28));
      padding: 0.75rem 1.25rem; color: #fff; text-decoration: none; text-align: center;
      font-size: 0.65rem; transition: all 0.3s ease;
    }
    .insta-link:hover {
      transform: translateY(-2px); box-shadow: 0 0 28px rgba(236,72,153,0.45);
    }

    /* Submit Button */
    .btn-neon {
      width: 100%; border-radius: 1rem; border: 1px solid rgba(6, 182, 212, 0.6);
      background: linear-gradient(135deg, #0891b2 0%, #7c3aed 50%, #ec4899 100%);
      padding: 1.15rem; color: #fff; font-family: var(--font-orbitron);
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em;
      font-weight: 700; cursor: pointer; transition: all 0.3s ease;
      box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
    }
    .btn-neon:hover {
      transform: translateY(-2px); box-shadow: 0 0 40px rgba(6, 182, 212, 0.7);
    }

    /* Success Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(8, 3, 26, 0.88); backdrop-filter: blur(16px);
      display: none; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem;
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: #0f0724; border: 1px solid rgba(6, 182, 212, 0.4);
      border-radius: 2rem; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center;
      box-shadow: 0 0 50px rgba(6, 182, 212, 0.4);
    }

    footer {
      position: relative; z-index: 10; border-t: 1px solid rgba(6, 182, 212, 0.15);
      padding: 2rem; text-align: center; font-size: 0.65rem; color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="glow-orb-1"></div>
  <div class="glow-orb-2"></div>

  <!-- Header -->
  <header>
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <div class="brand-badge hud-label">⚡ VIBE CODING</div>
      <span class="hud-label" style="font-size: 0.6rem; color: var(--text-muted);">From Idea to Live App</span>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero-section">
    <div>
      <span class="pill-badge hud-label">Senior-Junior Seminar & Workshop</span>
      <p class="hero-subtitle-quote">"You don't need to know everything to start building."</p>
      <h1 class="hero-title">VIBE CODING</h1>
      <p class="hero-subhead">From an Idea to a Live Web App with AI</p>

      <div class="visual-flow">
        <span class="flow-tag">IDEA</span> ➔
        <span class="flow-tag">AI</span> ➔
        <span class="flow-tag">CODE</span> ➔
        <span class="flow-tag">APP</span> ➔
        <span class="flow-tag" style="background: rgba(236,72,153,0.2); color: #f472b6;">LIVE</span>
      </div>

      <p class="hero-desc">Your feedback helps us refine future workshops and pick the next student project to build live together!</p>
      <a href="#feedback" class="btn-scroll hud-label">Give feedback ↓</a>
    </div>

    <!-- Single Featured Showcase Card -->
    <div class="featured-card">
      <span class="featured-badge hud-label">CORE WORKSHOP CONCEPT</span>
      <h2 class="featured-title">THE VIBE CODING LOOP</h2>
      <p class="featured-desc">AI-assisted development where you describe intent, generate, run, debug, and iterate.</p>

      <div class="loop-list">
        <div class="loop-step">
          <div class="step-badge">1</div>
          <div>
            <div class="step-text-title">DESCRIBE</div>
            <div class="step-text-sub">Prompt your intent in clear natural language</div>
          </div>
        </div>

        <div class="loop-step">
          <div class="step-badge">2</div>
          <div>
            <div class="step-text-title">GENERATE</div>
            <div class="step-text-sub">AI generates modern UI & working code</div>
          </div>
        </div>

        <div class="loop-step">
          <div class="step-badge">3</div>
          <div>
            <div class="step-text-title">RUN & INSPECT</div>
            <div class="step-text-sub">Preview live web app & test features</div>
          </div>
        </div>

        <div class="loop-step">
          <div class="step-badge">4</div>
          <div>
            <div class="step-text-title">DEBUG & REFINE</div>
            <div class="step-text-sub">Fix errors, add features & deploy live</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Feedback Form -->
  <section id="feedback" class="feedback-section">
    <div class="form-card">
      <form id="vibeFeedbackForm">
        <!-- 01 Name -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">01</span>
            <h3 class="step-text">Name <span class="hud-label step-optional">[optional]</span></h3>
          </div>
          <input type="text" id="studentName" class="field-input" placeholder="Your name (or leave empty for anonymous)" maxLength="80" />
        </div>

        <!-- 02 Slide 2 Question: Prior Coding Background -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">02</span>
            <h3 class="step-text">How would you rate your coding experience before today's seminar?</h3>
          </div>
          <div class="option-cards-grid" id="experienceGrid">
            <label class="opt-card selected">
              <input type="radio" name="priorExp" value="I don't know how to code yet" class="opt-radio" checked />
              <div>
                <strong style="color: #fff; font-size: 0.9rem;">I don't know how to code yet</strong>
                <div style="font-size: 0.75rem; color: #94a3b8;">Complete beginner</div>
              </div>
            </label>
            <label class="opt-card">
              <input type="radio" name="priorExp" value="I know a little" class="opt-radio" />
              <div>
                <strong style="color: #fff; font-size: 0.9rem;">I know a little</strong>
                <div style="font-size: 0.75rem; color: #94a3b8;">Basic syntax & fundamentals</div>
              </div>
            </label>
            <label class="opt-card">
              <input type="radio" name="priorExp" value="I can build applications" class="opt-radio" />
              <div>
                <strong style="color: #fff; font-size: 0.9rem;">I can build applications</strong>
                <div style="font-size: 0.75rem; color: #94a3b8;">Experienced developer</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 03 Overall Rating -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">03</span>
            <h3 class="step-text">How would you rate the Vibe Coding Workshop overall?</h3>
          </div>
          <div class="stars-row" id="starsRow">
            <button type="button" class="star-btn active" data-val="1" title="Need More Vibe">☆</button>
            <button type="button" class="star-btn active" data-val="2" title="Fair">☆</button>
            <button type="button" class="star-btn active" data-val="3" title="Good">☆</button>
            <button type="button" class="star-btn active" data-val="4" title="Awesome">☆</button>
            <button type="button" class="star-btn active" data-val="5" title="Mind-Blowing">☆</button>
          </div>
          <p class="hud-label" id="ratingLabel" style="font-size: 0.65rem; color: #22d3ee; margin-top: 0.5rem;">5 of 5 — Mind-Blowing 🤯</p>
        </div>

        <!-- 04 Favorite Slide Concept -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">04</span>
            <h3 class="step-text">Which key takeaway or slide concept resonated with you most?</h3>
          </div>
          <div class="tech-pills" id="conceptPills">
            <button type="button" class="pill-btn active" data-concept="The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)">The Vibe Coding Loop</button>
            <button type="button" class="pill-btn" data-concept="Prompt Engineering (Bad Prompts vs Clear Requirements)">Prompting Precision</button>
            <button type="button" class="pill-btn" data-concept="Freshers Hub Live Demo (Timetable, CGPA, Planner)">Freshers Hub Live Demo</button>
            <button type="button" class="pill-btn" data-concept="Don't Become a Copy-Paste Developer (Security & Reading Code)">Don't Copy-Paste Blindly</button>
            <button type="button" class="pill-btn" data-concept="Vibe Coding vs Fundamental Programming">Vibe Coding vs Fundamentals</button>
            <button type="button" class="pill-btn" data-concept="1st Year Roadmap & 30-Day Build Challenge">1st Year Roadmap & Challenge</button>
            <button type="button" class="pill-btn" data-concept="Developer Toolkit (VS Code, GitHub, Vercel, v0)">Developer Toolkit</button>
          </div>
        </div>

        <!-- 05 Next Project Wishlist -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">05</span>
            <h3 class="step-text">What student app do you want us to Vibecode in the next workshop? <span style="color: #ec4899;">*</span></h3>
          </div>
          <input type="text" id="nextProjectWishlist" class="field-input" placeholder="Type your requested project (e.g., Freshers Hub, CGPA Calculator, Quiz Bot)..." required />

          <div style="margin-top: 0.5rem;">
            <span style="font-size: 0.8rem; color: #94a3b8;">Popular project ideas (Click to add):</span>
            <div class="topic-chips">
              <button type="button" class="chip-btn" data-chip="Freshers Hub App">+ Freshers Hub App</button>
              <button type="button" class="chip-btn" data-chip="CGPA Calculator & Tracker">+ CGPA Calculator</button>
              <button type="button" class="chip-btn" data-chip="Study Planner & Timetable">+ Study Planner</button>
              <button type="button" class="chip-btn" data-chip="AI Exam & Quiz Prep Bot">+ AI Quiz Prep Bot</button>
              <button type="button" class="chip-btn" data-chip="Student Developer Portfolio">+ Portfolio Website</button>
              <button type="button" class="chip-btn" data-chip="Student Expense Tracker">+ Expense Tracker</button>
            </div>
          </div>
        </div>

        <!-- 06 Comments -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">06</span>
            <h3 class="step-text">Any feedback or questions for the senior speakers? <span class="hud-label step-optional">[optional]</span></h3>
          </div>
          <textarea id="comments" class="field-textarea" placeholder="Tell us what you liked, what broke during live demo, or what we should cover next..." maxLength="1000"></textarea>
        </div>

        <!-- 07 Toolkit Banner -->
        <div class="form-step">
          <div class="form-step-title">
            <span class="hud-label step-num">07</span>
            <h3 class="step-text">Developer Toolkit & Resources</h3>
          </div>
          <div class="insta-box">
            <p style="font-size: 0.875rem; color: var(--text-muted);">Access the workshop starter code, Vercel deployment links, and 30-Day Challenge roadmap.</p>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="insta-link hud-label">View Toolkit & Code ↗</a>
          </div>
        </div>

        <button type="submit" class="btn-neon hud-label" id="submitBtn">Submit Vibe Coding Feedback 🚀</button>
      </form>
    </div>
  </section>

  <!-- Success Modal -->
  <div class="modal-overlay" id="successModal">
    <div class="modal-card">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔥</div>
      <h3 style="font-family: var(--font-orbitron); font-size: 1.4rem; margin-bottom: 0.5rem; text-transform: uppercase;">Feedback Saved!</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
        Thank you! Your feedback has been saved locally to CSV and synced to Google Sheets.
      </p>
      <button type="button" class="btn-neon hud-label" onclick="resetForm()">Submit Another Response</button>
    </div>
  </div>

  <footer>
    <p class="hud-label">⚡ VIBE CODING • From an Idea to a Live Web App with AI</p>
  </footer>

  <script>
    let selectedRating = 5;
    let selectedConcept = 'The Vibe Coding Loop (Describe -> Generate -> Run -> Debug)';

    document.querySelectorAll('.opt-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.opt-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input').checked = true;
      });
    });

    const stars = document.querySelectorAll('#starsRow .star-btn');
    const ratingLabel = document.getElementById('ratingLabel');
    const ratingTexts = ['', '1 of 5 — Need More Vibe 😴', '2 of 5 — Fair ⚡', '3 of 5 — Good 🚀', '4 of 5 — Awesome 🔥', '5 of 5 — Mind-Blowing 🤯'];

    stars.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.val);
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
        ratingLabel.textContent = ratingTexts[selectedRating];
      });
    });

    const pills = document.querySelectorAll('#conceptPills .pill-btn');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedConcept = pill.dataset.concept;
      });
    });

    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('nextProjectWishlist');
        const text = chip.dataset.chip;
        if (input.value.includes(text)) {
          input.value = input.value.split(',').map(t => t.trim()).filter(t => t !== text).join(', ');
          chip.classList.remove('selected');
        } else {
          input.value = input.value.trim() ? input.value.trim() + ', ' + text : text;
          chip.classList.add('selected');
        }
      });
    });

    document.getElementById('vibeFeedbackForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Feedback...';

      const priorExpVal = document.querySelector('input[name="priorExp"]:checked')?.value || 'I know a little';

      const payload = {
        studentName: document.getElementById('studentName').value || 'Anonymous Vibecoder',
        priorExperience: priorExpVal,
        rating: selectedRating,
        favoriteConcept: selectedConcept,
        nextProjectWishlist: document.getElementById('nextProjectWishlist').value,
        comments: document.getElementById('comments').value
      };

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
          document.getElementById('successModal').classList.add('active');
        } else {
          alert(data.error || 'Submission failed');
        }
      } catch (err) {
        alert('Network error while saving feedback.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Vibe Coding Feedback 🚀';
      }
    });

    function resetForm() {
      document.getElementById('successModal').classList.remove('active');
      document.getElementById('vibeFeedbackForm').reset();
      selectedRating = 5;
      stars.forEach(s => s.classList.add('active'));
      ratingLabel.textContent = ratingTexts[5];
      document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('selected'));
    }
  </script>
</body>
</html>`;
}

// Password-Protected Analytics Page HTML with Google Sheets Setup Section
function getAnalyticsHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>⚡ VIBE CODING Analytics & Google Sheets Sync</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-dark: #08031a;
      --card-bg: rgba(15, 7, 36, 0.7);
      --glass-border: rgba(6, 182, 212, 0.28);
      --primary: #06b6d4;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text-main);
      min-height: 100vh; padding: 2rem 1.5rem 5rem 1.5rem;
    }
    .hud-label { font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 0.12em; }
    .main-container { max-width: 1150px; margin: 0 auto; }
    .glass-card {
      background: var(--card-bg); backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border); border-radius: 1.5rem;
      padding: 2rem; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
    }
    .lock-card { max-width: 420px; margin: 4rem auto; text-align: center; }
    .field-input {
      width: 100%; border-radius: 1rem; border: 1px solid var(--glass-border);
      background: rgba(15, 7, 36, 0.6); padding: 0.85rem 1.1rem; color: #fff; font-size: 0.95rem; outline: none;
    }
    .btn-neon {
      width: 100%; border-radius: 1rem; border: 1px solid rgba(6, 182, 212, 0.5);
      background: linear-gradient(135deg, #0891b2, #7c3aed); padding: 0.9rem; color: #fff;
      font-family: 'Orbitron', sans-serif; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; cursor: pointer;
    }
    .btn-sec {
      padding: 0.6rem 1.1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.08);
      border: 1px solid var(--glass-border); color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer;
    }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .metric-card {
      background: rgba(15, 7, 36, 0.7); border: 1px solid var(--glass-border);
      border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
    }
    .metric-val { font-family: 'Orbitron', sans-serif; font-size: 1.75rem; font-weight: 800; }
    .metric-lbl { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }

    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; margin-top: 1rem; }
    .data-table th, .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .data-table th { background: rgba(30, 41, 59, 0.8); color: #cbd5e1; font-family: 'Space Grotesk', sans-serif; }
    .badge-pill { background: rgba(6,182,212,0.2); color: #22d3ee; border: 1px solid rgba(6,182,212,0.4); padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; }

    pre {
      background: rgba(8, 3, 26, 0.9); border: 1px solid rgba(6, 182, 212, 0.3);
      padding: 1rem; border-radius: 0.75rem; color: #a5f3fc; font-size: 0.8rem; overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="main-container">
    <!-- Lock Screen -->
    <div id="lockScreen" class="glass-card lock-card">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
      <h2 class="hud-label" style="font-size: 1.35rem; margin-bottom: 0.5rem;">⚡ VIBE CODING Analytics</h2>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
        Enter password to access CSV feedback log & Google Sheets database integration.
      </p>
      <form id="loginForm">
        <div style="margin-bottom: 1rem; text-align: left;">
          <label style="font-size: 0.85rem; color: #cbd5e1;" class="hud-label">Admin Password</label>
          <input type="password" id="passwordInput" class="field-input" placeholder="Enter password..." required />
          <span style="font-size: 0.75rem; color: #64748b; margin-top: 0.35rem; display: block;">
            💡 Default password: <code style="color: #22d3ee;">admin123</code>
          </span>
        </div>
        <div id="authError" style="color: #fca5a5; font-size: 0.85rem; margin-bottom: 1rem; display: none;"></div>
        <button type="submit" class="btn-neon">Unlock Analytics Dashboard</button>
      </form>
    </div>

    <!-- Dashboard Content -->
    <div id="dashboardContent" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="badge-pill hud-label">📊 Database Sync: CSV + Google Sheets</span>
          <h1 class="hud-label" style="font-size: 1.75rem; margin-top: 0.35rem;">⚡ VIBE CODING Analytics Hub</h1>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button type="button" class="btn-sec" onclick="fetchAnalytics()">🔄 Refresh</button>
          <button type="button" class="btn-neon" onclick="exportCsv()" style="width: auto; padding: 0.6rem 1.25rem; background: linear-gradient(135deg, #10b981, #059669);">
            📥 Export CSV
          </button>
          <button type="button" class="btn-sec" onclick="logout()" style="color: #fca5a5;">Lock Dashboard</button>
        </div>
      </div>

      <!-- Metrics Bar -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div style="font-size: 2rem;">👥</div>
          <div>
            <div className="metric-val" id="totalCount">0</div>
            <div className="metric-lbl">Total Responses Logged</div>
          </div>
        </div>
        <div class="metric-card">
          <div style="font-size: 2rem;">⭐</div>
          <div>
            <div className="metric-val" id="avgOverall">0 / 5</div>
            <div className="metric-lbl">Avg Seminar Rating</div>
          </div>
        </div>
        <div class="metric-card">
          <div style="font-size: 2rem;">💡</div>
          <div>
            <div className="metric-val" id="topConcept" style="font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">N/A</div>
            <div className="metric-lbl">#1 Resonated Slide Concept</div>
          </div>
        </div>
      </div>

      <!-- Google Sheets Live Integration Instructions Card -->
      <div class="glass-card" style="margin-bottom: 2rem; border-color: rgba(16, 185, 129, 0.4);">
        <h3 class="hud-label" style="font-size: 1rem; color: #10b981; margin-bottom: 0.5rem;">
          🟢 How to Sync Any Google Excel Sheet in 30 Seconds
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Your server automatically appends feedback entries to <code style="color: #22d3ee;">data/feedback.csv</code> AND can forward them directly to Google Sheets!
        </p>

        <ol style="font-size: 0.85rem; color: #cbd5e1; margin-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <li>Open your Google Sheet ➔ click <strong>Extensions ➔ Apps Script</strong>.</li>
          <li>Paste the code snippet below and click <strong>Deploy ➔ New deployment ➔ Web App</strong> (Set <em>Who has access</em> to <strong>Anyone</strong>).</li>
          <li>Set environment variable: <code style="color: #22d3ee;">GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"</code></li>
        </ol>

        <pre style="margin-top: 1rem;"><code>function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.id,
    data.timestamp,
    data.studentName,
    data.priorExperience,
    data.rating,
    data.favoriteConcept,
    data.nextProjectWishlist,
    data.comments
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}</code></pre>
      </div>

      <!-- Charts -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="glass-card">
          <h3 class="hud-label" style="font-size: 0.9rem; margin-bottom: 1rem;">Prior Coding Background (Slide 2)</h3>
          <canvas id="expChart" height="200"></canvas>
        </div>
        <div class="glass-card">
          <h3 class="hud-label" style="font-size: 0.9rem; margin-bottom: 1rem;">Seminar Rating Distribution</h3>
          <canvas id="ratingChart" height="200"></canvas>
        </div>
      </div>

      <!-- Data Table -->
      <div class="glass-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 class="hud-label" style="font-size: 0.95rem;">CSV & Google Sheets Records Log</h3>
          <button type="button" class="btn-sec" onclick="seedDemoData()" style="font-size: 0.8rem;">🌱 Seed Demo Data</button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Prior Experience</th>
                <th>Rating</th>
                <th>Favorite Slide Concept</th>
                <th>Next Project Wishlist</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let authToken = sessionStorage.getItem('vibe_slide_token') || '';
    let expChartInstance = null;
    let ratingChartInstance = null;

    if (authToken) {
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('dashboardContent').style.display = 'block';
      fetchAnalytics();
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('passwordInput').value;
      const errDiv = document.getElementById('authError');
      errDiv.style.display = 'none';

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          authToken = data.token;
          sessionStorage.setItem('vibe_slide_token', authToken);
          document.getElementById('lockScreen').style.display = 'none';
          document.getElementById('dashboardContent').style.display = 'block';
          fetchAnalytics();
        } else {
          errDiv.textContent = '⚠️ ' + (data.error || 'Incorrect password');
          errDiv.style.display = 'block';
        }
      } catch (err) {
        errDiv.textContent = '⚠️ Network error';
        errDiv.style.display = 'block';
      }
    });

    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (!res.ok) {
          logout();
          return;
        }
        const json = await res.json();
        renderDashboard(json);
      } catch (err) {
        console.error(err);
      }
    }

    function renderDashboard(json) {
      const data = json.data || [];
      const metrics = json.metrics || {};

      document.getElementById('totalCount').textContent = metrics.totalCount || 0;
      document.getElementById('avgOverall').textContent = (metrics.avgRating || 0) + ' / 5';
      document.getElementById('topConcept').textContent = metrics.topConcept || 'N/A';

      const tb = document.getElementById('tableBody');
      tb.innerHTML = '';
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><strong>\${item.studentName}</strong></td>
          <td><span class="badge-pill" style="background: rgba(139,92,246,0.2); color: #c084fc;">\${item.priorExperience}</span></td>
          <td>⭐ \${item.rating} / 5</td>
          <td style="color: #cbd5e1; font-size: 0.85rem;">\${item.favoriteConcept}</td>
          <td style="color: #22d3ee; font-weight: 600;">\${item.nextProjectWishlist || 'N/A'}</td>
          <td style="color: #94a3b8; font-size: 0.85rem;">\${item.comments || 'N/A'}</td>
        \`;
        tb.appendChild(tr);
      });

      renderCharts(metrics);
    }

    function renderCharts(metrics) {
      const expCtx = document.getElementById('expChart').getContext('2d');
      if (expChartInstance) expChartInstance.destroy();

      const expBreakdown = metrics.expBreakdown || [];
      expChartInstance = new Chart(expCtx, {
        type: 'doughnut',
        data: {
          labels: expBreakdown.map(e => e.exp),
          datasets: [{ data: expBreakdown.map(e => e.count), backgroundColor: ['#ec4899', '#06b6d4', '#8b5cf6'] }]
        }
      });

      const ratingCtx = document.getElementById('ratingChart').getContext('2d');
      if (ratingChartInstance) ratingChartInstance.destroy();

      const ratingDist = metrics.ratingDistribution || [];
      ratingChartInstance = new Chart(ratingCtx, {
        type: 'bar',
        data: {
          labels: ratingDist.map(r => r.star),
          datasets: [{ label: 'Votes', data: ratingDist.map(r => r.count), backgroundColor: '#06b6d4', borderRadius: 6 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
      });
    }

    function exportCsv() {
      window.open('/api/export?token=' + encodeURIComponent(authToken), '_blank');
    }

    async function seedDemoData() {
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + authToken }
      });
      fetchAnalytics();
    }

    function logout() {
      sessionStorage.removeItem('vibe_slide_token');
      authToken = '';
      document.getElementById('lockScreen').style.display = 'block';
      document.getElementById('dashboardContent').style.display = 'none';
    }
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. GET / -> Slide-aligned Feedback Form
  if (pathname === '/' && (method === 'GET' || method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (method === 'HEAD') { res.end(); return; }
    res.end(getFeedbackFormHtml());
    return;
  }

  // 2. GET /analytics -> Password-Protected Analytics Dashboard
  if (pathname === '/analytics' && (method === 'GET' || method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (method === 'HEAD') { res.end(); return; }
    res.end(getAnalyticsHtml());
    return;
  }

  const readJsonBody = (cb) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}');
        cb(null, json);
      } catch (err) {
        cb(err, null);
      }
    });
  };

  // 3. POST /api/feedback -> Save feedback to CSV + Sync to Google Sheets
  if (pathname === '/api/feedback' && method === 'POST') {
    readJsonBody((err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }

      const newEntry = saveFeedbackToCsv(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Saved to CSV & Synced to Google Sheets', data: newEntry }));
    });
    return;
  }

  // 4. POST /api/auth -> Password verification
  if (pathname === '/api/auth' && method === 'POST') {
    readJsonBody((err, body) => {
      if (body && body.password === ADMIN_PASSWORD) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token: VALID_TOKEN }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid password. Please try again.' }));
      }
    });
    return;
  }

  const checkAuthHeader = () => {
    const auth = req.headers['authorization'];
    const token = auth ? auth.replace('Bearer ', '').trim() : '';
    return token === VALID_TOKEN;
  };

  // 5. GET /api/analytics -> Return JSON analytics
  if (pathname === '/api/analytics' && method === 'GET') {
    if (!checkAuthHeader()) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized access' }));
      return;
    }

    const records = readFeedbackFromCsv();
    const totalCount = records.length;
    const avgRating = totalCount > 0 ? Number((records.reduce((a, b) => a + Number(b.rating), 0) / totalCount).toFixed(1)) : 0;

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    records.forEach((r) => {
      const star = Math.min(5, Math.max(1, Number(r.rating)));
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((s) => ({ star: `${s} Stars`, count: ratingCounts[s] }));

    const conceptMap = {};
    records.forEach((r) => {
      const c = r.favoriteConcept || 'The Vibe Coding Loop';
      conceptMap[c] = (conceptMap[c] || 0) + 1;
    });

    const conceptBreakdown = Object.entries(conceptMap).map(([concept, count]) => ({ concept, count })).sort((a, b) => b.count - a.count);
    const topConcept = conceptBreakdown[0] ? conceptBreakdown[0].concept : 'N/A';

    const expMap = {};
    records.forEach((r) => {
      const exp = r.priorExperience || 'I know a little';
      expMap[exp] = (expMap[exp] || 0) + 1;
    });
    const expBreakdown = Object.entries(expMap).map(([exp, count]) => ({ exp, count }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: records,
      metrics: { totalCount, avgRating, topConcept, ratingDistribution, conceptBreakdown, expBreakdown }
    }));
    return;
  }

  // 6. GET /api/export -> Download CSV
  if (pathname === '/api/export' && method === 'GET') {
    const token = parsedUrl.query.token || (req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '');
    if (token !== VALID_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized download' }));
      return;
    }

    ensureCsvFile();
    const fileBuffer = fs.readFileSync(CSV_FILE);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vibe_coding_presentation_feedback_${Date.now()}.csv"`,
    });
    res.end(fileBuffer);
    return;
  }

  // 7. POST /api/seed -> Seed demo data
  if (pathname === '/api/seed' && method === 'POST') {
    if (!checkAuthHeader()) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    seedMockData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Seeded sample feedback data' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

ensureCsvFile();
if (readFeedbackFromCsv().length === 0) {
  seedMockData();
}

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`⚡ VIBE CODING Seminar Feedback Server Running!`);
  console.log(`📍 Feedback Form URL:   http://localhost:${PORT}`);
  console.log(`🔒 Hidden Analytics URL: http://localhost:${PORT}/analytics`);
  console.log(`🔑 Admin Password:      ${ADMIN_PASSWORD}`);
  console.log(`📁 CSV Storage Path:    ${CSV_FILE}`);
  if (GOOGLE_SHEET_WEBHOOK_URL) {
    console.log(`📊 Google Sheets Sync:  ENABLED (${GOOGLE_SHEET_WEBHOOK_URL})`);
  } else {
    console.log(`📊 Google Sheets Sync:  READY (Configure GOOGLE_SHEET_WEBHOOK_URL in env)`);
  }
  console.log(`==================================================\n`);
});
