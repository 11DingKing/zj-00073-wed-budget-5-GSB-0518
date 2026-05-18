import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Expense, ApprovalStatus } from "../entities/Expense";
import { User } from "../entities/User";

export async function approvalRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const expenseRepository = AppDataSource.getRepository(Expense);
  const userRepository = AppDataSource.getRepository(User);

  fastify.get(
    "/pending",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "获取所有待审批支出",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", description: "页码", default: 1 },
            pageSize: { type: "number", description: "每页数量", default: 20 },
          },
        },
      },
    },
    async (request: any) => {
      const { page, pageSize } = request.query;
      const [data, total] = await expenseRepository.findAndCount({
        where: { approvalStatus: "待审批" },
        relations: ["submittedBy"],
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { createdAt: "DESC" },
      });
      return { data, total, page, pageSize };
    }
  );

  fastify.get(
    "/my-submissions",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取我提交的支出审批状态",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            approvalStatus: { type: "string", description: "审批状态筛选" },
            page: { type: "number", description: "页码", default: 1 },
            pageSize: { type: "number", description: "每页数量", default: 20 },
          },
        },
      },
    },
    async (request: any) => {
      const { approvalStatus, page, pageSize } = request.query;
      const where: any = { submittedBy: { id: request.user.id } };
      if (approvalStatus) where.approvalStatus = approvalStatus;

      const [data, total] = await expenseRepository.findAndCount({
        where,
        relations: ["approvedBy"],
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { createdAt: "DESC" },
      });
      return { data, total, page, pageSize };
    }
  );

  fastify.post(
    "/submit/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "提交支出审批（Couple角色）",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const user = request.user as any;

      const expense = await expenseRepository.findOneBy({ id });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }

      if (expense.approvalStatus !== "待审批") {
        return reply.status(400).send({ message: "该支出已提交审批" });
      }

      const submitter = await userRepository.findOneBy({ id: user.id });
      expense.submittedBy = submitter;
      expense.approvalStatus = "待审批";

      await expenseRepository.save(expense);
      return { message: "已提交审批", expense };
    }
  );

  fastify.post(
    "/approve/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "批准支出（Admin角色）",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const user = request.user as any;

      const expense = await expenseRepository.findOneBy({ id });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }

      if (expense.approvalStatus !== "待审批") {
        return reply.status(409).send({ message: "该支出已被处理" });
      }

      const approver = await userRepository.findOneBy({ id: user.id });
      expense.approvalStatus = "已批准";
      expense.approvedBy = approver;
      expense.approvedAt = new Date();

      await expenseRepository.save(expense);
      return { message: "已批准支出", expense };
    }
  );

  fastify.post(
    "/reject/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "驳回支出（Admin角色）",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "支出ID" },
          },
        },
        body: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: { type: "string", description: "驳回原因" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { reason } = request.body as any;
      const user = request.user as any;

      const expense = await expenseRepository.findOneBy({ id });
      if (!expense) {
        return reply.status(404).send({ message: "支出记录不存在" });
      }

      if (expense.approvalStatus !== "待审批") {
        return reply.status(409).send({ message: "该支出已被处理" });
      }

      const approver = await userRepository.findOneBy({ id: user.id });
      expense.approvalStatus = "已驳回";
      expense.rejectionReason = reason;
      expense.approvedBy = approver;
      expense.approvedAt = new Date();

      await expenseRepository.save(expense);
      return { message: "已驳回支出", expense };
    }
  );

  fastify.get(
    "/statistics",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取审批统计",
        tags: ["审批管理"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const pending = await expenseRepository.count({ where: { approvalStatus: "待审批" } });
      const approved = await expenseRepository.count({ where: { approvalStatus: "已批准" } });
      const rejected = await expenseRepository.count({ where: { approvalStatus: "已驳回" } });

      const approvedTotal = await expenseRepository
        .createQueryBuilder("expense")
        .select("SUM(expense.amount)", "total")
        .where("expense.approvalStatus = :status", { status: "已批准" })
        .getRawOne();

      return {
        pending,
        approved,
        rejected,
        approvedTotalAmount: approvedTotal.total || 0,
      };
    }
  );
}
