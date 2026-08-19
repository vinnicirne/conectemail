import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }

    // Verificar se o token existe e não expirou
    const { data: resetRecord } = await supabase
      .from('PasswordResetToken')
      .select('*')
      .eq('token', token)
      .single();

    if (!resetRecord) {
      return NextResponse.json({ error: 'Link de recuperação inválido ou já utilizado' }, { status: 400 });
    }

    if (new Date(resetRecord.expires) < new Date()) {
      // Deletar o token expirado
      await supabase.from('PasswordResetToken').delete().eq('id', resetRecord.id);
      return NextResponse.json({ error: 'Este link de recuperação expirou. Solicite um novo.' }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar a senha do usuário
    await supabase.from('User').update({ password: hashedPassword, updatedAt: new Date().toISOString() }).eq('email', resetRecord.email);

    // Deletar o token usado
    await supabase.from('PasswordResetToken').delete().eq('id', resetRecord.id);

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir a senha' }, { status: 500 });
  }
}
