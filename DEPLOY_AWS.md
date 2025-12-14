# Guia de Deploy na AWS - Abenck Platform

Este guia fornece instruções passo a passo para fazer deploy da aplicação Abenck na AWS.

## 📋 Pré-requisitos

- Conta AWS ativa
- Conhecimento básico de AWS EC2, RDS e Route 53
- Domínio registrado (opcional, mas recomendado)
- Chave SSH para acesso à instância

## 🚀 Opção 1: Deploy com EC2 + RDS

### Passo 1: Criar Instância EC2

1. **Acessar AWS Console**
   - Ir para EC2 Dashboard
   - Clicar em "Launch Instance"

2. **Configurar Instância**
   - AMI: Ubuntu Server 22.04 LTS
   - Tipo: t3.small (ou maior conforme necessário)
   - VPC: Default
   - Storage: 30GB (gp3)

3. **Configurar Security Group**
   - Permitir SSH (22) de seu IP
   - Permitir HTTP (80) de qualquer lugar
   - Permitir HTTPS (443) de qualquer lugar
   - Permitir porta 3000 de qualquer lugar (temporário)

4. **Criar/Usar Key Pair**
   - Baixar arquivo .pem
   - Guardar em local seguro

### Passo 2: Criar Banco de Dados RDS

1. **Acessar RDS Dashboard**
   - Clicar em "Create database"

2. **Configurar MySQL**
   - Engine: MySQL 8.0
   - DB instance class: db.t3.micro
   - Storage: 20GB (gp2)
   - DB name: abenck_platform
   - Master username: admin
   - Master password: (senha segura)

3. **Configurar Conectividade**
   - VPC: Same as EC2
   - Public accessibility: No
   - Security group: Criar novo ou usar existente

4. **Anotar Endpoint**
   - Copiar o endpoint do RDS (será usado no .env)

### Passo 3: Conectar à Instância EC2

```bash
# Dar permissão ao arquivo .pem
chmod 400 seu-arquivo.pem

# Conectar via SSH
ssh -i seu-arquivo.pem ubuntu@seu-ip-publico
```

### Passo 4: Instalar Dependências

```bash
# Atualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar npm
sudo apt-get install -y npm

# Instalar Git
sudo apt-get install -y git

# Instalar Nginx
sudo apt-get install -y nginx

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2
```

### Passo 5: Clonar e Configurar Aplicação

```bash
# Clonar repositório
cd /home/ubuntu
git clone seu-repositorio abenck-platform
cd abenck-platform

# Instalar dependências
npm install

# Criar arquivo .env
nano .env
```

Adicionar ao `.env`:
```env
DB_HOST=seu-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=sua_senha_segura
DB_NAME=abenck_platform
DB_PORT=3306

PORT=3000
NODE_ENV=production

JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRE=7d

MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_aqui

FRONTEND_URL=https://seu-dominio.com

CEP_API_URL=https://viacep.com.br/ws
```

### Passo 6: Inicializar Banco de Dados

```bash
# Executar script de inicialização
npm run init-db
```

### Passo 7: Configurar PM2

```bash
# Iniciar aplicação com PM2
pm2 start server.js --name "abenck"

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Verificar status
pm2 status
```

### Passo 8: Configurar Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/abenck
```

Adicionar:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/abenck /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 9: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot certonly --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo systemctl enable certbot.timer
```

### Passo 10: Configurar DNS

1. Acessar seu registrador de domínio
2. Apontar A record para o IP público da instância EC2
3. Aguardar propagação DNS (até 48 horas)

## 🚀 Opção 2: Deploy com Elastic Beanstalk

### Passo 1: Preparar Aplicação

```bash
# Criar arquivo .ebextensions
mkdir -p .ebextensions
nano .ebextensions/node.config
```

Adicionar:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:autoscaling:launchconfiguration:
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
```

### Passo 2: Deploy com EB CLI

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar aplicação
eb init -p node.js-18 abenck-platform

# Criar ambiente
eb create abenck-env

# Deploy
eb deploy
```

## 📊 Monitoramento

### CloudWatch

```bash
# Ver logs
aws logs tail /aws/elasticbeanstalk/abenck-platform/var/log/eb-activity.log --follow
```

### Alertas

1. Acessar CloudWatch Dashboard
2. Criar alarmes para:
   - CPU > 80%
   - Memory > 80%
   - Erro de aplicação

## 🔄 CI/CD com GitHub Actions

Criar arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Elastic Beanstalk
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          pip install awsebcli
          eb deploy abenck-env
```

## 🔐 Segurança

- [ ] Usar HTTPS/SSL
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Habilitar VPC Flow Logs
- [ ] Usar Security Groups restritivos
- [ ] Ativar CloudTrail para auditoria
- [ ] Usar AWS Secrets Manager para credenciais
- [ ] Configurar backup automático do RDS
- [ ] Ativar Multi-AZ para RDS

## 📈 Escalabilidade

### Auto Scaling

1. Criar Launch Template
2. Criar Auto Scaling Group
3. Configurar métricas de escala:
   - CPU > 70% → aumentar
   - CPU < 30% → diminuir

### Load Balancer

1. Criar Application Load Balancer
2. Configurar target groups
3. Apontar domínio para ALB

## 💰 Estimativa de Custos

- EC2 t3.small: ~$20/mês
- RDS db.t3.micro: ~$30/mês
- Transferência de dados: ~$5/mês
- **Total estimado: ~$55/mês**

## 🆘 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs do PM2
pm2 logs abenck

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Erro de conexão com banco

```bash
# Verificar conectividade
mysql -h seu-rds-endpoint.amazonaws.com -u admin -p

# Verificar security group
# Certifique-se que EC2 pode acessar RDS na porta 3306
```

### Certificado SSL inválido

```bash
# Renovar certificado
sudo certbot renew --dry-run
sudo certbot renew
```

## 📞 Suporte AWS

- AWS Support Center: https://console.aws.amazon.com/support
- AWS Documentation: https://docs.aws.amazon.com
- AWS Forums: https://forums.aws.amazon.com

## ✅ Checklist de Deploy

- [ ] Instância EC2 criada e rodando
- [ ] RDS MySQL criado e acessível
- [ ] Aplicação clonada e dependências instaladas
- [ ] Arquivo .env configurado corretamente
- [ ] Banco de dados inicializado
- [ ] PM2 configurado e aplicação rodando
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/TLS configurado
- [ ] DNS apontando para instância
- [ ] Testes básicos passando
- [ ] Monitoramento configurado
- [ ] Backups configurados
