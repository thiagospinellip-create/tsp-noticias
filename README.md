# TSP.MMIII — Automatizador de Notícias

Robô que busca as notícias mais relevantes sobre os temas do **tspmmiii.com** — **História, Geopolítica, Negócios & Economia, Filosofia, Cinema e Medicina** — e gera um feed JSON atualizado automaticamente. Tudo roda na nuvem (GitHub Actions), **sem depender do seu computador ficar ligado**.

## Como funciona

```
[GitHub Actions — cron a cada 6h]
        │
        ▼
[src/generate.mjs]  busca RSS (Google Notícias + G1, BBC Brasil, Folha, Poder360, CNN Brasil, Agência Brasil)
        │  → pontua relevância por palavras-chave de cada tema
        │  → remove duplicatas e itens antigos
        ▼
[docs/feed.json]  gerado e publicado no GitHub Pages
        │
        ▼
[Widget no site]  <div data-tsp-noticias> puxa o feed e renderiza as notícias
```

- **Fontes:** RSS públicos em português (sem chave de API, gratuito).
- **Relevância:** cada notícia é pontuada contra listas de palavras-chave de cada tema. Frases contam mais que palavras soltas.
- **Hospedagem:** GitHub Pages (que já serve `Access-Control-Allow-Origin: *`, permitindo o fetch no navegador).
- **Custo:** R$ 0 (plano gratuito do GitHub).

---

## Passo a passo (≈ 10 minutos)

### 1. Crie o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new).
2. Dê um nome, ex.: `tsp-noticias`.
3. Marque **Public** (o plano gratuito exige repositório público para GitHub Pages).
4. **Não** inicialize com README (vamos subir os arquivos daqui).

Depois de criar, siga o passo **"…or push an existing repository from the command line"** que o GitHub mostra. No terminal, dentro desta pasta:

```bash
git init
git add .
git commit -m "chore: automatizador de notícias"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/tsp-noticias.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.

### 2. Ative o GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta **/docs**.
4. Salve. Em alguns segundos o site estará em:

   ```
   https://SEU_USUARIO.github.io/tsp-noticias/
   ```

Você verá a página de demonstração já com as notícias (a primeira execução roda automaticamente ao subir o código).

### 3. Verifique a primeira execução

- Vá em **Actions** no repositório. O workflow **"Atualizar notícias"** já deve ter rodado (disparado pelo `push`).
- Se quiser forçar uma execução: **Actions → Atualizar notícias → Run workflow → Run workflow**.

O feed estará em:

```
https://SEU_USUARIO.github.io/tsp-noticias/feed.json
```

### 4. Cole o widget no seu site (tspmmiii.com)

Adicione este trecho onde quiser que as notícias apareçam (substituindo `SEU_USUARIO`):

```html
<div data-tsp-noticias
     data-feed="https://SEU_USUARIO.github.io/tsp-noticias/feed.json"
     data-limit="5"></div>
<script src="https://SEU_USUARIO.github.io/tsp-noticias/widget/noticias.js" defer></script>
```

O widget vem com visual escuro/dourado combinando com o TSP.MMIII.

#### Opções do widget

| Atributo | Função | Exemplo |
|---|---|---|
| `data-feed` | URL do feed.json | `https://.../feed.json` |
| `data-topic` | Mostrar só um tema | `data-topic="geopolitica"` |
| `data-limit` | Itens por tema (padrão 5) | `data-limit="3"` |
| `data-theme-light` | Tema claro (opcional) | `data-theme-light` |

Temas disponíveis: `historia`, `geopolitica`, `negocios`, `filosofia`, `cinema`, `medicina`.

#### Integração com React/Vite (o site atual)

Como o tspmmiii.com é uma SPA, o jeito mais simples é montar o widget após a página carregar. Exemplo de componente:

```jsx
import { useEffect, useRef } from 'react';

export function Noticias() {
  const ref = useRef(null);
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://SEU_USUARIO.github.io/tsp-noticias/widget/noticias.js';
    s.async = true;
    s.onload = () => window.TSPNoticias?.mount(ref.current);
    document.body.appendChild(s);
    return () => s.remove();
  }, []);
  return (
    <div
      ref={ref}
      data-tsp-noticias
      data-feed="https://SEU_USUARIO.github.io/tsp-noticias/feed.json"
      data-limit="5"
    />
  );
}
```

---

## Personalizando

### Temas e palavras-chave
Edite **`config.mjs`** — ali estão os 6 temas, as palavras-chave de cada um e as buscas do Google Notícias.

### Fontes
Em `config.mjs`, a lista `extraFeeds` contém os RSS fixos (BBC Brasil, G1, Folha, Poder360, CNN Brasil, Agência Brasil). Adicione ou remova URLs à vontade.

### Frequência
Em **`.github/workflows/news.yml`**, mude a linha `cron`. Padrão: a cada 6 horas (`0 */6 * * *`).

- A cada 3 horas: `0 */3 * * *`
- A cada 12 horas: `0 */12 * * *`
- Uma vez por dia (às 8h UTC): `0 8 * * *`

### Rodar localmente (opcional, só para testes)

```bash
npm install
npm start
```

Isso gera `docs/feed.json` na sua máquina.

---

## Perguntas frequentes

**Preciso deixar o computador ligado?**
Não. O GitHub Actions executa o script nos servidores do GitHub, no horário agendado.

**É de graça?**
Sim. O plano gratuito do GitHub inclui minutos de Actions suficientes (o robô roda poucos minutos por dia) e GitHub Pages em repositório público.

**Por que o repositório precisa ser público?**
O GitHub Pages gratuito exige repositório público. O código não tem segredos (nenhuma chave de API), então isso é seguro. Se quiser privado, é preciso assinatura GitHub Pro.

**As notícias são 100% automáticas?**
Sim. O robô escolhe por relevância (palavras-chave). Você pode afinar as listas em `config.mjs` para deixar a curadoria mais precisa.

**Posso usar no WhatsApp/Telegram/e-mail depois?**
Sim. O `feed.json` é uma API pública: qualquer outro sistema pode consumi-lo.

---

## Sobre as fontes

As notícias vêm de feeds RSS públicos (Google Notícias, BBC Brasil, G1, Folha de S.Paulo, Poder360, CNN Brasil e Agência Brasil). Cada link abre a matéria original no veículo. O uso é para curadoria pessoal do seu site.
