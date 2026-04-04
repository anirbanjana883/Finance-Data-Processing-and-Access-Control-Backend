import prisma from '../config/db.js';

export const getDashboardSummary = async (actingUser) => {

    // check tanants 
    const where = { 
        orgId: actingUser.orgId, 
        deletedAt: null 
    };

    // time check 
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1); 
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29); 

    // paralal db check
    const [
        typeTotals,
        expenseCategories,
        incomeCategories,
        recentActivityRaw,
        sixMonthData,
        thirtyDayData,
        biggestExpense,
        totalRecords,
        orgDetails
    ] = await Promise.all([
        prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } }),
        prisma.transaction.groupBy({ by: ['category'], where: { ...where, type: 'EXPENSE' }, _sum: { amount: true } }),
        prisma.transaction.groupBy({ by: ['category'], where: { ...where, type: 'INCOME' }, _sum: { amount: true } }),
        prisma.transaction.findMany({ where, orderBy: { date: 'desc' }, take: 5, select: { id: true, notes: true, category: true, amount: true, type: true, date: true } }),
        prisma.transaction.findMany({ where: { ...where, date: { gte: sixMonthsAgo } }, select: { amount: true, type: true, date: true } }),
        prisma.transaction.findMany({ where: { ...where, date: { gte: thirtyDaysAgo }, type: 'EXPENSE' }, select: { amount: true, date: true } }),
        prisma.transaction.findFirst({ where: { ...where, type: 'EXPENSE' }, orderBy: { amount: 'desc' }, select: { amount: true, category: true, date: true } }),
        prisma.transaction.count({ where }),
        prisma.organization.findUnique({ 
            where: { id: actingUser.orgId }, 
            select: { name: true } 
        })
    ]);

    // total calculation
    let totalIncome = 0;
    let totalExpenses = 0;
    typeTotals.forEach(record => {
        if (record.type === 'INCOME') totalIncome = Number(record._sum.amount || 0);
        if (record.type === 'EXPENSE') totalExpenses = Number(record._sum.amount || 0);
    });
    
    const totalBalance = totalIncome - totalExpenses;
    
    const savingsRate = totalIncome > 0 ? Number(((totalBalance / totalIncome) * 100).toFixed(1)) : 0;
    const expenseRatio = totalIncome > 0 ? Number(((totalExpenses / totalIncome) * 100).toFixed(1)) : 0;
    
    const thirtyDayTotal = thirtyDayData.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const avgDailySpend = Math.round(thirtyDayTotal / 30);

    // monthly trend analysis 
    const monthlyMap = {};
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g., "Jan '26"
        monthlyMap[key] = { key, month: label, income: 0, expense: 0, balance: 0, savings: 0 };
    }

    sixMonthData.forEach(tx => {
        const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
            const amt = Number(tx.amount);
            if (tx.type === 'INCOME') monthlyMap[key].income += amt;
            if (tx.type === 'EXPENSE') monthlyMap[key].expense += amt;
        }
    });

    let rollingBalance = 0;
    
    const sortedMonths = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));
    
    const monthlyComparison = sortedMonths.map(m => {
        m.savings = m.income - m.expense;
        rollingBalance += m.savings;
        m.balance = rollingBalance;
        return m;
    });

    // savings streak
    let savingsStreak = 0;
    for (let i = sortedMonths.length - 1; i >= 0; i--) {
        if (sortedMonths[i].savings > 0) {
            savingsStreak++;
        } else {
            break; 
        }
    }

    // category analysis
    const formatCategories = (data, totalRef, typeLabel) => {
        return data.map(record => {
            const pct = totalRef > 0 ? Number(((Number(record._sum.amount) / totalRef) * 100).toFixed(1)) : 0;
            return {
                category: record.category.charAt(0).toUpperCase() + record.category.slice(1), 
                amount: Number(record._sum.amount || 0),
                percentage: pct,
                context: `${pct}% of total ${typeLabel}`
            };
        }).sort((a, b) => b.amount - a.amount);
    };

    const categoryAnalysis = formatCategories(expenseCategories, totalExpenses, "expenses");
    const incomeSources = formatCategories(incomeCategories, totalIncome, "income");
    const categoryBreakdown = categoryAnalysis.slice(0, 5);

    // last 30 days daily trends
    const dailyMap = {};
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dailyMap[dateString] = 0;
    }

    thirtyDayData.forEach(tx => {
        const dateString = tx.date.toISOString().split('T')[0];
        if (dailyMap[dateString] !== undefined) {
            dailyMap[dateString] += Number(tx.amount);
        }
    });
    
    const dailyTrend = Object.keys(dailyMap).sort().map(date => ({ date, expense: dailyMap[date] }));

    // recent activity 
    const recentTransactions = recentActivityRaw.map(tx => ({
        id: tx.id,
        title: tx.notes || `${tx.category} Transaction`, 
        category: tx.category.charAt(0).toUpperCase() + tx.category.slice(1),
        amount: tx.type === 'EXPENSE' ? -Math.abs(tx.amount) : Math.abs(tx.amount), 
        type: tx.type,
        date: tx.date.toISOString().split('T')[0]
    }));

    // insights
    const topCategory = categoryAnalysis.length > 0 ? categoryAnalysis[0] : null;

    // final summary 
    return {
        organizationName: orgDetails?.name || 'Unknown Organization',
        summary: {
            totalBalance,
            totalIncome,
            totalExpenses,
            savingsRate,
            totalRecords,
            avgDailySpend,
            savingsStreak
        },
        trends: monthlyComparison.map(m => ({ month: m.month, income: m.income, expense: m.expense, balance: m.balance })),
        monthlyComparison: monthlyComparison.map(m => ({ month: m.month, income: m.income, expense: m.expense, savings: m.savings })),
        categoryBreakdown,
        recentTransactions,
        categoryAnalysis,
        dailyTrend,
        incomeSources,
        insights: {
            topCategory,
            biggestExpense: biggestExpense ? {
                amount: biggestExpense.amount,
                category: biggestExpense.category.charAt(0).toUpperCase() + biggestExpense.category.slice(1),
                date: biggestExpense.date.toISOString().split('T')[0]
            } : null,
            expenseRatio
        }
    };
};