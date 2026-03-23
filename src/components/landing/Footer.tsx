import { Github, Globe, Linkedin, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-20 border-t border-white/5 px-4 bg-[#020617] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#ff632a]/5 blur-[120px] rounded-full -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
          <div className="max-w-sm">
            <div className="flex items-center group mb-6">
              <img
                src="/logo-light.png"
                alt="Logo"
                className="h-8 opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
              <span className="ml-3 text-2xl font-bold tracking-tight text-white">
                Finanças<span className="text-[#ff632a] font-black">+</span>
              </span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Sistemas de alta performance para gestão e governança de capital
              individual e corporativo. Desenvolvido com foco em precisão e
              segurança.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div className="space-y-4">
              <h5 className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-300">
                Conectividade
              </h5>
              <div className="flex gap-6">
                <a
                  href="https://github.com/JsCodeDevlopment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-all duration-300 flex items-center gap-2 group"
                >
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-[#ff632a]/50 group-hover:bg-[#ff632a]/10 transition-all">
                    <Github size={18} />
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/in/jscodedevelopment/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-all duration-300 flex items-center gap-2 group"
                >
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-[#ff632a]/50 group-hover:bg-[#ff632a]/10 transition-all">
                    <Linkedin size={18} />
                  </div>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-300">
                Privacidade
              </h5>
              <Link
                to="/auth"
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition-all duration-300"
              >
                <Shield size={14} className="text-[#ff632a]" />
                Acesso Restrito
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Globe size={12} className="text-[#ff632a]" />
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">
              © {new Date().getFullYear()} UpWell Finanças+. ALL RIGHTS
              RESERVED.
            </p>
          </div>

          <div className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em]">
            Precision Engineering • High Performance
          </div>
        </div>
      </div>
    </footer>
  );
}
