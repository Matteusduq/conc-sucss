'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Shield, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim() || undefined,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('Este e-mail já está cadastrado. Faça login.');
        } else {
          setErrorMessage('Não foi possível criar a conta. Tente novamente.');
        }
        return;
      }

      // Se a confirmação de e-mail estiver ativa, informa o usuário
      if (data?.session) {
        // Logado imediatamente
        router.push('/hoje');
        router.refresh();
      } else {
        setSuccessMessage(
          'Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro antes de fazer login.'
        );
      }
    } catch (err: unknown) {
      setErrorMessage('Erro inesperado ao conectar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Câmara dos Deputados • Analista Legislativo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Criar Conta de Preparação
          </h1>
          <p className="text-sm text-zinc-400">
            Inicie sua trilha adaptativa com isolamento de dados RLS
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          {successMessage ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-white">Quase pronto!</h2>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {successMessage}
                </p>
              </div>
              <Link href="/auth/login" className="block w-full">
                <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg">
                  Ir para a tela de login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300" htmlFor="displayName">
                  Nome ou apelido de estudo
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Ex: Matheus"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300" htmlFor="password">
                  Senha (mínimo 6 caracteres)
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-all shadow-lg shadow-indigo-600/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Cadastrar e Iniciar Preparação
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Já possui conta?{' '}
              <Link
                href="/auth/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Entrar no Cockpit
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500/70" />
          <span>76 Topics e 182 SyllabusItems prontos para bootstrap automático</span>
        </div>
      </div>
    </div>
  );
}
