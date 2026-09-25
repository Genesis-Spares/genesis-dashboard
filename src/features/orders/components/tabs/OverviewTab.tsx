import { Order } from '@/types/order.types';
import { formatMoney } from '../OrderTable';

interface OverviewTabProps {
    order: Order;
}

function InfoCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{value}</span>
        </div>
    );
}

function AddressBlock({ title, address }: { title: string; address?: Order['shippingAddress'] }) {
    if (!address) {
        return (
            <InfoCard title={title}>
                <p className="text-sm text-gray-400">Not provided.</p>
            </InfoCard>
        );
    }

    return (
        <InfoCard title={title}>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{address.fullName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {address.city}
                {address.state ? `, ${address.state}` : ''} {address.postalCode}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{address.country}</p>
            {address.phone && <p className="text-xs text-gray-400 mt-1">📞 {address.phone}</p>}
        </InfoCard>
    );
}

export function OverviewTab({ order }: OverviewTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <InfoCard title="Order Summary">
                    <Field label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                    <Field label="Shipping" value={formatMoney(order.shippingAmount, order.currency)} />
                    <Field label="Tax" value={formatMoney(order.taxAmount, order.currency)} />
                    {Number(order.discountAmount) > 0 && (
                        <Field label="Discount" value={`- ${formatMoney(order.discountAmount, order.currency)}`} />
                    )}
                    {order.couponCode && <Field label="Coupon" value={order.couponCode} />}
                    <div className="flex items-center justify-between pt-3 mt-1">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total</span>
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                            {formatMoney(order.total, order.currency)}
                        </span>
                    </div>
                </InfoCard>

                <InfoCard title="Payment">
                    <Field label="Status" value={order.paymentStatus.replace('_', ' ')} />
                    <Field label="Method" value={order.paymentMethod ?? '—'} />
                </InfoCard>

                {(order.trackingNumber || order.customerNote) && (
                    <InfoCard title="Fulfillment">
                        {order.trackingNumber && (
                            <>
                                <Field label="Carrier" value={order.trackingCarrier ?? '—'} />
                                <Field label="Tracking #" value={<span className="font-mono text-xs">{order.trackingNumber}</span>} />
                            </>
                        )}
                        {order.customerNote && (
                            <div className="pt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer note</p>
                                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{order.customerNote}</p>
                            </div>
                        )}
                    </InfoCard>
                )}
            </div>

            <div className="space-y-6">
                <InfoCard title="Customer">
                    <Field label="Name" value={order.customerName} />
                    <Field label="Email" value={order.customerEmail} />
                    <Field label="Phone" value={order.customerPhone ?? '—'} />
                    <Field label="Customer ID" value={<span className="font-mono text-xs">{order.customerId}</span>} />
                </InfoCard>

                <AddressBlock title="Shipping Address" address={order.shippingAddress} />
                {order.billingAddress && <AddressBlock title="Billing Address" address={order.billingAddress} />}

                <InfoCard title="Timestamps">
                    <Field label="Placed" value={new Date(order.createdAt).toLocaleString()} />
                    <Field label="Last updated" value={new Date(order.updatedAt).toLocaleString()} />
                    {order.shippedAt && <Field label="Shipped" value={new Date(order.shippedAt).toLocaleString()} />}
                    {order.deliveredAt && <Field label="Delivered" value={new Date(order.deliveredAt).toLocaleString()} />}
                    {order.cancelledAt && <Field label="Cancelled" value={new Date(order.cancelledAt).toLocaleString()} />}
                </InfoCard>
            </div>
        </div>
    );
}
