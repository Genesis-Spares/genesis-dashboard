'use client';

import { useOrders } from '@/features/orders/hooks/useOrders';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { CLOSED, RelatedOrders } from '@/features/orders/components/RelatedOrders';

/** Orders that contain this product, newest first (latest 50). */
export function ProductOrdersTab({ productId }: { productId: string }) {
    const { data, isLoading, isError, refetch } = useOrders({ productId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
    const orders = data?.data ?? [];
    const total = data?.meta?.total ?? orders.length;

    // units / revenue exclude cancelled and refunded orders; revenue counts paid orders only
    let units = 0;
    let revenue = 0;
    let customers = 0;
    const seen = new Set<string>();
    for (const o of orders) {
        if (CLOSED.includes(o.status)) continue;
        const line = o.items?.find((i) => i.productId === productId);
        if (!line) continue;
        units += line.quantity;
        if (o.paymentStatus === 'PAID') revenue += Number(line.subtotal);
        if (!seen.has(o.customerId)) { seen.add(o.customerId); customers++; }
    }

    return (
        <RelatedOrders
            orders={orders}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            productId={productId}
            showCustomer
            emptyText="No orders include this product yet."
            summary={[
                { label: 'Orders', value: total },
                { label: 'Units sold', value: units },
                { label: 'Revenue (paid)', value: formatMoney(revenue) },
                { label: 'Customers', value: customers },
            ]}
        />
    );
}
