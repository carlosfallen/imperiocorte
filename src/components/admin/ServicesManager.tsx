// FILE: src/components/admin/ServicesManager.tsx
import { createSignal, For, Show } from 'solid-js';
import type { Service, ServiceCategory } from '../../lib/types';
import styles from './ServicesManager.module.css';

interface Props {
  services: Service[];
  categories: ServiceCategory[];
}

export default function ServicesManager(props: Props) {
  const [services, setServices] = createSignal(props.services);
  const [categories] = createSignal(props.categories);
  const [editingService, setEditingService] = createSignal<Service | null>(null);
  const [showForm, setShowForm] = createSignal(false);
  const [filterCategory, setFilterCategory] = createSignal('');

  const [formData, setFormData] = createSignal({
    name: '',
    category_id: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    notes: '',
    is_featured: 0,
    is_active: 1
  });

  const filteredServices = () => {
    if (!filterCategory()) return services();
    return services().filter(s => s.category_id === filterCategory());
  };

  const openForm = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category_id: service.category_id,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price,
        notes: service.notes || '',
        is_featured: service.is_featured,
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        category_id: categories()[0]?.id || '',
        description: '',
        duration_minutes: 30,
        price: 0,
        notes: '',
        is_featured: 0,
        is_active: 1
      });
    }
    setShowForm(true);
  };

  const saveService = async () => {
    try {
      const url = editingService() 
        ? `/api/admin/services/${editingService()!.id}`
        : '/api/admin/services';
      
      const response = await fetch(url, {
        method: editingService() ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData())
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const toggleFeatured = async (service: Service) => {
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: service.is_featured ? 0 : 1 })
      });

      if (response.ok) {
        setServices(prev => prev.map(s => 
          s.id === service.id ? { ...s, is_featured: s.is_featured ? 0 : 1 } : s
        ));
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1>Serviços</h1>
          <p>Gerencie todos os serviços oferecidos pelo salão</p>
        </div>
        <button class={styles['btn-primary']} onClick={() => openForm()}>
          + Novo Serviço
        </button>
      </div>

      <div class={styles.filters}>
        <select value={filterCategory()} onChange={(e) => setFilterCategory(e.currentTarget.value)}>
          <option value="">Todas as categorias</option>
          <For each={categories()}>
            {(cat) => <option value={cat.id}>{cat.name}</option>}
          </For>
        </select>
        <div class={styles.stats}>
          <span>Total: {services().length}</span>
          <span>Ativos: {services().filter(s => s.is_active).length}</span>
          <span>Em Destaque: {services().filter(s => s.is_featured).length}</span>
        </div>
      </div>

      <div class={styles.grid}>
        <For each={filteredServices()}>
          {(service) => (
            <div class={styles.card}>
              <div class={styles['card-header']}>
                <h3>{service.name}</h3>
                <div class={styles.badges}>
                  {service.is_featured === 1 && <span class={styles.featured}>⭐ Destaque</span>}
                  {service.is_active === 0 && <span class={styles.inactive}>Inativo</span>}
                </div>
              </div>
              <div class={styles['card-body']}>
                <p class={styles.category}>
                  {categories().find(c => c.id === service.category_id)?.name}
                </p>
                {service.description && <p class={styles.description}>{service.description}</p>}
                <div class={styles.meta}>
                  <span>⏱️ {service.duration_minutes} min</span>
                  <span class={styles.price}>R$ {service.price.toFixed(2)}</span>
                </div>
                {service.notes && (
                  <p class={styles.notes}>📝 {service.notes}</p>
                )}
              </div>
              <div class={styles['card-footer']}>
                <button
                  class={styles['btn-icon']}
                  onClick={() => toggleFeatured(service)}
                  title={service.is_featured ? 'Remover destaque' : 'Destacar'}
                >
                  {service.is_featured ? '⭐' : '☆'}
                </button>
                <button
                  class={styles['btn-icon']}
                  onClick={() => openForm(service)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  class={styles['btn-icon']}
                  onClick={() => deleteService(service.id)}
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={showForm()}>
        <div class={styles.modal} onClick={() => setShowForm(false)}>
          <div class={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            <div class={styles['modal-header']}>
              <h2>{editingService() ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div class={styles['modal-body']}>
              <div class={styles['form-group']}>
                <label>Nome do Serviço *</label>
                <input
                  type="text"
                  value={formData().name}
                  onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
                  placeholder="Ex: Corte Feminino"
                />
              </div>

              <div class={styles['form-group']}>
                <label>Categoria *</label>
                <select
                  value={formData().category_id}
                  onChange={(e) => setFormData({ ...formData(), category_id: e.currentTarget.value })}
                >
                  <For each={categories()}>
                    {(cat) => <option value={cat.id}>{cat.name}</option>}
                  </For>
                </select>
              </div>

              <div class={styles['form-row']}>
                <div class={styles['form-group']}>
                  <label>Duração (minutos) *</label>
                  <input
                    type="number"
                    value={formData().duration_minutes}
                    onInput={(e) => setFormData({ ...formData(), duration_minutes: Number(e.currentTarget.value) })}
                    min="5"
                    step="5"
                  />
                </div>

                <div class={styles['form-group']}>
                  <label>Preço (R$) *</label>
                  <input
                    type="number"
                    value={formData().price}
                    onInput={(e) => setFormData({ ...formData(), price: Number(e.currentTarget.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div class={styles['form-group']}>
                <label>Descrição</label>
                <textarea
                  value={formData().description}
                  onInput={(e) => setFormData({ ...formData(), description: e.currentTarget.value })}
                  rows={3}
                  placeholder="Descreva o serviço..."
                />
              </div>

              <div class={styles['form-group']}>
                <label>Observações</label>
                <textarea
                  value={formData().notes}
                  onInput={(e) => setFormData({ ...formData(), notes: e.currentTarget.value })}
                  rows={2}
                  placeholder="Ex: Trazer referências, chegar com cabelo lavado..."
                />
              </div>

              <div class={styles['form-checks']}>
                <label class={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData().is_featured === 1}
                    onChange={(e) => setFormData({ ...formData(), is_featured: e.currentTarget.checked ? 1 : 0 })}
                  />
                  <span>Destacar na página inicial</span>
                </label>

                <label class={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData().is_active === 1}
                    onChange={(e) => setFormData({ ...formData(), is_active: e.currentTarget.checked ? 1 : 0 })}
                  />
                  <span>Serviço ativo</span>
                </label>
              </div>
            </div>
            <div class={styles['modal-footer']}>
              <button class={styles['btn-cancel']} onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button class={styles['btn-save']} onClick={saveService}>
                {editingService() ? 'Salvar Alterações' : 'Criar Serviço'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}