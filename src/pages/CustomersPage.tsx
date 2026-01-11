import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  UserPlus,
  Trash2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  credit_limit: number;
}

interface CustomerWithBalance extends Profile {
  totalOutstanding: number;
  totalPaid: number;
}

interface CustomerFormData {
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  credit_limit: string;
  password: string;
}

const initialFormData: CustomerFormData = {
  full_name: "",
  business_name: "",
  phone: "",
  email: "",
  address: "",
  gst_number: "",
  credit_limit: "50000",
  password: "",
};

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
  
  // New state for admin features
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

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
      `प्रिय ${customer.full_name} जी,\n\nनमस्कार! आपको सूचित किया जाता है कि Jay Shree Traders में आपका ₹${customer.totalOutstanding.toLocaleString()} का बकाया है।\n\nकृपया जल्द से जल्द भुगतान करें।\n\nधन्यवाद!\nजय श्री ट्रेडर्स`
    );
    setSendingReminder(true);
  };

  const openCreditLimitDialog = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setNewCreditLimit(customer.credit_limit.toString());
    setEditingCreditLimit(true);
  };

  // Handle adding a new customer via edge function (creates real auth user)
  const handleAddCustomer = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return;
    }

    // Either email or phone is required
    const hasEmail = formData.email.trim() && formData.email.includes("@");
    const hasPhone = formData.phone.trim().length >= 10;
    
    if (!hasEmail && !hasPhone) {
      toast({
        title: "Validation Error",
        description: "Either a valid email or 10-digit phone number is required for customer login.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get current session to verify we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session Expired",
          description: "Please log in again to add customers.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Call edge function to create customer with proper auth user
      const { data, error } = await supabase.functions.invoke("create-customer", {
        body: {
          full_name: formData.full_name.trim(),
          business_name: formData.business_name.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          gst_number: formData.gst_number.trim() || null,
          credit_limit: parseFloat(formData.credit_limit) || 50000,
          password: formData.password.trim() || null,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Add to local state
      if (data.profile) {
        setCustomers(prev => [
          ...prev,
          {
            ...data.profile,
            credit_limit: data.profile.credit_limit || 50000,
            totalOutstanding: 0,
            totalPaid: 0,
          },
        ]);
      }

      // Show credentials if password was auto-generated
      if (data.generatedPassword) {
        toast({
          title: "Customer Added",
          description: `${formData.full_name} created. Password: ${data.generatedPassword} - Share this with the customer!`,
          duration: 15000,
        });
      } else {
        toast({
          title: "Customer Added",
          description: `${formData.full_name} has been added successfully.`,
        });
      }

      setIsAddingCustomer(false);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add customer.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Handle editing customer details
  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          business_name: formData.business_name.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          gst_number: formData.gst_number.trim() || null,
          credit_limit: parseFloat(formData.credit_limit) || 50000,
        })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      // Update local state
      setCustomers(prev =>
        prev.map(c =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                full_name: formData.full_name.trim(),
                business_name: formData.business_name.trim() || null,
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                address: formData.address.trim() || null,
                gst_number: formData.gst_number.trim() || null,
                credit_limit: parseFloat(formData.credit_limit) || 50000,
              }
            : c
        )
      );

      toast({
        title: "Customer Updated",
        description: `${formData.full_name} has been updated successfully.`,
      });

      setIsEditingCustomer(false);
      setSelectedCustomer(null);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      // Remove from local state
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));

      toast({
        title: "Customer Deleted",
        description: `${selectedCustomer.full_name} has been removed.`,
      });

      setIsDeletingCustomer(false);
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Open edit dialog with customer data
  const openEditDialog = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      business_name: customer.business_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      gst_number: customer.gst_number || "",
      credit_limit: customer.credit_limit.toString(),
      password: "",
    });
    setIsEditingCustomer(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setIsDeletingCustomer(true);
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
          <div className="flex items-center justify-between">
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
            {userRole === "admin" && (
              <Button onClick={() => {
                setFormData(initialFormData);
                setIsAddingCustomer(true);
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
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
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      isOverLimit ? "bg-red-50 dark:bg-red-950/20" : ""
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

                        <div className="flex flex-wrap gap-2">
                          {userRole === "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => openDeleteDialog(customer)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreditLimitDialog(customer)}
                              >
                                <IndianRupee className="w-4 h-4 mr-1" />
                                Edit Limit
                              </Button>
                              {customer.totalOutstanding > 0 && customer.phone && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openReminderDialog(customer)}
                                >
                                  <Bell className="w-4 h-4 mr-1" />
                                  Reminder
                                </Button>
                              )}
                            </>
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

      {/* Add/Edit Customer Dialog */}
      <Dialog 
        open={isAddingCustomer || isEditingCustomer} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingCustomer(false);
            setIsEditingCustomer(false);
            setFormData(initialFormData);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingCustomer ? "Add New Customer" : "Edit Customer Details"}
            </DialogTitle>
            <DialogDescription>
              {isAddingCustomer 
                ? "Add a new customer to the system." 
                : `Update details for ${selectedCustomer?.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter customer name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Enter business name"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone {isAddingCustomer && "*"}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="10-digit number"
                  maxLength={10}
                />
                {isAddingCustomer && (
                  <p className="text-xs text-muted-foreground">Customer can login with this</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email (optional)"
                  maxLength={255}
                />
                {isAddingCustomer && (
                  <p className="text-xs text-muted-foreground">Or use email for login</p>
                )}
              </div>
            </div>
            {isAddingCustomer && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">Login Method</p>
                <p className="text-xs text-muted-foreground">
                  {formData.phone.length >= 10 
                    ? `✅ Phone login enabled: Customer can login with phone ${formData.phone} (password = phone number)`
                    : formData.email.includes("@")
                    ? "📧 Email login: Enter a password below or leave empty to auto-generate"
                    : "Enter phone (10 digits) or email to enable customer login"
                  }
                </p>
              </div>
            )}
            {isAddingCustomer && !formData.phone && formData.email.includes("@") && (
              <div className="space-y-2">
                <Label htmlFor="password">Password (optional for email login)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate a secure password
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="Enter GST number"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingCustomer(false);
                setIsEditingCustomer(false);
                setFormData(initialFormData);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={isAddingCustomer ? handleAddCustomer : handleEditCustomer}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isAddingCustomer ? "Add Customer" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeletingCustomer} onOpenChange={setIsDeletingCustomer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.full_name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersPage;
