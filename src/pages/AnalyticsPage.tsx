import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  IndianRupee,
  Users,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopCustomer {
  name: string;
  businessName: string | null;
  totalPurchases: number;
  totalPaid: number;
}

interface PaymentStats {
  collected: number;
  pending: number;
}

const AnalyticsPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ collected: 0, pending: 0 });
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    // Only admin can access analytics, redirect CA and customers to bills
    if (!loading && user && userRole !== "admin") {
      navigate("/bills");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || userRole !== "admin") return;

      setIsLoading(true);

      try {
        // Fetch all orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: true });

        // Fetch all bills
        const { data: billsData } = await supabase
          .from("bills")
          .select("*");

        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*");

        if (ordersData && billsData && profilesData) {
          // Calculate monthly data
          const monthlyMap = new Map<string, { revenue: number; orders: number }>();
          
          ordersData.forEach(order => {
            const date = new Date(order.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthLabel = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            
            const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0, label: monthLabel };
            monthlyMap.set(monthKey, {
              ...existing,
              revenue: existing.revenue + Number(order.total_amount),
              orders: existing.orders + 1,
            });
          });

          const sortedMonthly = Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([key, data]) => ({
              month: new Date(key + "-01").toLocaleDateString("en-IN", { month: "short" }),
              revenue: data.revenue,
              orders: data.orders,
            }));

          setMonthlyData(sortedMonthly);

          // Calculate payment stats
          const totalCollected = billsData.reduce((sum, bill) => sum + Number(bill.paid_amount), 0);
          const totalPending = billsData.reduce((sum, bill) => sum + Number(bill.balance_due), 0);
          setPaymentStats({ collected: totalCollected, pending: totalPending });

          // Calculate top customers
          const customerOrderMap = new Map<string, { total: number; paid: number }>();
          
          billsData.forEach(bill => {
            const existing = customerOrderMap.get(bill.customer_id) || { total: 0, paid: 0 };
            customerOrderMap.set(bill.customer_id, {
              total: existing.total + Number(bill.total_amount),
              paid: existing.paid + Number(bill.paid_amount),
            });
          });

          const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
          
          const topCust = Array.from(customerOrderMap.entries())
            .map(([customerId, data]) => {
              const profile = profileMap.get(customerId);
              return {
                name: profile?.full_name || "Unknown",
                businessName: profile?.business_name || null,
                totalPurchases: data.total,
                totalPaid: data.paid,
              };
            })
            .sort((a, b) => b.totalPurchases - a.totalPurchases)
            .slice(0, 5);

          setTopCustomers(topCust);

          // Calculate total stats
          const totalRev = ordersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
          setTotalStats({
            totalRevenue: totalRev,
            totalOrders: ordersData.length,
            totalCustomers: profilesData.length,
            avgOrderValue: ordersData.length > 0 ? totalRev / ordersData.length : 0,
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }

      setIsLoading(false);
    };

    fetchAnalytics();
  }, [user, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "ca")) {
    return null;
  }

  const COLORS = ["#10b981", "#f59e0b"];
  const paymentPieData = [
    { name: "Collected", value: paymentStats.collected },
    { name: "Pending", value: paymentStats.pending },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Sales Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Business insights and trends
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      ₹{totalStats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {totalStats.totalOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {totalStats.totalCustomers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      ₹{Math.round(totalStats.avgOrderValue).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Revenue Chart */}
              <div className="bg-card rounded-xl p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Monthly Revenue
                </h2>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>

              {/* Payment Collection Pie Chart */}
              <div className="bg-card rounded-xl p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Payment Collection
                </h2>
                {paymentStats.collected > 0 || paymentStats.pending > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={paymentPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {paymentPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => `₹${value.toLocaleString()}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No payment data
                  </div>
                )}
                <div className="flex justify-center gap-8 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">
                      Collected: ₹{paymentStats.collected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-muted-foreground">
                      Pending: ₹{paymentStats.pending.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-card rounded-xl p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Top Customers by Purchase
              </h2>
              {topCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Rank
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Customer
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Total Purchases
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Amount Paid
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Collection Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((customer, index) => {
                        const collectionRate = customer.totalPurchases > 0
                          ? (customer.totalPaid / customer.totalPurchases) * 100
                          : 0;
                        
                        return (
                          <tr key={index} className="border-b border-border last:border-0">
                            <td className="py-3 px-4">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? "bg-amber-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                index === 2 ? "bg-amber-700 text-white" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-foreground">{customer.name}</p>
                              {customer.businessName && (
                                <p className="text-sm text-muted-foreground">
                                  {customer.businessName}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-foreground">
                              ₹{customer.totalPurchases.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-green-600 font-medium">
                              ₹{customer.totalPaid.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                collectionRate >= 80 ? "bg-green-500/20 text-green-600" :
                                collectionRate >= 50 ? "bg-amber-500/20 text-amber-600" :
                                "bg-red-500/20 text-red-600"
                              }`}>
                                {collectionRate.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No customer data available
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;
