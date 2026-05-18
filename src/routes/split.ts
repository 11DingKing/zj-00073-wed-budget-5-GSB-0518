import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Split } from "../entities/Split";
import { Expense } from "../entities/Expense";

export async function splitRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const splitRepository = AppDataSource.getRepository(Split);
  const expenseRepository = AppDataSource.getRepository(Expense);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有费用分摊记录",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return splitRepository.find();
    }
  );

  fastify.get(
    "/expense/:expenseId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取某笔支出的分摊记录",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            expenseId: { type: "number", description: "支出ID" },
          },
        },
      },
    },
    async (request) => {
      const { expenseId } = request.params as any;
      return splitRepository.find({ where: { expenseId } });
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建费用分摊",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["expenseId", "splits"],
          properties: {
            expenseId: { type: "number", description: "支出ID" },
            splits: {
              type: "array",
              items: {
                type: "object",
                required: ["party", "percentage"],
                properties: {
                  party: { type: "string", description: "分摊方" },
                  percentage: { type: "number", description: "百分比" },
                  remarks: { type: "string", description: "备注" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { expenseId, splits } = request.body as any;
      const expense = await expenseRepository.findOneBy({ id: expenseId });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }

      const totalPercentage = splits.reduce((sum: number, s: any) => sum + s.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return reply.status(400).send({ message: "分摊百分比总和必须为100%" });
      }

      const result = [];
      for (const split of splits) {
        const amountDue = (expense.amount as any) * (split.percentage / 100);
        const splitRecord = splitRepository.create({
          expenseId,
          party: split.party,
          percentage: split.percentage,
          amountDue,
          amountPaid: 0,
          remarks: split.remarks,
        });
        result.push(await splitRepository.save(splitRecord));
      }

      return result;
    }
  );

  fastify.put(
    "/:id/pay",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "标记分摊款项为已付",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分摊记录ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            amountPaid: { type: "number", description: "已付金额" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { amountPaid } = request.body as any;
      const split = await splitRepository.findOneBy({ id });
      if (!split) {
        return reply.status(404).send({ message: "分摊记录不存在" });
      }
      split.amountPaid = amountPaid;
      return await splitRepository.save(split);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除分摊记录",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分摊记录ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await splitRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "分摊记录不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/summary/by-party",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "按分摊方汇总",
        tags: ["费用分摊"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const splits = await splitRepository.find();
      const summary: any = {};
      for (const split of splits) {
        if (!summary[split.party]) {
          summary[split.party] = {
            party: split.party,
            totalDue: 0,
            totalPaid: 0,
            remaining: 0,
          };
        }
        summary[split.party].totalDue += parseFloat(split.amountDue as any);
        summary[split.party].totalPaid += parseFloat(split.amountPaid as any);
        summary[split.party].remaining =
          summary[split.party].totalDue - summary[split.party].totalPaid;
      }
      return Object.values(summary);
    }
  );
}
