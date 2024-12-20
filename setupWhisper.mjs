import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import sevenBin from '7zip-bin';
import node7z from 'node-7z';
import { exec } from 'child_process'; // استيراد exec لتنفيذ الأوامر

const { extractFull } = node7z;  // استخدام الدوال المطلوبة

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعدادات التحميل بناءً على النظام
const getSystemConfig = () => {
  const platform = os.platform();
  let downloadUrl = '';
  let archiveName = '';
  let extractPath = '';

  if (platform === 'win32') {
    downloadUrl = 'https://github.com/Purfview/whisper-standalone-win/releases/download/Faster-Whisper-XXL/Faster-Whisper-XXL_r239.1_windows.7z';
    archiveName = 'Faster-Whisper-XXL_r239.1_windows.7z';
    extractPath = path.join(__dirname, 'bin', 'win');
  } else if (platform === 'linux') {
    downloadUrl = 'https://github.com/Purfview/whisper-standalone-win/releases/download/Faster-Whisper-XXL/Faster-Whisper-XXL_r192.3.1_linux.7z';
    archiveName = 'Faster-Whisper-XXL_r192.3.1_linux.7z';
    extractPath = path.join(__dirname, 'bin', 'linux');
  } else {
    console.error('Unsupported platform');
    return null;
  }

  return { platform, downloadUrl, archiveName, extractPath };
};

// تحقق من وجود مجلد
const ensureDirectoryExists = async (dirPath) => {
  const dirExists = await fs.pathExists(dirPath);
  if (!dirExists) {
    console.log(`The directory does not exist. Creating it now: ${dirPath}`);
    await fs.mkdirp(dirPath);
    console.log(`Directory created: ${dirPath}`);
  } else {
    console.log(`The directory already exists: ${dirPath}`);
  }
  return dirExists;
};

// تحميل الأرشيف
const downloadArchive = async (downloadUrl, filePath) => {
  console.log('Downloading file...');
  try {
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    let totalLength = 0;
    const totalSize = response.headers['content-length'];

    response.data.on('data', (chunk) => {
      totalLength += chunk.length;
      const percent = ((totalLength / totalSize) * 100).toFixed(2);
      process.stdout.write(`Downloading: ${percent}%\r`);
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Download finished.');
        resolve();
      });

      writer.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// استخراج الأرشيف
const extractArchive = async (filePath, extractPath) => {
  try {
    console.log('Extracting archive...');

    // استخدم Promise حول دالة extractFull لجعلها متوافقة مع async/await
    await new Promise((resolve, reject) => {
      const extractionStream = extractFull(filePath, extractPath, { $bin: sevenBin.path7za });

      extractionStream.on('end', () => {
        console.log('Extraction completed.');
        resolve(); // نحل الوعد عندما تنتهي العملية
      });

      extractionStream.on('error', (error) => {
        console.error('Error extracting archive:', error);
        reject(error); // نرفض الوعد في حال حدوث خطأ
      });
    });
  } catch (error) {
    console.error('Error in extraction process:', error);
    throw error; // إعادة رمي الخطأ ليتم معالجته في مكان آخر
  }
};

// حذف ملف الأرشيف
const removeArchive = async (filePath) => {
  try {
    await fs.remove(filePath);
    console.log('Archive file deleted successfully.');
  } catch (error) {
    console.error('Error deleting archive file:', error);
    throw error;
  }
};

// دالة لإعطاء صلاحية التنفيذ للمجلد
const grantExecutionPermission = async (dirPath) => {
  try {
    console.log(`Granting execute permissions to ${dirPath}...`);
    // تنفيذ الأمر chmod باستخدام exec
    await new Promise((resolve, reject) => {
      exec(`chmod -R +x ${dirPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing chmod: ${stderr}`);
          reject(error);
        } else {
          console.log(`Permissions granted successfully: ${stdout}`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error granting execution permission:', error);
    throw error;
  }
};

// الوظيفة الرئيسية لضبط الإعداد
const setupWhisper = async () => {
  const config = getSystemConfig();
  if (!config) return;

  const { platform, downloadUrl, archiveName, extractPath } = config;
  const filePath = path.join(__dirname, archiveName);
  const binPath = path.join(__dirname, 'bin');

  try {

    // تحقق إذا كان المجلد المستخرج موجودًا بالفعل
    const folderExists = await fs.pathExists(extractPath);
    if (folderExists) {
      console.log('Extracted folder already exists, skipping download and extraction.');
      return; // إذا كان المجلد موجودًا بالفعل، نتخطى التحميل والاستخراج
    }

    // تحقق من وجود مجلدات bin و win/linux
    await ensureDirectoryExists(binPath);
    await ensureDirectoryExists(extractPath);

    // تحقق إذا كان الأرشيف موجودًا بالفعل
    const archiveExists = await fs.pathExists(filePath);
    if (!archiveExists) {
      console.log('Archive does not exist. Proceeding to download...');
      await downloadArchive(downloadUrl, filePath);
    } else {
      console.log('Archive file already exists, skipping download.');
    }

    // استخراج الأرشيف
    await extractArchive(filePath, extractPath);

    // إذا كان النظام هو Linux، نمنح صلاحية التنفيذ
    if (platform === 'linux') {
      await grantExecutionPermission(binPath);
    }

    // حذف الأرشيف بعد الاستخراج
    await removeArchive(filePath);
  } catch (error) {
    console.error('Error in setup process:', error);
  }
};

// تشغيل الدالة للإعداد
setupWhisper();