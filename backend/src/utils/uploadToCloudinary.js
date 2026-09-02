const cloudinary = require("../config/cloudinary");

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadImages(files, folder) {
  if (!files || files.length === 0) return [];
  try {
    return await Promise.all(files.map((file) => uploadBuffer(file.buffer, folder)));
  } catch (error) {
    // Cloudinary errors (e.g. missing/invalid credentials) are cryptic API
    // messages ("cloud_name is disabled") — surface something the app can
    // show the user instead of a raw 500, and keep the real cause in logs.
    console.error("Cloudinary upload failed:", error.message);
    const wrapped = new Error(
      "L'envoi des photos a échoué (service d'hébergement d'images indisponible). Réessayez, ou publiez sans photo."
    );
    wrapped.statusCode = 502;
    throw wrapped;
  }
}

module.exports = { uploadBuffer, uploadImages };
