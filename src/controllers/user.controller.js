import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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

export {
  registerUser,
  loginUser,
  logoutUser
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