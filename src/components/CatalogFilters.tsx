// FILE: src/components/CatalogFilters.tsx
import { createSignal, createMemo, For } from 'solid-js';
import type { Service, ServiceCategory } from '../lib/types';

interface Props {
  categories: ServiceCategory[];
  services: Service[];
}

export default function CatalogFilters(props: Props) {
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedCategory, setSelectedCategory] = createSignal<string>('');
  const [priceRange, setPriceRange] = createSignal<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = createSignal<'popular' | 'price-asc' | 'price-desc'>('popular');

  const filteredServices = createMemo(() => {
    let filtered = props.services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
                           (service.description || '').toLowerCase().includes(searchTerm().toLowerCase());
      const matchesCategory = !selectedCategory() || service.category_id === selectedCategory();
      const matchesPrice = service.price >= priceRange()[0] && service.price <= priceRange()[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy() === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy() === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  });

  return (
    <div class="catalog-container">
      <aside class="filters">
        <h3>Filtros</h3>

        <div class="filter-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Nome do serviço..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="search-input"
          />
        </div>

        <div class="filter-group">
          <label>Categoria</label>
          <select
            value={selectedCategory()}
            onChange={(e) => setSelectedCategory(e.currentTarget.value)}
            class="select-input"
          >
            <option value="">Todas</option>
            <For each={props.categories}>
              {(category) => (
                <option value={category.id}>{category.name}</option>
              )}
            </For>
          </select>
        </div>

        <div class="filter-group">
          <label>Ordenar por</label>
          <select
            value={sortBy()}
            onChange={(e) => setSortBy(e.currentTarget.value as any)}
            class="select-input"
          >
            <option value="popular">Mais populares</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Faixa de preço</label>
          <div class="price-range">
            <input
              type="number"
              min="0"
              value={priceRange()[0]}
              onInput={(e) => setPriceRange([Number(e.currentTarget.value), priceRange()[1]])}
              placeholder="Mín"
            />
            <span>até</span>
            <input
              type="number"
              min="0"
              value={priceRange()[1]}
              onInput={(e) => setPriceRange([priceRange()[0], Number(e.currentTarget.value)])}
              placeholder="Máx"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('');
            setPriceRange([0, 1000]);
            setSortBy('popular');
          }}
          class="btn-reset"
        >
          Limpar filtros
        </button>
      </aside>

      <div class="services-list">
        <div class="results-count">
          {filteredServices().length} {filteredServices().length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
        </div>

        <div class="services-grid">
          <For each={filteredServices()}>
            {(service) => (
              <div class="service-card">
                <div class="service-image">
                  {service.cover_image ? (
                    <img src={service.cover_image} alt={service.name} loading="lazy" />
                  ) : (
                    <div class="service-placeholder"></div>
                  )}
                </div>
                <div class="service-content">
                  <h3>{service.name}</h3>
                  {service.description && <p class="service-description">{service.description}</p>}
                  <div class="service-meta">
                    <span class="duration">⏱️ {service.duration_minutes} min</span>
                    <span class="price">R$ {service.price.toFixed(2)}</span>
                  </div>
                  {service.notes && <p class="service-notes">{service.notes}</p>}
                  <a href={`/agendar?servico=${service.id}`} class="btn-book">Agendar</a>
                </div>
              </div>
            )}
          </For>
        </div>

        {filteredServices().length === 0 && (
          <div class="no-results">
            <p>Nenhum serviço encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}