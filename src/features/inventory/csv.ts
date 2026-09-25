/** Minimal RFC-4180 CSV parsing/writing (quoted fields, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const s = text.replace(/^﻿/, ''); // Excel BOM
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (quoted) {
            if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === ',' || c === ';' || c === '\t') { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && s[i + 1] === '\n') i++;
            row.push(cell); cell = '';
            if (row.some((v) => v.trim())) rows.push(row);
            row = [];
        } else cell += c;
    }
    row.push(cell);
    if (row.some((v) => v.trim())) rows.push(row);
    return rows;
}

/** Stock lines from a CSV with a header row: sku, quantity/qty, unit_cost/cost (any order, case-insensitive). */
export function stockLinesFromCsv(text: string) {
    const rows = parseCsv(text);
    if (!rows.length) return { lines: [], error: 'The file is empty.' };
    const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
    const find = (...names: string[]) => head.findIndex((h) => names.includes(h));
    const iSku = find('sku', 'part_number', 'code');
    const iQty = find('quantity', 'qty', 'stock', 'count');
    const iCost = find('unit_cost', 'cost', 'cost_price', 'buying_price');
    if (iSku < 0 || iQty < 0) return { lines: [], error: 'The first row must name the columns — at least "sku" and "quantity".' };
    const lines = rows.slice(1).map((r) => ({
        sku: (r[iSku] ?? '').trim(),
        quantity: Number(String(r[iQty] ?? '').replace(/,/g, '').trim()),
        ...(iCost >= 0 && String(r[iCost] ?? '').trim() ? { unitCost: Number(String(r[iCost]).replace(/[^0-9.]/g, '')) } : {}),
    }));
    return { lines, error: null };
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
    return rows.map((r) => r.map((v) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
