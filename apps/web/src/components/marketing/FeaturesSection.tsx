import { LayoutDashboard, QrCode, Radio } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Cardápio digital',
    description:
      'Cada mesa tem um QR único. O cliente acessa o cardápio completo com fotos, preços e descrições — direto no navegador.',
  },
  {
    icon: Radio,
    title: 'Cozinha ao vivo',
    description:
      'Pedidos chegam em tempo real na tela da cozinha, com notificação sonora. A equipe acompanha cada item do preparo ao prato.',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel admin',
    description:
      'Gerencie categorias, produtos e mesas em um só lugar. Atualize o cardápio e gere novos QR codes quando precisar.',
  },
];

export function FeaturesSection() {
  return (
    <section className="border-b border-zinc-100 bg-zinc-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Tudo que seu restaurante precisa
          </h2>
          <p className="mt-3 text-zinc-600">
            Do QR na mesa ao pedido na cozinha — sem impressora, sem fila, sem complicação.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <feature.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
