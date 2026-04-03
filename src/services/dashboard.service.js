import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSummary = async (user) => {
    const where = { deletedAt: null };

    // viewrs - own stats ,  analyst, admin - all
    if (user.role === 'VIEWER') {
        where.userId = user.id;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // paralal db quary
    const [typeTotals, categoryTotals, recentTransactions, trendData] = await Promise.all([
        // total income or expances 
        prisma.transaction.groupBy({
            by: ['type'],
            where,
            _sum: { amount: true }
        }),

        // category wise total 
        prisma.transaction.groupBy({
            by: ['category', 'type'],
            where,
            _sum: { amount: true }
        }),

        // last 5 recent activity 
        prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 5,
            select: { id: true, amount: true, type: true, category: true, date: true }
        }),

        // last 6 month row data for trend 
        prisma.transaction.findMany({
            where: { ...where, date: { gte: sixMonthsAgo } },
            select: { amount: true, type: true, date: true },
            orderBy: { date: 'asc' }
        })
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    typeTotals.forEach(record => {
        const amount = Number(record._sum.amount || 0);
        if (record.type === 'INCOME') totalIncome = amount;
        if (record.type === 'EXPENSE') totalExpense = amount;
    });

    const categoryBreakdown = categoryTotals.map(record => ({
        category: record.category,
        type: record.type,
        total: Number(record._sum.amount || 0)
    })).sort((a, b) => b.total - a.total); 

    // monthly trnd 
    const monthlyTrendsMap = trendData.reduce((acc, tx) => {
        const monthLabel = tx.date.toLocaleString('default', { month: 'short', year: 'numeric' }); 
        
        if (!acc[monthLabel]) {
            acc[monthLabel] = { month: monthLabel, income: 0, expense: 0 };
        }
        
        if (tx.type === 'INCOME') acc[monthLabel].income += Number(tx.amount);
        if (tx.type === 'EXPENSE') acc[monthLabel].expense += Number(tx.amount);
        
        return acc;
    }, {});

    // Convert the map object into a clean array for the frontend
    const monthlyTrends = Object.values(monthlyTrendsMap);

    return {
        overview: {
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense
        },
        categoryBreakdown,
        monthlyTrends,
        recentActivity: recentTransactions
    };
};