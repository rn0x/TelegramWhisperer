export async function safeSendMessage(bot, userId, text, options = {}) {
    try {
        // المحاولة لإرسال الرسالة مع الرد على الرسالة
        await bot.telegram.sendMessage(userId, text, options);
    } catch (error) {
        if (error.response?.error_code === 400 && error.response.description.includes('message to be replied not found')) {
            console.warn('Reply message not found. Sending message without reply_to_message_id.');
            // إذا فشل الرد على رسالة محددة، أرسل الرسالة بدون `reply_to_message_id`
            const { reply_to_message_id, ...restOptions } = options; // إزالة reply_to_message_id
            await bot.telegram.sendMessage(userId, text, restOptions);
        } else {
            // إذا كان الخطأ مختلفًا، إعادة رميه
            console.error('Failed to send message:', error);
            throw error;
        }
    }
}

export async function safeSendDocument(bot, userId, document, options = {}) {
    try {
        // المحاولة لإرسال الملف مع الرد على الرسالة
        await bot.telegram.sendDocument(userId, document, options);
    } catch (error) {
        if (error.response?.error_code === 400 && error.response.description.includes('message to be replied not found')) {
            console.warn('Reply message not found. Sending document without reply_to_message_id.');
            // إذا فشل الرد على رسالة محددة، أرسل الملف بدون `reply_to_message_id`
            const { reply_to_message_id, ...restOptions } = options; // إزالة reply_to_message_id
            await bot.telegram.sendDocument(userId, document, restOptions);
        } else {
            // إذا كان الخطأ مختلفًا، إعادة رميه
            console.error('Failed to send document:', error);
            throw error;
        }
    }
}
