# Castruccio Viaggi — Gestionale (demo)

Gestionale per agenzia di viaggi: **una sola web app** che funziona sul PC dell'ufficio e sul telefono
(installabile sulla schermata Home come una vera app, PWA).

I dati sono **fittizi e salvati solo nel browser** (localStorage): è una demo, non c'è ancora un server.

## Cosa fa

- **Pratiche**: il viaggio venduto, con passeggeri, servizi (volo, hotel, crociera…) e piano incassi
- **Margine e IVA** per pratica (regime 74-ter sul margine vs intermediazione), stima indicativa
- **Scadenzario unico**: incassi dai clienti, pagamenti ai fornitori, opzioni/emissioni, documenti, partenze
- **Controllo documenti**: passaporto con validità insufficiente, carta d'identità dove serve il passaporto
- **Clienti** divisi tra vacanze e professionisti (con carte di pagamento)
- **Home finanziaria**: fatturato dell'anno, confronto con gli anni migrati, scoperto da carte
- **Email marketing** per i clienti vacanze (campagne, automazioni, consenso)
- **Telefono**: barra in basso, schede touch, pulsanti Chiama / WhatsApp / Email

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # produzione in dist/
npm run icons      # rigenera le icone della PWA
```

## Installarla sul telefono

Apri l'indirizzo pubblicato (deve essere **https**) e:
- **iPhone (Safari)**: Condividi → *Aggiungi a Home*
- **Android (Chrome)**: menu ⋮ → *Installa app* / *Aggiungi a schermata Home*

## Pubblicazione

`npm run deploy` pubblica `dist/` sul ramo `gh-pages` del remote `origin` (richiede un repository GitHub).

## Per passare da demo a gestionale vero

Servono un backend con database (utenti e permessi per i dipendenti, dati condivisi in tempo reale),
export/import dei dati dal vecchio gestionale e le integrazioni con tour operator e contabilità.
