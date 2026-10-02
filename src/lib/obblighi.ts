import { iso, parse } from './format'

export type AreaScadenza = 'Imposte' | 'IVA' | 'Lavoro e INPS'

export interface ScadenzaFiscale {
  id: string
  titolo: string
  data: string
  area: AreaScadenza
  descrizione: string
  fonte?: { label: string; url: string }
}

// ——— Giorni festivi: se una scadenza cade di sabato, domenica o festivo, slitta al primo giorno lavorativo ———

function pasqua(anno: number): Date {
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anno, mese - 1, giorno, 12)
}

function festivo(d: Date): boolean {
  const w = d.getDay()
  if (w === 0 || w === 6) return true
  const md = `${d.getMonth() + 1}-${d.getDate()}`
  if (['1-1', '1-6', '4-25', '5-1', '6-2', '8-15', '11-1', '12-8', '12-25', '12-26'].includes(md)) return true
  const lunediAngelo = pasqua(d.getFullYear())
  lunediAngelo.setDate(lunediAngelo.getDate() + 1)
  return iso(d) === iso(lunediAngelo)
}

export function lavorativo(s: string): string {
  const d = parse(s)
  while (festivo(d)) d.setDate(d.getDate() + 1)
  return iso(d)
}

const FONTE_SP = { label: 'Agenzia delle Entrate: Redditi SP 2026', url: 'https://www.agenziaentrate.gov.it/portale/redditi-societa-di-persone-2026/quando-e-come-si-presenta-il-modello-redditi-sp' }

/** Prossime scadenze ordinarie. Date calcolate con lo slittamento al primo giorno lavorativo. Da confermare ogni anno con il commercialista. */
export const SCADENZE: ScadenzaFiscale[] = [
  { id: 'redditi-sp-2025', titolo: 'Dichiarazione Redditi SP e IRAP (anno d’imposta 2025)', data: '2026-11-02', area: 'Imposte', descrizione: 'Invio telematico del modello Redditi SP, che attribuisce il reddito ai soci, e della dichiarazione IRAP. Il 31 ottobre cade di sabato.', fonte: FONTE_SP },
  { id: 'mod770-2026', titolo: 'Modello 770 (sostituto d’imposta)', data: '2026-11-02', area: 'Lavoro e INPS', descrizione: 'Riepilogo di ritenute e versamenti su dipendenti e collaboratori. Dal 2026 va considerata anche la ritenuta sulle provvigioni, se l’agenzia ne è sostituto.' },
  { id: 'inps-fissi-nov-2026', titolo: 'Contributi INPS fissi dei soci: 3ª rata', data: lavorativo('2026-11-16'), area: 'Lavoro e INPS', descrizione: 'Rata dei contributi minimi dei soci iscritti alla gestione commercianti. Verificare con il commercialista quali soci sono iscritti.' },
  { id: 'lipe-q3-2026', titolo: 'LIPE: comunicazione liquidazioni IVA del 3° trimestre', data: lavorativo('2026-11-30'), area: 'IVA', descrizione: 'Comunicazione trimestrale dei dati delle liquidazioni IVA. Per le operazioni in regime 74-ter si indica il margine, non l’incasso lordo.' },
  { id: 'acconto2-2026', titolo: 'Seconda rata di acconto imposte (Redditi e IRAP)', data: lavorativo('2026-11-30'), area: 'Imposte', descrizione: 'Seconda rata dell’acconto sull’anno in corso, tramite F24. Le imposte sul reddito le pagano i soci; la società paga l’IRAP.', fonte: FONTE_SP },
  { id: 'acconto-iva-2026', titolo: 'Acconto IVA di fine anno', data: lavorativo('2026-12-27'), area: 'IVA', descrizione: 'Versamento dell’acconto IVA dovuto per il 2026, salvo i casi di esonero.' },
  { id: 'inps-fissi-feb-2027', titolo: 'Contributi INPS fissi dei soci: 4ª rata', data: lavorativo('2027-02-16'), area: 'Lavoro e INPS', descrizione: 'Ultima rata dei contributi minimi dell’anno.' },
  { id: 'cu-2027', titolo: 'Certificazione Unica (CU) a dipendenti e lavoratori autonomi', data: lavorativo('2027-03-16'), area: 'Lavoro e INPS', descrizione: 'Invio all’Agenzia delle Entrate e consegna ai percipienti. Con la ritenuta sulle provvigioni vanno certificate anche quelle, se l’agenzia ne è sostituto.' },
  { id: 'iva-annuale-2027', titolo: 'Dichiarazione IVA annuale 2026', data: lavorativo('2027-04-30'), area: 'IVA', descrizione: 'Va compilata anche la parte dedicata al regime speciale 74-ter delle agenzie di viaggio.' },
  { id: 'inps-fissi-mag-2027', titolo: 'Contributi INPS fissi dei soci: 1ª rata', data: lavorativo('2027-05-16'), area: 'Lavoro e INPS', descrizione: 'Prima rata dei contributi minimi 2027.' },
  { id: 'lipe-q1-2027', titolo: 'LIPE: comunicazione liquidazioni IVA del 1° trimestre', data: lavorativo('2027-05-31'), area: 'IVA', descrizione: 'Comunicazione trimestrale delle liquidazioni IVA.' },
  { id: 'saldo-2027', titolo: 'Saldo imposte 2026, 1ª rata di acconto 2027 e diritto annuale Camera di Commercio', data: lavorativo('2027-06-30'), area: 'Imposte', descrizione: 'Versamento con F24. Entro i 30 giorni successivi si può pagare con la maggiorazione dello 0,40%.', fonte: FONTE_SP },
]

export const RICORRENTI = [
  { titolo: 'Ogni 16 del mese', testo: 'F24 per le ritenute su dipendenti e collaboratori, i contributi INPS dei dipendenti e, se la liquidazione è mensile, l’IVA del mese prima.' },
  { titolo: 'Ogni mese', testo: 'Annotare le pratiche nel registro 74-ter e controllare che le fatture siano emesse con la natura N5 (regime del margine).' },
  { titolo: 'Ogni trimestre', testo: 'Liquidazione IVA, e invio della LIPE se non è già stata fatta.' },
]

export interface VoceGuida {
  titolo: string
  testo: string
  fonte?: { label: string; url: string }
}
export interface SezioneGuida {
  id: string
  titolo: string
  intro: string
  voci: VoceGuida[]
}

export const GUIDA: SezioneGuida[] = [
  {
    id: 'sas',
    titolo: 'La società: s.a.s.',
    intro: 'La società in accomandita semplice è una società di persone con due tipi di soci.',
    voci: [
      { titolo: 'Accomandatari e accomandanti', testo: 'Gli accomandatari amministrano la società e rispondono dei debiti con tutto il proprio patrimonio, insieme alla società. Gli accomandanti conferiscono capitale e rispondono solo fino a quanto hanno conferito. Un accomandante che compie atti di amministrazione perde questa protezione.', fonte: { label: 'Soluzione Tasse', url: 'https://www.soluzionetasse.com/s-a-s-societa-in-accomandita-semplice-definizione-e-caratteristiche/' } },
      { titolo: 'Tassazione per trasparenza', testo: 'La società non paga l’imposta sul reddito: l’utile viene imputato ai soci in proporzione alle quote e tassato in capo a loro con l’IRPEF, nella loro dichiarazione personale, anche se non lo prelevano. La società presenta il modello Redditi SP e paga l’IRAP (aliquota base 3,9%, che varia per Regione).', fonte: { label: 'FidoCommercialista', url: 'https://fidocommercialista.it/societa-in-accomandita-semplice' } },
      { titolo: 'Bilancio e Registro Imprese', testo: 'Per le società di persone il bilancio non si deposita al Registro Imprese, salvo il caso particolare in cui tutti gli accomandatari siano società di capitali. Il bilancio resta però necessario per la contabilità e per i rapporti con banche e fornitori.', fonte: { label: 'Soluzione Tasse', url: 'https://www.soluzionetasse.com/s-a-s-societa-in-accomandita-semplice-definizione-e-caratteristiche/' } },
      { titolo: 'Libri e registri', testo: 'In contabilità ordinaria servono il libro giornale, il libro degli inventari e i registri IVA. Per le agenzie di viaggio c’è in più il registro delle pratiche del regime 74-ter. La contabilità semplificata è possibile sotto certe soglie di ricavi: la scelta spetta al commercialista.' },
      { titolo: 'INPS dei soci', testo: 'I soci che lavorano abitualmente nell’agenzia si iscrivono alla gestione commercianti e pagano contributi fissi più una quota percentuale sul reddito imputato. Gli accomandanti che non lavorano nella società di norma non sono iscritti.' },
      { titolo: 'Diritto annuale e PEC', testo: 'Ogni anno si paga il diritto annuale alla Camera di Commercio (con l’F24 di giugno). La PEC e la firma digitale devono essere sempre attive e rinnovate.' },
    ],
  },
  {
    id: 'iva',
    titolo: 'IVA delle agenzie: regime 74-ter',
    intro: 'Per i pacchetti turistici l’IVA si calcola sul margine, non sul prezzo di vendita.',
    voci: [
      { titolo: 'Come funziona', testo: 'Il margine è la differenza tra quello che paga il viaggiatore (IVA esclusa) e i costi dei servizi acquistati da altri soggetti. Sull’imponibile si applica l’aliquota del 22%. Il gestionale ne mostra una stima per ogni pratica.', fonte: { label: 'Fiscomania', url: 'https://fiscomania.com/agenzie-di-viaggio-iva-74-ter/' } },
      { titolo: 'Fattura', testo: 'La fattura va emessa anche senza richiesta del cliente, senza esporre l’IVA, con l’indicazione che l’imposta è assolta con il regime speciale e che non dà diritto a detrazione. In fattura elettronica si usa il tipo TD01 con natura N5 (regime del margine) e aliquota zero.', fonte: { label: 'Tripmaster: guida 74-ter', url: 'https://www.tripmaster.cloud/blog/normativa/regime-iva-74-ter-guida-operativa-per-agenzie-di-viaggio-e-tour-operator' } },
      { titolo: 'Registri', testo: 'Le operazioni 74-ter si annotano distinte da quelle ordinarie: nel registro dei corrispettivi e, per ogni pratica, nel registro delle pratiche con numero, data di partenza, corrispettivo, costi di terzi e margine. I documenti di acquisto vanno distinti nel registro acquisti.' },
      { titolo: 'Detrazione dell’IVA', testo: 'L’IVA sui servizi che compongono il pacchetto non è detraibile. Si detrae solo quella sui costi generali dell’agenzia (affitto, utenze, software).' },
      { titolo: 'Servizi extra UE', testo: 'I servizi acquistati fuori dall’Unione Europea hanno un trattamento diverso nel calcolo del margine, e nei pacchetti misti il margine va ripartito. È uno dei punti dove serve il commercialista.' },
      { titolo: 'LIPE e dichiarazione', testo: 'Nelle comunicazioni trimestrali si riporta il margine del regime speciale. La dichiarazione annuale ha una parte dedicata alle agenzie di viaggio.' },
    ],
  },
  {
    id: 'settore',
    titolo: 'Settore turistico',
    intro: 'Regole del Codice del Turismo e delle leggi regionali per chi vende viaggi.',
    voci: [
      { titolo: 'Apertura e direttore tecnico', testo: 'L’attività si apre con una SCIA al Comune e le regole variano per Regione. Quasi sempre servono onorabilità e un direttore tecnico con l’idoneità professionale richiesta, responsabile dei servizi turistici.', fonte: { label: 'Camera di Commercio di Modena', url: 'https://www.mo.camcom.it/promozione/sportello-genesi/schede-informative/agenzie-di-viaggio-tour-operator-scheda-informa' } },
      { titolo: 'Assicurazione di responsabilità civile', testo: 'Le agenzie devono avere una polizza a garanzia degli obblighi assunti verso i clienti con il contratto di viaggio, stipulata prima della SCIA e da tenere sempre in corso.', fonte: { label: 'Codice del Turismo, art. 19', url: 'https://www.ricercagiuridica.com/codici/vis.php?num=14236' } },
      { titolo: 'Garanzia per insolvenza o fallimento', testo: 'Chi organizza pacchetti deve tutelare i viaggiatori in caso di insolvenza o fallimento, con una polizza o una fideiussione bancaria. Se l’agenzia vende soltanto pacchetti di altri organizzatori, la garanzia spetta a loro: va chiarito caso per caso.', fonte: { label: 'Codice del Turismo, art. 47', url: 'https://www.codicedelturismo.it/titolo-6/art-47-efficacia-e-portata-della-protezione-in-caso-d-insolvenza-o-fallimento/' } },
      { titolo: 'Contratto e informazioni al viaggiatore', testo: 'Prima della vendita il cliente riceve le informazioni precontrattuali standard e poi il contratto con prezzo, servizi, condizioni di recesso e di modifica. Il gestionale tiene le pratiche con passeggeri, servizi e piano di incasso: base per produrre questi documenti.' },
      { titolo: 'Documenti dei viaggiatori', testo: 'L’agenzia deve informare sui documenti necessari (passaporto, visti, validità residua). Il gestionale segnala i passaporti con validità insufficiente o la carta d’identità dove serve il passaporto.' },
    ],
  },
  {
    id: 'privacy',
    titolo: 'Privacy e carte di pagamento',
    intro: 'L’agenzia tratta documenti, dati di salute e carte: le regole sono più strette che in altri negozi.',
    voci: [
      { titolo: 'Informativa e registro dei trattamenti', testo: 'Ogni cliente riceve l’informativa privacy. L’agenzia tiene un registro dei trattamenti e designa chi può accedere ai dati (i dipendenti sono autorizzati al trattamento).', fonte: { label: 'Garante per la protezione dei dati personali', url: 'https://www.garanteprivacy.it' } },
      { titolo: 'Email promozionali', testo: 'Newsletter e offerte richiedono il consenso del cliente, che deve poterlo revocare in ogni momento: ogni email deve contenere il link per annullare l’iscrizione. In questo gestionale le campagne escludono chi non ha dato il consenso.' },
      { titolo: 'Dati particolari', testo: 'Allergie, esigenze di mobilità o motivi religiosi legati al viaggio sono dati particolari: servono un consenso esplicito e una conservazione limitata allo stretto necessario.' },
      { titolo: 'Carte di credito dei clienti', testo: 'Le carte non si possono conservare in chiaro: servono cifratura, accesso limitato e registro di chi le consulta, secondo lo standard PCI-DSS. Il codice CVV non può essere memorizzato dopo l’autorizzazione. In questa demo le carte restano nel browser solo a scopo dimostrativo.' },
      { titolo: 'Violazioni dei dati', testo: 'Se vengono persi o rubati dati personali, la violazione va notificata al Garante entro 72 ore dalla scoperta, quando c’è un rischio per le persone.' },
    ],
  },
  {
    id: 'pagamenti',
    titolo: 'Pagamenti e contanti',
    intro: 'Limiti all’uso del contante e obblighi sui pagamenti elettronici.',
    voci: [
      { titolo: 'Limite al contante', testo: 'Il limite generale per i pagamenti in contanti è di 5.000 euro (soglia in vigore dal 2023). Per i turisti stranieri non residenti è previsto un limite più alto per gli acquisti di servizi turistici: verificare la soglia vigente prima di accettare importi elevati.' },
      { titolo: 'POS', testo: 'Chi vende a consumatori deve accettare pagamenti con carta o altri strumenti elettronici. Il mancato rispetto comporta una sanzione.' },
      { titolo: 'Conservazione dei documenti', testo: 'Fatture, registri e scritture contabili vanno conservati per dieci anni, anche in formato elettronico secondo le regole di conservazione.' },
    ],
  },
  {
    id: 'lavoro',
    titolo: 'Dipendenti e sicurezza',
    intro: 'Obblighi di chi ha personale.',
    voci: [
      { titolo: 'Sicurezza sul lavoro', testo: 'Servono il documento di valutazione dei rischi, la formazione dei dipendenti e la sorveglianza sanitaria per chi lavora a lungo al videoterminale. Le scadenze dei corsi si registrano nei rinnovi dell’agenzia.' },
      { titolo: 'Consulente del lavoro', testo: 'Buste paga, contributi, CU e modello 770 passano di norma dal consulente del lavoro: si coordina con il commercialista per il nuovo obbligo sulle ritenute delle provvigioni.' },
    ],
  },
]

export const calcolaRitenuta = (provvigione: number, conPersonale: boolean, fornitoreItaliano: boolean) => {
  const base = provvigione * (conPersonale ? 0.2 : 0.5)
  const ritenuta = fornitoreItaliano ? base * 0.23 : 0
  return { base, ritenuta, netto: provvigione - ritenuta, incidenza: fornitoreItaliano ? (conPersonale ? 4.6 : 11.5) : 0 }
}
