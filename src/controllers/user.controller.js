import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

        // ? validation

        if(
            [username, email, password, fullName].some((field) => field?.trim() === "" )
            //! agar koi bhi field empty hogi toh automatically true return hojeaga
        ){
            throw new ApiError(400, 'All Fields Are Required')
        }

        // ? checking for existing user

        const existingUser = await User.findOne({
            // ! special syntax
            $or : [ { email }, { username } ]
        })

        if( existingUser ){
            throw new ApiError(409 ,'User Already Exists')
        }

        console.log(req.files)
        
        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImageLocalPath = req.files?.coverImage[0]?.path

        if (!avatarLocalPath) {
            throw new ApiError(400, 'Avatar File Is Required')
        }

        // ? uploading on cloudinary                                

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, 'Avatar File Is Required')
        }

        const user = await User.create({
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            username : username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            // ! wierd syntaxt
            // ? jo jo nhi chahiye wo pass krda
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500, 'Something went wrong while registering the user')
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, 'User Registered Successfully')
        )
} )

export {registerUser}
