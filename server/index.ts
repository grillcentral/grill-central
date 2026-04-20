import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  const indexPath = path.join(staticPath, "index.html");

  console.log("NODE_ENV =", process.env.NODE_ENV);
  console.log("PORT =", process.env.PORT);
  console.log("staticPath =", staticPath);
  console.log("indexPath =", indexPath);
  console.log("index exists =", fs.existsSync(indexPath));

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send("index.html não encontrado");
    }
    res.sendFile(indexPath);
  });

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch((err) => {
  console.error("Erro ao iniciar servidor:", err);
  process.exit(1);
});