interface MenuLayoutProps {
  children: React.ReactNode;
  categoryNav?: React.ReactNode;
}

export function MenuLayout({ children, categoryNav }: MenuLayoutProps) {
  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-zinc-950 lg:pb-6">
      {categoryNav && (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          {categoryNav}
        </header>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
