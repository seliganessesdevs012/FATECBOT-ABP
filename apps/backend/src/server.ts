import express, { type Express } from "express";
import cors from "cors";
import routes from "./routes";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import { AppError } from "./errors/AppError";

const app: Express = express();

app.use(cors());
app.use(loggerMiddleware);
app.use(express.json({ limit: "10mb" }));

app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, data: {} });
});

app.use("/api/v1", routes);

app.use((_req, _res, next) => {
  next(new AppError("Rota nao encontrada", 404));
});

app.use(errorMiddleware);

export default app;
