# TelegramWhisperer

TelegramWhisperer هو بوت تيليجرام يعتمد على ثنائيات **Faster-Whisper** لتحويل الصوت إلى نصوص مكتوبة. يسمح البوت للمستخدمين بإرسال ملفات صوتية أو فيديو، ويقوم البوت بتحويل الصوت إلى نص وفقًا للغة المختارة.

## المتطلبات

- **Node.js** v16 أو أعلى
- **npm** أو **yarn**
- **مفتاح API لتيليجرام** (يجب أن تقوم بإنشاء بوت على تيليجرام باستخدام [BotFather](https://core.telegram.org/bots#botfather))
- **Faster-Whisper**: قم بتشغيل سكربت **`setupWhisper.mjs`** لإعداد ثنائيات **Faster-Whisper**. السكربت سيقوم بتنزيل وتثبيت ما تحتاجه لتشغيل **Whisper** محليًا.

  لتشغيل السكربت:

  ```bash
  node setupWhisper.mjs
  ```

## التثبيت

### 1. استنساخ المشروع

```bash
git clone https://github.com/rn0x/TelegramWhisperer.git
cd TelegramWhisperer
```

### 2. تثبيت التبعيات

تأكد من أنك لديك **Node.js** مثبتًا. ثم، قم بتثبيت التبعيات اللازمة للمشروع:

```bash
npm install
```

أو إذا كنت تستخدم  **yarn** :

```bash
yarn install
```

### 3. إعداد **Faster-Whisper**

بعد تثبيت التبعيات، قم بتشغيل السكربت **`setupWhisper.mjs`** لإعداد  **Faster-Whisper** :

```bash
node setupWhisper.mjs
```

السكربت سيقوم بتنزيل وتثبيت ثنائيات **Faster-Whisper** اللازمة.

### 4. إعداد المتغيرات البيئية

قم بإنشاء ملف **`.env`** في جذر المشروع وأضف مفتاح البوت الخاص بك:

```
BOT_TOKEN=your-telegram-bot-token-here
```

### 5. تشغيل البوت

لتشغيل البوت، استخدم الأمر التالي:

```bash
npm start
```

أو إذا كنت تستخدم  **yarn** :

```bash
yarn start
```

## كيفية الاستخدام

1. **رفع ملف الصوت أو الفيديو** : يمكنك إرسال ملف صوتي أو فيديو إلى البوت.
2. **اختيار اللغة** : بعد إرسال الملف، سيطلب منك البوت تحديد لغة الصوت.
3. **اختيار المهمة** : يمكنك تحديد المهمة التي تريدها:

* **نسخ النص** : لتحويل الصوت إلى نص بنفس اللغة.
* **ترجمة إلى الإنجليزية** : لتحويل الصوت إلى نص باللغة الإنجليزية.

1. **الانتظار** : بعد اختيار المهمة، سيقوم البوت بمعالجة الملف وإرسال النص المستخرج إليك.

## الترخيص

تم ترخيص هذا المشروع بموجب [GPL-3.0-only](https://chatgpt.com/c/LICENSE).