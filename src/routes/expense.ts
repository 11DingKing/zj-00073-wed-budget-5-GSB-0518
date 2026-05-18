import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Expense } from "../entities/Expense";
import { BudgetCategoryName } from "../entities/BudgetCategory";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";

const VALID_CATEGORIES: BudgetCategoryName[] = [
  "场地租赁",
  "婚庆布置",
  "摄影摄像",
  "婚纱礼服",
  "婚车",
  "喜糖伴手礼",
  "请柬",
  "司仪",
  "化妆",
  "花艺",
  "灯光音响",
  "婚宴酒席",
  "蜜月旅行",
  "其他",
];

export async function expenseRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const expenseRepository = AppDataSource.getRepository(Expense);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有支出记录",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            category: { type: "string", description: "分类筛选" },
            status: { type: "string", description: "状态筛选" },
            page: { type: "number", description: "页码", default: 1 },
            pageSize: { type: "number", description: "每页数量", default: 20 },
          },
        },
      },
    },
    async (request: any) => {
      const { category, status, page, pageSize } = request.query;
      const where: any = {};
      if (category) where.category = category;
      if (status) where.status = status;

      const [data, total] = await expenseRepository.findAndCount({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { paymentDate: "DESC" },
      });

      return { data, total, page, pageSize };
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单条支出记录",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const expense = await expenseRepository.findOneBy({ id });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }
      return expense;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建支出记录",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["amount", "category", "paymentDate"],
          properties: {
            amount: { type: "number", description: "金额" },
            category: { type: "string", description: "分类" },
            subItem: { type: "string", description: "子项" },
            supplierName: { type: "string", description: "供应商名称" },
            paymentMethod: { type: "string", description: "支付方式" },
            paymentDate: { type: "string", format: "date-time", description: "支付日期" },
            voucherImageUrl: { type: "string", description: "凭证图片URL" },
            remarks: { type: "string", description: "备注" },
            status: { type: "string", description: "状态", default: "待付" },
          },
        },
      },
    },
    async (request) => {
      const body = request.body as any;
      const expense = expenseRepository.create(body);
      return await expenseRepository.save(expense);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新支出记录",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            amount: { type: "number", description: "金额" },
            category: { type: "string", description: "分类" },
            subItem: { type: "string", description: "子项" },
            supplierName: { type: "string", description: "供应商名称" },
            paymentMethod: { type: "string", description: "支付方式" },
            paymentDate: { type: "string", format: "date-time", description: "支付日期" },
            voucherImageUrl: { type: "string", description: "凭证图片URL" },
            remarks: { type: "string", description: "备注" },
            status: { type: "string", description: "状态" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const expense = await expenseRepository.findOneBy({ id });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }
      expenseRepository.merge(expense, body);
      return await expenseRepository.save(expense);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除支出记录",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await expenseRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/import",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "导入CSV支出数据",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["filePath"],
          properties: {
            filePath: { type: "string", description: "CSV文件路径" },
          },
        },
      },
    },
    async (request) => {
      const { filePath } = request.body as any;
      const csv = require("csv-parser");
      const results: any[] = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data: any) => results.push(data))
          .on("end", resolve)
          .on("error", reject);
      });

      const errors: { line: number; reason: string }[] = [];
      const validExpenses: Expense[] = [];

      results.forEach((row, index) => {
        const lineNumber = index + 2;
        const rowErrors: string[] = [];

        if (!row.amount) {
          rowErrors.push("金额不能为空");
        } else {
          const amount = parseFloat(row.amount);
          if (isNaN(amount)) {
            rowErrors.push("金额必须是有效数字");
          } else if (amount <= 0) {
            rowErrors.push("金额必须为正数");
          }
        }

        if (!row.category) {
          rowErrors.push("分类不能为空");
        } else if (!VALID_CATEGORIES.includes(row.category as BudgetCategoryName)) {
          rowErrors.push(`分类 "${row.category}" 不在有效分类列表中`);
        }

        if (!row.paymentDate) {
          rowErrors.push("支付日期不能为空");
        } else {
          const date = new Date(row.paymentDate);
          if (isNaN(date.getTime())) {
            rowErrors.push("支付日期格式无效");
          }
        }

        if (rowErrors.length > 0) {
          errors.push({
            line: lineNumber,
            reason: rowErrors.join("; "),
          });
        } else {
          const expense = expenseRepository.create({
            amount: parseFloat(row.amount),
            category: row.category,
            subItem: row.subItem,
            supplierName: row.supplierName,
            paymentMethod: row.paymentMethod,
            paymentDate: new Date(row.paymentDate),
            voucherImageUrl: row.voucherImageUrl,
            remarks: row.remarks,
            status: row.status || "待付",
          });
          validExpenses.push(expense);
        }
      });

      if (validExpenses.length > 0) {
        await expenseRepository.save(validExpenses);
      }

      return {
        success: validExpenses.length,
        failed: errors.length,
        errors,
      };
    }
  );

  fastify.get(
    "/export/all",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "导出所有账单为CSV",
        tags: ["支出管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const expenses = await expenseRepository.find({ order: { paymentDate: "DESC" } });
      const parser = new Parser();
      const csv = parser.parse(expenses);

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="wedding-expenses-${Date.now()}.csv"`);
      return reply.send("\uFEFF" + csv);
    }
  );
}
