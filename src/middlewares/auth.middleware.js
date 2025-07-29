import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js" 

//! agar res wali field empty hoti hai toh production mein use _ se replace krdete hain
  const verifyJWT = asyncHandler( async (req, res, next) => {
    try {
        // ! Header -> Key - Authorization ; 
        // ! Value -> Bearer <token>
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(400, "Unauthorized Request")
        }
        // ? agar password theek hai
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id) //? humne model mein yahi field pass ki thi
    
        if(!user){
            // TODO: more discussion
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // adding new field to req 
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Access Token")
    }
 } )

 export  {verifyJWT}