import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  LogOut,
  User,
  Settings,
  Home,
  Loader2,
  IndianRupee,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Profile {
  full_name: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
}

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  created_at: string;
  customer_id: string;
  customer_name?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_id: string;
  customer_name?: string;
}

interface SampleRequest {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  customer_id: string;
  customer_name?: string;
}

const Dashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sampleRequests, setSampleRequests] = useState<SampleRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading) return;

    // Redirect to auth if not logged in
    if (!user) {
      navigate("/auth");
      return;
    }

    // Only redirect CA users to bills page (admin and customers stay on dashboard)
    if (userRole === "ca") {
      console.log("CA user detected, redirecting to bills page");
      navigate("/bills");
    } else {
      console.log("User role:", userRole, "- staying on dashboard");
    }
  }, [user, loading, navigate, userRole]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !userRole) return;

      setIsLoadingData(true);

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch bills - customers see only their bills, admins see all
        let billsQuery = supabase
          .from("bills")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (userRole === "customer") {
          billsQuery = billsQuery.eq("customer_id", user.id);
        }

        const { data: billsData } = await billsQuery;

        if (billsData) {
          let enrichedBills = billsData;

          // For admins, fetch customer names
          if (userRole === "admin" && billsData.length > 0) {
            const customerIds = [...new Set(billsData.map(b => b.customer_id))];
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name")
              .in("user_id", customerIds);

            const profilesMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
            enrichedBills = billsData.map(b => ({
              ...b,
              customer_name: profilesMap.get(b.customer_id) || "Unknown"
            }));
          }

          setBills(enrichedBills);
        }

        // Fetch orders - customers see only their orders, admins see all
        let ordersQuery = supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (userRole === "customer") {
          ordersQuery = ordersQuery.eq("customer_id", user.id);
        }

        const { data: ordersData } = await ordersQuery;

        if (ordersData) {
          let enrichedOrders = ordersData;

          // For admins, fetch customer names
          if (userRole === "admin" && ordersData.length > 0) {
            const customerIds = [...new Set(ordersData.map(o => o.customer_id))];
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name")
              .in("user_id", customerIds);

            const profilesMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
            enrichedOrders = ordersData.map(o => ({
              ...o,
              customer_name: profilesMap.get(o.customer_id) || "Unknown"
            }));
          }

          setOrders(enrichedOrders);
        }

        // Fetch sample requests - customers see their own, admins see all
        let srQuery = supabase
          .from("sample_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (userRole === "customer") {
          srQuery = srQuery.eq("customer_id", user.id);
        }

        const { data: srData } = await srQuery;

        if (srData) {
          let enrichedSR = srData;

          if (userRole === "admin" && srData.length > 0) {
            const customerIds = [...new Set(srData.map(s => s.customer_id))];
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name")
              .in("user_id", customerIds);

            const profilesMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
            enrichedSR = srData.map(s => ({
              ...s,
              customer_name: profilesMap.get(s.customer_id) || "Unknown",
            }));
          }

          setSampleRequests(enrichedSR);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      setIsLoadingData(false);
    };

    fetchData();

    // Subscribe to bills changes for real-time updates
    const billsChannel = supabase
      .channel("bills_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bills",
          filter: userRole === "customer" ? `customer_id=eq.${user?.id}` : undefined,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      billsChannel.unsubscribe();
    };
  }, [user, userRole]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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

  const totalOutstanding = bills.reduce((sum, bill) => sum + Number(bill.balance_due), 0);
  const totalPaid = bills.reduce((sum, bill) => sum + Number(bill.paid_amount), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-xl font-bold text-primary">
              Jay Shree Traders
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {profile?.full_name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User")}
              </span>
              {userRole && (
                <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full capitalize">
                  {userRole === "ca" ? "Chartered Accountant" : userRole}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 md:p-8 mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Welcome, {profile?.full_name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User")}!
          </h1>
          <p className="text-primary-foreground/80 mb-4">
            {profile?.business_name && `Business: ${profile.business_name}`}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/">
              <Button variant="heroOutline" size="sm">
                <Home className="w-4 h-4" />
                View Website
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="gold" size="sm">
                <Package className="w-4 h-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid - Hide financial totals from CA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {userRole !== "ca" && (
            <>
              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      ₹{totalOutstanding.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      ₹{totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {userRole !== "ca" && (
            <div className="bg-card rounded-xl p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {bills.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - CA only sees Bills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {userRole !== "ca" && (
            <Link
              to="/products"
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-all text-center group"
            >
              <Package className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">Products</p>
              <p className="text-xs text-muted-foreground">Browse catalog</p>
            </Link>
          )}

          <Link
            to="/bills"
            className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-all text-center group"
          >
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Bills</p>
            <p className="text-xs text-muted-foreground">View invoices</p>
          </Link>

          {userRole !== "ca" && (
            <Link
              to="/payment-history"
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-all text-center group"
            >
              <CreditCard className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">Payments</p>
              <p className="text-xs text-muted-foreground">Payment history</p>
            </Link>
          )}

          {userRole === "admin" && (
            <Link
              to="/customers"
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-all text-center group"
            >
              <User className="w-8 h-8 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">Customers</p>
              <p className="text-xs text-muted-foreground">Manage clients</p>
            </Link>
          )}
        </div>

        {/* Admin Quick Actions - Only for admin, not CA */}
        {userRole === "admin" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Link
              to="/analytics"
              className="bg-gradient-hero text-primary-foreground rounded-xl p-6 shadow-soft hover:shadow-medium transition-all group"
            >
              <div className="flex items-center gap-4">
                <Settings className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-lg">Sales Analytics</p>
                  <p className="text-sm text-primary-foreground/80">View trends & reports</p>
                </div>
              </div>
            </Link>

            <Link
              to="/customers"
              className="bg-card border-2 border-accent rounded-xl p-6 shadow-soft hover:shadow-medium transition-all group"
            >
              <div className="flex items-center gap-4">
                <User className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-lg text-foreground">Customer Management</p>
                  <p className="text-sm text-muted-foreground">Credit limits & reminders</p>
                </div>
              </div>
            </Link>

            <Link
              to="/pending-payments"
              className="bg-card border-2 border-yellow-500 rounded-xl p-6 shadow-soft hover:shadow-medium transition-all group"
            >
              <div className="flex items-center gap-4">
                <CreditCard className="w-10 h-10 text-yellow-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-lg text-foreground">Payment Approvals</p>
                  <p className="text-sm text-muted-foreground">Review & approve payments</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bills */}
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Recent Bills
              </h2>
              <Link to="/bills" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : bills.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No bills yet
              </p>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {bill.bill_number}
                      </p>
                      {userRole === "admin" && bill.customer_name && (
                        <p className="text-xs font-medium text-accent">
                          {bill.customer_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ₹{Number(bill.total_amount).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${bill.status === "paid"
                          ? "bg-green-500/20 text-green-600"
                          : bill.status === "partial"
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-red-500/20 text-red-600"
                          }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders - Hide for CA */}
          {userRole !== "ca" && (
            <div className="bg-card rounded-xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Recent Orders
                </h2>
                <Link to="/orders" className="text-sm text-accent hover:underline">
                  View all
                </Link>
              </div>

              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No orders yet. Start by browsing our products!
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {order.order_number}
                        </p>
                        {userRole === "admin" && order.customer_name && (
                          <p className="text-xs font-medium text-accent">
                            {order.customer_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ₹{Number(order.total_amount).toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${order.status === "completed"
                            ? "bg-green-500/20 text-green-600"
                            : order.status === "processing"
                              ? "bg-blue-500/20 text-blue-600"
                              : "bg-amber-500/20 text-amber-600"
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Sample Requests */}
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Recent Sample Requests
              </h2>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sampleRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No sample requests found
              </p>
            ) : (
              <div className="space-y-3">
                {sampleRequests.map((sr) => (
                  <div
                    key={sr.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {sr.product_name}
                      </p>
                      {userRole === "admin" && sr.customer_name && (
                        <p className="text-xs font-medium text-accent">
                          {sr.customer_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${sr.status === "pending"
                        ? "bg-amber-500/20 text-amber-600"
                        : sr.status === "approved"
                          ? "bg-green-500/20 text-green-600"
                          : "bg-blue-500/20 text-blue-600"
                        }`}
                    >
                      {sr.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
