import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler ( async (req, res) => {

        // ? fetch details from frontend
        // ? perform some validations
        // ? check if user already exists by username or email
        // ? check for images and avatar
        // ? upload avatar on cloudinary and check for avatar again
        // ? create user object in the database 
        // ? remove password and refresh token
        // ? check for user creation 
        // ? return res to the user
        
        const {username, email, fullName,  password} = req.body
        console.log(username, email, fullName, password)
        return res.status(200).json({
            success : true,
            message : 'User Registered Successfully'
        })

} )

export {registerUser}
