import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, QrCode, Smartphone, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Bill {
  id: string;
  bill_number: string;
  balance_due: number;
}

interface AllocationItem {
  bill_number: string;
  amount: number;
}

interface CustomerBulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onPaymentSubmitted: () => void;
}

const CustomerBulkPaymentModal = ({
  isOpen,
  onClose,
  customerId,
  onPaymentSubmitted,
}: CustomerBulkPaymentModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UPI Details
  const upiId = "8319621211@ybl";
  const payeeName = "Jay Shree Traders";

  useEffect(() => {
    if (isOpen) {
      fetchBills();
    }
  }, [isOpen]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("id, bill_number, balance_due")
        .eq("customer_id", customerId)
        .gt("balance_due", 0)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({
        title: "Error",
        description: "Failed to load bills",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const computeAllocations = (paymentAmount: number) => {
    const result: AllocationItem[] = [];
    let remaining = paymentAmount;

    for (const bill of bills) {
      if (remaining <= 0) break;
      const due = Number(bill.balance_due);
      if (due <= 0) continue;
      const apply = Math.min(remaining, due);
      if (apply > 0) {
        result.push({ bill_number: bill.bill_number, amount: apply });
        remaining -= apply;
      }
    }

    return result;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && parseFloat(value) > 0) {
      setAllocations(computeAllocations(parseFloat(value)));
    } else {
      setAllocations([]);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    setIsSubmitting(true);

    try {
      const billIds = allocations.map((a) => {
        // Find the bill ID from bill number
        const bill = bills.find((b) => b.bill_number === a.bill_number);
        return bill?.id;
      }).filter(Boolean);

      // Call Edge Function to create payment request (not record yet)
      const { data, error } = await supabase.functions.invoke(
        "create-payment-request",
        {
          body: {
            customerId,
            amount: paymentAmount,
            billIds,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Payment Request Sent",
        description: `Payment request of ₹${paymentAmount.toLocaleString()} created. Complete the transfer using details below.`,
      });

      // Don't close yet - let customer see payment details
      setAmount("");
      setAllocations([]);
    } catch (error: any) {
      console.error("Error creating payment request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const totalOutstanding = bills.reduce(
    (sum, bill) => sum + Number(bill.balance_due),
    0
  );

  const paymentAmount = amount ? parseFloat(amount) : 0;

  // Generate UPI link
  const upiLink =
    paymentAmount > 0
      ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
          payeeName
        )}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(
          "Bulk payment via app"
        )}`
      : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Bulk Payment
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No outstanding bills</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Outstanding Balance */}
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">
                Total Outstanding
              </p>
              <p className="font-display text-3xl font-bold text-red-600">
                ₹{totalOutstanding.toLocaleString()}
              </p>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Pay (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                Max: ₹{totalOutstanding.toLocaleString()}
              </p>
            </div>

            {/* Allocation Preview */}
            {allocations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-600 mb-3">
                  Payment Allocation (Oldest Bills First)
                </p>
                <div className="space-y-2">
                  {allocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-foreground font-medium">
                        {alloc.bill_number}
                      </span>
                      <span className="text-foreground">
                        ₹{alloc.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code Placeholder */}
            {paymentAmount > 0 && (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Scan QR to Pay
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan the QR code using any UPI app (PhonePe, Google Pay,
                    Paytm, etc.)
                  </p>
                </div>

                {/* UPI ID */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        UPI ID
                      </p>
                      <p className="font-medium text-foreground">{upiId}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(upiId, "UPI ID")}
                    >
                      {copied === "UPI ID" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Pay with UPI App Button */}
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => {
                    // Record payment first
                    handlePaymentSubmit();
                    // Then try to open UPI on mobile
                    if (upiLink && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
                      setTimeout(() => {
                        window.location.href = upiLink;
                      }, 1000);
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Pay ₹{paymentAmount.toLocaleString()} with UPI
                    </>
                  )}
                </Button>

                {/* Bank Details */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Or Transfer via Bank
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium text-foreground">
                        HDFC Bank
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Account Name:
                      </span>
                      <span className="font-medium text-foreground">
                        Jay Shree Traders
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Account No:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          50200101611788
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            copyToClipboard("50200101611788", "Account Number")
                          }
                        >
                          {copied === "Account Number" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">IFSC:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          HDFC0005222
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            copyToClipboard("HDFC0005222", "IFSC Code")
                          }
                        >
                          {copied === "IFSC Code" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-medium text-foreground">
                        Rambagh, Indore-452002
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <p className="text-xs text-muted-foreground text-center">
                  Click the UPI button to open your payment app. Payment will be recorded automatically.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerBulkPaymentModal;
