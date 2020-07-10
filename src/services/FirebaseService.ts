import * as admin from "firebase-admin";
import { firebaseConfig } from "../firebase.config";
import { timestamp } from "../utils/Utils";
import serviceAccountCreds from "../serviceAccount.json";

const serviceAccount = serviceAccountCreds as admin.ServiceAccount;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export async function uploadImage(images: Express.Multer.File[]): Promise<any> {
  const urlsArray = images.map(image => {
    const imageBuffer = new Uint8Array(image.buffer);
    const generatedName = `product/photo/${timestamp()}_${image.originalname}`;
    const bucket = admin.storage().bucket(firebaseConfig.storageBucket);
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

    return `https://storage.googleapis.com/${firebaseConfig.storageBucket}/${generatedName}`;
  })
  return urlsArray;
}

export async function deleteImage(url: string): Promise<any> {
  try {
    // console.log(`!!!!!!!!!!!!!!!!!!!! ${JSON.stringify(storage)}`)
    const bucket = admin.storage().bucket(firebaseConfig.storageBucket);
    const file = bucket.file("/product/photo/1594389347778_c1647b208295.jpg");
    file.delete(
      {
        userProject: firebaseConfig.projectId
      },
      error => {
        if (error) {
          console.log(error.message);
        }
      }
    );

  } catch (err) {
    throw err
  }
}