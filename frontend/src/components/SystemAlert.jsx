import React, { useEffect } from 'react';

const alertConfig = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-500',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  error: {
    bg: 'bg-rose-50 border-rose-200 text-rose-800',
    iconColor: 'text-rose-500',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    iconColor: 'text-amber-500',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-500',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
};

/**
 * Componente de Feedback e Alerta do Sistema
 * * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} message - Título ou mensagem curta em destaque.
 * @param {string} description - Descrição detalhada do alerta (opcional).
 * @param {Function} onClose - Função para fechar o alerta manualmente.
 * @param {number} autoCloseDuration - Duração em milissegundos para fechar sozinho (ex: 5000 para 5s).
 */
const SystemAlert = ({ type = 'info', message, description, onClose, autoCloseDuration }) => {
  const config = alertConfig[type] || alertConfig.info;

  useEffect(() => {
    if (autoCloseDuration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDuration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-sm transition-all duration-300 w-full
        ${config.bg}
      `}
      role="alert"
    >
      {/* Ícone Informativo */}
      <svg
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {config.iconPath}
      </svg>

      {/* Textos */}
      <div className="flex-1 text-sm">
        <p className="font-bold leading-snug">{message}</p>
        {description && (
          <p className="mt-1 text-xs opacity-90 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Botão Fechar */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 active:scale-95 focus:outline-none flex-shrink-0 ml-2"
          aria-label="Fechar alerta"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SystemAlert;