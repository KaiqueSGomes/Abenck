# Guia de Testes - Abenck Platform

Este documento descreve como testar todas as funcionalidades da plataforma Abenck.

## 🧪 Testes Manuais

### 1. Autenticação

#### Teste de Registro - Pessoa Física
1. Acessar `http://localhost:3000/auth.html`
2. Clicar na aba "Cadastro - Pessoa"
3. Preencher formulário com:
   - Nome: João Silva
   - CPF: 123.456.789-00
   - Email: joao@example.com
   - Telefone: (11) 98765-4321
   - Senha: senha123
4. Clicar em "Cadastrar"
5. Verificar se foi redirecionado para a página inicial

#### Teste de Registro - Empresa
1. Acessar `http://localhost:3000/auth.html`
2. Clicar na aba "Cadastro - Empresa"
3. Preencher formulário com:
   - Razão Social: Empresa XYZ LTDA
   - CNPJ: 12.345.678/0001-90
   - Categoria: Elétrica
   - Email: empresa@example.com
   - Telefone: (11) 3456-7890
   - WhatsApp: (11) 98765-4321
   - Senha: senha123
4. Clicar em "Cadastrar Empresa"
5. Verificar se foi redirecionado para o dashboard

#### Teste de Login
1. Acessar `http://localhost:3000/auth.html`
2. Clicar na aba "Entrar"
3. Usar credenciais criadas anteriormente
4. Verificar se faz login corretamente

### 2. Página Inicial

#### Teste do Carrossel
1. Acessar `http://localhost:3000`
2. Verificar se o carrossel está exibindo empresas patrocinadas
3. Clicar nos botões de navegação (← →)
4. Verificar se as imagens mudam
5. Aguardar 5 segundos para verificar auto-rotação

#### Teste de Busca
1. Digitar uma categoria na barra de busca (ex: "Elétrica")
2. Clicar em "Buscar"
3. Verificar se é redirecionado para a página de resultados
4. Verificar se os resultados correspondem à busca

#### Teste de Localização
1. Abrir console do navegador (F12)
2. Verificar se há permissão de localização
3. Permitir acesso à localização
4. Verificar se as empresas são filtradas por região

### 3. Dashboard da Empresa

#### Teste de Visão Geral
1. Fazer login como empresa
2. Verificar se os dados de visualizações e cliques aparecem
3. Verificar se a taxa de conversão é calculada corretamente

#### Teste de Analytics
1. Clicar em "Analytics" no menu
2. Verificar se os gráficos de linha e pizza aparecem
3. Verificar se a tabela de detalhes está preenchida
4. Verificar se os dados correspondem aos gráficos

#### Teste de Perfil
1. Clicar em "Perfil da Empresa"
2. Preencher/editar informações
3. Clicar em "Salvar Alterações"
4. Verificar mensagem de sucesso
5. Recarregar página e verificar se dados foram salvos

#### Teste de Impulsionamento
1. Clicar em "Impulsionar"
2. Verificar se os planos de preço aparecem
3. Clicar em "Impulsionar Agora" de um plano
4. Verificar se é redirecionado para Mercado Pago (ou simulador)

### 4. Página de Empresa

#### Teste de Detalhes
1. Acessar `http://localhost:3000/company.html?id=1`
2. Verificar se todas as informações da empresa aparecem
3. Verificar se o botão de WhatsApp funciona
4. Verificar se o botão de favorito funciona

#### Teste de Favoritos
1. Clicar no botão de favorito
2. Verificar se o botão muda de cor
3. Recarregar página
4. Verificar se o estado do favorito é mantido

### 5. Página de Busca

#### Teste de Resultados
1. Fazer uma busca na página inicial
2. Verificar se os resultados aparecem
3. Testar ordenação por "Melhor Avaliação"
4. Testar ordenação por "Mais Próximo"
5. Testar paginação

#### Teste de Filtros
1. Refinar busca com um termo
2. Verificar se os resultados são filtrados
3. Limpar filtro
4. Verificar se todos os resultados aparecem novamente

## 🔧 Testes de API

### Teste de Autenticação

```bash
# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "full_name": "Teste User",
    "cpf": "12345678900",
    "phone": "11987654321"
  }'

# Registrar empresa
curl -X POST http://localhost:3000/api/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "empresa@example.com",
    "password": "senha123",
    "company_name": "Empresa Teste",
    "cnpj": "12345678000190",
    "phone": "1134567890",
    "whatsapp": "11987654321",
    "category": "Elétrica"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "empresa@example.com",
    "password": "senha123"
  }'
```

### Teste de Empresas

```bash
# Buscar empresa por ID
curl http://localhost:3000/api/companies/1

# Buscar empresas por região
curl -X POST http://localhost:3000/api/companies/search-by-region \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -23.5505,
    "longitude": -46.6333,
    "category": "Elétrica"
  }'

# Buscar empresas patrocinadas
curl -X POST http://localhost:3000/api/companies/sponsored \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -23.5505,
    "longitude": -46.6333
  }'
```

### Teste de Analytics

```bash
# Obter analytics da empresa
curl http://localhost:3000/api/analytics/company/1 \
  -H "Authorization: Bearer SEU_TOKEN"

# Obter resumo
curl http://localhost:3000/api/analytics/company/1/summary \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📊 Checklist de Testes

- [ ] Registro de pessoa física funciona
- [ ] Registro de empresa funciona
- [ ] Login funciona para ambos os tipos
- [ ] Carrossel exibe empresas patrocinadas
- [ ] Busca por categoria funciona
- [ ] Localização por CEP funciona
- [ ] Dashboard exibe dados corretos
- [ ] Gráficos de analytics aparecem
- [ ] Perfil da empresa pode ser editado
- [ ] Impulsionamento redireciona para Mercado Pago
- [ ] Página de empresa exibe informações corretas
- [ ] Favoritos são salvos no localStorage
- [ ] Busca filtra resultados corretamente
- [ ] Paginação funciona
- [ ] Responsividade em mobile funciona
- [ ] Todas as mensagens de erro aparecem
- [ ] Validação de formulários funciona

## 🐛 Bugs Conhecidos

Nenhum no momento.

## 📝 Notas

- Certifique-se de que o MySQL está rodando antes de testar
- Limpe o localStorage do navegador entre testes se necessário
- Use dados de teste realistas para melhor validação
- Verifique o console do navegador para erros de JavaScript

## 🔐 Testes de Segurança

- [ ] Tokens JWT expiram corretamente
- [ ] Usuários não autenticados não podem acessar rotas protegidas
- [ ] Senhas são hasheadas corretamente
- [ ] CORS está configurado corretamente
- [ ] Validação de entrada está funcionando
