// C:\Users\administrator\Documents\js\grejudec\frontend\src\pages\GerirProfessores.jsx
import React, { useState, useEffect, useActionState, startTransition } from "react";
import api from "../api/api"; // Importa a tua API configurada
import { useAlert } from "../context/AlertContext"; // Teu contexto global de alertas
import Table from "../components/Table"; // Teu componente genérico reutilizável de tabela

export default function GerirProfessores() {
  const { dispararAlerta } = useAlert() || { dispararAlerta: console.log }; // Fallback de segurança
  
  // States estruturais
  const [professores, setProfessores] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loadingDados, setLoadingDados] = useState(true);
  
  // States do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [professorEditando, setProfessorEditando] = useState(null);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState([]);

  // ==========================================
  // 1. Definição de Colunas e Ações da Tabela
  // ==========================================
  const colunas = [
    {
      key: "nomeCompleto",
      label: "Nome do Professor",
      render: (prof) => (
        <span className="font-medium text-slate-800">{prof.nomeCompleto}</span>
      )
    },
    {
      key: "especialidade",
      label: "Especialidade",
      render: (prof) => prof.especialidade ? (
        <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium">
          {prof.especialidade}
        </span>
      ) : (
        <span className="text-slate-400 italic text-xs">Não definida</span>
      )
    },
    {
      key: "disciplinas",
      label: "Disciplinas Lecionadas",
      render: (prof) => (
        <div className="flex flex-wrap gap-1.5 max-w-md">
          {prof.disciplinas && prof.disciplinas.length > 0 ? (
            prof.disciplinas.map((disc) => (
              <span 
                key={disc.id} 
                className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded border border-slate-200"
              >
                {disc.nome}
              </span>
            ))
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded font-medium">
              Sem disciplinas atribuídas
            </span>
          )}
        </div>
      )
    }
  ];

  const renderAcoes = (prof) => (
    <div className="inline-flex gap-2">
      <button
        onClick={() => abrirModalEditar(prof)}
        className="text-slate-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        title="Editar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => lidarComDeletar(prof.id, prof.nomeCompleto)}
        className="text-slate-600 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
        title="Eliminar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  // ==========================================
  // 2. Carregar Dados do Servidor
  // ==========================================
  const carregarDados = async () => {
    setLoadingDados(true);
    try {
      const [resProf, resDisc] = await Promise.all([
        api.get("/professores"),
        api.get("/disciplinas")
      ]);

      setProfessores(resProf.data);
      setDisciplinas(resDisc.data.filter(d => d.ativo !== false));
      
    } catch (err) {
      dispararAlerta(
        "error",
        err.message || "Erro de Conexão",
        err.description || "Não foi possível carregar os dados do servidor."
      );
    } finally {
      setLoadingDados(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ==========================================
  // 3. Ação de Formulário com useActionState (React 19)
  // ==========================================
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      const nomeCompleto = formData.get("nomeCompleto")?.toString().trim();
      const especialidade = formData.get("especialidade")?.toString().trim();

      if (!nomeCompleto || nomeCompleto.length < 3) {
        return { error: "O nome completo deve ter pelo menos 3 caracteres." };
      }

      const payload = {
        nomeCompleto,
        especialidade,
        disciplinasIds: disciplinasSelecionadas
      };

      try {
        let response;
        
        if (professorEditando) {
          response = await api.put(`/professores/${professorEditando.id}`, payload);
        } else {
          response = await api.post("/professores", payload);
        }

        const data = response.data;

        carregarDados();
        fecharModal();
        
        if (data.alert) {
          dispararAlerta(
            data.alert.type || "success",
            data.alert.message,
            data.alert.description
          );
        }

        return { success: true, error: null };
      } catch (err) {
        return { error: err.message || "Ocorreu um erro ao processar a requisição." };
      }
    },
    { success: null, error: null }
  );

  // ==========================================
  // 4. Deletar Professor (Soft Delete)
  // ==========================================
  const lidarComDeletar = async (id, nome) => {
    if (!window.confirm(`Tens a certeza que queres remover o(a) professor(a) ${nome}?`)) return;

    try {
      const response = await api.delete(`/professores/${id}`);
      const data = response.data;

      carregarDados();
      
      if (data.alert) {
        dispararAlerta(
          data.alert.type || "success",
          data.alert.message,
          data.alert.description
        );
      }
    } catch (err) {
      dispararAlerta(
        "error",
        err.message || "Erro ao Remover",
        err.description || "Não foi possível remover o professor."
      );
    }
  };

  // ==========================================
  // Auxiliares de Modais
  // ==========================================
  const abrirModalCriar = () => {
    setProfessorEditando(null);
    setDisciplinasSelecionadas([]);
    setModalAberto(true);
  };

  const abrirModalEditar = (professor) => {
    setProfessorEditando(professor);
    const idsPrecos = professor.disciplinas ? professor.disciplinas.map(d => d.id) : [];
    setDisciplinasSelecionadas(idsPrecos);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProfessorEditando(null);
    setDisciplinasSelecionadas([]);
  };

  const alternarDisciplina = (id) => {
    setDisciplinasSelecionadas(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtro local de busca de professores
  const professoresFiltrados = professores.filter(p =>
    p.nomeCompleto.toLowerCase().includes(pesquisa.toLowerCase()) ||
    (p.especialidade && p.especialidade.toLowerCase().includes(pesquisa.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Professores</h1>
          <p className="text-sm text-slate-500 mt-1">Registe, atualize e associe professores às respetivas disciplinas acadêmicas.</p>
        </div>
        <button
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Professor
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Pesquisar por nome ou especialidade..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          Total: {professoresFiltrados.length} professor(es)
        </span>
      </div>

      {/* Tabela de Dados Reutilizável */}
      {loadingDados ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-12 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-slate-500 font-medium">A carregar professores...</p>
        </div>
      ) : (
        <Table 
          headers={colunas} 
          data={professoresFiltrados} 
          actions={renderAcoes} 
        />
      )}

      {/* ==========================================
          MODAL DE CADASTRO/EDIÇÃO
          ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {professorEditando ? "Editar Professor" : "Registar Novo Professor"}
              </h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulário do Modal com useActionState */}
            <form action={(fd) => startTransition(() => formAction(fd))} className="p-6 flex-1 overflow-y-auto max-h-[70vh] space-y-5">
              {state?.error && (
                <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-lg border border-red-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{state.error}</span>
                </div>
              )}

              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Nome Completo</label>
                <input
                  type="text"
                  name="nomeCompleto"
                  defaultValue={professorEditando?.nomeCompleto || ""}
                  required
                  placeholder="Ex: Ismael Mussussa"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Especialidade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Especialidade / Título</label>
                <input
                  type="text"
                  name="especialidade"
                  defaultValue={professorEditando?.especialidade || ""}
                  placeholder="Ex: Engenharia de Software, Física Nuclear"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Seleção de Disciplinas Ativas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Associar Disciplinas</label>
                  <p className="text-xs text-slate-400 mt-0.5">Selecione uma ou mais disciplinas para este professor ministrar.</p>
                </div>
                
                {disciplinas.length === 0 ? (
                  <p className="text-xs italic text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    Nenhuma disciplina ativa cadastrada na base de dados. Registe disciplinas primeiro!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                    {disciplinas.map((disc) => {
                      const selecionado = disciplinasSelecionadas.includes(disc.id);
                      return (
                        <button
                          key={disc.id}
                          type="button"
                          onClick={() => alternarDisciplina(disc.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-md border text-left transition-all ${
                            selecionado 
                              ? "bg-blue-50 border-blue-200 text-blue-800" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                            selecionado ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {selecionado && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-medium truncate">{disc.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>A processar...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}