# Combo Lab

Web app per studiare le combo di **Yu-Gi-Oh!** con schemi a blocchi, costruire deck e
provare le mani iniziali, con una sezione per il deck building di **Magic: The Gathering**.
Si usa su iPhone (aggiunta alla schermata Home) e su computer.

App non ufficiale, per uso personale. Dati e immagini delle carte da
[YGOPRODeck](https://ygoprodeck.com/api-guide/) (Yu-Gi-Oh!) e [Scryfall](https://scryfall.com/docs/api) (Magic).

Tutte le modifiche sono elencate in [CHANGELOG.md](CHANGELOG.md).

---

## Funzioni

### Combo
- **Schema a blocchi**: ogni carta è un blocco, le frecce indicano l'azione
  (Normal Summon, Cerca dal Deck, Link Summon…) e il numero del passo.
- **Doppio clic / doppio tocco** su un punto vuoto dello schema per aggiungere una carta lì.
- **Piani B**: frecce tratteggiate con una condizione, per le varianti della combo.
- **Board finale**: cosa resta sul terreno, in mano, nel Cimitero e bandito, più le interruzioni.
- **Riproduci**: la combo mostrata un passo alla volta.
- **Starter**: nella home si filtrano le combo per carta di partenza.

### Deck
- Griglia **Main / Extra / Side**, con trascinamento delle carte.
- **Formati**: **Moderno** (banlist TCG aggiornata automaticamente) ed **Edison**
  (carte fino al 2010, banlist del 1° marzo 2010).
- Controllo dei limiti di copie e avvisi per le carte non valide nel formato.
- **Test mano**: 5 carte casuali, con l'elenco delle combo che si possono iniziare.
- Import ed export in formato **`.ydk`**.
- Ricerca rapida per **leggere l'effetto** di una carta.

### Magic: The Gathering
- Si sceglie in alto nella home (**Yu-Gi-Oh! | Magic**).
- Deck building nel formato **Modern**: Main Deck e Sideboard, massimo 4 copie (terre base escluse).
- Avvisi per le carte bandite o non legali in Modern.
- Curva di mana, colori e costo medio; test mano da 7 carte.
- Import incollando una lista (Arena/MTGO) ed export in testo.
- Ricerca carte per nome inglese o italiano.

### Carte
- Ricerca per nome inglese o italiano; spazi, trattini e simboli vengono ignorati.
- Testi in inglese (originale TCG); l'italiano è selezionabile nelle impostazioni.
- Su computer, passando il mouse su una carta si vede l'immagine grande con l'effetto.

### Salvataggio e account
- Tutto viene salvato **automaticamente** sul dispositivo; l'app funziona anche offline.
- Con un **account** (email e password) combo e deck si sincronizzano tra i dispositivi.
- Backup manuale: Impostazioni → Esporta / Importa.

---

## Come si usa

### Su iPhone
1. Apri l'indirizzo dell'app in **Safari**.
2. Condividi → **Aggiungi alla schermata Home**.
3. Apri l'app dall'icona. Gli aggiornamenti arrivano da soli alla riapertura.

### Su computer
Apri lo stesso indirizzo in Chrome o Edge.

### Sincronizzare i dispositivi
Tocca la nuvola in alto nella home e accedi con lo stesso account su ogni dispositivo.

---

## Come è fatta

| Parte | Tecnologia |
|---|---|
| App | HTML, CSS e JavaScript, senza framework (`index.html`, `style.css`, `app.js`) |
| Uso offline | Service worker (`sw.js`) |
| Pubblicazione | GitHub Pages, dal branch `main` |
| Dati delle carte e banlist TCG | API pubblica di YGOPRODeck |
| Carte Magic e legalità | API pubblica di Scryfall |
| Account e sincronizzazione | Firebase Authentication + Cloud Firestore (piano gratuito) |

I dati di ogni utente sono salvati in Firestore sotto `users/<id utente>/` e le regole
di sicurezza permettono a ogni account di leggere e scrivere solo i propri dati.
La configurazione Firebase presente nel codice identifica il progetto e non dà accesso ai dati.

### Provarla in locale
```
python -m http.server 8765
```
poi apri http://localhost:8765

### Quando si modifica l'app
Aumentare `VERSION` in `sw.js`, così i dispositivi scaricano la nuova versione,
e aggiungere una voce in `CHANGELOG.md`.
