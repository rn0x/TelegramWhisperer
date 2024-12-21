import fs from 'fs-extra'; 
import path from 'node:path';
import fetch from 'node-fetch';

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
 * @param {number} timeout - وقت المهلة للتنزيل (بالمللي ثانية).
 */
export async function downloadFile(fileLink, filePath, timeout = 600000) { // افتراضي:10 دقائق
  const dirPath = path.dirname(filePath);

  // ضمان وجود المجلد الهدف
  await ensureDirectoryExists(dirPath);

  // إعداد المهلة
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // تنزيل الملف
    const response = await fetch(fileLink, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // الكتابة باستخدام التدفق
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filePath);
      response.body.pipe(fileStream);

      fileStream.on('finish', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      fileStream.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error(`Error while writing file to ${filePath}:`, error);
        reject(error);
      });
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Error downloading file:`, error);
    throw error;
  }
}