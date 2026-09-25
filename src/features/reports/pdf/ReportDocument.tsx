// PDF layout for the sales report (rendered in the browser with @react-pdf/renderer).
// Tables are split into page-sized chunks ourselves so every page repeats the column header.
import { Document, Font, Page, Rect, StyleSheet, Svg, Text, View, Line } from '@react-pdf/renderer';
import { CustomerReport, ProductReport, SalesOverview } from '@/types/report.types';

export type ReportSection = 'summary' | 'products' | 'categories' | 'brands' | 'slow' | 'customers';

export interface ReportPdfProps {
    overview: SalesOverview;
    products: ProductReport;
    customers?: CustomerReport;
    sections: ReportSection[];
    productLimit: number | null;
    fromDay: string;
    toDay: string;
    generatedBy?: string;
    generatedAt: Date;
}

// clip long names with an ellipsis instead of hyphenating them
Font.registerHyphenationCallback((word) => [word]);

// ── design tokens ───────────────────────────────────────────
const C = {
    ink: '#111827', body: '#374151', muted: '#6B7280', faint: '#9CA3AF',
    line: '#E5E7EB', soft: '#F9FAFB', band: '#F3F4F6',
    brand: '#1D4ED8', brandSoft: '#DBEAFE',
    good: '#047857', bad: '#BE123C', warn: '#B45309', warnSoft: '#FEF3C7',
};
const PAGE_W = 595.28;
const PAD_X = 40;
const CONTENT_W = PAGE_W - PAD_X * 2; // 515
const PAD_TOP = 74;
const PAD_BOTTOM = 58;
const USABLE_H = 841.89 - PAD_TOP - PAD_BOTTOM;

const s = StyleSheet.create({
    page: { paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM, paddingHorizontal: PAD_X, fontFamily: 'Helvetica', fontSize: 8.5, color: C.body },
    header: { position: 'absolute', top: 26, left: PAD_X, right: PAD_X, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: C.ink },
    brand: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.ink, letterSpacing: 1.2 },
    brandSub: { fontSize: 7.5, color: C.muted, marginTop: 2 },
    headerRight: { fontSize: 7.5, color: C.muted, textAlign: 'right' },
    footer: { position: 'absolute', bottom: 24, left: PAD_X, right: PAD_X, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.line, fontSize: 7, color: C.faint },

    h1: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.ink },
    h2: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.ink },
    h3: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.ink, marginBottom: 6 },
    lead: { fontSize: 9, color: C.muted, marginTop: 3 },
    sectionHead: { marginBottom: 10 },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 14 },
    kpi: { width: '25%', paddingHorizontal: 4, marginBottom: 8 },
    kpiBox: { borderWidth: 0.75, borderColor: C.line, borderRadius: 4, padding: 9, height: 60 },
    kpiLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    kpiValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.ink, marginTop: 5 },
    kpiNote: { fontSize: 7, color: C.muted, marginTop: 4 },

    card: { borderWidth: 0.75, borderColor: C.line, borderRadius: 4, padding: 12 },
    row2: { flexDirection: 'row', gap: 10 },
    dl: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },

    th: { flexDirection: 'row', backgroundColor: C.band, borderTopWidth: 0.75, borderBottomWidth: 0.75, borderColor: C.line, height: 20, alignItems: 'center' },
    thText: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4 },
    tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.line, alignItems: 'center' },
    td: { paddingHorizontal: 4, fontSize: 8 },
    clip: { maxLines: 1, textOverflow: 'ellipsis' },
    tdSub: { paddingHorizontal: 4, fontSize: 6.8, color: C.faint, marginTop: 1.5 },
    total: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.ink, borderTopWidth: 1, borderTopColor: C.ink, height: 20, alignItems: 'center' },

    note: { flexDirection: 'row', backgroundColor: C.warnSoft, borderRadius: 3, padding: 7, marginTop: 8, fontSize: 7.5, color: C.warn },
});

// ── formatting (Helvetica only covers Latin-1, so keep text within it) ─────
const clean = (v: unknown) => String(v ?? '').replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…]/g, '?');
const kes = (n: number | null | undefined) => (n == null ? '—' : `${n < 0 ? '-' : ''}KES ${Math.abs(Math.round(n)).toLocaleString('en-KE')}`);
const num = (n: number | null | undefined) => (n == null ? '—' : `${n < 0 ? '-' : ''}${Math.abs(Math.round(n)).toLocaleString('en-KE')}`);
const pct = (n: number | null | undefined, d = 1) => (n == null ? '—' : `${(n * 100).toFixed(d)}%`);
const day = (iso: string | Date | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const dayOf = (ymd: string) => day(new Date(`${ymd}T00:00:00`));
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));

function change(cur: number, prev: number) {
    if (!prev) return cur ? { text: 'New this period', color: C.muted } : { text: 'No activity either period', color: C.faint };
    const p = (cur - prev) / prev;
    if (Math.abs(p) < 0.0005) return { text: 'No change vs previous', color: C.muted };
    return { text: `${p > 0 ? '+' : '-'}${Math.abs(p * 100).toFixed(1)}% vs previous`, color: p > 0 ? C.good : C.bad };
}

// ── chrome ────────────────────────────────────────────────
function Chrome({ period, generated }: { period: string; generated: string }) {
    return (
        <>
            <View style={s.header} fixed>
                <View>
                    <Text style={s.brand}>GENESIS INVESTMENT</Text>
                    <Text style={s.brandSub}>Genuine car spare parts · Sales report</Text>
                </View>
                <Text style={s.headerRight}>{period}</Text>
            </View>
            <View style={s.footer} fixed>
                <Text>{generated} · Confidential, for internal use</Text>
                <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
            </View>
        </>
    );
}

// ── tables ────────────────────────────────────────────────
type Col<T> = { label: string; w: number; align?: 'left' | 'right'; get: (r: T, i: number) => string; sub?: (r: T) => string; color?: (r: T) => string | undefined; bold?: boolean };

function Table<T>({ cols, rows, start = 0, rowH, totals }: { cols: Col<T>[]; rows: T[]; start?: number; rowH: number; totals?: string[] }) {
    return (
        <View>
            <View style={s.th} wrap={false}>
                {cols.map((c) => <Text key={c.label} style={[s.thText, { width: c.w, textAlign: c.align ?? 'right' }]}>{c.label}</Text>)}
            </View>
            {rows.map((r, i) => (
                <View key={i} style={[s.tr, { height: rowH, backgroundColor: (start + i) % 2 ? C.soft : '#FFFFFF' }]} wrap={false}>
                    {cols.map((c) => (
                        <View key={c.label} style={{ width: c.w }}>
                            <Text style={[s.td, s.clip, { textAlign: c.align ?? 'right', color: c.color?.(r) ?? (c.bold ? C.ink : C.body), fontFamily: c.bold ? 'Helvetica-Bold' : 'Helvetica' }]}>
                                {clean(c.get(r, start + i))}
                            </Text>
                            {c.sub && <Text style={[s.tdSub, s.clip, { textAlign: c.align ?? 'right' }]}>{clean(c.sub(r))}</Text>}
                        </View>
                    ))}
                </View>
            ))}
            {totals && (
                <View style={s.total} wrap={false}>
                    {cols.map((c, i) => <Text key={c.label} style={[s.td, { width: c.w, textAlign: c.align ?? 'right', fontFamily: 'Helvetica-Bold', color: C.ink }]}>{totals[i] ?? ''}</Text>)}
                </View>
            )}
        </View>
    );
}

/** Split rows into page-sized pieces; each piece gets its own header row. */
function chunk<T>(rows: T[], rowH: number, firstOffset: number) {
    const head = 22, tail = 24, cont = 26;
    const first = Math.max(1, Math.floor((USABLE_H - firstOffset - head - tail) / (rowH + 0.5)));
    const next = Math.max(1, Math.floor((USABLE_H - cont - head - tail) / (rowH + 0.5)));
    const out: { rows: T[]; start: number }[] = [];
    let i = 0;
    while (i < rows.length || !out.length) {
        const n = out.length ? next : first;
        out.push({ rows: rows.slice(i, i + n), start: i });
        i += n;
    }
    return out;
}

/** Rows that comfortably fit below another section; bigger tables start on a new page. */
const SMALL_TABLE = 14;

function TableSection<T>({ title, lead, cols, rows, rowH, totals, empty, offset = 0, extra, fresh }: {
    title: string; lead: string; cols: Col<T>[]; rows: T[]; rowH: number; totals?: string[]; empty: string; offset?: number; extra?: React.ReactNode; fresh?: boolean;
}) {
    const small = rows.length <= SMALL_TABLE;
    const startsPage = fresh || !small;
    const parts = small ? [{ rows, start: 0 }] : chunk(rows, rowH, 48 + offset);
    return (
        <View break={startsPage} wrap={!small} style={startsPage ? undefined : { marginTop: 26 }}>
            <View style={s.sectionHead}>
                <Text style={s.h2}>{title}</Text>
                <Text style={s.lead}>{lead}</Text>
            </View>
            {!rows.length ? <Text style={{ color: C.muted, paddingVertical: 14 }}>{empty}</Text> : parts.map((p, i) => (
                <View key={i} break={i > 0}>
                    {i > 0 && <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.muted, marginBottom: 8 }}>{title} (continued)</Text>}
                    <Table cols={cols} rows={p.rows} start={p.start} rowH={rowH} totals={i === parts.length - 1 ? totals : undefined} />
                </View>
            ))}
            {extra}
        </View>
    );
}

// ── chart ─────────────────────────────────────────────────
type Bucket = { label: string; revenue: number; orders: number };

function buckets(daily: SalesOverview['daily'], fromDay: string, toDay: string): { unit: string; data: Bucket[] } {
    const by = new Map(daily.map((d) => [d.date, d]));
    const days: Bucket[] = [];
    const end = new Date(`${toDay}T00:00:00`);
    const today = new Date();
    for (const d = new Date(`${fromDay}T00:00:00`); d <= end && d <= today; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const v = by.get(key);
        days.push({ label: key, revenue: v?.revenue ?? 0, orders: v?.orders ?? 0 });
    }
    const fmt = (k: string, o: Intl.DateTimeFormatOptions) => new Date(`${k}T00:00:00`).toLocaleDateString('en-GB', o);
    if (days.length <= 31) return { unit: 'day', data: days.map((d) => ({ ...d, label: fmt(d.label, { day: 'numeric', month: 'short' }) })) };
    if (days.length <= 120) {
        const out: Bucket[] = [];
        for (let i = 0; i < days.length; i += 7) {
            const w = days.slice(i, i + 7);
            out.push({ label: fmt(w[0].label, { day: 'numeric', month: 'short' }), revenue: w.reduce((n, d) => n + d.revenue, 0), orders: w.reduce((n, d) => n + d.orders, 0) });
        }
        return { unit: 'week', data: out };
    }
    const m = new Map<string, Bucket>();
    for (const d of days) {
        const k = d.label.slice(0, 7);
        const b = m.get(k) ?? { label: fmt(`${k}-01`, { month: 'short', year: '2-digit' }), revenue: 0, orders: 0 };
        b.revenue += d.revenue; b.orders += d.orders; m.set(k, b);
    }
    return { unit: 'month', data: [...m.values()] };
}

function SalesChart({ overview, fromDay, toDay }: { overview: SalesOverview; fromDay: string; toDay: string }) {
    const { unit, data } = buckets(overview.daily, fromDay, toDay);
    const H = 130, LABEL_W = 34, W = CONTENT_W - 24 - LABEL_W;
    const max = Math.max(0, ...data.map((d) => d.revenue));
    const raw = max / 4 || 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((x) => x >= raw) ?? raw;
    const top = step * 4;
    const slot = W / Math.max(1, data.length);
    const barW = Math.max(1.5, Math.min(22, slot * 0.64));
    const every = Math.ceil(data.length / 10);
    const best = data.reduce<Bucket | null>((b, d) => (!b || d.revenue > b.revenue ? d : b), null);

    return (
        <View style={[s.card, { marginTop: 6 }]} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={s.h3}>Revenue by {unit}</Text>
                <Text style={{ fontSize: 7.5, color: C.muted }}>
                    Total {kes(data.reduce((n, d) => n + d.revenue, 0))}{best && best.revenue > 0 ? ` · Best ${unit}: ${best.label} (${kes(best.revenue)})` : ''}
                </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ width: LABEL_W, height: H, position: 'relative' }}>
                    {[4, 3, 2, 1, 0].map((t) => (
                        <Text key={t} style={{ position: 'absolute', right: 5, top: H - (t / 4) * H - 4, fontSize: 6.5, color: C.faint }}>{compact(t * step)}</Text>
                    ))}
                </View>
                <View>
                    <Svg width={W} height={H}>
                        {[0, 1, 2, 3, 4].map((t) => (
                            <Line key={t} x1={0} x2={W} y1={H - (t / 4) * H} y2={H - (t / 4) * H} stroke={t ? C.line : C.faint} strokeWidth={t ? 0.5 : 0.75} strokeDasharray={t ? '2 2' : undefined} />
                        ))}
                        {data.map((d, i) => {
                            const h = top ? (d.revenue / top) * H : 0;
                            return h > 0 ? <Rect key={i} x={i * slot + (slot - barW) / 2} y={H - h} width={barW} height={h} fill={C.brand} /> : null;
                        })}
                    </Svg>
                    <View style={{ width: W, height: 10, marginTop: 4, position: 'relative' }}>
                        {data.map((d, i) => (i % every === 0 ? (
                            <Text key={i} style={{ position: 'absolute', left: Math.min(W - 44, Math.max(0, i * slot + slot / 2 - 22)), width: 44, fontSize: 6, color: C.faint, textAlign: 'center' }}>{d.label}</Text>
                        ) : null))}
                    </View>
                </View>
            </View>
        </View>
    );
}

// ── summary page ──────────────────────────────────────────
function Kpi({ label, value, note, noteColor }: { label: string; value: string; note?: string; noteColor?: string }) {
    return (
        <View style={s.kpi}>
            <View style={s.kpiBox}>
                <Text style={s.kpiLabel}>{label}</Text>
                <Text style={s.kpiValue}>{value}</Text>
                {note && <Text style={[s.kpiNote, noteColor ? { color: noteColor } : {}]}>{note}</Text>}
            </View>
        </View>
    );
}

const METHOD: Record<string, string> = { cod: 'Cash on delivery', mpesa: 'M-Pesa', card: 'Card', unknown: 'Not recorded' };

function Summary({ o, p, c, fromDay, toDay }: { o: SalesOverview; p: ProductReport; c?: CustomerReport; fromDay: string; toDay: string }) {
    const pr = o.profit;
    const ch = (a: number, b: number) => change(a, b);
    const net = ch(o.net, o.previous.net), ord = ch(o.orders, o.previous.orders), aov = ch(o.averageOrder, o.previous.averageOrder), cus = ch(o.customers, o.previous.customers);
    const methodTotal = o.paymentMethods.reduce((n, m) => n + m.revenue, 0);
    const topCat = p.categories[0];
    const topBrand = p.brands[0];
    const best = p.products[0];
    const topCustomer = c?.top.slice().sort((a, b) => b.periodValue - a.periodValue)[0];

    return (
        <View>
            <Text style={s.h1}>Sales report</Text>
            <Text style={s.lead}>
                {dayOf(fromDay)} – {dayOf(toDay)} · compared with {day(o.previous.from)} – {day(o.previous.to)}
            </Text>

            <View style={s.kpiGrid}>
                <Kpi label="Net sales" value={kes(o.net)} note={net.text} noteColor={net.color} />
                <Kpi label="Gross profit" value={kes(pr.profit)} note={`Margin ${pct(pr.margin)}`} />
                <Kpi label="Orders" value={num(o.orders)} note={ord.text} noteColor={ord.color} />
                <Kpi label="Average order" value={kes(o.averageOrder)} note={aov.text} noteColor={aov.color} />
                <Kpi label="Items sold" value={num(o.units)} note={`${num(pr.products)} different product${pr.products === 1 ? '' : 's'}`} />
                <Kpi label="Customers" value={num(o.customers)} note={cus.text} noteColor={cus.color} />
                <Kpi label="Refunds" value={kes(o.refunds)} note={`${o.returnsRefunded} return${o.returnsRefunded === 1 ? '' : 's'} refunded`} noteColor={o.refunds ? C.warn : undefined} />
                <Kpi label="Cancelled orders" value={num(o.cancelled)} note="Not counted in sales" />
            </View>

            <SalesChart overview={o} fromDay={fromDay} toDay={toDay} />

            <View style={[s.row2, { marginTop: 10 }]} wrap={false}>
                <View style={[s.card, { flex: 1 }]}>
                    <Text style={s.h3}>Profit and loss</Text>
                    <View style={s.dl}><Text>Gross sales (incl. delivery)</Text><Text>{kes(o.gross)}</Text></View>
                    <View style={s.dl}><Text>Less refunds</Text><Text>{o.refunds ? `-${kes(o.refunds)}` : kes(0)}</Text></View>
                    <View style={[s.dl, { borderTopWidth: 0.5, borderTopColor: C.line, marginTop: 2 }]}><Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Net sales</Text><Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>{kes(o.net)}</Text></View>
                    <View style={[s.dl, { marginTop: 6 }]}><Text>Product sales</Text><Text>{kes(pr.revenue)}</Text></View>
                    <View style={s.dl}><Text>Cost of goods sold</Text><Text>-{kes(pr.cost)}</Text></View>
                    <View style={[s.dl, { borderTopWidth: 0.5, borderTopColor: C.line, marginTop: 2 }]}><Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Gross profit</Text><Text style={{ fontFamily: 'Helvetica-Bold', color: pr.profit < 0 ? C.bad : C.ink }}>{kes(pr.profit)} ({pct(pr.margin)})</Text></View>
                    <View style={s.dl}><Text>Delivery charged</Text><Text>{kes(o.delivery)}</Text></View>
                    <View style={s.dl}><Text>Collected (paid orders)</Text><Text>{kes(o.collected)}</Text></View>
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                    <View style={s.card}>
                        <Text style={s.h3}>Payment methods</Text>
                        {!o.paymentMethods.length && <Text style={{ color: C.muted }}>No sales.</Text>}
                        {o.paymentMethods.map((m) => {
                            const share = methodTotal ? m.revenue / methodTotal : 0;
                            return (
                                <View key={m.method} style={{ marginBottom: 5 }}>
                                    <View style={s.dl}><Text>{METHOD[m.method] ?? clean(m.method)} · {m.orders} order{m.orders === 1 ? '' : 's'}</Text><Text>{kes(m.revenue)} · {pct(share, 0)}</Text></View>
                                    <View style={{ height: 3, backgroundColor: C.band, borderRadius: 2 }}><View style={{ height: 3, width: `${Math.max(1, share * 100)}%`, backgroundColor: C.brand, borderRadius: 2 }} /></View>
                                </View>
                            );
                        })}
                    </View>
                    <View style={s.card}>
                        <Text style={s.h3}>Highlights</Text>
                        <View style={s.dl}><Text>Best seller</Text><Text style={{ maxWidth: 150, textAlign: 'right' }}>{best ? `${clean(best.name).slice(0, 34)} (${num(best.units)})` : '—'}</Text></View>
                        <View style={s.dl}><Text>Top category</Text><Text>{topCat ? `${clean(topCat.label)} · ${kes(topCat.revenue)}` : '—'}</Text></View>
                        <View style={s.dl}><Text>Top brand</Text><Text>{topBrand ? `${clean(topBrand.label)} · ${kes(topBrand.revenue)}` : '—'}</Text></View>
                        <View style={s.dl}><Text>Top customer (period)</Text><Text>{topCustomer && topCustomer.periodValue ? `${clean(topCustomer.name).slice(0, 24)} · ${kes(topCustomer.periodValue)}` : '—'}</Text></View>
                        <View style={s.dl}><Text>Slow movers</Text><Text>{p.slowMovers.length} products · {kes(p.totals.slowMoverStockValue)} at cost</Text></View>
                    </View>
                </View>
            </View>
            {(pr.estimated || pr.costCoverage < 1) && (
                <View style={s.note} wrap={false}>
                    <Text>
                        {pr.costCoverage < 1 ? `Some products have no cost price, so ${pct(1 - pr.costCoverage, 0)} of product sales is excluded from profit. ` : ''}
                        {pr.estimated ? 'Sales made before costs were recorded on orders use the current cost price (estimate).' : ''}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ── document ──────────────────────────────────────────────
export function ReportDocument({ overview: o, products: p, customers: c, sections, productLimit, fromDay, toDay, generatedBy, generatedAt }: ReportPdfProps) {
    const period = `${dayOf(fromDay)} – ${dayOf(toDay)}`;
    const generated = `Generated ${generatedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${generatedBy ? ` by ${clean(generatedBy)}` : ''}`;
    const has = (x: ReportSection) => sections.includes(x);
    const total = p.totals.revenue;
    const prodRows = productLimit ? p.products.slice(0, productLimit) : p.products;

    type P = ProductReport['products'][number];
    const productCols: Col<P>[] = [
        { label: '#', w: 18, get: (_r, i) => String(i + 1), color: () => C.faint },
        { label: 'Product', w: 170, align: 'left', get: (r) => r.name, sub: (r) => [r.sku, r.brand, r.category].filter(Boolean).join(' · '), bold: true },
        { label: 'Units', w: 36, get: (r) => num(r.units) },
        { label: 'Revenue', w: 64, get: (r) => num(r.revenue), bold: true },
        { label: 'Share', w: 36, get: (r) => pct(total ? r.revenue / total : 0) },
        { label: 'Cost', w: 58, get: (r) => (r.cost == null ? 'n/a' : num(r.cost) + (r.costEstimated ? '*' : '')) },
        { label: 'Profit', w: 58, get: (r) => num(r.profit), color: (r) => (r.profit != null && r.profit < 0 ? C.bad : undefined) },
        { label: 'Margin', w: 38, get: (r) => pct(r.margin), color: (r) => (r.margin != null && r.margin < 0 ? C.bad : undefined) },
        { label: 'Stock', w: 37, get: (r) => (r.stockQty == null ? '—' : num(r.stockQty)), color: (r) => (r.stockQty === 0 ? C.bad : undefined) },
    ];
    const shown = prodRows.reduce((a, r) => ({ units: a.units + r.units, revenue: a.revenue + r.revenue, cost: a.cost + (r.cost ?? 0), profit: a.profit + (r.profit ?? 0) }), { units: 0, revenue: 0, cost: 0, profit: 0 });

    type R = ProductReport['categories'][number];
    const rollupCols = (noun: string): Col<R>[] => [
        { label: noun, w: 163, align: 'left', get: (r) => r.label, bold: true },
        { label: 'Products', w: 58, get: (r) => num(r.products) },
        { label: 'Units', w: 46, get: (r) => num(r.units) },
        { label: 'Revenue', w: 72, get: (r) => num(r.revenue), bold: true },
        { label: 'Share', w: 44, get: (r) => pct(total ? r.revenue / total : 0) },
        { label: 'Profit', w: 80, get: (r) => (r.profit == null ? 'incomplete' : num(r.profit)) },
        { label: 'Margin', w: 52, get: (r) => pct(r.margin), color: (r) => (r.margin != null && r.margin < 0 ? C.bad : undefined) },
    ];
    const rollupTotals = (rows: R[], noun: string) => [`All ${noun}`, '', num(rows.reduce((n, r) => n + r.units, 0)), num(rows.reduce((n, r) => n + r.revenue, 0)), '100%', num(p.totals.profit), pct(p.totals.margin)];

    type S = ProductReport['slowMovers'][number];
    const slowCols: Col<S>[] = [
        { label: 'Product', w: 195, align: 'left', get: (r) => r.name, sub: (r) => [r.sku, r.brand, r.category].filter(Boolean).join(' · '), bold: true },
        { label: 'Stock', w: 44, get: (r) => num(r.stockQty) },
        { label: 'Value at cost', w: 74, get: (r) => (r.stockValue == null ? 'no cost' : num(r.stockValue)), bold: true },
        { label: 'Retail value', w: 70, get: (r) => num(r.retailValue) },
        { label: 'Last sold', w: 76, get: (r) => (r.lastSoldAt ? day(r.lastSoldAt) : 'Never') },
        { label: 'Days idle', w: 56, get: (r) => num(r.daysIdle), color: (r) => (r.daysIdle >= 90 ? C.warn : undefined) },
    ];

    type K = CustomerReport['top'][number];
    const customerCols: Col<K>[] = [
        { label: '#', w: 18, get: (_r, i) => String(i + 1), color: () => C.faint },
        { label: 'Customer', w: 175, align: 'left', get: (r) => r.name, sub: (r) => r.email, bold: true },
        { label: 'Orders', w: 40, get: (r) => num(r.orders) },
        { label: 'Lifetime value', w: 72, get: (r) => num(r.lifetimeValue), bold: true },
        { label: 'Avg order', w: 60, get: (r) => num(r.averageOrder) },
        { label: 'This period', w: 72, get: (r) => (r.periodOrders ? num(r.periodValue) : '—') },
        { label: 'Last order', w: 78, get: (r) => day(r.lastOrder) },
    ];

    const pages: React.ReactNode[] = [];
    if (has('summary')) pages.push(<Summary key="summary" o={o} p={p} c={c} fromDay={fromDay} toDay={toDay} />);
    if (has('products')) pages.push(
        <TableSection key="products" title="Sales by product" rowH={24} fresh={has('summary')}
            lead={`${productLimit && p.products.length > productLimit ? `Top ${productLimit} of ${p.products.length} products` : `All ${p.products.length} product${p.products.length === 1 ? '' : 's'}`} sold, ranked by revenue. Amounts in KES.`}
            cols={productCols} rows={prodRows} empty="No products were sold in this period."
            totals={['', productLimit && p.products.length > productLimit ? `Total (top ${prodRows.length})` : 'Total', num(shown.units), num(shown.revenue), pct(total ? shown.revenue / total : 0), num(shown.cost), num(shown.profit), pct(shown.revenue ? shown.profit / shown.revenue : null), '']}
            extra={p.totals.estimated ? <Text style={{ fontSize: 7, color: C.muted, marginTop: 6 }}>* Cost includes an estimate at today&apos;s cost price for sales made before costs were recorded on orders.</Text> : undefined} />,
    );
    if (has('categories')) pages.push(
        <TableSection key="categories" title="Sales by category" rowH={18} lead="Product sales grouped by category (delivery excluded). Amounts in KES."
            cols={rollupCols('Category')} rows={p.categories} totals={rollupTotals(p.categories, 'categories')} empty="No sales in this period." />,
    );
    if (has('brands')) pages.push(
        <TableSection key="brands" title="Sales by brand" rowH={18} lead="Product sales grouped by brand (delivery excluded). Amounts in KES."
            cols={rollupCols('Brand')} rows={p.brands} totals={rollupTotals(p.brands, 'brands')} empty="No sales in this period." />,
    );
    if (has('slow')) pages.push(
        <TableSection key="slow" title="Slow movers" rowH={24}
            lead={`Active products in stock with no sales in this period, ranked by money tied up. ${p.slowMovers.length} products, ${kes(p.totals.slowMoverStockValue)} at cost.`}
            cols={slowCols} rows={p.slowMovers} empty="Every product in stock sold at least once in this period."
            totals={['Total', num(p.slowMovers.reduce((n, r) => n + r.stockQty, 0)), num(p.totals.slowMoverStockValue), num(p.slowMovers.reduce((n, r) => n + r.retailValue, 0)), '', '']} />,
    );
    if (has('customers') && c) pages.push(
        <TableSection key="customers" title="Customer lifetime value" rowH={24}
            lead={`${num(c.summary.customers)} customers have ordered · ${pct(c.summary.repeatRate, 0)} came back for another order · average lifetime value ${kes(c.summary.averageLifetimeValue)} · ${num(c.summary.newInPeriod)} new in this period. Lifetime value is all time; "This period" follows the report dates. Amounts in KES.`}
            offset={14} cols={customerCols} rows={c.top} empty="No customer orders yet." />,
    );

    const notes = (
        <View style={{ marginTop: 22, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.line }} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.muted, marginBottom: 3 }}>About these figures</Text>
            <Text style={{ fontSize: 7, color: C.faint, lineHeight: 1.45 }}>
                Sales count every order placed in the period except cancelled and fully refunded orders. Net sales = gross sales minus refunds paid in the period.
                Cost of goods uses the cost price saved on each order line at the time of sale; older lines use the product&apos;s current cost price.
                Products without a cost price are left out of profit. Dates use East Africa Time.
            </Text>
        </View>
    );

    return (
        <Document title={`Genesis sales report ${fromDay} to ${toDay}`} author="Genesis Investment" creator="Genesis dashboard" subject="Sales report">
            <Page size="A4" style={s.page}>
                <Chrome period={period} generated={generated} />
                {pages}
                {notes}
            </Page>
        </Document>
    );
}
