import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, IndianRupee, FileText, Plus, Trash2 } from "lucide-react";

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface AddBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerUserId: string;
  customerName: string;
  onBillAdded: () => void;
}

const AddBillDialog = ({
  isOpen,
  onClose,
  customerId,
  customerUserId,
  customerName,
  onBillAdded,
}: AddBillDialogProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Bill items
  const [items, setItems] = useState<BillItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 },
  ]);
  
  // Tax and notes
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"none" | "full" | "partial">("none");
  const [paidAmount, setPaidAmount] = useState("");

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (parseFloat(taxPercentage) || 0) / 100;
  const totalAmount = subtotal + taxAmount;
  const actualPaidAmount = paymentMethod === "full" 
    ? totalAmount 
    : paymentMethod === "partial" 
    ? parseFloat(paidAmount) || 0 
    : 0;
  const balanceDue = totalAmount - actualPaidAmount;

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            updated.amount = Number(updated.quantity) * Number(updated.rate);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const resetForm = () => {
    setItems([{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 }]);
    setTaxPercentage("0");
    setNotes("");
    setDueDate("");
    setPaymentMethod("none");
    setPaidAmount("");
  };

  const handleSubmit = async () => {
    // Validate items
    const validItems = items.filter(
      (item) => item.description.trim() && item.amount > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with description and amount.",
        variant: "destructive",
      });
      return;
    }

    if (totalAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Total amount must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create the bill
      const billStatus = balanceDue <= 0 ? "paid" : actualPaidAmount > 0 ? "partial" : "unpaid";
      
      // Generate bill number
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const billNumber = `INV-${dateStr}-${randomNum}`;

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([{
          bill_number: billNumber,
          customer_id: customerUserId,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: actualPaidAmount,
          balance_due: Math.max(0, balanceDue),
          status: billStatus,
          due_date: dueDate || null,
          notes: notes.trim() || null,
        }])
        .select()
        .single();

      if (billError) throw billError;

      // If there's a payment, record it
      if (actualPaidAmount > 0 && billData) {
        const { error: paymentError } = await supabase.from("payments").insert({
          bill_id: billData.id,
          customer_id: customerUserId,
          amount: actualPaidAmount,
          payment_method: "cash",
          notes: "Initial payment at bill creation",
        });

        if (paymentError) {
          console.error("Payment recording error:", paymentError);
          // Don't throw - bill was created successfully
        }
      }

      toast({
        title: "Bill Created",
        description: `Bill ${billData.bill_number} created for ${customerName}. Amount: ₹${totalAmount.toLocaleString()}`,
      });

      resetForm();
      onBillAdded();
      onClose();
    } catch (error: any) {
      console.error("Error creating bill:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bill.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Add Bill for {customerName}
          </DialogTitle>
          <DialogDescription>
            Create a new bill for an offline purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bill Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg"
                >
                  <div className="col-span-5">
                    <Label className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      placeholder="Product/Service"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Qty (m)</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <div className="mt-1 h-9 px-3 py-2 bg-muted rounded-md text-sm font-medium">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax and Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax Percentage (%)</Label>
              <Select value={taxPercentage} onValueChange={setTaxPercentage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="0">No Tax (0%)</SelectItem>
                  <SelectItem value="5">GST 5%</SelectItem>
                  <SelectItem value="12">GST 12%</SelectItem>
                  <SelectItem value="18">GST 18%</SelectItem>
                  <SelectItem value="28">GST 28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({taxPercentage}%)
              </span>
              <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Received</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="none">No Payment (Credit)</SelectItem>
                <SelectItem value="full">Full Payment Received</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
              </SelectContent>
            </Select>

            {paymentMethod === "partial" && (
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter paid amount"
                  className="pl-9"
                  max={totalAmount}
                />
              </div>
            )}

            {totalAmount > 0 && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Balance Due</span>
                <span className={`text-lg font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₹{Math.max(0, balanceDue).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this purchase..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || totalAmount <= 0}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Create Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillDialog;
