import { createSignal, For, Show } from 'solid-js';
import type { AppointmentWithDetails } from '../../lib/types';
import styles from './AdminDashboard.module.css';

interface Props {
  todayAppointments: AppointmentWithDetails[];
  pendingAppointments: AppointmentWithDetails[];
  monthlyReports: any;
}

export default function AdminDashboard(props: Props) {
  const [selectedAppointment, setSelectedAppointment] = createSignal<AppointmentWithDetails | null>(null);

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/appointments/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status })
      });

      if (response.ok) {
        window.location.reload();
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

  return (
    <div class={styles.dashboard}>
      <div class={styles.header}>
        <h1>Dashboard</h1>
        <p>Visão geral do salão</p>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#4CAF50' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Hoje</p>
            <p class={styles['metric-value']}>{props.todayAppointments.length}</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#FFA500' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Pendentes</p>
            <p class={styles['metric-value']}>{props.pendingAppointments.length}</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#2196F3' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Receita (mês)</p>
            <p class={styles['metric-value']}>R$ {props.monthlyReports.revenue.toFixed(2)}</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#9C27B0' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Total (mês)</p>
            <p class={styles['metric-value']}>
              {props.monthlyReports.byStatus.reduce((sum: number, s: any) => sum + s.count, 0)}
            </p>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Agendamentos de Hoje</h2>
            <a href="/admin/agendamentos" class={styles['btn-link']}>Ver todos</a>
          </div>
          <div class={styles['appointments-list']}>
            <Show when={props.todayAppointments.length > 0} fallback={
              <p class={styles.empty}>Nenhum agendamento para hoje</p>
            }>
              <For each={props.todayAppointments}>
                {(appointment) => (
                  <div class={styles['appointment-item']}>
                    <div class={styles['appointment-time']}>
                      <p class={styles.time}>{appointment.start_time}</p>
                      <p class={styles.duration}>{appointment.total_duration} min</p>
                    </div>
                    <div class={styles['appointment-info']}>
                      <p class={styles.client}>{appointment.user_name}</p>
                      <p class={styles.services}>
                        {appointment.items.map(i => i.service_name).join(', ')}
                      </p>
                      {appointment.professional_name && (
                        <p class={styles.professional}>👤 {appointment.professional_name}</p>
                      )}
                    </div>
                    <div class={styles['appointment-status']}>
                      <span 
                        class={styles.badge}
                        style={{ background: getStatusColor(appointment.status) }}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                      <p class={styles.price}>R$ {appointment.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>

        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Aprovação Pendente</h2>
          </div>
          <div class={styles['pending-list']}>
            <Show when={props.pendingAppointments.length > 0} fallback={
              <p class={styles.empty}>Nenhum agendamento pendente</p>
            }>
              <For each={props.pendingAppointments.slice(0, 5)}>
                {(appointment) => (
                  <div class={styles['pending-item']}>
                    <div class={styles['pending-info']}>
                      <p class={styles.client}>{appointment.user_name}</p>
                      <p class={styles.date}>
                        {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.start_time}
                      </p>
                      <p class={styles.services}>
                        {appointment.items.map(i => i.service_name).join(', ')}
                      </p>
                    </div>
                    <div class={styles['pending-actions']}>
                      <button
                        class={styles['btn-approve']}
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmado')}
                      >
                        ✓
                      </button>
                      <button
                        class={styles['btn-reject']}
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelado')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Top Serviços (Este Mês)</h2>
          </div>
          <div class={styles['stats-list']}>
            <For each={props.monthlyReports.topServices.slice(0, 5)}>
              {(service) => (
                <div class={styles['stat-item']}>
                  <p class={styles['stat-label']}>{service.service_name}</p>
                  <p class={styles['stat-value']}>{service.count}</p>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Origem dos Agendamentos</h2>
          </div>
          <div class={styles['stats-list']}>
            <For each={props.monthlyReports.bySource}>
              {(source) => (
                <div class={styles['stat-item']}>
                  <p class={styles['stat-label']}>{source.source}</p>
                  <p class={styles['stat-value']}>{source.count}</p>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}