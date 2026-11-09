# Medição de anúncios e domínio

## Como funciona

O Google Tag Manager só é carregado depois que o visitante clica em **Aceitar**
no aviso de cookies (`src/components/CookieNotice.astro`). Sem resposta ou com
**Recusar**, nada do Google de medição carrega e nenhum evento é registrado.

Quem ignora ou recusa o aviso **não aparece nas conversões** do Google Ads.

| Evento (`dataLayer`) | Quando dispara                 | Parâmetro        |
| -------------------- | ------------------------------ | ---------------- |
| `generate_lead`      | Formulário válido enviado      | `lead_source`    |
| `contact_whatsapp`   | Clique em link do WhatsApp     | `contact_origin` |
| `contact_phone`      | Clique em link de telefone     | `contact_origin` |
| `contact_email`      | Clique em link de e-mail       | `contact_origin` |

Sem `PUBLIC_GTM_ID` no build, o site não mostra o aviso nem carrega o GTM.

## Regras do contêiner

O site e a política de privacidade prometem que:

- o conteúdo do formulário não vai para o Google;
- não há remarketing nem personalização de anúncios;
- não há pixel de rede social nem analytics de terceiros.

Por isso, **não crie** sem antes atualizar `politica-de-privacidade.astro`:

- conversões otimizadas (dados fornecidos pelo usuário);
- tag de remarketing;
- GA4, Meta, TikTok, Pinterest, LinkedIn ou outros pixels;
- acionadores de clique em link (Link Click) e variáveis `Click URL`. O link do
  WhatsApp pode conter o nome, o telefone e a mensagem digitados no formulário.
  Use apenas os eventos personalizados da tabela acima.

## Montar o GTM

Mesma nomenclatura dos outros clientes. Conversões criadas no Google Ads
472-123-8164 (nome da conta: Prime X Soluções Contábeis), todas primárias,
contagem "Uma", janela de clique de 90 dias, sem conversões otimizadas:

| Conversão (Google Ads)   | Meta                      | ID de conversão | Rótulo                 |
| ------------------------ | ------------------------- | --------------- | ---------------------- |
| `Lead - Formulário site` | Enviar formulário de lead | `18119576281`   | `p_5nCJaNgrUdENmVi8BD` |
| `Lead - WhatsApp site`   | Contato                   | `18119576281`   | `VoSxCJmNgrUdENmVi8BD` |
| `Lead - Ligação site`    | Contato                   | `18119576281`   | `LOc3CNvNiLUdENmVi8BD` |

A Tag do Google usa o ID `AW-18119576281`.

| Tag                            | Tipo                     | Acionador                                     |
| ------------------------------ | ------------------------ | --------------------------------------------- |
| `0 \| GO \| Tag do Google (AW)`| Tag do Google            | Initialization - All Pages                    |
| `0 \| GO \| Vinculador de conversões` | Vinculador de conversões | Initialization - All Pages             |
| `2 \| GO \| Lead`              | Conversão do Google Ads  | `2 \| Lead \| Envio Formulário` (`generate_lead`) |
| `3 \| GO \| Contato`           | Conversão do Google Ads  | `3 \| Contato \| WhatsApp` (`contact_whatsapp`) |
| `4 \| GO \| Telefone`          | Conversão do Google Ads  | `4 \| Telefone \| Clique` (`contact_phone`)   |

Os três acionadores são do tipo **Evento personalizado**, com o nome do evento
indicado entre parênteses. `contact_email` fica disponível, sem conversão por
padrão.

## Publicar

O contêiner é o `GTM-MT63SBST`, na conta **Stratux Consultoria** do GTM, e já está
em `PUBLIC_GTM_ID` no `.github/workflows/deploy.yml`.

A **versão 2** foi publicada em 09/11/2026: Tag do Google (`AW-18119576281`), o
vinculador de conversões (tipo legado no GTM), as tags `2 | GO | Lead`,
`3 | GO | Contato` e `4 | GO | Telefone` e os três acionadores. Os dados da
conta do Google Ads e das conversões estão na seção anterior.

Pendente depois do merge em `main`, que publica o site:

1. Peça a revisão jurídica da política de privacidade.
2. Abra o modo Visualizar do GTM, clique em **Aceitar** no site e confira os
   disparos. Sem aceitar, o GTM não carrega e o Tag Assistant não encontra nada.
3. Faça um clique real em um anúncio e confira a conversão no Google Ads, onde
   as três ações ficam como "Conversões pendentes" até a primeira medição.

## Testes

```bash
PUBLIC_GTM_ID=GTM-TESTE npm run build && npm run verify:tracking
```

```bash
npm run build && npm run verify:tracking
```

Se o build falhar com `Named export 'walk' not found`, confira o tamanho do
caminho da pasta do projeto. Ele falhou com 180 caracteres e funcionou com 104.

## Corrigir o domínio sem www

`stratuxconsultoria.com.br` não abre porque não tem registro A. Os IPs do GitHub
Pages foram cadastrados como TXT. O DNS fica na Microsoft
(`ns*.bdm.microsoftonline.com`), no Centro de administração do Microsoft 365, em
**Configurações > Domínios > stratuxconsultoria.com.br > Registros DNS**.

**Remova** estes quatro registros TXT em `@`:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Adicione** estes quatro registros A em `@`, com TTL de 1 hora:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Não mexa** no MX, no TXT `v=spf1`, no TXT `mscid=` nem no CNAME `www`. Eles
mantêm o e-mail e o site funcionando.

Depois de propagar, o endereço sem www deve redirecionar para o `www`:

```bash
curl -sI http://stratuxconsultoria.com.br/
```

```bash
curl -sI https://stratuxconsultoria.com.br/
```

O certificado atual cobre só o `www`. O HTTPS sem www só funciona depois que o
GitHub emitir um certificado que inclua esse endereço, o que pode demorar. Se
não acontecer, confira em **Settings > Pages** do repositório.
