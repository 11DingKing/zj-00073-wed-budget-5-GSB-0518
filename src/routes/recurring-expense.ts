import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { RecurringExpense } from "../entities/RecurringExpense";
import { Expense } from "../entities/Expense";
import { ExchangeRate } from "../entities/ExchangeRate";
import { LessThanOrEqual, MoreThan } from "typeorm";

export async function recurringExpenseRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const recurringExpenseRepository = AppDataSource.getRepository(RecurringExpense);
  const expenseRepository = AppDataSource.getRepository(Expense);
  const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);

  async function convertToRMB(currency: string, foreignAmount: number): Promise<number> {
    if (currency === "CNY") return foreignAmount;
    const rate = await exchangeRateRepository.findOneBy({ currency });
    if (!rate) return foreignAmount;
    return Number((foreignAmount * rate.rate).toFixed(2));
  }

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有周期性支出",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            isActive: { type: "boolean", description: "是否只显示活跃的" },
            page: { type: "number", description: "页码", default: 1 },
            pageSize: { type: "number", description: "每页数量", default: 20 },
          },
        },
      },
    },
    async (request: any) => {
      const { isActive, page, pageSize } = request.query;
      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive;

      const [data, total] = await recurringExpenseRepository.findAndCount({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { createdAt: "DESC" },
      });
      return { data, total, page, pageSize };
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个周期性支出",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "周期性支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const recurringExpense = await recurringExpenseRepository.findOneBy({ id });
      if (!recurringExpense) {
        return reply.status(404).send({ message: "周期性支出不存在" });
      }
      return recurringExpense;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建周期性支出",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["category", "amount", "startDate", "endDate"],
          properties: {
            category: { type: "string", description: "分类" },
            subItem: { type: "string", description: "子项" },
            supplierName: { type: "string", description: "供应商名称" },
            amount: { type: "number", description: "人民币金额" },
            currency: { type: "string", description: "币种", default: "CNY" },
            foreignAmount: { type: "number", description: "外币金额" },
            paymentMethod: { type: "string", description: "支付方式" },
            dayOfMonth: { type: "number", description: "每月几号支付", default: 1 },
            startDate: { type: "string", format: "date-time", description: "开始日期" },
            endDate: { type: "string", format: "date-time", description: "结束日期（婚礼日期）" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request) => {
      const body = request.body as any;
      const recurringExpense = recurringExpenseRepository.create(body);
      return await recurringExpenseRepository.save(recurringExpense);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新周期性支出",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "周期性支出ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            category: { type: "string", description: "分类" },
            subItem: { type: "string", description: "子项" },
            supplierName: { type: "string", description: "供应商名称" },
            amount: { type: "number", description: "人民币金额" },
            currency: { type: "string", description: "币种" },
            foreignAmount: { type: "number", description: "外币金额" },
            paymentMethod: { type: "string", description: "支付方式" },
            dayOfMonth: { type: "number", description: "每月几号支付" },
            startDate: { type: "string", format: "date-time", description: "开始日期" },
            endDate: { type: "string", format: "date-time", description: "结束日期" },
            isActive: { type: "boolean", description: "是否活跃" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const recurringExpense = await recurringExpenseRepository.findOneBy({ id });
      if (!recurringExpense) {
        return reply.status(404).send({ message: "周期性支出不存在" });
      }
      recurringExpenseRepository.merge(recurringExpense, body);
      return await recurringExpenseRepository.save(recurringExpense);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除周期性支出",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "周期性支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await recurringExpenseRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "周期性支出不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/generate",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "生成周期性支出记录（手动触发）",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const activeRecurringExpenses = await recurringExpenseRepository.find({
        where: { isActive: true },
      });

      let generatedCount = 0;

      for (const re of activeRecurringExpenses) {
        const startDate = new Date(re.startDate);
        const endDate = new Date(re.endDate);

        const existingExpenses = await expenseRepository.find({
          where: { recurringExpenseId: re.id },
          select: ["paymentDate"],
        });

        const existingMonths = new Set(
          existingExpenses.map((e) => {
            const date = new Date(e.paymentDate);
            return `${date.getFullYear()}-${date.getMonth()}`;
          })
        );

        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const endDateMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        while (currentDate <= endDateMonth) {
          const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

          if (!existingMonths.has(monthKey)) {
            const rmbAmount = await convertToRMB(re.currency, re.foreignAmount || re.amount);

            const expense = expenseRepository.create({
              category: re.category,
              subItem: re.subItem,
              supplierName: re.supplierName,
              amount: rmbAmount,
              currency: re.currency,
              foreignAmount: re.foreignAmount,
              paymentMethod: re.paymentMethod,
              paymentDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), re.dayOfMonth),
              remarks: re.remarks ? `周期性支出: ${re.remarks}` : "周期性支出",
              status: "待付",
              approvalStatus: "已批准",
              isRecurring: true,
              recurringExpenseId: re.id,
            });

            await expenseRepository.save(expense);
            generatedCount++;
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        re.lastGeneratedDate = new Date();
        await recurringExpenseRepository.save(re);
      }

      return { message: `成功生成 ${generatedCount} 条周期性支出记录`, generatedCount };
    }
  );

  fastify.get(
    "/:id/expenses",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取该周期性支出生成的所有支出记录",
        tags: ["周期性支出"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "周期性支出ID" },
          },
        },
      },
    },
    async (request) => {
      const { id } = request.params as any;
      const expenses = await expenseRepository.find({
        where: { recurringExpenseId: Number(id) },
        order: { paymentDate: "DESC" },
      });
      return { data: expenses, total: expenses.length };
    }
  );
}
