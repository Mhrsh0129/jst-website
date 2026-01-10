import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Loader2,
  IndianRupee,
  Download,
  QrCode,
} from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

interface Bill {
  id: string;
  bill_number: string;
  order_id: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

const BillsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchBills = async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bills:", error);
      } else {
        setBills(data || []);
      }

      setIsLoadingBills(false);
    };

    if (user) {
      fetchBills();
    }
  }, [user]);

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
      case "paid":
        return "bg-green-500/20 text-green-600";
      case "partial":
        return "bg-amber-500/20 text-amber-600";
      default:
        return "bg-red-500/20 text-red-600";
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
                My Bills
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
            <p className="font-display text-2xl font-bold text-red-600">
              ₹{bills.reduce((sum, b) => sum + Number(b.balance_due), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
            <p className="font-display text-2xl font-bold text-green-600">
              ₹{bills.reduce((sum, b) => sum + Number(b.paid_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-1">Total Bills</p>
            <p className="font-display text-2xl font-bold text-foreground">
              {bills.length}
            </p>
          </div>
        </div>

        {/* Bills List */}
        {isLoadingBills ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bills yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-card rounded-xl p-6 shadow-soft"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {bill.bill_number}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(
                          bill.status
                        )}`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(bill.created_at).toLocaleDateString()}
                      {bill.due_date && (
                        <> • Due: {new Date(bill.due_date).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-display text-xl font-bold text-foreground">
                        ₹{Number(bill.total_amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance Due</p>
                      <p className="font-display text-xl font-bold text-red-600">
                        ₹{Number(bill.balance_due).toLocaleString()}
                      </p>
                    </div>
                    {Number(bill.balance_due) > 0 && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          setSelectedBill(bill);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <QrCode className="w-4 h-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedBill && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedBill(null);
          }}
          bill={selectedBill}
        />
      )}
    </div>
  );
};

export default BillsPage;
