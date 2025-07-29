import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

 

 export const verifyJWT = asyncHandler( async (req, res, next) => {
    // ! Header -> Key - Authorization ; 
    // ! Value -> Bearer <token>
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(400, "")
    }
 } )