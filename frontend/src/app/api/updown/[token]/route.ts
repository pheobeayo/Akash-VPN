import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const apiKey = process.env.UPDOWN_API_KEY; // Not NEXT_PUBLIC_

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://updown.io/api/checks/${token}`, {
      headers: { 'X-API-KEY': apiKey },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Updown.io API error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      uptime: data.uptime,
      down: data.down,
      lastCheckAt: data.last_check_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}