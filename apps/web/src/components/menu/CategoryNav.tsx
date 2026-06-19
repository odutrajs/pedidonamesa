import { cn } from '../../lib/cn';

interface CategoryNavProps {
  categories: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: CategoryNavProps) {
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((category) => {
          const isActive = activeId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                'relative shrink-0 px-4 py-3.5 text-sm font-semibold transition',
                isActive ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {category.name}
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
