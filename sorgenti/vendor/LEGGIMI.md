# Librerie e caratteri ospitati con l'app

Copie a versione fissa dei componenti di terzi che l'app usa (voce T-007 del piano di adeguamento; libro mastro, § 2.4, «Caratteri e librerie», e § 3.11). Il telefono le riceve dallo stesso indirizzo dell'app e non chiede nulla a Google Fonts, unpkg o cdnjs.

Il montaggio copia ogni file in `lib/` di ciascuna uscita, con accanto il testo della sua licenza (da `licenze/`), e scrive `lib/caratteri/caratteri.css` da `caratteri.css`. `elenco.js` annota cartelle, file e impronte SHA-256: la prova `prove/componenti.js` fallisce se un file non è identico a quello annotato.

| Cartella | Componente | Da dove viene il file (17/11/2026) |
| --- | --- | --- |
| `maplibre-gl-5.24.0/` | MapLibre GL JS 5.24.0 | Pacchetto npm `maplibre-gl@5.24.0`, `dist/maplibre-gl.js` e `dist/maplibre-gl.css` |
| `jspdf-2.5.1/` | jsPDF 2.5.1 | Pacchetto npm `jspdf@2.5.1`, `dist/jspdf.umd.min.js` (lo stesso file che l'app scaricava da cdnjs) |
| `sheetjs-0.18.5/` | SheetJS Community Edition 0.18.5 | Pacchetto npm `xlsx@0.18.5`, `dist/xlsx.full.min.js` (lo stesso file che l'app scaricava da cdnjs). Con T-042 resta solo nell'app della redazione, in una versione senza le vulnerabilità note della 0.18.5 |
| `caratteri/dm-sans-v17/` | DM Sans, versione v17 di Google Fonts, asse dell'altezza ottica | Pacchetto npm `@fontsource-variable/dm-sans@5.3.0`, file `opsz-normal` per i caratteri latini ed europei estesi |
| `caratteri/dm-serif-display-v17/` | DM Serif Display, versione v17 di Google Fonts | Pacchetto npm `@fontsource/dm-serif-display@5.3.0`, file `400-normal` per i caratteri latini ed europei estesi |

I file sono identici a quelli dei pacchetti, avvisi di licenza compresi: non si modificano. Il corsivo dei caratteri non è incluso perché l'app non lo chiedeva neppure a Google Fonts. L'arabo usa i caratteri del telefono, come prima.
