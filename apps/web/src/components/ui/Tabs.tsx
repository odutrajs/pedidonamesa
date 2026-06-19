import { cn } from '../../lib/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-zinc-200', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
