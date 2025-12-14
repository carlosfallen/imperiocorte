import { createSignal, createMemo, Show, For } from 'solid-js';
import type { Service, Professional } from '../lib/types';

interface Props {
  services: Service[];
  professionals: Professional[];
  initialSource: string;
  initialServiceId?: string | null;
}

export default function BookingFlow(props: Props) {
  const [step, setStep] = createSignal(1);
  const [selectedServices, setSelectedServices] = createSignal<Service[]>(
    props.initialServiceId ? props.services.filter(s => s.id === props.initialServiceId) : []
  );
  const [selectedProfessional, setSelectedProfessional] = createSignal<Professional | null>(null);
  const [selectedDate, setSelectedDate] = createSignal('');
  const [selectedTime, setSelectedTime] = createSignal('');
  const [clientName, setClientName] = createSignal('');
  const [clientPhone, setClientPhone] = createSignal('');
  const [clientEmail, setClientEmail] = createSignal('');
  const [clientNotes, setClientNotes] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const totalDuration = createMemo(() => 
    selectedServices().reduce((sum, s) => sum + s.duration_minutes, 0)
  );

  const totalPrice = createMemo(() => 
    selectedServices().reduce((sum, s) => sum + s.price, 0)
  );

  const toggleService = (service: Service) => {
    const current = selectedServices();
    const index = current.findIndex(s => s.id === service.id);
    if (index >= 0) {
      setSelectedServices(current.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...current, service]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName(),
          clientPhone: clientPhone(),
          clientEmail: clientEmail(),
          professionalId: selectedProfessional()?.id,
          date: selectedDate(),
          time: selectedTime(),
          services: selectedServices().map(s => s.id),
          source: props.initialSource,
          notes: clientNotes()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar agendamento');
      }

      window.location.href = `/agendar/confirmacao?id=${data.appointmentId}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="booking-flow">
      <div class="steps-indicator">
        <div classList={{ step: true, active: step() === 1, completed: step() > 1 }}>
          <span class="step-number">1</span>
          <span class="step-label">Serviços</span>
        </div>
        <div class="step-line" classList={{ completed: step() > 1 }}></div>
        <div classList={{ step: true, active: step() === 2, completed: step() > 2 }}>
          <span class="step-number">2</span>
          <span class="step-label">Profissional</span>
        </div>
        <div class="step-line" classList={{ completed: step() > 2 }}></div>
        <div classList={{ step: true, active: step() === 3, completed: step() > 3 }}>
          <span class="step-number">3</span>
          <span class="step-label">Data e Hora</span>
        </div>
        <div class="step-line" classList={{ completed: step() > 3 }}></div>
        <div classList={{ step: true, active: step() === 4 }}>
          <span class="step-number">4</span>
          <span class="step-label">Dados</span>
        </div>
      </div>

      <div class="flow-content">
        <Show when={step() === 1}>
          <div class="step-content">
            <h2>Selecione os serviços</h2>
            <div class="services-selection">
              <For each={props.services}>
                {(service) => (
                  <div
                    class="service-option"
                    classList={{ selected: selectedServices().some(s => s.id === service.id) }}
                    onClick={() => toggleService(service)}
                  >
                    <div class="service-info">
                      <h3>{service.name}</h3>
                      <p class="service-meta">
                        ⏱️ {service.duration_minutes} min • R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                    <div class="service-checkbox">
                      {selectedServices().some(s => s.id === service.id) && <span>✓</span>}
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={selectedServices().length > 0}>
              <div class="summary-box">
                <p>Total: {totalDuration()} minutos • R$ {totalPrice().toFixed(2)}</p>
              </div>
            </Show>

            <button
              class="btn btn-primary"
              disabled={selectedServices().length === 0}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </Show>

        <Show when={step() === 2}>
          <div class="step-content">
            <h2>Escolha o profissional</h2>
            <p class="step-subtitle">Opcional - escolha um profissional ou deixe o salão decidir</p>
            <div class="professionals-selection">
              <div
                class="professional-option"
                classList={{ selected: !selectedProfessional() }}
                onClick={() => setSelectedProfessional(null)}
              >
                <div class="professional-info">
                  <h3>Qualquer profissional disponível</h3>
                  <p>Deixar o salão escolher</p>
                </div>
                <div class="professional-checkbox">
                  {!selectedProfessional() && <span>✓</span>}
                </div>
              </div>
              <For each={props.professionals}>
                {(professional) => (
                  <div
                    class="professional-option"
                    classList={{ selected: selectedProfessional()?.id === professional.id }}
                    onClick={() => setSelectedProfessional(professional)}
                  >
                    <div class="professional-avatar">
                      {professional.avatar ? (
                        <img src={professional.avatar} alt={professional.name} />
                      ) : (
                        <div class="avatar-placeholder">{professional.name[0]}</div>
                      )}
                    </div>
                    <div class="professional-info">
                      <h3>{professional.name}</h3>
                      {professional.bio && <p>{professional.bio}</p>}
                    </div>
                    <div class="professional-checkbox">
                      {selectedProfessional()?.id === professional.id && <span>✓</span>}
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
              <button class="btn btn-primary" onClick={() => setStep(3)}>Continuar</button>
            </div>
          </div>
        </Show>

        <Show when={step() === 3}>
          <div class="step-content">
            <h2>Escolha a data e horário</h2>
            <div class="datetime-selection">
              <div class="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={selectedDate()}
                  onInput={(e) => setSelectedDate(e.currentTarget.value)}
                  min={new Date().toISOString().split('T')[0]}
                  class="form-input"
                />
              </div>

              <Show when={selectedDate()}>
                <div class="form-group">
                  <label>Horário</label>
                  <input
                    type="time"
                    value={selectedTime()}
                    onInput={(e) => setSelectedTime(e.currentTarget.value)}
                    class="form-input"
                  />
                </div>
              </Show>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" onClick={() => setStep(2)}>Voltar</button>
              <button
                class="btn btn-primary"
                disabled={!selectedDate() || !selectedTime()}
                onClick={() => setStep(4)}
              >
                Continuar
              </button>
            </div>
          </div>
        </Show>

        <Show when={step() === 4}>
          <div class="step-content">
            <h2>Seus dados</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="client-form">
              <div class="form-group">
                <label>Nome completo *</label>
                <input
                  type="text"
                  value={clientName()}
                  onInput={(e) => setClientName(e.currentTarget.value)}
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Telefone (WhatsApp) *</label>
                <input
                  type="tel"
                  value={clientPhone()}
                  onInput={(e) => setClientPhone(e.currentTarget.value)}
                  required
                  placeholder="(11) 99999-9999"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>E-mail (opcional)</label>
                <input
                  type="email"
                  value={clientEmail()}
                  onInput={(e) => setClientEmail(e.currentTarget.value)}
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Observações (opcional)</label>
                <textarea
                  value={clientNotes()}
                  onInput={(e) => setClientNotes(e.currentTarget.value)}
                  rows="3"
                  placeholder="Alguma preferência ou informação importante?"
                  class="form-input"
                ></textarea>
              </div>

              <div class="booking-summary">
                <h3>Resumo do agendamento</h3>
                <div class="summary-row">
                  <span>Serviços:</span>
                  <span>{selectedServices().map(s => s.name).join(', ')}</span>
                </div>
                <Show when={selectedProfessional()}>
                  <div class="summary-row">
                    <span>Profissional:</span>
                    <span>{selectedProfessional()!.name}</span>
                  </div>
                </Show>
                <div class="summary-row">
                  <span>Data:</span>
                  <span>{new Date(selectedDate()).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="summary-row">
                  <span>Horário:</span>
                  <span>{selectedTime()}</span>
                </div>
                <div class="summary-row">
                  <span>Duração:</span>
                  <span>{totalDuration()} minutos</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>R$ {totalPrice().toFixed(2)}</span>
                </div>
              </div>

              <Show when={error()}>
                <div class="error-message">{error()}</div>
              </Show>

              <div class="step-actions">
                <button type="button" class="btn btn-secondary" onClick={() => setStep(3)}>Voltar</button>
                <button type="submit" class="btn btn-primary" disabled={loading()}>
                  {loading() ? 'Agendando...' : 'Confirmar agendamento'}
                </button>
              </div>
            </form>
          </div>
        </Show>
      </div>
    </div>
  );
}