# Jay Shree Traders - Wholesale Management System

A comprehensive wholesale business management system built with React, TypeScript, Vite, and Supabase. This application streamlines customer management, billing, payments, orders, and inventory tracking for wholesale trading businesses.

## 🚀 Features

### Core Functionality
- **Customer Management**: Add, edit, and manage wholesale customers with credit limits
- **Billing System**: Generate bills, track payments, and manage outstanding balances
- **Payment Processing**: Record payments, approve payment requests, send reminders
- **Order Management**: Create and track customer orders
- **Inventory Tracking**: Manage products and stock levels
- **Analytics Dashboard**: View sales trends, customer insights, and business metrics

### User Roles
- **Admin**: Full access to all features including customer management, analytics, and system configuration
- **Customer**: View bills, make payment requests, place orders, and track history
- **CA (Chartered Accountant)**: Read-only access to bills and financial records

### Additional Features
- WhatsApp payment reminders in Hindi/English
- Credit limit management per customer
- Excel/CSV export for customer and billing data
- AI-powered chat assistant
- Responsive design for desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Shadcn UI** for component library
- **React Router** for navigation
- **Recharts** for analytics visualization

### Backend
- **Supabase** for:
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (serverless)
  - Real-time subscriptions

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type safety
- **Git** for version control

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase CLI (for local development)
- Git

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/jst-website.git
cd jst-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

> ⚠️ **Note**: Never commit `.env` or `.env.local` files to Git!

4. **Run database migrations** (if using Supabase CLI locally)
```bash
npx supabase db push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
jst_web/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers (Auth, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Supabase client and types
│   ├── pages/             # Page components
│   │   ├── AuthPage.tsx   # Login/Register
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── CustomersPage.tsx
│   │   ├── BillsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── ...
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── create-customer/
│   │   ├── update-customer/
│   │   ├── approve-payment-request/
│   │   └── ...
│   ├── migrations/        # Database migrations
│   └── config.toml        # Supabase configuration
├── public/                # Static assets
├── .env.local            # Local environment variables (not in Git)
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 🔐 Authentication

The system supports multiple authentication methods:
- Email/Password login
- Phone number login (format: `phone@jst.com`)
- OTP verification (via SMS)

### Default User Roles
- Customers are created with email `{phone}@jst.com` and password = phone number
- Admin and CA users are set up via the database

## 🗄️ Database Schema

Key tables:
- `profiles` - User profiles with business information and credit limits
- `user_roles` - Role assignments (admin/customer/ca)
- `bills` - Customer bills and invoices
- `payments` - Payment records
- `payment_requests` - Payment approval workflow
- `orders` - Customer orders
- `products` - Product catalog
- `payment_reminders` - WhatsApp reminder tracking

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy Edge Functions
```bash
npx supabase functions deploy --project-ref your_project_ref
```

## 🔒 Security Features

- Row Level Security (RLS) policies on all tables
- JWT authentication (optional - currently disabled)
- Service role key for admin operations
- Input validation and sanitization
- CORS protection on Edge Functions

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Common Issues

**"Edge Function returned a non-2xx status code"**
- Check Supabase function logs in the dashboard
- Verify environment variables are set correctly
- Ensure JWT verification is disabled if needed

**Database connection errors**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check if the Supabase project is active

**Authentication issues**
- Clear browser localStorage
- Check user roles in the `user_roles` table

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Contact

For support or inquiries, please contact Jay Shree Traders.

---

**Built with ❤️ for wholesale businesses**