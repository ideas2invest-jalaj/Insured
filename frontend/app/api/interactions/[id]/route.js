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

export async function PUT(request, { params }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { remark } = await request.json();

    if (!remark || !remark.trim()) {
      return NextResponse.json({ error: 'Remark is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('interaction_logs')
      .update({ remark: remark.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Interaction log updated', log: data });
  } catch (error) {
    console.error('Update interaction log error:', error);
    return NextResponse.json({ error: 'Failed to update interaction log' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { error } = await supabase
      .from('interaction_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Interaction log deleted successfully' });
  } catch (error) {
    console.error('Delete interaction log error:', error);
    return NextResponse.json({ error: 'Failed to delete interaction log' }, { status: 500 });
  }
}
