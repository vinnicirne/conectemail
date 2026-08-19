import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Retornar sucesso de qualquer forma por segurança (para não revelar se o email existe)
      return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá um link.' });
    }

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Salvar token no banco
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      }
    });

    // Enviar email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    await resend.emails.send({
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

    return NextResponse.json({ success: true, message: 'Se o e-mail existir, você receberá um link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
