import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OrderItem {
  product_name: string;
  quantity_meters: number;
  price_per_meter: number;
  total_price: number;
}

interface BillData {
  bill_number: string;
  created_at: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  notes: string | null;
}

interface CustomerData {
  full_name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
}

interface OrderData {
  order_number: string;
  created_at: string;
}

export const generateInvoicePDF = (
  bill: BillData,
  customer: CustomerData,
  order: OrderData | null,
  orderItems: OrderItem[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 90, 43); // Gold/brown color
  doc.text("Jay Shree Traders", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Premium Pocketing & Lining Fabrics", pageWidth / 2, 32, {
    align: "center",
  });
  doc.text("Burhanpur, Madhya Pradesh, India", pageWidth / 2, 38, {
    align: "center",
  });

  // Invoice Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("TAX INVOICE", pageWidth / 2, 52, { align: "center" });

  // Invoice Details Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, 58, 85, 35, 2, 2, "FD");
  doc.roundedRect(105, 58, 90, 35, 2, 2, "FD");

  // Left Box - Invoice Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Invoice Number:", 18, 67);
  doc.text("Invoice Date:", 18, 75);
  doc.text("Due Date:", 18, 83);
  if (order) {
    doc.text("Order Number:", 18, 91);
  }

  doc.setFont("helvetica", "normal");
  doc.text(bill.bill_number, 55, 67);
  doc.text(new Date(bill.created_at).toLocaleDateString("en-IN"), 55, 75);
  doc.text(
    bill.due_date
      ? new Date(bill.due_date).toLocaleDateString("en-IN")
      : "N/A",
    55,
    83
  );
  if (order) {
    doc.text(order.order_number, 55, 91);
  }

  // Right Box - Bill To
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 110, 67);
  doc.setFont("helvetica", "normal");
  doc.text(customer.full_name, 110, 75);
  if (customer.business_name) {
    doc.text(customer.business_name, 110, 81);
  }
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 110, 87);
  }
  if (customer.gst_number) {
    doc.text(`GST: ${customer.gst_number}`, 110, 93);
  }

  // Items Table
  const tableStartY = 100;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Product", "Qty (m)", "Rate (₹/m)", "Amount (₹)"]],
    body: orderItems.map((item, index) => [
      (index + 1).toString(),
      item.product_name,
      item.quantity_meters.toFixed(2),
      `₹${item.price_per_meter.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [139, 90, 43],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary Box
  const summaryX = pageWidth - 90;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(summaryX - 5, finalY, 80, 50, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", summaryX, finalY + 10);
  doc.text(`₹${bill.subtotal.toFixed(2)}`, summaryX + 70, finalY + 10, {
    align: "right",
  });

  doc.text("Tax (GST):", summaryX, finalY + 18);
  doc.text(`₹${bill.tax_amount.toFixed(2)}`, summaryX + 70, finalY + 18, {
    align: "right",
  });

  doc.setDrawColor(150, 150, 150);
  doc.line(summaryX, finalY + 23, summaryX + 70, finalY + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total:", summaryX, finalY + 32);
  doc.text(`₹${bill.total_amount.toFixed(2)}`, summaryX + 70, finalY + 32, {
    align: "right",
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34, 139, 34);
  doc.text("Paid:", summaryX, finalY + 40);
  doc.text(`₹${bill.paid_amount.toFixed(2)}`, summaryX + 70, finalY + 40, {
    align: "right",
  });

  if (bill.balance_due > 0) {
    doc.setTextColor(220, 53, 69);
    doc.setFont("helvetica", "bold");
    doc.text("Balance Due:", summaryX, finalY + 48);
    doc.text(`₹${bill.balance_due.toFixed(2)}`, summaryX + 70, finalY + 48, {
      align: "right",
    });
  }

  // Payment Status Badge
  const statusY = finalY + 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  if (bill.status === "paid") {
    doc.setTextColor(34, 139, 34);
    doc.text("✓ PAID", pageWidth / 2, statusY, { align: "center" });
  } else if (bill.status === "partial") {
    doc.setTextColor(255, 165, 0);
    doc.text("◐ PARTIALLY PAID", pageWidth / 2, statusY, { align: "center" });
  } else {
    doc.setTextColor(220, 53, 69);
    doc.text("⊘ UNPAID", pageWidth / 2, statusY, { align: "center" });
  }

  // Bank Details Section
  const bankY = statusY + 15;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(14, bankY, pageWidth - 28, 35, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Bank Details for Payment:", 20, bankY + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Bank: State Bank of India", 20, bankY + 18);
  doc.text("Account Name: Jay Shree Traders", 20, bankY + 25);
  doc.text("Account No: 1234567890123", 100, bankY + 18);
  doc.text("IFSC: SBIN0012345", 100, bankY + 25);
  doc.text("UPI: 8319621211@ybl", 20, bankY + 32);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Thank you for your business! For queries, contact us at support@jayshreetraders.com",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    pageWidth / 2,
    footerY + 6,
    { align: "center" }
  );

  // Save PDF
  doc.save(`Invoice_${bill.bill_number}.pdf`);
};
