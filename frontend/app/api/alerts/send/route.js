import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/sendgrid';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';
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

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policy_id, channel, type, message } = await request.json();

    if (!policy_id || !channel || !type) {
      return NextResponse.json({ error: 'policy_id, channel, and type are required' }, { status: 400 });
    }

    if (!['email', 'sms', 'whatsapp'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }

    if (!['reminder', 'overdue', 'custom'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { data: policy } = await supabase
      .from('policies')
      .select('*')
      .eq('id', policy_id)
      .single();

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const defaultMessage = type === 'reminder'
      ? `Reminder: Your policy ${policy.policy_number} is due on ${policy.due_date}. Please ensure timely payment.`
      : type === 'overdue'
      ? `Alert: Your policy ${policy.policy_number} is overdue. Please make payment immediately.`
      : message || 'Please contact us regarding your policy.';

    let result;

    switch (channel) {
      case 'email':
        if (!policy.email) {
          return NextResponse.json({ error: 'Policy has no email address' }, { status: 400 });
        }
        result = await sendEmail(policy.email, `Policy ${policy.policy_number} - ${type}`, defaultMessage);
        break;
      case 'sms':
        if (!policy.phone) {
          return NextResponse.json({ error: 'Policy has no phone number' }, { status: 400 });
        }
        result = await sendSMS(policy.phone, defaultMessage);
        break;
      case 'whatsapp':
        if (!policy.phone) {
          return NextResponse.json({ error: 'Policy has no phone number' }, { status: 400 });
        }
        result = await sendWhatsApp(policy.phone, defaultMessage);
        break;
    }

    await supabase
      .from('interaction_logs')
      .insert({
        policy_id,
        remark: `Sent ${type} alert via ${channel}: ${defaultMessage}`
      });

    return NextResponse.json({
      message: `Alert sent successfully via ${channel}`,
      result,
      policy
    });
  } catch (error) {
    console.error('Send alert error:', error);
    return NextResponse.json({ error: `Failed to send ${channel} alert` }, { status: 500 });
  }
}
