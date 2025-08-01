import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials :true
}))

app.use(express.json({
    limit : '16kb'
}))

// url encoder
app.use(express.urlencoded({
    extended : true,
    limit : '16kb'
}))


// for storing files and folders
app.use(express.static('public'))


app.use(cookieParser())

// ! routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
// ? declaration
app.use('/api/v1/user', userRouter)
app.use('/api/v1/videos', videoRouter)

// *http://localhost:8000/api/v1/user

// (error, req, res, next)
export {app}