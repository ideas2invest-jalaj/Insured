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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const company = searchParams.get('company') || '';
    const status = searchParams.get('status') || '';
    const due_date_from = searchParams.get('due_date_from') || '';
    const due_date_to = searchParams.get('due_date_to') || '';
    const sort_by = searchParams.get('sort_by') || 'due_date';
    const sort_order = searchParams.get('sort_order') || 'asc';

    let queryBuilder = supabaseAdmin
      .from('policies')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('client_name', `%${search}%`);
    }

    if (company) {
      queryBuilder = queryBuilder.eq('insurance_company', company);
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (due_date_from) {
      queryBuilder = queryBuilder.gte('due_date', due_date_from);
    }

    if (due_date_to) {
      queryBuilder = queryBuilder.lte('due_date', due_date_to);
    }

    const sortColumn = ['due_date', 'client_name', 'premium_amount', 'created_at'].includes(sort_by)
      ? sort_by
      : 'due_date';
    const ascending = sort_order === 'asc';

    queryBuilder = queryBuilder.order(sortColumn, { ascending });

    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      policies: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get policies error:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      client_name,
      insurance_company,
      policy_number,
      premium_amount,
      due_date,
      issuance_date,
      phone,
      email,
      status = 'Pending'
    } = body;

    if (!client_name || !insurance_company || !policy_number || !premium_amount || !due_date || !issuance_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('policies')
      .insert({
        client_name,
        insurance_company,
        policy_number,
        premium_amount: parseFloat(premium_amount),
        due_date,
        issuance_date,
        phone: phone || null,
        email: email || null,
        status
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Policy number already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Policy created successfully', policy: data }, { status: 201 });
  } catch (error) {
    console.error('Create policy error:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
