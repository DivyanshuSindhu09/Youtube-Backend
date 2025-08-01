import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

// ! this function will be used at the time of login
const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    // ! saving in our database
    user.refreshToken = refreshToken
    await user.save( {validateBeforeSave : false} )
    // ? taki koi pass etc. wali validation kick in na ho isme

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}


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
        console.log(req.body)
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

        console.log('Iske aage clg files hoga')
        console.log(req.files)
        console.log('Controller ka console')
        console.log(req.files?.avatar)
        
        const avatarLocalPath = req.files?.avatar[0]?.path
        //const coverImageLocalPath = req.files?.coverImage[0]?.path


        //! check for coverImage
        let coverImageLocalPath;
        if ( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0  ) {
          coverImageLocalPath = req.files.coverImage[0].path
          //! ab undefined nhi dikhaega
        }

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

const loginUser = asyncHandler( async (req, res) => {
  // ? fetch data from user
  // ? check if data is not empty
  // ? find for given username or password
  // ? validate password
  // ? generate access token and refresh tokens to the user
  // ? send cookies to the user 

  const { username, email, password } = req.body

  if(!username && !email){
    throw new ApiError(400, 'Username or email is required')
  }

  const user = await User.findOne({
    $or : [ {username} , {email} ]
  })

  if(!user){
    throw new ApiError(404, "User Does Not Exist")
  }

  // ! ye hamara banaya hua function hai mongo ka nhi toh ise hum apne user se access kr skte hai
  // ! mongo db ke User se nhi 
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Credentials Are Incorrect")
  }

  // !sahi password hai
  const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)
  // ? hamare paas jis user ka reference hai uska refreshToken empty hai

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure : true
  }

  // ! hum cookie req or res dono mein access kr skte hain
  return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
      "User Logged In Successfully"
    )
  )

} )

const logoutUser = asyncHandler( async(req, res) => {
  //! from middleware
  // req.user
  
  await  User.findByIdAndUpdate(
      req.user._id,
      {
        $set : {
          refreshToken : undefined
        }
      },
      {
        new : true
        // ? hame response mein new updated value milegi
      }
    )

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(200, {}, "User Logged Out Successfully")
  )
})

//! endpoint for refreshing tokens

const refreshAccessToken = asyncHandler( async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token")
    }
  
    //! matching the tokens
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError
    }
  
    const {accessToken, refreshToken : newRefreshToken } = await generateAccessandRefreshTokens(user._id)
  
    const options = {
      httpOnly : true,
      secure : true
    }
  
    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200,
        {
          accessToken,
          refreshToken : newRefreshToken
        },
        "Access Token Refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid Refresh Token")
  }

} )

const updateCurrentPassword = asyncHandler( async (req, res) => {
  const { oldPassword, newPassword } = req.body

  //! from auth middleware

  const user = await User.findById(req.user._id)
  
  if (!user) {
    throw new ApiError(404, "User Not Found")
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Given Password Is Incorrect")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res.status(200).json(
    new ApiResponse(200, {}, "Password Updated Successfully")
  )
})

const getCurrentUser = asyncHandler( async (req, res) => {
  //! from auth middleware
  return res.status(200).json(
    new ApiResponse(200, req.user, "Current User Fetched Successfully")
  ) 
})

const updateAccountDetails = asyncHandler( async (req, res) => {
  const { fullName, email } = req.body

  if (!email || !fullName) {
    throw new ApiError(400, "All Fields Are Required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        fullName,
        email //! this is updated
      }
    },
    {new : true}
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200, user, "User Details Updated Successfully")
  )
})

const updateUserAvatar = asyncHandler (async (req, res) =>{
  const avatarLocalPath = req.file?.path //! yaha pe humne files ki jagah file likha h kyuki hum starting mein jyada jagah files upload krne ka option de rhe the

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File Is Missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar?.url) {
    throw new ApiError(400, "Error While Uploading Avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url //! this is updated
      }
    },{
      new: true,
    }
  )

  return res.status(200).json(
    new ApiResponse(200, user, "Avatar Updated Successfully")
  )
} )


const updateUserCoverImage = asyncHandler (async (req, res) =>{
  const coverImageLocalPath = req.file?.path //! yaha pe humne files ki jagah file likha h kyuki hum starting mein jyada jagah files upload krne ka option de rhe the

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar File Is Missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage?.url) {
    throw new ApiError(400, "Error While Uploading Cover Image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url //! this is updated
      }
    },{
      new: true,
    }
  )

  return res.status(200).json(
    new ApiResponse(200, user, "Cover Image Updated Successfully")
  )
} )

const getUserChannelProfile = asyncHandler( async (req, res) => {
  //! fetch username from url 
  const {username} = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required")
  }
  
const channel = await User.aggregate([
  {
    $match:{
      username : username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField: "id",
      foreignField: "channel",
      as : "subscribers"
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField: "id",
      foreignField: "subscriber",
      as : "subscribedTo"
    }
  },
  {
    $addFields : {
      subscribersCount : {
        $size : "$subscribers"
      },
      channelsSubscribedToCount : {
        $size : "$subscribedTo"
      },
      isSubscribed : {
        $cond:{
          if : {$in : [req.user?._id, "$subscribers.subscriber"]},
          then : true,
          else : false
          //! $in can check in both array and object
        }
      }
      }
  },{
    //! used to project selected values  
    $project:{
      _id: 1,
      username: 1,
      fullName: 1,
      email: 1,
      createdAt: 1,
      avatar: 1,
      coverImage: 1,
      subscribersCount: 1,
      channelsSubscribedToCount: 1,
      isSubscribed: 1
    }
  }
])

  //! datatype of channel is array
  if (!channel?.length) {
    throw new ApiError(400, "Channel Does Not Exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User Channel Fetched Successfully")
  )
})

//! watch history functionality
//! nested lookup
//! aggregation pipeline mein mongoose interfere nhi krta
//! mongoDB ki id = ObjectId('String')
//! _id mein hame string milta hai
//! mongoose behind the scene is string ko mondoDB ki id mein convert krta hai

//! hamare paas aggregate se array aata hai uska datastructure improve kr skte h

const getWatchHistory = asyncHandler( async(req, res)=> {
  const user = await User.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField: "_id",
        as : "watchHistory", //! subpipeline
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName : 1,
                    username : 1,
                    avatar : 1
                  }
                },               
              ]
            }
          },
          {
              $addFields:{
                owner : { //! sara data pipelines se owner mein agya hai ab use modify krte h
                $first:"$owner" //? ab hame direct object ka access milega jo array[0] pe tha
              }
            }
          }
        ]
      }
    },
  ])

  return res.status(200).json(
    new ApiResponse(200, user[0]?.watchHistory, "Watch History Fetched Successfully")
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}

/*
Controller ka console
[
  {
    fieldname: 'avatar',
    originalname: 'images.jpeg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: './public/temp',
    filename: 'images.jpeg',
    path: 'public\\temp\\images.jpeg',
    size: 9249
  }
]
*/

/*
req.files
[Object: null prototype] {
  avatar: [
    {
      fieldname: 'avatar',
      originalname: 'images.jpeg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: 'images.jpeg',
      path: 'public\\temp\\images.jpeg',
      size: 9249
    }
  ],
  coverImage: [
    {
      fieldname: 'coverImage',
      originalname: 'fis.JPG',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: 'fis.JPG',
      path: 'public\\temp\\fis.JPG',
      size: 51151
    }
  ]
}
*/

/*
req.body
[Object: null prototype] {
  fullName: 'Divyanshu Sindhu',
  email: 'divya.nshu@.com',
  password: '564sf2s1fde',
  username: 'devansh_jaat'
}
*/

/*
database entry -
"_id": "688511f10381b6194f8f33bb",
        "username": "devansh_jaat",
        "email": "divya.nshu@.com",
        "fullName": "Divyanshu Sindhu",
        "avatar": "http://res.cloudinary.com/difclqflf/image/upload/v1753551343/y8u6ask29mh7i0lscubh.jpg",
        "coverImage": "http://res.cloudinary.com/difclqflf/image/upload/v1753551344/sjehvhks8g3phzladiel.jpg",
        "watchHistory": [],
        "createdAt": "2025-07-26T17:35:45.293Z",
        "updatedAt": "2025-07-26T17:35:45.293Z",
        "__v": 0
*/

// let fullname = "John Doe";
// let email = ""; // Falsy

// if (!fullname || !email) {
// This code WILL run because email is falsy.
//   console.log("At least one field is missing.");
// }

// let fullname = "John Doe";
// let email = ""; // Falsy

// if (!(fullname || email)) {
// This code WILL NOT run because fullname is truthy.
//   console.log("Both fields are missing.");
// }