import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function CtaSection() {
  return (
    <section className="bg-zinc-900 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Pronto para modernizar seu restaurante?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-zinc-400">
          Configure categorias, produtos e mesas em minutos. Seus clientes pedem pelo celular,
          sua cozinha opera com mais agilidade.
        </p>
        <Link to="/login" className="mt-8 inline-block">
          <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
