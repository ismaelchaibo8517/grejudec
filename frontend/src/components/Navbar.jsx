import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Consome o nosso contexto real
import "./Navbar.css";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario, logout } = useAuth(); // Consome o utilizador e a função de logout centralizada

  // =========================================================
  // CONFIGURAÇÃO DE ROTAS DINÂMICAS
  // Os papéis correspondem exatamente ao ENUM do teu Sequelize
  // =========================================================
  const linksPorPapel = {
    admin: [
      { 
        nome: "Administração", 
        path: "/admin", 
        classe: "text-white bg-slate-900 hover:bg-slate-800" 
      }
    ],
    professor: [
      { 
        nome: "Área Docente", 
        path: "/professor", 
        classe: "text-slate-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100/50" 
      }
    ],
    estudante: [
      { 
        nome: "Painel Estudante", 
        path: "/estudante", 
        classe: "text-slate-700 bg-blue-50 border border-blue-200 hover:bg-blue-100/50" 
      }
    ]
  };

  // Função de logout simplificada e delegada ao AuthContext
  const handleLogout = async () => {
    try {
      setMenuAberto(false);
      await logout(); // O AuthContext trata de bater na API, limpar o cookie e redirecionar!
    } catch (error) {
      console.error("Erro ao efetuar logout na Navbar:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 shadow-sm z-50 transition-all duration-300">
      
      <div className="navbar-bg-image"></div>

      {/* --- CABEÇALHO DA NAVBAR (Sempre visível) --- */}
      <div className="flex items-center justify-between w-full md:w-auto py-3 md:py-4 z-10">
        
        {/* Logo + Texto da Marca */}
        <Link to="/dashboard" className="flex items-center gap-3 no-underline">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200/80 shadow-inner">
            <img
              src="/logo.jpeg"
              alt="GREJUDEC Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML =
                  '<span class="text-[9px] font-bold text-slate-400 font-mono">GREJUDEC</span>';
              }}
            />
          </div>

          <div className="flex flex-col text-left max-w-[190px] sm:max-w-xs md:max-w-none">
            <span className="font-black text-xl md:text-3xl text-slate-900 tracking-tight leading-none uppercase">
              <span className="text-red-600">GRE</span>
              <span className="text-blue-600">JU</span>
              <span className="text-yellow-500">DE</span>
              <span className="text-transparent inline-block [-webkit-text-stroke:1px_#000] ml-0.5">
                C
              </span>
            </span>
            <span className="text-[8px] md:text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-1 leading-tight">
              Grêmio Juvenil para Desenvolvimento Comunitário
            </span>
          </div>
        </Link>

        {/* Botão de Menu (Mobile) */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="flex md:hidden items-center justify-center w-10 h-10 font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl transition-all active:scale-95 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {menuAberto ? <span className="text-lg">✕</span> : <span className="text-xl">☰</span>}
        </button>
      </div>

      {/* --- MENU DE NAVEGAÇÃO --- */}
      <div 
        className={`${
          menuAberto ? "flex opacity-100 scale-y-100 max-h-[500px]" : "hidden md:flex opacity-0 md:opacity-100 max-h-0 md:max-h-none"
        } md:flex flex-col md:flex-row items-stretch md:items-center gap-3 font-mono text-sm z-10 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 pb-5 md:pb-0 transition-all duration-300 origin-top`}
      >
        {/* Link para o Painel Inicial */}
        <Link 
          to="/dashboard"
          onClick={() => setMenuAberto(false)}
          className="text-center py-3 md:py-2 px-4 font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 md:border-transparent rounded-xl transition-colors"
        >
          <span className="text-red-600">Painel Inicial</span>
        </Link>
        
        <a 
          href="#cursos"
          onClick={() => setMenuAberto(false)}
          className="text-center py-3 md:py-2 px-4 font-bold text-slate-600 hover:text-slate-900 border border-slate-300 md:border-transparent rounded-xl transition-colors cursor-pointer"
        >
          <span className="text-blue-600">Cursos</span>
        </a>

        {/* --- LINKS DINÂMICOS POR PAPEL (Renderização em Loop Inteligente) --- */}
        {usuario && (
          <div className="flex flex-col md:flex-row gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            
            {/* Percorre a nossa lista de links baseado no papel do utilizador logado */}
            {linksPorPapel[usuario.papel]?.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                onClick={() => setMenuAberto(false)}
                className={`text-center py-3 md:py-2 px-4 font-bold rounded-xl transition-all duration-200 ${link.classe}`}
              >
                {link.nome}
              </Link>
            ))}

            {/* Botão de Sair Unificado */}
            <button
              onClick={handleLogout}
              className="py-3 md:py-2 px-4 font-bold text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded-xl transition-all"
            >
              Sair
            </button>
          </div>
        )}

        {/* Se não estiver logado, exibe botão de login */}
        {!usuario && (
          <Link
            to="/login"
            onClick={() => setMenuAberto(false)}
            className="text-center py-3 md:py-2 px-5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}