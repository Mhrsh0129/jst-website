import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface PaymentRequest {
  id: string;
  customer_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bills_allocated: string[];
  created_at: string;
  approved_at?: string;
}

interface Customer {
  email: string;
  user_metadata?: {
    full_name?: string;
    business_name?: string;
  };
}

export default function PendingPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);



  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all payment requests - cast as any since table was just created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        throw error;
      }

      setPayments(data || []);

      // Fetch customer profiles for each unique customer_id
      const customerIds = [...new Set((data || []).map((p: PaymentRequest) => p.customer_id))];

      if (customerIds.length === 0) return;

      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, business_name")
        .in("user_id", customerIds as string[]);

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return;
      }

      if (profilesData) {
        const customerMap: Record<string, Customer> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profilesData.forEach((profile: any) => {
          customerMap[profile.user_id] = {
            email: profile.email || "Unknown",
            user_metadata: {
              full_name: profile.full_name,
              business_name: profile.business_name,
            },
          };
        });
        setCustomers(customerMap);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load payment requests. Check RLS policies.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (paymentId: string) => {
    setApproving(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke(
        "approve-payment-request",
        {
          body: {
            paymentRequestId: paymentId,
            action: "approve",
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Payment Approved",
        description: data?.message || "Payment has been recorded successfully",
      });

      // Refresh payments list
      fetchPayments();
    } catch (error: unknown) {
      console.error("Error approving payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setApproving(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke(
        "approve-payment-request",
        {
          body: {
            paymentRequestId: paymentId,
            action: "reject",
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "Payment request has been rejected",
      });

      // Refresh payments list
      fetchPayments();
    } catch (error: unknown) {
      console.error("Error rejecting payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const approvedPayments = payments.filter((p) => p.status === "approved");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Payment Approvals
          </h1>
          <p className="text-slate-600">
            Review and approve pending customer payments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">
                {pendingPayments.length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {approvedPayments.length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-600">
                {rejectedPayments.length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : pendingPayments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              No pending payments
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingPayments.map((payment) => {
              const customer = customers[payment.customer_id];
              return (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {customer?.user_metadata?.business_name ||
                            customer?.user_metadata?.full_name ||
                            customer?.email ||
                            "Unknown Customer"}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          {customer?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₹{payment.amount.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Bills Allocated */}
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Bills Allocated ({payment.bills_allocated.length}):
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                          {payment.bills_allocated.length > 0
                            ? payment.bills_allocated.join(", ")
                            : "No bills allocated"}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(payment.id)}
                          disabled={approving === payment.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {approving === payment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Payment
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(payment.id)}
                          disabled={approving === payment.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          {approving === payment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Approved Payments Section */}
        {approvedPayments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Approved Payments
            </h2>
            <div className="space-y-3">
              {approvedPayments.map((payment) => {
                const customer = customers[payment.customer_id];
                return (
                  <Card key={payment.id} className="opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-700">
                            {customer?.user_metadata?.business_name ||
                              customer?.email}
                          </p>
                          <p className="text-sm text-slate-500">
                            Approved on{" "}
                            {new Date(payment.approved_at || "").toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            ₹{payment.amount.toLocaleString()}
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
