import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { BudgetCategory } from "../entities/BudgetCategory";
import { Expense } from "../entities/Expense";
import { Income } from "../entities/Income";
import { Split } from "../entities/Split";

export async function reportRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const categoryRepository = AppDataSource.getRepository(BudgetCategory);
  const expenseRepository = AppDataSource.getRepository(Expense);
  const incomeRepository = AppDataSource.getRepository(Income);
  const splitRepository = AppDataSource.getRepository(Split);

  fastify.get(
    "/summary",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取财务总览报表",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const categories = await categoryRepository.find();
      const totalBudget = categories.reduce(
        (sum, c) => sum + parseFloat(c.budgetLimit as any),
        0
      );

      const expenses = await expenseRepository.find({ where: { status: "已付" as any } });
      const totalExpense = expenses.reduce(
        (sum, e) => sum + parseFloat(e.amount as any),
        0
      );

      const incomes = await incomeRepository.find();
      const totalIncome = incomes.reduce(
        (sum, i) => sum + parseFloat(i.amount as any),
        0
      );

      const netExpense = totalExpense - totalIncome;
      const budgetUsage = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

      return {
        totalBudget,
        totalExpense,
        totalIncome,
        netExpense,
        budgetUsage: Math.round(budgetUsage * 100) / 100,
        remainingBudget: totalBudget - totalExpense,
      };
    }
  );

  fastify.get(
    "/category-pie",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取各分类支出占比饼图数据",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const expenses = await expenseRepository.find({ where: { status: "已付" as any } });
      const categoryMap: any = {};

      for (const expense of expenses) {
        if (!categoryMap[expense.category]) {
          categoryMap[expense.category] = { name: expense.category, value: 0 };
        }
        categoryMap[expense.category].value += parseFloat(expense.amount as any);
      }

      const total = Object.values(categoryMap).reduce(
        (sum: number, c: any) => sum + c.value,
        0
      );

      return Object.values(categoryMap).map((c: any) => ({
        ...c,
        percentage: total > 0 ? Math.round((c.value / total) * 10000) / 100 : 0,
      }));
    }
  );

  fastify.get(
    "/monthly-trend",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取月度支出趋势",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const expenses = await expenseRepository.find({
        where: { status: "已付" as any },
        order: { paymentDate: "ASC" },
      });

      const monthMap: any = {};
      for (const expense of expenses) {
        const date = new Date(expense.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { month: monthKey, amount: 0 };
        }
        monthMap[monthKey].amount += parseFloat(expense.amount as any);
      }

      return Object.values(monthMap).sort((a: any, b: any) => a.month.localeCompare(b.month));
    }
  );

  fastify.get(
    "/party-comparison",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取男女双方各自承担金额对比",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const splits = await splitRepository.find();
      const partyMap: any = {};

      for (const split of splits) {
        if (!partyMap[split.party]) {
          partyMap[split.party] = {
            party: split.party,
            totalDue: 0,
            totalPaid: 0,
            remaining: 0,
          };
        }
        partyMap[split.party].totalDue += parseFloat(split.amountDue as any);
        partyMap[split.party].totalPaid += parseFloat(split.amountPaid as any);
        partyMap[split.party].remaining =
          partyMap[split.party].totalDue - partyMap[split.party].totalPaid;
      }

      return Object.values(partyMap);
    }
  );

  fastify.get(
    "/overbudget-categories",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取超预算分类列表",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const categories = await categoryRepository.find();
      const expenses = await expenseRepository.find({ where: { status: "已付" as any } });

      const expenseByCategory: any = {};
      for (const expense of expenses) {
        if (!expenseByCategory[expense.category]) {
          expenseByCategory[expense.category] = 0;
        }
        expenseByCategory[expense.category] += parseFloat(expense.amount as any);
      }

      const overbudget = [];
      for (const category of categories) {
        const spent = expenseByCategory[category.name] || 0;
        const budget = parseFloat(category.budgetLimit as any);
        if (spent > budget && budget > 0) {
          overbudget.push({
            category: category.name,
            budget,
            spent,
            overage: spent - budget,
            overagePercentage: Math.round((spent / budget - 1) * 10000) / 100,
          });
        }
      }

      return overbudget.sort((a: any, b: any) => b.overage - a.overage);
    }
  );

  fastify.get(
    "/full-report",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取完整结算报表",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const [summary, categoryPie, monthlyTrend, partyComparison, overbudgetCategories] =
        await Promise.all([
          reply.inject({ method: "GET", url: "/api/report/summary" }).then(r => r.json()),
          reply.inject({ method: "GET", url: "/api/report/category-pie" }).then(r => r.json()),
          reply.inject({ method: "GET", url: "/api/report/monthly-trend" }).then(r => r.json()),
          reply.inject({ method: "GET", url: "/api/report/party-comparison" }).then(r => r.json()),
          reply.inject({ method: "GET", url: "/api/report/overbudget-categories" }).then(r => r.json()),
        ]);

      return {
        summary,
        categoryPie,
        monthlyTrend,
        partyComparison,
        overbudgetCategories,
        generatedAt: new Date().toISOString(),
      };
    }
  );

  fastify.get(
    "/year-comparison",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取年度/跨婚礼支出对比",
        tags: ["报表统计"],
        security: [{ bearerAuth: [] }],
        query: {
          type: "object",
          properties: {
            years: {
              type: "array",
              description: "要对比的年份列表",
              items: { type: "number" },
            },
          },
        },
      },
    },
    async (request) => {
      const { years } = request.query as any;
      const expenses = await expenseRepository.find({
        where: { status: "已付" as any },
        order: { paymentDate: "ASC" },
      });

      const expenseYears = [...new Set(
        expenses.map(e => new Date(e.paymentDate).getFullYear())
      )].sort();

      const yearsToCompare = years && years.length > 0
        ? years
        : expenseYears.slice(0, 5);

      const categories = await categoryRepository.find();
      const categoryNames = categories.map(c => c.name);

      const comparisonData: any = {
        years: yearsToCompare,
        categories: [],
        yearlyTotals: {},
      };

      for (const year of yearsToCompare) {
        comparisonData.yearlyTotals[year] = 0;
      }

      for (const category of categoryNames) {
        const catData: any = {
          category: category,
          yearlyData: {},
        };

        for (const year of yearsToCompare) {
          const yearExpenses = expenses.filter(e => {
            const expenseYear = new Date(e.paymentDate).getFullYear();
            return e.category === category && expenseYear === year;
          });
          const total = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
          catData.yearlyData[year] = total;
          comparisonData.yearlyTotals[year] += total;
        }

        const totals = Object.values(catData.yearlyData) as number[];
        catData.min = Math.min(...totals);
        catData.max = Math.max(...totals);
        catData.average = totals.reduce((a, b) => a + b, 0) / totals.length;
        catData.total = totals.reduce((a, b) => a + b, 0);

        comparisonData.categories.push(catData);
      }

      comparisonData.summary = {
        totalExpenses: Object.values(comparisonData.yearlyTotals) as number[],
        grandTotal: (Object.values(comparisonData.yearlyTotals) as number[]).reduce((a, b) => a + b, 0),
        totalCategories: categoryNames.length,
        expenseCount: expenses.length,
      };

      return comparisonData;
    }
  );
}
