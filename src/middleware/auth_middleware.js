import { asyncHandlerPromises } from "../utiles/async_handler.js";
import jwt from "jsonwebtoken";
import { getUser } from "../controllers/user_controller.js";
import { apiError } from "../utiles/api_errors.js";

export const isUserAuthorized = asyncHandlerPromises(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.body?.accessToken;
    
  // console.log("Token:", token);
  // console.log("Decoded Token:", jwt.decode(token, { complete: true }));
  // console.log("Backend Secret Key:", process.env.REFRESH_TOKEN_SECRET);
  try {
    // Token extract karna

    if (!token) throw new apiError(401, "Access Token Missing");

    // Token verify karna
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) throw new apiError(401, "Invalid Access Token");
    console.log(decodedToken);

    // Database se user lana
    const fetchedUser = await getUser(decodedToken._id);

    if (!fetchedUser) throw new apiError(401, "User Not Found");

    // User ko request object me add karna
    req.body.user = fetchedUser;

    next();
  } catch (error) {
    // next(new apiError( 401,error|| "Unauthorized Access"));
    console.error("Authorization Error:", error); //
    throw new apiError(401, error || "Unauthorized Access");
  }
});
