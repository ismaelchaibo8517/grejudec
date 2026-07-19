import React, { useState, useEffect } from "react";
import api from "../api/api";
import SystemAlert from "../components/SystemAlert";

export default function PagamentosEstudante() {
  const [alerta, setAlerta] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // 💡 Novos estados para o fluxo de pagamento dinâmico
  const [metodo, setMetodo] = useState("mpesa");
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    carregarPagamentos();
  }, []);

  const carregarPagamentos = async () => {
    try {
      setCarregando(true);
      setAlerta(null);
      const res = await api.get("/estudantes/me/pagamentos");
      setPagamentos(res.data);
    } catch (err) {
      console.error("Erro ao carregar pagamentos:", err);
      setAlerta({
        type: "error",
        message: "Erro de Conexão",
        description: "Não foi possível obter o teu histórico de propinas do servidor.",
      });
    } finally {
      setCarregando(false);
    }
  };

  // 📅 Obter mês e ano correntes (Alinhado com o fuso e lógica do teu backend)
  const mesAtualStr = new Date().toLocaleString("pt-MZ", { month: "long" });
  const anoAtualNum = new Date().getFullYear();

  // 🔍 Verifica se a propina deste mês já está paga na lista carregada
  const propinaDesteMesPaga = pagamentos.some(
    (p) =>
      (p.mesReferencia?.toLowerCase() === mesAtualStr.toLowerCase() || p.mes?.toLowerCase() === mesAtualStr.toLowerCase()) &&
      parseInt(p.anoReferencia || p.ano) === anoAtualNum &&
      p.status === "pago"
  );

  // 💳 Função para disparar a criação do pagamento na PaySuite
  const handleProcessarPagamento = async () => {
    // Puxamos o estudanteId a partir do histórico para evitar queries soltas
    const estudanteId = pagamentos[0]?.estudanteId || pagamentos[0]?.estudante_id;

    if (!estudanteId) {
      setAlerta({
        type: "error",
        message: "Ação Bloqueada",
        description: "Não foi possível mapear o teu ID de estudante. Contacta a administração se o erro persistir.",
      });
      return;
    }

    try {
      setPagando(true);
      setAlerta(null);

      // Dispara o payload exato esperado pelo teu backend atualizado
      const res = await api.post("/pagamentos/gerar", {
        estudanteId: estudanteId,
        method: metodo,
      });

      if (res.data?.checkout_url) {
        setAlerta({
          type: "success",
          message: "Checkout Gerado com Sucesso!",
          description: "A redirecionar de forma segura para o portal de pagamentos...",
        });
        
        // Redireciona o estudante diretamente para o ambiente seguro da PaySuite
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      console.error("Erro ao processar pagamento:", err);
      setAlerta({
        type: "error",
        message: "Falha na Operação",
        description: err.response?.data?.erro || "Ocorreu um erro ao tentar comunicar com a PaySuite.",
      });
    } finally {
      setPagando(false);
    }
  };

  // Métricas calculadas dinamicamente com base no teu banco de dados
  const totalPago = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);

  const pendentesCount = pagamentos.filter((p) => p.status === "pendente").length;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Gestão de Pagamentos 💳
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulta o estado das tuas propinas, faturas emitidas e monitoriza transações em tempo real.
          </p>
        </div>
      </div>

      {/* --- ALERTAS DO SISTEMA --- */}
      {alerta && (
        <div className="transition-all">
          <SystemAlert {...alerta} onClose={() => setAlerta(null)} />
        </div>
      )}

      {/* --- CARDS DE MÉTRICAS FINANCEIRAS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Total Investido (Pago)
          </span>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">
            {carregando ? "..." : `${totalPago.toFixed(2)} MT`}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Transações Pendentes
          </span>
          <h3 className={`text-3xl font-black mt-2 ${pendentesCount > 0 ? "text-amber-500" : "text-slate-800"}`}>
            {carregando ? "..." : pendentesCount}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Estado Financeiro Geral
          </span>
          <div className="flex items-center gap-2 mt-3">
            <span className={`w-2.5 h-2.5 rounded-full ${pendentesCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
            <span className="text-sm font-bold text-slate-700">
              {carregando ? "A verificar..." : pendentesCount > 0 ? "Ações requeridas" : "Situação Regularizada"}
            </span>
          </div>
        </div>
      </div>

      {/* --- 🌟 NOVA SECÇÃO: LIQUIDAÇÃO DA PROPINA ATUAL --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Propina de Referência</h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full capitalize">
                {mesAtualStr} / {anoAtualNum}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {propinaDesteMesPaga 
                ? "Excelente! A tua mensalidade para o mês corrente já se encontra devidamente liquidada."
                : "Ainda não detetámos o pagamento deste mês. Escolhe abaixo o teu método preferido para regularizar."}
            </p>
          </div>

          {propinaDesteMesPaga ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-bold text-sm">
              <span>Mensalidade Regularizada</span>
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {/* Seletor Dinâmico de Métodos */}
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                disabled={pagando || carregando}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="mpesa">🇲🇿 M-Pesa</option>
                <option value="emola">🇲🇿 e-Mola</option>
                <option value="credit_card">💳 Cartão de Crédito</option>
              </select>

              {/* Botão de Ação */}
              <button
                onClick={handleProcessarPagamento}
                disabled={pagando || carregando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-sm px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 border border-transparent whitespace-nowrap"
              >
                {pagando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    <span>A processar...</span>
                  </>
                ) : (
                  <span>Pagar Mensalidade (5.00 MT)</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- SEÇÃO DO HISTÓRICO DE PROPINAS --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900">Histórico de Transações</h2>
          <span className="text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
            PaySuite Integration
          </span>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-bold">A mapear fluxos financeiros...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Descrição / Data</th>
                  <th className="py-4 px-6 text-center">Referência</th>
                  <th className="py-4 px-6 text-center">Valor</th>
                  <th className="py-4 px-6 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {pagamentos.length > 0 ? (
                  pagamentos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {p.descricao || `Mensalidade de ${p.mes}/${p.ano}`}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                            {new Date(p.createdAt || p.created_at).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs text-slate-600 tracking-wider">
                        {p.referencia}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-800">
                        {parseFloat(p.valor || 0).toFixed(2)} MT
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            p.status === "pago"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : p.status === "falhado"
                              ? "text-red-700 bg-red-50 border-red-200"
                              : "text-amber-700 bg-amber-50 border-amber-200 animate-pulse"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 px-6 text-center text-slate-400">
                      Nenhum registo de pagamento associado à tua conta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}