import { getConnection, getRepository } from 'typeorm';
import { Product } from "../models/Product";
import { uploadImage, deleteImage } from "../services/FirebaseService";
import { Image } from "../models/Image";

export async function saveImages(productPhotos: Express.Multer.File[], product: Product, userId: number): Promise<Image[]> {
    try {
        const images = await this.addImages(productPhotos, userId);
        let imageList: Image[] = [];
        for (const key in images) {
            images[key].product = product;
            const savedImage: Image = await getRepository(Image).save(images[key]);
            imageList = [...imageList, savedImage];
        }
        return imageList;
    } catch (err) {
        throw err;
    }
}

export async function addImages(productPhotos, userId): Promise<Image[]> {
    let images: Image[] = [];
    if (productPhotos) {
        const urls = await uploadImage(productPhotos);
        images = urls.map((url: string) => {
            const image = new Image();
            image.url = url;
            image.createdBy = userId;
            return image;
        });
    }
    return images;
}

export async function deleteImages(images): Promise<void> {
    try {
        for (const key in images) {
            await getConnection()
                .createQueryBuilder()
                .delete()
                .from(Image)
                .where("id = :id", { id: images[key].id })
                .execute();
            const idx = images[key].url.indexOf('product/photo');
            const imageName = images[key].url.slice(idx);
            deleteImage(imageName);
        }
    } catch (err) {
        throw err;
    }
}
