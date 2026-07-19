import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importado para conectar com gericurso
import api from "../api/api"; // Certifica-te de que o caminho está correto

export default function PainelAdmin() {
  const navigate = useNavigate(); // Hook de navegação
  const [professores, setProfessores] = useState([]);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");

  // --- ESTADOS DOS MODAIS e FORMULÁRIOS ---
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [professorSelecionadoId, setProfessorSelecionadoId] = useState(null);

  // Campos do Formulário
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [disciplinasIds, setDisciplinasIds] = useState([]);

  // Estado para mostrar as credenciais geradas após criar um professor
  const [credenciaisGeradas, setCredenciaisGeradas] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Carregar professores e disciplinas ao montar o componente
  useEffect(() => {
    obterDadosIniciais();
  }, []);

  const obterDadosIniciais = async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Procurar professores e disciplinas em paralelo
      const [resProfessores, resDisciplinas] = await Promise.all([
        api.get("/professores"),
        api.get("/disciplinas").catch(() => ({ data: [] })), // Fallback se a rota de disciplinas ainda não existir
      ]);

      setProfessores(resProfessores.data);
      setDisciplinasDisponiveis(resDisciplinas.data);
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
      setErro(
        "Não foi possível carregar as informações do servidor. Verifica a conexão.",
      );
    } finally {
      setCarregando(false);
    }
  };

  // Filtro local inteligente por nome ou por disciplina
  const professoresFiltrados = professores.filter((prof) => {
    const nomeCorresponde = prof.nomeCompleto
      ?.toLowerCase()
      .includes(busca.toLowerCase());
    const disciplinaCorresponde = prof.disciplinas?.some((disc) =>
      disc.nome?.toLowerCase().includes(busca.toLowerCase()),
    );
    return nomeCorresponde || disciplinaCorresponde;
  });

  // --- MANIPULAÇÃO DO FORMULÁRIO ---

  // Abrir modal para Adicionar Novo
  const abrirModalCriar = () => {
    setModoEdicao(false);
    setProfessorSelecionadoId(null);
    setNomeCompleto("");
    setEmail("");
    setEspecialidade("");
    setDisciplinasIds([]);
    setModalAberto(true);
  };

  // Abrir modal para Editar Existente
  const abrirModalEditar = (prof) => {
    setModoEdicao(true);
    setProfessorSelecionadoId(prof.id);
    setNomeCompleto(prof.nomeCompleto || "");
    setEmail(prof.email || "");
    setEspecialidade(prof.especialidade || "");
    // Mapeia as disciplinas já vinculadas para o array de IDs do formulário
    const ids = prof.disciplinas ? prof.disciplinas.map((d) => d.id) : [];
    setDisciplinasIds(ids);
    setModalAberto(true);
  };

  // Lidar com seleção de disciplinas (checkboxes)
  const handleCheckboxDisciplina = (id) => {
    if (disciplinasIds.includes(id)) {
      setDisciplinasIds(disciplinasIds.filter((dId) => dId !== id));
    } else {
      setDisciplinasIds([...disciplinasIds, id]);
    }
  };

  // Submeter dados (Criar ou Atualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const payload = {
      nomeCompleto,
      especialidade,
      disciplinasIds,
      ...(email && { email }), // Só envia se estiver preenchido
    };

    try {
      if (modoEdicao) {
        // Rota de Atualização (PUT /api/professores/:id)
        await api.put(`/professores/${professorSelecionadoId}`, payload);
        alert("Docente atualizado com sucesso!");
      } else {
        // Rota de Criação (POST /api/professores)
        const resposta = await api.post("/professores", payload);

        // Se o backend gerou credenciais, guarda no estado para exibir ao admin
        if (resposta.data?.credenciais) {
          setCredenciaisGeradas(resposta.data.credenciais);
        } else {
          alert("Docente cadastrado com sucesso!");
        }
      }

      setModalAberto(false);
      obterDadosIniciais(); // Recarrega a tabela com os dados novos do banco
    } catch (err) {
      console.error("Erro ao salvar docente:", err);
      const mensagemErro =
        err.response?.data?.message || "Ocorreu um erro ao salvar o docente.";
      alert(`Erro: ${mensagemErro}`);
    } finally {
      setSalvando(false);
    }
  };

  // Eliminar Professor (Soft Delete)
  const lidarComEliminar = async (id, nome) => {
    if (
      window.confirm(
        `Tens a certeza de que desejas remover o professor ${nome}?`,
      )
    ) {
      try {
        await api.delete(`/professores/${id}`);
        alert("Professor removido com sucesso!");
        obterDadosIniciais(); // Recarrega a lista
      } catch (err) {
        console.error("Erro ao eliminar professor:", err);
        alert("Não foi possível remover o professor. Tenta novamente.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* --- CABEÇALHO DO PAINEL --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Gestão de Docentes 🛡️
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visualiza, adiciona e edita os professores ativos do sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* BOTÃO DE CONEXÃO COM GERICURSO */}
          <button
            onClick={() => navigate("/admin/gericurso")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm border border-slate-200 shadow-xs"
          >
            <span>📚 Gerir Cursos</span>
          </button>

          {/* BOTÃO DE CONEXÃO COM GERIESTUDANTE */}
          <button
            onClick={() => navigate("/admin/geriestudante")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm border border-slate-200 shadow-xs"
          >
            <span>🎓 Gerir Estudantes</span>
          </button>

          {/* NOVO: BOTÃO DE CONEXÃO COM RELATÓRIO FINANCEIRO / PROPINAS */}
          <button
            onClick={() => navigate("/admin/propinas")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm border border-slate-200 shadow-xs"
          >
            <span>📊 Propinas</span>
          </button>

          <button
            onClick={abrirModalCriar}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all text-sm"
          >
            <span>+ Adicionar Professor</span>
          </button>
        </div>
      </div>

      {/* --- CARDS DE MÉTRICAS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Total de Docentes
          </span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">
            {carregando ? "..." : professores.length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Disciplinas Vinculadas
          </span>
          <h3 className="text-3xl font-black text-blue-600 mt-2">
            {carregando
              ? "..."
              : professores.reduce(
                  (acc, p) => acc + (p.disciplinas?.length || 0),
                  0,
                )}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Status do Sistema
          </span>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">
              Conectado à API
            </span>
          </div>
        </div>
      </div>

      {/* --- FILTROS & BUSCA --- */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Procurar por nome do docente ou disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>

        <span className="text-xs font-bold text-slate-400 uppercase">
          {professoresFiltrados.length} encontrados
        </span>
      </div>

      {/* --- ESTADOS DA REQUISIÇÃO (Loading, Erro) --- */}
      {carregando && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-bold">
            A carregar docentes do servidor...
          </p>
        </div>
      )}

      {erro && (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center">
          <span className="text-2xl block mb-2">⚠️</span>
          <p className="font-bold text-sm">{erro}</p>
        </div>
      )}

      {/* --- TABELA DE DOCENTES --- */}
      {!carregando && !erro && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Docente</th>
                  <th className="py-4 px-6">Código (Login) / E-mail</th>
                  <th className="py-4 px-6">Disciplinas Atribuídas</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {professoresFiltrados.length > 0 ? (
                  professoresFiltrados.map((prof) => (
                    <tr
                      key={prof.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Nome / Foto Placeholder */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center font-bold text-blue-700 uppercase">
                            {prof.nomeCompleto
                              ? prof.nomeCompleto.substring(0, 2)
                              : "PR"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {prof.nomeCompleto}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {prof.especialidade || "Sem especialidade"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contacto / Matrícula */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded w-fit">
                            👤 {prof.usuarioProfessor || `ID: #${prof.id}`}
                          </span>
                          <span className="text-slate-500 text-xs mt-1">
                            {prof.email || "Sem e-mail registado"}
                          </span>
                        </div>
                      </td>

                      {/* Disciplinas Vinculadas */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {prof.disciplinas && prof.disciplinas.length > 0 ? (
                            prof.disciplinas.map((disc) => (
                              <span
                                key={disc.id}
                                className="inline-block px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg"
                              >
                                {disc.nome}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              Nenhuma disciplina vinculada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalEditar(prof)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar docente"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              lidarComEliminar(prof.id, prof.nomeCompleto)
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar docente"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-12 px-6 text-center text-slate-400"
                    >
                      Nenhum docente corresponde à sua pesquisa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL DE CRIAR / EDITAR PROFESSOR --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {modoEdicao ? "Editar Docente ✏️" : "Registar Novo Docente 📝"}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ismael Chaibo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="Ex: docente@grejudec.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Especialidade / Área
                </label>
                <input
                  type="text"
                  placeholder="Ex: Programação Web, Eletrónica"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* VINCULAÇÃO DE DISCIPLINAS */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Atribuir Disciplinas
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {disciplinasDisponiveis.length > 0 ? (
                    disciplinasDisponiveis.map((disc) => (
                      <label
                        key={disc.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={disciplinasIds.includes(disc.id)}
                          onChange={() => handleCheckboxDisciplina(disc.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                        />
                        {disc.nome}
                      </label>
                    ))
                  ) : (
                    <p className="text-xs italic text-slate-400">
                      Nenhuma disciplina ativa encontrada no servidor para
                      atribuição.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {salvando ? "A salvar..." : "Salvar Docente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CREDENCIAIS GERADAS --- */}
      {credenciaisGeradas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center rounded-full mx-auto">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Professor Registado!
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                O utilizador de acesso ao sistema foi gerado automaticamente
                pelo servidor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase">
                  Nome de Usuário
                </span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-xs border border-slate-200">
                  {credenciaisGeradas.usuario}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase">
                  Senha Provisória
                </span>
                <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded shadow-xs border border-slate-200">
                  {credenciaisGeradas.senhaProvisoria}
                </span>
              </div>
            </div>

            <p className="text-xs text-yellow-600 bg-yellow-50 p-2.5 rounded-lg font-medium text-left">
              ⚠️ Copia ou anota estas credenciais agora. Elas serão necessárias
              para o primeiro login do professor!
            </p>

            <button
              onClick={() => setCredenciaisGeradas(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
            >
              Concluído, Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}