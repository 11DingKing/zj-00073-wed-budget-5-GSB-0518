import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { AlertRule, RuleType, SeverityLevel } from "../entities/AlertRule";
import { Alert, AlertStatus } from "../entities/Alert";
import { Expense } from "../entities/Expense";
import { Between, LessThan, Raw } from "typeorm";

export async function alertRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const ruleRepository = AppDataSource.getRepository(AlertRule);
  const alertRepository = AppDataSource.getRepository(Alert);
  const expenseRepository = AppDataSource.getRepository(Expense);

  fastify.get(
    "/rules",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有预警规则",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return ruleRepository.find({
        order: { createdAt: "DESC" },
      });
    }
  );

  fastify.get(
    "/rules/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个预警规则详情",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "规则ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const rule = await ruleRepository.findOne({
        where: { id },
        relations: ["alerts"],
      });
      if (!rule) {
        return reply.status(404).send({ message: "规则不存在" });
      }
      return rule;
    }
  );

  fastify.post(
    "/rules",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建预警规则",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "ruleType"],
          properties: {
            name: { type: "string", description: "规则名称" },
            ruleType: {
              type: "string",
              enum: ["category_weekly_spend", "total_spend_growth", "supplier_payment_overdue"],
              description: "规则类型",
            },
            thresholdAmount: { type: "number", description: "金额阈值" },
            thresholdPercentage: { type: "number", description: "百分比阈值" },
            thresholdDays: { type: "number", description: "天数阈值" },
            categoryName: { type: "string", description: "分类名称" },
            supplierName: { type: "string", description: "供应商名称" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "严重程度",
            },
            isEnabled: { type: "boolean", description: "是否启用" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const rule = ruleRepository.create(body);
        return await ruleRepository.save(rule);
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/rules/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新预警规则",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "规则ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "规则名称" },
            ruleType: {
              type: "string",
              enum: ["category_weekly_spend", "total_spend_growth", "supplier_payment_overdue"],
              description: "规则类型",
            },
            thresholdAmount: { type: "number", description: "金额阈值" },
            thresholdPercentage: { type: "number", description: "百分比阈值" },
            thresholdDays: { type: "number", description: "天数阈值" },
            categoryName: { type: "string", description: "分类名称" },
            supplierName: { type: "string", description: "供应商名称" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "严重程度",
            },
            isEnabled: { type: "boolean", description: "是否启用" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const rule = await ruleRepository.findOneBy({ id });
      if (!rule) {
        return reply.status(404).send({ message: "规则不存在" });
      }
      ruleRepository.merge(rule, body);
      return await ruleRepository.save(rule);
    }
  );

  fastify.delete(
    "/rules/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "删除预警规则",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "规则ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await ruleRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "规则不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有预警记录",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        query: {
          type: "object",
          properties: {
            status: { type: "string", description: "状态筛选" },
            severity: { type: "string", description: "严重程度筛选" },
          },
        },
      },
    },
    async (request) => {
      const { status, severity } = request.query as any;
      const where: any = {};
      if (status) where.status = status;
      if (severity) where.severity = severity;

      return alertRepository.find({
        where,
        relations: ["rule"],
        order: { createdAt: "DESC" },
      });
    }
  );

  fastify.post(
    "/:id/acknowledge",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "确认预警",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "预警ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const alert = await alertRepository.findOneBy({ id });
      if (!alert) {
        return reply.status(404).send({ message: "预警不存在" });
      }
      alert.status = "acknowledged";
      alert.acknowledgedAt = new Date();
      return await alertRepository.save(alert);
    }
  );

  fastify.post(
    "/:id/resolve",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "解决预警",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "预警ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            note: { type: "string", description: "处理备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { note } = request.body as any;
      const alert = await alertRepository.findOneBy({ id });
      if (!alert) {
        return reply.status(404).send({ message: "预警不存在" });
      }
      alert.status = "resolved";
      alert.resolvedAt = new Date();
      alert.resolvedNote = note;
      return await alertRepository.save(alert);
    }
  );

  fastify.post(
    "/check",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "检查并触发预警规则",
        tags: ["预警管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const rules = await ruleRepository.find({ where: { isEnabled: true } });
      const triggeredAlerts = [];

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      for (const rule of rules) {
        if (rule.ruleType === "category_weekly_spend" && rule.categoryName && rule.thresholdAmount) {
          const expenses = await expenseRepository.find({
            where: {
              category: rule.categoryName as any,
              paymentDate: Between(oneWeekAgo, new Date()),
            },
          });
          const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

          if (totalSpent > rule.thresholdAmount) {
            const existingAlert = await alertRepository.findOne({
              where: {
                rule: { id: rule.id },
                status: Raw(`(status = 'pending' OR status = 'acknowledged')`),
              },
            });

            if (!existingAlert) {
              const alert = alertRepository.create({
                rule,
                message: `${rule.categoryName} 本周支出 ${totalSpent.toFixed(2)} 已超过阈值 ${rule.thresholdAmount}`,
                severity: rule.severity,
                actualValue: totalSpent,
                categoryName: rule.categoryName,
              });
              triggeredAlerts.push(await alertRepository.save(alert));
            }
          }
        }

        if (rule.ruleType === "supplier_payment_overdue" && rule.supplierName && rule.thresholdDays) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() - rule.thresholdDays);

          const overdueExpenses = await expenseRepository.find({
            where: {
              supplierName: rule.supplierName,
              status: "待付" as any,
              paymentDate: LessThan(dueDate),
            },
          });

          if (overdueExpenses.length > 0) {
            const existingAlert = await alertRepository.findOne({
              where: {
                rule: { id: rule.id },
                status: Raw(`(status = 'pending' OR status = 'acknowledged')`),
              },
            });

            if (!existingAlert) {
              const alert = alertRepository.create({
                rule,
                message: `${rule.supplierName} 有 ${overdueExpenses.length} 笔款项已逾期超过 ${rule.thresholdDays} 天`,
                severity: rule.severity,
                actualValue: overdueExpenses.length,
                supplierName: rule.supplierName,
              });
              triggeredAlerts.push(await alertRepository.save(alert));
            }
          }
        }

        if (rule.ruleType === "total_spend_growth" && rule.thresholdPercentage) {
          const thisWeekExpenses = await expenseRepository.find({
            where: { paymentDate: Between(oneWeekAgo, new Date()) },
          });
          const lastWeekExpenses = await expenseRepository.find({
            where: { paymentDate: Between(twoWeeksAgo, oneWeekAgo) },
          });

          const thisWeekTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
          const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

          if (lastWeekTotal > 0) {
            const growthRate = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
            if (growthRate > rule.thresholdPercentage) {
              const existingAlert = await alertRepository.findOne({
                where: {
                  rule: { id: rule.id },
                  status: Raw(`(status = 'pending' OR status = 'acknowledged')`),
                },
              });

              if (!existingAlert) {
                const alert = alertRepository.create({
                  rule,
                  message: `总支出增长率 ${growthRate.toFixed(2)}% 已超过阈值 ${rule.thresholdPercentage}%`,
                  severity: rule.severity,
                  actualValue: growthRate,
                });
                triggeredAlerts.push(await alertRepository.save(alert));
              }
            }
          }
        }
      }

      return {
        message: "规则检查完成",
        triggeredCount: triggeredAlerts.length,
        triggeredAlerts,
      };
    }
  );
}
