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
import { useMemo, useState } from "react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { SalesDialogs } from "./components/sales-dialogs";
import { SalesFilters } from "./components/sales-filters";
import { SalesKanban } from "./components/sales-kanban";
import { SalesPrimaryButtons } from "./components/sales-primary-buttons";
import { SalesProvider } from "./components/sales-provider";
import { SalesTable } from "./components/sales-table";
import { filterSales } from "./data/filters";
import { formatCurrency, getSaleTotal, type Sale } from "./data/schema";

const route = getRouteApi("/_authenticated/sales/");

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
				<ConfigDrawer />
				<ProfileDropdown />
			</Header>

			<Main className="flex flex-1 flex-col gap-4 sm:gap-6">
				<div className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Vendas</h2>
						<p className="text-muted-foreground">
							Gerencie vendas, entrega, pagamento e conclusão.
						</p>
					</div>
					<SalesPrimaryButtons />
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Pedidos</CardTitle>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{kpis.orderCount}</div>
							<p className="text-xs text-muted-foreground">
								{kpis.orderCount === 1
									? "pedido encontrado"
									: "pedidos encontrados"}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Valor Total</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatCurrency(kpis.totalValue)}
							</div>
							<p className="text-xs text-muted-foreground">
								soma de todos os pedidos
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Pagos</CardTitle>
							<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatCurrency(kpis.paidValue)}
							</div>
							<p className="text-xs text-muted-foreground">
								vendas concluídas com pagamento
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">A Receber</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatCurrency(kpis.toReceiveValue)}
							</div>
							<p className="text-xs text-muted-foreground">
								pendentes de pagamento
							</p>
						</CardContent>
					</Card>
				</div>

				<SalesFilters search={search} navigate={navigate} />

				<Tabs
					value={view}
					onValueChange={(value) => setView(value as "table" | "kanban")}
					className="flex flex-1 flex-col"
				>
					<TabsList>
						<TabsTrigger value="table">
							<Table2 />
							Tabela
						</TabsTrigger>
						<TabsTrigger value="kanban">
							<Kanban />
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
						<SalesKanban data={filteredSales} />
					</TabsContent>
				</Tabs>
			</Main>

			<SalesDialogs />
		</SalesProvider>
	);
}
