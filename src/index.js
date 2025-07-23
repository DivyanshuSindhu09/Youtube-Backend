import { app } from "./app.js";
import databaseConnect from "./db/database.js";
import dotenv from 'dotenv'

dotenv.config()
databaseConnect()
.then(()=> {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`SERVER IS RUNNING AT PORT ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log(error)
})