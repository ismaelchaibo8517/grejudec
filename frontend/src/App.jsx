import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// 1. Importações do Contexto, Proteção e Layout
import { AuthProvider } from "./context/AuthContext";
import {
  RotaProtegida,
  RedirecionarPorPapel,
} from "./components/RotaProtegida";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import GeriCurso from "./pages/GerirCursos";
import GeriEstudante from "./pages/GeriEstudante";
import PreInscricao from "./pages/PreInscricao";
// ... outras importações
import GerirNotasProfessor from "./pages/GerirNotasProfessor"; // <--- ADICIONA ESTA LINHA

// IMPORTAÇÃO REAL: Painel de Administração de Docentes
import PainelAdmin from "./pages/PainelAdmin";



const PainelEstudante = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md">
        <h1 className="text-2xl font-bold text-slate-800">
          Portal do Estudante 🎓
        </h1>
        <p className="text-slate-600 mt-2 text-sm">
          A tua área pessoal. Consulta as tuas notas, avaliações e dados de
          matrícula.
        </p>
      </div>
    </div>
  );
};

// 3. Estrutura Principal do Roteamento
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ================= ROTAS SEM NAVBAR ================= */}
          {/* Rota Pública de Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/pre-inscricao" element={<PreInscricao />} />{" "}
          {/* <-- ADICIONA ESTA ROTA */}
          {/* Redirecionadores Inteligentes (Sem UI, apenas lógica de desvio) */}
          <Route path="/dashboard" element={<RedirecionarPorPapel />} />
          <Route path="/" element={<RedirecionarPorPapel />} />
          {/* ================= ROTAS COM NAVBAR (MainLayout) ================= */}
          <Route element={<MainLayout />}>
            {/* Rota Protegida: Apenas Administradores (Painel de Docentes) */}
            <Route
              path="/admin"
              element={
                <RotaProtegida papeisPermitidos={["admin"]}>
                  <PainelAdmin />
                </RotaProtegida>
              }
            />

            {/* NOVA Rota Protegida: Gerenciador de Cursos (GeriCurso) */}
            <Route
              path="/admin/gericurso"
              element={
                <RotaProtegida papeisPermitidos={["admin"]}>
                  <GeriCurso />
                </RotaProtegida>
              }
            />
            {/* NOVA ROTA PROTEGIDA: GeriEstudante (Estudantes) */}
            <Route
              path="/admin/geriestudante"
              element={
                <RotaProtegida papeisPermitidos={["admin"]}>
                  <GeriEstudante />
                </RotaProtegida>
              }
            />


            {/* Rota Protegida: Apenas Estudantes */}
            <Route
              path="/estudante"
              element={
                <RotaProtegida papeisPermitidos={["estudante"]}>
                  <PainelEstudante />
                </RotaProtegida>
              }
            />

            {/* Rota Protegida: Apenas Professores */}
            <Route
              path="/professor"
              element={
                <RotaProtegida papeisPermitidos={["professor"]}>
                  <GerirNotasProfessor /> {/* <--- AQUI ESTÁ A ALTERAÇÃO */}
                </RotaProtegida>
              }
            />
          </Route>
          {/* ================= FALLBACK DE SEGURANÇA ================= */}
          {/* Qualquer rota inválida volta para a triagem inteligente */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
