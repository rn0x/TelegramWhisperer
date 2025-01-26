// utils/processFile.mjs
import fs from 'fs-extra';
import path from 'node:path';
import { processAudio } from './whisperService.mjs';
import { deleteFile } from './fileManager.mjs';

export const processFile = async (bot, task) => {
    try {

        // بدء المعالجة
        const options = {
            audioPath: task.file_path,
            task: task.task_type,
            outputFormat: task.outputFormat,
            language: task.language,
        };
        // معالجة الملف باستخدام processAudio
        const result = await processAudio(options);

        if (result?.path && fs.existsSync(result?.path)) {
            // إرسال الملف أولاً
            await bot.telegram.sendDocument(task.user_id, {
                source: result.path,
                filename: path.basename(result.path),
            }, { reply_to_message_id: task.message_id, }).catch((error) => console.error(`Failed to send File: ${error.message}`));

            // قراءة محتوى الملف
            const fileContent = await fs.readFile(result.path, 'utf-8');

            // تحقق من طول المحتوى
            if (fileContent.length > 4096) {
                // إذا كان المحتوى أطول من 4096 حرفًا، نقوم بتقسيمه
                const chunks = [];
                let i = 0;
                while (i < fileContent.length) {
                    chunks.push(fileContent.slice(i, i + 4096)); // تقسيم إلى أجزاء بطول 4096
                    i += 4096;
                }

                // إرسال كل جزء على حدة
                for (const chunk of chunks) {
                    await bot.telegram.sendMessage(task.user_id, chunk, {
                        // parse_mode: 'Markdown',
                        reply_to_message_id: task.message_id,
                    }).catch((error) => console.error(`Failed to send message: ${error.message}`));
                }
            } else {
                // إذا كان المحتوى أقل من الحد الأقصى، يتم إرساله كله في رسالة واحدة
                await bot.telegram.sendMessage(task.user_id, fileContent,
                    {
                        // parse_mode: 'Markdown',
                        reply_to_message_id: task.message_id,
                    }
                ).catch((error) => console.error(`Failed to send message: ${error.message}`));
            }

            // حذف الملف المؤقت بعد الإرسال
            await deleteFile(result.path);
            await bot.telegram.sendMessage(task.user_id,
                '✅ The file has been processed successfully!\n' +
                '👥 [Join our channel](https://t.me/i8xApp) to continue using the bot and get more updates.',
                {
                    parse_mode: 'Markdown',
                    reply_to_message_id: task.message_id,
                    disable_web_page_preview: true
                }
            ).catch((error) => console.error(`Failed to send message: ${error.message}`));
        } else {
            await bot.telegram.sendMessage(task.user_id, '❌ Error occurred while processing the file.').catch((error) => console.error(`Failed to send message: ${error.message}`));
        }
    } catch (error) {
        console.error('Error during processing:', error);
        await bot.telegram.sendMessage(task.user_id, '❌ An error occurred while processing the file. Please try again.').catch((error) => console.error(`Failed to send message: ${error.message}`));
    }
};
