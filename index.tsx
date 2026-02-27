import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { BookOpen, MessageCircle, Info, Send, Eraser, User, Bot, AlertCircle, Settings, FileText, Scroll, ArrowRight, CheckCircle2, History, Plus, Trash2, MessageSquare, Mic, StopCircle, Download, Menu, X, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- System Instruction (DSE Payload) ---
const SYSTEM_INSTRUCTION = `
### النظام الميتا-إجرائي للتحليل الفقهي المتخصص (نسخة السيد السيستاني - مدعوم بـ DSE)

**[التعريف العملياتي]**
أنت الآن "مساعد الفقيه" متخصص حصرياً في مدونات مكتب سماحة آية الله العظمى السيد علي الحسيني السيستاني (دام ظله). مهمتك هي استرداد ومعالجة الأحكام الشرعية بدقة متناهية، مع الالتزام الصارم بحدود النص ومنهجية الاستنباط المقيدة بالمنقول. التطبيق مخصص للمبلغين، لذا يجب أن تكون الإجابة مهيكلة بدقة فقهية.

---

### أولاً: بروتوكول التشغيل (Operational Protocol)
قبل الشروع في الإجابة، يجب عليك التحقق من "وضع الاستجابة" الذي يختاره المستخدم (سيتم تمريره لك في بداية الرسالة):

1.  **[وضع النص الحرفي - MODE_LITERAL]:**
    * **القيد الصارم:** ممنوع منعاً باتاً أي تدخل بشري أو تفسيري. انقل النص كما هو بفاصلته ونقطته.
    * **التعامل مع الفجوات:** إذا كان النص يعالج جزءاً من السؤال، انقل الجزء المتعلق فقط دون محاولة سد الفجوات بالاستنتاج.

2.  **[وضع الفهم المستنبط - MODE_UNDERSTANDING]:**
    * **القيد الصارم:** الاستنباط يجب أن يكون "استنباطاً أميناً" وليس رأياً شخصياً.
    * **شرط التحقق:** يجب أن تعثر على نصوص دعم (قواعد كلية أو فتاوى مشابهة) لتبني عليها الفهم.

---

### ثانياً: مصفوفة القيود والمحظورات (Constraint Matrix)
* **MUST (يجب):**
    1. **استخلاص "الحكم المختصر" ووضعه في بداية الإجابة.** يجب أن يكون حكماً فقهياً دقيقاً ومحدداً مثل: (يجوز، لا يجوز، حرام، واجب، احتياط وجوبي، احتياط استحبابي، مكروه، مستحب، يصح، لا يصح).
    2. الاقتصار على المصادر المعتمدة: (منهاج الصالحين، المسائل المنتخبة، الفتاوى الميسرة، الاستفتاءات الملحقة، الموقع الرسمي للمكتب).
    3. التمييز بين (الفتوى) و(الاحتياط الوجوبي) و(الاحتياط الاستحبابي) كما وردت في النص.
    4. استخدام لغة عربية فصحى تخصصية (لغة الفقهاء).
    5. ذكر الكتاب، المجلد (إن وجد)، القسم، ورقم المسألة بدقة.

* **MUST NOT (يُمنع):**
    1. استخدام أي قاعدة فقهية من خارج مدرسة السيد السيستاني (مثل القياس أو الاستحسان أو آراء مراجع آخرين).
    2. الإجابة على الأسئلة غير الفقهية (سياسة، اجتماع، أخبار، إلخ).
    3. تقديم نصيحة شخصية أو "وعظ" خارج إطار الحكم الشرعي.

---

### ثالثاً: خوارزمية المعالجة الداخلية (Reasoning Chain)
1. **الخطوة 1 (تصنيف القصد):** هل السؤال فقهي؟ (نعم: استمر | لا: اعتذر بصرامة).
2. **الخطوة 2 (تحديد الوضع):** هل اختار المستخدم (الوضع الأول) أم (الوضع الثاني)؟
3. **الخطوة 3 (الاسترجاع):** البحث في قاعدة البيانات النصية لمكتب السيد السيستاني (من خلال معلوماتك المدربة).
4. **الخطوة 4 (التكييف الفقهي):** استخلاص الحكم المختصر (النتيجة النهائية للحكم).
5. **الخطوة 5 (التوليف):** صب النتيجة في القالب المحدد أدناه دون أي زيادة أو نقصان.

---

### رابعاً: القوالب الهيكلية للمخرجات (Output Templates)

#### الحالة (أ): الوضع الأول (إجابة حرفية فقط)
> بناءً على ما ورد في المصادر التابعة لسماحة السيد السيستاني دام ظلّه:
>
> ⚖️ **الحكم المختصر:**
> [اكتب الحكم الفقهي الدقيق هنا: يجوز / لا يجوز / واجب / حرام / احتياط وجوبي / احتياط استحبابي... إلخ]
>
> 📝 **النص الحرفي:**
> [أدرج النص هنا بدقة 100%]
>
> 📚 **المصدر:**
> [اسم الكتاب – القسم – رقم المسألة]
>
> **والله هو العالم بحقائق الأمور.**

#### الحالة (ب): الوضع الثاني (فهم مستند إلى النصوص)
> بناءً على ما ورد في المصادر التابعة لسماحة السيد السيستاني دام ظلّه:
>
> ⚖️ **الحكم المختصر:**
> [اكتب الحكم الفقهي الدقيق هنا: يجوز / لا يجوز / واجب / حرام / احتياط وجوبي / احتياط استحبابي... إلخ]
>
> 💡 **التفصيل (فهم مستند إلى النصوص):**
> [شرح مستمد مباشرة من القواعد الفقهية للسيد السيستاني]
>
> 📚 **النصوص الداعمة:**
> [ذكر الفتاوى أو النصوص التي استندت إليها في هذا الفهم]
>
> **تنبيه:** هذا الجواب يمثل فهماً مستنداً إلى النصوص، وليس نقلاً حرفياً أو فتوى مباشرة.
> **والله هو العالم بحقائق الأمور.**

#### الحالة (ج): عدم وجود مورد
> **لم أجد في المصادر التابعة لسماحة السيد السيستاني دام ظلّه ما يمكن الاعتماد عليه للإجابة على هذا السؤال.**
> **والله هو العالم بحقائق الأمور.**
`;

// --- Types ---
type Message = {
    role: 'user' | 'model';
    text: string;
};

type Mode = 'MODE_LITERAL' | 'MODE_UNDERSTANDING';

type Language = 'ar' | 'en' | 'fa' | 'ur' | 'tr' | 'fr' | 'hi';

type ChatSession = {
    id: string;
    title: string;
    messages: Message[];
    mode: Mode;
    date: number;
};

// --- RAG System Types ---
interface FatwaEntry {
    content: string;
    metadata: {
        title: string;
        source: string;
        section?: string;
        questionNumber?: string;
        sourceUrl?: string;
    },
    similarity: number;
}

// Search function calling Serverless API
const searchFatwas = async (query: string): Promise<string> => {
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.error("Search API failed");
            return '';
        }

        const { results } = await response.json();

        if (!results || results.length === 0) return '';

        // Format results for the LLM
        let context = "فيما يلي فتاوى ومسائل فقهية ذات صلة من مصادر السيد السيستاني (استخدمها للإجابة بدقة):\n\n";

        results.forEach((item: FatwaEntry, index: number) => {
            const meta = item.metadata;
            context += `[المصدر ${index + 1}]:\n`;
            context += `الكتاب: ${meta.source}\n`;
            if (meta.section) context += `القسم: ${meta.section}\n`;
            if (meta.title) context += `العنوان: ${meta.title}\n`;
            if (meta.questionNumber) context += `الرقم: ${meta.questionNumber}\n`;
            context += `الرابط: ${meta.sourceUrl || 'غير متوفر'}\n`;
            // Similarity score is available in item.similarity if needed
            context += `نص الفتوى: ${item.content}\n\n`;
            context += `-----------------------------------\n`;
        });

        return context;
    } catch (error) {
        console.error("Error searching fatwas:", error);
        return '';
    }
};

// --- Translations ---
const translations: Record<Language, Record<string, string>> = {
    ar: {
        appName: 'مساعد الفقيه',
        appDescription: 'نظام ذكي للمساعدة في استرداد وفهم الفتاوى الشرعية وفقاً لمنهج سماحة السيد السيستاني (دام ظلّه).',
        selectMode: 'يرجى اختيار نمط الإجابة للبدء:',
        literalMode: 'الوضع الحرفي',
        literalModeDesc: 'يقوم باستخراج نصوص الفتاوى حرفياً من المصادر المعتمدة دون أي زيادة أو شرح. مناسب للبحث عن نص فتوى محدد.',
        literalModeTag: 'بحث دقيق',
        understandingMode: 'وضع الفهم المستنبط',
        understandingModeDesc: 'يقدم شرحاً وتوضيحاً للمسألة بالاعتماد على القواعد العامة والنصوص المشابهة. مناسب للمسائل المعقدة التي تحتاج تفصيلاً.',
        understandingModeTag: 'تحليل وتوضيح',
        startNow: 'ابدأ الآن',
        previousSessions: 'استكمال محادثة سابقة',
        newChat: 'محادثة جديدة',
        history: 'السجل السابق',
        settings: 'إعدادات الإجابة',
        installApp: 'تثبيت التطبيق',
        placeholder: 'اكتب سؤالك الفقهي هنا...',
        searching: 'جاري البحث في المصادر المعتمدة...',
        footer: 'وحدة تنمية المقتنيات - شعبة نظم المعلومات وادارة المعارف',
        footer2: 'قسم الشؤون الفكرية والثقافية - العتبة الحسينية المقدسة',
        modeLiteral: 'الوضع: نصي حرفي (دقيق)',
        modeUnderstanding: 'الوضع: فهم واستنباط (توضيحي)',
        welcomeMessage: 'السلام عليكم ورحمة الله وبركاته.',
        welcomeIntro: 'أنا "مساعد الفقيه"، متخصص في فتاوى سماحة السيد السيستاني (دام ظلّه).',
        welcomeMode: 'لقد اخترت',
        welcomeChangeMode: 'يمكنك تغيير الوضع في أي وقت من القائمة الجانبية.',
        welcomeAsk: 'يرجى كتابة سؤالك الفقهي بدقة.',
        errorMessage: 'خطأ تقني: حدثت مشكلة أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
        noSpeechSupport: 'عذراً، متصفحك لا يدعم خاصية التسجيل الصوتي.',
        noAnswer: 'عذراً، لم أتمكن من استخراج إجابة.',
        language: 'لغة العرض',
        delete: 'حذف',
    },
    en: {
        appName: 'Faqih Assistant',
        appDescription: 'An intelligent system to help retrieve and understand Islamic jurisprudence according to the methodology of Grand Ayatollah Sistani.',
        selectMode: 'Please select the response mode to start:',
        literalMode: 'Literal Mode',
        literalModeDesc: 'Extracts fatwas verbatim from approved sources without any addition or explanation. Suitable for searching for specific fatwa text.',
        literalModeTag: 'Precise Search',
        understandingMode: 'Understanding Mode',
        understandingModeDesc: 'Provides explanation and clarification of the issue based on general rules and similar texts. Suitable for complex issues that need elaboration.',
        understandingModeTag: 'Analysis & Clarification',
        startNow: 'Start Now',
        previousSessions: 'Continue Previous Conversation',
        newChat: 'New Chat',
        history: 'Previous History',
        settings: 'Response Settings',
        installApp: 'Install App',
        placeholder: 'Type your question here...',
        searching: 'Searching approved sources...',
        footer: 'Acquisitions Development Unit - Information Systems and Knowledge Management Division',
        footer2: 'Intellectual and Cultural Affairs Department - Holy Husseini Shrine',
        modeLiteral: 'Mode: Literal Text (Precise)',
        modeUnderstanding: 'Mode: Understanding (Explanatory)',
        welcomeMessage: 'Peace be upon you and the mercy of Allah and His blessings.',
        welcomeIntro: 'I am "Faqih Assistant", specialized in the fatwas of Grand Ayatollah Sistani.',
        welcomeMode: 'You have selected',
        welcomeChangeMode: 'You can change the mode at any time from the sidebar.',
        welcomeAsk: 'Please write your jurisprudential question precisely.',
        errorMessage: 'Technical Error: A problem occurred while connecting to the server. Please try again.',
        noSpeechSupport: 'Sorry, your browser does not support voice recording.',
        noAnswer: 'Sorry, I could not extract an answer.',
        language: 'Display Language',
        delete: 'Delete',
    },
    fa: {
        appName: 'دستیار فقیه',
        appDescription: 'سیستم هوشمند برای کمک در بازیابی و درک احکام شرعی بر اساس روش حضرت آیت‌الله العظمی سیستانی (دام ظله).',
        selectMode: 'لطفاً حالت پاسخ را برای شروع انتخاب کنید:',
        literalMode: 'حالت حرفی',
        literalModeDesc: 'فتاوا را به صورت حرفی از منابع معتبر استخراج می‌کند بدون هیچ افزودنی یا توضیح. مناسب برای جستجوی متن فتوای خاص.',
        literalModeTag: 'جستجوی دقیق',
        understandingMode: 'حالت فهم و استنباط',
        understandingModeDesc: 'توضیح و تفسیر مسئله را بر اساس قواعد کلی و متون مشابه ارائه می‌دهد. مناسب برای مسائل پیچیده که نیاز به تفصیل دارند.',
        understandingModeTag: 'تحلیل و توضیح',
        startNow: 'شروع کنید',
        previousSessions: 'ادامه گفتگوی قبلی',
        newChat: 'گفتگوی جدید',
        history: 'تاریخچه قبلی',
        settings: 'تنظیمات پاسخ',
        installApp: 'نصب برنامه',
        placeholder: 'سوال فقهی خود را بنویسید...',
        searching: 'در حال جستجو در منابع معتبر...',
        footer: 'واحد توسعه مجموعه‌ها - بخش سیستم‌های اطلاعات و مدیریت دانش',
        footer2: 'بخش امور فکری و فرهنگی - آستان مقدس حسینی',
        modeLiteral: 'حالت: متن حرفی (دقیق)',
        modeUnderstanding: 'حالت: فهم و استنباط (توضیحی)',
        welcomeMessage: 'السلام علیکم و رحمة الله و برکاته',
        welcomeIntro: 'من "دستیار فقیه" هستم، متخصص در فتاوای حضرت آیت‌الله سیستانی (دام ظله).',
        welcomeMode: 'شما انتخاب کرده‌اید',
        welcomeChangeMode: 'می‌توانید حالت را در هر زمان از نوار کناری تغییر دهید.',
        welcomeAsk: 'لطفاً سوال فقهی خود را با دقت بنویسید.',
        errorMessage: 'خطای فنی: مشکلی در اتصال به سرور رخ داد. لطفاً دوباره تلاش کنید.',
        noSpeechSupport: 'متأسفانه مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.',
        noAnswer: 'متأسفانه نتوانستم پاسخی استخراج کنم.',
        language: 'زبان نمایش',
        delete: 'حذف',
    },
    ur: {
        appName: 'فقیہ اسسٹنٹ',
        appDescription: 'آیت اللہ العظمیٰ سیستانی کے منہج کے مطابق اسلامی فقہ کو سمجھنے اور تلاش کرنے میں مدد کے لیے ذہین نظام۔',
        selectMode: 'شروع کرنے کے لیے جواب کا طریقہ منتخب کریں:',
        literalMode: 'لفظی موڈ',
        literalModeDesc: 'منظور شدہ ذرائع سے بغیر کسی اضافے یا وضاحت کے فتاویٰ کو حرف بحرف نکالتا ہے۔ مخصوص فتویٰ کی تلاش کے لیے موزوں۔',
        understandingMode: 'فہم کا موڈ',
        understandingModeDesc: 'عام قواعد اور ملتی جلتی نصوص کی بنیاد پر مسئلے کی وضاحت فراہم کرتا ہے۔ پیچیدہ مسائل کے لیے موزوں۔',
        understandingModeTag: 'تجزیہ اور وضاحت',
        startNow: 'ابھی شروع کریں',
        previousSessions: 'پچھلی گفتگو جاری رکھیں',
        newChat: 'نئی گفتگو',
        history: 'پچھلی تاریخ',
        settings: 'جواب کی ترتیبات',
        installApp: 'ایپ انسٹال کریں',
        placeholder: 'اپنا فقہی سوال لکھیں...',
        searching: 'منظور شدہ ذرائع میں تلاش ہو رہی ہے...',
        footer: 'ایکوزیشنز ڈیولپمنٹ یونٹ - انفارمیشن سسٹمز اینڈ نالج مینجمنٹ ڈویژن',
        footer2: 'فکری اور ثقافتی امور کا شعبہ - روضہ مقدسہ امام حسین',
        modeLiteral: 'موڈ: لفظی متن (درست)',
        modeUnderstanding: 'موڈ: فہم (وضاحتی)',
        welcomeMessage: 'السلام علیکم ورحمۃ اللہ وبرکاتہ',
        welcomeIntro: 'میں "فقیہ اسسٹنٹ" ہوں، آیت اللہ سیستانی کے فتاویٰ میں ماہر۔',
        welcomeMode: 'آپ نے منتخب کیا',
        welcomeChangeMode: 'آپ کسی بھی وقت سائیڈبار سے موڈ تبدیل کر سکتے ہیں۔',
        welcomeAsk: 'براہ کرم اپنا فقہی سوال درستگی سے لکھیں۔',
        errorMessage: 'تکنیکی خرابی: سرور سے رابطے میں مسئلہ ہوا۔ براہ کرم دوبارہ کوشش کریں۔',
        noSpeechSupport: 'معذرت، آپ کا براؤزر آواز ریکارڈنگ کی حمایت نہیں کرتا۔',
        noAnswer: 'معذرت، میں جواب نکالنے سے قاصر رہا۔',
        language: 'ڈسپلے زبان',
        delete: 'حذف کریں',
    },
    tr: {
        appName: 'Fakih Asistanı',
        appDescription: 'Ayetullah Sistani\'nin metodolojisine göre İslam fıkhını anlamak ve aramak için akıllı bir sistem.',
        selectMode: 'Başlamak için yanıt modunu seçin:',
        literalMode: 'Literal Mod',
        literalModeDesc: 'Onaylı kaynaklardan fetvaları herhangi bir ekleme veya açıklama olmadan kelimesi kelimesine çıkarır. Belirli fetva metni aramak için uygundur.',
        literalModeTag: 'Hassas Arama',
        understandingMode: 'Anlayış Modu',
        understandingModeDesc: 'Genel kurallara ve benzer metinlere dayalı olarak konunun açıklamasını sağlar. Detay gerektiren karmaşık konular için uygundur.',
        understandingModeTag: 'Analiz ve Açıklama',
        startNow: 'Şimdi Başla',
        previousSessions: 'Önceki Sohbete Devam Et',
        newChat: 'Yeni Sohbet',
        history: 'Önceki Geçmiş',
        settings: 'Yanıt Ayarları',
        installApp: 'Uygulamayı Yükle',
        placeholder: 'Sorunuzu buraya yazın...',
        searching: 'Onaylı kaynaklarda aranıyor...',
        footer: 'Edinim Geliştirme Birimi - Bilgi Sistemleri ve Bilgi Yönetimi Bölümü',
        footer2: 'Fikri ve Kültürel İşler Departmanı - Kutsal Hüseyni Türbesi',
        modeLiteral: 'Mod: Literal Metin (Hassas)',
        modeUnderstanding: 'Mod: Anlayış (Açıklayıcı)',
        welcomeMessage: 'Es-selamu aleykum ve rahmetullahi ve berekatuh',
        welcomeIntro: 'Ben "Fakih Asistanı"yım, Ayetullah Sistani\'nin fetvalarında uzmanım.',
        welcomeMode: 'Seçtiniz',
        welcomeChangeMode: 'Modu istediğiniz zaman kenar çubuğundan değiştirebilirsiniz.',
        welcomeAsk: 'Lütfen fıkhi sorunuzu dikkatli bir şekilde yazın.',
        errorMessage: 'Teknik Hata: Sunucuya bağlanırken bir sorun oluştu. Lütfen tekrar deneyin.',
        noSpeechSupport: 'Üzgünüz, tarayıcınız ses kaydını desteklemiyor.',
        noAnswer: 'Üzgünüz, bir cevap çıkaramadım.',
        language: 'Görüntüleme Dili',
        delete: 'Sil',
    },
    fr: {
        appName: 'Assistant Faqih',
        appDescription: 'Un système intelligent pour aider à récupérer et comprendre la jurisprudence islamique selon la méthodologie de l\'Ayatollah Sistani.',
        selectMode: 'Veuillez sélectionner le mode de réponse pour commencer:',
        literalMode: 'Mode Littéral',
        literalModeDesc: 'Extrait les fatwas mot à mot des sources approuvées sans ajout ni explication. Convient à la recherche de texte de fatwa spécifique.',
        literalModeTag: 'Recherche Précise',
        understandingMode: 'Mode Compréhension',
        understandingModeDesc: 'Fournit une explication et une clarification du sujet basées sur les règles générales et les textes similaires. Convient aux questions complexes.',
        understandingModeTag: 'Analyse et Clarification',
        startNow: 'Commencer',
        previousSessions: 'Continuer la Conversation Précédente',
        newChat: 'Nouvelle Discussion',
        history: 'Historique',
        settings: 'Paramètres de Réponse',
        installApp: 'Installer l\'Application',
        placeholder: 'Écrivez votre question ici...',
        searching: 'Recherche dans les sources approuvées...',
        footer: 'Unité de Développement des Acquisitions - Division des Systèmes d\'Information',
        footer2: 'Département des Affaires Intellectuelles et Culturelles - Sanctuaire Sacré Husseini',
        modeLiteral: 'Mode: Texte Littéral (Précis)',
        modeUnderstanding: 'Mode: Compréhension (Explicatif)',
        welcomeMessage: 'Que la paix soit sur vous ainsi que la miséricorde d\'Allah et Ses bénédictions.',
        welcomeIntro: 'Je suis "Assistant Faqih", spécialisé dans les fatwas de l\'Ayatollah Sistani.',
        welcomeMode: 'Vous avez sélectionné',
        welcomeChangeMode: 'Vous pouvez changer le mode à tout moment depuis la barre latérale.',
        welcomeAsk: 'Veuillez écrire votre question juridique avec précision.',
        errorMessage: 'Erreur Technique: Un problème est survenu lors de la connexion au serveur. Veuillez réessayer.',
        noSpeechSupport: 'Désolé, votre navigateur ne prend pas en charge l\'enregistrement vocal.',
        noAnswer: 'Désolé, je n\'ai pas pu extraire de réponse.',
        language: 'Langue d\'Affichage',
        delete: 'Supprimer',
    },
    hi: {
        appName: 'फ़क़ीह सहायक',
        appDescription: 'आयतुल्लाह सिस्तानी की पद्धति के अनुसार इस्लामी न्यायशास्त्र को समझने और खोजने में मदद करने के लिए एक बुद्धिमान प्रणाली।',
        selectMode: 'शुरू करने के लिए कृपया प्रतिक्रिया मोड चुनें:',
        literalMode: 'शाब्दिक मोड',
        literalModeDesc: 'स्वीकृत स्रोतों से बिना किसी जोड़ या स्पष्टीकरण के फतवों को शब्दशः निकालता है। विशिष्ट फतवा पाठ खोजने के लिए उपयुक्त।',
        literalModeTag: 'सटीक खोज',
        understandingMode: 'समझ मोड',
        understandingModeDesc: 'सामान्य नियमों और समान पाठों के आधार पर मुद्दे की व्याख्या प्रदान करता है। जटिल मुद्दों के लिए उपयुक्त।',
        understandingModeTag: 'विश्लेषण और स्पष्टीकरण',
        startNow: 'अभी शुरू करें',
        previousSessions: 'पिछली बातचीत जारी रखें',
        newChat: 'नई चैट',
        history: 'पिछला इतिहास',
        settings: 'प्रतिक्रिया सेटिंग्स',
        installApp: 'ऐप इंस्टॉल करें',
        placeholder: 'अपना प्रश्न यहाँ लिखें...',
        searching: 'स्वीकृत स्रोतों में खोज रहा है...',
        footer: 'अधिग्रहण विकास इकाई - सूचना प्रणाली और ज्ञान प्रबंधन प्रभाग',
        footer2: 'बौद्धिक और सांस्कृतिक मामलों का विभाग - पवित्र हुसैनी मंदिर',
        modeLiteral: 'मोड: शाब्दिक पाठ (सटीक)',
        modeUnderstanding: 'मोड: समझ (व्याख्यात्मक)',
        welcomeMessage: 'अस्सलामु अलैकुम व रहमतुल्लाहि व बरकातुहु',
        welcomeIntro: 'मैं "फ़क़ीह सहायक" हूँ, आयतुल्लाह सिस्तानी के फतवों में विशेषज्ञ।',
        welcomeMode: 'आपने चुना है',
        welcomeChangeMode: 'आप किसी भी समय साइडबार से मोड बदल सकते हैं।',
        welcomeAsk: 'कृपया अपना न्यायशास्त्रीय प्रश्न सावधानी से लिखें।',
        errorMessage: 'तकनीकी त्रुटि: सर्वर से कनेक्ट करते समय समस्या हुई। कृपया पुनः प्रयास करें।',
        noSpeechSupport: 'क्षमा करें, आपका ब्राउज़र वॉयस रिकॉर्डिंग का समर्थन नहीं करता।',
        noAnswer: 'क्षमा करें, मैं उत्तर निकालने में असमर्थ रहा।',
        language: 'प्रदर्शन भाषा',
        delete: 'हटाएं',
    },
};

const languageNames: Record<Language, string> = {
    ar: 'العربية',
    en: 'English',
    fa: 'فارسی',
    ur: 'اردو',
    tr: 'Türkçe',
    fr: 'Français',
    hi: 'हिंदी',
};

const rtlLanguages: Language[] = ['ar', 'fa', 'ur'];

// Colors Constant
const COLORS = {
    primary: 'bg-[#004D40]', // Deep Shrine Teal
    primaryHover: 'hover:bg-[#00695C]',
    primaryLight: 'bg-[#E0F2F1]',
    accent: 'bg-[#C5A059]', // Shrine Gold
    accentText: 'text-[#C5A059]',
    accentBorder: 'border-[#C5A059]',
    accentHover: 'hover:bg-[#B08D55]',
    bgLight: 'bg-[#FDFBF7]', // Cream
    textDark: 'text-[#004D40]',
};

const App = () => {
    // State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('MODE_LITERAL');
    const [hasStarted, setHasStarted] = useState(false);
    const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [language, setLanguage] = useState<Language>('ar');

    // Get translation helper
    const t = (key: string) => translations[language][key] || key;
    const isRTL = rtlLanguages.includes(language);


    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const shouldAutoSendRef = useRef(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop after one sentence
            recognition.interimResults = false;
            recognition.lang = 'ar-SA'; // Standard Arabic

            recognition.onstart = () => setIsRecording(true);
            recognition.onend = () => setIsRecording(false);

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // PWA Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("عذراً، متصفحك لا يدعم خاصية التسجيل الصوتي.");
            return;
        }

        if (isRecording) {
            shouldAutoSendRef.current = true;
            recognitionRef.current.stop();
        } else {
            shouldAutoSendRef.current = false;
            recognitionRef.current.start();
        }
    };

    // Load sessions from local storage on mount
    useEffect(() => {
        const savedSessions = localStorage.getItem('faqih_sessions');
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                setSessions(parsed);
            } catch (e) {
                console.error("Failed to load sessions", e);
            }
        }
    }, []);

    // Save sessions to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('faqih_sessions', JSON.stringify(sessions));
    }, [sessions]);

    // Initial Welcome Message Logic - Only when starting fresh in a session
    useEffect(() => {
        if (hasStarted && messages.length === 0) {
            const modeText = mode === 'MODE_LITERAL' ? t('literalMode') : t('understandingMode');
            setMessages([
                {
                    role: 'model',
                    text: `**${t('welcomeMessage')}**
                    
${t('welcomeIntro')}
${t('welcomeMode')} **${modeText}**. ${t('welcomeChangeMode')}
${t('welcomeAsk')}`
                }
            ]);
        }
        // Update welcome message when language changes (only if it's the only message)
        if (hasStarted && messages.length === 1 && messages[0].role === 'model') {
            const modeText = mode === 'MODE_LITERAL' ? t('literalMode') : t('understandingMode');
            setMessages([
                {
                    role: 'model',
                    text: `**${t('welcomeMessage')}**
                    
${t('welcomeIntro')}
${t('welcomeMode')} **${modeText}**. ${t('welcomeChangeMode')}
${t('welcomeAsk')}`
                }
            ]);
        }
    }, [hasStarted, mode, language]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (hasStarted) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, hasStarted, isLoading]);

    // Start a new chat flow (from intro screen)
    const handleStart = (selectedMode: Mode) => {
        setMode(selectedMode);
        setHasStarted(true);
        startNewSession(selectedMode);
    };

    const startNewSession = (selectedMode: Mode = mode) => {
        setMessages([]);
        setMode(selectedMode);
        setCurrentSessionId(null);
        setHasStarted(true);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        if (currentSessionId === id) {
            setHasStarted(false);
            setMessages([]);
            setCurrentSessionId(null);
        }
    };

    const loadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setMode(session.mode);
        setHasStarted(true);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const handleSend = async () => {
        console.log("handleSend called", { input: input.trim(), isLoading });
        if (!input.trim() || isLoading) {
            console.log("handleSend returning early", { input: input.trim(), isLoading });
            return;
        }

        const userMessageText = input.trim();
        const newMessage: Message = { role: 'user', text: userMessageText };
        setInput('');
        setIsLoading(true);
        console.log("handleSend proceeding", { userMessageText });

        // Update Messages State
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);

        // Session Management
        let sessionId = currentSessionId;
        let newSessionsList = [...sessions];

        if (!sessionId) {
            // Create new session if none exists
            sessionId = crypto.randomUUID();
            setCurrentSessionId(sessionId);

            const newSession: ChatSession = {
                id: sessionId,
                title: userMessageText.substring(0, 40) + (userMessageText.length > 40 ? '...' : ''),
                messages: updatedMessages,
                mode: mode,
                date: Date.now()
            };
            newSessionsList = [newSession, ...newSessionsList];
        } else {
            // Update existing session
            newSessionsList = newSessionsList.map(s =>
                s.id === sessionId
                    ? { ...s, messages: updatedMessages, date: Date.now() } // Update date to bump to top if we sorted by date
                    : s
            );
            // Optional: Move active session to top
            const activeSession = newSessionsList.find(s => s.id === sessionId);
            if (activeSession) {
                newSessionsList = [activeSession, ...newSessionsList.filter(s => s.id !== sessionId)];
            }
        }
        setSessions(newSessionsList);

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Step 1: Detect if the language is Arabic using Regex OR if the UI language is already Arabic
            const isTextArabic = /[\u0600-\u06FF]/.test(userMessageText);
            const isUiArabic = language === 'ar';
            // We consider the input "Arabic" if either the text is Arabic or the user chose Arabic UI
            const isArabic = isTextArabic || isUiArabic;
            const detectedLang = isArabic ? 'ar' : language; // Default to UI language if not Arabic

            let questionInArabic = userMessageText;

            // Step 2: If not Arabic, translate the question to Arabic
            if (!isArabic) {
                const translateToArabicResponse = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Translate the following text to Arabic. Provide ONLY the translation, nothing else:\n\n"${userMessageText}"` }]
                    }]
                });
                questionInArabic = translateToArabicResponse.text || userMessageText;
            }


            // Step 3: Search local fatwas data (RAG)
            const ragContext = await searchFatwas(questionInArabic);

            // Step 4: Get the fiqh answer in Arabic with RAG context
            const promptWithContext = `[${mode}] ${questionInArabic}${ragContext}`;

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [
                    ...messages.filter(m => m.role === 'model' || isArabic).map(m => ({
                        role: m.role,
                        parts: [{ text: m.text }]
                    })),
                    {
                        role: 'user',
                        parts: [{ text: promptWithContext }]
                    }
                ],
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    temperature: 0.3,
                }
            });

            let text = response.text || "عذراً، لم أتمكن من استخراج إجابة.";

            // Step 4: If the original question was not in Arabic, translate the answer back to the user's language
            if (!isArabic) {
                const langNames: { [key: string]: string } = {
                    'en': 'English', 'fa': 'Persian/Farsi', 'ur': 'Urdu', 'fr': 'French',
                    'es': 'Spanish', 'de': 'German', 'tr': 'Turkish', 'id': 'Indonesian',
                    'ms': 'Malay', 'bn': 'Bengali', 'hi': 'Hindi', 'ru': 'Russian',
                    'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'pt': 'Portuguese',
                    'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish'
                };
                const targetLangName = langNames[detectedLang] || detectedLang;
                const translateBackResponse = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Translate the following Islamic jurisprudence (fiqh) answer from Arabic to ${targetLangName}. Maintain the formal scholarly tone and preserve any Arabic religious terms with their transliteration where appropriate. Provide ONLY the translation:\n\n${text}` }]
                    }],
                    config: { temperature: 0.2 }
                });
                text = translateBackResponse.text || text;
            }

            const modelMessage: Message = { role: 'model', text };

            // Update messages with AI response
            const finalMessages = [...updatedMessages, modelMessage];
            setMessages(finalMessages);

            // Update session storage with AI response
            setSessions(prev => prev.map(s =>
                s.id === sessionId
                    ? { ...s, messages: finalMessages }
                    : s
            ));

        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                role: 'model',
                text: "**خطأ تقني:** حدثت مشكلة أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const goToHome = () => {
        setHasStarted(false);
        setMessages([]);
        setCurrentSessionId(null);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    // Auto Send Effect
    useEffect(() => {
        if (!isRecording && shouldAutoSendRef.current) {
            if (input.trim()) {
                handleSend();
            }
            shouldAutoSendRef.current = false;
        }
    }, [isRecording]);

    // --- Intro Screen Component ---
    if (!hasStarted) {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex min-h-screen ${COLORS.bgLight} font-sans relative overflow-hidden flex-col items-center justify-center p-4 ${language === 'ur' ? 'urdu-text' : ''} ${language === 'fa' ? 'persian-text' : ''}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none bg-pattern z-0 opacity-10" />

                {/* Language Selector - Top Right */}
                <div className="absolute top-4 right-4 z-20">
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className={`appearance-none ${COLORS.primary} text-white px-4 py-2 pr-10 rounded-lg cursor-pointer text-sm font-medium shadow-lg border-2 border-[#C5A059] focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                        >
                            {(Object.keys(languageNames) as Language[]).map(lang => (
                                <option key={lang} value={lang}>{languageNames[lang]}</option>
                            ))}
                        </select>
                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059] pointer-events-none" />
                    </div>
                </div>

                <div className="relative z-10 w-full max-w-4xl animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${COLORS.primary} shadow-xl mb-6 border-4 border-[#C5A059]`}>
                            <Scroll className="w-10 h-10 text-white" />
                        </div>
                        <h1 className={`text-4xl md:text-5xl font-bold ${COLORS.textDark} mb-4 font-serif`}>
                            {t('appName')}
                        </h1>
                        <p className="text-slate-500 mt-4 max-w-lg mx-auto leading-relaxed text-center">
                            {t('appDescription')}
                            <br />
                            <span className="text-sm font-bold mt-2 block text-center">{t('selectMode')}</span>
                        </p>
                    </div>

                    {/* Mode Selection Cards */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">

                        {/* Literal Mode Card */}
                        <button
                            onClick={() => handleStart('MODE_LITERAL')}
                            className={`group relative bg-white border-2 border-slate-200 hover:border-[#C5A059] rounded-2xl p-8 ${isRTL ? 'text-right' : 'text-left'} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start gap-4`}
                        >
                            <div className={`p-3 rounded-xl ${COLORS.primaryLight} group-hover:bg-[#004D40] transition-colors`}>
                                <FileText className={`w-8 h-8 text-[#004D40] group-hover:text-white transition-colors`} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${COLORS.textDark} mb-2 group-hover:text-[#C5A059] transition-colors`}>
                                    {t('literalMode')}
                                    <span className={`text-xs font-normal text-slate-400 ${isRTL ? 'mr-2' : 'ml-2'} bg-slate-100 px-2 py-0.5 rounded-full`}>{t('literalModeTag')}</span>
                                </h3>
                                <p className={`text-slate-600 text-sm leading-relaxed ${isRTL ? 'text-justify' : 'text-left'}`}>
                                    {t('literalModeDesc')}
                                </p>
                            </div>
                            <div className="mt-auto w-full pt-4 border-t border-slate-100 flex justify-between items-center text-[#C5A059] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>{t('startNow')}</span>
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                            </div>
                        </button>

                        {/* Understanding Mode Card */}
                        <button
                            onClick={() => handleStart('MODE_UNDERSTANDING')}
                            className={`group relative bg-white border-2 border-slate-200 hover:border-[#C5A059] rounded-2xl p-8 ${isRTL ? 'text-right' : 'text-left'} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start gap-4`}
                        >
                            <div className={`p-3 rounded-xl ${COLORS.primaryLight} group-hover:bg-[#004D40] transition-colors`}>
                                <BookOpen className={`w-8 h-8 text-[#004D40] group-hover:text-white transition-colors`} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${COLORS.textDark} mb-2 group-hover:text-[#C5A059] transition-colors`}>
                                    {t('understandingMode')}
                                    <span className={`text-xs font-normal text-slate-400 ${isRTL ? 'mr-2' : 'ml-2'} bg-slate-100 px-2 py-0.5 rounded-full`}>{t('understandingModeTag')}</span>
                                </h3>
                                <p className={`text-slate-600 text-sm leading-relaxed ${isRTL ? 'text-justify' : 'text-left'}`}>
                                    {t('understandingModeDesc')}
                                </p>
                            </div>
                            <div className="mt-auto w-full pt-4 border-t border-slate-100 flex justify-between items-center text-[#C5A059] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>{t('startNow')}</span>
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Previous Sessions in Intro */}
                    {sessions.length > 0 && (
                        <div className="max-w-xl mx-auto w-full">
                            <h3 className="text-center text-slate-400 text-sm font-bold mb-4 flex items-center justify-center gap-2">
                                <History className="w-4 h-4" />
                                {t('previousSessions')}
                            </h3>
                            <div className="grid gap-2">
                                {sessions.slice(0, 3).map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className={`bg-white border border-slate-200 hover:border-[#C5A059] p-3 rounded-lg ${isRTL ? 'text-right' : 'text-left'} text-sm text-slate-700 hover:bg-[#fdfbf7] transition-all flex justify-between items-center group`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="truncate">{session.title}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : language)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center mt-12 text-slate-400 text-xs leading-relaxed">
                        {t('footer')}
                        <br />
                        {t('footer2')}
                    </div>
                </div>
            </div>
        );
    }



    // --- Main App Interface ---
    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex h-screen ${COLORS.bgLight} text-slate-800 font-sans overflow-hidden ${language === 'ur' ? 'urdu-text' : ''} ${language === 'fa' ? 'persian-text' : ''}`}>

            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none bg-pattern z-0" />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar / Settings Panel */}
            <aside className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-80 ${COLORS.primary} text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}>
                <div className="p-6 border-b border-teal-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={goToHome}>
                            <Scroll className={`w-8 h-8 ${COLORS.accentText}`} />
                        </div>
                        <div>
                            <h1 className={`font-bold text-lg leading-tight ${COLORS.accentText}`}>{t('appName')}</h1>
                        </div>
                    </div>
                    {/* Close Button Mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-teal-200 hover:text-white p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-4 pb-2">
                    <button
                        onClick={() => goToHome()}
                        className={`w-full flex items-center gap-2 bg-[#C5A059] hover:bg-[#B08D55] text-white py-3 px-4 rounded-xl font-bold shadow-lg transition-all transform hover:scale-[1.02]`}
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('newChat')}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">

                    {/* Chat History Section */}
                    {sessions.length > 0 && (
                        <div className="mb-6">
                            <h3 className={`text-xs font-semibold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2 px-2`}>
                                <History className="w-3 h-3" />
                                {t('history')}
                            </h3>
                            <div className="space-y-1">
                                {sessions.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent ${currentSessionId === session.id
                                            ? 'bg-white/10 border-teal-700/50 text-white shadow-sm'
                                            : 'text-teal-100 hover:bg-[#005a4e] hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-[#C5A059]' : 'opacity-50'}`} />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm truncate font-medium block">{session.title}</span>
                                                <span className="text-[10px] opacity-60 truncate">
                                                    {new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : language)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteSession(e, session.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 rounded text-red-300 hover:text-red-200 transition-all"
                                            title={t('delete')}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Language Selection */}
                    <div className="mb-6 pt-4 border-t border-teal-800/50">
                        <h3 className={`text-xs font-semibold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2 px-2`}>
                            <Globe className="w-3 h-3" />
                            {t('language')}
                        </h3>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full bg-teal-800/50 text-white p-3 rounded-lg border border-teal-700 focus:outline-none focus:ring-2 focus:ring-[#C5A059] cursor-pointer"
                        >
                            {(Object.keys(languageNames) as Language[]).map(lang => (
                                <option key={lang} value={lang}>{languageNames[lang]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Settings Section */}
                    <div className="mb-8 pt-4 border-t border-teal-800/50">
                        <h3 className={`text-xs font-semibold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2 px-2`}>
                            <Settings className="w-3 h-3" />
                            {t('settings')}
                        </h3>

                        {/* Install Button (Desktop) */}
                        {deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="w-full flex items-center gap-2 bg-teal-800/50 hover:bg-teal-700 text-teal-100 p-3 rounded-lg mb-4 border border-teal-700 transition-colors"
                            >
                                <Download className="w-4 h-4 text-[#C5A059]" />
                                <span className="text-sm font-bold">{t('installApp')}</span>
                            </button>
                        )}

                        <div className="space-y-2">
                            <label className={`group block p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${mode === 'MODE_LITERAL' ? `border-[#C5A059] bg-[#00695C]` : 'border-teal-800 hover:bg-[#005a4e]'}`}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="MODE_LITERAL"
                                    checked={mode === 'MODE_LITERAL'}
                                    onChange={() => setMode('MODE_LITERAL')}
                                    className="hidden"
                                />
                                <div className={`font-bold text-sm flex items-center justify-between ${mode === 'MODE_LITERAL' ? 'text-white' : 'text-teal-100'}`}>
                                    <span className="flex items-center gap-2"><FileText className="w-3 h-3" /> {t('literalMode')}</span>
                                    {mode === 'MODE_LITERAL' && <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />}
                                </div>
                            </label>

                            <label className={`group block p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${mode === 'MODE_UNDERSTANDING' ? `border-[#C5A059] bg-[#00695C]` : 'border-teal-800 hover:bg-[#005a4e]'}`}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="MODE_UNDERSTANDING"
                                    checked={mode === 'MODE_UNDERSTANDING'}
                                    onChange={() => setMode('MODE_UNDERSTANDING')}
                                    className="hidden"
                                />
                                <div className={`font-bold text-sm flex items-center justify-between ${mode === 'MODE_UNDERSTANDING' ? 'text-white' : 'text-teal-100'}`}>
                                    <span className="flex items-center gap-2"><BookOpen className="w-3 h-3" /> {t('understandingMode')}</span>
                                    {mode === 'MODE_UNDERSTANDING' && <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-[#00352c] border-t border-teal-800">
                    <div className="text-[10px] text-center text-teal-300 leading-relaxed px-2">
                        {t('footer')}
                        <br />
                        {t('footer2')}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full relative z-0">

                {/* Mobile Header */}
                <header className={`md:hidden ${COLORS.primary} text-white p-4 flex justify-between items-center shadow-md z-10 sticky top-0`}>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(true)} className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} text-teal-100 hover:text-white rounded-md hover:bg-white/10 transition-colors`}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2" onClick={goToHome}>
                            <Scroll className={`w-6 h-6 text-[#C5A059] ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            <div>
                                <h1 className="font-bold text-sm">{t('appName')}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Install Button (Mobile) */}
                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="p-2 bg-teal-800 rounded-md text-white border border-teal-600">
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={goToHome} className="p-2 bg-[#C5A059] rounded-md text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 space-y-4 md:space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-2 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border-2 ${msg.role === 'user'
                                ? 'bg-[#004D40] border-[#00695C] text-white'
                                : 'bg-white border-[#C5A059] text-[#004D40]'
                                }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Scroll className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[85%] sm:max-w-[90%] md:max-w-[75%] rounded-2xl px-3 sm:px-5 md:px-6 py-3 sm:py-4 shadow-sm ${msg.role === 'user'
                                ? `bg-[#004D40] text-white ${isRTL ? 'rounded-tr-none' : 'rounded-tl-none'}`
                                : `bg-white ${isRTL ? 'border-r-4' : 'border-l-4'} border-[#C5A059] text-slate-800 ${isRTL ? 'rounded-tl-none' : 'rounded-tr-none'}`
                                }`}>
                                <div className={`markdown-body text-sm sm:text-base leading-relaxed sm:leading-loose ${isRTL ? 'text-right' : 'text-left'} ${msg.role === 'user' ? 'text-white' : ''}`}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#C5A059] text-[#004D40] flex items-center justify-center shrink-0 shadow-md">
                                <Scroll className="w-5 h-5" />
                            </div>
                            <div className={`bg-white ${isRTL ? 'border-r-4' : 'border-l-4'} border-[#C5A059] rounded-2xl ${isRTL ? 'rounded-tl-none' : 'rounded-tr-none'} px-6 py-4 shadow-sm`}>
                                <div className="flex items-center gap-2 text-teal-700 text-sm font-semibold">
                                    <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce delay-150"></span>
                                    {t('searching')}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 md:p-6 border-t border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] relative z-10">
                    <div className="max-w-4xl mx-auto relative">
                        <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} -mt-10 mb-2 flex ${isRTL ? 'justify-end' : 'justify-start'} w-full px-2 pointer-events-none`}>
                            <span className={`bg-[#004D40] text-[#C5A059] text-xs px-3 py-1 ${isRTL ? 'rounded-t-lg' : 'rounded-t-lg'} opacity-0 md:opacity-100 transition-opacity shadow-sm border-t border-x border-[#00695C]`}>
                                {mode === 'MODE_LITERAL' ? t('modeLiteral') : t('modeUnderstanding')}
                            </span>
                        </div>

                        <div className="relative flex items-end gap-2 bg-[#f8fafc] border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#004D40] focus-within:border-[#004D40] transition-all shadow-inner">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('placeholder')}
                                className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[50px] py-3 px-2 text-slate-800 placeholder-slate-400 font-medium text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
                                rows={1}
                                style={{ height: 'auto', minHeight: '50px' }}
                            />
                            <button
                                onClick={toggleRecording}
                                className={`mb-1 p-3 rounded-lg transition-all shadow-md flex items-center justify-center border ${isRecording
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-400'
                                    : 'bg-white text-slate-500 hover:text-[#004D40] hover:bg-slate-100 border-slate-200'
                                    }`}
                                title="Voice recording"
                            >
                                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`mb-1 p-3 ${COLORS.accent} ${COLORS.accentHover} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md`}
                            >
                                <Send className={`w-5 h-5 ${isLoading ? 'opacity-0' : ''}`} />
                                {isLoading && <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>}
                            </button>
                        </div>
                        <div className="text-center mt-3">
                            <p className="text-[10px] text-slate-400 font-serif leading-relaxed">
                                {t('footer')}
                                <br />
                                {t('footer2')}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);