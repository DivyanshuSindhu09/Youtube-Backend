import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //! paramas are used for unique identifiers
    //! querys are used for key value pairs
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //! console.log(req.query.page)
    //! (page=2&limit=10)
    //TODO: get all videos based on query, sort, pagination
    const allVideos = await Video.find({})

    return res.status(200).json(
        new ApiResponse(200, allVideos, "Videos Fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description){
        throw new ApiError(400, "Both Title and Description are required")
    }
    const videoLocalPath = req.files?.videoFile[0]?.path 
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    
    console.log("File")
    console.log(req.files)
    console.log(req.files.videoFile)
    console.log("Testing")

    if(!videoLocalPath){
        throw new ApiError(400, "Video File Is Required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail Is Required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    console.log("video details", video)

    if(!video || !thumbnail){
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }

    const publishedVideo = await Video.create({
        title,
        description,
        videoFile : video.url,
        thumbnail : thumbnail.url,
        duration : video.duration,
        owner : req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, publishedVideo, "Video Uploaded Successfully")
    )
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "VIDEO'S ID IS REQUIRED")
    }
    const video = await Video.findById(videoId)

    return res.status(200).json(
        new ApiResponse (200, video, "Video Fetched Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    if(!title || !description){
        throw new ApiError(400, "All Fields Are Required")
    }

    //! thumbnail
    console.log(req.file)
    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(500, "Failed to upload thumbnail")}

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail : thumbnail.url
            }
        },
        {new : true}
    )

    if(!video){
        throw new ApiError(404, "Video Not Found")
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Details Changed Successfully")
    )

    //TODO: update video details like title, description, thumbnail


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

/*
req.file 
{
  fieldname: 'thumbnail',
  originalname: 'fis.JPG',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: './public/temp',
  filename: 'fis.JPG',
  path: 'public\\temp\\fis.JPG',
  size: 51151
}
*/

/*
req.files
[Object: null prototype] {
  thumbnail: [
    {
      fieldname: 'thumbnail',
      originalname: 'fis.JPG',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: 'fis.JPG',
      path: 'public\\temp\\fis.JPG',
      size: 51151
    }
  ],
  videoFile: [
    {
      fieldname: 'videoFile',
      originalname: 'loader.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      destination: './public/temp',
      filename: 'loader.mp4',
      path: 'public\\temp\\loader.mp4',
      size: 1107253
    }
  ]
}
*/