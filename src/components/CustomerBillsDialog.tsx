import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ArrowLeft, IndianRupee, Calendar as CalendarIcon, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  created_at: string;
  due_date: string | null;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  notes: string | null;
  transaction_id: string | null;
}

interface CustomerBillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerUserId: string;
  customerName: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "rtgs", label: "RTGS" },
  { value: "neft", label: "NEFT" },
];

const CustomerBillsDialog = ({ isOpen, onClose, customerUserId, customerName }: CustomerBillsDialogProps) => {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billPayments, setBillPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  // Payment form state
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [isBulkPaymentMode, setIsBulkPaymentMode] = useState(false);
  const [selectedBillsForPayment, setSelectedBillsForPayment] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && customerUserId) {
      fetchBills();
    }
  }, [isOpen, customerUserId]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("customer_id", customerUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
    setIsLoading(false);
  };

  const fetchBillPayments = async (billId: string) => {
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("bill_id", billId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBillPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
    setIsLoadingPayments(false);
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
    fetchBillPayments(bill.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-500">Partial</Badge>;
      default:
        return <Badge className="bg-red-500">Unpaid</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const found = PAYMENT_METHODS.find(m => m.value === method);
    return found?.label || method;
  };

  // Calculate interest for overdue bills (100 days interest-free, 1% per week after)
  const calculateInterest = (bill: Bill) => {
    if (bill.status === "paid" || bill.balance_due <= 0) return null;
    
    const billDate = new Date(bill.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysOver = daysDiff - 100;
    
    if (daysOver <= 0) {
      return {
        isOverdue: false,
        daysRemaining: 100 - daysDiff,
        interest: 0,
        weeksOver: 0
      };
    }
    
    const weeksOver = Math.ceil(daysOver / 7);
    const interestRate = weeksOver * 0.01;
    const interest = bill.balance_due * interestRate;
    
    return {
      isOverdue: true,
      daysOver,
      weeksOver,
      interest,
      interestRate: weeksOver
    };
  };

  // Single bill payment
  const handleRecordPayment = async () => {
    if (!selectedBill) return;
    
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Insert payment
      const { error: paymentError } = await supabase.from("payments").insert({
        bill_id: selectedBill.id,
        customer_id: customerUserId,
        amount: amount,
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        notes: paymentNotes || null,
        created_at: paymentDate.toISOString(),
      });

      if (paymentError) throw paymentError;

      // Update bill
      const newBalance = Math.max(0, Number(selectedBill.balance_due) - amount);
      const newPaid = Number(selectedBill.paid_amount) + amount;
      const newStatus = newBalance <= 0 ? "paid" : "partial";

      const { error: billError } = await supabase
        .from("bills")
        .update({
          paid_amount: newPaid,
          balance_due: newBalance,
          status: newStatus,
        })
        .eq("id", selectedBill.id);

      if (billError) throw billError;

      toast({
        title: "Payment Recorded",
        description: `₹${amount.toLocaleString()} payment recorded successfully.`,
      });

      // Refresh
      resetPaymentForm();
      setSelectedBill({ ...selectedBill, paid_amount: newPaid, balance_due: newBalance, status: newStatus });
      fetchBillPayments(selectedBill.id);
      fetchBills();
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record payment.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Bulk payment across multiple bills
  const handleBulkPayment = async () => {
    if (selectedBillsForPayment.length === 0) {
      toast({
        title: "Select Bills",
        description: "Please select at least one bill to apply payment.",
        variant: "destructive",
      });
      return;
    }

    let remainingAmount = parseFloat(paymentAmount);
    if (!remainingAmount || remainingAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get selected bills sorted by oldest first (FIFO)
      const selectedBillsData = bills
        .filter(b => selectedBillsForPayment.includes(b.id) && b.balance_due > 0)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (const bill of selectedBillsData) {
        if (remainingAmount <= 0) break;

        const amountToApply = Math.min(remainingAmount, Number(bill.balance_due));
        
        // Insert payment
        const { error: paymentError } = await supabase.from("payments").insert({
          bill_id: bill.id,
          customer_id: customerUserId,
          amount: amountToApply,
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          notes: paymentNotes ? `Bulk Payment: ${paymentNotes}` : "Bulk Payment",
          created_at: paymentDate.toISOString(),
        });

        if (paymentError) throw paymentError;

        // Update bill
        const newBalance = Math.max(0, Number(bill.balance_due) - amountToApply);
        const newPaid = Number(bill.paid_amount) + amountToApply;
        const newStatus = newBalance <= 0 ? "paid" : "partial";

        const { error: billError } = await supabase
          .from("bills")
          .update({
            paid_amount: newPaid,
            balance_due: newBalance,
            status: newStatus,
          })
          .eq("id", bill.id);

        if (billError) throw billError;

        remainingAmount -= amountToApply;
      }

      const appliedAmount = parseFloat(paymentAmount) - remainingAmount;
      toast({
        title: "Bulk Payment Recorded",
        description: `₹${appliedAmount.toLocaleString()} distributed across ${selectedBillsData.length} bills.`,
      });

      resetPaymentForm();
      setIsBulkPaymentMode(false);
      fetchBills();
    } catch (error: any) {
      console.error("Error recording bulk payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record bulk payment.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentDate(new Date());
    setTransactionId("");
    setPaymentNotes("");
    setIsPaymentMode(false);
    setSelectedBillsForPayment([]);
  };

  const handleClose = () => {
    setSelectedBill(null);
    setBillPayments([]);
    resetPaymentForm();
    setIsBulkPaymentMode(false);
    onClose();
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBillsForPayment(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const unpaidBills = bills.filter(b => b.balance_due > 0);
  const totalSelectedBalance = unpaidBills
    .filter(b => selectedBillsForPayment.includes(b.id))
    .reduce((sum, b) => sum + Number(b.balance_due), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedBill ? (
              <>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedBill(null); setIsPaymentMode(false); }} className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {isPaymentMode ? "Record Payment" : `Bill: ${selectedBill.bill_number}`}
              </>
            ) : isBulkPaymentMode ? (
              <>
                <Button variant="ghost" size="icon" onClick={() => { setIsBulkPaymentMode(false); resetPaymentForm(); }} className="h-8 w-8">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                Bulk Payment
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Bills for {customerName}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isBulkPaymentMode ? (
          // Bulk Payment Mode
          <div className="space-y-6">
            <DialogDescription>
              Select bills to apply payment (oldest bills will be paid first)
            </DialogDescription>
            
            {/* Bill Selection */}
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {unpaidBills.map((bill) => (
                <div key={bill.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
                  <Checkbox
                    checked={selectedBillsForPayment.includes(bill.id)}
                    onCheckedChange={() => toggleBillSelection(bill.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{bill.bill_number}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(bill.created_at), "dd MMM yyyy")}</p>
                  </div>
                  <p className="font-semibold text-red-600">₹{Number(bill.balance_due).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {selectedBillsForPayment.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Selected Balance</p>
                <p className="text-xl font-bold text-red-600">₹{totalSelectedBalance.toLocaleString()}</p>
              </div>
            )}

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Amount (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-9"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(paymentDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={paymentDate} onSelect={(d) => d && setPaymentDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {paymentMethod !== "cash" && (
                <div className="space-y-2">
                  <Label>Transaction ID / Reference</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter reference" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Add notes" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsBulkPaymentMode(false); resetPaymentForm(); }}>Cancel</Button>
              <Button onClick={handleBulkPayment} disabled={isSaving || selectedBillsForPayment.length === 0}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Apply Payment
              </Button>
            </DialogFooter>
          </div>
        ) : selectedBill ? (
          isPaymentMode ? (
            // Single Bill Payment Form
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Balance Due for {selectedBill.bill_number}</p>
                <p className="text-2xl font-bold text-red-600">₹{Number(selectedBill.balance_due).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Amount (₹) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      max={selectedBill.balance_due}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-9"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(paymentDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={paymentDate} onSelect={(d) => d && setPaymentDate(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {paymentMethod !== "cash" && (
                  <div className="space-y-2">
                    <Label>Transaction ID / Reference</Label>
                    <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter cheque number or transaction ID" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Add any notes" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentMode(false)}>Cancel</Button>
                <Button onClick={handleRecordPayment} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Bill Details View
            <div className="space-y-6">
              {/* Bill Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBill.status)}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">₹{Number(selectedBill.total_amount).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-semibold text-lg text-green-600">₹{Number(selectedBill.paid_amount).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="font-semibold text-lg text-red-600">₹{Number(selectedBill.balance_due).toLocaleString()}</p>
                </div>
              </div>

              {/* Record Payment Button */}
              {selectedBill.balance_due > 0 && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsPaymentMode(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment for this Bill
                </Button>
              )}

              {/* Interest Warning */}
              {(() => {
                const interestInfo = calculateInterest(selectedBill);
                if (!interestInfo) return null;
                
                return (
                  <div className={`p-4 rounded-lg border ${interestInfo.isOverdue ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'}`}>
                    {interestInfo.isOverdue ? (
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-400">
                            ⚠️ Interest-Free Period Exceeded by {interestInfo.daysOver} Days
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {interestInfo.weeksOver} weeks overdue × 1% = {interestInfo.interestRate}% interest rate
                          </p>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mt-2">
                            Interest Charged: ₹{interestInfo.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            New Total Due: ₹{(Number(selectedBill.balance_due) + interestInfo.interest).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            ✅ Interest-Free Period Active
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {interestInfo.daysRemaining} days remaining before interest applies
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill Number</p>
                  <p className="font-medium">{selectedBill.bill_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created Date</p>
                  <p className="font-medium">{format(new Date(selectedBill.created_at), "dd MMM yyyy, hh:mm a")}</p>
                </div>
                {selectedBill.due_date && (
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(new Date(selectedBill.due_date), "dd MMM yyyy")}</p>
                  </div>
                )}
                {selectedBill.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedBill.notes}</p>
                  </div>
                )}
              </div>

              {/* Amounts Breakdown */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(selectedBill.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{Number(selectedBill.tax_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>₹{Number(selectedBill.total_amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-semibold mb-3">Payment History</h4>
                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : billPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₹{Number(payment.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.transaction_id || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )
        ) : (
          // Bills List View
          <>
            {/* Bulk Payment Button */}
            {unpaidBills.length > 0 && (
              <div className="mb-4">
                <Button variant="outline" className="w-full" onClick={() => setIsBulkPaymentMode(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bulk Payment ({unpaidBills.length} unpaid bills)
                </Button>
              </div>
            )}
            
            {bills.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bills found for this customer</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Interest Status</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => {
                    const interestInfo = calculateInterest(bill);
                    return (
                      <TableRow 
                        key={bill.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleBillClick(bill)}
                      >
                        <TableCell className="font-medium text-primary">
                          {bill.bill_number}
                        </TableCell>
                        <TableCell>{format(new Date(bill.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>₹{Number(bill.total_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">
                          ₹{Number(bill.paid_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ₹{Number(bill.balance_due).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {interestInfo ? (
                            interestInfo.isOverdue ? (
                              <span className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                +{interestInfo.daysOver}d / ₹{interestInfo.interest.toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-xs text-green-600">
                                {interestInfo.daysRemaining}d left
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerBillsDialog;
