
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RotaProtegida - Protege rotas por autenticação e nível de permissão (papel)
 */
export function RotaProtegida({ children, papeisPermitidos }) {
  const { usuario, carregando } = useAuth();

  // 1. Enquanto o AuthContext valida a sessão com o servidor, mostra um feedback visual.
  // Evita o bug comum de redirecionar para o Login antes de o servidor responder.
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-semibold animate-pulse">A carregar a tua sessão...</p>
        </div>
      </div>
    );
  }

  // 2. Se o utilizador não está logado, redireciona para o login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se a rota exige papéis específicos e o papel atual do utilizador não está incluído
  if (papeisPermitidos && !papeisPermitidos.includes(usuario.papel)) {
    // Envia-o de volta para o painel correto a que ele tem direito
    return <RedirecionarPorPapel />;
  }

  // 4. Tudo certo! Dá acesso à página protegida
  return children;
}

/**
 * RedirecionarPorPapel - Redirecionador inteligente baseado no ENUM do backend
 */
export function RedirecionarPorPapel() {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  switch (usuario.papel) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "professor":
      return <Navigate to="/professor" replace />;
    case "estudante":
      return <Navigate to="/estudante" replace />;
    default:
      // Se tiver um papel inválido ou não mapeado, força logout por segurança
      return <Navigate to="/login" replace />;
  }
}