import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { SharedAccess, ShareRole } from "../entities/SharedAccess";
import { Expense } from "../entities/Expense";
import crypto from "crypto";

export async function sharedAccessRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const sharedAccessRepository = AppDataSource.getRepository(SharedAccess);
  const expenseRepository = AppDataSource.getRepository(Expense);

  function generateShareToken(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  function generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有共享链接",
        tags: ["账单共享"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return sharedAccessRepository.find({
        order: { createdAt: "DESC" },
      });
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单个共享链接详情",
        tags: ["账单共享"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "共享ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const sharedAccess = await sharedAccessRepository.findOneBy({ id });
      if (!sharedAccess) {
        return reply.status(404).send({ message: "共享链接不存在" });
      }
      return sharedAccess;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建账单共享链接",
        tags: ["账单共享"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["shareName", "shareRole"],
          properties: {
            shareName: { type: "string", description: "共享名称" },
            shareRole: {
              type: "string",
              enum: ["parent", "friend", "family", "other"],
              description: "共享角色",
            },
            allowedCategories: {
              type: "array",
              description: "允许查看的分类列表",
              items: { type: "string" },
            },
            expiresInDays: {
              type: "number",
              description: "有效期（天）",
              default: 30,
            },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any;
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (body.expiresInDays || 30));

        const sharedAccess = sharedAccessRepository.create({
          shareName: body.shareName,
          shareRole: body.shareRole,
          allowedCategories: body.allowedCategories || null,
          accessPassword: generateAccessCode(),
          shareToken: generateShareToken(),
          expiresAt,
          viewCount: 0,
          isActive: true,
          description: body.description,
        });

        const saved = await sharedAccessRepository.save(sharedAccess);
        return {
          ...saved,
          shareUrl: `/api/shared-access/view/${saved.shareToken}`,
        };
      } catch (error: any) {
        return reply.status(400).send({ message: error.message });
      }
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新账单共享链接",
        tags: ["账单共享"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "共享ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            shareName: { type: "string", description: "共享名称" },
            shareRole: {
              type: "string",
              enum: ["parent", "friend", "family", "other"],
              description: "共享角色",
            },
            allowedCategories: {
              type: "array",
              description: "允许查看的分类列表",
              items: { type: "string" },
            },
            isActive: { type: "boolean", description: "是否启用" },
            description: { type: "string", description: "描述" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const sharedAccess = await sharedAccessRepository.findOneBy({ id });
      if (!sharedAccess) {
        return reply.status(404).send({ message: "共享链接不存在" });
      }
      sharedAccessRepository.merge(sharedAccess, body);
      return await sharedAccessRepository.save(sharedAccess);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "删除账单共享链接",
        tags: ["账单共享"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "共享ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await sharedAccessRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "共享链接不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.post(
    "/view/:token",
    {
      schema: {
        description: "通过token查看共享账单",
        tags: ["账单共享"],
        params: {
          type: "object",
          properties: {
            token: { type: "string", description: "共享token" },
          },
        },
        body: {
          type: "object",
          required: ["accessPassword"],
          properties: {
            accessPassword: { type: "string", description: "访问密码" },
          },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as any;
      const { accessPassword } = request.body as any;

      const sharedAccess = await sharedAccessRepository.findOneBy({
        shareToken: token,
      });

      if (!sharedAccess) {
        return reply.status(404).send({ message: "共享链接不存在" });
      }

      if (!sharedAccess.isActive) {
        return reply.status(403).send({ message: "共享链接已禁用" });
      }

      if (new Date() > sharedAccess.expiresAt) {
        return reply.status(403).send({ message: "共享链接已过期" });
      }

      if (sharedAccess.accessPassword !== accessPassword) {
        return reply.status(403).send({ message: "访问密码错误" });
      }

      sharedAccess.viewCount += 1;
      sharedAccess.lastViewedAt = new Date();
      await sharedAccessRepository.save(sharedAccess);

      let expenses: Expense[];
      if (sharedAccess.allowedCategories && sharedAccess.allowedCategories.length > 0) {
        const categoryConditions = sharedAccess.allowedCategories.map((cat) => ({
          category: cat as any,
        }));
        expenses = await expenseRepository.find({
          where: categoryConditions as any,
          order: { paymentDate: "DESC" },
        });
      } else {
        expenses = await expenseRepository.find({
          order: { paymentDate: "DESC" },
        });
      }

      const categorySummary = [];
      if (sharedAccess.allowedCategories && sharedAccess.allowedCategories.length > 0) {
        for (const cat of sharedAccess.allowedCategories) {
          const catExpenses = expenses.filter((e) => e.category === cat);
          const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
          categorySummary.push({
            category: cat,
            totalAmount: total,
            expenseCount: catExpenses.length,
          });
        }
      }

      return {
        shareName: sharedAccess.shareName,
        shareRole: sharedAccess.shareRole,
        description: sharedAccess.description,
        allowedCategories: sharedAccess.allowedCategories,
        expenses,
        categorySummary,
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      };
    }
  );
}
