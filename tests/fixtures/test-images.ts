import path from 'path';
import fs from 'fs';

export const TEST_IMAGES = {
  USER_PHOTO: path.join(__dirname, '../../public/images/flux-test.png'),
  PET_CORGI: path.join(__dirname, '../../public/images/test pets/test-corgi.png'),
  PET_CAT: path.join(__dirname, '../../public/images/test pets/test-cat.png'),
  PET_GSHEP: path.join(__dirname, '../../public/images/test pets/test-gshep.png'),
  MONALISA_OUTPUT: path.join(__dirname, '../../public/images/flux-test-output.png'),
};

export function loadTestImage(imagePath: string): Buffer {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Test image not found: ${imagePath}`);
  }
  return fs.readFileSync(imagePath);
}

export function createTestFormData(imageBuffer: Buffer, filename: string, fieldName: string): FormData {
  const file = new File([new Uint8Array(imageBuffer)], filename, { type: 'image/png' });
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
}
