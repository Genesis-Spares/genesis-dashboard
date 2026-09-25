export interface ReportRange { from: string; to: string }

export interface ProfitTotals {
    revenue: number;
    units: number;
    products: number;
    cost: number;
    profit: number;
    margin: number | null;
    /** Share of revenue whose cost is known — profit only covers that part. */
    costCoverage: number;
    /** Some older sales used today's cost price instead of the cost at the time. */
    estimated: boolean;
    slowMoverStockValue: number;
}

export interface SalesOverview extends ReportRange {
    orders: number;
    units: number;
    customers: number;
    itemsRevenue: number;
    delivery: number;
    discounts: number;
    gross: number;
    collected: number;
    refunds: number;
    returnsRefunded: number;
    net: number;
    averageOrder: number;
    cancelled: number;
    daily: { date: string; orders: number; revenue: number }[];
    paymentMethods: { method: string; orders: number; revenue: number }[];
    previous: ReportRange & { orders: number; units: number; customers: number; gross: number; net: number; refunds: number; averageOrder: number };
    profit: ProfitTotals;
}

export interface ProductSalesRow {
    productId: string;
    name: string;
    sku: string;
    brand: string | null;
    category: string | null;
    categoryId: string | null;
    units: number;
    orders: number;
    revenue: number;
    cost: number | null;
    profit: number | null;
    margin: number | null;
    costEstimated: boolean;
    returnedUnits: number;
    returnRate: number;
    stockQty: number | null;
    isActive: boolean;
    deleted: boolean;
}

export interface SalesRollup {
    key: string;
    label: string;
    products: number;
    units: number;
    revenue: number;
    cost: number;
    profit: number | null;
    margin: number | null;
    costMissing: boolean;
}

export interface SlowMover {
    productId: string;
    name: string;
    sku: string;
    brand: string | null;
    category: string | null;
    stockQty: number;
    costPrice: number | null;
    price: number;
    stockValue: number | null;
    retailValue: number;
    lastSoldAt: string | null;
    daysIdle: number;
}

export interface ProductReport extends ReportRange {
    totals: ProfitTotals;
    products: ProductSalesRow[];
    categories: SalesRollup[];
    brands: SalesRollup[];
    slowMovers: SlowMover[];
}

export interface CustomerReport extends ReportRange {
    summary: {
        customers: number;
        repeatCustomers: number;
        repeatRate: number;
        averageOrders: number;
        averageLifetimeValue: number;
        newInPeriod: number;
    };
    top: {
        customerId: string;
        name: string;
        email: string;
        orders: number;
        lifetimeValue: number;
        averageOrder: number;
        firstOrder: string;
        lastOrder: string;
        periodOrders: number;
        periodValue: number;
    }[];
}
