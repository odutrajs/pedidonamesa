import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, QrCode, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
              <QrCode className="h-3.5 w-3.5" />
              Pedidos por QR Code
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl md:leading-tight">
              Pedidos na mesa, sem fila e sem app
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-600">
              Seu cliente escaneia o QR, monta o pedido no celular e a cozinha recebe em tempo real.
              Simples para quem pede, eficiente para quem opera.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg">
                  Ver demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button variant="outline" size="lg">
                  Como funciona
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-8 text-sm text-zinc-500">
              <div>
                <p className="text-2xl font-semibold text-zinc-900">0</p>
                <p>apps para instalar</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">Real-time</p>
                <p>cozinha ao vivo</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-900">5 min</p>
                <p>para configurar</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative mx-auto w-[280px] rounded-[2rem] border-8 border-zinc-900 bg-zinc-900 p-2 shadow-2xl">
              <div className="overflow-hidden rounded-[1.4rem] bg-white">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <p className="text-xs text-zinc-400">Restaurante Demo</p>
                  <p className="font-semibold text-zinc-900">Mesa 3</p>
                </div>
                <div className="space-y-3 p-3">
                  <div className="overflow-hidden rounded-lg border border-zinc-100">
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-50" />
                    <div className="p-2.5">
                      <p className="text-sm font-medium">Hambúrguer artesanal</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-600">R$ 38,00</span>
                        <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs">+ Add</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-zinc-100">
                    <div className="aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-50" />
                    <div className="p-2.5">
                      <p className="text-sm font-medium">Suco natural</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-600">R$ 12,00</span>
                        <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs">+ Add</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-center text-xs font-medium text-zinc-600">
                  2 itens · R$ 50,00 · Ver pedido
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-8 hidden rounded-xl border border-zinc-200 bg-white p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <ChefHat className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-900">Novo pedido</p>
                  <p className="text-xs text-zinc-500">Mesa 3 · agora</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 bottom-12 hidden rounded-xl border border-zinc-200 bg-white p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-medium text-zinc-700">Sem download</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
