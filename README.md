# Combo Lab

Web app (PWA) per creare schemi a blocchi delle combo di Yu-Gi-Oh!.
Dati e immagini delle carte da [YGOPRODeck](https://ygoprodeck.com/api-guide/). App non ufficiale, per uso personale.

## Provarla sul PC
```
python -m http.server 8765
```
poi apri http://localhost:8765

## Pubblicarla (GitHub Pages)
1. Carica questi file in un repository GitHub.
2. Settings → Pages → Source: "Deploy from a branch" → branch `main`, cartella `/ (root)`.
3. Dopo un minuto l'app è su `https://<utente>.github.io/<repository>/`.

## Installarla su iPhone
Apri l'indirizzo in **Safari** → Condividi → **Aggiungi alla schermata Home**.

Quando modifichi `app.js`/`style.css`, aumenta `VERSION` in `sw.js`.
