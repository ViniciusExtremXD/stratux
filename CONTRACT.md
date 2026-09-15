# Contrato de design — Stratux

Leia isto inteiro antes de escrever qualquer componente. Ele define o sistema que
já existe. **Não crie tokens, não edite `src/styles/global.css`, não instale nada.**

## Pegada

Executivo-patrimonial. Navy carrega a página, dourado é pontuação — nunca
parágrafo, nunca fundo dourado inteiro, nunca texto longo em dourado. A sensação
alvo é a de um relatório bem diagramado ganhando vida, **não** uma landing de
startup. Sem glow neon, sem skew agressivo, sem gradiente colorido.

Densidade de informação alta: quem contrata contabilidade quer ver domínio
técnico (prazos, obrigações, regimes). Linguagem clara em pt-BR, sem jargão
desnecessário; quando um termo técnico aparecer, explique em uma linha.

## Stack e regras duras

- Astro 5, `.astro` com `<style>` **scoped** no próprio arquivo. Sem Tailwind,
  sem CSS-in-JS, sem biblioteca de animação, sem dependência nova.
- TypeScript no frontmatter. Alias `~/` → `src/`.
- Todo texto institucional vem de `src/data/site.ts`. Nada hard-coded no markup
  além de rótulos de interface.
- Anime somente `opacity`, `transform`, `filter`, `color`. **Nunca `clip-path`.**
- Sem `!important`. Sem `position: fixed` (só a nav e o FAB usam).
- Sem overflow horizontal de 320px a 2560px. Tabela ou diagrama largo vai dentro
  do próprio contêiner com `overflow-x: auto`.
- Contraste AA garantido. Em superfície clara use `--gold-700` para texto
  dourado (`--accent` já resolve isso); em navy use `--gold-400`.
- Toda calculadora ou simulação exibe `.disclaimer` com `disclaimerText`.
- Nenhum número inventado sobre economia, prazo ou resultado.

## Tokens disponíveis (já definidos em global.css)

Cor: `--navy-950/900/850/800/700/600/500`, `--gold-200/300/400/500/600/700`,
`--silver-100/200/300/400/500/600`, `--bone`, `--bone-dim`, `--paper`, `--ink`,
`--ink-soft`, `--ink-mute`, `--petrol`, `--success`, `--danger`.

Papéis semânticos (preferir sempre estes): `--bg`, `--bg-raised`, `--fg`,
`--fg-soft`, `--fg-mute`, `--line`, `--line-strong`, `--accent`, `--accent-fill`.

Tipo: `--font-display` (Source Serif 4 — títulos), `--font-sans` (Archivo — corpo,
rótulos, números). Tamanhos: `--fs-display/h1/h2/h3/h4/lead/body/sm/xs/kicker`.

Espaço: `--s-1` … `--s-11`, `--gutter`, `--section-y`, `--shell` (1200),
`--shell-wide` (1400), `--shell-text`.

Forma: `--r-1/2/3/4/pill`. Sombra: `--sh-1/2/3`, `--sh-navy`.

Movimento: `--e-out`, `--e-soft`, `--e-inout`, `--d-1` … `--d-5`, `--rise`,
`--stagger`. Durações de 0.5–0.8s e deslocamentos de 16–24px. Nada maior.

## Classes prontas — use, não reescreva

Layout: `.shell` (+`--wide`, `--text`), `.section` (+`--tight`), `.grid`,
`.cluster`, `.stack`, `.sechead` (+`--center`).

Tipo: `.display`, `.h1`, `.h2`, `.h3`, `.h4`, `.lead`, `.small`, `.xs`, `.mute`,
`.num`, `.kicker` (+`--bare`), `.gold`, `.rule` (+`--gold`).

Componentes: `.btn` (+`--gold`, `--ghost`, `--outline-gold`, `--lg`, `--block`)
com `.btn__ico` no ícone; `.card` (+`--hover`) com `.card__rule`; `.icobox`;
`.badge` (+`--gold`); `.disclaimer`; `.field`/`.input`/`.select`/`.textarea`;
`.marquee`/`.marquee__track`; `.navy-field`; `.sr-only`; `.magnetic`.

Superfície escura: ponha `class="on-navy navy-field"` na `<section>`. Isso
inverte `--bg/--fg/--line/--accent` automaticamente — não redefina cores à mão.

## Movimento — como marcar

- `data-reveal` em qualquer bloco que deva entrar suave. Variantes:
  `data-reveal` (sobe, padrão), `="left"`, `="right"`, `="scale"`, `="fade"`,
  `="blur"`. Escalone com `style="--i:0"`, `--i:1`, `--i:2`…
- `data-split` em um título para entrada palavra a palavra. Use no máximo um por
  seção, no `<h2>`.
- `data-parallax="0.08"` em elemento decorativo.
- `data-count="1200" data-count-suffix="+"` num `<span>` para contador animado
  (aceita `data-count-prefix`, `data-count-decimals`).
- `.img-fade` em `<img>`/`<Image>` que deva aparecer ao carregar.
- Animação própria via `@keyframes` no `<style>` scoped é permitida e desejável
  — ela conta como cobertura.

**Regra de cobertura, verificada automaticamente:** todo elemento visível que
renderiza texto ou imagem precisa estar coberto por alguma animação — no próprio
elemento ou em um ancestral. O alvo é 100%, zero estáticos. Na prática: marque os
contêineres com `data-reveal` e os filhos herdam a cobertura.

## Caixas de expansão — o padrão para conteúdo denso

O site prioriza ser **enxuto por padrão, completo sob demanda**. Sempre que uma
lista tiver mais de ~4 itens com descrição (serviços, calendário, FAQ), o
padrão é: mostrar uma versão compacta sempre visível (rótulos, números, um
resumo) e esconder a descrição completa atrás de um `<details>`/`<summary>`
fechado por padrão. Nunca despeje a lista inteira, expandida, direto na
página — isso é o que deixa o site "poluído".

Receita, com o mesmo visual em toda parte (veja `ProfileServices.astro` e
`ObligationsCalendar.astro`):

```astro
<details class="x__details" data-reveal="fade">
  <summary class="x__summarybtn">
    <span>Ver o que inclui / Ver as N datas</span>
    <span class="x__ind" aria-hidden="true"><Icon name="plus" size={15} /></span>
  </summary>
  <!-- conteúdo completo aqui -->
</details>
```

CSS do indicador (copie e adapte o prefixo de classe): borda vira `--accent`
no hover/`[open]`, e o ícone `plus` gira 135deg quando aberto — vire um "×"
sem trocar de ícone. Funciona sem JavaScript (é `<details>` nativo) e o
`data-reveal="fade"` no próprio elemento resolve a cobertura de animação.

Isso não é carrossel nem accordion exclusivo: várias caixas podem ficar
abertas ao mesmo tempo, cada uma no seu ritmo.

## Falha e acessibilidade — inegociável

- **Nada pode ficar invisível se o JS falhar.** As revelações só escondem sob
  `html.js`, e há rede de segurança em `html.motion-failed` / `html.motion-reduced`.
  Se você criar animação própria com `opacity: 0` inicial, ela **precisa** rodar
  por `@keyframes` com `animation-fill-mode: both` (roda sozinha, sem JS) ou ser
  neutralizada em `:global(html.motion-reduced)` e `:global(html.motion-failed)`.
- Interatividade deve ter estado final legível **sem JavaScript**. Prefira
  `<details>`, `<input type="radio">` + `:has()`, e âncoras — como já faz
  `ProfileServices.astro`. JS só para conveniência (memória de sessão, foco).
- Operável por teclado: `:focus-visible` já é global; não remova outline.
  Rótulo real para todo controle (`<label for>` ou `aria-label`).
- `aria-labelledby` na `<section>` apontando para o id do `<h2>`.
- Não trave o scroll no mobile.
- Toda `<section>` tem `id` estável (a nav aponta para eles).

## Ícones

`import Icon from '~/components/Icon.astro'` → `<Icon name="chart" size={20} />`.

Disponíveis: arrow, arrowUpRight, chevronDown, chevronRight, check, plus, minus,
close, menu, user, people, sprout, building, handshake, ledger, receipt, stamp,
doc, calculator, calendar, clock, chart, coins, search, transfer, alert, info,
shield, lock, award, spark, bolt, pin, phone, mail, whatsapp, motion, scale,
globe. **Nunca emoji** — o site antigo usava emoji e é justamente o que estamos
corrigindo.

Todo ícone é traço fino (stroke), sem preenchimento — **exceto quando a forma
em si depende de área preenchida para ser legível** (hoje só o `whatsapp`: a
bolha é traço, mas o fone por dentro é sólido, porque as curvas finas do fone
em traço puro viram um nó ilegível em 15–22px). Se precisar de um novo ícone
assim, sobrescreva fill/stroke **no `<path>`**, não no `<svg>` do wrapper — o
wrapper continua stroke-only para todo o resto por padrão.

## Dados

`import { ... } from '~/data/site'`. Exporta: `brand`, `contact`, `wa(msg)`,
`waDefault`, `legal`, `regions`, `nav`, `profiles`, `serviceAreas`,
`processSteps`, `mission`, `vision`, `values`, `monthlyObligations`,
`annualObligations`, `taxRef`, `simplesTables`, `presumido`, `diagnostic`,
`faq`, `disclaimerText`, `seo`.

`wa('mensagem')` devolve o link do WhatsApp já com a mensagem codificada — use
sempre que um CTA levar para a conversa, com contexto do que o visitante estava
vendo.

## Placeholders honestos

Onde falta material do cliente (fotos da equipe, CRC, depoimentos, preços),
**não invente**. Renderize um bloco visível de "a confirmar" com aparência
intencional, e deixe um comentário `{/* TODO cliente: ... */}` no código.

## Referências vivas

Leia antes de escrever, e siga o mesmo nível:

- `src/components/Hero.astro` — seção navy, split de título, arte SVG animada.
- `src/components/ProfileServices.astro` — filtro sem JS com `:has()`, cards,
  chips, CTA por área.
- `src/components/Footer.astro` — grid responsivo, listas, toggle de movimento.
