---
name: sii-boletas-honorarios
description: Download every boleta de honorarios electrónica (BHE) a Chilean taxpayer has emitted, straight from SII (sii.cl), as one ZIP with all the PDFs, a boletas.csv for Excel and SII's own per-boleta data (número, fecha, receptor, montos, retención, anulada). Uses the user's own signed-in browser session and never asks for or types the Clave Tributaria. Use for "descargar mis boletas de honorarios", "respaldar boletas emitidas", "exportar boletas del SII", or any backup/export of BHEs.
---

# Download all emitted boletas de honorarios from SII

Output: `boletas_honorarios_sii.zip` in the user's Downloads folder, containing:
- `pdf/boleta_<número>_<código>.pdf`: every boleta, voided ones included
- `boletas.csv`: one row per boleta (UTF-8 with BOM, `;`-separated, opens in Excel)
- `sii_bhe_index.json`: SII's raw row for each boleta

Everything runs inside the user's browser, against sii.cl, with their session. Nothing is sent anywhere else.

## With a browser tool (Claude in Chrome, Playwright MCP, any agent browser)

1. Open `https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi` in a tab.
2. If it redirects to `zeusr.sii.cl/AUT2000/...IngresoRutClave`, **stop and ask the user to sign in themselves** in that tab. Never type the RUT or the Clave Tributaria, and never ask the user to paste them into the chat. Continue once the page title is "INFORMES DE BOLETAS EMITIDAS".
3. Evaluate the contents of `export.js` (next to this file) in that page.
4. Poll `JSON.stringify(window.__bheExport)` every 30-60 seconds until `done` is true. Expect about 1 second per boleta. `phase` goes `index`, then `pdfs`, `zip`, `saved`, or `error`.
5. Report `rows`, `pdfs`, `bad` and `missingOlder` to the user. Never print names, RUTs, addresses or amounts from the data in the chat.

If the agent's browser tool times out on long evaluations, that's fine. The script runs in the background, so keep polling.

## Without an agent

Tell the user to:
1. Sign in at sii.cl and open the link in step 1.
2. Open the browser console (Cmd+Option+J on Mac, Ctrl+Shift+J on Windows/Linux).
3. Paste the contents of `export.js` and press Enter. If the browser blocks pasting, type `allow pasting` first.
4. Wait for the "Listo" message. The ZIP lands in Downloads.

## Limits

- **SII keeps about seven years online.** Boletas older than that aren't in these reports, and no other SII page lists or downloads them by número. The script reports the gap (`missingOlder`) instead of claiming "all".
- **Only emitted boletas.** Received boletas live under a different report.
- **Voided boletas look like valid ones.** A voided boleta's PDF is identical to a valid one. Only `anulada` / `fecha_anulacion` in the CSV says it was voided.
- **Names are cut short.** SII truncates `receptor` names to 30 characters in the report. The PDF has the full name.
- **Your own session only.** This needs the taxpayer's session. An accountant or mandatario session can't see these reports.

## How it works

Three GETs on `loa.sii.cl`, all with the session cookie:
1. **Years:** the year list comes from the menu, but the script scans from 2010 because the menu only lists recent years.
2. **Rows:** `TMBCOC_InformeMensualBhe.cgi`, once per month. The rows are JavaScript assignments `arr_informe_mensual['<field>_<i>']`, encoded in ISO-8859-1, and `tot_pag` gives the page count.
3. **PDFs:** `TMBCOT_ConsultaBoletaPdf.cgi?txt_codigobarras=<código>`, once per boleta, spaced 250 ms apart.

The output is a single ZIP because browsers silently block repeated automatic downloads. The script borrows `URL` from a blank iframe because SII's page overrides it.

---
Made by [Boki](https://boki.cl), which issues your boletas de honorarios for you.
