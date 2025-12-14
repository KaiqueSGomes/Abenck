# Abenck Platform - Serviços para Condomínios

Uma plataforma moderna para conectar prestadores de serviços com condomínios em todo o Brasil.

## 🚀 Características

- **Autenticação de Usuários**: Sistema seguro de login e cadastro para pessoas físicas e empresas
- **Carrossel de Empresas Patrocinadas**: Exibe até 10 empresas patrocinadas baseadas na localização do usuário
- **Localização por CEP**: Integração com ViaCEP para buscar localização automática
- **Dashboard de Insights**: Gráficos em tempo real mostrando visualizações de perfil e cliques no WhatsApp
- **Sistema de Pagamento**: Integração com Mercado Pago para impulsionamento de perfil
- **Responsive Design**: Interface otimizada para desktop, tablet e mobile

## 📋 Pré-requisitos

- Node.js 14+ e npm
- MySQL 5.7+
- Conta no Mercado Pago (para pagamentos)

## 🔧 Instalação

### 1. Clonar o repositório

```bash
git clone <seu-repositorio>
cd abenck-platform
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=abenck_platform
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=sua_chave_secreta_muito_segura
JWT_EXPIRE=7d

# Mercado Pago Configuration
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_aqui

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CEP API (ViaCEP)
CEP_API_URL=https://viacep.com.br/ws
```

### 4. Inicializar banco de dados

```bash
npm run init-db
```

Este comando criará todas as tabelas necessárias no MySQL.

### 5. Iniciar o servidor

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
abenck-platform/
├── config/
│   ├── database.js          # Configuração do MySQL
│   └── init-db.js           # Script de inicialização do banco
├── middleware/
│   └── auth.js              # Middleware de autenticação JWT
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── companies.js         # Rotas de empresas e localização
│   ├── analytics.js         # Rotas de analytics/insights
│   └── payment.js           # Rotas de pagamento
├── public/
│   ├── index.html           # Página inicial
│   ├── auth.html            # Página de autenticação
│   ├── dashboard.html       # Dashboard da empresa
│   ├── payment-success.html # Página de sucesso de pagamento
│   ├── payment-failure.html # Página de falha de pagamento
│   ├── css/
│   │   ├── style.css        # Estilos principais
│   │   ├── auth.css         # Estilos de autenticação
│   │   └── dashboard.css    # Estilos do dashboard
│   └── js/
│       ├── utils.js         # Funções utilitárias
│       ├── auth.js          # Lógica de autenticação
│       ├── home.js          # Lógica da página inicial
│       └── dashboard.js     # Lógica do dashboard
├── server.js                # Arquivo principal do servidor
├── package.json             # Dependências do projeto
└── README.md                # Este arquivo
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação. O token é armazenado no localStorage do navegador e enviado em todas as requisições autenticadas.

### Endpoints de Autenticação

- `POST /api/auth/register/user` - Registrar pessoa física
- `POST /api/auth/register/company` - Registrar empresa
- `POST /api/auth/login` - Fazer login

## 🏢 Empresas

### Endpoints

- `GET /api/companies/:id` - Obter detalhes de uma empresa
- `POST /api/companies/search-by-region` - Buscar empresas por localização
- `POST /api/companies/sponsored` - Obter empresas patrocinadas
- `PUT /api/companies/:id` - Atualizar perfil da empresa
- `POST /api/companies/:id/whatsapp-click` - Registrar clique no WhatsApp
- `GET /api/companies/location/:cep` - Buscar localização por CEP

## 📊 Analytics

### Endpoints

- `GET /api/analytics/company/:company_id` - Obter analytics completo
- `GET /api/analytics/company/:company_id/summary` - Obter resumo dos últimos 7 dias

## 💳 Pagamento

### Endpoints

- `POST /api/payment/create-preference` - Criar preferência de pagamento
- `POST /api/payment/webhook` - Webhook do Mercado Pago
- `GET /api/payment/status/:promotion_id` - Obter status do pagamento

## 🌐 Deploy na AWS

### Usando EC2

1. **Criar instância EC2**
   - Selecionar Ubuntu 22.04 LTS
   - Configurar security groups para permitir portas 80, 443 e 3000

2. **Conectar à instância**
   ```bash
   ssh -i sua-chave.pem ubuntu@seu-ip-publico
   ```

3. **Instalar Node.js e npm**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Instalar MySQL**
   ```bash
   sudo apt-get install -y mysql-server
   ```

5. **Clonar repositório e instalar dependências**
   ```bash
   git clone seu-repositorio
   cd abenck-platform
   npm install
   ```

6. **Configurar variáveis de ambiente**
   ```bash
   nano .env
   ```

7. **Inicializar banco de dados**
   ```bash
   npm run init-db
   ```

8. **Usar PM2 para gerenciar o processo**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "abenck"
   pm2 startup
   pm2 save
   ```

9. **Configurar Nginx como reverse proxy**
   ```bash
   sudo apt-get install -y nginx
   ```

   Editar `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80 default_server;
       listen [::]:80 default_server;

       server_name seu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Reiniciar Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Usando RDS para MySQL

1. Criar instância RDS no console AWS
2. Atualizar variáveis de ambiente com os dados do RDS
3. Executar `npm run init-db`

## 🔑 Configurar Mercado Pago

1. Acessar [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Criar uma aplicação
3. Copiar o Access Token e Public Key
4. Adicionar ao arquivo `.env`
5. Configurar URLs de retorno no dashboard do Mercado Pago

## 📱 Funcionalidades Principais

### Para Usuários (Pessoas Físicas)

- Buscar serviços por categoria ou localização
- Visualizar perfil de empresas
- Clicar no WhatsApp para contato direto
- Adicionar empresas aos favoritos

### Para Empresas

- Cadastrar e gerenciar perfil
- Visualizar analytics em tempo real
- Acompanhar visualizações de perfil
- Acompanhar cliques no WhatsApp
- Impulsionar perfil para maior visibilidade
- Receber pagamentos via Mercado Pago

## 🛠️ Troubleshooting

### Erro de conexão com banco de dados

- Verificar se MySQL está rodando: `sudo systemctl status mysql`
- Verificar credenciais no `.env`
- Verificar se o banco de dados foi criado: `npm run init-db`

### Erro de autenticação

- Verificar se JWT_SECRET está configurado
- Limpar localStorage do navegador
- Fazer login novamente

### Erro de pagamento

- Verificar credenciais do Mercado Pago
- Verificar URLs de retorno configuradas
- Verificar logs do servidor

## 📞 Suporte

Para dúvidas ou problemas, entre em contato através do email ou abra uma issue no repositório.

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para conectar prestadores de serviços com condomínios.
