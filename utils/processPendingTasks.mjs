import { processFile } from './processFile.mjs'; // دالة المعالجة
import { getAllTasks, deleteTask } from './taskManager.mjs'; // دوال جلب المهام وحذف المهمة

// وظيفة لمعالجة المهام
export const processPendingTasks = async (bot) => {
    const tasks = await getAllTasks();

    if (tasks.length > 0) {
        for (const task of tasks) {
            try {
                // معالجة الملف
                await processFile(bot, task);

                // بعد اكتمال المعالجة، حذف المهمة من قاعدة البيانات
                await deleteTask(task.task_id);
            } catch (error) {
                console.error('Error during task processing:', error);
                // حتى لو حدث خطأ، لا نوقف باقي المهام، ويمكنك التعامل مع الأخطاء حسب الحاجة
            }
        }

        // بعد معالجة كل المهام، نعيد استدعاء الدالة مرة أخرى بعد 5 ثواني (أو وقت آخر حسب الحاجة)
        setTimeout(() => processPendingTasks(bot), 5000); 
    } else {
        // console.log('No pending tasks. Waiting for new tasks...');
        // إذا لم تكن هناك مهام جديدة، نترك النظام في حالة انتظار (يمكنك تعيين إعادة فحص في وقت لاحق هنا)
        setTimeout(() => processPendingTasks(bot), 5000);
    }
};
