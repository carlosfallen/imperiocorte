import { createSignal } from 'solid-js';
import styles from './SettingsManager.module.css';

interface Props {
  settings: Record<string, string>;
}

export default function SettingsManager(props: Props) {
  const [settings, setSettings] = createSignal(props.settings);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal('');

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings(), [key]: value });
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings())
      });

      if (response.ok) {
        setMessage('Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      setMessage('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1>Configurações</h1>
          <p>Gerencie as configurações gerais do salão</p>
        </div>
        <button 
          class={styles['btn-save']} 
          onClick={saveSettings}
          disabled={saving()}
        >
          {saving() ? 'Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>

      {message() && (
        <div class={styles.message}>{message()}</div>
      )}

      <div class={styles.sections}>
        <div class={styles.card}>
          <h2>Informações do Salão</h2>
          
          <div class={styles['form-group']}>
            <label>Nome do Salão</label>
            <input
              type="text"
              value={settings().salon_name}
              onInput={(e) => updateSetting('salon_name', e.currentTarget.value)}
            />
          </div>

          <div class={styles['form-group']}>
            <label>Endereço Completo</label>
            <input
              type="text"
              value={settings().salon_address}
              onInput={(e) => updateSetting('salon_address', e.currentTarget.value)}
              placeholder="Rua, número - Bairro, Cidade - UF"
            />
          </div>

          <div class={styles['form-group']}>
            <label>WhatsApp (com DDI e DDD)</label>
            <input
              type="text"
              value={settings().whatsapp_number}
              onInput={(e) => updateSetting('whatsapp_number', e.currentTarget.value)}
              placeholder="5511999999999"
            />
          </div>

          <div class={styles['form-group']}>
            <label>Instagram URL</label>
            <input
              type="url"
              value={settings().instagram_url}
              onInput={(e) => updateSetting('instagram_url', e.currentTarget.value)}
              placeholder="https://instagram.com/seu_perfil"
            />
          </div>
        </div>

        <div class={styles.card}>
          <h2>Horário de Funcionamento</h2>
          
          <div class={styles['form-row']}>
            <div class={styles['form-group']}>
              <label>Abertura</label>
              <input
                type="time"
                value={settings().business_hours_start}
                onInput={(e) => updateSetting('business_hours_start', e.currentTarget.value)}
              />
            </div>

            <div class={styles['form-group']}>
              <label>Fechamento</label>
              <input
                type="time"
                value={settings().business_hours_end}
                onInput={(e) => updateSetting('business_hours_end', e.currentTarget.value)}
              />
            </div>
          </div>

          <div class={styles['form-group']}>
            <label>Tempo de Buffer (minutos)</label>
            <input
              type="number"
              value={settings().buffer_time_minutes}
              onInput={(e) => updateSetting('buffer_time_minutes', e.currentTarget.value)}
              min="0"
              step="5"
            />
            <p class={styles.hint}>Tempo entre agendamentos para limpeza e preparação</p>
          </div>
        </div>

        <div class={styles.card}>
          <h2>Regras de Agendamento</h2>
          
          <div class={styles['form-group']}>
            <label>Antecedência Mínima (horas)</label>
            <input
              type="number"
              value={settings().min_advance_hours}
              onInput={(e) => updateSetting('min_advance_hours', e.currentTarget.value)}
              min="0"
            />
            <p class={styles.hint}>Tempo mínimo necessário entre o agendamento e o atendimento</p>
          </div>

          <div class={styles['form-group']}>
            <label>Prazo para Cancelamento (horas)</label>
            <input
              type="number"
              value={settings().max_cancel_hours}
              onInput={(e) => updateSetting('max_cancel_hours', e.currentTarget.value)}
              min="0"
            />
            <p class={styles.hint}>Clientes só podem cancelar com esta antecedência mínima</p>
          </div>

          <div class={styles['form-group']}>
            <label>Máximo de Agendamentos por Dia</label>
            <input
              type="number"
              value={settings().max_daily_bookings}
              onInput={(e) => updateSetting('max_daily_bookings', e.currentTarget.value)}
              min="1"
            />
            <p class={styles.hint}>Limite total de agendamentos aceitos por dia</p>
          </div>

          <label class={styles.checkbox}>
            <input
              type="checkbox"
              checked={settings().auto_confirm === '1'}
              onChange={(e) => updateSetting('auto_confirm', e.currentTarget.checked ? '1' : '0')}
            />
            <div>
              <span>Confirmação Automática</span>
              <p class={styles.hint}>Se ativo, agendamentos são confirmados automaticamente. Se não, precisam de aprovação manual.</p>
            </div>
          </label>
        </div>

        <div class={styles.card}>
          <h2>Mensagens WhatsApp</h2>
          
          <div class={styles['form-group']}>
            <label>Template de Confirmação</label>
            <textarea
              rows={6}
              placeholder="Use variáveis: {cliente}, {data}, {horario}, {servicos}, {total}"
              class={styles.template}
            >
              ✅ *AGENDAMENTO CONFIRMADO*{'\n\n'}
              Olá {'{cliente}'}, seu agendamento está confirmado!{'\n\n'}
              📅 Data: {'{data}'}{'\n'}
              🕐 Horário: {'{horario}'}{'\n'}
              💇 Serviços: {'{servicos}'}{'\n'}
              💰 Total: R$ {'{total}'}{'\n\n'}
              Nos vemos em breve! ✨
            </textarea>
            <p class={styles.hint}>Mensagem enviada quando o agendamento é confirmado</p>
          </div>

          <div class={styles['form-group']}>
            <label>Template de Lembrete</label>
            <textarea
              rows={6}
              placeholder="Lembrete enviado 24h antes"
              class={styles.template}
            >
              ⏰ *LEMBRETE*{'\n\n'}
              Olá {'{cliente}'}!{'\n\n'}
              Lembrando que você tem agendamento amanhã:{'\n'}
              📅 {'{data}'} às {'{horario}'}{'\n\n'}
              Nos vemos em breve! ✨
            </textarea>
            <p class={styles.hint}>Lembrete automático enviado 24h antes</p>
          </div>
        </div>

        <div class={styles.card}>
          <h2>Zona de Perigo</h2>
          
          <div class={styles.danger}>
            <h3>⚠️ Resetar Dados</h3>
            <p>Esta ação irá apagar TODOS os agendamentos. Use com extremo cuidado!</p>
            <button class={styles['btn-danger']}>Resetar Agendamentos</button>
          </div>
        </div>
      </div>
    </div>
  );
}