import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import fs from "fs";

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./data/app.db",
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, "entities", "*.ts")],
  migrations: [],
  subscribers: [],
});
