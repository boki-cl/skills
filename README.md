# Skills de Boki

Skills para agentes de IA (Claude Code, Codex, Cursor y otros) que te ahorran trámites con el SII.

## sii-boletas-honorarios

Descarga **todas tus boletas de honorarios emitidas** desde el SII en un solo ZIP:

- el PDF de cada boleta, también las anuladas
- `boletas.csv` con número, fecha, receptor, montos, retención y si está anulada (se abre en Excel)
- los datos originales del SII en JSON

Todo corre en tu navegador, con tu sesión del SII. Tu Clave Tributaria nunca pasa por el agente, y tus datos no salen de tu computador.

### Instalar

```bash
npx skills add boki-cl/skills --skill sii-boletas-honorarios
```

Después pídele a tu agente: *"descarga mis boletas de honorarios del SII"*. Tu agente necesita control del navegador (Claude in Chrome, Playwright MCP u otro). Él abre la página y te pide que inicies sesión. Tú inicias sesión.

### Sin agente

1. Inicia sesión en sii.cl y abre https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi
2. Abre la consola del navegador: Cmd+Option+J en Mac, Ctrl+Shift+J en Windows o Linux.
3. Pega el contenido de [`export.js`](skills/sii-boletas-honorarios/export.js) y presiona Enter.
4. Espera el mensaje "Listo". El ZIP queda en tu carpeta de Descargas.

### Límites

- El SII muestra en línea unos siete años de boletas. Las más antiguas no aparecen, y el script te dice cuáles faltan.
- Solo descarga boletas emitidas, no las recibidas.

---

Hecho por [Boki](https://boki.cl): emite tus boletas de honorarios por ti, todos los meses. Licencia MIT.
