import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users";
import assignmentRoutes from "./routes/assignments";
import reportRoutes from "./routes/reports";
import { errorHandler } from "./middleware/errorHandler";


dotenv.config({ path: [".env.local", ".env"] });

const app = express();
app.use(express.json());

// Use user routes
app.use("/users", userRoutes);

// Use case-related routes
app.use("/cases", assignmentRoutes);

// Use report routes
app.use("/reports", reportRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});