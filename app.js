(() => {
  "use strict";
  const FATS = {
    palme: { name: "Huile de palme", coefficient: 0.142, icon: "🟠" },
    palmiste: { name: "Huile de palmiste", coefficient: 0.183, icon: "🥥" },
    karite: { name: "Beurre de karité", coefficient: 0.138, icon: "🟤" }
  };
  const chosen = new Map();
  let calculated = false;
  let installPrompt = null;
  const $ = id => document.getElementById(id);
  const select = $("fatSelect"), list = $("selectedList"), results = $("results");
  const fmt = n => Number(n).toLocaleString("fr-FR", {minimumFractionDigits:3, maximumFractionDigits:3});
  const round3 = n => Math.round((n + Number.EPSILON) * 1000) / 1000;

  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function updateOptions() {
    [...select.options].forEach(opt => { if (opt.value) opt.disabled = chosen.has(opt.value); });
    $("itemCount").textContent = `${chosen.size} élément${chosen.size > 1 ? "s" : ""}`;
  }
  function renderList() {
    if (!chosen.size) {
      list.innerHTML = '<div class="empty-state"><span class="empty-icon">＋</span><strong>Aucun corps gras ajouté</strong><p>Choisissez un corps gras ci-dessus pour commencer.</p></div>';
    } else {
      list.innerHTML = "";
      chosen.forEach((quantity, key) => {
        const fat = FATS[key], item = document.createElement("div");
        item.className = "fat-item";
        item.innerHTML = `<div class="fat-art" aria-hidden="true">${fat.icon}</div>
          <div><div class="fat-name">${fat.name}</div><div class="fat-coef">Coefficient : ${fmt(fat.coefficient)}</div></div>
          <div><label class="qty-label" for="qty-${key}">Quantité (kg)</label><input class="qty-input" id="qty-${key}" type="number" min="0" step="any" inputmode="decimal" value="${quantity}" placeholder="0"></div>
          <button class="remove-btn" type="button" aria-label="Retirer ${fat.name}" title="Retirer">×</button>`;
        item.querySelector("input").addEventListener("input", e => {
          chosen.set(key, e.target.value);
          calculated = false; clearResults();
        });
        item.querySelector("button").addEventListener("click", () => {
          chosen.delete(key); calculated = false; renderList(); clearResults(); updateOptions();
        });
        list.appendChild(item);
      });
    }
    updateOptions();
  }
  function clearResults() {
    results.innerHTML = '<div class="result-empty">Cliquez sur « Calculer les équivalents » pour afficher les résultats.</div>';
    $("totalValue").textContent = "—"; $("totalHint").textContent = "En attente du calcul";
  }
  function compute(showMessage = true) {
    if (!chosen.size) { if (showMessage) toast("Ajoutez au moins un corps gras."); return null; }
    const entries = [];
    for (const [key, raw] of chosen) {
      const qty = Number(String(raw).replace(",", ""));
      if (raw === "" || !Number.isFinite(qty) || qty < 0) {
        if (showMessage) toast(`Vérifiez la quantité pour ${FATS[key].name}.`);
        return null;
      }
      const fat = FATS[key];
      entries.push({key, name: fat.name, quantity: qty, coefficient: fat.coefficient, equivalent: round3(qty * fat.coefficient)});
    }
    return {entries, quantityTotal: round3(entries.reduce((s, x) => s + x.quantity, 0)), equivalentTotal: round3(entries.reduce((s, x) => s + x.equivalent, 0))};
  }
  function calculate() {
    const data = compute(); if (!data) return;
    results.innerHTML = "";
    data.entries.forEach(entry => {
      const row = document.createElement("div"); row.className = "result-row";
      row.innerHTML = `<div><div class="result-title">${entry.name}</div><div class="result-formula">${fmt(entry.quantity)} × ${fmt(entry.coefficient)} = ${fmt(entry.equivalent)}</div></div><div class="result-number">${fmt(entry.equivalent)}</div>`;
      results.appendChild(row);
    });
    $("totalValue").textContent = fmt(data.equivalentTotal);
    $("totalHint").textContent = `Quantité saisie : ${fmt(data.quantityTotal)} kg · ${data.entries.length} corps gras`;
    calculated = true; toast("Calcul terminé."); return data;
  }
  function ascii(s) {
    return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[×·]/g, "x").replace(/[–—]/g, "-").replace(/[’‘]/g, "'")
      .replace(/[^\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
  function makePdf(lines) {
    // Petit générateur PDF autonome : aucun CDN ni bibliothèque externe.
    const pages = [];
    for (let i=0; i<lines.length; i+=42) pages.push(lines.slice(i,i+42));
    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    const pageRefs = [];
    pages.forEach((page, i) => {
      const pageObj = 4 + i*2, streamObj = pageObj+1;
      pageRefs.push(`${pageObj} 0 R`);
      const cmds = ["BT", "/F1 10 Tf", "50 795 Td", "14 TL"];
      page.forEach((line, j) => {
        if (j===0 && i===0) cmds.push("/F1 16 Tf");
        else if (j===1 && i===0) cmds.push("/F1 10 Tf");
        cmds.push(`(${ascii(line)}) Tj`, "T*");
      });
      cmds.push("ET", "BT", "/F1 8 Tf", "50 28 Td", `(${ascii("CorpsGrasCalc - Rapport genere localement | Page " + (i+1) + "/" + pages.length)}) Tj`, "ET");
      const stream = cmds.join("\n");
      objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamObj} 0 R >>`;
      objects[streamObj] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;
    let pdf = "%PDF-1.4\n%CGC\n", offsets = [0];
    for (let i=1; i<objects.length; i++) {
      offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i=1; i<objects.length; i++) pdf += `${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([pdf], {type:"application/pdf"});
  }
  function downloadPdf() {
    const data = compute(); if (!data) return;
    const now = new Date();
    const date = now.toLocaleString("fr-FR");
    const lines = [
      "CORPSGRASCALC - RAPPORT DE CALCUL",
      `Date du rapport : ${date}`,
      "",
      "DETAIL DES CORPS GRAS",
      "------------------------------------------------------------"
    ];
    data.entries.forEach((e, i) => {
      lines.push(`${i+1}. ${e.name}`);
      lines.push(`   Quantite saisie : ${fmt(e.quantity)} kg`);
      lines.push(`   Coefficient     : ${fmt(e.coefficient)}`);
      lines.push(`   Calcul          : ${fmt(e.quantity)} x ${fmt(e.coefficient)} = ${fmt(e.equivalent)}`);
      lines.push(`   Equivalent      : ${fmt(e.equivalent)}`);
      lines.push("");
    });
    lines.push("------------------------------------------------------------", `Quantite totale saisie : ${fmt(data.quantityTotal)} kg`, `Nombre de corps gras : ${data.entries.length}`, `EQUIVALENT TOTAL : ${fmt(data.equivalentTotal)}`, "", "Coefficients utilises :", "Huile de palme : 0,142", "Huile de palmiste : 0,183", "Beurre de karite : 0,138", "", "Rapport genere dans CorpsGrasCalc. Aucune donnee n'a ete envoyee.");
    const blob = makePdf(lines), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `rapport-corps-gras-${now.toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("Rapport PDF téléchargé.");
  }
  $("addBtn").addEventListener("click", () => {
    const key = select.value;
    if (!key) { $("addMessage").textContent = "Sélectionnez d’abord un corps gras."; $("addMessage").className="message error"; return; }
    if (chosen.has(key)) { $("addMessage").textContent = "Ce corps gras est déjà dans la liste."; $("addMessage").className="message error"; return; }
    chosen.set(key, ""); select.value = ""; $("addMessage").textContent = ""; $("addMessage").className="message";
    calculated = false; renderList(); clearResults();
  });
  $("calculateBtn").addEventListener("click", calculate);
  $("pdfBtn").addEventListener("click", downloadPdf);
  $("resetBtn").addEventListener("click", () => {
    chosen.clear(); select.value = ""; $("addMessage").textContent = ""; calculated = false; renderList(); clearResults(); toast("Calculatrice réinitialisée.");
  });
  function updateConnection() {
    const el = $("offlineStatus"), online = navigator.onLine;
    el.classList.toggle("online", online); el.classList.toggle("offline", !online);
    el.innerHTML = `<i></i>${online ? "En ligne" : "Hors ligne"}`;
  }
  window.addEventListener("online", updateConnection); window.addEventListener("offline", updateConnection); updateConnection();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event; $("installBtn").hidden = false;
  });
  $("installBtn").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("installBtn").hidden = true;
  });
  window.addEventListener("appinstalled", () => toast("CorpsGrasCalc a été installée."));
  renderList(); clearResults();
})();