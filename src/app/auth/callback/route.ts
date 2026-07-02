import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Integração futura com Supabase para trocar código por sessão
    // const supabase = createRouteHandlerClient({ cookies });
    // await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/user', request.url));
}
