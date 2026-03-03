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
  
  try {
    // Dynamic import to avoid issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    console.log('[analyzeCourse] ZAI imported');
    
    const zai = await ZAI.create();
    console.log('[analyzeCourse] ZAI created');
    
    // Try page reader
    let pageContent = '';
    try {
      const pageResult = await zai.functions.invoke('page_reader', { url });
      console.log('[analyzeCourse] Page reader result:', typeof pageResult);
      
      if (pageResult && typeof pageResult === 'object') {
        const data = (pageResult as { data?: { html?: string } }).data;
        if (data?.html) {
          pageContent = data.html;
          console.log('[analyzeCourse] HTML length:', pageContent.length);
        }
      }
    } catch (e) {
      console.error('[analyzeCourse] Page reader error:', e);
    }
    
    if (!pageContent || pageContent.length < 50) {
      console.log('[analyzeCourse] No content, returning default');
      return getDefaultCourseData(url);
    }
    
    // Quick regex extraction
    const priceMatch = pageContent.match(/(\d[\d\s]{3,})\s*(?:₽|руб)/i);
    const durationMatch = pageContent.match(/(\d{1,2})\s*(?:месяц|мес)/i);
    const startDateMatch = pageContent.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
    
    // AI analysis
    console.log('[analyzeCourse] Starting AI analysis');
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Извлеки данные курса. Только JSON.' },
        { role: 'user', content: `URL: ${url}\n\nКОНТЕНТ: ${pageContent.substring(0, 8000)}\n\nJSON: {"courseName":"","basicInfo":"","startDate":"","duration":"","pricePerMonth":"","totalPrice":"","platform":"","installment":false,"program":"","hasAI":false,"teachers":"","strengths":[],"weaknesses":[]}` }
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('[analyzeCourse] AI response length:', responseText.length);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultCourseData(url);
    
    if (priceMatch && !parsed.totalPrice) parsed.totalPrice = priceMatch[1].replace(/\s/g, '') + ' ₽';
    if (durationMatch && !parsed.duration) parsed.duration = durationMatch[1] + ' месяцев';
    if (startDateMatch && !parsed.startDate) parsed.startDate = startDateMatch[1];
    
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
        { role: 'system', content: 'Сравни курсы. Только JSON.' },
        { role: 'user', content: `Сравни:
КОНКУРЕНТ: ${competitor.courseName} | ${competitor.totalPrice} | ${competitor.duration}
PRODUCTLAB: ${productLab.courseName} | ${productLab.totalPrice} | ${productLab.duration}

JSON: {"priceComparison":"","durationComparison":"","platformComparison":"","strengthsVsProductLab":[],"weaknessesVsProductLab":[],"overallVerdict":""}` }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      priceComparison: '', durationComparison: '', platformComparison: '',
      strengthsVsProductLab: [], weaknessesVsProductLab: [], overallVerdict: ''
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
      console.error('[API] JSON parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const { productLabUrl, competitorUrl, step, productLabData } = body;
    console.log('[API] Request body:', { step, productLabUrl, competitorUrl });

    // Step 1: Analyze ProductLab only
    if (step === 1 && productLabUrl) {
      const data = await analyzeCourse(productLabUrl);
      return NextResponse.json({ success: true, step: 1, productLab: data });
    }

    // Step 2: Analyze competitor only
    if (step === 2 && competitorUrl) {
      const data = await analyzeCourse(competitorUrl);
      return NextResponse.json({ success: true, step: 2, competitor: data });
    }

    // Step 3: Compare
    if (step === 3 && productLabData && competitorUrl) {
      const competitorData = await analyzeCourse(competitorUrl);
      const comparison = await compareCourses(competitorData, productLabData);
      return NextResponse.json({ success: true, step: 3, competitor: competitorData, comparison });
    }

    // All-in-one mode
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
    message: 'Course Analyzer API is running',
    timestamp: new Date().toISOString()
  });
}
