import { PieChart, Zap, Globe } from "lucide-react";

export function Features() {
  return (
    <section id="recursos" className="py-32 relative overflow-hidden bg-[#020617]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#ff632a]/5 blur-[200px] rounded-full -z-10 animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24 animate-in slide-in-from-bottom-5 duration-700">
          <h2 className="text-[#ff632a] font-bold uppercase tracking-[0.25em] text-[10px] mb-6">
            O Ecossistema de Inteligência
          </h2>
          <p className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Sua retaguarda financeira <br />
            em <span className="text-slate-500 italic font-medium">tempo real.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px]">
          {/* Main Analytics Card */}
          <div className="md:col-span-8 bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-12 relative overflow-hidden group hover:border-[#ff632a]/30 transition-all duration-700">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-[4s]">
              <PieChart size={200} className="text-white" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end max-w-md">
              <p className="text-[#ff632a] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                Módulo Analítico
              </p>
              <h3 className="text-4xl font-bold mb-6 text-white tracking-tight">
                Análise Preditiva do Fluxo de Caixa.
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Entenda a origem e o destino de cada unidade de capital com visualizações 
                intuitivas que projetam cenários futuros baseados no seu comportamento.
              </p>
            </div>
          </div>

          {/* Speed Card */}
          <div className="md:col-span-4 bg-gradient-to-br from-[#ff632a] to-orange-600 rounded-3xl p-12 flex flex-col justify-between shadow-2xl shadow-orange-500/20 group hover:shadow-orange-500/30 transition-all duration-700">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <Zap size={32} color="white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">
                Operação Ágil.
              </h3>
              <p className="text-white/80 font-medium leading-relaxed text-sm">
                Consolidação de transações em tempo real. Eficiência operacional que 
                elimina a necessidade de planilhas complexas.
              </p>
            </div>
          </div>

          {/* Cloud Sync Card */}
          <div className="md:col-span-12 lg:col-span-5 bg-slate-900/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-12 overflow-hidden relative group hover:border-blue-500/30 transition-all duration-700">
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-all duration-[4s]">
              <Globe size={300} color="white" />
            </div>
            <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
               Conectividade Global
            </p>
            <h3 className="text-3xl font-bold mb-6 text-white text-left tracking-tight">
              Sincronização em Nuvem.
            </h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xs text-left">
              Acesse seu portfólio de qualquer dispositivo com segurança de ponta a ponta 
              e atualização instantânea de dados.
            </p>
          </div>

          {/* Potes/Objectives Card */}
          <div className="md:col-span-12 lg:col-span-7 bg-white rounded-3xl p-12 overflow-hidden relative group hover:shadow-2xl transition-all duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white -z-10"></div>
            <img
              src="/usage.png"
              alt="Concept"
              className="absolute top-0 right-0 w-80 h-full object-cover mix-blend-multiply opacity-10 grayscale group-hover:opacity-40 transition-all duration-[2s]"
            />
            <div className="relative z-10 h-full flex flex-col justify-center max-w-sm">
              <h3 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                Alocação por <span className="text-[#ff632a]">Objetivos</span>
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Sistema exclusivo de segregação de capital que permite monitorar metas 
                patrimoniais específicas com precisão absoluta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
