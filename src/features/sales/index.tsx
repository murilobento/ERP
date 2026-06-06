import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
	CheckCircle2,
	Clock,
	DollarSign,
	Kanban,
	ShoppingCart,
	Table2,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { ThemeSwitch } from "@/components/theme-switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { SalesDialogs } from "./components/sales-dialogs";
import { SalesFilters } from "./components/sales-filters";
import { SalesPrimaryButtons } from "./components/sales-primary-buttons";
import { SalesProvider } from "./components/sales-provider";
import { SalesTable } from "./components/sales-table";
import { filterSales, isWithinRange } from "./data/filters";
import { formatCurrency, getSaleTotal, type Sale } from "./data/schema";

const route = getRouteApi("/_authenticated/sales/");

const SalesKanban = lazy(() =>
	import("./components/sales-kanban").then((module) => ({
		default: module.SalesKanban,
	})),
);

function SalesKanbanFallback() {
	return <div className="min-h-[320px] animate-pulse rounded-md bg-muted" />;
}

export function Sales() {
	const [view, setView] = useState<"table" | "kanban">("kanban");
	const search = route.useSearch();
	const navigate = route.useNavigate();

	const { data: sales = [] } = useQuery({
		queryKey: ["sales"],
		queryFn: async () => {
			const res = await api.get("/sales");
			return res.data.sales as Sale[];
		},
	});
	const filteredSales = useMemo(
		() => filterSales(sales, search),
		[sales, search],
	);
	const preparationSales = useMemo(() => {
		const { deliveryFrom = '', deliveryTo = '' } = search
		return sales.filter(
			(sale) =>
				sale.status === 'in_preparation' &&
				isWithinRange(sale.deliveryDate, deliveryFrom as string, deliveryTo as string),
		)
	}, [sales, search]);

	const kpis = useMemo(() => {
		const orderCount = filteredSales.length;
		const totalValue = filteredSales.reduce(
			(sum, sale) => sum + getSaleTotal(sale),
			0,
		);
		const paidValue = filteredSales
			.filter((sale) => sale.status === "completed")
			.reduce((sum, sale) => sum + getSaleTotal(sale), 0);
		const toReceiveValue = totalValue - paidValue;
		return { orderCount, totalValue, paidValue, toReceiveValue };
	}, [filteredSales]);

	return (
		<SalesProvider>
			<Header fixed>
				<Search className="me-auto" />
				<ThemeSwitch />
				<FullscreenToggle />
				<ConfigDrawer />
				<ProfileDropdown />
			</Header>

			<Main className="flex flex-1 flex-col gap-3 sm:gap-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
					<div className="min-w-0">
						<h2 className="text-2xl font-bold tracking-tight">Vendas</h2>
						<p className="text-sm text-muted-foreground sm:text-base">
							Gerencie vendas, entrega, pagamento e conclusão.
						</p>
					</div>
					<SalesPrimaryButtons />
				</div>

				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="p-2.5 sm:p-3">
						<div className="flex min-w-0 items-center justify-between gap-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-muted-foreground">Pedidos</p>
								<div className="text-xl font-bold sm:text-2xl">{kpis.orderCount}</div>
							</div>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</div>
					</Card>
					<Card className="border-blue-200 bg-blue-50 p-2.5 sm:p-3">
						<div className="flex min-w-0 items-center justify-between gap-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-blue-600">Valor Total</p>
								<div className="text-xl font-bold text-blue-700 sm:text-2xl">
									{formatCurrency(kpis.totalValue)}
								</div>
							</div>
							<DollarSign className="h-4 w-4 text-blue-400" />
						</div>
					</Card>
					<Card className="border-green-200 bg-green-50 p-2.5 sm:p-3">
						<div className="flex min-w-0 items-center justify-between gap-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-green-600">Pagos</p>
								<div className="text-xl font-bold text-green-700 sm:text-2xl">
									{formatCurrency(kpis.paidValue)}
								</div>
							</div>
							<CheckCircle2 className="h-4 w-4 text-green-400" />
						</div>
					</Card>
					<Card className="border-red-200 bg-red-50 p-2.5 sm:p-3">
						<div className="flex min-w-0 items-center justify-between gap-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-red-600">A Receber</p>
								<div className="text-xl font-bold text-red-700 sm:text-2xl">
									{formatCurrency(kpis.toReceiveValue)}
								</div>
							</div>
							<Clock className="h-4 w-4 text-red-400" />
						</div>
					</Card>
				</div>

				<SalesFilters search={search} navigate={navigate} />

				<Tabs
					value={view}
					onValueChange={(value) => setView(value as "table" | "kanban")}
					className="flex flex-1 flex-col"
				>
					<TabsList className="grid h-9 w-full grid-cols-2 sm:inline-flex sm:h-10 sm:w-auto">
						<TabsTrigger value="table" className="gap-1.5 text-sm">
							<Table2 className="size-4" />
							Tabela
						</TabsTrigger>
						<TabsTrigger value="kanban" className="gap-1.5 text-sm">
							<Kanban className="size-4" />
							Kanban
						</TabsTrigger>
					</TabsList>
					<TabsContent value="table" className="flex flex-1 flex-col">
						<SalesTable
							data={filteredSales}
							search={search}
							navigate={navigate}
						/>
					</TabsContent>
					<TabsContent value="kanban" className="flex flex-1 flex-col">
						<Suspense fallback={<SalesKanbanFallback />}>
							<SalesKanban data={filteredSales} preparationSales={preparationSales} />
						</Suspense>
					</TabsContent>
				</Tabs>
			</Main>

			<SalesDialogs />
		</SalesProvider>
	);
}
