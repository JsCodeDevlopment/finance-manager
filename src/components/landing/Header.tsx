import { Link } from "react-router-dom";

export function Header() {
  return (
    <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <div className="flex items-center group cursor-pointer">
          <img
            src="/logo-light.png"
            alt="Logo"
            className="h-10 group-hover:scale-105 transition-transform duration-500"
          />
          <span className="ml-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Finanças<span className="text-[#ff632a] font-black">+</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center space-x-12">
          {["Recursos", "Como Funciona", "Sobre", "Preços"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff632a] transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="hidden sm:block px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all"
          >
            Entrar
          </Link>
          <Link
            to="/auth?signup=true"
            className="px-8 py-4 rounded-2xl bg-white text-black font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#ff632a] hover:text-white transition-all shadow-xl shadow-white/5 hover:shadow-orange-500/20 active:scale-95"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </nav>
  );
}
