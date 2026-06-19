import { cn } from '../../lib/cn';

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

interface Tab {
  id: string;
  label: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-zinc-200 dark:border-zinc-800', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:border-brand-500 dark:text-brand-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
