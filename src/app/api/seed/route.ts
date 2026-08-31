import { NextResponse } from 'next/server';
import { seedMockFeedback } from '@/lib/feedbackService';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_TOKEN = Buffer.from(`admin_session_${ADMIN_PASSWORD}`).toString('base64');

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

  if (token !== VALID_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const seeded = seedMockFeedback();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${seeded.length} demo feedback entries.`,
      count: seeded.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
