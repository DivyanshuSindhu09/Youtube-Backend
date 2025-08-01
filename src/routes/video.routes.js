import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { publishAVideo } from '../controllers/video.controller.js';
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

export default router