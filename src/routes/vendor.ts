import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Vendor } from "../entities/Vendor";
import { VendorQuote, QuoteStatus } from "../entities/VendorQuote";
import { BudgetItem } from "../entities/BudgetItem";

export async function vendorRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const vendorRepository = AppDataSource.getRepository(Vendor);
  const vendorQuoteRepository = AppDataSource.getRepository(VendorQuote);
  const budgetItemRepository = AppDataSource.getRepository(BudgetItem);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有供应商",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return vendorRepository.find({ order: { createdAt: "DESC" } });
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个供应商详情",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "供应商ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const vendor = await vendorRepository.findOne({
        where: { id },
        relations: ["quotes"],
      });
      if (!vendor) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      return vendor;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建供应商",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "category"],
          properties: {
            name: { type: "string", description: "供应商名称" },
            category: { type: "string", description: "预算分类" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分1-5", default: 3 },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      if (body.rating && (body.rating < 1 || body.rating > 5)) {
        return reply.status(400).send({ message: "评分必须在1-5之间" });
      }
      const vendor = vendorRepository.create(body);
      return await vendorRepository.save(vendor);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新供应商",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "供应商ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "供应商名称" },
            category: { type: "string", description: "预算分类" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分1-5" },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      if (body.rating && (body.rating < 1 || body.rating > 5)) {
        return reply.status(400).send({ message: "评分必须在1-5之间" });
      }
      const vendor = await vendorRepository.findOneBy({ id });
      if (!vendor) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      vendorRepository.merge(vendor, body);
      return await vendorRepository.save(vendor);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除供应商",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "供应商ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await vendorRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/compare",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "对比某个预算项下所有供应商报价",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["budgetItemId"],
          properties: {
            budgetItemId: { type: "number", description: "预算项ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { budgetItemId } = request.query as any;
      const budgetItem = await budgetItemRepository.findOneBy({
        id: budgetItemId,
      });
      if (!budgetItem) {
        return reply.status(404).send({ message: "预算项不存在" });
      }

      const quotes = await vendorQuoteRepository.find({
        where: { budgetItemId },
        relations: ["vendor"],
        order: { quotedPrice: "ASC" },
      });

      const now = new Date();
      const compareList = quotes.map((q) => ({
        quoteId: q.id,
        vendorId: q.vendorId,
        vendorName: q.vendor.name,
        vendorRating: q.vendor.rating,
        quotedPrice: q.quotedPrice,
        currency: q.currency,
        quotedAt: q.quotedAt,
        expiresAt: q.expiresAt,
        status: q.status,
        expired: q.expiresAt ? new Date(q.expiresAt) < now : false,
      }));

      return {
        budgetItemId: budgetItem.id,
        budgetItemName: budgetItem.name,
        estimatedCost: budgetItem.estimatedCost,
        quoteCount: compareList.length,
        compareList,
      };
    }
  );

  fastify.get(
    "/quotes",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有报价记录",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return vendorQuoteRepository.find({
        relations: ["vendor", "budgetItem"],
        order: { quotedAt: "DESC" },
      });
    }
  );

  fastify.get(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单条报价详情",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "报价ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const quote = await vendorQuoteRepository.findOne({
        where: { id },
        relations: ["vendor", "budgetItem"],
      });
      if (!quote) {
        return reply.status(404).send({ message: "报价记录不存在" });
      }
      return quote;
    }
  );

  fastify.post(
    "/quotes",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建报价记录",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["vendorId", "budgetItemId", "quotedPrice", "quotedAt"],
          properties: {
            vendorId: { type: "number", description: "供应商ID" },
            budgetItemId: { type: "number", description: "预算项ID" },
            quotedPrice: { type: "number", description: "报价金额" },
            currency: { type: "string", description: "币种", default: "CNY" },
            quotedAt: {
              type: "string",
              format: "date-time",
              description: "报价日期",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "过期日期",
            },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected"],
              description: "状态",
              default: "pending",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      const vendor = await vendorRepository.findOneBy({ id: body.vendorId });
      if (!vendor) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      const budgetItem = await budgetItemRepository.findOneBy({
        id: body.budgetItemId,
      });
      if (!budgetItem) {
        return reply.status(404).send({ message: "预算项不存在" });
      }
      const quote = vendorQuoteRepository.create(body);
      return await vendorQuoteRepository.save(quote);
    }
  );

  fastify.put(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新报价记录",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "报价ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            quotedPrice: { type: "number", description: "报价金额" },
            currency: { type: "string", description: "币种" },
            quotedAt: {
              type: "string",
              format: "date-time",
              description: "报价日期",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "过期日期",
            },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected"],
              description: "状态",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const quote = await vendorQuoteRepository.findOneBy({ id });
      if (!quote) {
        return reply.status(404).send({ message: "报价记录不存在" });
      }
      vendorQuoteRepository.merge(quote, body);
      return await vendorQuoteRepository.save(quote);
    }
  );

  fastify.delete(
    "/quotes/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除报价记录",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "报价ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await vendorQuoteRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "报价记录不存在" });
      }
      return { message: "删除成功" };
    }
  );
}
