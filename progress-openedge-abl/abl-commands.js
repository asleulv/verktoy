// ABL Syntax Reference Data
// Format: { name, cat, desc, ex }
// Kategoriar: Variablar, Datatypar, Kontrollflyt, Løkker, Database, TEMP-TABLE, Prosedyrar, Strengfunksjonar, Tallfunksjonar, Datofunksjonar, Feilhandtering, I/O, Misc

const ablCommands = [

  // ─── Variablar & Definisjonar ───────────────────────────────────────────────
  {
    name: 'DEFINE VARIABLE',
    cat: 'Variablar',
    desc: 'Definerer ein variabel med datatype og eventuell startverdi.',
    ex: 'define variable _counter as integer no-undo init 0.'
  },
  {
    name: 'DEFINE PARAMETER',
    cat: 'Variablar',
    desc: 'Definerer ein inn- eller utparameter til ein prosedyre eller funksjon.',
    ex: 'define input parameter _cust-id as integer no-undo.'
  },
  {
    name: 'DEFINE BUFFER',
    cat: 'Variablar',
    desc: 'Lagar ein alternativ buffer for ei databasetabell (nyttig ved self-joins).',
    ex: 'define buffer b__customer for customer.'
  },
  {
    name: 'NO-UNDO',
    cat: 'Variablar',
    desc: 'Hindrar at variabelen blir rulla tilbake ved transaksjonsfeil. Bruk alltid med enkle variablar.',
    ex: 'define variable _name as character no-undo.'
  },
  {
    name: 'ASSIGN',
    cat: 'Variablar',
    desc: 'Tilordnar ein eller fleire verdiar. Meir effektivt enn fleire enkeltliner med =.',
    ex: 'assign _name = "Ola"\n       _age  = 30.'
  },

  // ─── Datatypar ──────────────────────────────────────────────────────────────
  {
    name: 'CHARACTER',
    cat: 'Datatypar',
    desc: 'Tekststreng, variabel lengd. Alias: CHAR.',
    ex: 'define variable _msg as character no-undo.'
  },
  {
    name: 'INTEGER',
    cat: 'Datatypar',
    desc: 'Heiltal (32-bit). Alias: INT.',
    ex: 'define variable _count as integer no-undo.'
  },
  {
    name: 'INT64',
    cat: 'Datatypar',
    desc: 'Heiltal (64-bit). Bruk for store tal som ikkje passar i INTEGER.',
    ex: 'define variable _big-num as int64 no-undo.'
  },
  {
    name: 'DECIMAL',
    cat: 'Datatypar',
    desc: 'Desimaltal med høg presisjon. Alias: DEC.',
    ex: 'define variable _price as decimal no-undo.'
  },
  {
    name: 'LOGICAL',
    cat: 'Datatypar',
    desc: 'Boolsk verdi: TRUE/FALSE eller YES/NO.',
    ex: 'define variable _active as logical no-undo init true.'
  },
  {
    name: 'DATE',
    cat: 'Datatypar',
    desc: 'Dato utan klokkeslett.',
    ex: 'define variable _birth-date as date no-undo.'
  },
  {
    name: 'DATETIME',
    cat: 'Datatypar',
    desc: 'Dato med klokkeslett (utan tidssone).',
    ex: 'define variable _created as datetime no-undo.'
  },
  {
    name: 'DATETIME-TZ',
    cat: 'Datatypar',
    desc: 'Dato med klokkeslett og tidssone.',
    ex: 'define variable _ts as datetime-tz no-undo.'
  },
  {
    name: 'ROWID',
    cat: 'Datatypar',
    desc: 'Intern rad-identifikator for ein databasepost.',
    ex: 'define variable _rid as rowid no-undo.'
  },
  {
    name: 'HANDLE',
    cat: 'Datatypar',
    desc: 'Referanse til eit ABL-objekt, query, widget osv.',
    ex: 'define variable _qh as handle no-undo.'
  },
  {
    name: 'LONGCHAR',
    cat: 'Datatypar',
    desc: 'Stor tekststreng (opp til 2 GB). Brukt for BLOB-liknande tekst.',
    ex: 'define variable _xml-data as longchar no-undo.'
  },
  {
    name: 'MEMPTR',
    cat: 'Datatypar',
    desc: 'Binær minnepeikar for rådata/bytestraumar.',
    ex: 'define variable _buf as memptr no-undo.'
  },

  // ─── Kontrollflyt ───────────────────────────────────────────────────────────
  {
    name: 'IF / THEN / ELSE',
    cat: 'Kontrollflyt',
    desc: 'Vanleg viss-elles-setning. ELSE er valfritt.',
    ex: 'if _age >= 18 then\n  message "Vaksen."\nelse\n  message "Mindreårig."'
  },
  {
    name: 'CASE',
    cat: 'Kontrollflyt',
    desc: 'Fleire alternativ basert på verdien til ein variabel.',
    ex: 'case _status:\n  when "A" then message "Aktiv."\n  when "I" then message "Inaktiv."\n  otherwise message "Ukjend."\nend case.'
  },
  {
    name: 'RETURN',
    cat: 'Kontrollflyt',
    desc: 'Avsluttar ein prosedyre eller funksjon, eventuelt med returverdi.',
    ex: 'return _result.'
  },
  {
    name: 'LEAVE',
    cat: 'Kontrollflyt',
    desc: 'Hoppar ut av ein namngitt blokk eller løkke.',
    ex: 'leave main-loop.'
  },
  {
    name: 'NEXT',
    cat: 'Kontrollflyt',
    desc: 'Hoppar til neste iterasjon i ein løkke.',
    ex: 'next main-loop.'
  },
  {
    name: 'UNDO',
    cat: 'Kontrollflyt',
    desc: 'Rullar tilbake ein transaksjon og/eller hoppar ut av ein blokk.',
    ex: 'undo, leave main-loop.'
  },

  // ─── Løkker ─────────────────────────────────────────────────────────────────
  {
    name: 'DO ... END',
    cat: 'Løkker',
    desc: 'Generell blokk, kan namngivast. Med WHILE for betinga løkke.',
    ex: 'main-loop:\ndo while _i < 10:\n  assign _i = _i + 1.\nend.'
  },
  {
    name: 'DO i = x TO y',
    cat: 'Løkker',
    desc: 'Talbasert teljeløkke frå x til y, valfritt BY steg.',
    ex: 'do _i = 1 to 10:\n  message _i.\nend.'
  },
  {
    name: 'REPEAT',
    cat: 'Løkker',
    desc: 'Uendeleg løkke (bruk LEAVE for å avslutte). Kan namngivast.',
    ex: 'main-loop:\nrepeat:\n  if _done then leave main-loop.\nend.'
  },
  {
    name: 'FOR EACH',
    cat: 'Løkker',
    desc: 'Itererer gjennom databasepostar. Kan kombinerast med WHERE, BY osv.',
    ex: 'for each customer no-lock\n    where customer.active = true:\n  message customer.name.\nend.'
  },

  // ─── Database / Query ───────────────────────────────────────────────────────
  {
    name: 'FOR EACH ... NO-LOCK',
    cat: 'Database',
    desc: 'Les databasepostar utan låsing. Bruk alltid NO-LOCK for lesing.',
    ex: 'for each order no-lock\n    where order.cust-num = _cust-id:\nend.'
  },
  {
    name: 'FOR EACH ... EXCLUSIVE-LOCK',
    cat: 'Database',
    desc: 'Les og skriv til postar med eksklusiv lås. Brukt inne i transaksjonar.',
    ex: 'for each customer exclusive-lock\n    where customer.id = _id:\n  assign customer.name = _new-name.\nend.'
  },
  {
    name: 'FIND FIRST / FIND LAST',
    cat: 'Database',
    desc: 'Finn første eller siste post som matchar WHERE-betingelsen.',
    ex: 'find first customer no-lock\n    where customer.id = _id no-error.'
  },
  {
    name: 'AVAILABLE',
    cat: 'Database',
    desc: 'Sjekkar om ein buffer inneheld ein gyldig post etter FIND.',
    ex: 'if available customer then\n  message customer.name.'
  },
  {
    name: 'CREATE',
    cat: 'Database',
    desc: 'Lagar ein ny databasepost i bufferen.',
    ex: 'create customer.\nassign customer.name = "Ola"\n       customer.id   = _new-id.'
  },
  {
    name: 'DELETE',
    cat: 'Database',
    desc: 'Slettar den gjeldande posten i bufferen.',
    ex: 'find first customer exclusive-lock\n    where customer.id = _id no-error.\nif available customer then delete customer.'
  },
  {
    name: 'WHERE',
    cat: 'Database',
    desc: 'Filterbetingelse i FOR EACH og FIND. Støttar AND, OR, NOT, BEGINS, MATCHES.',
    ex: 'for each customer no-lock\n    where customer.name begins "An"\n      and customer.active = true:'
  },
  {
    name: 'BY',
    cat: 'Database',
    desc: 'Sorterer resultata i FOR EACH. Fleire felt separert med BY.',
    ex: 'for each customer no-lock\n    by customer.name\n    by customer.id:'
  },
  {
    name: 'BEGINS',
    cat: 'Database',
    desc: 'Strengsamanlikning: returnerer TRUE om feltet startar med gitt tekst.',
    ex: 'where customer.name begins "Ole"'
  },
  {
    name: 'MATCHES',
    cat: 'Database',
    desc: 'Mønsterbasert strengsamanlikning. * = fleire teikn, . = eitt teikn.',
    ex: 'where customer.email matches "*@example.com"'
  },
  {
    name: 'TRANSACTION',
    cat: 'Database',
    desc: 'Markerer ein transaksjonblokk. Endringar kan rulle tilbake ved feil.',
    ex: 'do transaction:\n  create order.\n  assign order.cust-num = _id.\nend.'
  },
  {
    name: 'DEFINE QUERY',
    cat: 'Database',
    desc: 'Definerer ein namngitt query-objekt for programmatisk bruk.',
    ex: 'define query q__cust for customer.'
  },
  {
    name: 'OPEN QUERY',
    cat: 'Database',
    desc: 'Opnar og køyrer ein definert query.',
    ex: 'open query q__cust for each customer no-lock.'
  },
  {
    name: 'GET NEXT',
    cat: 'Database',
    desc: 'Hentar neste rad frå ein open query.',
    ex: 'get next q__cust.\nif available customer then ...'
  },
  {
    name: 'CLOSE QUERY',
    cat: 'Database',
    desc: 'Lukkar ein open query og frigjer ressursar.',
    ex: 'close query q__cust.'
  },
  {
    name: 'CAN-FIND',
    cat: 'Database',
    desc: 'Returnerer TRUE om ein post finst utan å laste han inn i buffer.',
    ex: 'if can-find(first customer\n    where customer.id = _id) then ...'
  },

  // ─── TEMP-TABLE ─────────────────────────────────────────────────────────────
  {
    name: 'DEFINE TEMP-TABLE',
    cat: 'TEMP-TABLE',
    desc: 'Definerer ein midlertidig tabell i minnet. Prefikskonvensjon: wrk1 / w1__.',
    ex: 'define temp-table wrk1 no-undo\n  field w1__id   as integer\n  field w1__name as character\n  index ix-id is primary w1__id.'
  },
  {
    name: 'FOR EACH (TEMP-TABLE)',
    cat: 'TEMP-TABLE',
    desc: 'Itererer gjennom rader i ein temp-table, same syntaks som database.',
    ex: 'for each wrk1 no-lock\n    by wrk1.w1__name:\n  message wrk1.w1__name.\nend.'
  },
  {
    name: 'EMPTY TEMP-TABLE',
    cat: 'TEMP-TABLE',
    desc: 'Tømer alle rader frå ein temp-table.',
    ex: 'empty temp-table wrk1.'
  },
  {
    name: 'CREATE (TEMP-TABLE)',
    cat: 'TEMP-TABLE',
    desc: 'Lagar ein ny rad i temp-table.',
    ex: 'create wrk1.\nassign wrk1.w1__id   = _id\n       wrk1.w1__name = _name.'
  },

  // ─── Prosedyrar & Funksjonar ────────────────────────────────────────────────
  {
    name: 'PROCEDURE',
    cat: 'Prosedyrar',
    desc: 'Definerer ein intern prosedyre (subrutine). Kallast med RUN.',
    ex: 'procedure p-print-name:\n  define input parameter _name as character no-undo.\n  message _name.\nend procedure.'
  },
  {
    name: 'FUNCTION',
    cat: 'Prosedyrar',
    desc: 'Definerer ein funksjon som returnerer ein verdi. Krev FORWARD-deklarasjon.',
    ex: 'function f-double returns integer\n    (input _n as integer):\n  return _n * 2.\nend function.'
  },
  {
    name: 'FORWARD',
    cat: 'Prosedyrar',
    desc: 'Førehandsdeklarerer ein funksjon slik at ho kan kallast før definisjon.',
    ex: 'function f-double returns integer\n    (input _n as integer) forward.'
  },
  {
    name: 'RUN',
    cat: 'Prosedyrar',
    desc: 'Kallar ein intern prosedyre eller ein ekstern .p/.r-fil.',
    ex: 'run p-print-name(_cust-name).\nrun utils/helper.p.'
  },
  {
    name: 'INPUT / OUTPUT / INPUT-OUTPUT',
    cat: 'Prosedyrar',
    desc: 'Parameterretning: INPUT (inn), OUTPUT (ut), INPUT-OUTPUT (begge vegar).',
    ex: 'run p-calc(input _a, output _result).'
  },

  // ─── Strengfunksjonar ───────────────────────────────────────────────────────
  {
    name: 'STRING()',
    cat: 'Strengfunksjonar',
    desc: 'Konverterer ein verdi til CHARACTER.',
    ex: 'assign _msg = "ID: " + string(_id).'
  },
  {
    name: 'INTEGER()',
    cat: 'Strengfunksjonar',
    desc: 'Konverterer ein streng eller desimal til INTEGER.',
    ex: 'assign _num = integer("42").'
  },
  {
    name: 'DECIMAL()',
    cat: 'Strengfunksjonar',
    desc: 'Konverterer ein verdi til DECIMAL.',
    ex: 'assign _price = decimal("3.14").'
  },
  {
    name: 'LENGTH()',
    cat: 'Strengfunksjonar',
    desc: 'Returnerer lengda på ein streng.',
    ex: 'assign _len = length(_name).'
  },
  {
    name: 'SUBSTRING()',
    cat: 'Strengfunksjonar',
    desc: 'Returnerer ein del av ein streng frå posisjon, med valfri lengd.',
    ex: 'assign _part = substring(_name, 1, 3).'
  },
  {
    name: 'TRIM()',
    cat: 'Strengfunksjonar',
    desc: 'Fjernar mellomrom (eller andre teikn) frå start og/eller slutt.',
    ex: 'assign _clean = trim(_input).'
  },
  {
    name: 'LEFT-TRIM() / RIGHT-TRIM()',
    cat: 'Strengfunksjonar',
    desc: 'Fjernar teikn berre frå venstre eller høgre side av strengen.',
    ex: 'assign _name = left-trim(_name).'
  },
  {
    name: 'CAPS() / LC()',
    cat: 'Strengfunksjonar',
    desc: 'CAPS() gjer teksten til store bokstavar, LC() til små.',
    ex: 'assign _upper = caps(_name)\n       _lower = lc(_name).'
  },
  {
    name: 'INDEX()',
    cat: 'Strengfunksjonar',
    desc: 'Finn posisjonen til ein delstreng. Returnerer 0 om ikkje funnen.',
    ex: 'assign _pos = index(_email, "@").'
  },
  {
    name: 'REPLACE()',
    cat: 'Strengfunksjonar',
    desc: 'Erstattar alle førekomstar av ein delstreng med ein annan.',
    ex: 'assign _fixed = replace(_text, ".", ",").'
  },
  {
    name: 'ENTRY()',
    cat: 'Strengfunksjonar',
    desc: 'Hentar element nr. N frå ei kommaseparert liste (1-basert).',
    ex: 'assign _first = entry(1, _csv-line).'
  },
  {
    name: 'NUM-ENTRIES()',
    cat: 'Strengfunksjonar',
    desc: 'Tel antal element i ei kommaseparert liste.',
    ex: 'assign _count = num-entries(_csv-line).'
  },
  {
    name: 'LOOKUP()',
    cat: 'Strengfunksjonar',
    desc: 'Finn posisjonen til eit element i ei liste. Returnerer 0 om ikkje funnen.',
    ex: 'if lookup(_status, "A,B,C") > 0 then ...'
  },

  // ─── Tallfunksjonar ─────────────────────────────────────────────────────────
  {
    name: 'ABS()',
    cat: 'Tallfunksjonar',
    desc: 'Returnerer absoluttverdien (alltid positiv).',
    ex: 'assign _pos = abs(_diff).'
  },
  {
    name: 'ROUND()',
    cat: 'Tallfunksjonar',
    desc: 'Rundar av eit tal til gitt antal desimalar.',
    ex: 'assign _rounded = round(_price, 2).'
  },
  {
    name: 'TRUNCATE()',
    cat: 'Tallfunksjonar',
    desc: 'Kuttar desimalar utan avrunding.',
    ex: 'assign _trunc = truncate(_price, 0).'
  },
  {
    name: 'MINIMUM() / MAXIMUM()',
    cat: 'Tallfunksjonar',
    desc: 'Returnerer minste eller største av fleire verdiar.',
    ex: 'assign _low = minimum(_a, _b, _c).'
  },
  {
    name: 'MODULO',
    cat: 'Tallfunksjonar',
    desc: 'Reknar ut restar etter divisjon. Operator: MODULO eller MOD.',
    ex: 'if _count modulo 10 = 0 then ...'
  },

  // ─── Datofunksjonar ─────────────────────────────────────────────────────────
  {
    name: 'TODAY',
    cat: 'Datofunksjonar',
    desc: 'Returnerer dagens dato (DATE).',
    ex: 'assign _today = today.'
  },
  {
    name: 'NOW',
    cat: 'Datofunksjonar',
    desc: 'Returnerer gjeldande dato og klokkeslett (DATETIME).',
    ex: 'assign _ts = now.'
  },
  {
    name: 'DATE()',
    cat: 'Datofunksjonar',
    desc: 'Lagar ein DATE frå månad, dag og år (eller frå streng).',
    ex: 'assign _d = date(12, 31, 2024).'
  },
  {
    name: 'YEAR() / MONTH() / DAY()',
    cat: 'Datofunksjonar',
    desc: 'Henter år, månad eller dag frå ein DATE-verdi.',
    ex: 'assign _yr = year(_birth-date).'
  },
  {
    name: 'INTERVAL()',
    cat: 'Datofunksjonar',
    desc: 'Reknar ut differansen mellom to dato/klokkeslett i valt eining.',
    ex: 'assign _days = interval(today, _start-date, "days").'
  },
  {
    name: 'ADD-INTERVAL()',
    cat: 'Datofunksjonar',
    desc: 'Legg til eit tidsintervall til ein dato eller datetime.',
    ex: 'assign _next = add-interval(_start, 7, "days").'
  },

  // ─── Feilhandtering ─────────────────────────────────────────────────────────
  {
    name: 'NO-ERROR',
    cat: 'Feilhandtering',
    desc: 'Undertrykker feilmelding frå ein setning. Sjekk ERROR-STATUS etterpå.',
    ex: 'find first customer no-lock\n    where customer.id = _id no-error.'
  },
  {
    name: 'ERROR-STATUS:ERROR',
    cat: 'Feilhandtering',
    desc: 'TRUE om siste setning med NO-ERROR feila.',
    ex: 'if error-status:error then\n  message error-status:get-message(1).'
  },
  {
    name: 'ERROR-STATUS:GET-MESSAGE()',
    cat: 'Feilhandtering',
    desc: 'Hentar ei feilmelding frå ERROR-STATUS (1-basert indeks).',
    ex: 'message error-status:get-message(1).'
  },
  {
    name: 'MESSAGE',
    cat: 'Feilhandtering',
    desc: 'Viser ei melding til brukar eller i output (VIEW-AS ALERT-BOX osv.).',
    ex: 'message "Feil: " _msg view-as alert-box.'
  },
  {
    name: 'DO ON ERROR UNDO',
    cat: 'Feilhandtering',
    desc: 'Transaksjonblokk som rullar tilbake ved feil.',
    ex: 'do transaction on error undo, leave:\n  create order.\nend.'
  },
  {
    name: 'CATCH',
    cat: 'Feilhandtering',
    desc: 'Fangar opp Progress.Lang.AppError eller subklassar i structured error handling.',
    ex: 'do on error undo, throw:\n  ...\ncatch err as Progress.Lang.AppError:\n  message err:GetMessage(1).\nend catch.'
  },

  // ─── I/O ────────────────────────────────────────────────────────────────────
  {
    name: 'INPUT FROM',
    cat: 'I/O',
    desc: 'Opnar ei fil for lesing.',
    ex: 'input from "data.txt".\nimport _line.\ninput close.'
  },
  {
    name: 'OUTPUT TO',
    cat: 'I/O',
    desc: 'Opnar ei fil for skriving.',
    ex: 'output to "rapport.txt".\nput _line skip.\noutput close.'
  },
  {
    name: 'IMPORT',
    cat: 'I/O',
    desc: 'Les ei linje frå aktuell INPUT-straum inn i variablar.',
    ex: 'import _id _name.'
  },
  {
    name: 'PUT',
    cat: 'I/O',
    desc: 'Skriv til aktuell OUTPUT-straum. SKIP = ny linje.',
    ex: 'put string(_id) space _name skip.'
  },
  {
    name: 'INPUT-OUTPUT THROUGH',
    cat: 'I/O',
    desc: 'Køyrer ein ekstern prosess og les/skriv til han via STDIN/STDOUT.',
    ex: 'input-output through "sort".'
  },

  // ─── Diverse ────────────────────────────────────────────────────────────────
  {
    name: 'DISPLAY',
    cat: 'Diverse',
    desc: 'Viser verdiar i eit skjermfelt eller terminal.',
    ex: 'display _name _age with frame f-main.'
  },
  {
    name: 'FORMAT',
    cat: 'Diverse',
    desc: 'Formaterer uttrykk for visning, t.d. "x(20)", "zzz9", "99/99/9999".',
    ex: 'display _price format "zzz9.99".'
  },
  {
    name: 'PAUSE',
    cat: 'Diverse',
    desc: 'Venter på brukarinput eller eit tidsintervall.',
    ex: 'pause 5 message "Ventar 5 sekund...".'
  },
  {
    name: 'OS-COMMAND',
    cat: 'Diverse',
    desc: 'Køyrer ein OS-kommando (Windows eller Unix).',
    ex: 'os-command value("mkdir " + _path).'
  },
  {
    name: 'FILE-INFO:FILE-NAME',
    cat: 'Diverse',
    desc: 'Sjekkar om ei fil eksisterer. Tomt resultat = ikkje funnen.',
    ex: 'assign file-info:file-name = _path.\nif file-info:full-pathname = ? then ...'
  },
  {
    name: 'DYNAMIC-FUNCTION()',
    cat: 'Diverse',
    desc: 'Kallar ein funksjon dynamisk ved namn på køyretid.',
    ex: 'assign _result = dynamic-function("f-calc" in this-procedure, _val).'
  },
  {
    name: 'THIS-PROCEDURE',
    cat: 'Diverse',
    desc: 'Handle til den gjeldande prosedyren. Brukt saman med RUN og DYNAMIC-FUNCTION.',
    ex: 'run p-helper in this-procedure.'
  },
  {
    name: '/* kommentar */',
    cat: 'Diverse',
    desc: 'Blokk-kommentar. Kan spenne over fleire liner.',
    ex: '/* Dette er\n   ein kommentar */'
  },
  {
    name: '// kommentar',
    cat: 'Diverse',
    desc: 'Einlinjekommentar (støtta frå OpenEdge 10.2+).',
    ex: '// Dette er ein kommentar'
  }
];
