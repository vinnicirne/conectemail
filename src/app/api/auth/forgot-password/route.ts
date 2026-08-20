import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const { data: user, error: dbError } = await supabase
      .from('User')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (dbError) {
      console.error('Supabase error querying user:', dbError);
    }

    if (!user) {
      console.log('User not found or blocked by RLS for email:', email);
      // Retornar sucesso de qualquer forma por segurança (para não revelar se o email existe)
      return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá um link.' });
    }

    console.log('User found:', user.email);

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Salvar token no banco
    const { error: tokenError } = await supabase.from('PasswordResetToken').insert({
      id: crypto.randomUUID(),
      email: user.email,
      token,
      expires: expires.toISOString(),
      createdAt: new Date().toISOString()
    });

    if (tokenError) {
      console.error('Error inserting token:', tokenError);
      throw new Error('Could not insert token');
    }

    // Enviar email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log('Sending email to:', user.email);
    const { data, error: resendError } = await resend.emails.send({
      from: 'Angell Brindes <no-reply@conectemail.shop>',
      to: [user.email],
      subject: 'Redefinição de Senha - Painel Administrativo',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #111;">Recuperação de Senha</h2>
          <p>Você solicitou a redefinição de senha para o painel de campanhas.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
          </div>
          <p style="color: #666; font-size: 13px;">Se não foi você, por favor ignore este e-mail.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend API Error:', resendError);
      return NextResponse.json({ error: 'Erro ao enviar o e-mail via Resend' }, { status: 500 });
    }

    console.log('Email sent successfully via Resend:', data);
    return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá um link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
