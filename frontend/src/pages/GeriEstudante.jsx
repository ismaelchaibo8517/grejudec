import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // Ajusta o caminho se necessário
import SystemAlert from "../components/SystemAlert"; // Ajusta o caminho do teu componente SystemAlert

export default function GeriEstudante() {
  const navigate = useNavigate();
  const [estudantes, setEstudantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  // --- ESTADO GLOBAL DE ALERTAS/FEEDBACK ---
  const [alerta, setAlerta] = useState(null); // { type: 'success' | 'error' | 'warning' | 'info', message: "", description: "" }

  // --- ESTADOS DO MODAL E FORMULÁRIO ---
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [estudanteSelecionadoId, setEstudanteSelecionadoId] = useState(null);

  // Campos do Formulário (Sintonizados com o Joi Schema do teu Backend)
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [numBi, setNumBi] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [matriculaDoc, setMatriculaDoc] = useState("");
  const [certificado, setCertificado] = useState("");
  const [statusMatricula, setStatusMatricula] = useState("pre-inscrito");
  const [cursoId, setCursoId] = useState("");

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  // Helper para disparar alertas rapidamente
  const dispararAlerta = (type, message, description = "") => {
    setAlerta({ type, message, description });
  };

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setAlerta(null);

      // Procurar estudantes e cursos em paralelo
      const [resEstudantes, resCursos] = await Promise.all([
        api.get("/estudantes"),
        api.get("/cursos").catch(() => ({ data: [] })) // Fallback caso a rota de cursos ainda não exista
      ]);

      setEstudantes(resEstudantes.data);
      setCursos(resCursos.data);
    } catch (err) {
      console.error("Erro ao carregar dados dos estudantes:", err);
      dispararAlerta(
        "error",
        "Erro de Conexão",
        "Não foi possível carregar os dados. Verifica se o servidor backend está online."
      );
    } finally {
      setCarregando(false);
    }
  };

  // Filtro de busca inteligente (por Nome, Matrícula ou BI)
  const estudantesFiltrados = estudantes.filter((est) => {
    const termo = busca.toLowerCase();
    return (
      est.nomeCompleto?.toLowerCase().includes(termo) ||
      est.numeroMatricula?.toLowerCase().includes(termo) ||
      est.numBi?.toLowerCase().includes(termo)
    );
  });

  // --- CONTROLO DO FORMULÁRIO ---
  
  const abrirModalCriar = () => {
    setModoEdicao(false);
    setEstudanteSelecionadoId(null);
    setNomeCompleto("");
    setNumBi("");
    setTelefone("");
    setDataNascimento("");
    setMatriculaDoc("");
    setCertificado("");
    setStatusMatricula("pre-inscrito");
    setCursoId(cursos.length > 0 ? cursos[0].id : "");
    setModalAberto(true);
  };

  const abrirModalEditar = (est) => {
    setModoEdicao(true);
    setEstudanteSelecionadoId(est.id);
    setNomeCompleto(est.nomeCompleto || "");
    setNumBi(est.numBi || "");
    setTelefone(est.telefone || "");
    // Tratar data para o formato aceito pelo input do tipo date (AAAA-MM-DD)
    setDataNascimento(est.dataNascimento ? est.dataNascimento.substring(0, 10) : "");
    setMatriculaDoc(est.matriculaDoc || "");
    setCertificado(est.certificado || "");
    setStatusMatricula(est.statusMatricula || "pre-inscrito");
    setCursoId(est.curso_id || est.cursoId || "");
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação local rápida do BI moçambicano antes de enviar à API
    const regexBi = /^[0-9]{12}[A-Za-z]$/;
    if (!regexBi.test(numBi.trim())) {
      dispararAlerta(
        "warning",
        "Formato de BI Inválido",
        "O BI deve conter exatamente 12 números seguidos de uma única letra (Ex: 123456789012A)."
      );
      return;
    }

    if (!cursoId) {
      dispararAlerta("warning", "Seleção Obrigatória", "Por favor, seleciona um curso para o estudante.");
      return;
    }

    setSalvando(true);

    const payload = {
      nomeCompleto: nomeCompleto.trim(),
      numBi: numBi.trim().toUpperCase(),
      telefone: telefone.trim() || null,
      dataNascimento: dataNascimento || null,
      matriculaDoc: matriculaDoc.trim() || null,
      certificado: certificado.trim() || null,
      statusMatricula,
      cursoId: parseInt(cursoId, 10)
    };

    try {
      if (modoEdicao) {
        await api.put(`/estudantes/${estudanteSelecionadoId}`, payload);
        dispararAlerta("success", "Estudante atualizado com sucesso!", `Os dados de ${payload.nomeCompleto} foram guardados.`);
      } else {
        await api.post("/estudantes", payload);
        dispararAlerta("success", "Estudante matriculado com sucesso!", `${payload.nomeCompleto} foi registado no sistema.`);
      }
      setModalAberto(false);
      carregarDados(); // Atualiza a lista
    } catch (err) {
      console.error("Erro ao salvar estudante:", err);
      const msg = err.response?.data?.message || err.message || "Erro desconhecido ao processar requisição.";
      dispararAlerta("error", "Não foi possível salvar o estudante", msg);
    } finally {
      setSalvando(false);
    }
  };

  const lidarComEliminar = async (id, nome) => {
    if (window.confirm(`Tens a certeza de que desejas remover o estudante ${nome}? (Esta ação fará um soft delete)`)) {
      try {
        await api.delete(`/estudantes/${id}`);
        dispararAlerta("success", "Estudante removido", `A inscrição de ${nome} foi removida com sucesso.`);
        carregarDados();
      } catch (err) {
        console.error("Erro ao remover estudante:", err);
        dispararAlerta("error", "Falha na remoção", "Não foi possível remover o estudante do sistema. Tenta novamente.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Gestão de Estudantes 🎓
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Matricula novos alunos, altera estados de inscrição e consulta dados do corpo estudantil.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate("/admin")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm border border-slate-200"
          >
            <span>← Painel Docentes</span>
          </button>

          <button 
            onClick={abrirModalCriar}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
          >
            <span>+ Matricular Estudante</span>
          </button>
        </div>
      </div>

      {/* --- ALERTAS DO SISTEMA --- */}
      {alerta && (
        <div className="animate-fade-in">
          <SystemAlert
            type={alerta.type}
            message={alerta.message}
            description={alerta.description}
            onClose={() => setAlerta(null)}
            autoCloseDuration={6000} // Fecha sozinho em 6 segundos
          />
        </div>
      )}

      {/* --- CARDS DE MÉTRICAS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Estudantes</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">
            {carregando ? "..." : estudantes.length}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Novos Pré-Inscritos</span>
          <h3 className="text-3xl font-black text-amber-500 mt-2">
            {carregando ? "..." : estudantes.filter(e => e.statusMatricula === "pre-inscrito").length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cursos Registados</span>
          <h3 className="text-3xl font-black text-blue-600 mt-2">
            {carregando ? "..." : cursos.length}
          </h3>
        </div>
      </div>

      {/* --- FILTROS E PESQUISA --- */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Procura por nome, matrícula ou BI..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase">
          {estudantesFiltrados.length} estudantes listados
        </span>
      </div>

      {/* --- CARREGANDO --- */}
      {carregando && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-bold">A carregar estudantes da base de dados...</p>
        </div>
      )}

      {/* --- TABELA --- */}
      {!carregando && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Nome / Matrícula</th>
                  <th className="py-4 px-6">Documentação (BI)</th>
                  <th className="py-4 px-6">Contacto</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {estudantesFiltrados.length > 0 ? (
                  estudantesFiltrados.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nome e Matrícula */}
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-bold text-slate-900 block">{est.nomeCompleto}</span>
                          <span className="inline-block mt-1 font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Nº {est.numeroMatricula}
                          </span>
                        </div>
                      </td>

                      {/* BI */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded w-fit">
                            🪪 {est.numBi}
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            Nascimento: {est.dataNascimento ? new Date(est.dataNascimento).toLocaleDateString() : "Não informada"}
                          </span>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-4 px-6 text-slate-500">
                        {est.telefone || <span className="italic text-slate-300">Sem telefone</span>}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase ${
                          est.statusMatricula === "pre-inscrito" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          est.statusMatricula === "trancado" ? "bg-red-50 text-red-600 border border-red-100" :
                          est.statusMatricula === "concluido" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {est.statusMatricula}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalEditar(est)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar dados"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => lidarComEliminar(est.id, est.nomeCompleto)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Deletar estudante"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 px-6 text-center text-slate-400">
                      Nenhum estudante registado ou correspondente à busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL PARA CRIAR / EDITAR ESTUDANTE --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-fade-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {modoEdicao ? "Atualizar Matrícula ✏️" : "Matricular Novo Estudante 🎓"}
              </h2>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Manuel Langa"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BI */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do BI *</label>
                  <input 
                    type="text" 
                    required
                    maxLength="13"
                    placeholder="Ex: 123456789012A"
                    value={numBi}
                    onChange={(e) => setNumBi(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">12 números + 1 letra.</span>
                </div>

                {/* Curso */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curso Alvo *</label>
                  <select
                    required
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="" disabled>Seleciona o Curso...</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto Telefónico</label>
                  <input 
                    type="text" 
                    placeholder="Ex: +258 84 000 0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Documento de Matrícula */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Documento de Matrícula (Caminho/URL)</label>
                  <input 
                    type="text" 
                    placeholder="doc_matricula_2026.pdf"
                    value={matriculaDoc}
                    onChange={(e) => setMatriculaDoc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                {/* Certificado */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Certificado Escolar (Caminho/URL)</label>
                  <input 
                    type="text" 
                    placeholder="certificado_secundario.pdf"
                    value={certificado}
                    onChange={(e) => setCertificado(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Status da Matrícula */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado da Matrícula</label>
                <select
                  value={statusMatricula}
                  onChange={(e) => setStatusMatricula(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="pre-inscrito">Pré-Inscrito</option>
                  <option value="trancado">Trancado</option>
                  <option value="concluido">Concluído</option>
                  <option value="desistente">Desistente</option>
                </select>
              </div>

              {/* Botoes de Ação */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {salvando ? "A processar..." : "Salvar Estudante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}