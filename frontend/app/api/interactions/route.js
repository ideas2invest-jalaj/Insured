import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policy');

    let queryBuilder = supabase
      .from('interaction_logs')
      .select('*');

    if (policyId) {
      queryBuilder = queryBuilder.eq('policy_id', policyId);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ logs: data });
  } catch (error) {
    console.error('Get interaction logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch interaction logs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policy_id, remark } = await request.json();

    if (!policy_id || !remark) {
      return NextResponse.json({ error: 'policy_id and remark are required' }, { status: 400 });
    }

    const { data: policy } = await supabase
      .from('policies')
      .select('id')
      .eq('id', policy_id)
      .single();

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('interaction_logs')
      .insert({ policy_id, remark })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Interaction log created', log: data }, { status: 201 });
  } catch (error) {
    console.error('Create interaction log error:', error);
    return NextResponse.json({ error: 'Failed to create interaction log' }, { status: 500 });
  }
}
