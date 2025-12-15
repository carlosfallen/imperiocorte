
// FILE: src/components/admin/ReportsManager.tsx
import { createSignal, createMemo, For } from 'solid-js';
import type { AppointmentWithDetails } from '../../lib/types';
import styles from './ReportsManager.module.css';

interface Props {
  reports: any;
  appointments: AppointmentWithDetails[];
  initialStartDate: string;
  initialEndDate: string;
}

export default function ReportsManager(props: Props) {
  const [startDate, setStartDate] = createSignal(props.initialStartDate);
  const [endDate, setEndDate] = createSignal(props.initialEndDate);

  const applyFilter = () => {
    window.location.href = `/admin/relatorios?start=${startDate()}&end=${endDate()}`;
  };

  const exportCSV = () => {
    const headers = ['Data', 'Horário', 'Cliente', 'Telefone', 'Serviços', 'Profissional', 'Valor', 'Status', 'Origem'];
    const rows = props.appointments.map(apt => [
      apt.date,
      apt.start_time,
      apt.user_name,
      apt.user_phone,
      apt.items.map(i => i.service_name).join('; '),
      apt.professional_name || 'Qualquer',
      apt.total_price.toFixed(2),
      apt.status,
      apt.source
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${startDate()}-${endDate()}.csv`;
    a.click();
  };

  const totalRevenue = createMemo(() => {
    return props.appointments
      .filter(apt => apt.status === 'concluido')
      .reduce((sum, apt) => sum + apt.total_price, 0);
  });

  const averageTicket = createMemo(() => {
    const completed = props.appointments.filter(apt => apt.status === 'concluido');
    return completed.length > 0 ? totalRevenue() / completed.length : 0;
  });

  const conversionRate = createMemo(() => {
    const total = props.appointments.length;
    const completed = props.appointments.filter(apt => apt.status === 'concluido').length;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  const noShowRate = createMemo(() => {
    const total = props.appointments.length;
    const noShows = props.appointments.filter(apt => apt.status === 'nao_compareceu').length;
    return total > 0 ? (noShows / total) * 100 : 0;
  });

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1>Relatórios</h1>
          <p>Análise detalhada do desempenho do salão</p>
        </div>
        <button class={styles['btn-export']} onClick={exportCSV}>
          📊 Exportar CSV
        </button>
      </div>

      <div class={styles.filters}>
        <div class={styles['date-range']}>
          <div>
            <label>Data Início</label>
            <input
              type="date"
              value={startDate()}
              onInput={(e) => setStartDate(e.currentTarget.value)}
            />
          </div>
          <div>
            <label>Data Fim</label>
            <input
              type="date"
              value={endDate()}
              onInput={(e) => setEndDate(e.currentTarget.value)}
            />
          </div>
          <button class={styles['btn-apply']} onClick={applyFilter}>
            Aplicar
          </button>
        </div>
      </div>

      <div class={styles.metrics}>
        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#4CAF50' }}>
            💰
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Receita Total</p>
            <p class={styles['metric-value']}>R$ {totalRevenue().toFixed(2)}</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#2196F3' }}>
            🎯
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Ticket Médio</p>
            <p class={styles['metric-value']}>R$ {averageTicket().toFixed(2)}</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#FF9800' }}>
            📈
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Taxa de Conversão</p>
            <p class={styles['metric-value']}>{conversionRate().toFixed(1)}%</p>
          </div>
        </div>

        <div class={styles.metric}>
          <div class={styles['metric-icon']} style={{ background: '#F44336' }}>
            ⚠️
          </div>
          <div class={styles['metric-content']}>
            <p class={styles['metric-label']}>Taxa de Falta</p>
            <p class={styles['metric-value']}>{noShowRate().toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Top 10 Serviços</h2>
          </div>
          <div class={styles['chart-container']}>
            <For each={props.reports.topServices}>
              {(service, index) => (
                <div class={styles['bar-item']}>
                  <div class={styles['bar-label']}>
                    <span class={styles.rank}>#{index() + 1}</span>
                    <span>{service.service_name}</span>
                  </div>
                  <div class={styles['bar-wrapper']}>
                    <div 
                      class={styles.bar}
                      style={{ 
                        width: `${(service.count / props.reports.topServices[0].count) * 100}%`,
                        background: `hsl(${45 - index() * 5}, 70%, 50%)`
                      }}
                    >
                      <span class={styles['bar-value']}>{service.count}</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Profissionais Mais Solicitados</h2>
          </div>
          <div class={styles['chart-container']}>
            <For each={props.reports.topProfessionals}>
              {(prof, index) => (
                <div class={styles['bar-item']}>
                  <div class={styles['bar-label']}>
                    <span class={styles.rank}>#{index() + 1}</span>
                    <span>{prof.name}</span>
                  </div>
                  <div class={styles['bar-wrapper']}>
                    <div 
                      class={styles.bar}
                      style={{ 
                        width: `${(prof.count / props.reports.topProfessionals[0].count) * 100}%`,
                        background: `hsl(${200 - index() * 10}, 70%, 50%)`
                      }}
                    >
                      <span class={styles['bar-value']}>{prof.count}</span>
                    </div>
                  </div>
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
            <For each={props.reports.bySource}>
              {(source) => (
                <div class={styles['stat-item']}>
                  <div class={styles['stat-info']}>
                    <span class={styles['stat-label']}>{source.source}</span>
                    <span class={styles['stat-percent']}>
                      {((source.count / props.appointments.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div class={styles['progress-bar']}>
                    <div 
                      class={styles.progress}
                      style={{ width: `${(source.count / props.appointments.length) * 100}%` }}
                    />
                  </div>
                  <span class={styles['stat-count']}>{source.count}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class={styles.card}>
          <div class={styles['card-header']}>
            <h2>Status dos Agendamentos</h2>
          </div>
          <div class={styles['stats-list']}>
            <For each={props.reports.byStatus}>
              {(status) => {
                const colors: Record<string, string> = {
                  pendente: '#FFA500',
                  confirmado: '#4CAF50',
                  concluido: '#2196F3',
                  cancelado: '#F44336',
                  nao_compareceu: '#9E9E9E'
                };
                return (
                  <div class={styles['stat-item']}>
                    <div class={styles['stat-info']}>
                      <span class={styles['stat-label']} style={{ color: colors[status.status] }}>
                        {status.status}
                      </span>
                      <span class={styles['stat-percent']}>
                        {((status.count / props.appointments.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div class={styles['progress-bar']}>
                      <div 
                        class={styles.progress}
                        style={{ 
                          width: `${(status.count / props.appointments.length) * 100}%`,
                          background: colors[status.status]
                        }}
                      />
                    </div>
                    <span class={styles['stat-count']}>{status.count}</span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      <div class={styles.card}>
        <div class={styles['card-header']}>
          <h2>Histórico de Agendamentos</h2>
        </div>
        <div class={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Serviços</th>
                <th>Profissional</th>
                <th>Valor</th>
                <th>Origem</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.appointments.slice(0, 20)}>
                {(apt) => (
                  <tr>
                    <td>{new Date(apt.date).toLocaleDateString('pt-BR')} {apt.start_time}</td>
                    <td>{apt.user_name}</td>
                    <td>{apt.items.map(i => i.service_name).join(', ')}</td>
                    <td>{apt.professional_name || 'Qualquer'}</td>
                    <td class={styles.price}>R$ {apt.total_price.toFixed(2)}</td>
                    <td><span class={styles.source}>{apt.source}</span></td>
                    <td><span class={styles.status} style={{ background: getStatusColor(apt.status) }}>{apt.status}</span></td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pendente: '#FFA500',
    confirmado: '#4CAF50',
    concluido: '#2196F3',
    cancelado: '#F44336',
    nao_compareceu: '#9E9E9E'
  };
  return colors[status] || '#666';
}
