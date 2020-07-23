import * as admin from "firebase-admin";
import { firebaseConfig } from "../firebase.config";
import {firebaseDevConfig} from "../integration/firebase.dev.config";
import {firebaseStgConfig} from "../integration/firebase.stg.config";
import { timestamp } from "../utils/Utils";
import serviceAccountCreds from "../serviceAccount.json";

const serviceAccount = serviceAccountCreds as admin.ServiceAccount;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
    throw err
  }
}

export async function getFirebaseStorageBucketName() {
        const firebaseEnv = process.env.FIREBASE_ENV;
        var fbStorageBuck;
        if (firebaseEnv == "wsa-prod") {
            fbStorageBuck = firebaseConfig.storageBucket;
        } else if (firebaseEnv == "wsa-stg") {
            fbStorageBuck = firebaseStgConfig.storageBucket;
        } else {
            fbStorageBuck = firebaseDevConfig.storageBucket;
        }
        return fbStorageBuck;
    }
