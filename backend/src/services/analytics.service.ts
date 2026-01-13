import { prisma } from '../config/database';

interface BottleneckAnalysis {
  department: string;
  avgProcessingTime: number;
  pendingOrders: number;
  completedOrders: number;
  bottleneckScore: number;
}

interface WorkerProductivity {
  workerId: string;
  workerName: string;
  department: string;
  ordersCompleted: number;
  avgCompletionTime: number;
  productivityScore: number;
}

interface CycleTimeTrend {
  date: string;
  avgCycleTime: number;
  orderCount: number;
}

interface PredictedDelivery {
  orderId: string;
  orderNumber: string;
  predictedDate: Date;
  confidence: number;
  factors: string[];
}

class AdvancedAnalyticsService {
  // Department bottleneck analysis
  async analyzeBottlenecks(dateRange?: { start: Date; end: Date }): Promise<BottleneckAnalysis[]> {
    const where = dateRange ? {
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    } : {};

    // Get department stats
    const departments = ['Design', 'Casting', 'Polishing', 'Stone Setting', 'Quality Check', 'Packaging'];
    const results: BottleneckAnalysis[] = [];

    for (const dept of departments) {
      const pending = await prisma.order.count({
        where: { ...where, currentDepartment: dept, status: { not: 'completed' } },
      });

      const completed = await prisma.order.count({
        where: { ...where, currentDepartment: dept, status: 'completed' },
      });

      // Calculate avg processing time from status history
      const history = await prisma.statusHistory.findMany({
        where: { department: dept, ...where },
        orderBy: { createdAt: 'asc' },
      });

      let totalTime = 0;
      let timeCount = 0;

      // Group by orderId and calculate time differences
      const orderTimes = new Map<string, Date[]>();
      history.forEach(h => {
        const times = orderTimes.get(h.orderId) || [];
        times.push(h.createdAt);
        orderTimes.set(h.orderId, times);
      });

      orderTimes.forEach(times => {
        if (times.length >= 2) {
          const diff = times[times.length - 1].getTime() - times[0].getTime();
          totalTime += diff;
          timeCount++;
        }
      });

      const avgProcessingTime = timeCount > 0 ? totalTime / timeCount / (1000 * 60 * 60) : 0; // hours
      const bottleneckScore = (pending * 10) + (avgProcessingTime * 2) - (completed * 0.5);

      results.push({
        department: dept,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        pendingOrders: pending,
        completedOrders: completed,
        bottleneckScore: Math.max(0, Math.round(bottleneckScore)),
      });
    }

    return results.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  // Worker productivity metrics
  async getWorkerProductivity(departmentFilter?: string): Promise<WorkerProductivity[]> {
    const where: any = {};
    if (departmentFilter) where.department = departmentFilter;

    const workers = await prisma.user.findMany({
      where: { role: 'worker', department: departmentFilter || undefined },
      select: { id: true, name: true, department: true },
    });

    const results: WorkerProductivity[] = [];

    for (const worker of workers) {
      const completedOrders = await prisma.statusHistory.count({
        where: { updatedById: worker.id, status: 'completed' },
      });

      const updates = await prisma.statusHistory.findMany({
        where: { updatedById: worker.id },
        orderBy: { createdAt: 'asc' },
        select: { orderId: true, createdAt: true },
      });

      // Calculate average completion time
      let totalTime = 0;
      const orderUpdates = new Map<string, Date[]>();
      
      updates.forEach(u => {
        const times = orderUpdates.get(u.orderId) || [];
        times.push(u.createdAt);
        orderUpdates.set(u.orderId, times);
      });

      let completions = 0;
      orderUpdates.forEach(times => {
        if (times.length >= 2) {
          totalTime += times[times.length - 1].getTime() - times[0].getTime();
          completions++;
        }
      });

      const avgCompletionTime = completions > 0 ? totalTime / completions / (1000 * 60 * 60) : 0;
      const productivityScore = (completedOrders * 10) / Math.max(1, avgCompletionTime);

      results.push({
        workerId: worker.id,
        workerName: worker.name,
        department: worker.department || 'N/A',
        ordersCompleted: completedOrders,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        productivityScore: Math.round(productivityScore * 10) / 10,
      });
    }

    return results.sort((a, b) => b.productivityScore - a.productivityScore);
  }

  // Order cycle time trends
  async getCycleTimeTrends(days: number = 30): Promise<CycleTimeTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: startDate },
      },
      select: { createdAt: true, completedAt: true },
    });

    // Group by date
    const dailyData = new Map<string, { totalTime: number; count: number }>();

    orders.forEach(order => {
      if (!order.completedAt) return;
      const dateKey = order.completedAt.toISOString().split('T')[0];
      const cycleTime = (order.completedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      const existing = dailyData.get(dateKey) || { totalTime: 0, count: 0 };
      existing.totalTime += cycleTime;
      existing.count++;
      dailyData.set(dateKey, existing);
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        avgCycleTime: Math.round((data.totalTime / data.count) * 10) / 10,
        orderCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Predictive delivery dates
  async predictDeliveryDate(orderId: string): Promise<PredictedDelivery> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error('Order not found');

    // Get historical data for similar orders
    const similarOrders = await prisma.order.findMany({
      where: {
        status: 'completed',
        priority: order.priority,
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
      take: 100,
    });

    // Calculate average cycle time
    let avgCycleTime = 7; // Default 7 days
    if (similarOrders.length > 0) {
      const totalDays = similarOrders.reduce((sum, o) => {
        if (!o.completedAt) return sum;
        return sum + (o.completedAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgCycleTime = totalDays / similarOrders.length;
    }

    // Adjust for factors
    const factors: string[] = [];
    let adjustment = 0;

    if (order.priority === 'urgent') {
      adjustment -= 2;
      factors.push('Urgent priority (-2 days)');
    } else if (order.priority === 'high') {
      adjustment -= 1;
      factors.push('High priority (-1 day)');
    }

    const itemCount = order.items?.length || 1;
    if (itemCount > 5) {
      adjustment += Math.floor(itemCount / 5);
      factors.push(`Multiple items (+${Math.floor(itemCount / 5)} days)`);
    }

    const predictedDays = Math.max(1, Math.round(avgCycleTime + adjustment));
    const predictedDate = new Date(order.createdAt);
    predictedDate.setDate(predictedDate.getDate() + predictedDays);

    const confidence = Math.min(95, 50 + similarOrders.length);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      predictedDate,
      confidence,
      factors: factors.length > 0 ? factors : ['Based on historical average'],
    };
  }

  // Customer order patterns
  async getCustomerPatterns(customerId?: string): Promise<any> {
    const where = customerId ? { customerId } : {};

    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });

    // Analyze patterns
    const customerStats = new Map<string, any>();

    orders.forEach(order => {
      const cId = order.customerId || 'unknown';
      const stats = customerStats.get(cId) || {
        customerId: cId,
        customerName: order.customer?.name || 'Unknown',
        totalOrders: 0,
        totalItems: 0,
        preferredTypes: new Map<string, number>(),
        avgOrderValue: 0,
        orderFrequency: 0,
        lastOrderDate: null,
      };

      stats.totalOrders++;
      stats.totalItems += order.items?.length || 0;
      stats.lastOrderDate = stats.lastOrderDate || order.createdAt;

      order.items?.forEach(item => {
        const count = stats.preferredTypes.get(item.type) || 0;
        stats.preferredTypes.set(item.type, count + 1);
      });

      customerStats.set(cId, stats);
    });

    return Array.from(customerStats.values()).map(stats => ({
      ...stats,
      preferredTypes: Array.from(stats.preferredTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({ type, count })),
    }));
  }
}

export const analyticsService = new AdvancedAnalyticsService();
export default AdvancedAnalyticsService;
