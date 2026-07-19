import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 1. Importações do Contexto e Proteção
import { AuthProvider } from "./context/AuthContext";
import { RotaProtegida, RedirecionarPorPapel } from "./components/RotaProtegida";
import MainLayout from "./layouts/MainLayout";

// 2. Importações das Páginas
import Login from "./pages/Login";
import PreInscricao from "./pages/PreInscricao";
import PainelAdmin from "./pages/PainelAdmin";
import GeriCurso from "./pages/GerirCursos";
import GeriEstudante from "./pages/GeriEstudante";
import GerirNotasProfessor from "./pages/GerirNotasProfessor";
import PainelEstudante from "./pages/PainelEstudante"; // <--- IMPORTAÇÃO DO NOVO PAINEL
import PagamentosEstudante from "./pages/PagamentosEstudante";
import RelatorioPropinasAdmin from "./pages/RelatorioPropinasAdmin";

// Dentro do teu Router/Routes:

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ================= ROTAS SEM NAVBAR ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/pre-inscricao" element={<PreInscricao />} />
          
          <Route path="/dashboard" element={<RedirecionarPorPapel />} />
          <Route path="/" element={<RedirecionarPorPapel />} />

          {/* ================= ROTAS COM NAVBAR (MainLayout) ================= */}
          <Route element={<MainLayout />}>
            
            {/* Admin */}
            <Route path="/admin" element={<RotaProtegida papeisPermitidos={["admin"]}><PainelAdmin /></RotaProtegida>} />
            <Route path="/admin/gericurso" element={<RotaProtegida papeisPermitidos={["admin"]}><GeriCurso /></RotaProtegida>} />
            <Route path="/admin/geriestudante" element={<RotaProtegida papeisPermitidos={["admin"]}><GeriEstudante /></RotaProtegida>} />

            {/* Professor */}
            <Route path="/professor" element={<RotaProtegida papeisPermitidos={["professor"]}><GerirNotasProfessor /></RotaProtegida>} />

            {/* Estudante - Agora usando o componente real */}
            <Route path="/estudante" element={<RotaProtegida papeisPermitidos={["estudante"]}><PainelEstudante /></RotaProtegida>} />
            <Route path="/estudante/pagamentos" element={<PagamentosEstudante />} />
            <Route path="/admin/propinas" element={<RelatorioPropinasAdmin />} />

            
          </Route>

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}