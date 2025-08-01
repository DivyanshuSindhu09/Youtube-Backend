import { Router } from "express";
import { getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateCurrentPassword, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/register').post(
    // ! multer middleware
    upload.fields([
        {
            name : 'avatar',
            maxCount : 1
        }, {
            name : 'coverImage',
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// ! secured routes

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, updateCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar) 
//! single file upload krne ke liye .single
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/user/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router