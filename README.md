# Jay Shree Traders Hub

A comprehensive business management system for managing customers, products, bills, orders, and payments with role-based access control (Admin, CA, Customer).

## 📋 Project Overview

Jay Shree Traders Hub is a modern web application designed to streamline business operations including:
- **Customer Management** - Create, view, edit customer profiles
- **Product Catalog** - Manage products with pricing
- **Order Management** - Process and track customer orders
- **Billing System** - Generate bills and invoices
- **Payment Processing** - Record and track payments
- **Admin Dashboard** - Overview of business metrics
- **Role-Based Access** - Admin, Chartered Accountant (CA), and Customer roles

## 🛠 Technology Stack

**Frontend:**
- Vite 7.3.1 - Fast build tool and dev server
- React 18+ - UI framework
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Utility-first CSS framework
- shadcn/ui - High-quality React components
- Lucide React - Beautiful icon library

**Backend:**
- Supabase - PostgreSQL database, authentication, real-time features
- Edge Functions - Serverless backend functions
- PostgreSQL - Relational database

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
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `bills` - Billing records
- `payments` - Payment records
- `payment_reminders` - Payment reminder logs
- `sample_requests` - Sample request tracking

### RLS Policies
- **Admin** - Full access to all tables
- **CA (Chartered Accountant)** - View bills only
- **Customer** - Access to own orders and profile

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
- Manage products
- Create and process orders
- Record payments
- View all bills and reports
- Manage payment reminders

### Chartered Accountant (CA)
- View bills only
- Cannot modify orders or payments
- Cannot create customers

### Customer
- View own orders
- View own bills
- Track payments

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

- **v1.0.0** (Jan 2026) - Initial release with core functionality
