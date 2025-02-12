import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { apiError } from "./api_errors.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudniary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "ecommerce",
      resource_type: "auto",
    });
    fs.unlinkSync(filePath); //remove the temporary files from the server
    return result;
  } catch (error) {
    fs.unlinkSync(filePath); //remove the temporary files from the server
    console.error("Error uploading to Cloudinary:", error);
    return null;
  } 
};
export const cloudinaryUploader = async (filePath) => {
  try {

    if (!filePath) {
      throw new apiError(400, "Please upload Image");
    }
  
    console.log("File Path",filePath)
    const cloudinaryUrl = await uploadOnCloudniary(filePath);


    if (!cloudinaryUrl) {
      throw new apiError(520, "Error occured while uploading picture");
    }
    console.log("Cloudinary Path ",cloudinaryUrl);
    
    return cloudinaryUrl.url;
  } catch (error) {
    throw new apiError(530, error);
  }
};

export const cloudinaryDeleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (!result)
      throw new apiError(520, "Error occured while deleting picture");
    return result;
  } catch (error) {
    throw new apiError(530, "Error occured while deleting picture");
  }
};
