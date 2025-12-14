let companyId = null;
let company = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID da empresa da URL
    const params = new URLSearchParams(window.location.search);
    companyId = params.get('id');

    if (!companyId) {
        window.location.href = '/index.html';
        return;
    }

    // Carregar dados da empresa
    await loadCompanyData();
});

// Carregar dados da empresa
async function loadCompanyData() {
    try {
        const response = await fetch(`${API_URL}/companies/${companyId}`);

        if (!response.ok) {
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        company = data.company;

        // Renderizar dados
        renderCompanyData();

        // Mostrar conteúdo e esconder loading
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('companyDetail').style.display = 'block';
    } catch (error) {
        console.error('Error loading company data:', error);
        window.location.href = '/index.html';
    }
}

// Renderizar dados da empresa
function renderCompanyData() {
    // Logo
    const firstLetter = company.company_name.charAt(0).toUpperCase();
    document.getElementById('companyLogoLarge').textContent = firstLetter;

    // Nome
    document.getElementById('companyNameDetail').textContent = company.company_name;

    // Rating
    const rating = company.rating || 4.9;
    document.getElementById('companyRatingValue').textContent = rating;
    document.getElementById('companyRatingStars').textContent = generateStars(rating);

    // Localização
    const location = company.city || 'São Paulo';
    const state = company.state || 'SP';
    document.getElementById('companyLocationDetail').textContent = `${location}, ${state}`;

    // Badge de patrocínio
    if (company.is_verified) {
        document.getElementById('sponsorshipBadge').style.display = 'block';
    }

    // Descrição
    document.getElementById('companyDescription').textContent =
        company.description || 'Empresa de serviços de qualidade para condomínios';

    // Contato
    document.getElementById('companyPhoneDetail').textContent = company.phone || '-';
    document.getElementById('companyCategoryDetail').textContent = company.category || '-';
    document.getElementById('companyAddressDetail').textContent =
        `${company.address || '-'}, ${company.city || '-'}, ${company.state || '-'}`;

    // WhatsApp
    const whatsappNumber = company.whatsapp || '5511999999999';
    const whatsappLink = `https://wa.me/${whatsappNumber}`;

    document.getElementById('whatsappButton').href = whatsappLink;
    document.getElementById('sidebarWhatsappButton').href = whatsappLink;
    document.getElementById('companyWhatsappLink').href = whatsappLink;

    // Telefone
    const phoneLink = `tel:${company.phone || ''}`;
    document.getElementById('sidebarPhoneButton').href = phoneLink;
    document.getElementById('sidebarPhoneButton').textContent = `📞 ${company.phone || 'Ligar'}`;

    // Botões de favorito
    setupFavoriteButtons();

    // Carregar avaliações
    loadReviews();
}

// Gerar estrelas
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);

    if (hasHalfStar) {
        stars += '½';
    }

    stars += '☆'.repeat(5 - Math.ceil(rating));

    return stars;
}

// Setup botões de favorito
function setupFavoriteButtons() {
    const favoriteButton = document.getElementById('favoriteButton');
    const sidebarFavoriteButton = document.getElementById('sidebarFavoriteButton');

    // Verificar se está nos favoritos
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorited = favorites.includes(companyId);

    if (isFavorited) {
        favoriteButton.classList.add('active');
        sidebarFavoriteButton.classList.add('active');
    }

    // Adicionar event listeners
    favoriteButton.addEventListener('click', toggleFavorite);
    sidebarFavoriteButton.addEventListener('click', toggleFavorite);
}

// Toggle favorito
function toggleFavorite(e) {
    e.preventDefault();

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(companyId);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(companyId);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Atualizar UI
    const isFavorited = favorites.includes(companyId);
    document.getElementById('favoriteButton').classList.toggle('active', isFavorited);
    document.getElementById('sidebarFavoriteButton').classList.toggle('active', isFavorited);
}

// Carregar avaliações
async function loadReviews() {
    // Por enquanto, mostrar mensagem de nenhuma avaliação
    // Você pode integrar com um endpoint de reviews no futuro
    const reviewsList = document.getElementById('reviewsList');

    // Exemplo de como seria com dados reais:
    /*
    const reviews = [
        {
            author: 'João Silva',
            rating: 5,
            date: '2024-01-15',
            text: 'Excelente serviço, muito profissional!'
        },
        {
            author: 'Maria Santos',
            rating: 4,
            date: '2024-01-10',
            text: 'Bom atendimento, recomendo!'
        }
    ];

    if (reviews.length > 0) {
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div>
                        <div class="review-author">${review.author}</div>
                        <div class="review-rating">${generateStars(review.rating)}</div>
                    </div>
                    <div class="review-date">${formatDate(review.date)}</div>
                </div>
                <div class="review-text">${review.text}</div>
            </div>
        `).join('');
    }
    */
}

// Registrar clique no WhatsApp
document.getElementById('whatsappButton')?.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/companies/${companyId}/whatsapp-click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error registering WhatsApp click:', error);
    }
});

document.getElementById('sidebarWhatsappButton')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/companies/${companyId}/whatsapp-click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Redirecionar para WhatsApp
        const whatsappNumber = company.whatsapp || '5511999999999';
        window.location.href = `https://wa.me/${whatsappNumber}`;
    } catch (error) {
        console.error('Error registering WhatsApp click:', error);
    }
});
