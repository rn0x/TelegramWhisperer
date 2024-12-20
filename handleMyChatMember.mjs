import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handleMyChatMember(ctx) {
    const chatMember = ctx?.update?.my_chat_member;
    if (!chatMember) return;

    const { new_chat_member, old_chat_member } = chatMember;
    const userId = new_chat_member?.user?.id || old_chat_member?.user?.id;

    if (!userId) return;

    const statsFilePath = path.join(__dirname, 'members.json');

    // تحقق من وجود الملف، وإذا لم يكن موجودًا، يتم إنشاؤه كمصفوفة فارغة
    let members = {};
    if (await fs.pathExists(statsFilePath)) {
        members = await fs.readJson(statsFilePath, { throws: false }) || {};
    } else {
        // إذا لم يكن الملف موجودًا، يتم إنشاؤه كمصفوفة فارغة
        await fs.writeJson(statsFilePath, members, { spaces: 2 });
    }

    switch (new_chat_member.status) {
        case 'member':
            // عضو جديد انضم إلى الدردشة
            members[userId] = {
                status: 'joined',
                date: new Date().toISOString(),
                username: new_chat_member?.user?.username || 'N/A',
                firstName: new_chat_member?.user?.first_name || 'N/A',
                lastName: new_chat_member?.user?.last_name || 'N/A',
                languageCode: new_chat_member?.user?.language_code || 'N/A',
            };
            break;
        case 'left':
        case 'kicked':
            // عضو غادر أو تم طرده، نقوم بحذفه من الملف
            delete members[userId];
            break;
        default:
            break;
    }

    // حفظ البيانات المحدثة في ملف JSON
    await fs.writeJson(statsFilePath, members, { spaces: 2 });
};
