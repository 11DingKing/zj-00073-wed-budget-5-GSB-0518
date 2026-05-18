import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Vendor } from "../entities/Vendor";
import { VendorQuote } from "../entities/VendorQuote";
import { BudgetItem } from "../entities/BudgetItem";
import { BudgetCategory } from "../entities/BudgetCategory";

export async function vendorRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const vendorRepository = AppDataSource.getRepository(Vendor);
  const quoteRepository = AppDataSource.getRepository(VendorQuote);
  const itemRepository = AppDataSource.getRepository(BudgetItem);
  const categoryRepository = AppDataSource.getRepository(BudgetCategory);

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
      const vendors = await vendorRepository.find({ relations: ["category"] });
      return { data: vendors, total: vendors.length };
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个供应商",
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
        relations: ["category"],
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
      onRequest: [fastify.adminOnly],
      schema: {
        description: "创建供应商（Admin）",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", description: "供应商名称" },
            categoryId: { type: "number", description: "预算分类ID" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分 1-5" },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const { categoryId, ...rest } = body;
        const vendor = vendorRepository.create(rest);
        if (categoryId) {
          const category = await categoryRepository.findOneBy({ id: categoryId });
          if (!category) {
            return reply.status(400).send({ message: "预算分类不存在" });
          }
          (vendor as any).category = category;
        }
        return await vendorRepository.save(vendor);
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "更新供应商（Admin）",
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
            categoryId: { type: "number", description: "预算分类ID" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分 1-5" },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const vendor = await vendorRepository.findOneBy({ id });
      if (!vendor) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      const { categoryId, ...rest } = body;
      vendorRepository.merge(vendor, rest);
      if (categoryId !== undefined) {
        if (categoryId === null) {
          (vendor as any).category = null;
        } else {
          const category = await categoryRepository.findOneBy({ id: categoryId });
          if (!category) {
            return reply.status(400).send({ message: "预算分类不存在" });
          }
          (vendor as any).category = category;
        }
      }
      return await vendorRepository.save(vendor);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除供应商（Admin）",
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
    "/quotes",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有报价",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const quotes = await quoteRepository.find({
        relations: ["vendor", "budgetItem"],
        order: { quotedAt: "DESC" },
      });
      return { data: quotes, total: quotes.length };
    }
  );

  fastify.get(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个报价",
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
      const quote = await quoteRepository.findOne({
        where: { id },
        relations: ["vendor", "budgetItem"],
      });
      if (!quote) {
        return reply.status(404).send({ message: "报价不存在" });
      }
      return quote;
    }
  );

  fastify.post(
    "/quotes",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建报价",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["vendorId", "budgetItemId", "quotedPrice"],
          properties: {
            vendorId: { type: "number", description: "供应商ID" },
            budgetItemId: { type: "number", description: "预算项ID" },
            quotedPrice: { type: "number", description: "报价金额" },
            currency: { type: "string", description: "币种 (默认 CNY)" },
            quotedAt: { type: "string", description: "报价时间" },
            expiresAt: { type: "string", description: "过期时间" },
            status: { type: "string", description: "状态 pending/accepted/rejected" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const vendor = await vendorRepository.findOneBy({ id: body.vendorId });
        if (!vendor) {
          return reply.status(400).send({ message: "供应商不存在" });
        }
        const budgetItem = await itemRepository.findOneBy({ id: body.budgetItemId });
        if (!budgetItem) {
          return reply.status(400).send({ message: "预算项不存在" });
        }
        const { vendorId, budgetItemId, ...rest } = body;
        const quote = quoteRepository.create({
          ...rest,
          vendor,
          budgetItem,
          currency: rest.currency || "CNY",
          status: rest.status || "pending",
        } as any);
        return await quoteRepository.save(quote);
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新报价状态",
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
            expiresAt: { type: "string", description: "过期时间" },
            status: { type: "string", description: "状态 pending/accepted/rejected" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const quote = await quoteRepository.findOneBy({ id });
      if (!quote) {
        return reply.status(404).send({ message: "报价不存在" });
      }
      quoteRepository.merge(quote, body);
      return await quoteRepository.save(quote);
    }
  );

  fastify.delete(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "删除报价",
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
      const result = await quoteRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "报价不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/compare",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "供应商报价对比列表",
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
      const budgetItem = await itemRepository.findOneBy({ id: budgetItemId });
      if (!budgetItem) {
        return reply.status(404).send({ message: "预算项不存在" });
      }
      const quotes = await quoteRepository.find({
        where: { budgetItem: { id: budgetItemId } },
        relations: ["vendor", "budgetItem"],
        order: { quotedPrice: "ASC" },
      });
      const now = new Date();
      return {
        budgetItem,
        quotes: quotes.map((q: any) => ({
          id: q.id,
          vendorName: q.vendor.name,
          vendorRating: q.vendor.rating,
          quotedPrice: q.quotedPrice,
          currency: q.currency,
          quotedAt: q.quotedAt,
          expiresAt: q.expiresAt,
          status: q.status,
          expired: !!(q.expiresAt && new Date(q.expiresAt) < now),
        })),
      };
    }
  );
}
