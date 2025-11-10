import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Types
interface SalesStats {
  total_sales: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
  top_selling_item: string;
  sales_this_month: number;
  revenue_this_month: number;
}

interface MonthlySalesSummary {
  month: string;
  total_sales: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
}

interface ItemTypeSummary {
  item_type: string;
  total_sales: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
}

// Helper function to return empty stats
const getEmptyStats = (): SalesStats => ({
  total_sales: 0,
  total_revenue: 0,
  total_items_sold: 0,
  average_order_value: 0,
  top_selling_item: 'No sales yet',
  sales_this_month: 0,
  revenue_this_month: 0
});

// GET - Fetch sales statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    const supabase = createServiceClient();

    switch (type) {
      case 'overview':
        return await getOverviewStats();
      case 'monthly':
        return await getMonthlySummary();
      case 'item_type':
        return await getItemTypeSummary();
      default:
        return await getOverviewStats();
    }

  } catch (error) {
    console.error('Error in GET /api/finances/sales/statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get overview statistics
async function getOverviewStats() {
  try {
    const supabase = createServiceClient();

    // Calculate statistics directly from sales table
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, quantity, item_name, sale_date, status')
      .eq('status', 'completed');

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
      return NextResponse.json(getEmptyStats());
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json(getEmptyStats());
    }

    // Calculate statistics from real data
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalItemsSold = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get current month data
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthSales = salesData.filter(sale => 
      new Date(sale.sale_date) >= currentMonthStart
    );
    const salesThisMonth = currentMonthSales.length;
    const revenueThisMonth = currentMonthSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

    // Get top selling item
    const itemCounts = salesData.reduce((acc, sale) => {
      acc[sale.item_name] = (acc[sale.item_name] || 0) + (sale.quantity || 0);
      return acc;
    }, {} as Record<string, number>);
    
    const topSellingItem = Object.keys(itemCounts).length > 0 
      ? Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b)
      : 'No sales yet';

    const stats: SalesStats = {
      total_sales: totalSales,
      total_revenue: totalRevenue,
      total_items_sold: totalItemsSold,
      average_order_value: Math.round(averageOrderValue * 100) / 100, // Round to 2 decimal places
      top_selling_item: topSellingItem,
      sales_this_month: salesThisMonth,
      revenue_this_month: revenueThisMonth
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in getOverviewStats:', error);
    return NextResponse.json(getEmptyStats());
  }
}

// Get monthly sales summary
async function getMonthlySummary() {
  try {
    const supabase = createServiceClient();

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, quantity, sale_date, status')
      .eq('status', 'completed')
      .order('sale_date', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales data for monthly summary:', salesError);
      return NextResponse.json([]);
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json([]);
    }

    // Group sales by month
    const monthlyData = salesData.reduce((acc, sale) => {
      const saleDate = new Date(sale.sale_date);
      const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total_sales: 0,
          total_revenue: 0,
          total_items_sold: 0,
          average_order_value: 0
        };
      }
      
      acc[monthKey].total_sales += 1;
      acc[monthKey].total_revenue += sale.total_amount || 0;
      acc[monthKey].total_items_sold += sale.quantity || 0;
      
      return acc;
    }, {} as Record<string, MonthlySalesSummary>);

    // Calculate average order values and convert to array
    const monthlySummary = Object.values(monthlyData).map(month => ({
      ...month,
      average_order_value: month.total_sales > 0 ? Math.round((month.total_revenue / month.total_sales) * 100) / 100 : 0
    })).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);

    return NextResponse.json(monthlySummary);

  } catch (error) {
    console.error('Error in getMonthlySummary:', error);
    return NextResponse.json([]);
  }
}

// Get item type summary
async function getItemTypeSummary() {
  try {
    const supabase = createServiceClient();

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('item_type, total_amount, quantity, status')
      .eq('status', 'completed');

    if (salesError) {
      console.error('Error fetching sales data for item type summary:', salesError);
      return NextResponse.json([]);
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json([]);
    }

    // Group sales by item type
    const itemTypeData = salesData.reduce((acc, sale) => {
      if (!acc[sale.item_type]) {
        acc[sale.item_type] = {
          item_type: sale.item_type,
          total_sales: 0,
          total_revenue: 0,
          total_items_sold: 0,
          average_order_value: 0
        };
      }
      
      acc[sale.item_type].total_sales += 1;
      acc[sale.item_type].total_revenue += sale.total_amount || 0;
      acc[sale.item_type].total_items_sold += sale.quantity || 0;
      
      return acc;
    }, {} as Record<string, ItemTypeSummary>);

    // Calculate average order values and convert to array
    const itemTypeSummary = Object.values(itemTypeData).map(item => ({
      ...item,
      average_order_value: item.total_sales > 0 ? Math.round((item.total_revenue / item.total_sales) * 100) / 100 : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    return NextResponse.json(itemTypeSummary);

  } catch (error) {
    console.error('Error in getItemTypeSummary:', error);
    return NextResponse.json([]);
  }
}
