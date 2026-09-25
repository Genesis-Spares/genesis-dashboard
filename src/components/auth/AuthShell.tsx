// src/components/auth/AuthShell.tsx
// Split-screen frame for the staff sign-in pages: brand panel left, form right.
import { ArchiveBoxIcon, ChartBarIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';

const POINTS = [
    { icon: TruckIcon, title: 'Orders & delivery', text: 'Track every order from payment to doorstep, with rider updates.' },
    { icon: ArchiveBoxIcon, title: 'Inventory', text: 'Live stock levels, supplier deliveries and low-stock alerts.' },
    { icon: ChartBarIcon, title: 'Reports', text: 'Sales, profit and customer value, ready to export as PDF.' },
];

export function BrandMark({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-[15px] font-bold text-white shadow-sm shadow-blue-600/30">G</span>
            <span className="leading-tight">
                <span className={`block text-[15px] font-semibold tracking-tight ${light ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Genesis</span>
                <span className={`block text-[11px] font-medium uppercase tracking-[0.14em] ${light ? 'text-slate-400' : 'text-gray-500 dark:text-gray-400'}`}>Admin console</span>
            </span>
        </div>
    );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
    const year = new Date().getFullYear();
    return (
        <div className="grid min-h-screen w-full bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] dark:bg-gray-950">
            {/* brand panel */}
            <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
                <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-3xl" />

                <div className="relative"><BrandMark light /></div>

                <div className="relative max-w-md">
                    <h2 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
                        Run the whole parts business from one place.
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                        The back office for Genesis Investment: orders, stock, returns, customers and reports.
                    </p>
                    <ul className="mt-10 space-y-6">
                        {POINTS.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10">
                                    <Icon className="h-5 w-5 text-blue-400" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-white">{title}</span>
                                    <span className="mt-0.5 block text-sm leading-relaxed text-slate-400">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative flex items-center justify-between text-xs text-slate-500">
                    <span>© {year} Genesis Investment</span>
                    <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4" /> Staff access only</span>
                </div>
            </aside>

            {/* form panel */}
            <main className="flex flex-col px-5 py-8 sm:px-10">
                <div className="lg:hidden"><BrandMark /></div>
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-[400px]">{children}</div>
                </div>
                <p className="text-center text-xs text-gray-400 lg:hidden">© {year} Genesis Investment · Staff access only</p>
            </main>
        </div>
    );
}

/** Field chrome shared by the auth forms. */
export const authInput =
    'block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:opacity-60 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500';
export const authLabel = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200';
export const authButton =
    'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60';

export function Spinner() {
    return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
