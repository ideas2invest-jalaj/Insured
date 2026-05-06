import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function hashPassword(password) {
  return createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: userData.id, email: userData.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: { id: userData.id, email: userData.email, name: userData.name }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
