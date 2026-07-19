import React, { useState, useEffect } from "react";
import api from "../api/api";
import SystemAlert from "../components/SystemAlert";

export default function PainelEstudante() {
  const [alerta, setAlerta] = useState(null);
  const [notas, setNotas] = useState([]);
  const [perfil, setPerfil] = useState({
    email: "",
    senhaAtual: "",
    novaSenha: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const mediaGeral = notas.length > 0 
  ? (notas.reduce((acc, n) => acc + (parseFloat(n.MediaFinal?.mediaFinal || 0)), 0) / notas.length).toFixed(1)
  : "0.0";

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setAlerta(null);
      const res = await api.get("/estudantes/me/notas");
      setNotas(res.data);
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
      setAlerta({
        type: "error",
        message: "Erro",
        description: "Não foi possível carregar as tuas notas do servidor.",
      });
    } finally {
      setCarregando(false);
    }
  };

  const atualizarPerfil = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setSalvando(true);

    const payload = {};

    if (perfil.email.trim() !== "") {
      payload.email = perfil.email;
    }

    if (perfil.novaSenha.trim() !== "") {
      if (perfil.senhaAtual.trim() === "") {
        setAlerta({
          type: "error",
          message: "Atenção",
          description:
            "Para alterar a senha, deves introduzir a tua Senha Atual.",
        });
        setSalvando(false);
        return;
      }
      payload.novaSenha = perfil.novaSenha;
      payload.senhaAtual = perfil.senhaAtual;
    }

    if (Object.keys(payload).length === 0) {
      setAlerta({
        type: "info",
        message: "Aviso",
        description:
          "Preenche pelo menos um campo (Email ou Nova Senha) para atualizar.",
      });
      setSalvando(false);
      return;
    }

    try {
      const res = await api.put("/estudantes/me/perfil", payload);
      setAlerta({
        type: "success",
        message: "Sucesso",
        description: res.data.message || "Perfil atualizado com sucesso!",
      });
      setPerfil({ ...perfil, senhaAtual: "", novaSenha: "" });
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      setAlerta({
        type: "error",
        message: "Erro",
        description:
          err.response?.data?.message || "Erro ao atualizar os dados da conta.",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* --- CABEÇALHO DO PAINEL --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Meu Painel 🎓
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Consulta as tuas qualificações académicas e gere os teus dados de
            acesso.
          </p>
        </div>
      </div>

      {/* --- ALERTAS DO SISTEMA --- */}
      {alerta && (
        <div className="transition-all">
          <SystemAlert {...alerta} onClose={() => setAlerta(null)} />
        </div>
      )}

      {/* --- CARDS DE MÉTRICAS / RESUMO --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Disciplinas Inscritas
          </span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">
            {carregando ? "..." : notas.length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Média Geral Provisória
          </span>
          <h3 className="text-3xl font-black text-blue-600 mt-2">
            {carregando
              ? "..."
              : notas.length > 0
                ? (
                    notas.reduce((acc, n) => {
                      const t1 = n.teste1 || 0;
                      const t2 = n.teste2 || 0;
                      const t3 = n.teste3 || 0;
                      return acc + (t1 + t2 + t3) / 3;
                    }, 0) / notas.length
                  ).toFixed(1) + "%"
                : "0.0%"}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Estado da Matrícula
          </span>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">
              Regularizado
            </span>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO DE NOTAS (TABELA) --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Minhas Notas</h2>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-bold">
              A carregar pauta de qualificações...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Disciplina</th>
                  <th className="py-4 px-6 text-center">T1 | T2 | T3</th>
                  <th className="py-4 px-6 text-center">Exame</th>
                  <th className="py-4 px-6 text-right">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {notas.length > 0 ? (
                  notas.map((n) => (
                    <tr
                      key={`${n.disciplina_id}-${n.ano_letivo}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {n.Disciplina?.nome || "Cadeira Geral"}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {`${n.teste1 || 0} | ${n.teste2 || 0} | ${n.teste3 || 0}`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-800">
                        {n.exame !== null ? `${n.exame}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900">
                            {n.MediaFinal?.mediaFinal || "0.00"}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 rounded ${
                              n.MediaFinal?.status === "Aprovado"
                                ? "text-emerald-600 bg-emerald-50"
                                : n.MediaFinal?.status === "Excluído"
                                  ? "text-red-600 bg-red-50"
                                  : "text-amber-600 bg-amber-50"
                            }`}
                          >
                            {n.MediaFinal?.status || "Pendente"}
                          </span>
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
                      Nenhuma nota foi lançada para este estudante até ao
                      momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- SEÇÃO DE SEGURANÇA E CONTA --- */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Segurança e Conta
          </h2>
        </div>

        <form onSubmit={atualizarPerfil} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Novo Endereço de E-mail
            </label>
            <input
              type="email"
              placeholder="Ex: novo.email@estudante.com"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm focus:outline-none placeholder:text-slate-400 text-slate-700"
              value={perfil.email}
              onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Senha Atual *
              </label>
              <input
                type="password"
                placeholder="Introduza a sua senha atual"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm focus:outline-none placeholder:text-slate-400 text-slate-700"
                value={perfil.senhaAtual}
                onChange={(e) =>
                  setPerfil({ ...perfil, senhaAtual: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Nova Senha de Acesso
              </label>
              <input
                type="password"
                placeholder="Introduza a nova senha"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm focus:outline-none placeholder:text-slate-400 text-slate-700"
                value={perfil.novaSenha}
                onChange={(e) =>
                  setPerfil({ ...perfil, novaSenha: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all text-sm disabled:opacity-50"
            >
              {salvando ? "A salvar alterações..." : "Guardar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
