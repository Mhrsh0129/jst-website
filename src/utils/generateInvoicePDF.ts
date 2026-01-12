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

// Helper function to format currency properly
const formatCurrency = (amount: number): string => {
  return "Rs. " + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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
  doc.setTextColor(34, 139, 34); // Green color
  doc.text("Jay Shree Traders", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Premium Pocketing & Lining Fabrics", pageWidth / 2, 32, {
    align: "center",
  });
  doc.text("GST: 23IOYPD7178E1ZG", pageWidth / 2, 38, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.text("Ground Floor Shree Nath Palace, 54 - Shiv Vilas Place, Subhash Chowk", pageWidth / 2, 44, {
    align: "center",
  });
  doc.text("Power House Gali, Opp. Bohra Masjid, Rajwada, Indore, M.P.", pageWidth / 2, 49, {
    align: "center",
  });

  // Invoice Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("TAX INVOICE", pageWidth / 2, 58, { align: "center" });

  // Invoice Details Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, 64, 88, 40, 2, 2, "FD");
  doc.roundedRect(106, 64, 90, 40, 2, 2, "FD");

  // Left Box - Invoice Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Invoice Number:", 18, 74);
  doc.text("Invoice Date:", 18, 82);
  doc.text("Due Date:", 18, 90);
  if (order) {
    doc.text("Order Number:", 18, 98);
  }

  doc.setFont("helvetica", "normal");
  doc.text(bill.bill_number, 58, 74);
  doc.text(new Date(bill.created_at).toLocaleDateString("en-IN"), 58, 82);
  doc.text(
    bill.due_date
      ? new Date(bill.due_date).toLocaleDateString("en-IN")
      : "N/A",
    58,
    90
  );
  if (order) {
    doc.text(order.order_number, 58, 98);
  }

  // Right Box - Bill To (Customer Details)
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 110, 74);
  doc.setFont("helvetica", "normal");
  
  let customerY = 80;
  doc.text(customer.full_name, 110, customerY);
  customerY += 5;
  
  if (customer.business_name) {
    doc.setFontSize(8);
    doc.text(customer.business_name, 110, customerY);
    customerY += 5;
  }
  if (customer.phone) {
    doc.setFontSize(8);
    doc.text("Ph: " + customer.phone, 110, customerY);
    customerY += 5;
  }
  if (customer.email) {
    doc.setFontSize(8);
    doc.text(customer.email, 110, customerY);
    customerY += 5;
  }
  if (customer.gst_number) {
    doc.setFontSize(8);
    doc.text("GST: " + customer.gst_number, 110, customerY);
    customerY += 5;
  }
  if (customer.address) {
    doc.setFontSize(7);
    const addressLines = doc.splitTextToSize(customer.address, 80);
    doc.text(addressLines.slice(0, 2), 110, customerY);
  }

  // Items Table
  const tableStartY = 110;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Product", "Qty (m)", "Rate/m", "Amount"]],
    body: orderItems.map((item, index) => [
      (index + 1).toString(),
      item.product_name,
      item.quantity_meters.toFixed(2),
      item.price_per_meter.toFixed(2),
      item.total_price.toFixed(2),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [34, 139, 34],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 75, halign: "left" },
      2: { cellWidth: 28, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    tableWidth: "auto",
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary Box - properly aligned
  const summaryBoxWidth = 85;
  const summaryX = pageWidth - summaryBoxWidth - 14;
  const labelX = summaryX + 5;
  const valueX = summaryX + summaryBoxWidth - 5;
  
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, 45, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  
  doc.text("Subtotal:", labelX, finalY + 10);
  doc.text(formatCurrency(bill.subtotal), valueX, finalY + 10, { align: "right" });

  doc.text("Tax (GST 5%):", labelX, finalY + 18);
  doc.text(formatCurrency(bill.tax_amount), valueX, finalY + 18, { align: "right" });

  doc.setDrawColor(150, 150, 150);
  doc.line(labelX, finalY + 23, valueX, finalY + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Total:", labelX, finalY + 32);
  doc.text(formatCurrency(bill.total_amount), valueX, finalY + 32, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34, 139, 34);
  doc.text("Paid:", labelX, finalY + 40);
  doc.text(formatCurrency(bill.paid_amount), valueX, finalY + 40, { align: "right" });

  // Balance due row only if there's a balance
  let summaryEndY = finalY + 45;
  if (bill.balance_due > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 245, 245);
    doc.roundedRect(summaryX, finalY + 47, summaryBoxWidth, 12, 2, 2, "FD");
    
    doc.setTextColor(220, 53, 69);
    doc.setFont("helvetica", "bold");
    doc.text("Balance Due:", labelX, finalY + 55);
    doc.text(formatCurrency(bill.balance_due), valueX, finalY + 55, { align: "right" });
    summaryEndY = finalY + 62;
  }

  // Bank Details Section
  const bankY = summaryEndY + 10;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(14, bankY, pageWidth - 28, 35, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Bank Details for Payment:", 20, bankY + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Bank: HDFC Bank", 20, bankY + 18);
  doc.text("Account Name: Jay Shree Traders", 20, bankY + 25);
  doc.text("Account No: 50200101611788", 100, bankY + 18);
  doc.text("IFSC: HDFC0005222", 100, bankY + 25);

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
