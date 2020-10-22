import * as admin from "firebase-admin";
import { timestamp } from "../utils/Utils";

export async function uploadImage(images: Express.Multer.File[]): Promise<any> {
  const fbStorageBuck = await getFirebaseStorageBucketName();
  const urlsArray = images.map(image => {
    const imageBuffer = new Uint8Array(image.buffer);
    const generatedName = `product/photo/${timestamp()}_${image.originalname}`;
    const bucket = admin.storage().bucket(fbStorageBuck);
    const file = bucket.file(generatedName);
    file.save(
      imageBuffer,
      {
        metadata: { contentType: image.mimetype },
        public: true
      },
      error => {
        if (error) {
          console.log(error.message);
        }
      }
    );

    return `https://storage.googleapis.com/${fbStorageBuck}/${generatedName}`;
  })
  return urlsArray;
}

export async function deleteImage(imageName: string): Promise<any> {
  try {
    const fbStorageBuck = await getFirebaseStorageBucketName();
    await admin.storage().bucket(fbStorageBuck).file(imageName).delete();
    console.log(`gs://${fbStorageBuck}/${imageName} deleted.`);
  } catch (err) {
    throw err;
  }
}

  export async function getFirebaseStorageBucketName() {
    var fbStorageBuck = JSON.parse(process.env.firebaseConfig)
    return fbStorageBuck.storageBucket;
  }
