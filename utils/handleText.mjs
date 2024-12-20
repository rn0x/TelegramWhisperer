import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handleText(ctx) {
    const chatId = ctx?.message?.chat?.id;

    if (!chatId) return;

    const statsFilePath = path.join(__dirname, '../members.json');

    // تحقق من وجود الملف، وإذا لم يكن موجودًا، يتم إنشاؤه كمصفوفة فارغة
    let chats = {};
    if (await fs.pathExists(statsFilePath)) {
        chats = await fs.readJson(statsFilePath, { throws: false }) || {};
    } else {
        // إذا لم يكن الملف موجودًا، يتم إنشاؤه كمصفوفة فارغة
        await fs.writeJson(statsFilePath, chats, { spaces: 2 });
    }

    // إضافة أو تحديث بيانات الدردشة في ملف JSON
    chats[chatId] = {
        status: 'active', // حالة الدردشة كـ "نشطة"
        date: new Date().toISOString(),
        username: ctx?.message?.chat?.username || 'N/A',
        firstName: ctx?.message?.chat?.title || ctx?.message?.chat?.first_name || 'N/A',
        lastName: ctx?.message?.chat?.last_name || 'N/A',
        type: ctx?.message?.chat?.type || 'N/A',
        languageCode: ctx?.message?.from?.language_code || 'N/A',
    };

    // حفظ البيانات المحدثة في ملف JSON
    await fs.writeJson(statsFilePath, chats, { spaces: 2 });
};
