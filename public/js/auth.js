// API base URL
const API_URL = window.location.origin + '/api';

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Login Form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            messageDiv.textContent = data.error || 'Erro ao fazer login';
            messageDiv.className = 'form-message error';
            return;
        }
        
        // Salvar token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirecionar
        if (data.user.type === 'company') {
            window.location.href = '/dashboard.html';
        } else {
            window.location.href = '/index.html';
        }
    } catch (error) {
        messageDiv.textContent = 'Erro ao conectar com o servidor';
        messageDiv.className = 'form-message error';
        console.error('Login error:', error);
    }
});

// Register User Form
document.getElementById('registerUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        full_name: document.getElementById('userFullName').value,
        cpf: document.getElementById('userCPF').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        password: document.getElementById('userPassword').value
    };
    
    const messageDiv = document.getElementById('registerUserMessage');
    
    try {
        const response = await fetch(`${API_URL}/auth/register/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            messageDiv.textContent = data.error || 'Erro ao registrar';
            messageDiv.className = 'form-message error';
            return;
        }
        
        // Salvar token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        messageDiv.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        messageDiv.className = 'form-message success';
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    } catch (error) {
        messageDiv.textContent = 'Erro ao conectar com o servidor';
        messageDiv.className = 'form-message error';
        console.error('Registration error:', error);
    }
});

// Register Company Form
document.getElementById('registerCompanyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        company_name: document.getElementById('companyName').value,
        cnpj: document.getElementById('companyCNPJ').value,
        category: document.getElementById('companyCategory').value,
        email: document.getElementById('companyEmail').value,
        phone: document.getElementById('companyPhone').value,
        whatsapp: document.getElementById('companyWhatsapp').value,
        password: document.getElementById('companyPassword').value
    };
    
    const messageDiv = document.getElementById('registerCompanyMessage');
    
    try {
        const response = await fetch(`${API_URL}/auth/register/company`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            messageDiv.textContent = data.error || 'Erro ao registrar empresa';
            messageDiv.className = 'form-message error';
            return;
        }
        
        // Salvar token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        messageDiv.textContent = 'Empresa cadastrada com sucesso! Redirecionando...';
        messageDiv.className = 'form-message success';
        
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 2000);
    } catch (error) {
        messageDiv.textContent = 'Erro ao conectar com o servidor';
        messageDiv.className = 'form-message error';
        console.error('Registration error:', error);
    }
});

// Formatar CPF
document.getElementById('userCPF')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
        value = value.slice(0, 3) + '.' + value.slice(3, 6) + '.' + value.slice(6, 9) + '-' + value.slice(9);
    } else if (value.length > 6) {
        value = value.slice(0, 3) + '.' + value.slice(3, 6) + '.' + value.slice(6);
    } else if (value.length > 3) {
        value = value.slice(0, 3) + '.' + value.slice(3);
    }
    
    e.target.value = value;
});

// Formatar CNPJ
document.getElementById('companyCNPJ')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    if (value.length > 12) {
        value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8, 12) + '-' + value.slice(12);
    } else if (value.length > 8) {
        value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8);
    } else if (value.length > 5) {
        value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
    } else if (value.length > 2) {
        value = value.slice(0, 2) + '.' + value.slice(2);
    }
    
    e.target.value = value;
});

// Formatar telefone
function formatPhone(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
        value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7);
    } else if (value.length > 2) {
        value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
    }
    
    return value;
}

document.getElementById('userPhone')?.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
});

document.getElementById('companyPhone')?.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
});

document.getElementById('companyWhatsapp')?.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
});
