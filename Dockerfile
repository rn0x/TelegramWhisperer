# استخدام صورة Node.js الرسمية من Docker Hub
FROM node:18

# تحديد مجلد العمل داخل الحاوية
WORKDIR /usr/src/app

# نسخ ملفات المشروع إلى مجلد العمل في الحاوية
COPY . .

# تثبيت التبعيات من package.json
RUN npm install

# نسخ ملف البيئة .env إذا كان موجود
COPY .env .env

# تحديد المتغيرات البيئية إذا كنت تحتاج لها
# ENV NODE_ENV=production

# تشغيل البوت
CMD ["npm", "start"]