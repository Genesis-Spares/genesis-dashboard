'use client';

import { useOrdersByCustomer } from '@/features/orders/hooks/useOrders';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { CLOSED, RelatedOrders } from '@/features/orders/components/RelatedOrders';
import { Order } from '@/types/order.types';

interface OrdersTabProps {
    /** Auth user id (customer.userId) — orders are keyed by the shopper's login, not the customer record id. */
    userId: string;
}

export function OrdersTab({ userId }: OrdersTabProps) {
    const { data, isLoading, isError, refetch } = useOrdersByCustomer(userId, { limit: 50 });
    const orders: Order[] = data?.data ?? [];
    const total = data?.meta?.total ?? orders.length;

    const paid = orders.filter((o) => o.paymentStatus === 'PAID');
    const spent = paid.reduce((n, o) => n + Number(o.total), 0);
    const open = orders.filter((o) => !CLOSED.includes(o.status) && o.status !== 'DELIVERED').length;
    const last = orders[0]?.createdAt;

    return (
        <RelatedOrders
            orders={orders}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            emptyText="This customer hasn't placed any orders yet."
            summary={[
                { label: 'Orders', value: total },
                { label: 'Total spent (paid)', value: formatMoney(spent) },
                { label: 'In progress', value: open },
                { label: 'Last order', value: last ? new Date(last).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            ]}
        />
    );
}
