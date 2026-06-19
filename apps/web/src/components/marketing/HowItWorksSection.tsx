import { ChefHat, HandPlatter, QrCode, Smartphone } from 'lucide-react';

const steps = [
  {
    icon: QrCode,
    step: '01',
    title: 'Cliente escaneia',
    description: 'QR Code na mesa abre o cardápio digital instantaneamente.',
  },
  {
    icon: Smartphone,
    step: '02',
    title: 'Monta o pedido',
    description: 'Escolhe itens, adiciona observações e envia — tudo pelo celular.',
  },
  {
    icon: ChefHat,
    step: '03',
    title: 'Cozinha prepara',
    description: 'Pedido aparece em tempo real com som. Status atualizado item a item.',
  },
  {
    icon: HandPlatter,
    step: '04',
    title: 'Garçom entrega',
    description: 'Quando pronto, a equipe leva à mesa. Sem erro, sem papel.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-b border-zinc-100 py-16 dark:border-zinc-800 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Como funciona
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Quatro passos do pedido à entrega — simples para todos.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <item.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <p className="text-xs font-medium text-brand-600 dark:text-brand-400">{item.step}</p>
              <h3 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
