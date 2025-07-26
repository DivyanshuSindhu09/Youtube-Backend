import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //? upload file on cloudinary 
        const file = await cloudinary.uploader.upload(localFilePath, {
            resource_type : 'auto',
        })
        // ? file has been uploaded successfully
        console.log('File Has Been Uploaded Successfully')
        console.log(file)
        // ! removing file after uploading
        fs.unlinkSync(localFilePath)
        return file
    } catch (error) {
        // ! removing file from server as operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}

/*
File Has Been Uploaded Successfully
{
  asset_id: '24958a980182d9c28bbbd1a0a4030245',
  public_id: 'oxzeehviejfg7cq9bmcw',
  version: 1753549770,
  version_id: 'a6a794814e6c1f61c1225de75e673b83',
  signature: '8c4cfdc810f4e0eaf30fa039cefec141f9b3682c',
  width: 275,
  height: 183,
  format: 'jpg',
  resource_type: 'image',
  created_at: '2025-07-26T17:09:30Z',
  tags: [],
  bytes: 9249,
  type: 'upload',
  etag: '30b61b799fc8e781ef94e52a8dc37858',
  placeholder: false,
  url: 'http://res.cloudinary.com/difclqflf/image/upload/v1753549770/oxzeehviejfg7cq9bmcw.jpg',
  secure_url: 'https://res.cloudinary.com/difclqflf/image/upload/v1753549770/oxzeehviejfg7cq9bmcw.jpg',
  asset_folder: '',
  display_name: 'oxzeehviejfg7cq9bmcw',
  original_filename: 'images',
  original_extension: 'jpeg',
  api_key: ''
}
File Has Been Uploaded Successfully
{
  asset_id: '38cdb3f32c25db9b8b821596c3155dca',
  public_id: 'ndvmjvkggtw1emoas1ey',
  version: 1753549771,
  version_id: '03c4dfe0eeb31b4ce22f5a81621d438f',
  signature: 'd087234e08147637efb61d8ab9f393d3eb0d897e',
  width: 1366,
  height: 644,
  format: 'jpg',
  resource_type: 'image',
  created_at: '2025-07-26T17:09:31Z',
  tags: [],
  bytes: 51151,
  type: 'upload',
  etag: '0cef412956316e7726995861b2e5e206',
  placeholder: false,
  url: 'http://res.cloudinary.com/difclqflf/image/upload/v1753549771/ndvmjvkggtw1emoas1ey.jpg',
  secure_url: 'https://res.cloudinary.com/difclqflf/image/upload/v1753549771/ndvmjvkggtw1emoas1ey.jpg',
  asset_folder: '',
  display_name: 'ndvmjvkggtw1emoas1ey',
  original_filename: 'fis',
  original_extension: 'JPG',
  api_key: ''
}
*/