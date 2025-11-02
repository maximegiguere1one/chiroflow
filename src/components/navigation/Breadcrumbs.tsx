import { ChevronRight, Home } from 'lucide-react';
import { router } from '../../lib/router';

interface BreadcrumbsProps {
  items: Array<{ name: string; path: string }>;
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center space-x-2 text-sm overflow-x-auto max-w-full ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.path} className="flex items-center flex-shrink-0">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-neutral-400 mx-2 flex-shrink-0" />
            )}

            {isLast ? (
              <span className="text-neutral-900 font-medium truncate max-w-xs" aria-current="page">
                {isFirst && <Home className="w-4 h-4 inline mr-1 flex-shrink-0" />}
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => router.navigate(item.path)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center truncate max-w-xs"
              >
                {isFirst && <Home className="w-4 h-4 mr-1 flex-shrink-0" />}
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
