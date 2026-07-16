// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar"; // IMPORTADO AQUI!
import SystemAlert from "../components/SystemAlert";

export default function MainLayout({ usuario, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* A Navbar fica fixa no topo para todas as rotas filhas */}
      <Navbar usuario={usuario} onLogout={onLogout} />
      <div className="index-z-99">
         <SystemAlert />

      </div>
     
      
      {/* Onde as páginas internas (Dashboard, Cursos, etc.) serão injetadas */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}