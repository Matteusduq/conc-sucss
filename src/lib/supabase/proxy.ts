import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANTE: Chamar supabase.auth.getClaims() para verificar e renovar token JWT sem round-trip desnecessário
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims && !error && claims.sub);

  const pathname = request.nextUrl.pathname;

  // Lista de rotas protegidas do dashboard
  const protectedPrefixes = [
    '/hoje',
    '/jornada',
    '/plano',
    '/biblioteca',
    '/memoria',
    '/performance',
    '/discursiva',
    '/erros',
    '/analytics',
    '/configuracoes',
    '/estudar',
  ];

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = pathname.startsWith('/auth');

  // Redirecionamento da raiz /
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? '/hoje' : '/auth/login';
    return NextResponse.redirect(url);
  }

  // Se rota protegida e usuário não autenticado -> redireciona para login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Se estiver em rota de login/signup e já estiver autenticado -> redireciona para /hoje
  if (isAuthRoute && isAuthenticated && pathname !== '/auth/confirm') {
    const url = request.nextUrl.clone();
    url.pathname = '/hoje';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
