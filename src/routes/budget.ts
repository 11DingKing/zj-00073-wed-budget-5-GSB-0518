import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { BudgetCategory, BudgetCategoryName } from "../entities/BudgetCategory";
import { BudgetItem } from "../entities/BudgetItem";
import { Expense } from "../entities/Expense";

export async function budgetRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const categoryRepository = AppDataSource.getRepository(BudgetCategory);
  const itemRepository = AppDataSource.getRepository(BudgetItem);
  const expenseRepository = AppDataSource.getRepository(Expense);

  async function getBudgetWarning(categoryId: number) {
    const category = await categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category || category.budgetLimit <= 0) {
      return null;
    }

    const expenses = await expenseRepository.find({
      where: { category: category.name, status: "已付" },
    });
    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount as any),
      0
    );
    const percentage = (totalSpent / category.budgetLimit) * 100;

    let warning: "green" | "yellow" | "red" = "green";
    if (percentage >= 100) {
      warning = "red";
    } else if (percentage >= 80) {
      warning = "yellow";
    }

    return {
      category: category.name,
      budgetLimit: category.budgetLimit,
      totalSpent,
      percentage: Math.round(percentage * 100) / 100,
      warning,
    };
  }

  fastify.get(
    "/categories",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有预算分类",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return categoryRepository.find({ relations: ["items"] });
    }
  );

  fastify.post(
    "/categories",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "创建预算分类",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "budgetLimit"],
          properties: {
            name: { type: "string", description: "分类名称" },
            budgetLimit: { type: "number", description: "预算上限" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const category = categoryRepository.create(body);
        return await categoryRepository.save(category);
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/categories/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "更新预算分类",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分类ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "分类名称" },
            budgetLimit: { type: "number", description: "预算上限" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const category = await categoryRepository.findOneBy({ id });
      if (!category) {
        return reply.status(404).send({ message: "分类不存在" });
      }
      categoryRepository.merge(category, body);
      return await categoryRepository.save(category);
    }
  );

  fastify.delete(
    "/categories/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除预算分类",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分类ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await categoryRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "分类不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/categories/:id/items",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "添加预算子项",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分类ID" },
          },
        },
        body: {
          type: "object",
          required: ["name", "estimatedCost"],
          properties: {
            name: { type: "string", description: "子项名称" },
            estimatedCost: { type: "number", description: "预估费用" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const category = await categoryRepository.findOneBy({ id });
      if (!category) {
        return reply.status(404).send({ message: "分类不存在" });
      }
      const item = itemRepository.create({ ...body, category });
      return await itemRepository.save(item);
    }
  );

  fastify.get(
    "/warning",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有分类预算预警",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const categories = await categoryRepository.find();
      const warnings = [];
      for (const category of categories) {
        const warning = await getBudgetWarning(category.id);
        if (warning) {
          warnings.push(warning);
        }
      }
      return warnings;
    }
  );

  fastify.get(
    "/warning/:categoryId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取指定分类预算预警",
        tags: ["预算管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            categoryId: { type: "number", description: "分类ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { categoryId } = request.params as any;
      const warning = await getBudgetWarning(categoryId);
      if (!warning) {
        return reply.status(404).send({ message: "分类不存在或无预算" });
      }
      return warning;
    }
  );
}
