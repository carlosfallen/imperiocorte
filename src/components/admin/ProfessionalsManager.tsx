import { createSignal, For, Show } from 'solid-js';
import type { Professional, Service } from '../../lib/types';
import styles from './ProfessionalsManager.module.css';

interface Props {
  professionals: Professional[];
  services: Service[];
}

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Break {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function ProfessionalsManager(props: Props) {
  const [professionals, setProfessionals] = createSignal(props.professionals);
  const [editingProfessional, setEditingProfessional] = createSignal<Professional | null>(null);
  const [showForm, setShowForm] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'info' | 'services' | 'schedule'>('info');

  const [formData, setFormData] = createSignal({
    name: '',
    bio: '',
    is_active: 1
  });

  const [selectedServices, setSelectedServices] = createSignal<string[]>([]);
  const [workingHours, setWorkingHours] = createSignal<WorkingHour[]>([]);
  const [breaks, setBreaks] = createSignal<Break[]>([]);

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const openForm = async (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        name: professional.name,
        bio: professional.bio || '',
        is_active: professional.is_active
      });

      // Load professional services
      const response = await fetch(`/api/admin/professionals/${professional.id}/services`);
      const data = await response.json();
      setSelectedServices(data.services || []);

      // Load working hours
      const hoursResponse = await fetch(`/api/admin/professionals/${professional.id}/hours`);
      const hoursData = await hoursResponse.json();
      setWorkingHours(hoursData.hours || []);
      setBreaks(hoursData.breaks || []);
    } else {
      setEditingProfessional(null);
      setFormData({
        name: '',
        bio: '',
        is_active: 1
      });
      setSelectedServices([]);
      setWorkingHours([]);
      setBreaks([]);
    }
    setActiveTab('info');
    setShowForm(true);
  };

  const saveProfessional = async () => {
    try {
      const url = editingProfessional()
        ? `/api/admin/professionals/${editingProfessional()!.id}`
        : '/api/admin/professionals';

      const response = await fetch(url, {
        method: editingProfessional() ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData(),
          services: selectedServices(),
          workingHours: workingHours(),
          breaks: breaks()
        })
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving professional:', error);
    }
  };

  const deleteProfessional = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      const response = await fetch(`/api/admin/professionals/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProfessionals(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting professional:', error);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const addWorkingHour = () => {
    setWorkingHours(prev => [...prev, {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '18:00'
    }]);
  };

  const removeWorkingHour = (index: number) => {
    setWorkingHours(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev => prev.map((hour, i) =>
      i === index ? { ...hour, [field]: value } : hour
    ));
  };

  const addBreak = () => {
    setBreaks(prev => [...prev, {
      day_of_week: 1,
      start_time: '12:00',
      end_time: '13:00'
    }]);
  };

  const removeBreak = (index: number) => {
    setBreaks(prev => prev.filter((_, i) => i !== index));
  };

  const updateBreak = (index: number, field: keyof Break, value: any) => {
    setBreaks(prev => prev.map((brk, i) =>
      i === index ? { ...brk, [field]: value } : brk
    ));
  };

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1>Profissionais</h1>
          <p>Gerencie a equipe do salão</p>
        </div>
        <button class={styles['btn-primary']} onClick={() => openForm()}>
          + Novo Profissional
        </button>
      </div>

      <div class={styles.stats}>
        <div class={styles.stat}>
          <span>Total</span>
          <strong>{professionals().length}</strong>
        </div>
        <div class={styles.stat}>
          <span>Ativos</span>
          <strong>{professionals().filter(p => p.is_active).length}</strong>
        </div>
      </div>

      <div class={styles.grid}>
        <For each={professionals()}>
          {(professional) => (
            <div class={styles.card}>
              <div class={styles['card-header']}>
                <div class={styles.avatar}>
                  {professional.avatar ? (
                    <img src={professional.avatar} alt={professional.name} />
                  ) : (
                    <div class={styles['avatar-placeholder']}>{professional.name[0]}</div>
                  )}
                </div>
                <div class={styles.info}>
                  <h3>{professional.name}</h3>
                  {professional.bio && <p>{professional.bio}</p>}
                </div>
                {professional.is_active === 0 && (
                  <span class={styles.inactive}>Inativo</span>
                )}
              </div>
              <div class={styles['card-footer']}>
                <button
                  class={styles['btn-edit']}
                  onClick={() => openForm(professional)}
                >
                  Editar
                </button>
                <button
                  class={styles['btn-delete']}
                  onClick={() => deleteProfessional(professional.id)}
                >
                  Excluir
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
              <h2>{editingProfessional() ? 'Editar Profissional' : 'Novo Profissional'}</h2>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div class={styles.tabs}>
              <button
                classList={{ [styles.active]: activeTab() === 'info' }}
                onClick={() => setActiveTab('info')}
              >
                Informações
              </button>
              <button
                classList={{ [styles.active]: activeTab() === 'services' }}
                onClick={() => setActiveTab('services')}
              >
                Serviços
              </button>
              <button
                classList={{ [styles.active]: activeTab() === 'schedule' }}
                onClick={() => setActiveTab('schedule')}
              >
                Horários
              </button>
            </div>

            <div class={styles['modal-body']}>
              <Show when={activeTab() === 'info'}>
                <div class={styles['form-group']}>
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={formData().name}
                    onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
                    placeholder="Nome do profissional"
                  />
                </div>

                <div class={styles['form-group']}>
                  <label>Biografia</label>
                  <textarea
                    value={formData().bio}
                    onInput={(e) => setFormData({ ...formData(), bio: e.currentTarget.value })}
                    rows={4}
                    placeholder="Experiência, especialidades, certificações..."
                  />
                </div>

                <label class={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData().is_active === 1}
                    onChange={(e) => setFormData({ ...formData(), is_active: e.currentTarget.checked ? 1 : 0 })}
                  />
                  <span>Profissional ativo</span>
                </label>
              </Show>

              <Show when={activeTab() === 'services'}>
                <p class={styles.subtitle}>Selecione os serviços que este profissional oferece:</p>
                <div class={styles['services-grid']}>
                  <For each={props.services}>
                    {(service) => (
                      <label class={styles['service-checkbox']}>
                        <input
                          type="checkbox"
                          checked={selectedServices().includes(service.id)}
                          onChange={() => toggleService(service.id)}
                        />
                        <span>{service.name}</span>
                      </label>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={activeTab() === 'schedule'}>
                <div class={styles['schedule-section']}>
                  <div class={styles['section-header']}>
                    <h3>Horários de Trabalho</h3>
                    <button class={styles['btn-add']} onClick={addWorkingHour}>
                      + Adicionar
                    </button>
                  </div>
                  <For each={workingHours()}>
                    {(hour, index) => (
                      <div class={styles['schedule-item']}>
                        <select
                          value={hour.day_of_week}
                          onChange={(e) => updateWorkingHour(index(), 'day_of_week', Number(e.currentTarget.value))}
                        >
                          <For each={daysOfWeek}>
                            {(day, i) => <option value={i()}>{day}</option>}
                          </For>
                        </select>
                        <input
                          type="time"
                          value={hour.start_time}
                          onInput={(e) => updateWorkingHour(index(), 'start_time', e.currentTarget.value)}
                        />
                        <span>até</span>
                        <input
                          type="time"
                          value={hour.end_time}
                          onInput={(e) => updateWorkingHour(index(), 'end_time', e.currentTarget.value)}
                        />
                        <button
                          class={styles['btn-remove']}
                          onClick={() => removeWorkingHour(index())}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </For>
                </div>

                <div class={styles['schedule-section']}>
                  <div class={styles['section-header']}>
                    <h3>Pausas / Intervalos</h3>
                    <button class={styles['btn-add']} onClick={addBreak}>
                      + Adicionar
                    </button>
                  </div>
                  <For each={breaks()}>
                    {(brk, index) => (
                      <div class={styles['schedule-item']}>
                        <select
                          value={brk.day_of_week}
                          onChange={(e) => updateBreak(index(), 'day_of_week', Number(e.currentTarget.value))}
                        >
                          <For each={daysOfWeek}>
                            {(day, i) => <option value={i()}>{day}</option>}
                          </For>
                        </select>
                        <input
                          type="time"
                          value={brk.start_time}
                          onInput={(e) => updateBreak(index(), 'start_time', e.currentTarget.value)}
                        />
                        <span>até</span>
                        <input
                          type="time"
                          value={brk.end_time}
                          onInput={(e) => updateBreak(index(), 'end_time', e.currentTarget.value)}
                        />
                        <button
                          class={styles['btn-remove']}
                          onClick={() => removeBreak(index())}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <div class={styles['modal-footer']}>
              <button class={styles['btn-cancel']} onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button class={styles['btn-save']} onClick={saveProfessional}>
                {editingProfessional() ? 'Salvar Alterações' : 'Criar Profissional'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}