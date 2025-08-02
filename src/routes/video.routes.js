import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from '../controllers/video.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/uploadVideo').post(
    verifyJWT,
    upload.fields([
        {
            name : 'videoFile',
            maxCount : 1
        }, {
            name : 'thumbnail',
            maxCount : 1
        }
    ]),
    publishAVideo
)

router.route('/getAllVideos').get(
    verifyJWT,
    getAllVideos
)

router.route('/updateVideo/:videoId').patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo
)

router.route('/deleteVideo/:videoId').delete(
    verifyJWT,
    deleteVideo
)

router.route('/getVideo/:videoId').get(
    verifyJWT,
    getVideoById
)

router.route('/togglePublishStatus/:videoId').patch(
    verifyJWT,
    togglePublishStatus
)

export default router