import express,{ Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes"
import doctorRoutes from "./routes/doctorRoutes"


export const app: Express = express();

const server = http.createServer(app);

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());
console.log(process.env.frontEnd_URL, 'frontend URL')

app.use(
 cors({
  origin: process.env.frontEnd_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization","Accept"],
 })
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);

app.get("/", (req,res)=>{
    res.send("backend is running...");
});

// server.listen(process.env.PORT, () => {
//     console.log(`server is running on http://localhost:${process.env.PORT}`);
    
// })

export default app;