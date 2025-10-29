import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from './Input';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  cell?: (value: any, row: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucune donnée disponible',
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;

    const accessor = typeof column.accessor === 'function' ? null : column.accessor;
    if (!accessor) return;

    if (sortColumn === accessor) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(accessor);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchable && searchQuery) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection, searchable]);

  const getCellValue = (row: T, column: DataTableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }

    const value = row[column.accessor];

    if (column.cell) {
      return column.cell(value, row);
    }

    return value;
  };

  return (
    <div className={className}>
      {searchable && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search />}
          />
        </div>
      )}

      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-4 py-3 text-left text-sm font-semibold text-neutral-900
                    ${column.sortable ? 'cursor-pointer hover:bg-neutral-100 select-none' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortColumn === column.accessor ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-primary-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary-600" />
                          )
                        ) : (
                          <div className="flex flex-col text-neutral-300">
                            <ChevronUp className="w-3 h-3 -mb-1" />
                            <ChevronDown className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    border-b border-neutral-100 last:border-0
                    ${onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
                    transition-colors
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-neutral-700">
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {searchable && filteredAndSortedData.length > 0 && (
        <div className="mt-3 text-sm text-neutral-600">
          {filteredAndSortedData.length} résultat{filteredAndSortedData.length > 1 ? 's' : ''}
          {searchQuery && ` pour "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}
