import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import crypto from "crypto";

export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const userRepository = AppDataSource.getRepository(User);

  fastify.post(
    "/login",
    {
      schema: {
        description: "用户登录",
        tags: ["认证"],
        body: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", description: "用户名" },
            password: { type: "string", description: "密码" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  username: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body as any;
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      const user = await userRepository.findOne({
        where: { username, password: hashedPassword },
      });

      if (!user) {
        return reply.status(401).send({ message: "用户名或密码错误" });
      }

      const token = fastify.jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        token,
        user: { id: user.id, username: user.username, role: user.role },
      };
    }
  );

  fastify.get(
    "/profile",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "获取当前用户信息",
        tags: ["认证"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "number" },
              username: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any) => {
      return request.user;
    }
  );
}
