import { buildApp } from "./app";

async function start() {
  try {
    const app = await buildApp();
    const port = 3000;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 服务器运行在 http://localhost:${port}`);
    console.log(`📚 Swagger 文档: http://localhost:${port}/api/docs`);
  } catch (err) {
    console.error("启动服务器失败:", err);
    process.exit(1);
  }
}

start();
