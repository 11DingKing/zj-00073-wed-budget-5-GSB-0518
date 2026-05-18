import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { Installment } from "../entities/Installment";

export async function installmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const installmentRepository = AppDataSource.getRepository(Installment);

  async function updateOverdueStatus() {
    const installments = await installmentRepository.find({
      where: { status: "待付" as any },
    });
    const now = new Date();
    for (const installment of installments) {
      if (new Date(installment.dueDate) < now) {
        installment.status = "逾期";
        await installmentRepository.save(installment);
      }
    }
  }

  fastify.addHook("onRequest", async () => {
    await updateOverdueStatus();
  });

  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取所有分期付款记录",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      return installmentRepository.find({ order: { dueDate: "ASC" } });
    }
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取单条分期付款记录",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分期付款ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const installment = await installmentRepository.findOneBy({ id });
      if (!installment) {
        return reply.status(404).send({ message: "分期付款记录不存在" });
      }
      return installment;
    }
  );

  fastify.post(
    "/contract",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建分期合同（自动生成分期付款记录）",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["supplierName", "totalAmount", "installmentCount", "firstDueDate"],
          properties: {
            supplierName: { type: "string", description: "供应商名称" },
            totalAmount: { type: "number", description: "总金额" },
            installmentCount: { type: "number", description: "分期数" },
            firstDueDate: { type: "string", format: "date-time", description: "首期付款日期" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request) => {
      const { supplierName, totalAmount, installmentCount, firstDueDate, remarks } = request.body as any;
      const perInstallmentAmount = totalAmount / installmentCount;
      const installments = [];

      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const installment = installmentRepository.create({
          supplierName,
          totalAmount,
          installmentCount,
          perInstallmentAmount,
          installmentNumber: i + 1,
          dueDate,
          status: "待付",
          remarks,
        });
        installments.push(await installmentRepository.save(installment));
      }

      return installments;
    }
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "创建单条分期付款记录",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["supplierName", "totalAmount", "installmentCount", "perInstallmentAmount", "installmentNumber", "dueDate"],
          properties: {
            supplierName: { type: "string", description: "供应商名称" },
            totalAmount: { type: "number", description: "总金额" },
            installmentCount: { type: "number", description: "分期数" },
            perInstallmentAmount: { type: "number", description: "每期金额" },
            installmentNumber: { type: "number", description: "第几期" },
            dueDate: { type: "string", format: "date-time", description: "截止日期" },
            status: { type: "string", description: "状态", default: "待付" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request) => {
      const body = request.body as any;
      const installment = installmentRepository.create(body);
      return await installmentRepository.save(installment);
    }
  );

  fastify.put(
    "/:id/pay",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "标记分期付款",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分期付款ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const installment = await installmentRepository.findOneBy({ id });
      if (!installment) {
        return reply.status(404).send({ message: "分期付款记录不存在" });
      }
      installment.status = "已付";
      return await installmentRepository.save(installment);
    }
  );

  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "更新分期付款记录",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分期付款ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            supplierName: { type: "string", description: "供应商名称" },
            totalAmount: { type: "number", description: "总金额" },
            installmentCount: { type: "number", description: "分期数" },
            perInstallmentAmount: { type: "number", description: "每期金额" },
            installmentNumber: { type: "number", description: "第几期" },
            dueDate: { type: "string", format: "date-time", description: "截止日期" },
            status: { type: "string", description: "状态" },
            remarks: { type: "string", description: "备注" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const installment = await installmentRepository.findOneBy({ id });
      if (!installment) {
        return reply.status(404).send({ message: "分期付款记录不存在" });
      }
      installmentRepository.merge(installment, body);
      return await installmentRepository.save(installment);
    }
  );

  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        description: "删除分期付款记录",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "分期付款ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const result = await installmentRepository.delete(id);
      if (result.affected === 0) {
        return reply.status(404).send({ message: "分期付款记录不存在" });
      }
      return { message: "删除成功" };
    }
  );

  fastify.get(
    "/overdue/reminders",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取逾期提醒列表",
        tags: ["分期付款"],
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const overdue = await installmentRepository.find({
        where: { status: "逾期" as any },
        order: { dueDate: "ASC" },
      });
      return {
        count: overdue.length,
        overdueList: overdue,
        message: `共有 ${overdue.length} 笔逾期款项需要处理`,
      };
    }
  );
}
