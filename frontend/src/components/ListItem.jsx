import React from 'react';

// Função auxiliar para atribuir classes de cor às badges de estado de forma segura
const getStatusBadgeStyles = (status) => {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s.includes('ativ') || s.includes('concl') || s.includes('pago') || s.includes('sucesso')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (s.includes('pend') || s.includes('process') || s.includes('analis')) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (s.includes('inativ') || s.includes('canc') || s.includes('falh') || s.includes('erro')) {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  return 'bg-slate-50 text-slate-700 border-slate-150';
};

/**
 * Componente de Item de Lista (Compacto e Touch-Friendly)
 * * @param {React.ReactNode} icon - Ícone a ser renderizado na esquerda.
 * @param {string} title - Título principal do item.
 * @param {string} subtitle - Descrição ou informação secundária.
 * @param {string} status - Estado (opcional: exibe uma badge colorida).
 * @param {React.ReactNode} rightElement - Elemento personalizado na direita (ex: valor monetário ou botão).
 * @param {Function} onClick - Ação executada ao clicar no item (torna o item clicável).
 */
const ListItem = ({ icon, title, subtitle, status, rightElement, onClick }) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        flex items-center justify-between p-4 rounded-xl border border-slate-150 bg-white
        transition-all duration-200 select-none
        ${isClickable ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.985]' : ''}
      `}
    >
      {/* Seção Esquerda: Ícone + Textos */}
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-50 text-slate-500 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm truncate leading-snug">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Seção Direita: Status / Elemento Personalizado / Seta */}
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        {status && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeStyles(status)}`}>
            {status}
          </span>
        )}
        
        {rightElement ? (
          rightElement
        ) : (
          isClickable && (
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )
        )}
      </div>
    </div>
  );
};

export default ListItem;