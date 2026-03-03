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

async function fetchDirectly(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      // Remove scripts and styles
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 15000);
      return text;
    }
  } catch (e) {
    console.log('[fetchDirectly] Error:', e);
  }
  return '';
}

async function analyzeCourse(url: string): Promise<CourseData> {
  console.log('[analyzeCourse] Starting for:', url);
  
  const defaultData = getDefaultCourseData(url);
  let pageContent = '';
  
  try {
    // Try SDK page_reader first
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      
      const pageResult = await zai.functions.invoke('page_reader', { url });
      if (pageResult && typeof pageResult === 'object') {
        const data = (pageResult as { data?: { html?: string } }).data;
        if (data?.html && data.html.length > 100) {
          pageContent = data.html;
          console.log('[analyzeCourse] SDK page_reader success:', pageContent.length);
        }
      }
      
      // Try web_search if no content
      if (!pageContent) {
        const searchResult = await zai.functions.invoke('web_search', {
          query: `${defaultData.platform} курс цена стоимость длительность`,
          num: 5
        });
        
        if (searchResult && Array.isArray(searchResult)) {
          pageContent = searchResult
            .map((r: {name?: string; snippet?: string; title?: string}) => 
              `${r.name || r.title || ''}: ${r.snippet || ''}`
            ).join('\n');
          console.log('[analyzeCourse] SDK web_search success:', pageContent.length);
        }
      }
    } catch (e) {
      console.log('[analyzeCourse] SDK failed:', e);
    }
    
    // Fallback: direct fetch
    if (!pageContent || pageContent.length < 100) {
      console.log('[analyzeCourse] Trying direct fetch...');
      pageContent = await fetchDirectly(url);
      console.log('[analyzeCourse] Direct fetch result:', pageContent.length);
    }
    
    if (!pageContent || pageContent.length < 50) {
      console.log('[analyzeCourse] No content available');
      return defaultData;
    }
    
    // Quick regex extraction
    const pricePatterns = [
      /(\d[\d\s]{4,})\s*(?:₽|руб\.?|рублей)/i,
      /стоимость[:\s]*(\d[\d\s]+)/i,
      /цена[:\s]*(\d[\d\s]+)/i,
      /от\s*(\d[\d\s]{4,})/i
    ];
    
    let foundPrice = '';
    for (const pattern of pricePatterns) {
      const match = pageContent.match(pattern);
      if (match) {
        foundPrice = match[1].replace(/\s/g, '');
        if (parseInt(foundPrice) > 1000) break;
      }
    }
    
    const durationMatch = pageContent.match(/(\d{1,2})\s*(?:месяц|мес|months?)/i);
    const startDateMatch = pageContent.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
    
    // Extract course name from title or h1
    const titleMatch = pageContent.match(/(?:title|название)[:\s]*([^\n]{10,100})/i);
    const courseName = titleMatch ? titleMatch[1].trim() : defaultData.courseName;
    
    // AI analysis
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    console.log('[analyzeCourse] Starting AI analysis');
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты эксперт по анализу образовательных курсов. Извлеки данные из текста. Отвечай ТОЛЬКО валидным JSON без markdown.' },
        { role: 'user', content: `Проанализируй информацию о курсе и извлеки данные.

URL: ${url}

ТЕКСТ СТРАНИЦЫ:
${pageContent.substring(0, 8000)}

Извлеки и верни JSON:
{
  "courseName": "полное название курса",
  "basicInfo": "краткое описание курса 1-2 предложения",
  "startDate": "дата начала (например: 15 марта 2025)",
  "duration": "длительность (например: 4 месяца)",
  "pricePerMonth": "цена в месяц (например: 15000 ₽/мес)",
  "totalPrice": "полная цена (например: 60000 ₽)",
  "platform": "название платформы или вуза",
  "installment": true или false,
  "program": "основные темы/модули через запятую",
  "hasAI": true или false,
  "teachers": "имена преподавателей если есть",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1"]
}

Если информация не найдена в тексте — оставь поле пустым. НЕ придумывай данные.` }
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('[analyzeCourse] AI response:', responseText.substring(0, 200));
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : defaultData;
    
    // Override with regex if AI missed
    if (foundPrice && parseInt(foundPrice) > 1000 && (!parsed.totalPrice || parsed.totalPrice === '')) {
      parsed.totalPrice = parseInt(foundPrice).toLocaleString('ru-RU') + ' ₽';
    }
    if (durationMatch && (!parsed.duration || parsed.duration === '')) {
      parsed.duration = durationMatch[1] + ' месяцев';
    }
    if (startDateMatch && (!parsed.startDate || parsed.startDate === '')) {
      parsed.startDate = startDateMatch[1];
    }
    if (!parsed.courseName || parsed.courseName === defaultData.courseName) {
      parsed.courseName = courseName;
    }
    if (!parsed.platform || parsed.platform === '') {
      parsed.platform = defaultData.platform;
    }
    
    return parsed;
    
  } catch (e) {
    console.error('[analyzeCourse] Error:', e);
    const data = getDefaultCourseData(url);
    return data;
  }
}

async function compareCourses(competitor: CourseData, productLab: CourseData) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты эксперт по сравнению образовательных курсов. Отвечай ТОЛЬКО валидным JSON.' },
        { role: 'user', content: `Сравни два курса:

КУРС КОНКУРЕНТА: ${competitor.courseName}
- Платформа: ${competitor.platform}
- Цена: ${competitor.totalPrice || 'не указана'}
- Длительность: ${competitor.duration || 'не указана'}
- Старт: ${competitor.startDate || 'не указана'}
- AI: ${competitor.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${competitor.installment ? 'Да' : 'Нет'}
- Программа: ${competitor.program || 'не указана'}
- Сильные стороны: ${competitor.strengths?.join(', ') || 'не указаны'}
- Слабые стороны: ${competitor.weaknesses?.join(', ') || 'не указаны'}

КУРС PRODUCTLAB (эталон): ${productLab.courseName}
- Платформа: ${productLab.platform}
- Цена: ${productLab.totalPrice || 'не указана'}
- Длительность: ${productLab.duration || 'не указана'}
- AI: ${productLab.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${productLab.installment ? 'Да' : 'Нет'}

Проведи анализ и верни JSON:
{
  "priceComparison": "сравнение цен с выводом",
  "durationComparison": "сравнение длительности",
  "platformComparison": "сравнение платформ и форматов",
  "strengthsVsProductLab": ["преимущество 1", "преимущество 2"],
  "weaknessesVsProductLab": ["недостаток 1", "недостаток 2"],
  "overallVerdict": "общий вывод и рекомендация"
}` }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      priceComparison: 'Не удалось сравнить',
      durationComparison: '',
      platformComparison: '',
      strengthsVsProductLab: [],
      weaknessesVsProductLab: [],
      overallVerdict: 'Недостаточно данных для сравнения'
    };
  } catch (e) {
    console.error('[compareCourses] Error:', e);
    return {
      priceComparison: '',
      durationComparison: '',
      platformComparison: '',
      strengthsVsProductLab: [],
      weaknessesVsProductLab: [],
      overallVerdict: 'Ошибка при сравнении курсов'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] === New Request ===');
  
  try {
    let body;
    try {
      body = await request.json();
    } catch {
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
