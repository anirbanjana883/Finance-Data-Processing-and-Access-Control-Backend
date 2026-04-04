import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        orgId: true,
        organization: {
          select: {
            name: true,
          },
        },
        deletedAt: true,
      },
    });

    if (!user) throw new ApiError(401, "Invalid access token");
    if (user.status === "INACTIVE")
      throw new ApiError(403, "Your account has been deactivated");
    if (user.deletedAt !== null)
      throw new ApiError(403, "This account no longer exists");

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Session expired, please login again");
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
