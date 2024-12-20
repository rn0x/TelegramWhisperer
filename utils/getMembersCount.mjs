import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function getMembersCount() {
    const statsFilePath = path.join(__dirname, '../members.json');

    // تحقق من وجود الملف
    if (await fs.pathExists(statsFilePath)) {
        // قراءة بيانات الأعضاء من الملف
        const members = await fs.readJson(statsFilePath, { throws: false }) || {};

        // حساب عدد الأعضاء
        const membersCount = Object.keys(members).length;
        return membersCount;
    } else {
        console.log('ملف الأعضاء غير موجود');
        return 0;
    }
}