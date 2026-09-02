import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sort?: string;
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
  onSortChange?: (sortField: string) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  total,
  page,
  limit,
  totalPages,
  sort,
  order = 'desc',
  onSortChange,
  onPageChange,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const currentOrder = order.toLowerCase();

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="overflow-x-auto rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-indigo-500/5">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/70 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 select-none ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''
                  }`}
                  onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                >
                  <div className="inline-flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[10px] text-slate-400">
                        {sort === col.key ? (
                          currentOrder === 'asc' ? '▲' : '▼'
                        ) : (
                          '⇅'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400">
                  <div className="inline-flex items-center space-x-2">
                    <svg
                      className="h-5 w-5 animate-spin text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-indigo-50/40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
