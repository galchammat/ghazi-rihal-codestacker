// filepath: /home/user/code/ghazi-rihal-codestacker/packages/backend/src/app.ts
import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";


dotenv.config({ path: [".env.local", ".env"] });

const app = express();
app.use(express.json());

// Use user routes
app.use("/users", userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});