import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const statsFilePath = path.join(__dirname, '../members.json');

// دالة لعرض الأعضاء
export default async function displayMembers(ctx) {
    try {
        // قراءة الأعضاء من ملف JSON
        const members = await fs.readJson(statsFilePath, { throws: false }) || {};

        // إذا لم يوجد أعضاء
        if (Object.keys(members).length === 0) {
            return await ctx.reply('❌ No members found in the bot.').catch((error) => console.error(`Failed to send message: `, error));;
        }

        let membersList = `👥 Total number of users: ${Object.keys(members).length}\n\n`;
        let count = 1;

        // إضافة الأعضاء إلى القائمة
        for (const userId in members) {
            const member = members[userId];

            const username = member.username ? `@${member.username}` : '-';
            const firstName = member.firstName || '-';
            const chatType = member.chatType || 'private';
            const language = member.languageCode || 'unknown';

            // تنسيق التفاصيل لكل عضو
            membersList += `${count}️⃣\n`;
            membersList += `👤 Username: ${username}\n`;
            membersList += `📛 First Name: ${firstName}\n`;
            membersList += `💬 Chat Type: ${chatType}\n`;
            membersList += `🌐 Language Code: ${language}\n\n`;

            count++;

            // إذا كانت الرسالة كبيرة جدًا، نقوم بإرسالها الآن ثم نبدأ رسالة جديدة
            if (membersList.length > 4000) {
                await ctx.reply(membersList).catch((error) => console.error(`Failed to send message: `, error));;
                membersList = ''; // إعادة تعيين القائمة
            }
        }

        // إرسال الرسالة المتبقية
        if (membersList.length > 0) {
            await ctx.reply(membersList).catch((error) => console.error(`Failed to send message: `, error));;
        }
    } catch (error) {
        console.error('Error displaying members:', error);
        await ctx.reply('❌ An error occurred while displaying the members.').catch((error) => console.error(`Failed to send message: `, error));;
    }
};