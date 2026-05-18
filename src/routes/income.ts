import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Income } from "../entities/Income";

export async function incomeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const incomeRepository = AppDataSource.getRepository(Income);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有收入记录",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return incomeRepository.find({ order: { receivedDate: "DESC" } });
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单条收入记录",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "收入ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const income = await incomeRepository.findOneBy({ id });
      if (!income) {
        return reply.status(404).send({ message: "收入记录不存在" });
      }
      return income;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建收入记录",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["amount", "receivedDate"],
          properties: {
            amount: { type: "number", description: "金额" },
            source: { type: "string", description: "来源", default: "其他" },
            from: { type: "string", description: "来自谁" },
            receivedDate: { type: "string", format: "date-time", description: "收到日期" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request) => {
      const body = request.body as any;
      const income = incomeRepository.create(body);
      return await incomeRepository.save(income);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新收入记录",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "收入ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            amount: { type: "number", description: "金额" },
            source: { type: "string", description: "来源" },
            from: { type: "string", description: "来自谁" },
            receivedDate: { type: "string", format: "date-time", description: "收到日期" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const income = await incomeRepository.findOneBy({ id });
      if (!income) {
        return reply.status(404).send({ message: "收入记录不存在" });
      }
      incomeRepository.merge(income, body);
      return await incomeRepository.save(income);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除收入记录",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "收入ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await incomeRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "收入记录不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/summary/by-source",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "按来源汇总收入",
        tags: ["收入管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const incomes = await incomeRepository.find();
      const summary: any = {};
      for (const income of incomes) {
        if (!summary[income.source]) {
          summary[income.source] = {
            source: income.source,
            totalAmount: 0,
            count: 0,
          };
        }
        summary[income.source].totalAmount += parseFloat(income.amount as any);
        summary[income.source].count++;
      }
      return Object.values(summary);
    }
  );
}
