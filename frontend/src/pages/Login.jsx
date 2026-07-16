//C:\Users\administrator\Documents\js\grejudec\frontend\src\pages\Login.jsx
import React, { useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SystemAlert from "../components/SystemAlert"; // O teu componente de alertas

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados dos campos de entrada
  const [numMatricula, setNumMatricula] = useState("");
  const [senha, setSenha] = useState("");
  
  // Estados de controlo da Interface (UI)
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Estados de Erros e Alertas
  const [alerta, setAlerta] = useState(null); // { type: 'error'|'warning'|'success', message, description }
  const [listaErros, setListaErros] = useState([]); // Guarda erros do Joi enviados pelo backend

  // Validação simples de segurança local antes de enviar ao servidor
  const validarCamposLocais = () => {
    if (!numMatricula.trim()) {
      setAlerta({
        type: "warning",
        message: "Aviso de Validação",
        description: "O Número de Matrícula é obrigatório.",
      });
      return false;
    }

    if (!senha) {
      setAlerta({
        type: "warning",
        message: "Aviso de Validação",
        description: "A palavra-passe é obrigatória.",
      });
      return false;
    }

    return true;
  };

  const handleSubmeter = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setListaErros([]); // Limpa erros do Joi de tentativas anteriores

    if (!validarCamposLocais()) return;

    setCarregando(true);

    try {
      // Envia os dados para o AuthContext
      await login(numMatricula, senha);
      
      setAlerta({
        type: "success",
        message: "Acesso Autorizado",
        description: "Login efetuado com sucesso! A entrar no sistema...",
      });

      // Redireciona de forma assíncrona e segura após 1.2 segundos
      setTimeout(() => {
        startTransition(() => {
          navigate("/dashboard");
        });
      }, 1200);

  } catch (erro) {
  // Log para ver o que está a chegar no console do navegador
  console.log("Erro capturado:", erro);

  // Verifica se o servidor respondeu algo
  if (erro.response && erro.response.data) {
    // Aqui capturamos o objeto JSON que vês na aba 'Preview' da imagem
    const respostaDoServidor = erro.response.data;
    
    if (respostaDoServidor.alert) {
      setAlerta(respostaDoServidor.alert);
    } else {
      // Caso o servidor responda mas não esteja no formato 'alert'
      setAlerta({
        type: "error",
        message: "Erro no Servidor",
        description: respostaDoServidor.message || "Erro desconhecido."
      });
    }
  } else {
    // Só entra aqui se o servidor não respondeu nada (Ex: servidor off)
    setAlerta({
      type: "error",
      message: "Erro de Conexão",
      description: "Não foi possível comunicar com o servidor."
    });
  }
  
  setCarregando(false);
}
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-md border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto rounded-full border-2 border-blue-100 shadow-sm object-cover"
            src="/logo.jpeg"
            alt="GREJUDEC Logo"
          />
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            GREJUDEC
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Entra com o teu Número de Matrícula e senha
          </p>
        </div>

        {/* Alerta de Feedback Principal */}
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
            
            {/* Lista com erros detalhados retornados pelo Joi no Backend */}
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

        {/* Formulário de Login */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmeter} noValidate>
          <div className="space-y-4">
            
            {/* Campo: Número de Matrícula */}
            <div>
              <label htmlFor="matricula" className="block text-sm font-medium text-slate-700 mb-1">
                Número de Matrícula
              </label>
              <input
                id="matricula"
                name="matricula"
                type="text"
                required
                disabled={carregando}
                value={numMatricula}
                onChange={(e) => setNumMatricula(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-sm transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Ex: MAT-2026-897"
              />
            </div>

            {/* Campo: Palavra-passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  disabled={carregando}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 pl-4 pr-10 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none text-sm transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="******"
                />
                
                {/* Mostrar/Ocultar Senha */}
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Ligação Encriptada
            </span>
            <span className="cursor-help hover:text-slate-700 transition-colors">
              Problemas ao entrar?
            </span>
          </div>

          {/* Botão para submeter o formulário */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={carregando}
              className={`
                group relative flex w-full justify-center rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-98
                ${carregando 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
                }
              `}
            >
              {carregando ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  A verificar credenciais...
                </div>
              ) : (
                "Autenticar-se"
              )}
            </button>

            {/* Divisor Visual */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs">Ou</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Botão de Pré-Inscrição */}
            <button
              type="button"
              disabled={carregando}
              onClick={() => {
                startTransition(() => {
                  navigate("/pre-inscricao");
                });
              }}
              className="flex w-full justify-center rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fazer Pré-Inscrição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}