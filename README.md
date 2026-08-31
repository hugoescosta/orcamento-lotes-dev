# Orçamento de Lotes — App para Android

Aplicativo web (PWA) que reproduz, no celular, a lógica da planilha
`Planilha_orçamento.xlsx`: você digita **Quadra** e **Lote**, escolhe o
**plano de pagamento**, e o app busca os dados na base e monta o orçamento
(Área M², Valor, Entrada, Facilitada em 1+2, Financiamento), igual às abas
`144 Sem Balão`, `144 Com Balão` e `144 Sem Entrada`.

Funciona **offline**, sem precisar de internet depois de instalado, e sem
precisar de Play Store. Já sai com a marca **Militão Imóveis**, os dados da
corretora e um botão de **Baixar em PDF** para enviar o orçamento pronto ao
cliente.

---

## 1. Como a planilha foi mapeada

| Na planilha | No app |
|---|---|
| Aba `Tabela` (colunas QUADRA, LOTE, ÁREA, VALOR TOTAL, ENTRADA, 1X, 12X, 24X, 36X, 144X, 12 Balão, 144X com balão, 144X sem entrada) | `data.js` — banco de dados local, 1.370 lotes |
| Coluna `1X` (À Vista) — `G+H` na planilha, com 25% de desconto sobre o saldo | Plano **"À Vista"** |
| Coluna `12X` — parcela com 15% de desconto sobre o saldo | Plano **"12x"** |
| Coluna `24X` — parcela com 7,5% de desconto sobre o saldo | Plano **"24x"** |
| Coluna `36X` — parcela sem desconto, correção por IPCA | Plano **"36x"** |
| Aba `144 Sem Balão` (`VLOOKUP` por `QUADRALOTE`) | Plano **"Sem Balão"** |
| Aba `144 Com Balão` | Plano **"Com Balão"** (inclui parcela de balão anual) |
| Aba `144 Sem Entrada` | Plano **"Sem Entrada"** (1 + 143x, sem entrada) |
| Célula de desconto (`D11`, `D12`, `D14`, padrão 10%) | Campo **Desconto (%)** no app (editável, começa em 0%) — desconto comercial extra, aplicado por cima do que já está pré-calculado na tabela |
| `Facilitada em 1 + 2` = Entrada com desconto ÷ 2 | Campo **Facilitada em 1 + [divisor]**, divisor editável (padrão 2) — disponível só nos 3 planos de 144x |
| Código do lote `=VALUE(CONCATENATE(Quadra,Lote))` | Busca feita por `quadra-lote` diretamente no JSON, mesmo resultado |

A escolha no app acontece em dois passos, como um funil:
1. **Forma de Pagamento:** À Vista, 12x, 24x, 36x ou 144x
2. **Condição de Pagamento:** Sem Balão, Com Balão ou Sem Entrada

Hoje, só a forma **144x** tem dados próprios para as 3 condições (vindos das
3 abas de plano da planilha). Para À Vista, 12x, 24x e 36x, a planilha
ainda não tem colunas separadas por condição — nesses casos o app trava
automaticamente a condição em **Sem Balão** e desabilita Com Balão/Sem
Entrada (com um aviso "em breve"), mas a estrutura de dados e a interface
já estão prontas: assim que a planilha ganhar colunas de Com Balão/Sem
Entrada para essas formas, é só extrair os novos dados (seção 7) e
liberar as condições correspondentes no código.

As fórmulas de cada coluna foram conferidas manualmente contra a planilha
original antes de entrar no app (ex.: Quadra 1 / Lote 1 → À Vista R$
115.013,83 = Valor × 0,75; 12x R$ 10.102,05 = (Valor − Entrada) × 0,85 ÷ 12;
24x R$ 5.496,70 = (Valor − Entrada) × 0,925 ÷ 24; 36x R$ 3.961,59 = (Valor −
Entrada) ÷ 36 — todas batendo com a coluna correspondente da aba `Tabela`).
E também Quadra 18 / Lote 6, desconto 10% no plano Sem Balão → Entrada R$
6.493,671, Facilitada R$ 2.164,557, Financiamento R$ 599,121 — bate
exatamente com a aba `144 Sem Balão`.

**Observação sobre os dados de origem:** na aba `Tabela`, a linha da Quadra 1
tem um lote com valor `445555555` (provável erro de digitação, deveria ser
`45`). Os dados não foram alterados — o app apenas reflete o que está na
planilha. Vale revisar essa célula na planilha original.

Se a planilha for atualizada (novos lotes, novos valores), é só gerar o
`data.js` de novo — veja a seção 5.

---

## 2. Marca

- **Logo:** a marca "Militão Imóveis" aparece no topo do app e no PDF
  gerado (arquivo `logo.png`).

Para trocar a logo depois, é só substituir o arquivo `logo.png` (mesma
proporção).

---

## 3. Baixar o orçamento em PDF

Depois de calcular o orçamento, aparece o botão **"Baixar em PDF"** dentro
do card de resultado. Ele gera o arquivo **diretamente** (não abre a tela
de impressão do navegador): toque no botão e o PDF já cai na pasta
Downloads do celular, pronto para compartilhar no WhatsApp com o cliente —
sempre em **uma única página**, com logo, dados do lote e valores do plano
escolhido.

---

## 4. Arquivos do projeto

```
orcamento-lotes-app/
├── index.html          → app (interface + cálculo + geração de PDF)
├── data.js             → base de lotes extraída da aba "Tabela"
├── logo.png             → marca Militão Imóveis
├── manifest.json        → identidade do app (nome, ícone, cor)
├── service-worker.js    → cache offline
├── icon-192.png / icon-512.png → ícone do app
└── README.md            → este arquivo
```

Tudo é HTML/JS puro — não depende de loja de aplicativos, servidor, ou
build (Android Studio, Gradle etc.).

---

## 5. Instalar no Android — passo a passo

Existem 3 caminhos, do mais rápido ao mais "app de verdade". Comece pelo
**Caminho A** — para a maioria dos casos, é suficiente. Se o Chrome não
mostrar a opção "Adicionar à tela inicial" no Caminho A (acontece em
algumas versões, pois o arquivo está aberto localmente), vá direto para o
**Caminho B** — ele resolve isso definitivamente.

### Caminho A — Instalação direta (2 minutos, sem hospedar nada)

1. Transfira a pasta `orcamento-lotes-app` (ou o `.zip`) para o celular:
   envie por WhatsApp/Telegram para você mesmo, por e-mail, ou copie via
   cabo USB/Google Drive.
2. Se enviou o `.zip`, extraia-o no celular (o próprio gerenciador de
   arquivos do Android, ou apps como "Files"/"ZArchiver", têm a opção
   **Extrair**).
3. Abra o gerenciador de arquivos do celular, entre na pasta extraída e
   toque no arquivo **`index.html`** — escolha **Chrome** para abrir.
4. Com o app aberto no Chrome, toque nos **3 pontinhos** (menu) no canto
   superior direito.
5. Toque em **"Adicionar à tela inicial"** (ou "Instalar app", dependendo
   da versão do Chrome).
6. Confirme o nome **"Orçamento"** e toque em **Adicionar**.
7. Pronto — um ícone aparece na tela inicial do celular, abre em tela
   cheia (sem barra de endereço) e funciona **sem internet**.

### Caminho B — Hospedar online pelo celular (recomendado, e resolve quando a opção de instalar não aparece)

Hospedar deixa o app instalável com um único toque (banner automático do
Chrome) e permite atualizar os dados/logo para todo mundo de uma vez, sem
reenviar arquivo. Dá para fazer 100% pelo celular, sem precisar de
computador:

1. No Chrome do celular, acesse **github.com** e crie uma conta (**Sign
   up**) se ainda não tiver.
2. Toque no **+** no canto superior → **New repository**.
3. Dê um nome (ex.: `orcamento-lotes`), marque **Public** → **Create
   repository**.
4. Na página do repositório, toque em **Add file → Upload files**.
5. Toque na área de upload — isso abre o seletor de arquivos do celular.
   Selecione **todos os 7 arquivos** da pasta `orcamento-lotes-app` de uma
   vez (`index.html`, `data.js`, `logo.png`, `manifest.json`,
   `service-worker.js`, `icon-192.png`, `icon-512.png`).
6. Role até embaixo e toque em **Commit changes**.
7. Volte à página principal do repositório → menu (☰) → **Settings**
   (se não achar no menu mobile, toque em ⋮ no Chrome → "Versão para
   computador" para ver o site completo).
8. Em Settings, toque em **Pages** (barra lateral). Em "Branch", escolha
   **main**, pasta **/ (root)** → **Save**.
9. Espere 1–2 minutos, atualize a página — vai aparecer o link, algo como
   `https://seu-usuario.github.io/orcamento-lotes/`.
10. Abra esse link no Chrome do celular. Agora o Chrome reconhece a
    página como instalável: toque nos 3 pontinhos → **Instalar app** (ou
    aparece um banner sozinho, bem embaixo da tela).

*Alternativa mais rápida, se tiver acesso a um computador na hora: [Netlify
Drop](https://app.netlify.com/drop) — arraste a pasta e recebe um link
pronto na hora, sem precisar criar repositório.*

### Caminho C — Gerar um arquivo `.apk` de verdade (opcional)

Se quiser um `.apk` para instalar como qualquer outro aplicativo (útil
para enviar para a equipe sem depender do Chrome):

1. Hospede o app primeiro (Caminho B) e tenha a URL `https://...` em mãos.
2. Acesse [pwabuilder.com](https://www.pwabuilder.com) (pode ser pelo
   próprio navegador do celular).
3. Cole a URL do app e toque em **Start**.
4. Na aba **Android**, toque em **Package for store** (ou "Generate
   Package") e baixe o `.apk`/`.aab` gerado.
5. Abra o `.apk` baixado. Se o Android bloquear ("instalação de apps
   desconhecidos"), permita a instalação para o app usado (Chrome,
   Arquivos, etc.) quando o aviso aparecer.
6. Toque em **Instalar**.

> Esse caminho gera um `.apk` que ainda "aponta" para o app hospedado —
> ou seja, o Caminho B precisa continuar no ar para o app funcionar.

---

## 6. Como usar o app

1. Digite a **Quadra** e o **Lote**.
2. Escolha o **plano**: *Sem Balão*, *Com Balão* ou *Sem Entrada*.
3. (Opcional) ajuste **Desconto (%)** e o divisor da **Facilitada**.
4. Toque em **Calcular orçamento** — aparecem Área, Valor, Entrada,
   Facilitada e Financiamento (mais o Balão anual, no plano Com Balão),
   já com o valor original e o valor com desconto lado a lado, além dos
   dados da corretora.
5. Toque em **Baixar em PDF** para gerar o arquivo e compartilhar com o
   cliente (veja a seção 3).

Se a combinação de quadra/lote não existir na base, o app avisa
("Nenhum lote encontrado...").

---

## 7. Atualizar a base de dados (quando a planilha mudar)

O app não lê o `.xlsx` diretamente no celular — os dados ficam
"congelados" dentro do arquivo `data.js` para o app funcionar offline e
carregar instantaneamente. Sempre que a planilha for atualizada, é preciso
gerar o `data.js` de novo e reenviar/re-hospedar os arquivos.

Isso pode ser feito pedindo a atualização (envie a nova planilha) ou,
tecnicamente, repetindo a extração da aba `Tabela` (colunas QUADRA, LOTE,
ÁREA, VALOR TOTAL, ENTRADA, e as colunas de financiamento 144x sem balão,
balão anual, 144x com balão e 144x sem entrada) para o mesmo formato de
lista usado em `data.js`.

---

## 8. Login e controle de validade de acesso

O app agora exige e-mail e senha para entrar. Isso é feito com o
**Supabase** (banco de dados + autenticação gratuitos), configurado em
`supabase-setup.sql` e conectado no `index.html`.

### Como funciona

- Quem abre o app vê a tela de login primeiro. Sem login válido, não
  acessa a consulta de lotes.
- Cada usuário tem uma **data de validade** (`expires_at`) guardada no
  banco. A cada abertura do app (e a cada login), o sistema confere se
  essa data ainda não passou e se o usuário está marcado como `active`.
  Se estiver vencido ou inativo, ele é desconectado automaticamente e vê
  a mensagem "Seu acesso expirou ou está inativo."
- Por isso, diferente do resto do app, **o login sempre precisa de
  internet** — é essa verificação online que permite revogar o acesso de
  alguém a qualquer momento, sem precisar atualizar o app.
- Tem um botão **"Sair"** no canto superior direito da tela principal.

### Como cadastrar um novo usuário e definir a validade

Por enquanto isso é feito direto no painel do Supabase (gratuito, leva
menos de 1 minuto por pessoa):

1. No painel do projeto, vá em **Authentication → Users → Add user →
   Create new user**.
2. Preencha e-mail e senha, e marque **"Auto Confirm User"** (sem isso o
   login não funciona, pois fica esperando confirmação por e-mail que
   nunca chega).
3. Copie o **UUID** desse usuário, que aparece na lista.
4. Vá em **Table Editor → profiles → Insert row**.
5. Cole o UUID no campo `id`, preencha `email`, escolha a data de
   validade em `expires_at`, e deixe `active` marcado como `true`.

Para **renovar** o acesso de alguém, basta editar a data em `expires_at`
na mesma tabela. Para **bloquear** alguém antes do vencimento, marque
`active` como `false`.

### Configuração inicial (uma vez só)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo do arquivo `supabase-setup.sql`
   (cria a tabela `profiles` com as regras de segurança).
3. Em **Project Settings → API**, copie a **Project URL** e a chave
   **anon public**.
4. Abra o `index.html`, procure por `SUPABASE_URL` e
   `SUPABASE_ANON_KEY` (bem no topo do bloco de scripts) e cole os dois
   valores no lugar de `'COLE_AQUI_A_URL_DO_SEU_PROJETO'` e
   `'COLE_AQUI_A_CHAVE_ANON_PUBLICA'`.

> A chave "anon public" é feita para ficar exposta no código do site —
> ela sozinha não dá acesso a nada; quem protege os dados é a regra de
> segurança (RLS) criada pelo `supabase-setup.sql`, que só deixa cada
> usuário enxergar o próprio registro de validade.

### Limitação atual (importante)

O login protege a **tela** do app (ninguém entra sem senha válida). Mas
os dados dos lotes continuam num arquivo estático (`data.js`) que fica
publicado junto com o site — ou seja, tecnicamente alguém que soubesse o
endereço exato desse arquivo poderia baixá-lo direto, sem passar pelo
login. Isso não afeta o uso normal (ninguém vê ou acha esse link sem
saber que ele existe), mas se no futuro for importante impedir isso por
completo, dá para mover os dados dos lotes também para dentro do
Supabase, protegidos pela mesma regra de segurança — é um passo a mais
que posso fazer quando quiser.

---

## 9. Perguntas frequentes

**Precisa de internet para usar?**
Não, depois de instalado (Caminhos A, B ou C) o app funciona 100% offline
— os dados dos 1.370 lotes estão embutidos no próprio app.

**O PDF precisa de internet?**
Só na primeira vez que o app é aberto (para baixar a biblioteca que monta
o PDF). Depois disso, o app guarda essa biblioteca em cache e o PDF
continua funcionando offline. Se o botão "Baixar em PDF" mostrar um aviso
de erro, é sinal de que essa primeira abertura com internet ainda não
aconteceu nesse celular.

**Dá para publicar na Play Store?**
Sim, o pacote gerado pelo PWABuilder (Caminho C) pode ser enviado para a
Play Store como um app comum, se desejar — isso exige criar uma conta de
desenvolvedor Google (taxa única) e passar pelo processo de revisão da
Google, que não está incluso neste guia.

**Os valores calculados são iguais aos da planilha?**
Sim — a Área, Valor, Entrada, Facilitada e Financiamento foram conferidos
célula a célula contra as abas `144 Sem Balão`, `144 Com Balão` e
`144 Sem Entrada` da planilha original.
