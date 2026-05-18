import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { AppDataSource } from "./data-source";
import { authRoutes } from "./routes/auth";
import { budgetRoutes } from "./routes/budget";
import { expenseRoutes } from "./routes/expense";
import { installmentRoutes } from "./routes/installment";
import { splitRoutes } from "./routes/split";
import { incomeRoutes } from "./routes/income";
import { reportRoutes } from "./routes/report";
import { approvalRoutes } from "./routes/approval";
import { recurringExpenseRoutes } from "./routes/recurring-expense";
import { exchangeRateRoutes } from "./routes/exchange-rate";
import { budgetTemplateRoutes } from "./routes/budget-template";
import { alertRoutes } from "./routes/alert";
import { sharedAccessRoutes } from "./routes/shared-access";
import { vendorRoutes } from "./routes/vendor";

export async function buildApp() {
  const app = fastify({ logger: true });

  await AppDataSource.initialize();

  await app.register(fastifyJwt, {
    secret: "wedding-budget-secret-key-2024",
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "婚礼预算与账单管理服务 API",
        description: "Wedding Budget and Bill Management Service",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "本地开发服务器",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  app.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  app.decorate("adminOnly", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      if (request.user.role !== "Admin") {
        reply.status(403).send({ message: "需要管理员权限" });
      }
    } catch (err) {
      reply.send(err);
    }
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(budgetRoutes, { prefix: "/api/budget" });
  await app.register(expenseRoutes, { prefix: "/api/expense" });
  await app.register(installmentRoutes, { prefix: "/api/installment" });
  await app.register(splitRoutes, { prefix: "/api/split" });
  await app.register(incomeRoutes, { prefix: "/api/income" });
  await app.register(reportRoutes, { prefix: "/api/report" });
  await app.register(approvalRoutes, { prefix: "/api/approval" });
  await app.register(recurringExpenseRoutes, {
    prefix: "/api/recurring-expense",
  });
  await app.register(exchangeRateRoutes, { prefix: "/api/exchange-rate" });
  await app.register(budgetTemplateRoutes, { prefix: "/api/budget-template" });
  await app.register(alertRoutes, { prefix: "/api/alert" });
  await app.register(sharedAccessRoutes, { prefix: "/api/shared-access" });
  await app.register(vendorRoutes, { prefix: "/api/vendors" });

  app.get("/health", async () => {
    return { status: "ok", message: "婚礼预算与账单管理服务运行正常" };
  });

  return app;
}
