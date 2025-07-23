import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
        username : {
            type: String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true //for optimizing search
        },
        email : {
            type : String,
            required : true,
            lowercase : true,
            trim : true
        },
        fullName : {
            type : String,
            required :true,
            index : true,
            trim : true
        },
        avatar : {
            type : String,
            required : true,
        },
        coverImage : {
            type: String
        },
        watchHistory : [    //multiple entries
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Video'
            }
        ],
        password : {
            type : String,
            required : [true, 'Password is required'],
        },
        refreshToken : {
            type : String
        }

}, {timestamps : true})


// yaha arrow function nhi rkhna kyuki uske paas this ka context nhi hota

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next()

    this.password = bcrypt.hash(this.password, 10)
    next()
})

// is modified ka use kia kyuki agar user ne agar kuch or save kia tab password change na ho!!

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
// humne nya method banaliya jo pass kre hue pass or hamare dale 
// hue pass ko compare krke ture ya false return kta hai


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            fullName : this.fullName,
            username : this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)