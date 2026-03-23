import { ArrowLeft, LogIn, LogOut } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../public/logo-light.png";
import { supabase } from "../lib/supabase";

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("signup") === "true",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) throw error;

      if (isSignUp) {
        alert("Cadastro realizado com sucesso! Você já pode fazer login.");
        setIsSignUp(false);
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-4">
      <Link
        to="/"
        className="fixed top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 group transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ff632a]/20 group-hover:text-[#ff632a]">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-semibold">Voltar ao início</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff632a]/20 blur-[60px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full"></div>

          <div className="relative">
            <div className="flex items-center justify-center mb-10">
              <img src={logo} alt="Logo" className="h-16" />
            </div>

            <div className="flex items-center justify-center mb-10">
              {isSignUp ? (
                <div className="p-3 bg-[#ff632a]/20 rounded-2xl text-[#ff632a] mr-4">
                  <LogOut className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-[#ff632a]/20 rounded-2xl text-[#ff632a] mr-4">
                  <LogIn className="w-6 h-6" />
                </div>
              )}
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
              </h1>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Seu melhor e-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff632a]/50 focus:border-[#ff632a] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Sua senha secreta
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff632a]/50 focus:border-[#ff632a] transition-all"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff632a] text-white py-4 px-6 rounded-2xl font-bold hover:bg-[#ff632a]/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ff632a]/20 disabled:opacity-50"
              >
                {loading
                  ? "Processando..."
                  : isSignUp
                    ? "Criar Minha Conta"
                    : "Entrar Agora"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#ff632a] font-bold hover:underline"
                >
                  {isSignUp ? "Faça login" : "Cadastre-se grátis"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
