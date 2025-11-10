# 🗄️ Supabase Sales Management Setup Guide

This guide will help you set up the Sales Management feature with your Supabase database.

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Environment variables configured in `.env.local`
- ✅ Supabase client properly set up

## 🚀 Step-by-Step Setup

### **Step 1: Access Supabase Dashboard**

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project
4. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Execute Database Setup Script**

1. **Copy the entire content** from `scripts/supabase-sales-setup.sql`
2. **Paste it into the SQL Editor**
3. **Click "Run"** to execute the script

### **Step 3: Verify Database Setup**

After running the script, you should see:

#### **✅ Tables Created:**
- `sales` - Main sales table
- `sales_statistics` - Analytics view

#### **✅ Sample Data Inserted:**
- 5 sample sales records
- Various item types and statuses
- Different student names and amounts

#### **✅ Features Enabled:**
- Row Level Security (RLS)
- Automatic timestamp updates
- Total amount calculation
- Performance indexes

### **Step 4: Test the Integration**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Sales Management:**
   - Go to `http://localhost:3000`
   - Login as Admin
   - Click "Finances" → "Sales"

3. **Test the features:**
   - View existing sales data
   - Record a new sale
   - Search and filter sales
   - Check statistics

## 🔧 Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

### **Sales Table Structure:**
```sql
CREATE TABLE sales (
    id VARCHAR(20) PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Item Types:**
- `pullover` - School Pullovers
- `sport_wear` - Sports Kits
- `uniform` - School Uniforms
- `t_shirt` - School T-Shirts

### **Status Types:**
- `completed` - Sale completed
- `pending` - Sale pending
- `cancelled` - Sale cancelled

## 🔒 Security Features

### **Row Level Security (RLS):**
- Enabled on the `sales` table
- Policies allow authenticated users to:
  - Read all sales
  - Insert new sales
  - Update existing sales
  - Delete sales

### **Data Validation:**
- Item type validation
- Quantity must be > 0
- Unit price must be >= 0
- Total amount auto-calculated

## 📈 Analytics Views

### **Sales Statistics View:**
- Total sales count
- Total revenue
- Items sold
- Average order value
- Top selling item
- Monthly sales metrics

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. "Table doesn't exist" Error**
- **Solution:** Run the setup script again
- **Check:** Verify you're in the correct Supabase project

#### **2. "Permission denied" Error**
- **Solution:** Check RLS policies
- **Check:** Verify user authentication

#### **3. "Connection failed" Error**
- **Solution:** Check environment variables
- **Check:** Verify Supabase URL and keys

#### **4. "Mock data showing"**
- **Solution:** Database connection issue
- **Check:** API logs for error messages
- **Fallback:** System gracefully falls back to mock data

### **Debug Steps:**

1. **Check Supabase Dashboard:**
   - Verify tables exist
   - Check sample data
   - Review RLS policies

2. **Check API Logs:**
   - Look for error messages
   - Verify database queries
   - Check authentication

3. **Test API Endpoints:**
   ```bash
   # Test sales endpoint
   curl http://localhost:3000/api/finances/sales
   
   # Test statistics endpoint
   curl http://localhost:3000/api/finances/sales/statistics
   ```

## 🎯 Next Steps

After successful setup:

1. **Test all CRUD operations**
2. **Verify analytics accuracy**
3. **Test with real data**
4. **Implement additional features**
5. **Set up monitoring**

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Check API logs for specific errors
4. Verify environment variables

---

**✅ Setup Complete!** Your Sales Management feature is now integrated with Supabase!
