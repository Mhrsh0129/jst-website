import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCsv, exportToExcel } from "@/utils/export";
import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  Package,
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

const OrdersPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate, userRole]);

  useEffect(() => {
    const fetchOrders = async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (userRole !== "admin" && userRole !== "ca" && user) {
        query = query.eq("customer_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data || []);
      }

      setIsLoadingOrders(false);
    };

    if (user) {
      fetchOrders();
    }
  }, [user, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-600";
      case "processing":
        return "bg-blue-500/20 text-blue-600";
      case "pending":
        return "bg-amber-500/20 text-amber-600";
      case "cancelled":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
    const matchesSearch = searchTerm
      ? order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const created = new Date(order.created_at);
    const matchesFrom = fromDate ? created >= new Date(fromDate) : true;
    const matchesTo = toDate ? created <= new Date(toDate) : true;
    return matchesStatus && matchesSearch && matchesFrom && matchesTo;
  });

  const canExport = userRole === "admin" || userRole === "ca";

  const handleExport = (type: "csv" | "excel") => {
    if (!canExport) return;
    const rows = filteredOrders.map((o) => ({
      Order: o.order_number,
      Status: o.status,
      Total: Number(o.total_amount),
      Created: new Date(o.created_at).toLocaleString(),
      Notes: o.notes || "",
    }));
    if (type === "csv") {
      exportToCsv(rows, "orders");
    } else {
      exportToExcel(rows, "orders.xlsx", "Orders");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-display text-xl font-bold text-foreground">
                My Orders
              </h1>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Search</p>
            <Input
              placeholder="Order number or notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">From</p>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">To</p>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {orders.length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="font-display text-2xl font-bold text-amber-600">
              {orders.filter(o => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="font-display text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === "completed").length}
            </p>
          </div>
        </div>

        {canExport && (
          <div className="flex gap-3 mb-4">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("excel")}>
              Export Excel
            </Button>
          </div>
        )}

        {/* Orders List */}
        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Link to="/products">
              <Button variant="gold">
                <Package className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-xl p-6 shadow-soft"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {order.order_number}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Notes: {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-display text-xl font-bold text-foreground">
                      ₹{Number(order.total_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
