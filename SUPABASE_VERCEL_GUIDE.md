# 🚀 Guia Completo de Implantação no Vercel & Supabase
### Projeto: Copa Astão / Aston Vina — Álbum Digital de Figurinhas

Este guia contém todas as instruções passo a passo para você rodar a aplicação gratuitamente utilizando **Vercel** (para hospedagem e serverless) e **Supabase** (para banco de dados PostgreSQL e armazenamento de imagens).

---

## 📦 1. Configurando o Banco de Dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta ou faça login.
2. Clique em **"New Project"** (Novo Projeto) e defina um nome (ex: `copa-astao-album`) e uma senha forte para o banco de dados.
3. Aguarde o projeto terminar de ser provisionado (~1 minuto).
4. No menu lateral, acesse **SQL Editor**.
5. Clique em **"New query"**, cole todo o conteúdo do arquivo `supabase_schema.sql` (que está na raiz deste projeto) e clique no botão **"Run"**.
6. **Configuração de Armazenamento (Storage):**
   - Acesse **Storage** no menu lateral.
   - Crie os seguintes Buckets definindo-os como **Public** (Público):
     - `banner`
     - `logos`
     - `stickers`
     - `players`
     - `teams`
     - `backgrounds`
     - `albums`
7. **Obter Chaves de API:**
   - Acesse **Project Settings** > **API**.
   - Guarde os seguintes valores:
     - **Project URL** (ex: `https://xxxx.supabase.co`)
     - **`anon` `public` key**
     - **`service_role` `secret` key**

---

## ⚡ 2. Publicando no Vercel

1. Suba este repositório para o seu **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
3. Clique em **"Add New..." > "Project"** e selecione o repositório deste projeto.
4. Na tela de configuração do projeto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expanda a seção **Environment Variables** (Variáveis de Ambiente) e adicione:

| Chave | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Chave pública Anon do Supabase |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | URL do seu projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Chave privada Service Role do Supabase |
| `NODE_ENV` | `production` | Ambiente de produção |

6. Clique em **Deploy**.

---

## ⚙️ 3. Estrutura do Arquivo `vercel.json`

O projeto já inclui o arquivo `vercel.json` pronto na raiz com a seguinte estrutura de roteamento e Serverless Functions:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/uploads/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ✅ Pronto!

Sua aplicação estará no ar rodando no Vercel com banco e imagens integrados ao Supabase!
Caso precise alterar configurações como o **Banner de Premiações**, contagem regressiva ou cadastrar jogadores, acesse o painel administrativo da aplicação diretamente no site implantado.
