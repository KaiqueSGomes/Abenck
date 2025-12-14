let searchResults = [];
let filteredResults = [];
let currentPage = 1;
const resultsPerPage = 12;

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    // Obter resultados do sessionStorage
    const results = sessionStorage.getItem('searchResults');
    const category = sessionStorage.getItem('searchCategory');

    if (results) {
        searchResults = JSON.parse(results);
        filteredResults = [...searchResults];
        renderResults();
        updateSearchInfo(category);
    } else {
        document.getElementById('noResults').style.display = 'block';
    }
});

// Atualizar informações de busca
function updateSearchInfo(category) {
    const count = filteredResults.length;
    const info = category
        ? `${count} empresa${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''} em "${category}"`
        : `${count} empresa${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`;

    document.getElementById('searchInfo').textContent = info;
}

// Renderizar resultados
function renderResults() {
    const grid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');

    if (filteredResults.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    grid.style.display = 'grid';
    noResults.style.display = 'none';

    // Calcular paginação
    const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const pageResults = filteredResults.slice(startIndex, endIndex);

    // Renderizar cards
    grid.innerHTML = pageResults.map(company => `
        <div class="company-card">
            <div class="company-header">
                <div class="company-logo">${company.company_name.charAt(0)}</div>
                <div class="company-info">
                    <div class="company-name">${company.company_name}</div>
                    <div class="company-rating">
                        <span class="stars">★ ${company.rating || '4.9'}</span>
                        <span>• ${company.region || 'São Paulo'}</span>
                    </div>
                    <div class="company-location">📍 ${company.city || 'São Paulo'}</div>
                </div>
                ${company.is_verified ? '<div class="company-badge">VERIFICADO</div>' : ''}
            </div>
            <div class="company-description">
                ${truncateText(company.description || 'Serviços de qualidade para seu condomínio', 100)}
            </div>
            <div class="company-footer">
                <a href="/company.html?id=${company.id}" class="btn-whatsapp" style="background: var(--primary-color); text-decoration: none; display: block; text-align: center;">
                    VER PERFIL
                </a>
            </div>
        </div>
    `).join('');

    // Renderizar paginação
    renderPagination(totalPages);
}

// Renderizar paginação
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Botão anterior
    if (currentPage > 1) {
        html += `<button onclick="goToPage(${currentPage - 1})">← Anterior</button>`;
    }

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="active" disabled>${i}</button>`;
        } else if (i <= 3 || i >= totalPages - 2 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button onclick="goToPage(${i})">${i}</button>`;
        } else if (i === 4 || i === totalPages - 3) {
            html += `<button disabled>...</button>`;
        }
    }

    // Botão próximo
    if (currentPage < totalPages) {
        html += `<button onclick="goToPage(${currentPage + 1})">Próximo →</button>`;
    }

    pagination.innerHTML = html;
}

// Ir para página
function goToPage(page) {
    currentPage = page;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Refinar busca
function refineSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();

    if (!query) {
        filteredResults = [...searchResults];
    } else {
        filteredResults = searchResults.filter(company =>
            company.company_name.toLowerCase().includes(query) ||
            (company.description && company.description.toLowerCase().includes(query)) ||
            (company.category && company.category.toLowerCase().includes(query))
        );
    }

    currentPage = 1;
    renderResults();
    updateSearchInfo(query || 'geral');
}

// Ordenar resultados
function sortResults() {
    const sortValue = document.getElementById('sortSelect').value;

    switch (sortValue) {
        case 'rating':
            filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'distance':
            // Ordenar por distância (se tiver coordenadas)
            filteredResults.sort((a, b) => {
                const distA = a.distance || 999999;
                const distB = b.distance || 999999;
                return distA - distB;
            });
            break;
        case 'newest':
            filteredResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'relevance':
        default:
            filteredResults = [...searchResults];
            break;
    }

    currentPage = 1;
    renderResults();
}

// Event listeners
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        refineSearch();
    }
});
