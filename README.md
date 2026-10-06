# Skills de Boki

Skills para agentes de IA (Claude Code, Codex, Cursor y otros) que te ahorran trámites con el SII.

## boletas

Descarga **todas tus boletas de honorarios emitidas vigentes** desde el SII en un solo ZIP:

- el PDF de cada boleta vigente (las anuladas quedan fuera)
- `boletas.csv` con número, fecha, receptor, montos y retención (se abre en Excel)
- los datos originales del SII en JSON

Todo corre en tu navegador, con tu sesión del SII. Tu Clave Tributaria nunca pasa por el agente, y tus datos no salen de tu computador.

### Instalar

```bash
npx skills add boki-cl/skills --skill boletas
```

Después pídele a tu agente: *"descarga mis boletas de honorarios del SII"*. Tu agente necesita control del navegador (Claude in Chrome, Playwright MCP u otro). Él abre la página y te pide que inicies sesión. Tú inicias sesión.

### Sin agente

1. Inicia sesión en sii.cl y abre https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi
2. Abre la consola del navegador: Cmd+Option+J en Mac, Ctrl+Shift+J en Windows o Linux.
3. Lee [`export.js`](skills/boletas/scripts/export.js), pega su contenido en la consola y presiona Enter.
4. Espera el mensaje "Listo". El ZIP queda en tu carpeta de Descargas.

### Qué hace el script

Léelo antes de pegarlo en la consola. Pegar código que no entiendes en la consola de una página con tu sesión iniciada es arriesgado, también este. El script:

- lee el informe mensual de boletas emitidas de cada mes (`TMBCOC_InformeMensualBhe.cgi`)
- descarga el PDF de cada boleta por su código (`TMBCOT_ConsultaBoletaPdf.cgi`)
- arma el ZIP en tu navegador y lo guarda en Descargas

Solo hace consultas GET a `loa.sii.cl`. No envía datos a ningún otro sitio, no ejecuta el contenido de las páginas del SII y no llena formularios. Los detalles están en [`references/how-it-works.md`](skills/boletas/references/how-it-works.md).

### Límites

- El SII muestra en línea unos siete años de boletas. Las más antiguas no aparecen, y el script te dice cuáles faltan.
- Solo descarga boletas emitidas y vigentes. Las anuladas y las recibidas no se incluyen.

---

Hecho por [Boki](https://boki.cl): emite tus boletas de honorarios por ti, todos los meses.

No afiliado al Servicio de Impuestos Internos (SII). Licencia MIT, © 2026 Codeness SpA.
