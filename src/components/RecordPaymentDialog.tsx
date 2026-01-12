import { useState, useEffect, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, IndianRupee, CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Bill {
  id: string;
  bill_number: string;
  balance_due: number;
  status: string;
}

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onPaymentRecorded: () => void;
  canUpdateBills?: boolean;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "rtgs", label: "RTGS" },
  { value: "neft", label: "NEFT" },
];

const RecordPaymentDialog = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  onPaymentRecorded,
  canUpdateBills = true,
}: RecordPaymentDialogProps) => {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Payment mode: "single" or "bulk"
  const [paymentMode, setPaymentMode] = useState<"single" | "bulk">("single");

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBillId, setSelectedBillId] = useState<string>("");

  const fetchUnpaidBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("id, bill_number, balance_due, status")
        .eq("customer_id", customerId)
        .gt("balance_due", 0)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBills(data || []);

      // Auto-select first bill if available
      if (data && data.length > 0) {
        setSelectedBillId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
    setIsLoading(false);
  }, [customerId]);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchUnpaidBills();
    }
  }, [isOpen, customerId, fetchUnpaidBills]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMode === "single" && !selectedBillId) {
      toast({
        title: "Select Bill",
        description: "Please select a bill to apply this payment to.",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(amount);

    setIsSaving(true);
    try {
      if (paymentMode === "single") {
        // Single bill payment
        const selectedBill = bills.find(b => b.id === selectedBillId);
        if (!selectedBill) return;

        if (!canUpdateBills) {
          try {
            const { data, error } = await supabase.functions.invoke("record-customer-payment", {
              body: {
                mode: "single",
                amount: paymentAmount,
                bill_id: selectedBillId,
                payment_method: paymentMethod,
                transaction_id: transactionId || null,
                notes: notes || null,
                payment_date: paymentDate.toISOString(),
              },
            });
            if (error) throw error;

            toast({
              title: "Payment Recorded",
              description: `₹${paymentAmount.toLocaleString()} received and applied.`,
            });
          } catch (e: unknown) {
            // Fallback: record payment only; balances will update later
            const { error: paymentError } = await supabase.from("payments").insert({
              bill_id: selectedBillId,
              customer_id: customerId,
              amount: paymentAmount,
              payment_method: paymentMethod,
              transaction_id: transactionId || null,
              notes: notes || null,
              created_at: paymentDate.toISOString(),
            });
            if (paymentError) throw paymentError;

            toast({
              title: "Payment Received",
              description: `₹${paymentAmount.toLocaleString()} received. Balances will update after verification.`,
            });
          }
        } else {
          const { error: paymentError } = await supabase.from("payments").insert({
            bill_id: selectedBillId,
            customer_id: customerId,
            amount: paymentAmount,
            payment_method: paymentMethod,
            transaction_id: transactionId || null,
            notes: notes || null,
            created_at: paymentDate.toISOString(),
          });

          if (paymentError) throw paymentError;

          const newBalance = Math.max(0, Number(selectedBill.balance_due) - paymentAmount);
          const newStatus = newBalance <= 0 ? "paid" : "partial";

          const { data: currentBill, error: fetchError } = await supabase
            .from("bills")
            .select("paid_amount")
            .eq("id", selectedBillId)
            .single();

          if (fetchError) throw fetchError;

          const { error: billError } = await supabase
            .from("bills")
            .update({
              paid_amount: Number(currentBill.paid_amount) + paymentAmount,
              balance_due: newBalance,
              status: newStatus,
            })
            .eq("id", selectedBillId);

          if (billError) throw billError;

          toast({
            title: "Payment Recorded",
            description: `₹${paymentAmount.toLocaleString()} payment recorded for ${customerName}.`,
          });
        }
      } else {
        // Bulk payment - allocate across multiple bills
        if (!canUpdateBills) {
          try {
            const { data, error } = await supabase.functions.invoke("record-customer-payment", {
              body: {
                mode: "bulk",
                amount: paymentAmount,
                payment_method: paymentMethod,
                transaction_id: transactionId || null,
                notes: notes || null,
                payment_date: paymentDate.toISOString(),
              },
            });
            if (error) throw error;

            toast({
              title: "Bulk Payment Recorded",
              description: `₹${paymentAmount.toLocaleString()} allocated across ${data?.allocated_count ?? 0} bill(s).`,
            });
          } catch (e: unknown) {
            // Fallback: record a single generic payment (cannot allocate client-side without bill IDs)
            const firstBill = bills[0];
            if (firstBill) {
              const { error: paymentError } = await supabase.from("payments").insert({
                bill_id: firstBill.id,
                customer_id: customerId,
                amount: paymentAmount,
                payment_method: paymentMethod,
                transaction_id: transactionId || null,
                notes: `Bulk payment: ${notes || ""}`,
                created_at: paymentDate.toISOString(),
              });
              if (paymentError) throw paymentError;

              toast({
                title: "Payment Received",
                description: `₹${paymentAmount.toLocaleString()} received. Allocation will be applied after verification.`,
              });
            } else {
              throw e;
            }
          }
        } else {
          let remainingAmount = paymentAmount;
          let billsUpdated = 0;

          // Sort bills by created_at (oldest first)
          const sortedBills = [...bills].sort((a, b) => {
            const billA = bills.find(b => b.id === a.id);
            const billB = bills.find(b => b.id === b.id);
            return 0; // Already sorted from fetch
          });

          for (const bill of sortedBills) {
            if (remainingAmount <= 0) break;

            const billBalance = Number(bill.balance_due);
            const paymentForThisBill = Math.min(remainingAmount, billBalance);

            // Insert payment record
            const { error: paymentError } = await supabase.from("payments").insert({
              bill_id: bill.id,
              customer_id: customerId,
              amount: paymentForThisBill,
              payment_method: paymentMethod,
              transaction_id: transactionId || null,
              notes: `Bulk payment: ${notes || ""}`,
              created_at: paymentDate.toISOString(),
            });

            if (paymentError) throw paymentError;

            // Update bill
            const { data: currentBill, error: fetchError } = await supabase
              .from("bills")
              .select("paid_amount")
              .eq("id", bill.id)
              .single();

            if (fetchError) throw fetchError;

            const newPaidAmount = Number(currentBill.paid_amount) + paymentForThisBill;
            const newBalance = Math.max(0, billBalance - paymentForThisBill);
            const newStatus = newBalance <= 0 ? "paid" : "partial";

            const { error: billError } = await supabase
              .from("bills")
              .update({
                paid_amount: newPaidAmount,
                balance_due: newBalance,
                status: newStatus,
              })
              .eq("id", bill.id);

            if (billError) throw billError;

            remainingAmount -= paymentForThisBill;
            billsUpdated++;
          }

          toast({
            title: "Bulk Payment Recorded",
            description: `₹${paymentAmount.toLocaleString()} allocated across ${billsUpdated} bill(s) for ${customerName}.`,
          });
        }
      }

      // Reset form and close
      resetForm();
      onPaymentRecorded();
      onClose();
    } catch (error: unknown) {
      console.error("Error recording payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to record payment.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setAmount("");
    setPaymentMethod("cash");
    setPaymentDate(new Date());
    setTransactionId("");
    setNotes("");
    setSelectedBillId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalOutstanding = bills.reduce((sum, bill) => sum + Number(bill.balance_due), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment received from <strong>{customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No outstanding bills for this customer.</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Payment Mode Tabs */}
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setPaymentMode("single")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${paymentMode === "single"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Single Bill
              </button>
              <button
                onClick={() => setPaymentMode("bulk")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${paymentMode === "bulk"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Bulk Payment
              </button>
            </div>

            {/* Total Outstanding */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{totalOutstanding.toLocaleString()}
              </p>
            </div>

            {/* Select Bill - Only for Single Mode */}
            {paymentMode === "single" && (
              <div className="space-y-2">
                <Label htmlFor="bill">Apply to Bill *</Label>
                <Select value={selectedBillId} onValueChange={setSelectedBillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bill" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.bill_number} - ₹{Number(bill.balance_due).toLocaleString()} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bulk Payment Info */}
            {paymentMode === "bulk" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-600 font-medium">Bulk Payment Mode</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment will be automatically allocated to unpaid bills in order, starting from the oldest bills.
                </p>
              </div>
            )}

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹) *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  placeholder="Enter amount"
                />
              </div>
              {paymentMode === "single" && selectedBillId && (
                <p className="text-xs text-muted-foreground">
                  Bill balance: ₹{Number(bills.find(b => b.id === selectedBillId)?.balance_due || 0).toLocaleString()}
                </p>
              )}
              {paymentMode === "bulk" && (
                <p className="text-xs text-muted-foreground">
                  Total outstanding: ₹{totalOutstanding.toLocaleString()}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Transaction ID (for non-cash) */}
            {paymentMethod !== "cash" && (
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / Reference</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID or cheque number"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {bills.length > 0 && (
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;