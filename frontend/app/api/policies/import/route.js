import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import xlsx from 'xlsx';

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

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    const requiredFields = ['client_name', 'insurance_company', 'policy_number', 'premium_amount', 'due_date', 'issuance_date'];
    const firstRow = data[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required columns',
        missing: missingFields
      }, { status: 400 });
    }

    const policiesToInsert = data.map(row => ({
      client_name: row.client_name,
      insurance_company: row.insurance_company,
      policy_number: String(row.policy_number),
      premium_amount: parseFloat(row.premium_amount),
      due_date: new Date(row.due_date).toISOString().split('T')[0],
      issuance_date: new Date(row.issuance_date).toISOString().split('T')[0],
      phone: row.phone || null,
      email: row.email || null,
      status: row.status || 'Pending'
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('policies')
      .insert(policiesToInsert)
      .select();

    if (insertError) {
      console.error('Bulk insert error:', insertError);
      return NextResponse.json({
        error: 'Failed to import policies',
        details: insertError.message
      }, { status: 400 });
    }

    return NextResponse.json({
      message: `Successfully imported ${insertedData.length} policies`,
      imported: insertedData.length,
      failed: data.length - insertedData.length
    }, { status: 201 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 });
  }
}
