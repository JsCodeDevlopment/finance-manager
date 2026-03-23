import { ChevronDown } from "lucide-react";

export function FAQ() {
  const faqs = [
    {
      q: "Qual o nível de segurança das informações?",
      a: "Utilizamos protocolos de criptografia AES-256 e SSL de nível bancário. Seus dados financeiros são processados em ambientes isolados e acessíveis exclusivamente por você.",
    },
    {
      q: "A plataforma possui custo de manutenção?",
      a: "Oferecemos uma camada gratuita robusta com todas as funcionalidades de gestão e reservas. Planos corporativos e análises avançadas estão disponíveis sob demanda.",
    },
    {
      q: "Existe compatibilidade com dispositivos móveis?",
      a: "Sim. A interface foi projetada com foco em responsividade total, garantindo uma experiência analítica completa em smartphones, tablets e desktops.",
    },
    {
      q: "Como é feita a migração de dados?",
      a: "Disponibilizamos ferramentas de importação e replicação de fluxos operacionais para agilizar a configuração de novos períodos fiscais ou orçamentários.",
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-[#020617]">
       <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-[#ff632a] font-bold uppercase tracking-[0.25em] text-[10px] mb-4">
            Suporte e Transparência
          </h2>
          <h3 className="text-4xl font-bold tracking-tight text-white">
            Perguntas Frequentes
          </h3>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/[0.07] transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center gap-4">
                <h4 className="text-lg font-bold text-white tracking-tight">{faq.q}</h4>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ff632a]/20 transition-all">
                   <ChevronDown
                     size={16}
                     className="text-slate-500 group-hover:text-[#ff632a] transition-all transform group-hover:rotate-180 duration-500"
                   />
                </div>
              </div>
              <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-700 ease-in-out">
                <p className="text-slate-400 font-medium text-sm leading-relaxed mt-4 pt-4 border-t border-white/5">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
