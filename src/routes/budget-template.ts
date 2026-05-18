import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { BudgetTemplate, TemplateType } from "../entities/BudgetTemplate";
import { BudgetCategory } from "../entities/BudgetCategory";

export async function budgetTemplateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const templateRepository = AppDataSource.getRepository(BudgetTemplate);
  const categoryRepository = AppDataSource.getRepository(BudgetCategory);

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有预算模板",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return templateRepository.find({
        where: { isActive: true },
        order: { totalBudget: "ASC" },
      });
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个预算模板详情",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "模板ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const template = await templateRepository.findOneBy({ id });
      if (!template) {
        return reply.status(404).send({ message: "模板不存在" });
      }
      return template;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "创建预算模板",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "totalBudget", "description", "categories"],
          properties: {
            name: { type: "string", description: "模板名称" },
            totalBudget: { type: "number", description: "总预算" },
            description: { type: "string", description: "描述" },
            categories: {
              type: "array",
              description: "分类预算配置",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  percentage: { type: "number" },
                  description: { type: "string" },
                },
              },
            },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const template = templateRepository.create(body);
        return await templateRepository.save(template);
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
        description: "更新预算模板",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "模板ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "模板名称" },
            totalBudget: { type: "number", description: "总预算" },
            description: { type: "string", description: "描述" },
            categories: {
              type: "array",
              description: "分类预算配置",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  percentage: { type: "number" },
                  description: { type: "string" },
                },
              },
            },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const template = await templateRepository.findOneBy({ id });
      if (!template) {
        return reply.status(404).send({ message: "模板不存在" });
      }
      templateRepository.merge(template, body);
      return await templateRepository.save(template);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除预算模板",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "模板ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await templateRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "模板不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/:id/apply",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "应用预算模板到当前预算",
        tags: ["预算模板"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "模板ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            customTotalBudget: { type: "number", description: "自定义总预算（可选）" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { customTotalBudget } = request.body as any;

      const template = await templateRepository.findOneBy({ id });
      if (!template) {
        return reply.status(404).send({ message: "模板不存在" });
      }

      const totalBudget = customTotalBudget || template.totalBudget;
      const result = [];

      for (const templateCat of template.categories) {
        const category = await categoryRepository.findOne({
          where: { name: templateCat.name as any },
        });

        if (category) {
          const budgetLimit = (totalBudget * templateCat.percentage) / 100;
          category.budgetLimit = budgetLimit;
          await categoryRepository.save(category);
          result.push({
            category: category.name,
            budgetLimit,
            percentage: templateCat.percentage,
          });
        }
      }

      return {
        message: "模板应用成功",
        totalBudget,
        templateName: template.name,
        categories: result,
      };
    }
  );
}
