# Portal da Associação dos Estudantes — Magistério Nº 1028 CNO

## O que já está preparado
- Site responsivo para telemóvel e computador.
- Secções de notícias/comunicados, actividades, pedido de inscrição, sugestões/reclamações, documentos e contactos.
- Área da Direcção identificada como reservada, mas ainda **desactivada** por segurança.
- Formulários com validação básica e modo de demonstração local.
- Identidade visual institucional própria, independente do portal da escola.

## Importante: o que esta versão NÃO faz ainda
Sem um backend configurado, os formulários guardam uma demonstração apenas no navegador/dispositivo em uso. **Não enviam dados à Direcção, não criam inscrições oficiais e não são uma base de dados partilhada.** O login da Direcção está deliberadamente bloqueado: não use uma palavra-passe nesta versão.

## Publicação gratuita da parte visual
Uma opção é o GitHub Pages, que publica ficheiros estáticos HTML/CSS/JavaScript a partir de um repositório. A documentação oficial: https://docs.github.com/en/pages
1. Crie uma conta em https://github.com (se ainda não tiver).
2. Crie um repositório público, por exemplo `associacao-magisterio-1028`.
3. Carregue `index.html`, `styles.css`, `app.js` e os restantes ficheiros do pacote.
4. Abra **Settings → Pages** e escolha a publicação a partir da branch principal (`main`) e da pasta raiz.
5. Aguarde a publicação e abra o endereço indicado pelo GitHub Pages.
6. Teste no seu telemóvel. O repositório público significa que o código do site será público; nunca coloque palavras-passe, dados pessoais ou chaves secretas nos ficheiros.

## Para formulários reais e área reservada
Recomendação inicial: Supabase (plano gratuito sujeito a limites e regras que podem mudar): https://supabase.com
Precisará de:
- Conta criada pela Associação ou por um responsável autorizado.
- Projecto Supabase com base de dados e autenticação.
- Tabelas para pedidos de inscrição, sugestões, comunicados, eventos e documentos.
- Políticas de segurança RLS para impedir que utilizadores públicos leiam dados privados.
- Utilizadores de direcção criados pela autenticação e autorização administrativa atribuída com segurança.
- Configuração do site para enviar formulários para a base de dados.
- Procedimento para apagar dados, gerir consentimento e responder aos pedidos.

**Nunca coloque a chave `service_role` do Supabase no JavaScript público.** Só a chave pública `anon/publishable` pode estar no front-end, e apenas com RLS correctamente configurado. Não active permissões públicas de leitura de inscrições, contactos ou reclamações.

## Checklist antes da publicação oficial
- [ ] Confirmar o nome institucional e obter autorização para usar símbolos/logótipos da escola.
- [ ] Inserir o contacto WhatsApp oficial e o e-mail da Associação.
- [ ] Substituir textos demonstrativos por comunicados autorizados.
- [ ] Adicionar documentos oficiais e confirmar que podem ser públicos.
- [ ] Configurar e testar base de dados, autenticação e permissões.
- [ ] Definir quem administra o site e quem pode ver dados pessoais.
- [ ] Testar envio, erro de rede, telemóvel, teclado e leitor de ecrã.
- [ ] Publicar uma política de privacidade e um contacto para pedidos de remoção de dados.

## Configurar os contactos
No final de `app.js`, procure:
```js
const WHATSAPP_NUMBER = "";
const OFFICIAL_EMAIL = "";
```
Preencha apenas contactos oficiais autorizados. O número WhatsApp deve estar no formato internacional, apenas dígitos, sem `+`, espaços ou traços (por exemplo, o prefixo de Angola é 244). Não invente nem use contacto pessoal sem autorização.

## Estrutura do pacote
- `index.html` — conteúdo e formulários.
- `styles.css` — design responsivo.
- `app.js` — navegação e interacções de demonstração.
- `CONFIGURACAO.md` — este guia.
- `supabase_schema.sql` — proposta inicial de tabelas e políticas de segurança para revisão antes de activar.

O site é um protótipo funcional de interface. A sua publicação não substitui a configuração e o teste de um backend real.
