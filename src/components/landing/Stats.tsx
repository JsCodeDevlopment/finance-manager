import { ShieldCheck, Zap, Lock, Coins } from "lucide-react";

export function Stats() {
  const stats = [
    { label: "Privacidade e Controle", val: "100%", icon: <ShieldCheck size={20} /> },
    { label: "Plano Gratuito", val: "R$ 0,00", icon: <Coins size={20} /> },
    { label: "Criptografia de Dados", val: "AES-256", icon: <Lock size={20} /> },
    { label: "Sincronização", val: "Real-time", icon: <Zap size={20} /> },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-px bg-slate-100"></div>
      
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-16 text-center relative z-10">
        {stats.map((stat, i) => (
          <div key={i} className="group relative">
            <div className="absolute -inset-8 bg-slate-50 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
            <div className="relative flex flex-col items-center transition-transform duration-500 group-hover:-translate-y-2">
              <div className="mb-6 w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#ff632a] group-hover:scale-110 group-hover:bg-[#ff632a]/10 transition-all duration-500 shadow-sm">
                {stat.icon}
              </div>
              <p className="text-5xl font-bold mb-3 tracking-tighter text-slate-900">
                {stat.val}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
