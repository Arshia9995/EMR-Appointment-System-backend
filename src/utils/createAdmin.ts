import bcrypt from "bcryptjs"
import User from "../models/User"
import connectDB from "../config/db"
import dotenv from "dotenv"

dotenv.config()

const createAdmin = async () => {

 await connectDB()

 const existingAdmin = await User.findOne({
  email: process.env.ADMIN_EMAIL
 })

 if (existingAdmin) {
  console.log("Admin already exists")
  process.exit()
 }

 const hashedPassword = await bcrypt.hash(
  process.env.ADMIN_PASSWORD as string,
  10
 )

 const admin = await User.create({
  name: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL,
  password: hashedPassword,
  role: "super_admin"
 })

 console.log("Admin created successfully")

 process.exit()
}

createAdmin()