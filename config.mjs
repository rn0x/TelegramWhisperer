const config = {
    defaultModel: 'medium', // النموذج الافتراضي  ['tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'medium.en', 'large-v1', 'large-v2', 'large-v3', 'large', 'distil-large-v2', 'distil-medium.en', 'distil-small.en', 'distil-large-v3']
    modelDir: 'models',    // مسار النماذج الافتراضية
    outputDir: 'output',   // مسار الإخراج الافتراضي
    defaultFormat: 'json',   // صيغة الإخراج الافتراضية ['lrc', 'txt', 'text', 'vtt', 'srt', 'tsv', 'json', 'all']
    defaultTask: 'transcribe', // المهمة الافتراضية ['transcribe', 'translate'] نسخ او ترجمة
    defaultLanguage: 'en',   // اللغة الافتراضية
  };
  
  export default config;
  