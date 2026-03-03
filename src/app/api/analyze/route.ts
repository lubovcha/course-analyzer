import { NextRequest, NextResponse } from 'next/server';

interface CourseData {
  courseName: string;
  basicInfo: string;
  startDate: string;
  duration: string;
  pricePerMonth: string;
  totalPrice: string;
  platform: string;
  installment: boolean;
  program: string;
  hasAI: boolean;
  teachers: string;
  strengths: string[];
  weaknesses: string[];
}

function getDefaultCourseData(url: string): CourseData {
  let hostname = 'unknown';
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {}
  
  return {
    courseName: url.split('/').filter(Boolean).pop() || 'Курс',
    basicInfo: '',
    startDate: '',
    duration: '',
    pricePerMonth: '',
    totalPrice: '',
    platform: hostname,
    installment: false,
    program: '',
    hasAI: false,
    teachers: '',
    strengths: [],
    weaknesses: []
  };
}

async function analyzeCourse(url: string): Promise<CourseData> {
  console.log('[analyzeCourse] Starting for:', url);
  
  const defaultData = getDefaultCourseData(url);
  
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    // Try page_reader first
    let pageContent = '';
    try {
      const pageResult = await zai.functions.invoke('page_reader', { url });
      if (pageResult && typeof pageResult === 'object') {
        const data = (pageResult as { data?: { html?: string } }).data;
        if (data?.html && data.html.length > 100) {
          pageContent = data.html;
          console.log('[analyzeCourse] Page reader success:', pageContent.length);
        }
      }
    } catch (e) {
      console.log('[analyzeCourse] Page reader failed:', e);
    }
    
    // Fallback to web search
    if (!pageContent || pageContent.length < 100) {
      console.log('[analyzeCourse] Trying web search...');
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        const path = url.split('/').filter(Boolean).slice(-2).join(' ');
        
        const searchResult = await zai.functions.invoke('web_search', {
          query: `${domain} ${path} курс цена стоимость длительность старт программа`,
          num: 5
        });
        
        if (searchResult && Array.isArray(searchResult)) {
          pageContent = searchResult
            .map((r: {name?: string; snippet?: string; title?: string}) => 
              `${r.name || r.title || ''}: ${r.snippet || ''}`
            ).join('\n');
          console.log('[analyzeCourse] Web search result:', pageContent.length);
        }
      } catch (e) {
        console.log('[analyzeCourse] Web search failed:', e);
      }
    }
    
    if (!pageContent || pageContent.length < 50) {
      console.log('[analyzeCourse] No content available');
      return defaultData;
    }
    
    // Quick regex extraction
    const priceMatch = pageContent.match(/(\d[\d\s]{3,})\s*(?:₽|руб)/i);
    const durationMatch = pageContent.match(/(\d{1,2})\s*(?:месяц|мес)/i);
    const startDateMatch = pageContent.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
    
    // AI analysis
    console.log('[analyzeCourse] Starting AI analysis, content length:', pageContent.length);
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты эксперт по анализу образовательных курсов. Извлеки данные из текста. Отвечай только валидным JSON.' },
        { role: 'user', content: `Проанализируй информацию о курсе и извлеки данные.

URL: ${url}

ИНФОРМАЦИЯ:
${pageContent.substring(0, 8000)}

Извлеки и верни JSON:
{
  "courseName": "полное название курса",
  "basicInfo": "краткое описание курса",
  "startDate": "дата начала (например: 15 марта)",
  "duration": "длительность (например: 4 месяца)",
  "pricePerMonth": "цена в месяц (например: 15000 ₽/мес)",
  "totalPrice": "полная цена (например: 60000 ₽)",
  "platform": "название платформы",
  "installment": true или false,
  "program": "кратко темы/модули курса",
  "hasAI": true или false,
  "teachers": "имена преподавателей если есть",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1"]
}

Если информация не найдена — оставь поле пустым. Важно: верни ТОЛЬКО JSON без markdown.` }
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('[analyzeCourse] AI response:', responseText.substring(0, 200));
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : defaultData;
    
    // Override with regex if AI missed
    if (priceMatch && (!parsed.totalPrice || parsed.totalPrice === '')) {
      parsed.totalPrice = priceMatch[1].replace(/\s/g, '') + ' ₽';
    }
    if (durationMatch && (!parsed.duration || parsed.duration === '')) {
      parsed.duration = durationMatch[1] + ' месяцев';
    }
    if (startDateMatch && (!parsed.startDate || parsed.startDate === '')) {
      parsed.startDate = startDateMatch[1];
    }
    
    // Ensure platform is set
    if (!parsed.platform || parsed.platform === '') {
      parsed.platform = defaultData.platform;
    }
    
    return parsed;
    
  } catch (e) {
    console.error('[analyzeCourse] Error:', e);
    return defaultData;
  }
}

async function compareCourses(competitor: CourseData, productLab: CourseData) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты эксперт по сравнению образовательных курсов. Отвечай только валидным JSON.' },
        { role: 'user', content: `Сравни два курса и дай развёрнутый анализ.

КОНКУРЕНТ: ${competitor.courseName}
- Цена: ${competitor.totalPrice || 'не указана'}
- Длительность: ${competitor.duration || 'не указана'}
- Платформа: ${competitor.platform}
- AI: ${competitor.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${competitor.installment ? 'Да' : 'Нет'}
- Сильные стороны: ${competitor.strengths?.join(', ') || 'не указаны'}
- Слабые стороны: ${competitor.weaknesses?.join(', ') || 'не указаны'}

PRODUCTLAB (эталон): ${productLab.courseName}
- Цена: ${productLab.totalPrice || 'не указана'}
- Длительность: ${productLab.duration || 'не указана'}
- Платформа: ${productLab.platform}
- AI: ${productLab.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${productLab.installment ? 'Да' : 'Нет'}
- Сильные стороны: ${productLab.strengths?.join(', ') || 'не указаны'}

Верни JSON:
{
  "priceComparison": "сравнение цен с выводом что выгоднее",
  "durationComparison": "сравнение длительности",
  "platformComparison": "сравнение платформ и форматов обучения",
  "strengthsVsProductLab": ["преимущество 1 конкурента перед ProductLab", "преимущество 2"],
  "weaknessesVsProductLab": ["недостаток 1 конкурента перед ProductLab", "недостаток 2"],
  "overallVerdict": "общий вывод и рекомендация"
}` }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      priceComparison: '', durationComparison: '', platformComparison: '',
      strengthsVsProductLab: [], weaknessesVsProductLab: [], overallVerdict: 'Ошибка сравнения'
    };
  } catch {
    return {
      priceComparison: '', durationComparison: '', platformComparison: '',
      strengthsVsProductLab: [], weaknessesVsProductLab: [], overallVerdict: 'Ошибка сравнения'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] === New Request ===');
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const { productLabUrl, competitorUrl, step, productLabData } = body;
    console.log('[API] Request:', { step, productLabUrl, competitorUrl });

    if (step === 1 && productLabUrl) {
      const data = await analyzeCourse(productLabUrl);
      return NextResponse.json({ success: true, step: 1, productLab: data });
    }

    if (step === 2 && competitorUrl) {
      const data = await analyzeCourse(competitorUrl);
      return NextResponse.json({ success: true, step: 2, competitor: data });
    }

    if (step === 3 && productLabData && competitorUrl) {
      const competitorData = await analyzeCourse(competitorUrl);
      const comparison = await compareCourses(competitorData, productLabData);
      return NextResponse.json({ success: true, step: 3, competitor: competitorData, comparison });
    }

    if (productLabUrl && competitorUrl) {
      const [productLab, competitor] = await Promise.all([
        analyzeCourse(productLabUrl),
        analyzeCourse(competitorUrl)
      ]);
      const comparison = await compareCourses(competitor, productLab);
      return NextResponse.json({ success: true, productLab, competitor, comparison });
    }

    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 });

  } catch (error) {
    console.error('[API] Fatal error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Course Analyzer API',
    timestamp: new Date().toISOString()
  });
}
