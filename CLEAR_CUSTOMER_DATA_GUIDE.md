# 🗑️ Clear Customer Data Script

## ⚠️ WARNING: DESTRUCTIVE OPERATION

This script will **permanently delete all customer data** from your database. This is intended for preparing the system for a new organization.

## What Gets Deleted ❌

- All customer accounts (auth.users + profiles)
- All bills and invoices
- All payments and payment history
- All orders and order items
- All payment requests
- All payment reminders
- All sample requests
- **All stock history** (so new org can track their own inventory)

## What Gets Preserved ✅

- **Admin accounts** (role = 'admin')
- **CA accounts** (role = 'ca')
- **Product catalog** (products and coupons only - no stock history)
- **Database schema** (all tables and structure)

## How to Use

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/clear_customer_data.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. **Review carefully** - this cannot be undone!
7. Click **"Run"** to execute

### Option 2: Supabase CLI

```bash
# Make sure you're connected to the right project!
cd d:\Codes\jst_web

# Run the migration
supabase db push --file supabase/migrations/clear_customer_data.sql
```

## Verification

After running the script, you'll see output like:

```
=== CLEANUP COMPLETE ===
Remaining Admin accounts: 1
Remaining CA accounts: 1
Remaining Customer accounts: 0 (should be 0)
Products in catalog: 15
Bills remaining: 0 (should be 0)
Orders remaining: 0 (should be 0)
Payments remaining: 0 (should be 0)
```

## What to Do After

1. **Verify the cleanup** - Check that only admin/CA accounts remain
2. **Test admin login** - Make sure you can still login
3. **Check products** - Verify product catalog is intact
4. **Create first customer** - Use the app's customer creation feature
5. **Test new orders** - Create a test order to verify everything works

## Rollback

⚠️ **There is NO rollback for this operation!**

If you have existing customer data you want to keep:
- **DO NOT RUN THIS SCRIPT**
- Take a database backup first using Supabase dashboard
- Or export customer data before running

## Database Backup (Before Running)

```bash
# Backup using Supabase CLI
supabase db dump --file backup_$(date +%Y%m%d).sql

# Or use Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

## Troubleshooting

### If script fails partway through:

The script uses a transaction (`BEGIN...COMMIT`), so if it fails, **nothing will be deleted**.

### If some data remains:

Check for foreign key constraints preventing deletion. Run:

```sql
-- Check what's preventing deletion
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table
FROM pg_constraint 
WHERE contype = 'f'
AND confrelid IN (
  SELECT oid FROM pg_class 
  WHERE relname IN ('profiles', 'bills', 'orders', 'payments')
);
```

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify foreign key constraints
3. Ensure RLS policies aren't blocking deletion
4. Contact database administrator

---

**Remember: This operation is PERMANENT. Make sure you have backups before proceeding!**
