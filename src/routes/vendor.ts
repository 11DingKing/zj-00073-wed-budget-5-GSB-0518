import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Vendor } from "../entities/Vendor";
import { VendorQuote } from "../entities/VendorQuote";
import { BudgetItem } from "../entities/BudgetItem";

export async function vendorRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const vendorRepository = AppDataSource.getRepository(Vendor);
  const quoteRepository = AppDataSource.getRepository(VendorQuote);
  const budgetItemRepository = AppDataSource.getRepository(BudgetItem);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有供应商",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            category: { type: "string", description: "按分类筛选" },
          },
        },
      },
    },
    async (request) => {
      const { category } = request.query as any;
      const where: any = {};
      if (category) {
        where.category = category;
      }
      return vendorRepository.find({ where, order: { rating: "DESC" } });
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
        relations: ["quotes", "quotes.budgetItem"],
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
            category: { type: "string", description: "所属预算分类" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分 1-5", minimum: 1, maximum: 5 },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request) => {
      const body = request.body as any;
      const vendor = vendorRepository.create(body);
      return await vendorRepository.save(vendor);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新供应商信息",
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
            category: { type: "string", description: "所属预算分类" },
            contactPhone: { type: "string", description: "联系电话" },
            wechat: { type: "string", description: "微信号" },
            rating: { type: "number", description: "评分 1-5", minimum: 1, maximum: 5 },
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
    "/quotes",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有报价",
        tags: ["供应商比价"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            vendorId: { type: "number", description: "按供应商筛选" },
            budgetItemId: { type: "number", description: "按预算项筛选" },
            status: { type: "string", description: "按状态筛选" },
          },
        },
      },
    },
    async (request) => {
      const { vendorId, budgetItemId, status } = request.query as any;
      const where: any = {};
      if (vendorId) {
        where.vendor = { id: vendorId };
      }
      if (budgetItemId) {
        where.budgetItem = { id: budgetItemId };
      }
      if (status) {
        where.status = status;
      }
      return quoteRepository.find({
        where,
        relations: ["vendor", "budgetItem"],
        order: { quotedPrice: "ASC" },
      });
    }
  );

  fastify.get(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个报价详情",
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
          required: ["vendorId", "budgetItemId", "quotedPrice", "quotedAt"],
          properties: {
            vendorId: { type: "number", description: "供应商ID" },
            budgetItemId: { type: "number", description: "预算项ID" },
            quotedPrice: { type: "number", description: "报价金额" },
            currency: { type: "string", description: "货币", default: "CNY" },
            quotedAt: { type: "string", format: "date-time", description: "报价日期" },
            expiresAt: { type: "string", format: "date-time", description: "有效期至" },
            status: { type: "string", description: "状态", default: "pending" },
            notes: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { vendorId, budgetItemId, ...rest } = request.body as any;
      const vendor = await vendorRepository.findOneBy({ id: vendorId });
      if (!vendor) {
        return reply.status(404).send({ message: "供应商不存在" });
      }
      const budgetItem = await budgetItemRepository.findOneBy({ id: budgetItemId });
      if (!budgetItem) {
        return reply.status(404).send({ message: "预算项不存在" });
      }
      const quote = quoteRepository.create({
        ...rest,
        vendor,
        budgetItem,
      });
      return await quoteRepository.save(quote);
    }
  );

  fastify.put(
    "/quotes/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新报价",
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
            currency: { type: "string", description: "货币" },
            quotedAt: { type: "string", format: "date-time", description: "报价日期" },
            expiresAt: { type: "string", format: "date-time", description: "有效期至" },
            status: { type: "string", description: "状态" },
            notes: { type: "string", description: "备注" },
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
      onRequest: [fastify.adminOnly],
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
        description: "对比某个预算项下的所有供应商报价",
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
      const budgetItem = await budgetItemRepository.findOneBy({ id: budgetItemId });
      if (!budgetItem) {
        return reply.status(404).send({ message: "预算项不存在" });
      }

      const quotes = await quoteRepository
        .createQueryBuilder("quote")
        .leftJoinAndSelect("quote.vendor", "vendor")
        .leftJoinAndSelect("quote.budgetItem", "budgetItem")
        .where("quote.budgetItemId = :budgetItemId", { budgetItemId })
        .orderBy("quote.quotedPrice", "ASC")
        .getMany();

      const comparisonList = quotes.map((quote, index) => ({
        rank: index + 1,
        quoteId: quote.id,
        vendorId: quote.vendor.id,
        vendorName: quote.vendor.name,
        vendorRating: quote.vendor.rating,
        vendorCategory: quote.vendor.category,
        contactPhone: quote.vendor.contactPhone,
        wechat: quote.vendor.wechat,
        quotedPrice: quote.quotedPrice,
        currency: quote.currency,
        quotedAt: quote.quotedAt,
        expiresAt: quote.expiresAt,
        status: quote.status,
        notes: quote.notes,
        priceDifference: index === 0 ? 0 : quote.quotedPrice - quotes[0].quotedPrice,
      }));

      return {
        budgetItemId,
        budgetItemName: budgetItem.name,
        estimatedCost: budgetItem.estimatedCost,
        quoteCount: comparisonList.length,
        lowestPrice: comparisonList.length > 0 ? comparisonList[0].quotedPrice : 0,
        highestPrice: comparisonList.length > 0 ? comparisonList[comparisonList.length - 1].quotedPrice : 0,
        averagePrice: comparisonList.length > 0
          ? comparisonList.reduce((sum, item) => sum + item.quotedPrice, 0) / comparisonList.length
          : 0,
        comparisonList,
      };
    }
  );
}
