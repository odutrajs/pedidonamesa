import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { glassCard, glassShine } from './glass';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,113,227,0.12)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-3xl px-5 md:px-8">
        <div className={cn(glassCard, 'px-8 py-12 text-center md:px-12 md:py-14')}>
          <div className={glassShine} />
          <div className="relative">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] text-white">
              Pronto para elevar
              <br />
              <span className="text-white/40">a experiência do seu restaurante?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-white/50">
              Configure categorias, produtos e mesas em minutos. Seus clientes pedem pelo celular,
              sua cozinha opera com mais agilidade.
            </p>
            <Link
              to="/login"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-black transition hover:bg-white/90 active:scale-[0.98]"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-5 text-[13px] text-white/30">
              Sem cartão de crédito · Setup em 5 minutos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
