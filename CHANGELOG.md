# Registro degli aggiornamenti

Tutte le modifiche a Combo Lab, dalla più recente alla più vecchia.
Ogni versione corrisponde a una pubblicazione dell'app (il numero è la versione della cache offline in `sw.js`).

---

## 18 novembre 2026

### v17 — Indicatore "Salvato"
- Dentro ogni combo e ogni deck, in alto a destra, compare lo stato del salvataggio:
  **Salvataggio…**, **✓ Salvato**, **Offline**, **Non sincronizzato**.
- Toccandolo si apre l'account; in caso di errore riprova la sincronizzazione.
- Il salvataggio resta automatico e istantaneo.

### v16 — Formati Moderno ed Edison, ricerca nella scheda Deck
- Ogni deck ha un **formato**: **Moderno** (banlist TCG aggiornata) o **Edison**.
- **Edison**: la ricerca mostra solo le carte del formato; banlist del 1° marzo 2010
  (43 Proibite, 70 Limitate, 19 Semi-Limitate); avviso per le carte uscite dopo il 2010.
- Il formato si sceglie alla creazione e all'import `.ydk`, e si può cambiare dal deck.
- Nella scheda **Deck** della home: barra per cercare una carta e leggerne l'effetto;
  i deck sono raggruppati per formato.

### v15 — Pulsante "Nuova combo" più in basso su iPhone
- Ridotto lo spazio sopra la barra Home di iOS; su computer nessun cambiamento.

### v14 — Ricerca carte più tollerante
- Spazi, trattini e simboli vengono ignorati: "blue eyes" trova "Blue-Eyes…",
  "ash blossom joyous" trova "Ash Blossom & Joyous Spring".
- Vale per il database, per le carte del deck e per la ricerca delle combo.

### v13 — Lente per consultare una carta
- Nella pagina del deck, la lente apre una ricerca in sola lettura: si legge l'effetto
  e con "Indietro" si torna ai risultati.

### v12 — Carte in inglese
- Nomi ed effetti delle carte in inglese (testo originale TCG), disponibile per tutte le carte.
- Le carte già salvate vengono convertite; il nome italiano resta come nome secondario.
- La ricerca accetta anche i nomi italiani.
- L'italiano resta selezionabile dalle impostazioni.

### v11 — Anteprima della carta al passaggio del mouse (computer)
- Immagine grande, statistiche, stato in banlist ed effetto completo.
- Attiva su deck, ricerca, test mano, board e schema delle combo.

### v10 — Carte più grandi su computer
- Solo con schermo largo e mouse: griglia del deck più grande ed effetto al passaggio del mouse.

### v9 — Conferma della password
- Schermate separate "Accedi" e "Crea account"; in registrazione la password va ripetuta.
- Pulsante "Mostra/Nascondi" password.

### v8 — Account e sincronizzazione
- Accesso con email e password.
- Combo e deck sincronizzati tra iPhone e PC; al primo accesso vengono caricati quelli
  già presenti sul dispositivo.
- Funziona anche offline: le modifiche vengono inviate al ritorno della connessione.
- Icona a nuvola nella home con lo stato della sincronizzazione.

### v7 — Banlist TCG
- Banlist TCG scaricata da YGOPRODeck e aggiornata ogni 3 giorni.
- Limite di copie secondo la banlist (Proibita, Limitata, Semi-Limitata); badge sulle carte.
- Avviso per le carte oltre il limite, anche dopo un import.

### v6 — Test mano
- Pesca 5 carte casuali dal Main Deck; "Nuova mano" e "Pesca 1".
- Elenco delle combo che si possono iniziare con la mano pescata.

### v5 — Pulsante X
- Ogni finestra a scomparsa ha una X per chiuderla.

### v4 — Trascinamento delle carte nel deck
- Pressione lunga (o trascinamento col mouse) per riordinare o spostare una copia
  tra Main, Extra e Side; cestino per togliere una copia.

### v3 — Deck building
- Nuova scheda **Deck** con griglia Main / Extra / Side.
- Fusion, Synchro, Xyz e Link vanno da sole nell'Extra Deck; massimo 3 copie per carta.
- Import ed export `.ydk`; backup `.json` con combo e deck.
- Le combo possono essere collegate a un deck: le sue carte compaiono per prime nella ricerca.

### v2 — Piani B, board finale, Riproduci
- Frecce "Piano B" tratteggiate con una condizione (es. "se l'avversario usa Ash Blossom").
- Board finale per ogni combo: terreno, mano, Cimitero, bandite e note sulle interruzioni.
- Modalità **Riproduci**: la combo passo per passo.

### v1 — Prima versione
- Web app installabile su iPhone dalla schermata Home.
- Ricerca carte dal database YGOPRODeck con immagini.
- Schema a blocchi delle combo: carte collegate da frecce con l'azione e il numero del passo.
- Salvataggio sul dispositivo, uso offline, export/import di backup.
