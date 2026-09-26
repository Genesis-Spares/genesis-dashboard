import { OrderItem } from '@/types/order.types';
import { formatMoney } from '../OrderTable';

interface ItemsTabProps {
    items: OrderItem[];
    currency: string;
}

export function ItemsTab({ items, currency }: ItemsTabProps) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="p-5 pb-0">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Items ({items.length})
                </h3>
            </div>

            {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No items on this order.</div>
            ) : (
                <div className="relative overflow-x-auto mt-4">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-blue-50/60 dark:bg-blue-900/10">
                                <th className="py-2 px-5 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Product</th>
                                <th className="py-2 px-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">SKU</th>
                                <th className="py-2 px-3 text-right text-sm font-medium text-gray-700 dark:text-gray-200">Unit Price</th>
                                <th className="py-2 px-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">Qty</th>
                                <th className="py-2 px-5 text-right text-sm font-medium text-gray-700 dark:text-gray-200">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                {item.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                                                {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {Object.entries(item.attributes)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{item.sku}</td>
                                    <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300 text-right">
                                        {formatMoney(item.unitPrice, currency)}
                                    </td>
                                    <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300 text-center">{item.quantity}</td>
                                    <td className="py-3 px-5 text-sm font-medium text-gray-800 dark:text-gray-100 text-right">
                                        {formatMoney(item.subtotal, currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
