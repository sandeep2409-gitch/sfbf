import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';
const CSV_DIR = path.join(process.cwd(), 'data');
const CSV_FILE = path.join(CSV_DIR, 'feedback.csv');

// Forward entry to Google Sheets via Webhook
async function forwardToGoogleSheets(entry: Record<string, unknown>) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) return;

  try {
    await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error('Google Sheets forwarding error:', err);
  }
}

// Save to local CSV if filesystem writable
function saveToLocalCsv(entry: Record<string, string | number>) {
  try {
    if (!fs.existsSync(CSV_DIR)) {
      fs.mkdirSync(CSV_DIR, { recursive: true });
    }
    const headers = ['id', 'timestamp', 'studentName', 'priorExperience', 'rating', 'favoriteConcept', 'nextProjectWishlist', 'comments'];
    if (!fs.existsSync(CSV_FILE)) {
      fs.writeFileSync(CSV_FILE, headers.join(',') + '\n', 'utf8');
    }
    const line = headers.map(h => `"${String(entry[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    fs.appendFileSync(CSV_FILE, line, 'utf8');
  } catch (e) {
    // Ignore local filesystem write errors on read-only serverless platforms like Vercel
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newEntry = {
      id: `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      studentName: body.studentName || 'Anonymous Vibecoder',
      priorExperience: body.priorExperience || 'I know a little',
      rating: Number(body.rating) || 5,
      favoriteConcept: body.favoriteConcept || 'The Vibe Coding Loop',
      nextProjectWishlist: body.nextProjectWishlist || 'Freshers Hub Dashboard',
      comments: body.comments || '',
    };

    // Save locally (for local dev) & forward to Google Sheets (for Vercel serverless deployment)
    saveToLocalCsv(newEntry);
    await forwardToGoogleSheets(newEntry);

    return NextResponse.json({
      success: true,
      message: GOOGLE_SHEET_WEBHOOK_URL
        ? 'Saved & Synced to Google Sheets Database!'
        : 'Saved to local CSV. Add GOOGLE_SHEET_WEBHOOK_URL in Vercel to sync with Google Sheets!',
      data: newEntry,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process feedback submission' }, { status: 500 });
  }
}
