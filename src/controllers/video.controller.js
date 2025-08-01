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
   // --- 1. Build the base aggregation pipeline ---
    const pipeline = [];

    // --- 2. Create the $match stage dynamically ---
    const matchStage = {};
    //! matchstagei is used to filter documents based on certain criteria

    // Only include published videos
    matchStage.isPublished = true;

    // Add text search to match stage ONLY if a query is provided
    if (query) {
        // You must have a text index on title/description for this to work
        // e.g., videoSchema.index({ title: "text", description: "text" });
        matchStage.$text = { $search: query };
    }

    // Add owner filter to match stage ONLY if a userId is provided
    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId format");
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }
    
    // Add the completed match stage to the pipeline
    pipeline.push({ $match: matchStage });


    // --- 3. Add the $lookup stage to get owner details ---
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails", // Use a different name to avoid confusion
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1, // Project the URL directly
                    },
                },
            ],
        },
    });

    // Deconstruct the ownerDetails array to a single object
    pipeline.push({
        $addFields: {
            owner: {
                $first: "$ownerDetails",
            },
        },
    });


    // --- 4. Create the $sort stage dynamically ---
    const sortStage = {};
    if (sortBy && sortType) {
        // Sort by the provided field and type
        sortStage[sortBy] = sortType === 'asc' ? 1 : -1;
    } else if (query) {
        // If there's a search query, sort by relevance (textScore) first
        sortStage.score = { $meta: "textScore" };
    } else {
        // Default sort: newest videos first
        sortStage.createdAt = -1;
    }

    pipeline.push({ $sort: sortStage });
    

    // --- 5. Remove the extra ownerDetails field ---
    pipeline.push({
        $project: {
            ownerDetails: 0 // Exclude the now-redundant array
        }
    })


    // --- 6. Execute the pipeline with pagination ---
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videoAggregate = Video.aggregate(pipeline);
    const videos = await Video.aggregatePaginate(videoAggregate, options);

    if (!videos) {
        throw new ApiError(500, "Something went wrong while fetching videos");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
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
    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "username email fullName"
    })
    //! populate se owner ka object add hojaega jisme id, username, email and fullName hoga
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
    const userId = req.user._id
    console.log("user id",userId)
    //! user id new ObjectId('688cb7c0945c0580042d2c82')
    console.log(userId.toString())
    //!688cb7c0945c0580042d2c82 
    console.log("video id",videoId)

    const video = await Video.findById(videoId)
    console.log("video",video)

    //!video.owner : new ObjectId('688cb7c0945c0580042d2c82'),
    if(video.owner.toString() !== userId.toString()){
        throw new ApiError(400, "Unauthorized Request To Delete")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(400, "An error occured while deleting the video")
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Video Deleted Successfully")
    )

    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video Not Found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, `Video is now ${video.isPublished ? "Published" : "Unpublished"}`)
    )
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