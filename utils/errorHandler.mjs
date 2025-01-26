import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسار ملف المستخدمين
const statsFilePath = path.join(__dirname, '../members.json');

// وظيفة لتحميل المستخدمين
const loadMembers = async () => {
    if (await fs.pathExists(statsFilePath)) {
        return await fs.readJson(statsFilePath, { throws: false }) || {};
    }
    return {};
};

// وظيفة لحفظ المستخدمين
const saveMembers = async (members) => {
    await fs.writeJson(statsFilePath, members, { spaces: 2 });
};

// معالج للأخطاء العامة في البوت
export default function setupErrorHandler(bot) {
    bot.catch(async (error) => {
        console.error('An error occurred:', error);

        if (error instanceof Error && error.response) {
            const userId = error.on?.payload?.chat_id || error.on?.payload?.user_id;

            if (userId && (error.response.error_code === 403 || error.response.error_code === 400)) {
                console.error(`Removing user ${userId} from members.json due to error: ${error.response.description}`);

                // تحميل المستخدمين
                const members = await loadMembers();

                // حذف المستخدم من الملف
                if (members[userId]) {
                    delete members[userId];
                    await saveMembers(members);
                    console.log(`User ${userId} removed from members.json.`);
                }
            }
        }
    });
}
