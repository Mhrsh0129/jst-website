import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode, Smartphone, Building2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Bill {
  id: string;
  bill_number: string;
  balance_due: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
}

const PaymentModal = ({ isOpen, onClose, bill }: PaymentModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  // UPI Details
  const upiId = "8319621211@ybl"; // You can update this
  const payeeName = "Jay Shree Traders";
  const amount = Number(bill.balance_due);

  // Generate UPI payment link
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    `Payment for ${bill.bill_number}`
  )}`;

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Pay for {bill.bill_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount */}
          <div className="text-center p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <p className="font-display text-3xl font-bold text-primary">
              ₹{amount.toLocaleString()}
            </p>
          </div>

          {/* QR Code Placeholder */}
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
              Scan the QR code using any UPI app (PhonePe, Google Pay, Paytm, etc.)
            </p>
          </div>

          {/* UPI ID */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
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
          <a href={upiLink} className="block">
            <Button variant="gold" size="lg" className="w-full">
              <Smartphone className="w-5 h-5" />
              Pay with UPI App
            </Button>
          </a>

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
                <span className="font-medium text-foreground">HDFC Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="font-medium text-foreground">Jay Shree Traders</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account No:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">50200101611788</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard("50200101611788", "Account Number")}
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
                  <span className="font-medium text-foreground">HDFC0005222</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard("HDFC0005222", "IFSC Code")}
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
                <span className="font-medium text-foreground">Rambagh, Indore-452002</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            After payment, please share the transaction ID or screenshot via WhatsApp
            for confirmation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
