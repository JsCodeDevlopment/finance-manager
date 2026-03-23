import {
  LayoutDashboard,
  LogOut,
  ReceiptText,
  User,
  WalletCards,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff632a]"></div>
      </div>
    );
  }

  const navItems = [
    {
      label: "Painel",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Transações",
      path: "/transactions",
      icon: <ReceiptText size={20} />,
    },
    {
      label: "Uso do Dinheiro",
      path: "/money-usage",
      icon: <WalletCards size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex select-none">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#020617] border-r border-white/5 hidden lg:flex flex-col z-50">
        <div className="p-10">
          <Link
            to="/"
            className="flex items-center group transition-transform duration-500 hover:scale-105"
          >
            <img src="/logo-light.png" alt="Logo" className="h-8 opacity-90" />
            <span className="ml-3 text-2xl font-bold tracking-tight text-white">
              Finance<span className="text-[#ff632a] font-black">+</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Módulos de Controle
          </p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-tight group ${
                location.pathname === item.path
                  ? "bg-[#ff632a] text-white shadow-2xl shadow-orange-500/20"
                  : "text-slate-500 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`transition-colors duration-300 ${location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-[#ff632a]"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all cursor-default">
            <div className="w-10 h-10 rounded-xl bg-[#ff632a]/10 border border-[#ff632a]/20 flex items-center justify-center text-[#ff632a]">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {session?.user?.email?.split("@")[0]}
              </p>
              <p className="text-[10px] font-medium text-slate-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-slate-400 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 min-h-screen flex flex-col relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff632a]/5 blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>

        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-[#020617] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-6" />
            <span className="ml-2 text-xl font-bold tracking-tight text-white">
              Upwell<span className="text-[#ff632a]">+</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3 rounded-xl transition-all ${location.pathname === item.path ? "bg-[#ff632a] text-white shadow-lg" : "text-slate-500"}`}
              >
                {item.icon}
              </Link>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <button
              onClick={handleSignOut}
              className="p-3 text-red-500/80 hover:text-red-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 lg:p-14 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
