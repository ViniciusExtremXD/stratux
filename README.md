# Stratux Consultoria Empresarial — site

Substitui o Google Sites em `stratuxconsultoria.com.br`. Astro estático, design
system próprio em CSS puro, motor de movimento sem biblioteca externa, zero
JavaScript de terceiro.

## Rodar

```bash
npm install
npm run dev
```

```bash
npm run build
```

No Git Bash, para build com subcaminho (GitHub Pages de projeto):

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/stratux npm run build
```

O `MSYS_NO_PATHCONV=1` é obrigatório: sem ele o MSYS reescreve `/stratux` como
caminho do Windows e quebra todas as URLs de asset.

## Verificar

```bash
npm run build && node scripts-verify/verify.mjs
```

Dirige o Chrome instalado contra o `dist/` em 1440px e 390px, com os efeitos de
animação do Windows emulados como desligados. Falha se houver elemento preso
invisível, erro de console, overflow horizontal, revelação que não disparou,
elemento visível sem cobertura de animação, ou conteúdo invisível com
JavaScript desativado. Screenshots em `scripts-verify/out/`.

```bash
node scripts-verify/verify.mjs --pages /,/politica-de-privacidade,/404
```

## Estrutura

```
src/
  components/     um componente .astro por bloco visual
  data/site.ts    fonte única de verdade — todo o conteúdo vive aqui
  layouts/        Base.astro: head, SEO, JSON-LD, arranque do movimento
  pages/          index, 404, política de privacidade, robots.txt, sitemap.xml
  scripts/        motion.ts — o motor de movimento, um módulo só
  styles/         global.css — o design system inteiro
  assets/         logo (PNG transparente original do cliente)
scripts-verify/   pipeline de verificação
CONTRACT.md       o contrato de design — leia antes de mexer no visual
```

Conteúdo novo entra em `src/data/site.ts`, nunca no meio do markup.

## Movimento

`src/scripts/motion.ts` é o único módulo de animação. Marque com `data-reveal`,
`data-split`, `data-parallax`, `data-count`. Detalhes em `CONTRACT.md`.

O site **ignora de propósito** o `prefers-reduced-motion` do sistema: o Windows
do cliente vem com "efeitos de animação" desligado e isso matava a experiência
inteira. Quem precisa reduzir usa o botão no rodapé, que persiste em
`localStorage`.

Há três redes de segurança para as revelações (IntersectionObserver, varredura
por scroll em rAF, timeout) e um seguro anti-falha no `<head>`: se o motor não
carregar em 4 segundos, tudo aparece.

## Deploy

`.github/workflows/deploy.yml` publica em GitHub Pages a cada push em `main`.

Para apontar o domínio próprio:

1. No workflow, troque `BASE_PATH` por `/` e `SITE_URL` por
   `https://www.stratuxconsultoria.com.br`.
2. Crie `public/CNAME` com `www.stratuxconsultoria.com.br`.
3. No DNS, aponte o CNAME de `www` para `<usuário>.github.io` e configure o
   apex conforme a documentação do GitHub Pages.

Hoje o domínio aponta para o Google Sites — confirmar quem controla o DNS antes
de virar.

## Parâmetros que expiram

`src/data/site.ts` → `taxRef`:

| Campo          | Valor        | Estado                                              |
| -------------- | ------------ | --------------------------------------------------- |
| `year`         | 2026         | rótulo exibido na calculadora                       |
| `minimumWage`  | R$ 1.518     | **valor de 2025 — confirmar.** Não é renderizado hoje |
| `meiLimit`     | R$ 81.000    | não é renderizado hoje                              |
| `simplesLimit` | R$ 4.800.000 | usado para barrar o comparativo acima do teto       |

As tabelas do Simples (`simplesTables`) e os percentuais do Lucro Presumido
(`presumido`) reproduzem os anexos da LC 123/2006 e as alíquotas vigentes do
Lucro Presumido — legislação estável, revisar a cada alteração. A calculadora
foi conferida contra cálculo manual em `scripts-verify/calc-test.mjs`.

A calculadora **não** considera a transição da reforma tributária (EC 132/2023).
Isso está declarado no aviso exibido ao usuário.

## Pendências com o cliente

- Logo em vetor (SVG/AI). Hoje usamos o PNG transparente original.
- Fotos reais da equipe e do escritório.
- Responsável técnico e registro no CRC-SP (`legal.crc`, `legal.technicalLead`).
- Depoimentos de clientes com autorização de uso.
- Anos de atuação e número de clientes, se quiserem exibir.
- E-mail comercial e destino do lead do formulário (hoje o envio abre o
  WhatsApp com a mensagem montada).
- Revisão jurídica da política de privacidade e e-mail do encarregado (DPO).
- Pacotes e faixas de preço, se quiserem exibir.
