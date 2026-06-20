import { ChefHat, HandPlatter, QrCode, Smartphone } from 'lucide-react';
import { cn } from '../../lib/cn';
import { glassCard, glassCardHover, glassIconBox, glassShine } from './glass';

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
    <section id="como-funciona" className="relative border-t border-white/[0.06] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,113,227,0.06)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-blue-400">
            Fluxo
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] text-white">
            Quatro passos.
            <br />
            <span className="text-white/40">Zero fricção.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <div key={item.step} className={cn(glassCard, glassCardHover, 'group p-7')}>
              <div className={glassShine} />
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden h-px w-6 bg-gradient-to-r from-white/20 to-transparent lg:block" />
              )}
              <div className="relative">
                <p className="text-[11px] font-medium tracking-[0.15em] text-blue-400/80">
                  PASSO {item.step}
                </p>
                <div
                  className={cn(
                    glassIconBox,
                    'mt-5 mb-5 h-12 w-12 transition group-hover:border-white/25',
                  )}
                >
                  <item.icon className="h-5 w-5 text-white/70" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/45">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
