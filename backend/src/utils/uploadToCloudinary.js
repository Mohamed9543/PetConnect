const cloudinary = require("../config/cloudinary");

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Phone camera originals can be 4000px+; nothing in the app needs
        // more than this for a card thumbnail or a full-screen detail view,
        // and auto quality/format shrinks payload size further per client.
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
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
