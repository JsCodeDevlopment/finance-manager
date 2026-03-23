import { MousePointer2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Planejamento Orçamentário",
      desc: "Estabeleça diretrizes de receita e despesa com base em projeções realistas.",
    },
    {
      step: "02",
      title: "Segregação de Reservas",
      desc: "Provisione capital para obrigações futuras e metas de longo prazo de forma isolada.",
    },
    {
      step: "03",
      title: "Conciliação de Fluxo",
      desc: "Vincule cada saída financeira às suas respectivas reservas ou centro de custos gerais.",
    },
  ];

  return (
    <section
      id="como-funciona"
      className="py-32 bg-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-500/5 blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <h2 className="text-[#ff632a] font-bold uppercase tracking-[0.25em] text-[10px] mb-6">
              Workflow Operacional
            </h2>
            <h3 className="text-5xl font-bold mb-10 leading-tight text-slate-950 text-left tracking-tight">
              A metodologia que <br /> gera{" "}
              <span className="text-[#ff632a]">clareza</span> absoluta.
            </h3>

            <div className="space-y-12">
              {steps.map((item, i) => (
                <div key={i} className="flex gap-8 group">
                  <div className="text-4xl font-bold text-slate-500 group-hover:text-[#ff632a] transition-colors duration-500">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-slate-900 group-hover:translate-x-1 transition-transform">
                      {item.title}
                    </h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-slate-900 border border-white/10 w-full aspect-square rounded-[3rem] group overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff632a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="absolute inset-0 flex items-center justify-center p-20 transform group-hover:scale-105 transition-transform duration-1000">
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-500 shadow-xl backdrop-blur-md">
                    <MousePointer2 size={40} className="text-[#ff632a]" />
                  </div>
                  <p className="text-4xl font-bold mb-4 text-white tracking-tight">
                    Consolidação Patrimonial.
                  </p>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                    Cada interação na plataforma é projetada para reforçar sua
                    governança financeira pessoal com precisão absoluta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
