import { NextResponse } from 'next/server';
import { getAllFeedback } from '@/lib/feedbackService';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_TOKEN = Buffer.from(`admin_session_${ADMIN_PASSWORD}`).toString('base64');

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === VALID_TOKEN;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized access. Password required.' },
      { status: 401 }
    );
  }

  try {
    const feedbackList = getAllFeedback();

    // Compute metrics for dashboard
    const totalCount = feedbackList.length;
    const avgOverall =
      totalCount > 0
        ? Number(
            (
              feedbackList.reduce((acc, cur) => acc + Number(cur.overallRating), 0) /
              totalCount
            ).toFixed(1)
          )
        : 0;

    const avgPresentation =
      totalCount > 0
        ? Number(
            (
              feedbackList.reduce(
                (acc, cur) => acc + Number(cur.presentationRating),
                0
              ) / totalCount
            ).toFixed(1)
          )
        : 0;

    const avgContent =
      totalCount > 0
        ? Number(
            (
              feedbackList.reduce((acc, cur) => acc + Number(cur.contentRating), 0) /
              totalCount
            ).toFixed(1)
          )
        : 0;

    // Rating distribution
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackList.forEach((item) => {
      const r = Math.min(5, Math.max(1, Number(item.overallRating)));
      ratingCounts[r] = (ratingCounts[r] || 0) + 1;
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      star: `${star} Star${star > 1 ? 's' : ''}`,
      count: ratingCounts[star] || 0,
    }));

    // Topic wishlist aggregation
    const topicMap: Record<string, { topic: string; count: number; formatBreakdown: Record<string, number> }> = {};

    feedbackList.forEach((item) => {
      const topicRaw = item.nextTopicRequest ? item.nextTopicRequest.trim() : '';
      if (!topicRaw || topicRaw === 'N/A') return;

      const normalized = topicRaw.toLowerCase();
      if (!topicMap[normalized]) {
        topicMap[normalized] = {
          topic: topicRaw,
          count: 0,
          formatBreakdown: {},
        };
      }
      topicMap[normalized].count += 1;
      const fmt = item.preferredFormat || 'Hands-on Workshop';
      topicMap[normalized].formatBreakdown[fmt] =
        (topicMap[normalized].formatBreakdown[fmt] || 0) + 1;
    });

    const topicWishlist = Object.values(topicMap).sort((a, b) => b.count - a.count);

    // Year breakdown
    const yearCounts: Record<string, number> = {};
    feedbackList.forEach((item) => {
      const yr = item.year || 'Unknown';
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });

    const yearBreakdown = Object.entries(yearCounts).map(([year, count]) => ({
      year,
      count,
    }));

    return NextResponse.json({
      success: true,
      data: feedbackList,
      metrics: {
        totalCount,
        avgOverall,
        avgPresentation,
        avgContent,
        ratingDistribution,
        topicWishlist,
        yearBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    );
  }
}
