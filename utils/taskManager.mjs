import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// الحصول على مسار الدليل الحالي
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE = path.join(__dirname, '../tasks.json');

// وظيفة للتأكد من وجود الملف وتهيئته إذا لم يكن موجودًا
const ensureFileExists = async () => {
    try {
        if (!await fs.exists(TASKS_FILE)) {
            // إذا الملف غير موجود، نقوم بإنشائه بمصفوفة فارغة
            await fs.writeJSON(TASKS_FILE, { tasks: [] });
        }
    } catch (error) {
        console.error('Error ensuring file exists:', error);
    }
};

// وظيفة لتخزين المهام
export const saveTask = async (task) => {
    try {
        // التأكد من أن الملف موجود وتم تهيئته
        await ensureFileExists();

        const data = await fs.readJSON(TASKS_FILE);
        data.tasks.push(task);
        await fs.writeJSON(TASKS_FILE, data, { spaces: 2 });
    } catch (error) {
        console.error('Error saving task:', error);
    }
};

// وظيفة لجلب جميع المهام
export const getAllTasks = async () => {
    try {
        // التأكد من أن الملف موجود وتم تهيئته
        await ensureFileExists();

        const data = await fs.readJSON(TASKS_FILE);

        // التأكد من أن data.tasks هي مصفوفة وليس undefined أو null
        return Array.isArray(data.tasks) ? data.tasks : [];
    } catch (error) {
        console.error('Error reading tasks:', error);
        return [];
    }
};


// وظيفة لحذف المهمة من قاعدة البيانات بعد المعالجة
export const deleteTask = async (taskId) => {
    try {
        // التأكد من أن الملف موجود وتم تهيئته
        await ensureFileExists();

        const data = await fs.readJSON(TASKS_FILE);
        const updatedTasks = data.tasks.filter(task => task.task_id !== taskId);
        await fs.writeJSON(TASKS_FILE, { tasks: updatedTasks }, { spaces: 2 });
        // console.log(`Task ${taskId} has been deleted from the database.`);
    } catch (error) {
        console.error('Error deleting task:', error);
    }
};
