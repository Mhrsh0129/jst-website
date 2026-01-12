# Vercel Deployment Checklist - Missing Features Troubleshooting

## Issue: Features missing on Vercel but present on localhost

### Root Cause
The app uses **role-based access control (RLS)**. Features are hidden based on user roles:

## Role-Based Feature Matrix

| Feature | Admin | CA | Customer |
|---------|-------|-----|----------|
| Bulk Payment | ❌ | ❌ | ✅ |
| Analytics | ✅ | ❌ | ❌ |
| Coupons | ✅ | ❌ | ❌ |
| Product Management | ✅ | ❌ | ❌ |
| Customer Management | ✅ | ❌ | ❌ |
| Payment Requests | ✅ | ❌ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Bills | ✅ | ✅ | ✅ |

## Troubleshooting Steps

### 1. Check Your User Role on Vercel

Login to your Vercel deployment and check your role:
- Open browser DevTools (F12)
- Go to Console tab
- Type: `localStorage.getItem('supabase.auth.token')`
- Or navigate to Dashboard and check the role display

### 2. Verify User Role in Database

Connect to your Supabase dashboard:
1. Go to: https://supabase.com/dashboard
2. Select your project: `sqfzyyemlfmbpmxtwacs`
3. Navigate to: Table Editor → `profiles`
4. Find your user account and check the `role` column
5. Role should be one of: `admin`, `ca`, or `customer`

### 3. Create Admin User (if needed)

If you need an admin account on production:

```bash
# Using Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_ID_HERE';
```

Or use the Edge Function:
```bash
# Call create-admin-user function from Supabase dashboard
# Functions → create-admin-user → Test
```

### 4. Check Supabase Edge Functions Deployment

Ensure all functions are deployed:
- `create-payment-request` - Required for bulk payments
- `approve-payment-request` - Required for admin payment approval
- `record-customer-payment` - Required for payment recording
- `ai-chat` - Required for AI chat widget
- `create-customer` - Required for customer creation

Check deployment status:
1. Go to: https://supabase.com/dashboard
2. Navigate to: Edge Functions
3. Verify all functions are listed and deployed

### 5. Verify Environment Variables

Ensure these are set in Vercel:
- ✅ `VITE_SUPABASE_PROJECT_ID`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_SUPABASE_URL`

### 6. Check RLS Policies

Ensure Row Level Security policies are correctly set:
- Customers can only see their own data
- Admins can see all data
- CA users have read-only access to bills

## Common Scenarios

### Scenario 1: "I don't see bulk payment option"
**Solution:** You need to be logged in as a `customer` role user. Admins and CA users don't see this option.

### Scenario 2: "Analytics page redirects me to bills"
**Solution:** Only `admin` role users can access analytics. You're logged in as `customer` or `ca`.

### Scenario 3: "Can't add/edit products"
**Solution:** Only `admin` role users can manage products. You're logged in as `customer` or `ca`.

### Scenario 4: "Can't see coupon management"
**Solution:** Only `admin` role users can manage coupons.

## Quick Test

To test if everything is working:

1. **As Admin:**
   - Login with admin credentials
   - Navigate to `/products` → Should see "Add Product" and "Manage Coupons" buttons
   - Navigate to `/analytics` → Should see charts and metrics
   - Navigate to `/customers` → Should see customer list

2. **As Customer:**
   - Login with customer credentials
   - Navigate to `/bills` → Should see "Bulk Pay Outstanding Bills" button
   - Should NOT see Analytics, Customer Management, or Product Management options

3. **As CA:**
   - Login with CA credentials
   - Can view bills and orders
   - Cannot see financial totals or management features

## If Still Not Working

1. Clear browser cache and localStorage
2. Logout and login again
3. Check browser console for errors (F12 → Console)
4. Verify network requests are reaching Supabase (F12 → Network)
5. Check Supabase Logs for function errors

## Contact Info

For further issues, check:
- Supabase Dashboard Logs
- Vercel Deployment Logs
- Browser Console Errors
