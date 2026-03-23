import { Link } from "react-router-dom";
import { Sparkles, Check } from "lucide-react";

export function CTA() {
  return (
    <section className="py-40 relative px-4 overflow-hidden bg-[#ff632a]">
       <div className="absolute inset-0 bg-black opacity-5"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-tight text-white">
          Sua jornada para a <br />
          <span className="text-black">liberdade</span> começa aqui.
        </h2>
        <p className="text-xl text-black/70 font-bold mb-12 max-w-2xl mx-auto leading-relaxed">
          Assuma hoje o controle total do seu fluxo de patrimônio com a plataforma 
          líder em inteligência financeira para gestão individual.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/auth?signup=true"
            className="group w-full sm:w-auto px-12 py-6 bg-black text-white text-lg font-bold rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl"
          >
            Começar Agora <Sparkles size={20} />
          </Link>
          <button className="w-full sm:w-auto px-12 py-6 border-2 border-black/20 text-black text-lg font-bold rounded-2xl hover:bg-black/5 transition-all">
            Ver Demonstração
          </button>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-10">
          {["AES-256", "Cloud Sync", "Zero Tracker", "No-SQL"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-black/50"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border border-black/10">
                 <Check size={12} className="text-black" strokeWidth={4} />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
