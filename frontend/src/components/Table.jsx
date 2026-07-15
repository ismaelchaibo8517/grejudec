import React from 'react';

/**
 * Componente de Tabela Responsiva Genérica (Mobile-First)
 * * @param {Array} headers - Definição de colunas. Ex: [{ key: 'nome', label: 'Nome' }, { key: 'codigo', label: 'Código', render: (row) => <b>{row.codigo}</b> }]
 * @param {Array} data - Lista de objetos com os dados das linhas.
 * @param {Function} actions - Função que renderiza ações no final de cada linha. Ex: (row) => <button>Editar</button>
 */
const Table = ({ headers, data, actions }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm block md:table">
        
        {/* Cabeçalho visível apenas em tablets e computadores (md:) */}
        <thead className="hidden bg-slate-50 md:table-header-group">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                scope="col"
                className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider text-xs"
              >
                {header.label}
              </th>
            ))}
            {actions && (
              <th scope="col" className="relative px-6 py-4 text-right font-semibold text-slate-600 text-xs uppercase">
                Ações
              </th>
            )}
          </tr>
        </thead>

        {/* Corpo da Tabela */}
        <tbody className="divide-y divide-slate-100 bg-white block md:table-row-group">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + (actions ? 1 : 0)}
                className="px-6 py-8 text-center text-slate-400 block md:table-cell"
              >
                Nenhum registo encontrado.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="block md:table-row hover:bg-slate-50/50 transition-colors duration-150 p-4 md:p-0 border-b last:border-0 md:border-b-0"
              >
                {headers.map((header) => (
                  <td
                    key={header.key}
                    className="flex justify-between items-center md:table-cell px-2 py-1.5 md:px-6 md:py-4 text-slate-700"
                  >
                    {/* Label exibida apenas em telas pequenas (mobile-first) */}
                    <span className="font-semibold text-slate-500 md:hidden mr-4 text-xs uppercase">
                      {header.label}
                    </span>
                    {/* Conteúdo do dado */}
                    <span className="text-right md:text-left break-words max-w-[60%] md:max-w-none">
                      {header.render ? header.render(row) : row[header.key]}
                    </span>
                  </td>
                ))}

                {/* Bloco de Ações */}
                {actions && (
                  <td className="flex justify-end md:table-cell px-2 py-2 md:px-6 md:py-4 md:text-right border-t border-dashed border-slate-100 md:border-t-0 mt-2 md:mt-0 pt-3 md:pt-4">
                    <div className="flex items-center justify-end gap-2 w-full md:w-auto">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;