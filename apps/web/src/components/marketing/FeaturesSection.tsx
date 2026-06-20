import { BarChart3, CreditCard, LayoutDashboard, QrCode, Radio, Smartphone } from 'lucide-react';
import { cn } from '../../lib/cn';
import { glassCard, glassCardHover, glassIconBox, glassShine } from './glass';

const features = [
  {
    icon: QrCode,
    title: 'Cardápio digital',
    description:
      'QR único por mesa. Fotos, preços e descrições — direto no navegador, sem download.',
    span: 'lg:col-span-2',
    accent: 'from-blue-500/20 to-blue-900/10',
  },
  {
    icon: Radio,
    title: 'Cozinha ao vivo',
    description: 'Pedidos em tempo real com notificação sonora. Status item a item.',
    span: '',
    accent: 'from-emerald-500/20 to-emerald-900/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Pro',
    description: 'Relatórios, performance das mesas e saída de produtos em gráficos interativos.',
    span: '',
    accent: 'from-purple-500/20 to-purple-900/10',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos',
    description: 'Pix, cartão e comanda. Integração com Stripe e Mercado Pago.',
    span: '',
    accent: 'from-orange-500/20 to-orange-900/10',
  },
  {
    icon: BarChart3,
    title: 'Financeiro',
    description: 'DRE, despesas, fechamento de caixa e margem por produto.',
    span: 'lg:col-span-2',
    accent: 'from-cyan-500/20 to-cyan-900/10',
  },
  {
    icon: Smartphone,
    title: 'Delivery & WhatsApp',
    description: 'Cardápio de entrega e bot de atendimento quando você precisar escalar.',
    span: '',
    accent: 'from-pink-500/20 to-pink-900/10',
  },
];

export function FeaturesSection() {
  return (
    <section id="recursos" className="relative border-t border-white/[0.06] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-blue-400">
            Recursos
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] text-white">
            Pro por dentro.
            <br />
            <span className="text-white/40">Simples por fora.</span>
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-white/50">
            Do QR na mesa ao relatório financeiro — tudo integrado, sem complicação.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(glassCard, glassCardHover, 'group p-7', feature.span)}
            >
              <div className={glassShine} />
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition group-hover:opacity-100 ${feature.accent}`}
              />
              <div className="relative">
                <div className={cn(glassIconBox, 'mb-5 h-11 w-11')}>
                  <feature.icon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/45">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
