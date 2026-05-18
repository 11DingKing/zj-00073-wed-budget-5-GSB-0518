import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { ExchangeRate } from "../entities/ExchangeRate";
import { CurrencyCode } from "../entities/Expense";

export async function exchangeRateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有汇率",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const rates = await exchangeRateRepository.find({ order: { currency: "ASC" } });
      return { data: rates, total: rates.length };
    }
  );

  fastify.get(
    "/:currency",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个币种汇率",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            currency: { type: "string", description: "币种代码 (USD/EUR/JPY等)" },
          },
        },
      },
    },
    async (request, reply) => {
      const { currency } = request.params as any;
      const rate = await exchangeRateRepository.findOneBy({ currency: currency as CurrencyCode });
      if (!rate) {
        return reply.status(404).send({ message: "汇率不存在" });
      }
      return rate;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "创建汇率（Admin）",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["currency", "currencyName", "rate"],
          properties: {
            currency: { type: "string", description: "币种代码" },
            currencyName: { type: "string", description: "币种名称" },
            rate: { type: "number", description: "对人民币汇率" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const existing = await exchangeRateRepository.findOneBy({ currency: body.currency });
        if (existing) {
          return reply.status(400).send({ message: "该币种汇率已存在" });
        }
        const rate = exchangeRateRepository.create({
          ...body,
          lastUpdated: new Date(),
        });
        return await exchangeRateRepository.save(rate);
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/:currency",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "更新汇率（Admin）",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            currency: { type: "string", description: "币种代码" },
          },
        },
        body: {
          type: "object",
          properties: {
            currencyName: { type: "string", description: "币种名称" },
            rate: { type: "number", description: "对人民币汇率" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { currency } = request.params as any;
      const body = request.body as any;
      const rate = await exchangeRateRepository.findOneBy({ currency });
      if (!rate) {
        return reply.status(404).send({ message: "汇率不存在" });
      }
      exchangeRateRepository.merge(rate, {
        ...body,
        lastUpdated: new Date(),
      });
      return await exchangeRateRepository.save(rate);
    }
  );

  fastify.delete(
    "/:currency",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除汇率（Admin）",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            currency: { type: "string", description: "币种代码" },
          },
        },
      },
    },
    async (request, reply) => {
      const { currency } = request.params as any;
      const result = await exchangeRateRepository.delete({ currency });
      if (result.affected === 0) {
        return reply.status(404).send({ message: "汇率不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/convert",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "货币转换计算",
        tags: ["汇率管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["fromCurrency", "amount"],
          properties: {
            fromCurrency: { type: "string", description: "源币种" },
            amount: { type: "number", description: "金额" },
          },
        },
      },
    },
    async (request, reply) => {
      const { fromCurrency, amount } = request.body as any;
      if (fromCurrency === "CNY") {
        return {
          fromCurrency,
          toCurrency: "CNY",
          originalAmount: amount,
          convertedAmount: amount,
          rate: 1,
        };
      }
      const rate = await exchangeRateRepository.findOneBy({ currency: fromCurrency });
      if (!rate) {
        return reply.status(404).send({ message: "不支持该币种汇率" });
      }
      const convertedAmount = Number((amount * rate.rate).toFixed(2));
      return {
        fromCurrency,
        toCurrency: "CNY",
        originalAmount: amount,
        convertedAmount,
        rate: rate.rate,
      };
    }
  );
}
