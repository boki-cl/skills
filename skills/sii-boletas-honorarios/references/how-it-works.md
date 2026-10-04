# How the export works

These are the only requests the script makes. All are GETs on `loa.sii.cl`, sent with the user's session cookie.

| Step | Request | Notes |
|---|---|---|
| Years | The menu page you're already on, `form[0].cbanoinformeanual` | The menu only lists recent years, so the script scans every year from 2010. `rut_arrastre` and `dv_arrastre` are hidden fields on the same form. |
| Rows | `TMBCOC_InformeMensualBhe.cgi?cbanoinformemensual=YYYY&cbmesinformemensual=MM&rut_arrastre=…&dv_arrastre=…&pagina_solicitada=P` | Once per month. The rows are JavaScript assignments, `arr_informe_mensual['<field>_<i>'] = <value>;`. The script reads only literal values from them and never runs them. `tot_pag` gives the page count. The page is in ISO-8859-1. |
| PDF | `TMBCOT_ConsultaBoletaPdf.cgi?txt_codigobarras=<código>&veroriginal=si&origen=PROPIOS&enviar=si` | Once per boleta, 250 ms apart. Voided boletas return a normal-looking PDF. |

Each row has these fields:
- `nroboleta`
- `usuemisor`
- `fechaemision`
- `rutreceptor`, `dvreceptor`
- `nombrereceptor` (cut at 30 characters)
- `fecha_boleta`
- `totalhonorarios`
- `es_soc_profesional`
- `email_envio`
- `retencion_emisor`, `retencion_receptor`
- `honorariosliquidos`
- `estado` (`S` means voided)
- `fechaanulacion`
- `codigobarras`

## Why it's built this way

- **One ZIP.** Browsers silently block the second and later automatic downloads from a site, so the script saves everything as a single ZIP.
- **A borrowed `URL`.** SII's page scripts replace `window.URL`, so the script takes `URL.createObjectURL` from a blank iframe.
- **The seven-year window.** When this was tested in 2026-10, the oldest boleta the reports returned was from 2019-10. Older boletas exist, but no SII page lists them or downloads them by número.
