import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { glassCard, glassInput, glassShine } from './glass';

type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  restaurant: string;
  message?: string;
};

const labelClass = 'mb-1.5 block text-[13px] font-medium text-white/60';

const glassCardClass = cn(glassCard, 'p-6 md:p-8');

const inputClass = cn(
  'w-full rounded-xl px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/30',
  glassInput,
);

export function HeroLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>();

  async function onSubmit(data: LeadFormValues) {
    await new Promise((r) => setTimeout(r, 800));
    console.info('[lead]', data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={cn(
          glassCardClass,
          'flex min-h-[420px] flex-col items-center justify-center p-10 text-center',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-blue-500/[0.06]" />
        <div className="relative">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/15 backdrop-blur-sm">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Recebemos seu contato!</h3>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-white/50">
            Nossa equipe vai entrar em contato em breve para agendar uma demo do Pedido na Mesa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={glassCardClass}>
      <div className={glassShine} />
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mb-6">
        <p className="text-[13px] font-medium uppercase tracking-wider text-blue-400">
          Comece agora
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
          Solicite uma demo gratuita
        </h3>
        <p className="mt-1.5 text-[14px] text-white/45">
          Preencha o formulário e nossa equipe entra em contato.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-name" className={labelClass}>
              Nome completo
            </label>
            <input
              id="lead-name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className={cn(inputClass, errors.name && 'border-red-500/50')}
              {...register('name', { required: 'Informe seu nome' })}
            />
            {errors.name && (
              <p className="mt-1 text-[12px] text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lead-restaurant" className={labelClass}>
              Restaurante / Bar
            </label>
            <input
              id="lead-restaurant"
              type="text"
              placeholder="Nome do estabelecimento"
              className={cn(inputClass, errors.restaurant && 'border-red-500/50')}
              {...register('restaurant', { required: 'Informe o nome do restaurante' })}
            />
            {errors.restaurant && (
              <p className="mt-1 text-[12px] text-red-400">{errors.restaurant.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="lead-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={cn(inputClass, errors.email && 'border-red-500/50')}
              {...register('email', {
                required: 'Informe seu e-mail',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'E-mail inválido',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lead-phone" className={labelClass}>
              WhatsApp
            </label>
            <input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              className={cn(inputClass, errors.phone && 'border-red-500/50')}
              {...register('phone', { required: 'Informe seu WhatsApp' })}
            />
            {errors.phone && (
              <p className="mt-1 text-[12px] text-red-400">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="lead-message" className={labelClass}>
            Mensagem <span className="text-white/25">(opcional)</span>
          </label>
          <textarea
            id="lead-message"
            rows={3}
            placeholder="Conte um pouco sobre seu restaurante..."
            className={cn(inputClass, 'resize-none')}
            {...register('message')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Quero uma demo
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-center text-[12px] text-white/30">
          Sem compromisso · Resposta em até 24h
        </p>
      </form>
    </div>
  );
}
