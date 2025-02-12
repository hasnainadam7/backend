import { asyncHandlerPromises } from "../utiles/async_handler.js";
import jwt from "jsonwebtoken";
import { getUser } from "../controllers/user_controller.js";
import { apiError } from "../utiles/api_errors.js";

export const isUserAuthorized = asyncHandlerPromises(async (req, _, next) => {
  try {
    const token =
      (await req.cookie?.accessToken) ||
      (await req.header("Authorization")?.replace("Bearer ", ""));

      console.log(token)
    if (!token) throw new apiError(401, "Bad Request");

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log("Decoded Token",decodedToken)
    if (!decodedToken) throw new apiError(401, "Bad Request");

    const fetchedUser = await getUser(decodedToken.email);
    if (!fetchedUser) throw new apiError(401, "Invalid Access Token");

    req.user = fetchedUser;
    next();
  } catch (error) {
    throw new apiError(401, `Error ${error?.message || "Invalid Access Token"}`);
  }
});
