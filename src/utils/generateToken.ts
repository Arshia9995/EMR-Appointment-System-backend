import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, role: string) => {

  return jwt.sign(
    { userId, role },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: string) => {

  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );
};