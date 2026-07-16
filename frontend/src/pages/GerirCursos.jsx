import React, { useState, useEffect } from "react";
import api from "../api/api"; // Certifica-te de que o caminho para o teu axios está correto
import SystemAlert from "../components/SystemAlert"; // Importação do teu componente de alertas

export default function GerirCursos() {
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");

  // --- ESTADOS DOS MODAIS ---
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState(null);

  // Campos do Formulário
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [duracao, setDuracao] = useState("meses_3"); // Valor padrão correspondente ao default do Joi
  const [salvando, setSalvando] = useState(false);

  // --- ESTADOS DE ERROS E ALERTAS DO SISTEMA ---
  const [alerta, setAlerta] = useState(null); // { type: 'success'|'error'|'warning'|'info', message, description }
  const [listaErros, setListaErros] = useState([]); // Guarda erros detalhados de validação (ex: Joi do backend)

  // Procurar os cursos da API ao montar o componente
  useEffect(() => {
    obterCursos();
  }, []);

  const obterCursos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resposta = await api.get("/cursos");
      setCursos(resposta.data);
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
      setErro("Não foi possível obter a lista de cursos do servidor.");
    } finally {
      setCarregando(false);
    }
  };

  // Filtro local por Nome do Curso ou Código (ex: "INFO", "AGRO")
  const cursosFiltrados = cursos.filter((curso) => {
    const nomeCorresponde = curso.nome?.toLowerCase().includes(busca.toLowerCase());
    const codigoCorresponde = curso.codigo?.toLowerCase().includes(busca.toLowerCase());
    return nomeCorresponde || codigoCorresponde;
  });

  // --- MANIPULAÇÃO DO FORMULÁRIO ---

  const abrirModalCriar = () => {
    setAlerta(null);
    setListaErros([]);
    setModoEdicao(false);
    setCursoSelecionadoId(null);
    setNome("");
    setCodigo("");
    setDuracao("meses_3");
    setModalAberto(true);
  };

  const abrirModalEditar = (curso) => {
    setAlerta(null);
    setListaErros([]);
    setModoEdicao(true);
    setCursoSelecionadoId(curso.id);
    setNome(curso.nome || "");
    setCodigo(curso.codigo || "");
    setDuracao(curso.duracao || "meses_3");
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setAlerta(null);
    setListaErros([]);

    // O backend higieniza o código para maiúsculas, mas fazemos aqui também para manter o padrão visual no submit
    const payload = {
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      duracao
    };

    try {
      if (modoEdicao) {
        // Rota de Atualização (PUT /api/cursos/:id)
        await api.put(`/cursos/${cursoSelecionadoId}`, payload);
        setAlerta({
          type: "success",
          message: "Curso Atualizado",
          description: "O curso foi atualizado com sucesso no sistema!"
        });
      } else {
        // Rota de Criação (POST /api/cursos)
        await api.post("/cursos", payload);
        setAlerta({
          type: "success",
          message: "Curso Cadastrado",
          description: "O curso foi registado com sucesso!"
        });
      }

      setModalAberto(false);
      obterCursos(); // Recarrega a tabela com a lista atualizada
    } catch (err) {
      console.error("Erro ao salvar curso:", err);
      const mensagemErro = err.response?.data?.message || "Ocorreu um erro ao salvar o curso.";
      
      setAlerta({
        type: err.response?.status === 400 ? "warning" : "error",
        message: "Erro ao Salvar",
        description: mensagemErro
      });

      // Se houver erros do Joi ou detalhados retornados do backend
      if (err.response?.data?.erros && err.response.data.erros.length > 0) {
        setListaErros(err.response.data.erros);
      }
    } finally {
      setSalvando(false);
    }
  };

  const lidarComEliminar = async (id, nomeCurso) => {
    if (window.confirm(`Tens a certeza de que desejas remover o curso "${nomeCurso}"?`)) {
      setAlerta(null);
      setListaErros([]);

      try {
        // Rota de Eliminação Física/Lógica (DELETE /api/cursos/:id)
        await api.delete(`/cursos/${id}`);
        setAlerta({
          type: "success",
          message: "Remoção Concluída",
          description: `O curso "${nomeCurso}" foi removido com sucesso.`
        });
        obterCursos(); // Atualiza a lista
      } catch (err) {
        console.error("Erro ao eliminar curso:", err);
        const mensagemErro = err.response?.data?.message || "Não foi possível remover o curso.";
        
        setAlerta({
          type: "error",
          message: "Erro na Remoção",
          description: mensagemErro
        });

        if (err.response?.data?.erros && err.response.data.erros.length > 0) {
          setListaErros(err.response.data.erros);
        }
      }
    }
  };

  // Auxiliar para legibilidade das durações vindas da API
  const formatarDuracao = (tipoDuracao) => {
    return tipoDuracao === "meses_6" ? "6 Meses (Semestral)" : "3 Meses (Trimestral)";
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* --- CABEÇALHO DO PAINEL --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Gestão de Cursos 🎓
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gere a lista de cursos oferecidos, define as suas durações e códigos de acesso rápidos.
          </p>
        </div>
        
        <button 
          onClick={abrirModalCriar}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all text-sm"
        >
          <span>+ Adicionar Curso</span>
        </button>
      </div>

      {/* --- ALERTA DE FEEDBACK DA PÁGINA (Apenas quando o modal está fechado) --- */}
      {!modalAberto && alerta && (
        <div className="transition-all duration-300 transform scale-100 space-y-2">
          <SystemAlert
            type={alerta.type}
            message={alerta.message}
            description={alerta.description}
            autoCloseDuration={5000} // Fecha sozinho após 5 segundos
            onClose={() => {
              setAlerta(null);
              setListaErros([]);
            }}
          />
          
          {listaErros.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1">
              <p className="font-semibold">Erros detetados pelo sistema:</p>
              <ul className="list-disc pl-4 space-y-1">
                {listaErros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* --- CARDS DE MÉTRICAS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total de Cursos</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">
            {carregando ? "..." : cursos.length}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cursos de Curta Duração</span>
          <h3 className="text-3xl font-black text-blue-600 mt-2">
            {carregando ? "..." : cursos.filter(c => c.duracao === "meses_3").length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status das Ofertas</span>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">Inscrições Prontas</span>
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
            placeholder="Procurar por nome do curso ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
        
        <span className="text-xs font-bold text-slate-400 uppercase">
          {cursosFiltrados.length} encontrados
        </span>
      </div>

      {/* --- ESTADOS DA REQUISIÇÃO (Loading, Erro) --- */}
      {carregando && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-bold">A carregar os cursos...</p>
        </div>
      )}

      {erro && (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center">
          <span className="text-2xl block mb-2">⚠️</span>
          <p className="font-bold text-sm">{erro}</p>
        </div>
      )}

      {/* --- LISTA/TABELA DE CURSOS --- */}
      {!carregando && !erro && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Identificação do Curso</th>
                  <th className="py-4 px-6">Código Identificador</th>
                  <th className="py-4 px-6">Duração Académica</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {cursosFiltrados.length > 0 ? (
                  cursosFiltrados.map((curso) => (
                    <tr key={curso.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nome do Curso */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600">
                            📖
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{curso.nome}</span>
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Ativo no portfólio
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Código de Identificação */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                          {curso.codigo}
                        </span>
                      </td>

                      {/* Duração */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          curso.duracao === "meses_6" 
                            ? "bg-purple-50 text-purple-700 border border-purple-100" 
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {formatarDuracao(curso.duracao)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalEditar(curso)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar curso"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => lidarComEliminar(curso.id, curso.nome)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover curso"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 px-6 text-center text-slate-400">
                      Nenhum curso corresponde aos critérios de pesquisa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL DE CRIAR / EDITAR CURSO --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {modoEdicao ? "Editar Informações do Curso ✏️" : "Criar Novo Curso 🎓"}
              </h2>
              <button 
                onClick={() => {
                  setModalAberto(false);
                  setAlerta(null);
                  setListaErros([]);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Alerta de Feedback dentro do Formulário do Modal */}
              {alerta && (
                <div className="transition-all duration-300 transform scale-100 space-y-2">
                  <SystemAlert
                    type={alerta.type}
                    message={alerta.message}
                    description={alerta.description}
                    onClose={() => {
                      setAlerta(null);
                      setListaErros([]);
                    }}
                  />
                  
                  {listaErros.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1">
                      <p className="font-semibold">Erros detetados pelo sistema:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {listaErros.map((erro, index) => (
                          <li key={index}>{erro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Nome do Curso */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Curso *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Introdução à Informática"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              {/* Código Identificador */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código Identificador (Sigla) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: INFO101, AGRO"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  disabled={modoEdicao} // Segurança: Boas práticas sugerem não mudar códigos únicos após criação
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!modoEdicao && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Apenas letras e números (de 2 a 10 caracteres). Será convertido para maiúsculas.
                  </p>
                )}
              </div>

              {/* Duração do Curso */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duração Programática *</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Opção 3 meses */}
                  <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${
                    duracao === "meses_3" 
                      ? "border-blue-500 bg-blue-50/40 text-blue-900" 
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <input 
                        type="radio" 
                        name="duracao" 
                        value="meses_3" 
                        checked={duracao === "meses_3"}
                        onChange={() => setDuracao("meses_3")}
                        className="text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-xs font-bold">3 Meses</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Regime Trimestral</span>
                  </label>

                  {/* Opção 6 meses */}
                  <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${
                    duracao === "meses_6" 
                      ? "border-blue-500 bg-blue-50/40 text-blue-900" 
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <input 
                        type="radio" 
                        name="duracao" 
                        value="meses_6" 
                        checked={duracao === "meses_6"}
                        onChange={() => setDuracao("meses_6")}
                        className="text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-xs font-bold">6 Meses</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Regime Semestral</span>
                  </label>
                </div>
              </div>

              {/* Ações do Formulário */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setAlerta(null);
                    setListaErros([]);
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {salvando ? "A salvar..." : "Confirmar Curso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}