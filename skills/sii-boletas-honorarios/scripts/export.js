// Descarga todas tus boletas de honorarios electrónicas emitidas desde el SII.
// Download every boleta de honorarios electrónica you have emitted, from SII.
//
// Run it in a tab where you are signed in to SII, on
//   https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi
// (Servicios online > Boletas de honorarios electrónicas > Emisor >
//  Consultas > Consultar boletas emitidas), by pasting it into the browser
// console or through an agent's browser tool.
//
// It only talks to sii.cl with your own session and saves one file,
// boletas_honorarios_sii.zip, with every PDF, boletas.csv and
// sii_bhe_index.json. Nothing is sent anywhere else.
// Progress: window.__bheExport (and the console).
//
// Made by Boki (https://boki.cl), which issues your boletas for you.
// MIT license, (c) 2026 Codeness SpA.
(async () => {
  const state = (window.__bheExport = { phase: "starting", rows: 0, pdfs: 0, bad: [], done: false });
  const say = (msg) => console.log(`[boletas SII] ${msg}`);
  try {
    const form = document.forms[0];
    if (location.hostname !== "loa.sii.cl" || !form?.rut_arrastre || !form?.cbanoinformeanual) {
      throw new Error("Abre esta página con tu sesión del SII: https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContrib.cgi");
    }
    const rut = form.rut_arrastre.value;
    const dv = form.dv_arrastre.value;
    // The year menu only lists recent years, but the report serves older ones
    // by URL. SII keeps roughly the last seven years online; starting at 2010
    // covers that with margin, and an empty month costs one small request.
    const listed = [...form.cbanoinformeanual.options].map((o) => +o.value).filter(Boolean);
    const firstYear = 2010;
    const years = Array.from({ length: Math.max(...listed) - firstYear + 1 }, (_, i) => firstYear + i);
    const decoder = new TextDecoder("windows-1252");
    const get = async (u) => decoder.decode(await (await fetch(u, { credentials: "include" })).arrayBuffer());
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // Rows come as JS assignments arr_informe_mensual['<field>_<i>'] = <value>;
    // The value is read as data, never executed: string literals and numbers,
    // optionally joined with +. SII wraps amounts in a display call,
    // formatMiles("3143351",'.'); only its first argument is kept, so amounts
    // come out as plain digits. Anything else is skipped.
    const literal = (expr) => {
      const call = expr.trim().match(/^[A-Za-z_$][\w$.]*\(\s*(.*?)\s*\)$/);
      if (call) return literal(call[1].split(/,(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/)[0]);
      const parts = expr.trim().split(/\s*\+\s*(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/);
      let out = "";
      for (const p of parts) {
        const q = p.match(/^'((?:[^'\\]|\\.)*)'$|^"((?:[^"\\]|\\.)*)"$/);
        if (q) out += (q[1] ?? q[2]).replace(/\\(.)/g, "$1");
        else if (/^-?[\d.,]+$/.test(p)) out += p;
        else return null;
      }
      return out;
    };
    const parseMonth = (html) => {
      const rows = {};
      for (const m of html.matchAll(/arr_informe_mensual\[\s*['"](\w+?)_(\d+)['"]\s*\]\s*=\s*([^;\n]*);/g)) {
        const v = literal(m[3]);
        if (v !== null) (rows[m[2]] ??= {})[m[1]] = v.trim();
      }
      return { rows: Object.values(rows), pages: +((html.match(/tot_pag\s*=\s*'?(\d+)/) || [])[1] || 1) };
    };

    state.phase = "index";
    const index = [];
    for (const y of years) {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, "0");
        for (let p = 0, pages = 1; p < pages; p++) {
          const r = parseMonth(await get(`/cgi_IMT/TMBCOC_InformeMensualBhe.cgi?cbanoinformemensual=${y}&cbmesinformemensual=${mm}&dv_arrastre=${dv}&pagina_solicitada=${p}&rut_arrastre=${rut}`));
          pages = Math.max(1, r.pages);
          index.push(...r.rows);
          state.rows = index.length;
        }
      }
      say(`${y}: ${index.length} boletas hasta ahora`);
    }
    index.sort((a, b) => +a.nroboleta - +b.nroboleta);
    if (!index.length) throw new Error("El SII no devolvió boletas emitidas para este RUT.");
    // Only boletas in force. A voided boleta (estado "S") has a PDF that looks
    // exactly like a valid one, so it stays out of the ZIP entirely.
    const vigentes = index.filter((r) => r.estado !== "S");
    state.anuladas = index.length - vigentes.length;
    state.rows = vigentes.length;

    state.phase = "pdfs";
    const enc = new TextEncoder();
    const files = [];
    for (const r of vigentes) {
      try {
        const res = await fetch(`/cgi_IMT/TMBCOT_ConsultaBoletaPdf.cgi?txt_codigobarras=${r.codigobarras}&veroriginal=si&origen=PROPIOS&enviar=si`, { credentials: "include" });
        const buf = new Uint8Array(await res.arrayBuffer());
        if (String.fromCharCode(...buf.slice(0, 5)) !== "%PDF-") throw new Error("no es un PDF");
        files.push({ name: `pdf/boleta_${String(r.nroboleta).padStart(4, "0")}_${r.codigobarras}.pdf`, data: buf });
        state.pdfs++;
        if (state.pdfs % 25 === 0) say(`${state.pdfs}/${vigentes.length} PDFs`);
      } catch (e) {
        state.bad.push(`${r.nroboleta}: ${e.message}`);
      }
      await sleep(250); // stay well under anything SII might treat as abuse
    }

    const cols = [
      ["numero", "nroboleta"], ["fecha", "fecha_boleta"], ["emitida", "fechaemision"],
      ["rut_receptor", (r) => `${r.rutreceptor}-${r.dvreceptor}`], ["receptor", "nombrereceptor"],
      ["honorarios_brutos", "totalhonorarios"], ["retencion_emisor", "retencion_emisor"],
      ["retencion_receptor", "retencion_receptor"], ["liquido", "honorariosliquidos"],
      ["codigo", "codigobarras"]
    ];
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.map(([h]) => h).join(";"),
      ...vigentes.map((r) => cols.map(([, f]) => cell(typeof f === "function" ? f(r) : r[f])).join(";"))].join("\r\n");
    files.unshift(
      { name: "boletas.csv", data: enc.encode("\uFEFF" + csv) },
      { name: "sii_bhe_index.json", data: enc.encode(JSON.stringify(vigentes, null, 1)) }
    );

    // One stored (uncompressed) zip, so the browser sees a single download.
    state.phase = "zip";
    const table = new Uint32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
    const crc32 = (b) => {
      let c = ~0;
      for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8);
      return ~c >>> 0;
    };
    const parts = [];
    const central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name);
      const crc = crc32(f.data);
      const size = f.data.length;
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint32(14, crc, true);
      local.setUint32(18, size, true);
      local.setUint32(22, size, true);
      local.setUint16(26, name.length, true);
      parts.push(local, name, f.data);
      const dir = new DataView(new ArrayBuffer(46));
      dir.setUint32(0, 0x02014b50, true);
      dir.setUint16(4, 20, true);
      dir.setUint16(6, 20, true);
      dir.setUint16(8, 0x0800, true);
      dir.setUint32(16, crc, true);
      dir.setUint32(20, size, true);
      dir.setUint32(24, size, true);
      dir.setUint16(28, name.length, true);
      dir.setUint32(42, offset, true);
      central.push(dir, name);
      offset += 30 + name.length + size;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, central.reduce((a, x) => a + x.byteLength, 0), true);
    end.setUint32(16, offset, true);
    const blob = new Blob([...parts, ...central, end], { type: "application/zip" });

    // SII's page scripts overwrite window.URL; borrow a clean one from a blank iframe.
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const a = document.createElement("a");
    a.href = iframe.contentWindow.URL.createObjectURL(blob);
    a.download = "boletas_honorarios_sii.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();

    const first = +index[0].nroboleta;
    Object.assign(state, {
      phase: "saved", bytes: blob.size, done: true,
      oldest: { numero: first, fecha: index[0].fecha_boleta },
      missingOlder: first > 1 ? `boletas 1 a ${first - 1} (anteriores a lo que el SII muestra en línea)` : null
    });
    say(`Listo: ${state.pdfs} PDFs de ${vigentes.length} boletas vigentes en boletas_honorarios_sii.zip` +
        (state.anuladas ? ` (${state.anuladas} anuladas quedaron fuera)` : "") +
        (state.bad.length ? `, ${state.bad.length} con error` : "") +
        (first > 1 ? `. El SII ya no muestra las boletas 1 a ${first - 1}.` : "."));
  } catch (e) {
    Object.assign(state, { phase: "error", error: e.message, done: true });
    console.error(`[boletas SII] ${e.message}`);
  }
})();
"started";
