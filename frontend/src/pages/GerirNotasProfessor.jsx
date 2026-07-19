import React, { useState, useEffect } from "react";
import api from "../api/api";
import SystemAlert from "../components/SystemAlert"; // Ajusta o caminho conforme o teu projeto

export default function GerirNotasProfessor() {
  // Estados Gerais
  const [alerta, setAlerta] = useState(null);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(true);
  const [carregandoTurma, setCarregandoTurma] = useState(false);

  // Estados de Dados
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [alunos, setAlunos] = useState([]);

  // Estados de Notas
  const [notasIniciais, setNotasIniciais] = useState({}); // Notas que vêm da base de dados
  const [notasForm, setNotasForm] = useState({}); // Notas que estão a ser editadas na tabela

  // 1. Carregar as disciplinas atribuídas ao professor logado
  useEffect(() => {
    async function carregarDisciplinas() {
      try {
        const res = await api.get("professores/me/disciplinas");
        setDisciplinas(res.data);
      } catch (err) {
        tratarErro(
          err,
          "Erro ao carregar as suas disciplinas. Tente novamente.",
        );
      } finally {
        setCarregandoDisciplinas(false);
      }
    }
    carregarDisciplinas();
  }, []);

  // 2. Carregar alunos e as suas avaliações quando uma disciplina é selecionada
  useEffect(() => {
    if (!disciplinaSelecionada) {
      setAlunos([]);
      setNotasIniciais({});
      setNotasForm({});
      return;
    }

    async function buscarDadosDaTurma() {
      setCarregandoTurma(true);
      setAlerta(null);

      try {
        // Busca os alunos (filtrados pelo curso da disciplina selecionada)
        const resAlunos = await api.get(
          `/estudantes?disciplinaId=${disciplinaSelecionada}`,
        );

        // Busca as notas já lançadas para esta disciplina
        const resNotas = await api.get(
          `/avaliacoes?disciplinaId=${disciplinaSelecionada}`,
        );

        setAlunos(resAlunos.data);

        // Organizar as notas por estudanteId para facilitar a renderização na tabela
        const mapaDeNotas = {};
        resNotas.data.forEach((aval) => {
          mapaDeNotas[aval.estudante_id] = {
            id: aval.id,
            teste1: aval.teste1 !== null ? aval.teste1 : "",
            teste2: aval.teste2 !== null ? aval.teste2 : "",
            teste3: aval.teste3 !== null ? aval.teste3 : "",
            exame: aval.exame !== null ? aval.exame : "",
            recorrencia: aval.recorrencia !== null ? aval.recorrencia : "",
            // NOVO: Capturar a média e o status que vêm do GET
            mediaFrequencia: aval.mediaFrequencia !== null ? aval.mediaFrequencia : "",
            status: aval.status !== null ? aval.status : ""
          };
        });

        setNotasIniciais(mapaDeNotas);
        setNotasForm(mapaDeNotas);
      } catch (err) {
        tratarErro(err, "Erro ao carregar a turma e as pautas.");
      } finally {
        setCarregandoTurma(false);
      }
    }

    buscarDadosDaTurma();
  }, [disciplinaSelecionada]);

  // Função para lidar com a digitação nos inputs de nota
  const handleNotaChange = (estudanteId, campo, valor) => {
    setNotasForm((prev) => ({
      ...prev,
      [estudanteId]: {
        ...prev[estudanteId],
        [campo]: valor,
      },
    }));
  };

  const salvarNotasAluno = async (estudanteId) => {
    setAlerta(null);
    const dados = notasForm[estudanteId] || {};
    
    // Payload pronto para o controlador criarAvaliacao
    const payload = {
      estudanteId: parseInt(estudanteId, 10),
      disciplinaId: parseInt(disciplinaSelecionada, 10),
      anoLetivo: new Date().getFullYear(),
      teste1: dados.teste1 !== "" && dados.teste1 !== null && dados.teste1 !== undefined && !isNaN(parseFloat(dados.teste1)) ? parseFloat(dados.teste1) : null,
      teste2: dados.teste2 !== "" && dados.teste2 !== null && dados.teste2 !== undefined && !isNaN(parseFloat(dados.teste2)) ? parseFloat(dados.teste2) : null,
      teste3: dados.teste3 !== "" && dados.teste3 !== null && dados.teste3 !== undefined && !isNaN(parseFloat(dados.teste3)) ? parseFloat(dados.teste3) : null,
      exame: dados.exame !== "" && dados.exame !== null && dados.exame !== undefined && !isNaN(parseFloat(dados.exame)) ? parseFloat(dados.exame) : null,
      recorrencia: dados.recorrencia !== "" && dados.recorrencia !== null && dados.recorrencia !== undefined && !isNaN(parseFloat(dados.recorrencia)) ? parseFloat(dados.recorrencia) : null,
    };

    try {
      const response = await api.post("/avaliacoes", payload);
      
      // NOVO: Fazer um GET rápido apenas para este estudante para descobrir o novo Status e Média calculados pelo backend
      const resNotasAtualizadas = await api.get(
        `/avaliacoes?disciplinaId=${disciplinaSelecionada}&estudanteId=${estudanteId}`
      );

      let novaAvaliacao = { ...notasForm[estudanteId] };

      if (resNotasAtualizadas.data && resNotasAtualizadas.data.length > 0) {
        const avalBackend = resNotasAtualizadas.data[0];
        novaAvaliacao = {
          id: avalBackend.id,
          teste1: avalBackend.teste1 !== null ? avalBackend.teste1 : "",
          teste2: avalBackend.teste2 !== null ? avalBackend.teste2 : "",
          teste3: avalBackend.teste3 !== null ? avalBackend.teste3 : "",
          exame: avalBackend.exame !== null ? avalBackend.exame : "",
          recorrencia: avalBackend.recorrencia !== null ? avalBackend.recorrencia : "",
          mediaFrequencia: avalBackend.mediaFrequencia !== null ? avalBackend.mediaFrequencia : "",
          status: avalBackend.status !== null ? avalBackend.status : ""
        };
      }

      // Atualiza o estado inicial com os dados frescos vindos do backend (incluindo status)
      setNotasIniciais((prev) => ({
        ...prev,
        [estudanteId]: novaAvaliacao
      }));

      // Garante que o form também tem a versão mais recente
      setNotasForm((prev) => ({
        ...prev,
        [estudanteId]: novaAvaliacao
      }));

      // Exibir o alerta de sucesso que vem do backend
      if (response.data && response.data.alert) {
        setAlerta(response.data.alert);
      }

    } catch (err) {
      tratarErro(err, "Erro ao gravar as notas.");
    }
  };

  // Função centralizada para extrair erros da API
  const tratarErro = (err, mensagemFallback) => {
    const mensagemJoi = err.response?.data?.message || err.response?.data?.error;

    if (err.response && err.response.data && err.response.data.alert) {
      setAlerta(err.response.data.alert);
    } else if (mensagemJoi) {
      // Imprime especificamente a mensagem validada pelo Joi no backend
      setAlerta({
        type: "error",
        message: "Erro de Validação",
        description: mensagemJoi,
      });
    } else {
      setAlerta({
        type: "error",
        message: "Erro de Comunicação",
        description: mensagemFallback,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Portal do Professor 🎓
        </h1>
        <p className="text-slate-500 mt-1">
          Gere as pautas e avaliações das tuas disciplinas atribuídas.
        </p>
      </div>

      {alerta && (
        <div className="mb-6">
          <SystemAlert
            type={alerta.type}
            message={alerta.message}
            description={alerta.description}
            onClose={() => setAlerta(null)}
          />
        </div>
      )}

      {/* Cartão de Seleção de Disciplina */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
          Selecione a Disciplina
        </label>
        {carregandoDisciplinas ? (
          <div className="flex items-center space-x-3 text-slate-500 text-sm">
            <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <span>A carregar as suas disciplinas...</span>
          </div>
        ) : (
          <select
            className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            value={disciplinaSelecionada}
            onChange={(e) => setDisciplinaSelecionada(e.target.value)}
            disabled={carregandoTurma}
          >
            <option value="">
              -- Escolha uma disciplina para lançar notas --
            </option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}{" "}
                {/* Podes adicionar d.classe ou d.ano se tiveres no modelo */}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabela de Lançamento de Notas */}
      {disciplinaSelecionada && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Pauta da Turma</h2>
            {carregandoTurma && (
              <span className="text-xs text-blue-600 font-semibold animate-pulse">
                A atualizar turma...
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-bold">Nº Matrícula</th>
                  <th className="p-4 font-bold">Nome do Estudante</th>
                  <th className="p-4 font-bold text-center w-24">Teste 1</th>
                  <th className="p-4 font-bold text-center w-24">Teste 2</th>
                  <th className="p-4 font-bold text-center w-24">Teste 3</th>
                  <th className="p-4 font-bold text-center w-24">Exame</th>
                  <th className="p-4 font-bold text-center w-24">
                    Recorrência
                  </th>
                  {/* NOVO: Cabeçalhos para Média e Status */}
                  <th className="p-4 font-bold text-center w-24">Média Freq.</th>
                  <th className="p-4 font-bold text-center w-28">Status</th>
                  <th className="p-4 font-bold text-center w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(!alunos || alunos.length === 0) && !carregandoTurma && (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      Não existem estudantes registados para o curso desta
                      disciplina.
                    </td>
                  </tr>
                )}

                {alunos.map((aluno) => {
                  const notas = notasForm[aluno.id] || {};
                  const notasOriginais = notasIniciais[aluno.id] || {};

                  // Deteta se o utilizador alterou alguma nota comparando o estado atual com o inicial
                  const foiAlterado =
                    JSON.stringify(notas) !== JSON.stringify(notasOriginais);

                  return (
                    <tr
                      key={aluno.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {aluno.numeroMatricula}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {aluno.nomeCompleto}
                      </td>

                      {/* Inputs Dinâmicos */}
                      {[
                        "teste1",
                        "teste2",
                        "teste3",
                        "exame",
                        "recorrencia",
                      ].map((campo) => (
                        <td key={campo} className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            placeholder="-"
                            className={`w-16 px-2 py-1.5 border rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${foiAlterado && notasOriginais[campo] !== notas[campo] ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-700"}`}
                            value={
                              notas[campo] !== undefined ? notas[campo] : ""
                            }
                            onChange={(e) =>
                              handleNotaChange(aluno.id, campo, e.target.value)
                            }
                            onBlur={() => {
                              // Só salva se houver alteração real, evitando chamadas desnecessárias à API
                              if (foiAlterado) {
                                salvarNotasAluno(aluno.id);
                              }
                            }}
                          />
                        </td>
                      ))}

                      {/* NOVO: Exibição da Média de Frequência */}
                      <td className="p-4 text-center font-bold text-slate-700">
                        {notasOriginais.mediaFrequencia || "-"}
                      </td>

                      {/* NOVO: Exibição do Status com cores dinâmicas */}
                      <td className="p-4 text-center">
                        {notasOriginais.status ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide ${
                            notasOriginais.status === 'Aprovado' || notasOriginais.status === 'Admitido' 
                              ? 'bg-green-100 text-green-700' 
                              : notasOriginais.status === 'Reprovado' || notasOriginais.status === 'Excluído'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {notasOriginais.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => salvarNotasAluno(aluno.id)}
                          disabled={!foiAlterado}
                          className={`w-full px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            foiAlterado
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          {foiAlterado ? "Guardar" : "Salvo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}