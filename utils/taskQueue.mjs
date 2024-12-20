import { deleteFile } from './fileManager.mjs';
import { processAudio } from './whisperService.mjs';
import path from 'node:path';


// قائمة الانتظار (في الذاكرة)
const taskQueue = [];
const MAX_RETRIES = 3; // الحد الأقصى لإعادة المحاولة

/**
 * إضافة مهمة جديدة إلى قائمة الانتظار.
 * @param {Object} task - المهمة التي سيتم إضافتها.
 * @param {string} task.userId - معرف المستخدم.
 * @param {string} task.filePath - مسار الملف.
 * @param {string} task.fileType - نوع الملف.
 */
export function addTaskToQueue({ userId, filePath, fileType }) {
    taskQueue.push({ userId, filePath, fileType, retries: 0 });
    console.log(`Task added. Queue length: ${taskQueue.length}`);
}

/**
 * معالجة قائمة الانتظار.
 */
export async function processQueue(bot) {
    while (true) {
        if (taskQueue.length === 0) {
            console.log('No tasks in the queue. Waiting...');
            await new Promise((resolve) => setTimeout(resolve, 5000)); // انتظار 5 ثوانٍ
            continue;
        }

        const task = taskQueue.shift(); // إزالة المهمة الأولى من القائمة

        console.log(`Processing task for user ${task.userId}...`);

        try {
            const options = {
                audioPath: task.filePath,
                task: 'transcribe', // أو 'translate' حسب الحاجة
                outputFormat: 'txt', // صيغة الإخراج
                language: 'ar', // اللغة الافتراضية
            };

            const result = await processAudio(options); // معالجة الملف الصوتي
            console.log(`Task for user ${task.userId} completed successfully.`);

            // إرسال رسالة نجاح إلى تيليجرام
            await bot.telegram.sendMessage(task.userId, 'Your audio has been processed successfully.');            

            // إرسال الملف الناتج إلى تيليجرام
            if (result?.path) {
                await bot.telegram.sendDocument(task.userId, { source: result.path, filename: path.basename(result.path) });
                await deleteFile(result.path);
            }

        } catch (err) {
            console.error(`Failed to process task for user ${task.userId}:`, err);
            // إعادة المحاولة إذا لم تصل إلى الحد الأقصى
            if (task.retries < MAX_RETRIES) {
                task.retries += 1;
                console.log(`Retrying task for user ${task.userId} (Attempt ${task.retries})...`);
                taskQueue.push(task); // إعادة المهمة إلى نهاية قائمة الانتظار
            } else {
                console.error(`Task for user ${task.userId} failed after ${MAX_RETRIES} attempts.`);
                await bot.telegram.sendMessage(task.userId, `Task failed after ${MAX_RETRIES} attempts. Please try again later.`);
            }
        }
    }
}