# Papelaria Online — Completo (com Admin + Frete por CEP)

Stack: Next.js 14 (App Router) + Tailwind + Prisma (SQLite) + Zustand + JWT (jose).

## Rodando
```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run seed
npm run dev
```
Abra http://localhost:3000

Para executar com Docker Compose, configure as variaveis necessarias em `.env` e rode `docker compose up --build`. O banco SQLite fica em um volume persistente; em producao, configure backups desse volume.

## Rotas principais
- `/` Home
- `/products` Catálogo com busca
- `/product/[slug]` Detalhe do produto
- `/cart` Carrinho com cálculo de frete (CEP via ViaCEP + tabela estimada)
- `/checkout` Checkout simples com criação de pedido
- `/success/[token]` Resumo privado do pedido por link aleatório

## Admin
- `/admin/login` — login (email/senha via `.env`)
- `/admin` — painel
- `/admin/products` — lista + exclusão
- `/admin/products/new` — criação
- `/admin/orders` — pedidos

O painel e as operacoes administrativas sao exclusivos do proprietario. Clientes compram como visitantes, sem criar senha ou conectar conta Google; o link privado de confirmacao do pedido deve ser guardado pelo cliente.

## Variáveis (.env)
- `ADMIN_EMAIL` e `ADMIN_PASSWORD` — credenciais
- `AUTH_SECRET` — segredo JWT com pelo menos 32 caracteres; obrigatorio em producao
- `NEXT_PUBLIC_BASE_URL` — URL publica HTTPS da loja em producao
- `DATABASE_URL` — banco de dados persistente; SQLite local nao e recomendado para deploy com multiplas instancias
- `MERCADO_PAGO_ACCESS_TOKEN` — credencial privada da conta Mercado Pago
- `MERCADO_PAGO_WEBHOOK_SECRET` — chave secreta de assinatura configurada no painel do Mercado Pago
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` — envio de atualizacoes por email

Para Gmail, use `smtp.gmail.com`, porta `465` (SSL) ou `587` (STARTTLS), seu endereço completo em `SMTP_USER` e uma **senha de app do Google** em `SMTP_PASS` (não a senha normal da conta). Ative a verificação em duas etapas e crie a senha de app na conta Google. Para qualquer outro provedor, use os dados SMTP oficiais dele.

## Observações
- O checkout valida o formato do email, mas nao confirma se a caixa postal existe ou pertence ao comprador. Nao ha conta de cliente nem senha: o cliente recebe um link aleatorio e privado para consultar o resumo do pedido.
- Use uma senha de admin aleatoria com pelo menos 20 caracteres. O projeto ignora credenciais menores para evitar a senha de exemplo anterior.
- Gere um `AUTH_SECRET` forte com `node --input-type=commonjs -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` e mantenha-o somente no `.env` do servidor.
- Configure o webhook do Mercado Pago para `https://SEU-DOMINIO/api/webhooks/mercadopago`, selecione notificacoes de pagamentos e copie a chave secreta de assinatura para `MERCADO_PAGO_WEBHOOK_SECRET`. O endpoint confere a assinatura e o valor/moeda do pedido antes de alterar pagamento ou estoque.
- Antes de aceitar pagamentos reais, configure um dominio HTTPS e credenciais de producao, e teste o ciclo completo em homologacao.
- Ao salvar pedido sem pagamento, a loja tenta enviar um email de lembrete com link privado para retomar. Se SMTP falhar, o pedido continua salvo e o cliente vê claramente que o email não foi enviado.
- O checkout de cartão deve permanecer hospedado pelo provedor de pagamento. Não colete nem armazene número completo de cartão ou código de segurança no banco da loja.
- O cálculo de frete usa consulta pública ao ViaCEP para UF e uma **tabela estimada** por região (não é contrato real com Correios).
- Você pode integrar provedores reais depois (Melhor Envio, Correios SIGEP) plugando na rota `/api/shipping/quote`.
- Informe o peso do produto **já embalado** no cadastro ou na lista do painel. Os produtos antigos recebem 0,3 kg como valor inicial até você corrigir o peso real de cada pacote.
- No cadastro, um leitor de código de barras USB/Bluetooth que funciona como teclado preenche o GTIN/EAN/UPC. Informe manualmente as unidades indicadas na caixa e quantas caixas chegaram; o estoque é calculado em unidades. Para reposições, escaneie/busque o código no painel e some caixas recebidas. O código de barras sozinho não codifica de forma confiável o conteúdo da caixa nem o nome/preço do produto.
- O frete e conferido novamente no servidor com base no CEP, peso cadastrado e quantidade; os valores continuam sendo estimativas e precisam ser substituidos por cotacao real antes de prometer prazo ou preco de transportadora.
- Configure credenciais reais do Mercado Pago e SMTP antes de habilitar pagamentos e emails em producao. Teste uma compra completa em ambiente de homologacao.
