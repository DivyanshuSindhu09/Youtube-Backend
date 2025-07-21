import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const databaseConnect = async ( ) => {
    try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`/n DATABASE CONNECTED SUCCESSFULLY :) Info ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default databaseConnect