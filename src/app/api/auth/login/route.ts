import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_for_development_only'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const { data: user, error: dbError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (dbError) {
      console.error('Supabase DB error on login:', dbError);
    }

    if (!user) {
      console.log('Login failed: User not found or blocked by RLS for email:', email);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login failed: Password mismatch for email:', email);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Criar o token JWT (expira em 7 dias)
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // Definir o cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'conectemail_admin_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
