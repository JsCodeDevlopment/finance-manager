import { ArrowRight, CreditCard, PieChart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative pt-48 pb-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#ff632a]/10 blur-[150px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[#ff632a] text-[10px] font-bold uppercase tracking-[0.2em] mb-12 animate-in slide-in-from-bottom-5 duration-700">
          <Sparkles size={14} /> Inteligência de Capital
        </div>

        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-10 leading-[1.1] animate-in slide-in-from-bottom-10 duration-1000 text-white">
          Domine suas finanças
          <br />
          com{" "}
          <span className="text-[#ff632a] relative inline-block">
            inteligência
            <span className="absolute bottom-2 left-0 w-full h-2 bg-[#ff632a]/20 -z-10"></span>
          </span>{" "}
          absoluta.
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium mb-12 leading-relaxed animate-in fade-in duration-1000 delay-300">
          A plataforma definitiva para quem busca precisão no controle do fluxo
          de capital. Simplicidade operacional com profundidade analítica.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in slide-in-from-bottom-5 duration-1000 delay-500">
          <Link
            to="/auth?signup=true"
            className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-[#ff632a] text-lg font-bold tracking-tight hover:bg-[#ff632a]/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/30"
          >
            Começar Gratuitamente{" "}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-lg font-bold hover:bg-white/10 transition-all text-white">
            Agendar Demonstração
          </button>
        </div>

        <div className="mt-24 relative px-4 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-700 [perspective:2000px]">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(255,100,0,0.1)] bg-slate-900 group [transform:rotateX(2deg)] hover:rotateX(0deg) transition-all duration-1000">
            {/* Browser Header Emulator */}
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2">
              <div className="flex gap-1.5 font-mono">
                <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
              </div>
              <div className="mx-auto bg-white/5 px-4 py-1 rounded-md text-[8px] text-slate-500 font-mono tracking-widest uppercase">
                https://upwell.vercel.app/dashboard
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 pointer-events-none"></div>
            <img
              src="/dashboard.png"
              alt="Application Interface"
              className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.01] transition-all duration-[3s]"
            />

            <div className="absolute bottom-10 left-10 z-20 w-fit px-8 py-5 bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center gap-8 shadow-2xl">
              <div className="text-left text-white">
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] mb-1">
                  Patrimônio Líquido
                </p>
                <p className="text-2xl font-bold tracking-tight">R$ 45.820,00</p>
              </div>
              <div className="w-px h-10 bg-white/10 hidden md:block"></div>
              <div className="text-left hidden md:block text-white">
                <p className="text-[10px] font-bold uppercase text-[#ff632a] tracking-[0.2em] mb-1">
                  Fluxo Mensal
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tight">R$ 12.300,00</p>
                  <span className="text-[10px] text-red-500 font-bold">-12,4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Experience 1 */}
          <div className="absolute -left-16 top-1/4 w-60 h-auto bg-slate-900/80 backdrop-blur-3xl rounded-2xl p-8 border border-white/10 hidden xl:flex flex-col gap-6 animate-float shadow-2xl z-30">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <CreditCard className="text-[#ff632a]" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-white mb-2">
                Gestão de Passivos
              </p>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Otimização algorítmica de ciclos de faturamento e liquidez.
              </p>
            </div>
          </div>

          {/* Floating Experience 2 */}
          <div className="absolute -right-16 bottom-1/4 w-60 h-auto bg-slate-900/80 backdrop-blur-3xl rounded-2xl p-8 border border-white/10 hidden xl:flex flex-col gap-6 animate-float-delayed shadow-2xl z-30">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <PieChart className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-white mb-2">
                Análise de Performance
              </p>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Métricas precisas de alocação e rendimento patrimonial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
