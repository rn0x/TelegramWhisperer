import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../config.mjs';
import { ensureDirectoryExists, deleteFile } from './fileManager.mjs';
import os from 'node:os'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processAudio = async (options) => {
  const {
    audioPath,
    model = config.defaultModel,
    modelDir = path.join(__dirname, `../${config.modelDir}`),
    outputDir = path.join(__dirname, `../${config.outputDir}`),
    outputFormat = config.defaultFormat,
    task = config.defaultTask,
    language = config.defaultLanguage,
  } = options;

  // تأكد من وجود مجلد الإخراج
  await ensureDirectoryExists(outputDir);

  // تحديد مسار تنفيذ البرنامج بناءً على النظام
  const platform = os.platform();
  let whisperCmd;

  if (platform === 'win32') {
    whisperCmd = path.join(__dirname, "../bin/win/Faster-Whisper-XXL/faster-whisper-xxl.exe");
  } else if (platform === 'linux') {
    whisperCmd = path.join(__dirname, "../bin/linux/Whisper-Faster-XXL/whisper-faster-xxl");
  } else {
    throw new Error('Unsupported platform');
  }
  const args = [
    '--model', model,
    '--model_dir', modelDir,
    '--output_dir', outputDir,
    '--output_format', outputFormat,
    '--task', task,
    '--language', language,
    audioPath,
  ];

  const process = spawn(whisperCmd, args);

  let error = '';
  process.stderr.on('data', (data) => {
    error += data.toString();
  });

  await new Promise((resolve, reject) => {
    process.on('close', async (code) => {
      if (code !== 0) {
        if (task === 'translate') {
          // إذا كانت المهمة "translate"، نتجاهل الخطأ ونعتبر العملية ناجحة
          console.warn(`Warning: Process exited with code ${code}. Ignoring because task is "translate".`);
          resolve();
        } else {
          // إذا كانت المهمة "transcribe"، نعتبر ذلك خطأ
          await deleteFile(audioPath);
          reject(new Error(`Processing failed: ${error}`));
        }
      } else {
        resolve();
      }
    });
  });

  const outputFile = path.join(outputDir, `${path.basename(audioPath, path.extname(audioPath))}.${outputFormat}`);

  try {

    // تحقق من وجود الملف باستخدام existsSync
    if (fs.existsSync(outputFile)) {
      // حذف الملف الصوتي بعد المعالجة
      await deleteFile(audioPath);

      // إرجاع المسار الناتج
      return { path: outputFile };
    } else {
      throw new Error(`Output file not found: ${outputFile}`);
    }
  } catch (err) {
    throw new Error(`Output file not found or error reading: ${err.message}`);
  }
};