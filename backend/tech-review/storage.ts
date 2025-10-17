import { Bucket } from "encore.dev/storage/objects";

export const componentPhotos = new Bucket("component-photos", {
  public: true,
});
