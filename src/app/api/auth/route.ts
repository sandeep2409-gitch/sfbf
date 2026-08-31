import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      // Return a simple session token based on password + secret
      const authHeaderToken = Buffer.from(`admin_session_${ADMIN_PASSWORD}`).toString('base64');
      return NextResponse.json({
        success: true,
        token: authHeaderToken,
        message: 'Authentication successful',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password. Please try again.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }
}
