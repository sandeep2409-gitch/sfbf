import { NextResponse } from 'next/server';
import fs from 'fs';
import { getCsvFilePath } from '@/lib/feedbackService';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_TOKEN = Buffer.from(`admin_session_${ADMIN_PASSWORD}`).toString('base64');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get('token');

  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

  if (tokenParam !== VALID_TOKEN && headerToken !== VALID_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized download' }, { status: 401 });
  }

  try {
    const filePath = getCsvFilePath();
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="seminar_feedback_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
