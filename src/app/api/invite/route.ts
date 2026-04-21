import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem convidar membros' }, { status: 403 });
  }

  const { email, nome } = await req.json() as { email?: string; nome?: string };
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome: nome ?? '' },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
