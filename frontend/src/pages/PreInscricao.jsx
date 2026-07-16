import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // Ajusta o caminho se necessário
import SystemAlert from "../components/SystemAlert"; // Ajusta o caminho do SystemAlert

export default function PreInscricao() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [carregandoCursos, setCarregandoCursos] = useState(true);
  
  // Alertas e Feedbacks
  const [alerta, setAlerta] = useState(null); // { type, message, description }
  const [errosValidacao, setErrosValidacao] = useState([]); // Array para listar os erros do Joi

  // Estado do formulário
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [numBi, setNumBi] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [classe, setClasse] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  
  const [enviando, setEnviando] = useState(false);
  const [sucessoInscricao, setSucessoInscricao] = useState(null); // Dados do recibo do estudante

  useEffect(() => {
    async function carregarCursos() {
      try {
        const res = await api.get("/cursos");
        // Filtra apenas os cursos ativos
        const cursosAtivos = res.data.filter(c => c.ativo !== false);
        setCursos(cursosAtivos);
        if (cursosAtivos.length > 0) {
          setCursoId(cursosAtivos[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar cursos para pre-inscrição:", err);
        
        // Captura o alerta formatado pelo servidor caso exista no erro da rota
        if (err.response && err.response.data && err.response.data.alert) {
          setAlerta(err.response.data.alert);
        } else {
          setAlerta({
            type: "error",
            message: "Erro ao inicializar formulário",
            description: "Não foi possível carregar os cursos disponíveis. Tenta atualizar a página."
          });
        }
      } finally {
        setCarregandoCursos(false);
      }
    }
    carregarCursos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAlerta(null);
    setErrosValidacao([]);

    // 1. Validação rápida do BI Moçambicano no Frontend (12 dígitos + 1 letra)
    const regexBi = /^[0-9]{12}[A-Za-z]$/;
    if (!regexBi.test(numBi.trim())) {
      setAlerta({
        type: "warning",
        message: "Número de BI Inválido",
        description: "O BI deve conter 12 algarismos e terminar com uma letra (Ex: 123456789012A)."
      });
      setEnviando(false);
      return;
    }

    // 2. Montar payload de acordo com o teu Schema Joi
    const payload = {
      nomeCompleto: nomeCompleto.trim(),
      email: email.trim() || null,
      senha,
      numBi: numBi.trim().toUpperCase(),
      cursoId: parseInt(cursoId, 10),
      classe,
      telefone: telefone.trim() || null,
      dataNascimento: dataNascimento || null
    };

    try {
      const response = await api.post("/usuarios/pre-inscricao", payload);
      
      if (response.data.success) {
        setSucessoInscricao({
          estudante: response.data.estudante,
          usuario: response.data.usuario
        });
      }
    } catch (err) {
      console.error("Erro ao submeter pré-inscrição:", err);
      
      if (err.response && err.response.data) {
        // Se o backend enviou a estrutura com "alert", nós usamo-la diretamente!
        if (err.response.data.alert) {
          setAlerta(err.response.data.alert);
        } else {
          // Fallback caso a resposta do servidor não siga o padrão de alert
          const { mensagem, erros } = err.response.data;
          setAlerta({
            type: "error",
            message: mensagem || "Erro na inscrição",
            description: erros && erros.length > 0 ? "Por favor, corrige os seguintes campos:" : "Ocorreu um problema ao registar."
          });
        }

        // Se o erro for de validação (como Joi), podemos popular os erros adicionais
        if (err.response.data.erros) {
          setErrosValidacao(err.response.data.erros);
        }
      } else {
        // Erro de rede/conexão física com o backend
        setAlerta({
          type: "error",
          message: "Erro de Conexão",
          description: "Não foi possível comunicar com o servidor. Verifica a tua ligação à Internet."
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  // Se a inscrição foi feita com sucesso, mostramos o recibo interativo
  if (sucessoInscricao) {
    const { estudante, usuario } = sucessoInscricao;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-100 p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-slate-900">Pré-Inscrição Concluída! 🎉</h1>
            <p className="text-slate-500 text-sm mt-1">Guarda as informações abaixo para o teu acesso.</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 space-y-3 font-sans">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Nome do Candidato</span>
              <p className="text-slate-800 font-semibold">{estudante.nomeCompleto}</p>
            </div>
            
            <div className="border-t border-slate-200/60 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase block">Código de Utilizador (Matrícula)</span>
              <span className="inline-block mt-1 font-mono text-base font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {estudante.numeroMatricula}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Este será o teu identificador exclusivo para fazer o Login no portal.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Classe Alvo</span>
                <p className="text-slate-800 font-semibold">{estudante.classe}ª Classe</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Contacto</span>
                <p className="text-slate-800 font-semibold">{estudante.telefone || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-left">
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              ⚠️ <strong>Importante:</strong> A tua inscrição está neste momento como <strong>"Pré-Inscrito"</strong>. Para a ativares definitivamente e poderes frequentar as aulas, deverás apresentar o teu BI e o Certificado Escolar na secretaria.
            </p>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-sm"
          >
            Ir para a Tela de Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-8 animate-fade-in">
        
        {/* Banner do Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <h1 className="text-3xl font-black tracking-tight">Ficha de Pré-Inscrição 📝</h1>
          <p className="text-blue-100 text-sm mt-2">
            Inscreve-te de forma simples e rápida no nosso sistema académico.
          </p>
        </div>

        <div className="p-8">
          {/* Renderização do SystemAlert */}
          {alerta && (
            <div className="mb-6">
              <SystemAlert
                type={alerta.type}
                message={alerta.message}
                description={alerta.description}
                onClose={() => setAlerta(null)}
              />
              
              {/* Se o Joi devolveu erros específicos de campos, listamos em baixo */}
              {errosValidacao.length > 0 && (
                <ul className="mt-2 ml-4 list-disc text-xs text-red-600 space-y-1">
                  {errosValidacao.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {carregandoCursos ? (
            <div className="flex flex-col items-center py-10 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-semibold">A carregar cursos e disciplinas...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Informações Básicas */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Insere o teu nome completo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Endereço de E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Palavra-passe do Portal *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo de 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BI */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Número do BI *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="13"
                    placeholder="Ex: 123456789012A"
                    value={numBi}
                    onChange={(e) => setNumBi(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800 uppercase"
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Curso */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Curso Desejado *
                  </label>
                  <select
                    required
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  >
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Classe */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Classe *
                  </label>
                  <select
                    required
                    value={classe}
                    onChange={(e) => setClasse(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  >
                    <option value="" disabled>Seleciona a classe...</option>
                    <option value="7">7ª Classe</option>
                    <option value="10">10ª Classe</option>
                    <option value="12">12ª Classe</option>
                  </select>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Número de Telemóvel
                </label>
                <input
                  type="text"
                  placeholder="Ex: +258 84 123 4567"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-all py-2"
                >
                  ← Voltar ao Login
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-60"
                >
                  {enviando ? "A processar inscrição..." : "Finalizar Pré-Inscrição"}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}