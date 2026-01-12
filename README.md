# Jay Shree Traders Hub

A comprehensive business management system for managing customers, products, bills, orders, and payments with role-based access control (Admin, CA, Customer).

## 📋 Project Overview

Jay Shree Traders Hub is a modern web application designed to streamline business operations including:
- **Customer Management** - Create, view, edit customer profiles with outstanding balance tracking
- **Product Catalog** - Manage products with pricing, inventory, and stock alerts
- **Order Management** - Process and track customer orders with real-time updates
- **Billing System** - Generate bills and downloadable PDF invoices
- **Payment Processing** - Record payments, bulk payments, and payment approval workflow
- **Coupon Management** - Create and manage discount coupons for products
- **Analytics Dashboard** - Financial reports, P&L, cash flow, customer aging analysis
- **Payment Requests** - Customer bulk payment requests with admin approval system
- **Admin Dashboard** - Comprehensive overview of business metrics
- **Role-Based Access** - Admin, Chartered Accountant (CA), and Customer roles
- **Export Functionality** - Export data to CSV and Excel formats
- **Real-time Updates** - Live data synchronization across all pages

## 🛠 Technology Stack

**Frontend:**
- Vite 7.3.1 - Fast build tool and dev server
- React 18+ - UI framework
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Utility-first CSS framework
- shadcn/ui - High-quality React components
- Lucide React - Beautiful icon library
- Recharts - Data visualization and charts
- jsPDF - PDF generation for invoices
- XLSX - Excel export functionality
- React Router - Client-side routing

**Backend:**
- Supabase - PostgreSQL database, authentication, real-time features
- Edge Functions - Serverless backend functions (Deno runtime)
- PostgreSQL - Relational database with RLS (Row Level Security)
- Real-time subscriptions - Live data updates

**Development:**
- Node.js 20.12.2+
- npm - Package manager
- Vite + TypeScript - Type-safe development

## 📦 Installation

### Prerequisites
- Node.js 20.19+ or 22.12+ (currently using 20.12.2)
- npm 9+
- Git

### Setup Steps

```bash
# Clone the repository
git clone <repository-url>
cd jst_web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Configure Supabase credentials in .env.local
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🚀 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🗄️ Database Schema

### Tables
- `profiles` - User profile information
- `user_roles` - User role assignments
- `products` - Product catalog with inventory tracking (stock_quantity, minimum_stock_level, reorder_point)
- `orders` - Customer orders
- `order_items` - Individual items in orders with coupon support
- `bills` - Billing records
- `payments` - Payment records
- `payment_requests` - Customer payment requests awaiting approval
- `payment_reminders` - Payment reminder logs (admin-only)
- `sample_requests` - Sample request tracking
- `coupons` - Discount coupon codes for products
- `stock_history` - Inventory change tracking (planned)

### Views
- `low_stock_products` - Products at or below minimum stock level

### RLS Policies
- **Admin** - Full access to all tables, can approve payment requests
- **CA (Chartered Accountant)** - View bills, orders, payments (read-only access)
- **Customer** - Access to own orders, bills, payments, and payment requests

## 🔐 Security

- Row-Level Security (RLS) enforced on all tables
- JWT authentication disabled on create-customer function (development)
- Input validation on all Edge Functions
- CORS restricted to `http://localhost:8080`
- Environment variables protected in `.env.local`

See [SECURITY.md](SECURITY.md) for detailed security information.

## 📝 Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## 👥 User Roles

### Admin
- Create, view, edit, delete customers
- Manage products and inventory (stock levels, reorder points)
- Create and manage discount coupons
- Create and process orders
- Record payments (single and bulk)
- Approve/reject customer payment requests
- View all bills and download PDF invoices
- Access analytics dashboard (P&L, cash flow, aging reports)
- Export data to CSV/Excel
- Manage payment reminders
- View low stock alerts

### Chartered Accountant (CA)
- View bills and orders (read-only)
- View payment history
- Export bills and orders to CSV/Excel
- Cannot modify orders or payments
- Cannot create customers
- No access to analytics or payment approvals

### Customer
- View own orders and order history
- View own bills
- Download PDF invoices
- Submit bulk payment requests
- Track payment request status (pending/approved/rejected)
- Track payment history
- Request product samples
- Place orders with coupon codes

## 🧪 Testing

### Test Users

**Admin:**
- Email: admin@jst.com
- Phone: 9999999999 (password)

**CA:**
- Email: ca@jst.com
- Phone: 9999999999 (password)

**Customers:** Created via admin panel

## 📚 API Documentation

### Edge Functions

#### create-customer
Create a new customer account and auth user

```bash
POST /functions/v1/create-customer
```

#### create-ca-user
Create a Chartered Accountant user (Admin only)

```bash
POST /functions/v1/create-ca-user
```

#### create-payment-request
Customer creates a payment request for bulk payment

```bash
POST /functions/v1/create-payment-request
Body: { customerId, amount, billIds[] }
```

#### approve-payment-request
Admin approves or rejects a payment request

```bash
POST /functions/v1/approve-payment-request
Body: { paymentRequestId, action: "approve" | "reject" }
```

#### record-customer-payment
Records customer payment with bill allocation

```bash
POST /functions/v1/record-customer-payment
Body: { mode: "single" | "bulk", amount, bill_id?, payment_method, transaction_id?, notes? }
```

## ✨ Key Features

### For Admins
- **Analytics Dashboard**: P&L reports, cash flow analysis, customer aging buckets
- **Payment Approvals**: Review and approve customer payment requests
- **Inventory Management**: Track stock levels with low-stock alerts
- **Coupon System**: Create percentage or fixed-amount discount codes
- **Bulk Operations**: Export data to CSV/Excel for reporting
- **Invoice Generation**: Download professional PDF invoices
- **Real-time Updates**: Live data synchronization

### For Customers
- **Bulk Payments**: Submit payment requests for multiple bills at once
- **Payment Tracking**: Monitor payment request status
- **UPI Integration**: Quick pay with UPI deep links
- **Invoice Downloads**: Get PDF copies of bills
- **Order Tracking**: Real-time order status updates

## 🐛 Known Issues

- Node.js version warning: Running 20.12.2, recommend 20.19+ or 22.12+
- Browserslist database is outdated (run `npx update-browserslist-db@latest`)

## 🚀 Deployment

### Production Checklist
1. Update CORS from `localhost:8080` to production domain
2. Enable JWT verification on Edge Functions
3. Set strong environment variables
4. Configure custom domain in Supabase
5. Run security audit: `npm audit`
6. Update Node.js to 20.19+ or 22.12+

### Deploy to Vercel/Netlify

```bash
# Build for production
npm run build

# Deploy dist folder to your hosting service
```

## 📞 Support & Contact

For issues or questions, please contact the development team.

## 📄 License

Proprietary - Jay Shree Traders

## 🔄 Version History

- **v2.0.0** (Jan 12, 2026) - Major update:
  - Payment request and approval system
  - Bulk payment functionality for customers
  - Coupon management system
  - Inventory tracking with stock levels
  - Analytics dashboard with P&L and cash flow
  - Customer aging reports
  - Export to CSV/Excel
  - PDF invoice generation
  - Real-time data updates
  - PWA support
  - Enhanced RLS policies
- **v1.0.0** (Jan 2026) - Initial release with core functionality
