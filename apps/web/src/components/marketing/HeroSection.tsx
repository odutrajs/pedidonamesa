import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import { glassCard, glassShine } from './glass';
import { HeroLeadForm } from './HeroLeadForm';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,113,227,0.15)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-12 md:px-8 md:pt-20 lg:pb-16">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-4 py-1.5 text-[12px] font-medium text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Pro. Simples. Instantâneo.
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
              Pedidos na mesa.
              <br />
              <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                Sem fila. Sem app.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-white/55 lg:mx-0 lg:max-w-lg">
              Seu cliente escaneia o QR, monta o pedido no celular e a cozinha recebe em tempo real.
              A experiência que seu restaurante merece.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-7 py-3 text-[15px] font-medium text-white transition hover:bg-[#0077ed] active:scale-[0.98]"
              >
                Ver demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-7 py-3 text-[15px] font-medium text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.1] hover:text-white"
              >
                Saiba mais
              </a>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-3 pt-10 sm:gap-4">
              {[
                { value: '0', label: 'apps para instalar' },
                { value: 'Real-time', label: 'cozinha ao vivo' },
                { value: '5 min', label: 'para configurar' },
              ].map((stat) => (
                <div key={stat.label} className={cn(glassCard, 'px-3 py-4 text-center sm:px-4')}>
                  <div className={glassShine} />
                  <div className="relative">
                    <p className="text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40 sm:text-[12px]">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HeroLeadForm />
        </div>
      </div>
    </section>
  );
}
