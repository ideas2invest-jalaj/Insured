import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count: totalCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true });

    const { count: pendingCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Pending');

    const { count: paidCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Paid');

    const { count: overdueCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Overdue');

    const { count: gracePeriodCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Grace Period');

    const { count: lapsedCount } = await supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Lapsed');

    return NextResponse.json({
      stats: {
        total: totalCount || 0,
        pendingRenewals: pendingCount || 0,
        paid: paidCount || 0,
        overdue: overdueCount || 0,
        gracePeriod: gracePeriodCount || 0,
        lapsed: lapsedCount || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
