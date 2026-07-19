import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; 
import SystemAlert from "../components/SystemAlert"; 

export default function RelatorioPropinasAdmin() {
  const navigate = useNavigate();
  const [relatorio, setRelatorio] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Filtros rápidos: "todos" | "atrasados" | "regularizados"
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // --- ESTADO GLOBAL DE ALERTAS/FEEDBACK ---
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    carregarRelatorio();
  }, []);

  const dispararAlerta = (type, message, description = "") => {
    setAlerta({ type, message, description });
  };

  const carregarRelatorio = async () => {
    try {
      setCarregando(true);
      setAlerta(null);

      // Consome a rota que definiste no teu controlador admin
      const res = await api.get("/pagamentos/propinas");
      
      // Ajusta conforme a estrutura do teu payload (res.data.dados)
      if (res.data && res.data.dados) {
        setRelatorio(res.data.dados);
      } else {
        setRelatorio(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar relatório financeiro:", err);
      dispararAlerta(
        "error",
        "Erro de Conexão",
        "Não foi possível obter o fluxo de propinas. Verifica se o servidor está online."
      );
    } finally {
      setCarregando(false);
    }
  };

  // --- MTRICAS CALCULADAS EM TEMPO REAL ---
  const totalEstudantes = relatorio.length;
  const totalDevedores = relatorio.filter((e) => !e.financeiro?.situacaoRegular).length;
  const totalRegularizados = relatorio.filter((e) => e.financeiro?.situacaoRegular).length;

  // --- FILTRAGEM INTELIGENTE (Busca + Tabs de Estado) ---
  const dadosFiltrados = relatorio.filter((est) => {
    const termo = busca.toLowerCase();
    
    // 1. Filtro da barra de pesquisa (Nome, Matrícula, BI ou Curso)
    const correspondeBusca =
      est.nomeCompleto?.toLowerCase().includes(termo) ||
      est.numeroMatricula?.toLowerCase().includes(termo) ||
      est.numBi?.toLowerCase().includes(termo) ||
      est.curso?.toLowerCase().includes(termo);

    // 2. Filtro dos botões de Estado Financeiro
    if (filtroStatus === "atrasados") {
      return correspondeBusca && !est.financeiro?.situacaoRegular;
    }
    if (filtroStatus === "regularizados") {
      return correspondeBusca && est.financeiro?.situacaoRegular;
    }

    return correspondeBusca;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Auditoria de Propinas 📊
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoriza a saúde financeira da instituição, visualiza meses liquidados e extrai listas de incumprimento.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate("/admin")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm border border-slate-200"
          >
            <span>← Painel Geral</span>
          </button>
          
          <button 
            onClick={carregarRelatorio}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
          >
            <span>🔄 Atualizar Dados</span>
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
            autoCloseDuration={6000}
          />
        </div>
      )}

      {/* --- CARDS DE MÉTRICAS FINANCEIRAS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estudantes Analisados</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">
            {carregando ? "..." : totalEstudantes}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Em Incumprimento (Atraso)</span>
          <h3 className="text-3xl font-black text-red-500 mt-2">
            {carregando ? "..." : totalDevedores}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Situação Regularizada</span>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">
            {carregando ? "..." : totalRegularizados}
          </h3>
        </div>
      </div>

      {/* --- FILTROS, TABS E PESQUISA --- */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        
        {/* Barra de Pesquisa */}
        <div className="relative w-full lg:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Procura por nome, matrícula, BI ou curso..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
          />
        </div>

        {/* Toggles de Estado (Filtro Rápido) */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setFiltroStatus("todos")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
              filtroStatus === "todos"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Todos ({totalEstudantes})
          </button>
          
          <button
            onClick={() => setFiltroStatus("atrasados")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
              filtroStatus === "atrasados"
                ? "bg-red-50 text-red-600 border-red-200 font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ⚠️ Em Atraso ({totalDevedores})
          </button>

          <button
            onClick={() => setFiltroStatus("regularizados")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
              filtroStatus === "regularizados"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            ✅ Regularizados ({totalRegularizados})
          </button>
        </div>
      </div>

      {/* --- CARREGANDO --- */}
      {carregando && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-bold">A cruzar históricos financeiros...</p>
        </div>
      )}

      {/* --- TABELA DE AUDITORIA --- */}
      {!carregando && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Estudante / Curso</th>
                  <th className="py-4 px-6">Dados Pessoais (BI/Tel)</th>
                  <th className="py-4 px-6">Meses Liquidados</th>
                  <th className="py-4 px-6">Meses em Falta</th>
                  <th className="py-4 px-6 text-right">Balanço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {dadosFiltrados.length > 0 ? (
                  dadosFiltrados.map((item) => (
                    <tr key={item.estudanteId} className="hover:bg-slate-50/50 transition-colors align-top">
                      
                      {/* Nome, Matrícula e Curso */}
                      <td className="py-4 px-6 max-w-xs">
                        <div>
                          <span className="font-bold text-slate-900 block truncate">{item.nomeCompleto}</span>
                          <span className="inline-block mt-1 font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Nº {item.numeroMatricula}
                          </span>
                          <span className="block text-xs text-slate-400 mt-1 font-medium">{item.curso}</span>
                        </div>
                      </td>

                      {/* BI e Contacto */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                            🪪 {item.numBi}
                          </span>
                          <span className="text-xs text-slate-500">📞 {item.telefone}</span>
                        </div>
                      </td>

                      {/* Meses Liquidados (Verdes) */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.financeiro?.mesesLiquidados.length > 0 ? (
                            item.financeiro.mesesLiquidados.map((mes) => (
                              <span key={mes} className="text-[10px] font-bold capitalize bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                                {mes.substring(0, 3)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-slate-300">Nenhum mês pago</span>
                          )}
                        </div>
                      </td>

                      {/* Meses em Atraso (Vermelhos) */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.financeiro?.mesesEmAtraso.length > 0 ? (
                            item.financeiro.mesesEmAtraso.map((mes) => (
                              <span key={mes} className="text-[10px] font-bold capitalize bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">
                                {mes.substring(0, 3)}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                              Nenhum
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado do Balanço Financeiro */}
                      <td className="py-4 px-6 text-right">
                        {item.financeiro?.situacaoRegular ? (
                          <span className="inline-block px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Regular
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="inline-block px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase bg-red-50 text-red-600 border border-red-100">
                              Atraso
                            </span>
                            <span className="text-[10px] font-bold text-red-400 mt-1">
                              {item.financeiro?.totalMesesAtrasados} mês(es)
                            </span>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 px-6 text-center text-slate-400">
                      Nenhum registo de propina localizado para os critérios aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}