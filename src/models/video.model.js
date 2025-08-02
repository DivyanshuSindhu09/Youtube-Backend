import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

//! highly used in production
//* used to register plugin just like gsap

const videoSchema = new mongoose.Schema({
    videoFile : {
        type : String, //clodinary
        required : true
    },
    thumbnail : {
        required : true,
        type:String
    },
    title : {
        type : String,
        required : true,
        index : true // for search
    },
    description : {
        type : String,
        required: true,
        index : true // for search
    },
    duration : {
        type : Number, //clodinary
        required : true,
        default : 0
    },
    views:{
        type : Number,
        required : true,
        default : 0
    },
    isPublished:{
        type : Boolean,
        required : true,
        default : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }
}, {timestamps : true})


//! search functionality
videoSchema.index({ title: "text", description: "text" });

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)