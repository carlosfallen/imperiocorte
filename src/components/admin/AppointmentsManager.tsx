// FILE: src/components/admin/AppointmentsManager.tsx
import { createSignal, createMemo, For, Show } from 'solid-js';
import type { AppointmentWithDetails, Professional } from '../../lib/types';
import styles from './AppointmentsManager.module.css';

interface Props {
  appointments: AppointmentWithDetails[];
  professionals: Professional[];
}

export default function AppointmentsManager(props: Props) {
  const [appointments, setAppointments] = createSignal(props.appointments);
  const [filterStatus, setFilterStatus] = createSignal('');
  const [filterDate, setFilterDate] = createSignal('');
  const [filterProfessional, setFilterProfessional] = createSignal('');
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedAppointment, setSelectedAppointment] = createSignal<AppointmentWithDetails | null>(null);
  const [viewMode, setViewMode] = createSignal<'list' | 'calendar'>('list');

  const filteredAppointments = createMemo(() => {
    return appointments().filter(apt => {
      const matchesStatus = !filterStatus() || apt.status === filterStatus();
      const matchesDate = !filterDate() || apt.date === filterDate();
      const matchesProfessional = !filterProfessional() || apt.professional_id === filterProfessional();
      const matchesSearch = !searchTerm() || 
        apt.user_name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        apt.user_phone.includes(searchTerm());
      
      return matchesStatus && matchesDate && matchesProfessional && matchesSearch;
    });
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/appointments/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status })
      });

      if (response.ok) {
        setAppointments(prev => prev.map(apt => 
          apt.id === id ? { ...apt, status: status as any } : apt
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: '#FFA500',
      confirmado: '#4CAF50',
      concluido: '#2196F3',
      cancelado: '#F44336',
      nao_compareceu: '#9E9E9E'
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      nao_compareceu: 'Não Compareceu'
    };
    return labels[status] || status;
  };

  const exportWhatsApp = (apt: AppointmentWithDetails) => {
    const message = `*AGENDAMENTO*\n\n` +
      `Cliente: ${apt.user_name}\n` +
      `Tel: ${apt.user_phone}\n` +
      `Data: ${new Date(apt.date).toLocaleDateString('pt-BR')}\n` +
      `Horário: ${apt.start_time}\n` +
      `Serviços: ${apt.items.map(i => i.service_name).join(', ')}\n` +
      `Total: R$ ${apt.total_price.toFixed(2)}\n` +
      `Status: ${getStatusLabel(apt.status)}`;
    
    const url = `https://wa.me/${apt.user_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1>Agendamentos</h1>
          <p>Gerencie todos os agendamentos do salão</p>
        </div>
        <div class={styles['view-toggle']}>
          <button
            classList={{ [styles.active]: viewMode() === 'list' }}
            onClick={() => setViewMode('list')}
          >
            Lista
          </button>
          <button
            classList={{ [styles.active]: viewMode() === 'calendar' }}
            onClick={() => setViewMode('calendar')}
          >
            Calendário
          </button>
        </div>
      </div>

      <div class={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
          class={styles.search}
        />
        
        <select value={filterStatus()} onChange={(e) => setFilterStatus(e.currentTarget.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
          <option value="nao_compareceu">Não Compareceu</option>
        </select>

        <input
          type="date"
          value={filterDate()}
          onInput={(e) => setFilterDate(e.currentTarget.value)}
          class={styles['date-filter']}
        />

        <select value={filterProfessional()} onChange={(e) => setFilterProfessional(e.currentTarget.value)}>
          <option value="">Todos os profissionais</option>
          <For each={props.professionals}>
            {(prof) => <option value={prof.id}>{prof.name}</option>}
          </For>
        </select>

        <button 
          class={styles['btn-clear']}
          onClick={() => {
            setFilterStatus('');
            setFilterDate('');
            setFilterProfessional('');
            setSearchTerm('');
          }}
        >
          Limpar
        </button>
      </div>

      <div class={styles.stats}>
        <div class={styles.stat}>
          <span>Total</span>
          <strong>{filteredAppointments().length}</strong>
        </div>
        <div class={styles.stat}>
          <span>Pendentes</span>
          <strong>{filteredAppointments().filter(a => a.status === 'pendente').length}</strong>
        </div>
        <div class={styles.stat}>
          <span>Hoje</span>
          <strong>
            {filteredAppointments().filter(a => a.date === new Date().toISOString().split('T')[0]).length}
          </strong>
        </div>
      </div>

      <Show when={viewMode() === 'list'}>
        <div class={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Serviços</th>
                <th>Profissional</th>
                <th>Valor</th>
                <th>Origem</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredAppointments()}>
                {(apt) => (
                  <tr>
                    <td>
                      <div class={styles['date-cell']}>
                        <strong>{new Date(apt.date).toLocaleDateString('pt-BR')}</strong>
                        <span>{apt.start_time}</span>
                      </div>
                    </td>
                    <td>
                      <div class={styles['client-cell']}>
                        <strong>{apt.user_name}</strong>
                        <span>{apt.user_phone}</span>
                      </div>
                    </td>
                    <td>
                      <div class={styles['services-cell']}>
                        {apt.items.map(i => i.service_name).join(', ')}
                      </div>
                    </td>
                    <td>{apt.professional_name || 'Qualquer'}</td>
                    <td class={styles.price}>R$ {apt.total_price.toFixed(2)}</td>
                    <td>
                      <span class={styles.source}>{apt.source}</span>
                    </td>
                    <td>
                      <select
                        value={apt.status}
                        onChange={(e) => updateStatus(apt.id, e.currentTarget.value)}
                        class={styles['status-select']}
                        style={{ color: getStatusColor(apt.status) }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="nao_compareceu">Não Compareceu</option>
                      </select>
                    </td>
                    <td>
                      <div class={styles.actions}>
                        <button
                          class={styles['btn-icon']}
                          onClick={() => setSelectedAppointment(apt)}
                          title="Ver detalhes"
                        >
                          👁️
                        </button>
                        <button
                          class={styles['btn-icon']}
                          onClick={() => exportWhatsApp(apt)}
                          title="WhatsApp"
                        >
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Show when={selectedAppointment()}>
        <div class={styles.modal} onClick={() => setSelectedAppointment(null)}>
          <div class={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            <div class={styles['modal-header']}>
              <h2>Detalhes do Agendamento</h2>
              <button onClick={() => setSelectedAppointment(null)}>✕</button>
            </div>
            <div class={styles['modal-body']}>
              <div class={styles.detail}>
                <label>Cliente</label>
                <p>{selectedAppointment()!.user_name}</p>
              </div>
              <div class={styles.detail}>
                <label>Telefone</label>
                <p>{selectedAppointment()!.user_phone}</p>
              </div>
              <div class={styles.detail}>
                <label>Data e Hora</label>
                <p>
                  {new Date(selectedAppointment()!.date).toLocaleDateString('pt-BR')} às {selectedAppointment()!.start_time}
                </p>
              </div>
              <div class={styles.detail}>
                <label>Duração</label>
                <p>{selectedAppointment()!.total_duration} minutos</p>
              </div>
              <div class={styles.detail}>
                <label>Profissional</label>
                <p>{selectedAppointment()!.professional_name || 'Qualquer profissional'}</p>
              </div>
              <div class={styles.detail}>
                <label>Serviços</label>
                <ul>
                  <For each={selectedAppointment()!.items}>
                    {(item) => (
                      <li>{item.service_name} - R$ {item.price.toFixed(2)}</li>
                    )}
                  </For>
                </ul>
              </div>
              <div class={styles.detail}>
                <label>Valor Total</label>
                <p class={styles.total}>R$ {selectedAppointment()!.total_price.toFixed(2)}</p>
              </div>
              <div class={styles.detail}>
                <label>Origem</label>
                <p>{selectedAppointment()!.source}</p>
              </div>
              <Show when={selectedAppointment()!.client_notes}>
                <div class={styles.detail}>
                  <label>Observações do Cliente</label>
                  <p>{selectedAppointment()!.client_notes}</p>
                </div>
              </Show>
              <div class={styles.detail}>
                <label>Status</label>
                <p style={{ color: getStatusColor(selectedAppointment()!.status) }}>
                  {getStatusLabel(selectedAppointment()!.status)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}