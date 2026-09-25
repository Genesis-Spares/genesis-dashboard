/**
 * Builds the same HTML document the customer receives (mirrors the notification
 * service's templates/custom.html) so previews in the dashboard match the inbox.
 */

const MERGE_FIELD = /\{\{\s*(firstName|lastName|fullName|email)\s*\}\}/g;

export type MergeValues = { firstName: string; lastName: string; fullName: string; email: string };

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Same fallbacks the server uses when a customer's name is missing. */
export function mergeValuesFor(email: string, name?: string | null): MergeValues {
    const [first, ...rest] = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return { firstName: first || 'there', lastName: rest.join(' '), fullName: name?.trim() || email, email };
}

export function personalise(text: string, values: MergeValues | null, html: boolean) {
    if (!values) return text;
    return text.replace(MERGE_FIELD, (_, key: keyof MergeValues) => (html ? escapeHtml(values[key] ?? '') : values[key] ?? ''));
}

export function renderEmailDocument(body: string, opts: { branded: boolean; subject: string }) {
    const year = new Date().getFullYear();
    const head = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<base target="_blank"><title>${escapeHtml(opts.subject)}</title>
<style>
.gx-body img{max-width:100%!important;height:auto!important}
.gx-body p{margin:0 0 12px}
.gx-body blockquote{margin:0 0 12px;padding-left:12px;border-left:3px solid #dcdfe6;color:#5e6773}
.gx-body a{color:#c0430f}
.gx-body ul,.gx-body ol{padding-left:24px}
</style></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#14161c;">`;
    const inner = opts.branded
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e9ef;">
<tr><td style="background:#14161c;padding:20px 28px;"><span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">GENESIS<span style="color:#e4531f;">.</span></span>
<span style="display:block;font-size:10px;font-weight:700;letter-spacing:3px;color:#e4531f;margin-top:2px;">INVESTMENT</span></td></tr>
<tr><td style="height:4px;background:#e4531f;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td class="gx-body" style="padding:28px;font-size:15px;line-height:1.6;color:#14161c;">${body}</td></tr>
<tr><td style="background:#f6f7f9;padding:18px 28px;font-size:12px;line-height:1.6;color:#8a93a0;text-align:center;">© ${year} Genesis Investment · Genuine car spare parts, delivered across Kenya<br>Reply to this email to reach our team.</td></tr>
</table></td></tr></table>`
        : `<div class="gx-body" style="max-width:640px;padding:16px;font-size:15px;line-height:1.6;color:#14161c;background:#ffffff;">${body}</div>`;
    return `${head}${inner}</body></html>`;
}
