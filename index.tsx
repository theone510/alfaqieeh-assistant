import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BookOpen, MessageCircle, Info, Send, Eraser, User, Bot, AlertCircle, Settings, FileText, Scroll, ArrowRight, CheckCircle2, History, Plus, Trash2, MessageSquare, Mic, StopCircle, Download, Menu, X, Globe, Copy, ThumbsUp, ThumbsDown, LogOut, Phone, Lock, Briefcase, UserPlus, LogIn } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
    getSessions as getSessionsFromDb, saveSession as saveSessionToDb, deleteSessionFromDb,
    getFeedback, saveFeedback, deleteFeedbackByFilter,
    addTokenLog,
    getCacheEntry as getCacheEntryFromDb, saveCacheEntry as saveCacheEntryToDb, updateCacheHitCount,
} from './firebaseService';

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
    * **الاختصار:** إذا كان النص المصدري طويلاً، اقتبس فقط الجزء الذي يُجيب على السؤال مباشرة. لا تنقل النص كاملاً إذا كان جزء صغير منه فقط يتعلق بالسؤال.

2.  **[وضع الفهم المستنبط - MODE_UNDERSTANDING]:**
    * **الهدف:** استنباط الحكم الشرعي من خلال الربط بين النصوص والقواعد الفقهية المتوفرة، حتى لو لم يوجد نص يطابق السؤال حرفياً.
    * **منهجية الاستنباط الموسّع:**
      - ابحث أولاً عن نص مباشر يُجيب السؤال.
      - إذا لم تجد نصاً مباشراً، ابحث عن **المواضيع ذات الصلة والقواعد الفقهية الكلية** التي تنطبق على الموضوع. مثلاً:
        * سؤال عن "الاعتداء العسكري" → ابحث في: الدفاع عن النفس، الجهاد الدفاعي، وجوب حفظ النفس، الأمر بالمعروف والنهي عن المنكر.
        * سؤال عن "التجارة الالكترونية" → ابحث في: أحكام البيع والشراء، شروط المعاملات، الربا، الغرر.
        * سؤال عن "التبرع بالأعضاء" → ابحث في: حرمة الإضرار بالنفس، وجوب حفظ النفس المحترمة، التصرف بالبدن.
      - اربط بين النصوص المتعددة لبناء إجابة شاملة.
      - وضّح كيف توصلت إلى الحكم من خلال ربط القواعد بالسؤال المطروح.
    * **القيد:** الاستنباط يجب أن يكون "استنباطاً أميناً" مبنياً على قواعد السيد السيستاني الفقهية وليس رأياً شخصياً.
    * **مهم جداً:** لا تلجأ إلى "عدم وجود مورد" إلا إذا كان السؤال خارج نطاق الفقه تماماً أو لا توجد أي نصوص ذات صلة حتى بشكل غير مباشر.

---

### ثانياً: مصفوفة القيود والمحظورات (Constraint Matrix)
* **MUST (يجب):**
    1. **استخلاص "الحكم المختصر" ووضعه في بداية الإجابة.** يجب أن يكون حكماً فقهياً دقيقاً ومحدداً مثل: (يجوز، لا يجوز، حرام، واجب، احتياط وجوبي، احتياط استحبابي، مكروه، مستحب، يصح، لا يصح).
    2. الاقتصار على المصادر المعتمدة: (منهاج الصالحين، المسائل المنتخبة، الفتاوى الميسرة، الاستفتاءات الملحقة، الموقع الرسمي للمكتب).
    3. التمييز بين (الفتوى) و(الاحتياط الوجوبي) و(الاحتياط الاستحبابي) كما وردت في النص.
    4. استخدام لغة عربية فصحى تخصصية (لغة الفقهاء).
    5. **النقل الحرفي للمرجع:** ذكر الكتاب، المجلد (إن وجد)، القسم، ورقم المسألة تماماً كما هي موجودة في النص المصدري المرفق لك.
    6. **في وضع الفهم:** عند عدم وجود نص مباشر، يجب البحث في القواعد الفقهية الكلية والمواضيع المرتبطة لبناء إجابة مستنبطة.
    7. **الالتزام التام بالقيود الزمنية والشروط:** إذا كان الحكم المذكور مقيداً بوقت (مثلاً: "من طلوع الفجر")، فيجب الحكم بـ"لا يصح" أو "لا يجزئ" إذا وقع العمل قبل وقته المحدد (مثلاً: قبل أذان الفجر) ما لم يوجد نص صريح يستثني ذلك. لا تتساهل أبداً في المواقيت والشروط.

* **MUST NOT (يُمنع منعاً باتاً):**
    1. استخدام أي قاعدة فقهية من خارج مدرسة السيد السيستاني (مثل القياس أو الاستحسان أو آراء مراجع آخرين).
    2. **اختلاق أرقام المسائل أو الفتاوى:** يُمنع منعاً باتاً من تأليف أو استنتاج أي رقم مسألة. إذا لم يكن رقم المسألة أو الفتوى موجوداً صراحة وبشكل مباشر في النص المرفق، فلا تذكره أبداً، واكتفِ بذكر اسم المصدر. لا تقم بالاستعانة بذاكرتك السابقة.
    3. **الإجابة على أي سؤال سياسي** (مثل: الانتخابات، الأحزاب، الحكومات، الحروب بين الدول، العلاقات الدولية، الاعتداءات العسكرية) حتى لو كان له بُعد فقهي غير مباشر.
    3. **الإجابة على أي سؤال رياضي** (مثل: كرة القدم، المباريات، الرياضة، اللياقة البدنية).
    4. **الإجابة على أي سؤال اقتصادي بحت** (مثل: أسعار العملات، البورصة، الاستثمار، التضخم) ما لم يكن السؤال فقهياً مباشراً عن حكم شرعي محدد (مثل: هل يجوز التعامل بالربا؟).
    5. الإجابة على الأسئلة الترفيهية، التقنية، العلمية، الطبية البحتة، أو أي موضوع لا علاقة مباشرة له بالفقه.
    6. تقديم نصيحة شخصية أو "وعظ" خارج إطار الحكم الشرعي.
    7. **التسرع في قول "لا يوجد مورد"** في وضع الفهم — يجب استنفاد كل محاولات الربط بالمواضيع ذات الصلة الفقهية أولاً. إذا تضمن السؤال عدة مفاصل فقهية (مثل: وضوء، غسل، وقت)، اربط بين أحكامها المستقلة للخروج بحكم شامل للسؤال، ولا تعتذر لمجرد عدم وجود فتوى تجمعها كلها في نص واحد.
    8. **الإجابة على أسئلة غير فقهية مباشرة** بمحاولة إيجاد ربط فقهي غير موجود — يجب أن يكون السؤال فقهياً بطبيعته.

---

### ثالثاً: خوارزمية المعالجة الداخلية (Reasoning Chain)
1. **الخطوة 1 (تصنيف القصد — فلتر مرن للمواضيع الفقهية):**
   - هل السؤال **فقهي** (سواء كان مباشراً ومحدداً أو عاماً وشاملاً)؟ (نعم: استمر | لا: اعتذر بصرامة).
   - **اقبل الأسئلة الفقهية العامة** (مثل: "ما حكم الصلاة"، "ما حكم ضرب الزوجة") وابحث في القواعد الكلية في وضع الفهم لتأسيس إجابة منهجية.
   - **ارفض فوراً** إذا كان السؤال: سياسي، رياضي، اقتصادي بحت، ترفيهي، تقني، طبي، علمي، أو أي موضوع غير فقهي.
   - **أمثلة على أسئلة مرفوضة:** "لو اعتدت دولة علينا"، "ما رأيك في الانتخابات"، "حكم مشاهدة كرة القدم"، "هل الاستثمار في البورصة حلال".
   - **أمثلة على أسئلة مقبولة:** "ما حكم الصلاة"، "ما حكم الشك في الصلاة"، "هل يجوز أكل لحم الأرنب"، "ما حكم ضرب الزوجة"، "ما حكم الربا في المعاملات البنكية".
2. **الخطوة 2 (تحديد الوضع):** هل اختار المستخدم (الوضع الأول) أم (الوضع الثاني)؟
3. **الخطوة 3 (الاسترجاع الموسّع):**
   - **المستوى الأول:** ابحث عن نصوص تُطابق السؤال مباشرة في النصوص المزودة.
   - **المستوى الثاني (للوضع الثاني فقط):** إذا لم تجد تطابقاً مباشراً، ابحث عن القواعد الفقهية الكلية والمواضيع ذات الصلة في النصوص المزودة (مثل: قواعد الضرر، حفظ النفس، الدفاع، المعاملات، العبادات المشابهة).
   - **المستوى الثالث (للوضع الثاني فقط):** استخدم فهمك للمنظومة الفقهية للسيد السيستاني لتطبيق القواعد الكلية الموجودة في النصوص المزودة على الحالة المسؤول عنها.
4. **الخطوة 4 (التكييف الفقهي):** استخلاص الحكم المختصر (النتيجة النهائية للحكم). في الوضع الثاني، وضّح سلسلة الاستدلال.
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
> [أدرج فقط الجزء من النص الذي يُجيب على السؤال مباشرة — لا تنقل النص كاملاً إذا كان طويلاً. اقتبس الفقرة أو الجملة ذات الصلة فقط بدقة 100%]
>
> 📚 **المصدر:**
> [انسخ (التوثيق الكامل) المرفق في أسماء المصادر المزودة لك بدقة، وإذا لم يتوفر انسخ الكتاب والرقم]
>
> **والله هو العالم بحقائق الأمور.**

#### الحالة (ب): الوضع الثاني (فهم مستند إلى النصوص)
> بناءً على ما ورد في المصادر التابعة لسماحة السيد السيستاني دام ظلّه:
>
> ⚖️ **الحكم المختصر:**
> [اكتب الحكم الفقهي الدقيق هنا: يجوز / لا يجوز / واجب / حرام / احتياط وجوبي / احتياط استحبابي... إلخ]
>
> 💡 **التفصيل (فهم مستند إلى النصوص):**
> [شرح مستمد من القواعد الفقهية للسيد السيستاني مع بيان سلسلة الاستنباط: كيف ربطت بين القواعد الكلية والسؤال المطروح]
>
> 📚 **النصوص الداعمة:**
> [اقتبس فقط الأجزاء ذات الصلة من النصوص — لا تنقل نصوصاً طويلة كاملة. اقتبس الجملة أو الفقرة التي تدعم الحكم مباشرة مع (التوثيق الكامل)]
>
> 🔗 **سلسلة الاستدلال:**
> [وضّح كيف ربطت بين النصوص المتوفرة والسؤال المطروح، مثلاً: "السؤال يندرج تحت باب X، والقاعدة الفقهية Y تنص على..."]
>
> **تنبيه:** هذا الجواب يمثل فهماً مستنداً إلى النصوص والقواعد الفقهية، وليس نقلاً حرفياً أو فتوى مباشرة.
> **والله هو العالم بحقائق الأمور.**

#### الحالة (ج): عدم وجود مورد (تُستخدم فقط بعد استنفاد جميع محاولات الربط)
> **لم أجد في المصادر التابعة لسماحة السيد السيستاني دام ظلّه ما يمكن الاعتماد عليه للإجابة على هذا السؤال، حتى بشكل غير مباشر.**
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
    userId?: string;
};

type UserProfile = {
    id: string;
    phone: string;
    password: string;
    name: string;
    job: string;
    createdAt: number;
};

type FeedbackEntry = {
    id: string;
    userId: string;
    userName: string;
    sessionId: string;
    question: string;
    answer: string;
    mode: string;
    feedback: 'like' | 'dislike';
    timestamp: number;
};

// --- RAG System Types ---
interface FatwaEntry {
    content: string;
    metadata: {
        title?: string;
        source?: string;
        section?: string;
        questionNumber?: string;
        sourceUrl?: string;
        book?: string;
        hierarchy?: string;
        full_citation?: string;
        masalah_number?: string;
        url?: string;
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
            if (meta.full_citation) {
                context += `التوثيق الكامل: ${meta.full_citation}\n`;
            } else {
                context += `الكتاب: ${meta.book || meta.source || 'غير معروف'}\n`;
                if (meta.hierarchy || meta.section) context += `القسم: ${meta.hierarchy || meta.section}\n`;
                if (meta.title) context += `العنوان: ${meta.title}\n`;
                if (meta.masalah_number || meta.questionNumber) context += `الرقم: ${meta.masalah_number || meta.questionNumber}\n`;
            }
            context += `الرابط: ${meta.url || meta.sourceUrl || 'غير متوفر'}\n`;
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

const logTokenUsage = (response: any, sessionId: string, type: string, modelName: string) => {
    try {
        const usage = response?.response?.usageMetadata;
        if (!usage) return;

        const entry = {
            id: crypto.randomUUID(),
            sessionId,
            model: modelName,
            inputTokens: usage.promptTokenCount || 0,
            outputTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
            type,
            timestamp: Date.now(),
        };

        addTokenLog(entry);
    } catch (e) {
        console.error('Token logging error:', e);
    }
};

// --- Answer Cache System ---
const CACHE_KEY = 'fiqh_answer_cache';
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const normalizeQuestion = (text: string): string => {
    return text
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics (tashkeel)
        .replace(/[؟?!.,،؛:]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .toLowerCase();
};

const getCacheKey = (question: string, mode: string): string => {
    return `${mode}::${normalizeQuestion(question)}`;
};

const checkCacheAsync = async (question: string, mode: string): Promise<{ answer: string; cachedAt: number; inputTokens?: number; outputTokens?: number; hitCount?: number } | null> => {
    try {
        const key = getCacheKey(question, mode);
        const entry = await getCacheEntryFromDb(key);
        if (entry && (Date.now() - entry.cachedAt) < CACHE_MAX_AGE) {
            return entry;
        }
        return null;
    } catch {
        return null;
    }
};

const saveToCacheAsync = async (question: string, mode: string, answer: string, inputTokens: number, outputTokens: number) => {
    try {
        const key = getCacheKey(question, mode);
        await saveCacheEntryToDb(key, {
            answer,
            question: question.substring(0, 100),
            mode,
            cachedAt: Date.now(),
            inputTokens,
            outputTokens,
            hitCount: 0,
        });
    } catch (e) {
        console.error('Cache save error:', e);
    }
};

const logCacheHit = (sessionId: string, inputTokensSaved: number, outputTokensSaved: number, modelName: string) => {
    try {
        addTokenLog({
            id: crypto.randomUUID(),
            sessionId,
            model: modelName,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            type: 'cache_hit',
            inputTokensSaved: inputTokensSaved,
            outputTokensSaved: outputTokensSaved,
            timestamp: Date.now(),
        });
    } catch (e) {
        console.error('Cache hit log error:', e);
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
        quickPrompt1: 'ما هي مبطلات الصلاة؟',
        quickPrompt2: 'ما حكم بيع الذهب بالتقسيط؟',
        quickPrompt3: 'ما هي شروط الخمس؟',
        loadingStep0: 'جاري البحث في المصادر الفقهية...',
        loadingStep1: 'يتم استخراج النصوص ذات الصلة...',
        loadingStep2: 'جاري تحليل ومطابقة الفتاوى...',
        loadingStep3: 'يتم صياغة الحكم الشرعي الدقيق...',
        loadingStep4: 'تتم المراجعة النهائية للإجابة...',
        copy: 'نسخ',
        copied: 'تم النسخ',
        like: 'أعجبني',
        dislike: 'لم يعجبني',
        voiceRecording: 'تسجيل صوتي',
        today: 'اليوم',
        yesterday: 'أمس',
        last7Days: 'آخر 7 أيام',
        older: 'أقدم',
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
        quickPrompt1: 'What invalidates prayer?',
        quickPrompt2: 'What is the ruling on selling gold in installments?',
        quickPrompt3: 'What are the conditions for Khums?',
        loadingStep0: 'Searching religious sources...',
        loadingStep1: 'Extracting relevant texts...',
        loadingStep2: 'Analyzing and matching fatwas...',
        loadingStep3: 'Formulating the precise ruling...',
        loadingStep4: 'Final review of the answer...',
        copy: 'Copy',
        copied: 'Copied',
        like: 'Like',
        dislike: 'Dislike',
        voiceRecording: 'Voice recording',
        today: 'Today',
        yesterday: 'Yesterday',
        last7Days: 'Last 7 Days',
        older: 'Older',
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
        understandingModeTag: 'تحليل و توضیح',
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
        modeUnderstanding: 'حالت: فهم و استنباط (توضيحي)',
        welcomeMessage: 'السلام عليكم و رحمة الله و بركاته',
        welcomeIntro: 'من "دستیار فقیه" هستم، متخصص در فتاوای حضرت آیت‌الله سیستانی (دام ظله).',
        welcomeMode: 'شما انتخاب کرده‌اید',
        welcomeChangeMode: 'می‌توانید حالت را در هر زمان از نوار کناری تغییر دهید.',
        welcomeAsk: 'لطفاً سوال فقهی خود را با دقت بنویسید.',
        errorMessage: 'خطای فنی: مشکلی در اتصال به سرور رخ داد. لطفاً دوباره تلاش کنید.',
        noSpeechSupport: 'متأسفانه مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.',
        noAnswer: 'متأسفانه نتوانستم پاسخی استخراج کنم.',
        language: 'زبان نمايش',
        delete: 'حذف',
        quickPrompt1: 'مبطلات نماز چیست؟',
        quickPrompt2: 'حکم فروش طلا به صورت اقساطی چیست؟',
        quickPrompt3: 'شرایط خمس چیست؟',
        loadingStep0: 'در حال جستجو در منابع فقهی...',
        loadingStep1: 'استخراج متون مرتبط...',
        loadingStep2: 'تجزیه و تحلیل و مطابقت فتاوا...',
        loadingStep3: 'تنظیم حکم شرعی دقیق...',
        loadingStep4: 'بررسی نهایی پاسخ...',
        copy: 'کپی',
        copied: 'کپی شد',
        like: 'پسندیدم',
        dislike: 'نپسندیدم',
        voiceRecording: 'ضبط صدا',
        today: 'امروز',
        yesterday: 'دیروز',
        last7Days: '۷ روز گذشته',
        older: 'قدیمی‌تر',
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
        quickPrompt1: 'نماز کو کیا چیز باطل کرتی ہے؟',
        quickPrompt2: 'قسطوں پر سونا بیچنے کا کیا حکم ہے؟',
        quickPrompt3: 'خمس کی کیا شرائط ہیں؟',
        loadingStep0: 'فقہی ذرائع میں تلاش جاری ہے...',
        loadingStep1: 'متعلقہ تحریریں نکالی جا رہی ہیں...',
        loadingStep2: 'فتاویٰ کا تجزیہ اور مطابقت جاری ہے...',
        loadingStep3: 'درست شرعی حکم کی تشکیل کی جا رہی ہے...',
        loadingStep4: 'جواب کا آخری جائزہ لیا جا رہا ہے...',
        copy: 'کاپی',
        copied: 'کاپی ہو گیا',
        like: 'پسند ہے',
        dislike: 'ناپسند ہے',
        voiceRecording: 'آواز کی ریکارڈنگ',
        today: 'آج',
        yesterday: 'کل',
        last7Days: 'پچھلے 7 دن',
        older: 'پرانے',
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
        quickPrompt1: 'Namazı bozan şeyler nelerdir?',
        quickPrompt2: 'Taksitle altın satmanın hükmü nedir?',
        quickPrompt3: 'Humusun şartları nelerdir?',
        loadingStep0: 'Fıkhi kaynaklarda aranıyor...',
        loadingStep1: 'İlgili metinler çıkarılıyor...',
        loadingStep2: 'Fetvalar analiz ediliyor ve eşleştiriliyor...',
        loadingStep3: 'Kesin fıkhi hüküm formüle ediliyor...',
        loadingStep4: 'Cevabın son incelemesi yapılıyor...',
        copy: 'Kopyala',
        copied: 'Kopyalandı',
        like: 'Beğen',
        dislike: 'Beğenme',
        voiceRecording: 'Ses kaydı',
        today: 'Bugün',
        yesterday: 'Dün',
        last7Days: 'Son 7 Gün',
        older: 'Daha Eski',
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
        quickPrompt1: 'Qu\'est-ce qui invalide la prière ?',
        quickPrompt2: 'Quelle est la règle concernant la vente d\'or à tempérament ?',
        quickPrompt3: 'Quelles sont les conditions du Khums ?',
        loadingStep0: 'Recherche dans les sources religieuses...',
        loadingStep1: 'Extraction des textes pertinents...',
        loadingStep2: 'Analyse et comparaison des fatwas...',
        loadingStep3: 'Formulation de la règle précise...',
        loadingStep4: 'Examen final de la réponse...',
        copy: 'Copier',
        copied: 'Copié',
        like: 'J\'aime',
        dislike: 'Je n\'aime pas',
        voiceRecording: 'Enregistrement vocal',
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        last7Days: '7 Derniers Jours',
        older: 'Plus Ancien',
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
        quickPrompt1: 'प्रार्थना (नमाज़) को क्या अमान्य करता है?',
        quickPrompt2: 'किश्तों पर सोना बेचने का क्या हुक्म है?',
        quickPrompt3: 'खुम्स की शर्तें क्या हैं?',
        loadingStep0: 'धार्मिक स्रोतों में खोज की जा रही है...',
        loadingStep1: 'प्रासंगिक पाठ निकाला जा रहा है...',
        loadingStep2: 'फतवों का विश्लेषण और मिलान किया जा रहा है...',
        loadingStep3: 'सटीक नियम तैयार किया जा रहा है...',
        loadingStep4: 'उत्तर की अंतिम समीक्षा की जा रही है...',
        copy: 'कॉपी',
        copied: 'कॉपी किया गया',
        like: 'पसंद करें',
        dislike: 'नापसंद करें',
        voiceRecording: 'आवाज रिकॉर्डिंग',
        today: 'आज',
        yesterday: 'कल',
        last7Days: 'पिछले 7 दिन',
        older: 'पुराने',
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
    primary: 'bg-gradient-to-br from-[#004D40] to-[#00695C]', // Deep Shrine Teal Gradient
    primaryHover: 'hover:from-[#00695C] hover:to-[#00796B]',
    primaryLight: 'bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]',
    accent: 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37]', // Shrine Gold Gradient
    accentText: 'text-[#C5A059]',
    accentBorder: 'border-[#C5A059]',
    accentHover: 'hover:from-[#B08D55] hover:to-[#C5A059]',
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
    const [loadingStep, setLoadingStep] = useState(0);
    const [mode, setMode] = useState<Mode>('MODE_LITERAL');
    const [hasStarted, setHasStarted] = useState(false);
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [language, setLanguage] = useState<Language>('ar');

    // Get translation helper
    const t = (key: string) => translations[language][key] || key;
    const isRTL = rtlLanguages.includes(language);


    const [feedbackMap, setFeedbackMap] = useState<Record<string, 'like' | 'dislike'>>({});
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    // Track active session IDs in localStorage so users can resume their own sessions on this device
    const [localSessionIds, setLocalSessionIds] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('faqih_local_sessions');
        if (stored) {
            try { setLocalSessionIds(JSON.parse(stored)); } catch { }
        }
    }, []);

    // Load feedback map for current session from Firebase
    useEffect(() => {
        if (currentSessionId) {
            getFeedback(currentSessionId).then(allFeedback => {
                const sessionFeedback: Record<string, 'like' | 'dislike'> = {};
                allFeedback.forEach(f => {
                    sessionFeedback[`${f.question}::${f.answer.substring(0, 50)}`] = f.feedback;
                });
                setFeedbackMap(sessionFeedback);
            }).catch(() => setFeedbackMap({}));
        }
    }, [currentSessionId]);

    const handleFeedback = async (msgIdx: number, type: 'like' | 'dislike') => {
        if (!currentSessionId) return;
        // Find the question (previous user message)
        let question = '';
        for (let i = msgIdx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') { question = messages[i].text; break; }
        }
        const answer = messages[msgIdx].text;
        const key = `${question}::${answer.substring(0, 50)}`;

        // Toggle: if same feedback, remove it
        const currentFeedbackVal = feedbackMap[key];

        if (currentFeedbackVal === type) {
            // Remove feedback from Firebase
            await deleteFeedbackByFilter(currentSessionId, question, answer.substring(0, 50));
            setFeedbackMap(prev => { const n = { ...prev }; delete n[key]; return n; });
        } else {
            // Remove old feedback for same Q&A if exists, then add new
            await deleteFeedbackByFilter(currentSessionId, question, answer.substring(0, 50));
            const entry: FeedbackEntry = {
                id: crypto.randomUUID(),
                sessionId: currentSessionId,
                question,
                answer,
                mode,
                feedback: type,
                timestamp: Date.now(), // Use current timestamp
            };
            await saveFeedback(entry);
            setFeedbackMap(prev => ({ ...prev, [key]: type }));
        }
    };

    const handleCopy = async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        } catch { }
    };

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

    // Load sessions from Firebase on mount based on local storage tracking
    useEffect(() => {
        if (localSessionIds.length === 0) return;

        // We fetch all sessions, then filter to the ones this device created
        getSessionsFromDb().then(loadedSessions => {
            const deviceSessions = loadedSessions.filter(s => localSessionIds.includes(s.id));
            if (deviceSessions.length > 0) {
                setSessions(deviceSessions);
            }
        }).catch(e => console.error('Failed to load sessions from Firebase', e));
    }, [localSessionIds]);

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

    // Start a new chat flow from a Quick Prompt
    const handleQuickPrompt = (promptText: string, selectedMode: Mode) => {
        setMode(selectedMode);
        setHasStarted(true);
        startNewSession(selectedMode);

        // Pass the prompt text and mode directly to handleSend
        setTimeout(() => {
            handleSend(promptText, selectedMode);
        }, 100);
    };

    const startNewSession = (selectedMode: Mode = mode) => {
        setMessages([]);
        setMode(selectedMode);
        setCurrentSessionId(null);
        setHasStarted(true);
        setIsSidebarOpen(false); // Close sidebar on mobile
    };

    const deleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteSessionFromDb(id);
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

    const handleSend = async (overrideInput?: string, overrideMode?: Mode) => {
        const textToProcess = overrideInput || input;
        const activeMode = overrideMode || mode;

        console.log("handleSend called", { input: textToProcess.trim(), isLoading });
        if (!textToProcess.trim() || isLoading) {
            console.log("handleSend returning early", { input: textToProcess.trim(), isLoading });
            return;
        }

        const userMessageText = textToProcess.trim();
        const newMessage: Message = { role: 'user', text: userMessageText };

        if (!overrideInput) {
            setInput('');
        }
        setIsLoading(true);
        setLoadingStep(0);
        console.log("handleSend proceeding", { userMessageText });

        // Update Messages State
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);

        // Dynamic Loading Steps
        const loadingInterval = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % 5);
        }, 2000);

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
                mode: activeMode,
                date: Date.now(),
            };
            newSessionsList = [newSession, ...newSessionsList];
            saveSessionToDb(newSession);

            // Save to local device tracking
            const newLocalIds = [...localSessionIds, sessionId];
            setLocalSessionIds(newLocalIds);
            localStorage.setItem('faqih_local_sessions', JSON.stringify(newLocalIds));
        } else {
            // Update existing session
            newSessionsList = newSessionsList.map(s =>
                s.id === sessionId
                    ? { ...s, messages: updatedMessages, date: Date.now() }
                    : s
            );
            // Optional: Move active session to top
            const activeSession = newSessionsList.find(s => s.id === sessionId);
            if (activeSession) {
                newSessionsList = [activeSession, ...newSessionsList.filter(s => s.id !== sessionId)];
                saveSessionToDb(activeSession);
            }
        }
        setSessions(newSessionsList);

        const activeModelName = 'gemini-3.1-flash-lite-preview';

        try {
            // Step 1: Detect if the language is Arabic using Regex OR if the UI language is already Arabic
            const isTextArabic = /[\u0600-\u06FF]/.test(userMessageText);
            const isUiArabic = language === 'ar';
            // We consider the input "Arabic" if either the text is Arabic or the user chose Arabic UI
            const isArabic = isTextArabic || isUiArabic;
            const detectedLang = isArabic ? 'ar' : language; // Default to UI language if not Arabic

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: activeModelName, systemInstruction: SYSTEM_INSTRUCTION });

            let questionInArabic = userMessageText;

            // Step 2: If not Arabic, translate the question to Arabic
            if (!isArabic) {
                const translateToArabicResponse = await model.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Translate the following text to Arabic. Provide ONLY the translation, nothing else:\n\n"${userMessageText}"` }]
                    }]
                });
                questionInArabic = translateToArabicResponse.response.text() || userMessageText;
                logTokenUsage(translateToArabicResponse, sessionId!, 'translation_to_ar', activeModelName);
            }


            // --- CACHE CHECK ---
            const cachedAnswer = await checkCacheAsync(questionInArabic, activeMode);
            let text: string;
            let wasFromCache = false;

            if (cachedAnswer) {
                // Cache HIT — skip RAG + Gemini API call entirely
                console.log('✅ Cache HIT for:', questionInArabic.substring(0, 50));
                text = cachedAnswer.answer;
                wasFromCache = true;
                // Log the tokens saved
                const cKey = getCacheKey(questionInArabic, activeMode);
                const newHitCount = (cachedAnswer.hitCount || 0) + 1;
                updateCacheHitCount(cKey, newHitCount);
                logCacheHit(sessionId!, cachedAnswer.inputTokens || 0, cachedAnswer.outputTokens || 0, activeModelName);
            } else {
                // Cache MISS — proceed with normal flow
                console.log('❌ Cache MISS for:', questionInArabic.substring(0, 50));

                // Step 3: Normalize the question to formal fiqh terminology for better RAG search
                // This step converts colloquial/dialect Arabic to formal fiqh terms and extracts MULTIPLE concepts if present.
                let searchQuery = questionInArabic;
                try {
                    const normalizeResponse = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [{
                                text: `أنت مساعد فقهي متخصص. استخرج كل الكلمات المفتاحية الفقهية من السؤال التالي لغرض البحث في فتاوى السيد السيستاني.

السؤال: "${questionInArabic}"

أعد النتيجة بصيغة JSON فقط، تحتوي على مفتاح "keywords" وبداخله سلسلة نصية للكلمات المفتاحية مفصولة بمسافة.
مثال: {"keywords": "حكم غسل الجمعة قبل الفجر إجزاء الغسل عن الوضوء حدث أصغر"}
لا تضف أي نص آخر غير كائن الـ JSON.` }]
                        }],
                        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                    });

                    try {
                        const jsonResponse = JSON.parse(normalizeResponse.response.text());
                        const normalizedQuery = jsonResponse.keywords?.trim();
                        if (normalizedQuery && normalizedQuery.length > 5) {
                            searchQuery = normalizedQuery;
                            console.log('🔍 Normalized search query:', searchQuery);
                        }
                    } catch (parseErr) {
                        console.warn('⚠️ JSON Parse failed for normalization:', normalizeResponse.response.text());
                    }
                } catch (e) {
                    console.warn('⚠️ Fiqh normalization failed, using original question:', e);
                }

                // Step 4: Search local fatwas data (RAG)
                const ragContext = await searchFatwas(searchQuery);

                // Step 5: Get the fiqh answer in Arabic with RAG context
                let promptWithContext = '';
                if (activeMode === 'MODE_LITERAL') {
                    promptWithContext = `[هام جداً: أنت في "الوضع الحرفي". يُمنع التلخيص أو الاستنتاج الذاتي. اعتمد حصراً على النص أدناه. انسخ النص حرفياً وانسخ التوثيق الكامل للمصدر المرفق في السياق بدقة متناهية دون اختلاق أرقام مسألة أو دمج مصادر].\n\nالسؤال: ${questionInArabic}\n\nالسياق:\n${ragContext}`;
                } else {
                    promptWithContext = `[هام: أنت في "وضع الفهم". قدم حكماً مختصراً ثم شرحاً مستنداً للنصوص المرفقة أدناه، واقتبس التوثيق الكامل للمصدر المرفق في السياق دون اختلاق أرقام أو التفاف].\n\nالسؤال: ${questionInArabic}\n\nالسياق:\n${ragContext}`;
                }

                const response = await model.generateContent({
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
                    generationConfig: {
                        temperature: 0.3,
                    }
                });

                text = response.response.text() || "عذراً، لم أتمكن من استخراج إجابة.";
                logTokenUsage(response, sessionId!, 'fiqh_search', activeModelName);

                // Save to cache for future use
                const usage = response?.response?.usageMetadata;
                saveToCacheAsync(questionInArabic, activeMode, text, usage?.promptTokenCount || 0, usage?.candidatesTokenCount || 0);
            }

            // Step 5: If the original question was not in Arabic, translate the answer back to the user's language
            if (!isArabic && !wasFromCache) {
                const langNames: { [key: string]: string } = {
                    'en': 'English', 'fa': 'Persian/Farsi', 'ur': 'Urdu', 'fr': 'French',
                    'es': 'Spanish', 'de': 'German', 'tr': 'Turkish', 'id': 'Indonesian',
                    'ms': 'Malay', 'bn': 'Bengali', 'hi': 'Hindi', 'ru': 'Russian',
                    'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'pt': 'Portuguese',
                    'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish'
                };
                const targetLangName = langNames[detectedLang] || detectedLang;
                const translateBackResponse = await model.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Translate the following Islamic jurisprudence (fiqh) answer from Arabic to ${targetLangName}. Maintain the formal scholarly tone and preserve any Arabic religious terms with their transliteration where appropriate. Provide ONLY the translation:\n\n${text}` }]
                    }],
                    generationConfig: { temperature: 0.2 }
                });
                text = translateBackResponse.response.text() || text;
                logTokenUsage(translateBackResponse, sessionId!, 'translation_back', activeModelName);
            }

            const modelMessage: Message = { role: 'model', text };

            // Update messages with AI response
            const finalMessages = [...updatedMessages, modelMessage];
            setMessages(finalMessages);

            // Update session in state and Firebase
            setSessions(prev => {
                const updated = prev.map(s =>
                    s.id === sessionId
                        ? { ...s, messages: finalMessages }
                        : s
                );
                const updatedSession = updated.find(s => s.id === sessionId);
                if (updatedSession) saveSessionToDb(updatedSession);
                return updated;
            });

        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                role: 'model',
                text: `**${t('errorMessage')}**`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            clearInterval(loadingInterval);
            setIsLoading(false);
            setLoadingStep(0);
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
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-xl border border-teal-100 shadow-sm">
                    <span className="text-sm font-semibold text-teal-800 px-2 hidden md:block">{t('language')}:</span>
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className={`appearance-none bg-white text-teal-800 px-4 py-2 pr-10 rounded-lg cursor-pointer text-sm font-medium shadow-sm border border-teal-200 focus:outline-none focus:ring-2 focus:ring-[#C5A059]`}
                        >
                            {(Object.keys(languageNames) as Language[]).map(lang => (
                                <option key={lang} value={lang}>{languageNames[lang]}</option>
                            ))}
                        </select>
                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 pointer-events-none" />
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

                    {/* Quick Prompts Suggestions */}
                    <div className="max-w-3xl mx-auto mb-10 w-full animate-fade-in-up delay-100">
                        <div className="flex flex-wrap justify-center gap-2">
                            <button onClick={() => handleQuickPrompt(t('quickPrompt1'), 'MODE_UNDERSTANDING')} className="bg-white/80 backdrop-blur border border-teal-100/50 hover:border-[#C5A059] text-teal-800 px-4 py-2 rounded-full text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
                                {t('quickPrompt1')}
                            </button>
                            <button onClick={() => handleQuickPrompt(t('quickPrompt2'), 'MODE_LITERAL')} className="bg-white/80 backdrop-blur border border-teal-100/50 hover:border-[#C5A059] text-teal-800 px-4 py-2 rounded-full text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
                                {t('quickPrompt2')}
                            </button>
                            <button onClick={() => handleQuickPrompt(t('quickPrompt3'), 'MODE_UNDERSTANDING')} className="bg-white/80 backdrop-blur border border-teal-100/50 hover:border-[#C5A059] text-teal-800 px-4 py-2 rounded-full text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
                                {t('quickPrompt3')}
                            </button>
                        </div>
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

                    {/* Chat History Section - Grouped by Time */}
                    {sessions.length > 0 && (() => {
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                        const yesterdayStart = todayStart - 86400000;
                        const last7Start = todayStart - 7 * 86400000;

                        const groups: { label: string; items: typeof sessions }[] = [
                            { label: t('today'), items: sessions.filter(s => s.date >= todayStart) },
                            { label: t('yesterday'), items: sessions.filter(s => s.date >= yesterdayStart && s.date < todayStart) },
                            { label: t('last7Days'), items: sessions.filter(s => s.date >= last7Start && s.date < yesterdayStart) },
                            { label: t('older'), items: sessions.filter(s => s.date < last7Start) },
                        ].filter(g => g.items.length > 0);

                        return groups.map(group => (
                            <div key={group.label} className="mb-4">
                                <h3 className={`text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-2 px-2`}>
                                    <History className="w-3 h-3" />
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map(session => (
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
                        ));
                    })()}

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
                                {/* Feedback Buttons for AI messages */}
                                {msg.role === 'model' && idx > 0 && (
                                    <div className={`flex items-center gap-1 mt-3 pt-2 border-t border-slate-100 ${isRTL ? 'justify-start' : 'justify-start'}`}>
                                        <button onClick={() => handleCopy(msg.text, idx)} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${copiedIdx === idx ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-[#004D40] hover:bg-slate-100'}`} title={t('copy')}>
                                            {copiedIdx === idx ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t('copied')}</> : <><Copy className="w-3.5 h-3.5" /> {t('copy')}</>}
                                        </button>
                                        {(() => {
                                            let q = '';
                                            for (let i = idx - 1; i >= 0; i--) { if (messages[i].role === 'user') { q = messages[i].text; break; } }
                                            const fbKey = `${q}::${msg.text.substring(0, 50)}`;
                                            return (
                                                <>
                                                    <button onClick={() => handleFeedback(idx, 'like')} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${feedbackMap[fbKey] === 'like' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title={t('like')}>
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleFeedback(idx, 'dislike')} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${feedbackMap[fbKey] === 'dislike' ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} title={t('dislike')}>
                                                        <ThumbsDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#C5A059] text-[#004D40] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(197,160,89,0.3)]">
                                <Scroll className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className={`bg-gray-50/80 backdrop-blur-sm border ${isRTL ? 'border-r-4' : 'border-l-4'} border-[#C5A059] border-y-slate-200 border-x-slate-200 rounded-2xl ${isRTL ? 'rounded-tl-none' : 'rounded-tr-none'} px-6 py-4 shadow-sm`}>
                                <div className="flex items-center gap-3 text-teal-700 text-sm font-semibold">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce delay-150"></span>
                                    </div>
                                    <span className="animate-pulse text-teal-800">
                                        {t(`loadingStep${loadingStep}`)}
                                    </span>
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

                        <div className="relative flex items-end gap-2 bg-[#f8fafc]/80 backdrop-blur-md border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#004D40] focus-within:border-[#004D40] transition-all shadow-inner">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('placeholder')}
                                className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[50px] py-3 px-2 text-slate-800 placeholder-slate-400 font-medium text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'} scrollbar-hide`}
                                rows={1}
                                style={{ height: 'auto', minHeight: '50px' }}
                            />
                            <button
                                onClick={toggleRecording}
                                className={`mb-1 p-3 rounded-lg transition-all shadow-md flex items-center justify-center border ${isRecording
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-400 glow-red'
                                    : 'bg-white text-slate-500 hover:text-[#004D40] hover:bg-slate-100 border-slate-200'
                                    }`}
                                title={t('voiceRecording')}
                            >
                                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`mb-1 p-3 ${COLORS.accent} ${COLORS.accentHover} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md transform hover:-translate-y-0.5`}
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