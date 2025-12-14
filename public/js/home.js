// Dados de categorias
const categories = [
    { name: 'Elétrica', icon: '⚡' },
    { name: 'Hidráulica', icon: '💧' },
    { name: 'CFTV', icon: '📹' },
    { name: 'Limpeza', icon: '🧹' },
    { name: 'Portões', icon: '🚪' },
    { name: 'AVCB', icon: '🚒' },
    { name: 'Manutenção', icon: '🔧' },
    { name: 'Pintura', icon: '🎨' }
];

const popularItems = [
    'Limpeza pós-obra',
    'Manutenção de portão',
    'Reparo elétrico',
    'Desentupimento'
];

// Estado do carrossel
const carouselState = {
  currentSlide: 0,
  companies: [],
  autoSlideInterval: null
};

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    renderCategories();
    renderPopularItems();
    await loadSponsoredCompanies();
    setupSearch();
});

// Renderizar categorias
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="searchByCategory('${cat.name}')">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
}

// Renderizar itens populares
function renderPopularItems() {
    const list = document.getElementById('popularList');
    list.innerHTML = popularItems.map(item => `
        <div class="popular-item" onclick="searchByCategory('${item}')">
            <div class="popular-item-title">• ${item}</div>
        </div>
    `).join('');
}

// Carregar empresas patrocinadas
async function loadSponsoredCompanies() {
    try {
        let location = { latitude: -23.5505, longitude: -46.6333 };

        try {
            location = await getUserLocation();
        } catch (error) {
            console.log('Usando localização padrão');
        }

        const response = await fetch(`${API_URL}/companies/sponsored`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude
            })
        });

        const data = await response.json();
        carouselState.companies = data.companies || [];
        
        if (carouselState.companies.length > 0) {
            renderCarousel();
            startAutoSlide();
        }
    } catch (error) {
        console.error('Error loading sponsored companies:', error);
    }
}

// Renderizar carrossel
function renderCarousel() {
    const carousel = document.getElementById('carousel');
    const indicators = document.getElementById('indicators');
    
    if (!carousel || !indicators) {
        console.warn('Carousel elements not found');
        return;
    }
    
    carousel.innerHTML = '';
    indicators.innerHTML = '';

    carouselState.companies.forEach((company, index) => {
        const card = document.createElement('div');
        card.className = 'carousel-item';
        card.style.minWidth = '100%';
        card.style.width = '100%';
        card.style.flexShrink = '0';
        
        card.innerHTML = `
            <div class="carousel-item-logo">${company.company_name.charAt(0).toUpperCase()}</div>
            <div class="carousel-item-content">
                <div class="carousel-item-category">${company.category || 'Serviço'}</div>
                <h3 class="carousel-item-name">${company.company_name}</h3>
                <div class="carousel-item-rating">
                    <span class="stars">★ ${parseFloat(company.rating) || 4.9}</span>
                    <span>• ${company.city || 'São Paulo'}</span>
                </div>
                <div class="carousel-item-badge">PATROCINADO</div>
                <p class="carousel-item-description">${truncateText(company.description, 150)}</p>
                <div class="carousel-item-buttons">
                    <a href="https://wa.me/${company.whatsapp.replace(/\D/g, '' )}" class="btn-whatsapp" target="_blank">💬 WhatsApp</a>
                    <a href="/company.html?id=${company.id}" class="btn-view">Ver Perfil</a>
                </div>
            </div>
        `;
        carousel.appendChild(card);

        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.style.cursor = 'pointer';
        indicator.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });
    
    updateCarousel();
}

// Atualizar carrossel
function updateCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    
    const offset = carouselState.currentSlide * -100;
    carousel.style.transform = `translateX(${offset}%)`;

    document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === carouselState.currentSlide);
    });
}

// Ir para slide específico
function goToSlide(index) {
    carouselState.currentSlide = index;
    updateCarousel();
    stopAutoSlide();
    startAutoSlide();
}

// Próximo slide
function nextSlide() {
    if (carouselState.companies.length === 0) return;
    carouselState.currentSlide = (carouselState.currentSlide + 1) % carouselState.companies.length;
    updateCarousel();
}

// Slide anterior
function prevSlide() {
    if (carouselState.companies.length === 0) return;
    carouselState.currentSlide = (carouselState.currentSlide - 1 + carouselState.companies.length) % carouselState.companies.length;
    updateCarousel();
}

// Iniciar auto-slide
function startAutoSlide() {
    if (carouselState.companies.length <= 1) return;
    carouselState.autoSlideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

// Parar auto-slide
function stopAutoSlide() {
    clearInterval(carouselState.autoSlideInterval);
}

// Eventos do carrossel
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.carousel-section')) {
        stopAutoSlide();
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.carousel-section')) {
        startAutoSlide();
    }
});

// Setup busca
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-section .btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value;
            if (query) {
                searchByCategory(query);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value;
                if (query) {
                    searchByCategory(query);
                }
            }
        });
    }
}

// Buscar por categoria
async function searchByCategory(category) {
    try {
        let location = { latitude: -23.5505, longitude: -46.6333 };

        try {
            location = await getUserLocation();
        } catch (error) {
            console.log('Usando localização padrão');
        }

        const response = await fetch(`${API_URL}/companies/search-by-region`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude,
                category: category
            })
        });

        const data = await response.json();

        sessionStorage.setItem('searchResults', JSON.stringify(data.companies));
        sessionStorage.setItem('searchCategory', category);

        window.location.href = '/search.html';
    } catch (error) {
        console.error('Search error:', error);
        alert('Erro ao buscar empresas');
    }
}

// Ver perfil da empresa
function viewCompany(companyId) {
    window.location.href = `/company.html?id=${companyId}`;
}
