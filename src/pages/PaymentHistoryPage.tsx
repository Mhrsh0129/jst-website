import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Download,
  Calendar,
  IndianRupee,
  Receipt,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  bill_id: string;
}

interface Bill {
  id: string;
  bill_number: string;
}

interface PaymentWithBill extends Payment {
  bill?: Bill;
}

const PaymentHistoryPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentWithBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;

        if (paymentsData) {
          // Fetch bills for each payment
          const billIds = [...new Set(paymentsData.map(p => p.bill_id))];
          const { data: billsData } = await supabase
            .from("bills")
            .select("id, bill_number")
            .in("id", billIds);

          const billsMap = new Map(billsData?.map(b => [b.id, b]) || []);
          
          const paymentsWithBills = paymentsData.map(p => ({
            ...p,
            bill: billsMap.get(p.bill_id),
          }));

          setPayments(paymentsWithBills);
          setTotalPaid(paymentsData.reduce((sum, p) => sum + Number(p.amount), 0));
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
      }

      setIsLoading(false);
    };

    fetchPayments();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      upi: "UPI",
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      cheque: "Cheque",
    };
    return methods[method] || method;
  };

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
                Payment History
              </h1>
              <p className="text-sm text-muted-foreground">
                View all your past payments
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-8 h-8" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Total Paid</p>
              <p className="font-display text-3xl font-bold">
                ₹{totalPaid.toLocaleString()}
              </p>
              <p className="text-primary-foreground/70 text-sm">
                {payments.length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">
              All Payments
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your payment history will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          ₹{Number(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.bill?.bill_number || "Bill payment"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                          {payment.transaction_id && (
                            <span className="text-xs text-muted-foreground">
                              Txn: {payment.transaction_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground mt-2 ml-14">
                      Note: {payment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentHistoryPage;
