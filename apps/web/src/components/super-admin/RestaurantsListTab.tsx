import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, ChevronRight, Plus } from 'lucide-react';
import { useCreateRestaurant, useSuperAdminRestaurants } from '../../hooks/useSuperAdmin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FieldError, Input, Label } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { formConfig } from '../../lib/validation';

interface CreateFormValues {
  name: string;
  slug: string;
  description: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function FeatureBadges({
  inventoryEnabled,
  financeEnabled,
  whatsappEnabled,
  deliveryEnabled,
}: {
  inventoryEnabled: boolean;
  financeEnabled: boolean;
  whatsappEnabled: boolean;
  deliveryEnabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={inventoryEnabled ? 'success' : 'muted'}>CMV/Estoque</Badge>
      <Badge variant={financeEnabled ? 'success' : 'muted'}>Financeiro</Badge>
      <Badge variant={whatsappEnabled ? 'success' : 'muted'}>WhatsApp</Badge>
      <Badge variant={deliveryEnabled ? 'success' : 'muted'}>Delivery</Badge>
    </div>
  );
}

export function RestaurantsListTab() {
  const { data: restaurants, isLoading } = useSuperAdminRestaurants();
  const createRestaurant = useCreateRestaurant();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    ...formConfig,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  const nameValue = watch('name');

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue('name', name);
    setValue('slug', slugify(name));
  }

  function onSubmit(data: CreateFormValues) {
    createRestaurant.mutate(
      {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Restaurantes</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre e gerencie os restaurantes da plataforma
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancelar' : 'Novo restaurante'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">Cadastrar restaurante</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name', { required: 'Obrigatório' })} onChange={onNameChange} value={nameValue} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL delivery)</Label>
              <Input id="slug" {...register('slug', { required: 'Obrigatório' })} />
              <FieldError message={errors.slug?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" {...register('description')} />
            </div>
            <div>
              <Label htmlFor="adminName">Nome do admin</Label>
              <Input id="adminName" {...register('adminName', { required: 'Obrigatório' })} />
              <FieldError message={errors.adminName?.message} />
            </div>
            <div>
              <Label htmlFor="adminEmail">E-mail do admin</Label>
              <Input id="adminEmail" type="email" {...register('adminEmail', { required: 'Obrigatório' })} />
              <FieldError message={errors.adminEmail?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="adminPassword">Senha inicial</Label>
              <Input id="adminPassword" type="password" {...register('adminPassword', { required: 'Obrigatório', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
              <FieldError message={errors.adminPassword?.message} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createRestaurant.isPending}>
                {createRestaurant.isPending ? 'Criando...' : 'Criar restaurante'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !restaurants?.length ? (
        <EmptyState
          icon={Building2}
          title="Nenhum restaurante"
          description="Cadastre o primeiro restaurante da plataforma."
        />
      ) : (
        <div className="space-y-3">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} to={`/super-admin/restaurantes/${restaurant.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition hover:border-zinc-300 dark:hover:border-zinc-600">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{restaurant.name}</h3>
                    <Badge variant={restaurant.active ? 'success' : 'danger'}>
                      {restaurant.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    /entrega/{restaurant.slug} · {restaurant.userCount} usuário(s)
                  </p>
                  <FeatureBadges
                    inventoryEnabled={restaurant.inventoryEnabled}
                    financeEnabled={restaurant.financeEnabled}
                    whatsappEnabled={restaurant.whatsappEnabled}
                    deliveryEnabled={restaurant.deliveryEnabled}
                  />
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
