let currentUser = null;
let companyId = null;
let lineChart = null;
let pieChart = null;

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const token = getToken();
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    currentUser = getUser();
    if (!currentUser || currentUser.type !== 'company') {
        window.location.href = '/auth.html';
        return;
    }

    companyId = currentUser.company_id;

    // Setup menu
    setupMenu();

    // Carregar dados
    await loadOverviewData();
    await loadAnalyticsData();
    await loadProfileData();
    await loadPromotionData();
});

// Setup menu de navegação
function setupMenu() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Alternar abas
function switchTab(tabName) {
    // Remove active de todos os items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Adiciona active ao item clicado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Carregar dados de overview
async function loadOverviewData() {
    try {
        const response = await fetchWithAuth(
            `${API_URL}/analytics/company/${companyId}/summary`
        );

        if (!response || !response.ok) {
            console.error('Error loading overview data');
            return;
        }

        const data = await response.json();

        document.getElementById('totalViews').textContent = data.totalViews || 0;
        document.getElementById('totalClicks').textContent = data.totalClicks || 0;

        const conversionRate = data.totalViews > 0
            ? ((data.totalClicks / data.totalViews) * 100).toFixed(1)
            : 0;
        document.getElementById('conversionRate').textContent = conversionRate + '%';
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

// Carregar dados de analytics
async function loadAnalyticsData() {
    try {
        const response = await fetchWithAuth(
            `${API_URL}/analytics/company/${companyId}`
        );

        if (!response || !response.ok) {
            console.error('Error loading analytics data');
            return;
        }

        const data = await response.json();

        // Preparar dados para gráficos
        const labels = data.chartData.map(item => formatDate(item.date));
        const viewsData = data.chartData.map(item => item.views);
        const clicksData = data.chartData.map(item => item.clicks);

        // Gráfico de linha
        createLineChart(labels, viewsData, clicksData);

        // Gráfico de pizza
        createPieChart(data.totalViews, data.totalClicks);

        // Tabela de detalhes
        populateAnalyticsTable(data.analytics);
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Criar gráfico de linha
function createLineChart(labels, viewsData, clicksData) {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;

    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Visualizações',
                    data: viewsData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Cliques',
                    data: clicksData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Criar gráfico de pizza
function createPieChart(totalViews, totalClicks) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    if (pieChart) {
        pieChart.destroy();
    }

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Visualizações', 'Cliques'],
            datasets: [
                {
                    data: [totalViews, totalClicks],
                    backgroundColor: ['#667eea', '#2ecc71'],
                    borderColor: '#fff',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// Preencher tabela de analytics
function populateAnalyticsTable(analytics) {
    const tbody = document.getElementById('analyticsTableBody');
    if (!tbody) return;

    if (analytics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum dado disponível</td></tr>';
        return;
    }

    tbody.innerHTML = analytics.map(item => {
        const conversionRate = item.profile_views > 0
            ? ((item.whatsapp_clicks / item.profile_views) * 100).toFixed(1)
            : 0;

        return `
            <tr>
                <td>${formatDate(item.date)}</td>
                <td>${item.profile_views}</td>
                <td>${item.whatsapp_clicks}</td>
                <td>${conversionRate}%</td>
            </tr>
        `;
    }).join('');
}

// Carregar dados do perfil
async function loadProfileData() {
    try {
        const response = await fetchWithAuth(`${API_URL}/companies/${companyId}`);

        if (!response || !response.ok) {
            console.error('Error loading profile data');
            return;
        }

        const data = await response.json();
        const company = data.company;

        document.getElementById('companyNameDisplay').textContent = company.company_name;
        document.getElementById('companyName').value = company.company_name;
        document.getElementById('companyCategory').value = company.category || '';
        document.getElementById('companyDescription').value = company.description || '';
        document.getElementById('companyPhone').value = company.phone || '';
        document.getElementById('companyWhatsapp').value = company.whatsapp || '';
        document.getElementById('companyAddress').value = company.address || '';
        document.getElementById('companyCEP').value = company.zip_code || '';
        document.getElementById('companyCity').value = company.city || '';
        document.getElementById('companyState').value = company.state || '';
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Salvar perfil
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        company_name: document.getElementById('companyName').value,
        category: document.getElementById('companyCategory').value,
        description: document.getElementById('companyDescription').value,
        phone: document.getElementById('companyPhone').value,
        whatsapp: document.getElementById('companyWhatsapp').value,
        address: document.getElementById('companyAddress').value,
        zip_code: document.getElementById('companyCEP').value,
        city: document.getElementById('companyCity').value,
        state: document.getElementById('companyState').value
    };

    const messageDiv = document.getElementById('profileMessage');

    try {
        const response = await fetchWithAuth(
            `${API_URL}/companies/${companyId}`,
            {
                method: 'PUT',
                body: JSON.stringify(formData)
            }
        );

        if (!response || !response.ok) {
            messageDiv.textContent = 'Erro ao salvar alterações';
            messageDiv.className = 'form-message error';
            return;
        }

        messageDiv.textContent = 'Perfil atualizado com sucesso!';
        messageDiv.className = 'form-message success';

        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    } catch (error) {
        messageDiv.textContent = 'Erro ao salvar alterações';
        messageDiv.className = 'form-message error';
        console.error('Error saving profile:', error);
    }
});

// Carregar dados de promoção
async function loadPromotionData() {
    try {
        const response = await fetchWithAuth(`${API_URL}/companies/${companyId}`);

        if (!response || !response.ok) {
            return;
        }

        const data = await response.json();
        const company = data.company;

        // Verificar se tem promoção ativa
        if (company.is_verified) {
            document.getElementById('sponsorshipStatus').textContent = 'Ativo';
            document.getElementById('promotionActive').style.display = 'block';

            // Aqui você pode adicionar mais detalhes da promoção
        }
    } catch (error) {
        console.error('Error loading promotion data:', error);
    }
}

// Iniciar pagamento
async function startPayment(amount) {
    try {
        const response = await fetchWithAuth(
            `${API_URL}/payment/create-preference`,
            {
                method: 'POST',
                body: JSON.stringify({
                    company_id: companyId,
                    amount: amount,
                    duration_days: amount === 59.99 ? 30 : amount === 149.99 ? 90 : 180
                })
            }
        );

        if (!response || !response.ok) {
            alert('Erro ao criar preferência de pagamento');
            return;
        }

        const data = await response.json();

        // Mostrar modal
        document.getElementById('paymentModal').classList.add('active');

        // Redirecionar para Mercado Pago
        setTimeout(() => {
            window.location.href = data.init_point;
        }, 2000);
    } catch (error) {
        alert('Erro ao iniciar pagamento');
        console.error('Payment error:', error);
    }
}

// Fechar modal de pagamento
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

// Formatar CEP ao sair do campo
document.getElementById('companyCEP')?.addEventListener('blur', async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const location = await getLocationByCEP(cep);
            if (location) {
                document.getElementById('companyAddress').value = location.address || '';
                document.getElementById('companyCity').value = location.city || '';
                document.getElementById('companyState').value = location.state || '';
            }
        } catch (error) {
            console.error('Error looking up CEP:', error);
        }
    }
});
