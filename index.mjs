import dotenv from 'dotenv';
dotenv.config();
import { Telegraf, session, Scenes } from 'telegraf';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadFile, deleteFile } from './utils/fileManager.mjs';
import { processAudio } from './utils/whisperService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supportedLanguages = [
    'af', 'am', 'ar', 'as', 'az', 'ba', 'be', 'bg', 'bn', 'bo', 'br', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en',
    'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr', 'gl', 'gu', 'ha', 'haw', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id', 'is',
    'it', 'ja', 'jw', 'ka', 'kk', 'km', 'kn', 'ko', 'la', 'lb', 'ln', 'lo', 'lt', 'lv', 'mg', 'mi', 'mk', 'ml', 'mn',
    'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'nn', 'no', 'oc', 'pa', 'pl', 'ps', 'pt', 'ro', 'ru', 'sa', 'sd', 'si', 'sk',
    'sl', 'sn', 'so', 'sq', 'sr', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'uk', 'ur', 'uz',
    'vi', 'yi', 'yo', 'yue', 'zh',
];
// الحد الأقصى المسموح به للمدة (بالدقائق)
const MAX_DURATION_MINUTES = 5; // على سبيل المثال، 5 دقائق

// إنشاء مشهد لاختيار اللغة
const languageScene = new Scenes.BaseScene('languageScene');

languageScene.enter((ctx) => {
    ctx.reply(
        'Please select the language of the audio from the list below (e.g., "ar" for Arabic):\n' +
        supportedLanguages.join(', '),
        {
            reply_to_message_id: ctx?.message?.message_id
        }
    );
});

languageScene.on('text', (ctx) => {
    const language = ctx.message.text.trim().toLowerCase(); // تجاهل حالة الأحرف

    if (!supportedLanguages.includes(language)) {
        return ctx.reply('❌ Invalid language. Please choose a supported language.', {
            reply_to_message_id: ctx?.message?.message_id
        });
    }

    ctx.session.language = language;
    ctx.scene.enter('taskScene');
});

// إنشاء مشهد لاختيار المهمة
const taskScene = new Scenes.BaseScene('taskScene');

taskScene.enter((ctx) => {
    ctx.reply(
        'Choose the task you want to perform:\n' +
        '1. Transcribe to the same language (type: "Transcribe").\n' +
        '2. Translate to English (type: "Translate").',
        {
            reply_to_message_id: ctx?.message?.message_id
        }
    );
});

taskScene.on('text', async (ctx) => {
    const task = ctx.message.text.trim().toLowerCase(); // تجاهل حالة الأحرف

    if (task !== 'transcribe' && task !== 'translate') {
        return ctx.reply('❌ Invalid task. Please choose either "Transcribe" or "Translate".', {
            reply_to_message_id: ctx?.message?.message_id
        });
    }

    ctx.session.task = task === 'transcribe' ? 'transcribe' : 'translate';

    const { fileData, language } = ctx.session;

    if (!fileData || !language) {
        ctx.reply('❌ An error occurred! Please upload the file again.', {
            reply_to_message_id: ctx?.message?.message_id
        });
        return ctx.scene.leave();
    }

    const options = {
        audioPath: fileData.filePath,
        task: ctx.session.task,
        outputFormat: 'txt',
        language: language,
    };

    try {
        await ctx.reply('🔄 Processing the file, please wait...', {
            reply_to_message_id: ctx?.message?.message_id
        });

        // معالجة الملف باستخدام processAudio
        const result = await processAudio(options);

        if (result?.path && fs.existsSync(result?.path)) {
            // إرسال الملف أولاً
            await ctx.telegram.sendDocument(ctx.chat.id, {
                source: result.path,
                filename: path.basename(result.path),
            }, { reply_to_message_id: ctx?.session?.message_id });

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
                    await ctx.reply(chunk, {
                        parse_mode: 'Markdown',
                        reply_to_message_id: ctx?.session?.message_id
                    });
                }
            } else {
                // إذا كان المحتوى أقل من الحد الأقصى، يتم إرساله كله في رسالة واحدة
                await ctx.reply(fileContent,
                    {
                        parse_mode: 'Markdown',
                        reply_to_message_id: ctx?.session?.message_id
                    }
                );
            }

            // حذف الملف المؤقت بعد الإرسال
            await deleteFile(result.path);
            await ctx.reply(
                '✅ The file has been processed successfully!\n' +
                '👥 [Join our channel](https://t.me/i8xApp) to continue using the bot and get more updates.',
                {
                    parse_mode: 'Markdown',
                    reply_to_message_id: ctx?.session?.message_id,
                    disable_web_page_preview: true
                }
            );
        } else {
            await ctx.reply('❌ Error occurred while processing the file.');
        }
    } catch (error) {
        console.error('Error during processing:', error);
        await ctx.reply('❌ An error occurred while processing the file. Please try again.');
    }

    ctx.scene.leave();
});

// بوت تيليجرام
const bot = new Telegraf(process.env.BOT_TOKEN, {
    handlerTimeout: Infinity
});

// استخدام الجلسة
bot.use(session());

// رسالة عند الضغط على زر Start
bot.start((ctx) => {
    ctx.reply(
        '👋 Welcome to the bot!\n\n' +
        'To get started, follow these steps:\n' +
        '1. Upload the audio or video file you want to process.\n' +
        '2. Select the language that the audio is in.\n' +
        '3. Choose the task you want to perform:\n' +
        '   - "Transcribe": To get the text in the same language.\n' +
        '   - "Translate": To translate the text to English.\n\n' +
        '⚠️ Don’t forget to join our channel for updates!\n' +
        '👥 Join our channel: [i8xApp](https://t.me/i8xApp)\n\n' +
        '⬇️ Press "Start" to begin using the bot.',
        {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx?.message?.message_id,
            disable_web_page_preview: true
        }
    );
});

// إنشاء الـ Stage وربط المشاهد
const stage = new Scenes.Stage([languageScene, taskScene]);
bot.use(stage.middleware());

// استقبال الصوت أو الفيديو
bot.on(['voice', 'video'], async (ctx) => {
    const fileId = ctx.message.voice?.file_id || ctx.message.video?.file_id;
    const fileType = ctx.message.voice ? 'voice' : 'video';

    // الحصول على مدة الصوت أو الفيديو
    const duration = ctx.message.voice?.duration || ctx.message.video?.duration; // بالثواني

    // تحقق إذا كانت المدة تتجاوز الحد المسموح به
    if (duration > MAX_DURATION_MINUTES * 60) {
        return ctx.reply(
            `❌ The file is too long. The maximum allowed duration is ${MAX_DURATION_MINUTES} minutes. Please upload a shorter file.`,
            { reply_to_message_id: ctx?.message?.message_id }
        );
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const downloadsDir = path.join(__dirname, 'downloads');
        const filePath = path.join(
            downloadsDir,
            `${fileId}.${fileType === 'voice' ? 'mp3' : 'mp4'}` // تحديد الامتداد بناءً على نوع الملف
        );

        // تنزيل الملف
        await downloadFile(fileLink.href, filePath);

        // تخزين بيانات الملف في الجلسة
        ctx.session.fileData = { filePath, fileType, message_id: ctx?.message?.message_id };

        // بدء مشهد اختيار اللغة
        ctx.scene.enter('languageScene');
    } catch (error) {
        console.error('Error handling file:', error);
        ctx.reply('❌ An error occurred while uploading the file. Try again.');
    }
});

bot.catch((error) => {
    console.error('An error occurred:', error);
});

// تشغيل البوت
bot.launch();
console.log('🚀 The bot is now working!');