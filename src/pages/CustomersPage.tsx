import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Users,
  Search,
  IndianRupee,
  Edit2,
  MessageSquare,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  credit_limit: number;
}

interface CustomerWithBalance extends Profile {
  totalOutstanding: number;
  totalPaid: number;
}

const CustomersPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBalance | null>(null);
  const [editingCreditLimit, setEditingCreditLimit] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && user && userRole !== "admin" && userRole !== "ca") {
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user || (userRole !== "admin" && userRole !== "ca")) return;

      setIsLoading(true);

      try {
        // Try local bridge first
        try {
          const localResp = await fetch("http://localhost:8000/api/admin/customers", {
            headers: { "x-api-key": "Maharsh_JST_0129" }
          });
          if (localResp.ok) {
            const localData = await localResp.json();
            const mapped = localData.map((c: any) => ({
              id: c.s_no.toString(),
              user_id: c.phone,
              full_name: c.customer_name,
              business_name: c.business_name,
              phone: c.phone,
              email: `${c.phone}@local.com`,
              credit_limit: c.credit_limit_remaining + (c.credit_limit_used || 0),
              totalOutstanding: c.total_remaining_amount,
              totalPaid: 0 // Placeholder for local
            }));
            setCustomers(mapped);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log("Local bridge offline, fetching from Supabase...");
        }

        // Fetch all customer profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("full_name");

        if (profilesError) throw profilesError;

        // Fetch all bills to calculate balances
        const { data: billsData } = await supabase
          .from("bills")
          .select("customer_id, balance_due, paid_amount");

        // Calculate balances per customer
        const balanceMap = new Map<string, { outstanding: number; paid: number }>();

        billsData?.forEach(bill => {
          const existing = balanceMap.get(bill.customer_id) || { outstanding: 0, paid: 0 };
          balanceMap.set(bill.customer_id, {
            outstanding: existing.outstanding + Number(bill.balance_due),
            paid: existing.paid + Number(bill.paid_amount),
          });
        });

        const customersWithBalances = profilesData?.map(profile => ({
          ...profile,
          credit_limit: profile.credit_limit || 50000,
          totalOutstanding: balanceMap.get(profile.user_id)?.outstanding || 0,
          totalPaid: balanceMap.get(profile.user_id)?.paid || 0,
        })) || [];

        setCustomers(customersWithBalances);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }

      setIsLoading(false);
    };

    fetchCustomers();
  }, [user, userRole]);

  const handleUpdateCreditLimit = async () => {
    if (!selectedCustomer || !newCreditLimit) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ credit_limit: parseFloat(newCreditLimit) })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      setCustomers(prev =>
        prev.map(c =>
          c.id === selectedCustomer.id
            ? { ...c, credit_limit: parseFloat(newCreditLimit) }
            : c
        )
      );

      toast({
        title: "Credit limit updated",
        description: `Credit limit for ${selectedCustomer.full_name} has been updated.`,
      });

      setEditingCreditLimit(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error updating credit limit:", error);
      toast({
        title: "Error",
        description: "Failed to update credit limit.",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async () => {
    if (!selectedCustomer || !reminderMessage) return;

    try {
      // Save reminder to database
      const { error } = await supabase.from("payment_reminders").insert({
        customer_id: selectedCustomer.id,
        reminder_type: "whatsapp",
        message: reminderMessage,
        sent_by: user?.id,
      });

      if (error) throw error;

      // Open WhatsApp with pre-filled message
      const phone = selectedCustomer.phone?.replace(/\D/g, "") || "";
      const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(reminderMessage)}`;
      window.open(whatsappUrl, "_blank");

      toast({
        title: "Reminder sent",
        description: `Payment reminder sent to ${selectedCustomer.full_name}.`,
      });

      setSendingReminder(false);
      setSelectedCustomer(null);
      setReminderMessage("");
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder.",
        variant: "destructive",
      });
    }
  };

  const openReminderDialog = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setReminderMessage(
      `Dear ${customer.full_name},\n\nThis is a friendly reminder that you have an outstanding balance of ₹${customer.totalOutstanding.toLocaleString()} with Jay Shree Traders.\n\nPlease clear your dues at the earliest convenience.\n\nThank you for your business!`
    );
    setSendingReminder(true);
  };

  const openCreditLimitDialog = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setNewCreditLimit(customer.credit_limit.toString());
    setEditingCreditLimit(true);
  };

  const filteredCustomers = customers.filter(
    c =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

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
                Customer Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage customers, credit limits & reminders
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, business or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {customers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Over Credit Limit</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {customers.filter(c => c.totalOutstanding > c.credit_limit).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  ₹{customers.reduce((sum, c) => sum + c.totalOutstanding, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">
              All Customers
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCustomers.map((customer) => {
                const isOverLimit = customer.totalOutstanding > customer.credit_limit;

                return (
                  <div
                    key={customer.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${isOverLimit ? "bg-red-50 dark:bg-red-950/20" : ""
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {customer.full_name}
                          </p>
                          {isOverLimit && (
                            <span className="text-xs bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Over Limit
                            </span>
                          )}
                        </div>
                        {customer.business_name && (
                          <p className="text-sm text-muted-foreground">
                            {customer.business_name}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            📞 {customer.phone || "N/A"}
                          </span>
                          <span className="text-muted-foreground">
                            ✉️ {customer.email || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Outstanding</p>
                            <p className={`font-semibold ${isOverLimit ? "text-red-600" : "text-foreground"}`}>
                              ₹{customer.totalOutstanding.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Credit Limit</p>
                            <p className="font-semibold text-foreground">
                              ₹{customer.credit_limit.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreditLimitDialog(customer)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit Limit
                          </Button>
                          {customer.totalOutstanding > 0 && customer.phone && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openReminderDialog(customer)}
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Send Reminder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Credit Limit Dialog */}
      <Dialog open={editingCreditLimit} onOpenChange={setEditingCreditLimit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Credit Limit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Set credit limit for <strong>{selectedCustomer?.full_name}</strong>
            </p>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                className="pl-9"
                placeholder="Enter credit limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCreditLimit(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCreditLimit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={sendingReminder} onOpenChange={setSendingReminder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Send Payment Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Send WhatsApp reminder to <strong>{selectedCustomer?.full_name}</strong>
            </p>
            <textarea
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              rows={6}
              className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter reminder message..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendingReminder(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReminder} className="bg-green-500 hover:bg-green-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
