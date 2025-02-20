import { Telegraf, session, Scenes } from 'telegraf';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadFile } from './utils/fileManager.mjs';
import handleMyChatMember from './utils/handleMyChatMember.mjs';
import handleText from './utils/handleText.mjs';
import displayMembers from './utils/displayMembers.mjs';
import getMembersCount from './utils/getMembersCount.mjs';
import { saveTask } from './utils/taskManager.mjs';
import { processPendingTasks } from './utils/processPendingTasks.mjs';
import setupErrorHandler from './utils/errorHandler.mjs';
import config from './config.mjs';


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

const MAX_DURATION_MINUTES = 10;
const MAX_FILE_SIZE_MB = 20;

const bot = new Telegraf(config.BOT_TOKEN, {
    handlerTimeout: Infinity
});

const botInfo = await bot.telegram.getMe();

bot.use(session());

const languageScene = new Scenes.BaseScene('languageScene');
const taskScene = new Scenes.BaseScene('taskScene');

languageScene.enter(async (ctx) => {
    await ctx.reply(
        'Please select the language of the audio from the list below (e.g., "ar" for Arabic):\n' +
        supportedLanguages.join(', '),
        { reply_to_message_id: ctx?.message?.message_id }
    );
});

languageScene.on('text', async (ctx) => {
    const language = ctx.message.text.trim().toLowerCase();

    if (!supportedLanguages.includes(language)) {
        await ctx.reply('❌ Invalid language. Please choose a supported language.', {
            reply_to_message_id: ctx?.message?.message_id
        });
        return;
    }

    ctx.session.language = language;
    ctx.scene.enter('taskScene');
});

taskScene.enter(async (ctx) => {
    await ctx.reply(
        'Choose the task you want to perform:\n' +
        '1. Transcribe to the same language (type: "Transcribe").\n' +
        '2. Translate to English (type: "Translate").',
        { reply_to_message_id: ctx?.message?.message_id }
    );
});

taskScene.on('text', async (ctx) => {
    const task = ctx.message.text.trim().toLowerCase();

    if (task !== 'transcribe' && task !== 'translate') {
        await ctx.reply('❌ Invalid task. Please choose either "Transcribe" or "Translate".', {
            reply_to_message_id: ctx?.message?.message_id
        });
        return;
    }

    ctx.session.task = task;

    const { fileData, language } = ctx.session;

    if (!fileData || !language) {
        await ctx.reply('❌ An error occurred! Please upload the file again.', {
            reply_to_message_id: ctx?.message?.message_id
        });
        return ctx.scene.leave();
    }

    await ctx.reply('🔄 Processing the file, please wait...', {
        reply_to_message_id: ctx?.message?.message_id
    });

    const taskObj = {
        task_id: fileData.fileId,
        user_id: fileData.user_id,
        file_path: fileData.filePath,
        outputFormat: 'txt',
        language: language,
        task_type: ctx.session.task,
        message_id: fileData?.message_id
    };

    await saveTask(taskObj);
    ctx.scene.leave();
});

const stage = new Scenes.Stage([languageScene, taskScene]);
bot.use(stage.middleware());

bot.on(['voice', 'video', 'audio'], async (ctx) => {
    const fileId = ctx.message.voice?.file_id || ctx.message.video?.file_id || ctx.message.audio?.file_id;
    const fileType = ctx.message.voice ? 'voice' : ctx.message.video ? 'video' : 'audio';

    try {
        const duration = ctx.message.voice?.duration || ctx.message.video?.duration || ctx.message.audio?.duration;

        if (duration > MAX_DURATION_MINUTES * 60) {
            await ctx.reply(
                `❌ The file is too long. The maximum allowed duration is ${MAX_DURATION_MINUTES} minutes. Please upload a shorter file.`,
                { reply_to_message_id: ctx?.message?.message_id }
            );
            return;
        }

        const fileSize = ctx.message.voice?.file_size || ctx.message.video?.file_size || ctx.message.audio?.file_size;

        if (fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
            await ctx.reply(
                `❌ The file is too large. The maximum allowed size is ${MAX_FILE_SIZE_MB}MB. Please upload a smaller file.`,
                { reply_to_message_id: ctx?.message?.message_id }
            );
            return;
        }

        const fileLink = await ctx.telegram.getFileLink(fileId);
        const downloadsDir = path.join(__dirname, 'downloads');
        const filePath = path.join(
            downloadsDir,
            `${fileId}.${fileType === 'voice' ? 'mp3' : fileType === 'video' ? 'mp4' : 'mp3'}`
        );

        await downloadFile(fileLink.href, filePath);

        ctx.session.fileData = { filePath, fileType, fileId, message_id: ctx?.message?.message_id, user_id: ctx?.message?.chat?.id };
        ctx.scene.enter('languageScene');
    } catch (error) {
        console.error('Error handling file:', error);
        await ctx.reply(`❌ An error occurred while uploading the file. Try again.${error?.response?.description ? error.response.description : error?.toString()}`).catch((error) => console.error(`Failed to send message: `, error));
    }
});

bot.start(async (ctx) => {
    await ctx.reply(
        '👋 Welcome to the bot!\n\n' +
        'To get started, follow these steps:\n' +
        '1. Upload the audio or video file you want to process.\n' +
        '2. Select the language that the audio is in.\n' +
        '3. Choose the task you want to perform:\n' +
        '   - "Transcribe": To get the text in the same language.\n' +
        '   - "Translate": To translate the text to English.\n\n' +
        '⚠️ Note: Files larger than 20MB cannot be processed due to Telegram API limitations.\n' +
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

bot.command('list', async (ctx) => {
    await displayMembers(ctx);
});

bot.on('my_chat_member', async (ctx) => handleMyChatMember(ctx));
bot.on('text', async (ctx) => handleText(ctx));

setupErrorHandler(bot);

bot.launch();

processPendingTasks(bot);

const startupMessage = `
🤖 **Bot Startup Information**
📅 Current Time: ${new Date().toLocaleString()}
🚀 Bot Status: Operational
👥 Users: ${await getMembersCount()}
🤖 Bot Username: @${botInfo.username}
🌟 Enjoy using the bot!
`;

console.log(startupMessage);