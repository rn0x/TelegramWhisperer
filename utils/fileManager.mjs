import fs from 'fs-extra';  // استيراد fs-extra
import path from 'path';
import axios from 'axios';

/**
 * التحقق من أن المجلد موجود، إذا لم يكن موجودًا يتم إنشاؤه.
 * @param {string} dirPath - مسار المجلد.
 */
export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.ensureDir(dirPath);  // تأكد من وجود المجلد
  } catch (err) {
    console.error(`فشل في التأكد من وجود المجلد: ${dirPath}`, err);
    throw err;
  }
}

/**
 * حذف ملف معين بشكل آمن.
 * @param {string} filePath - مسار الملف.
 */
export async function deleteFile(filePath) {
  try {
    await fs.remove(filePath);  // حذف الملف بشكل آمن
  } catch (err) {
    console.error(`فشل في حذف الملف: ${filePath}`, err);
  }
}

/**
 * إنشاء مسار مخصص للإخراج.
 * @param {string} outputDir - مسار مجلد الإخراج.
 * @param {string} fileName - اسم الملف.
 * @returns {string} - المسار الكامل للملف.
 */
export function createOutputPath(outputDir, fileName) {
  return path.join(outputDir, fileName);
}

/**
 * استخراج امتداد الملف.
 * @param {string} filePath - مسار الملف.
 * @returns {string} - امتداد الملف (بصيغة صغيرة).
 */
export function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

/**
 * التحقق من نوع الملف الصوتي.
 * @param {string} filePath - مسار الملف الصوتي.
 * @param {Array<string>} allowedExtensions - الامتدادات المسموح بها (افتراضيًا .wav و .mp3 و .m4a).
 * @returns {boolean} - `true` إذا كان النوع مسموحًا، وإلا `false` .
 */
export function validateAudioFileType(filePath, allowedExtensions = ['.wav', '.mp3', '.m4a']) {
  const fileExt = getFileExtension(filePath);
  return allowedExtensions.includes(fileExt);
}

/**
 * تنزيل ملف من رابط معين وحفظه في مسار معين.
 * @param {string} fileLink - رابط الملف.
 * @param {string} filePath - مسار حفظ الملف.
 */
export async function downloadFile(fileLink, filePath) {
  try {
    const response = await axios({
      url: fileLink,
      method: 'GET',
      responseType: 'stream',
    });

    // ضمان أن المجلد موجود
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);

    // فتح الملف وحفظه
    const writer = await fs.createWriteStream(filePath);  // استخدام fs-extra لإنشاء Stream
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`خطأ أثناء تنزيل الملف: ${fileLink}`, error);
    throw error;
  }
}
