
//C:\Users\administrator\Documents\js\grejudec\frontend\src\context\AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Valida a sessão ativa via Cookie ao carregar o site (F5)
  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const resposta = await api.get("/usuarios/me");
        setUsuario(resposta.data.usuario || resposta.data);
      } catch (erro) {
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    };

    verificarSessao();
  }, []);

  // Função de Login atualizada para aceitar o Número de Matrícula
  const login = async (numMatricula, senha) => {
    setCarregando(true);
    try {
      // Enviamos a chave exatamente como o backend espera: NumMatricula (Maiúsculo)
      const resposta = await api.post("/usuarios/login", { 
        NumMatricula: numMatricula, 
        senha 
      });
      
      const dadosUsuario = resposta.data.usuario;
      setUsuario(dadosUsuario);
      return dadosUsuario;
    } catch (erro) {
      setUsuario(null);
      throw erro; // Propaga o erro formatado pelo api.js
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/usuarios/logout");
    } catch (erro) {
      console.error("Erro ao destruir a sessão no servidor:", erro);
    } finally {
      setUsuario(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return contexto;
}