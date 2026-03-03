import ZAI from 'z-ai-web-dev-sdk';
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

async function fetchPageContent(url: string): Promise<string> {
  try {
    const zai = await ZAI.create();
    const pageResult = await zai.functions.invoke('page_reader', { url }) as { data?: { html?: string } };
    if (pageResult?.data?.html) return pageResult.data.html;
  } catch (e) {
    console.error('[fetchPageContent] Error:', e);
  }
  return '';
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
  
  let pageContent = '';
  try {
    pageContent = await fetchPageContent(url);
    console.log('[analyzeCourse] Content length:', pageContent.length);
  } catch (e) {
    console.error('[analyzeCourse] Fetch error:', e);
    return getDefaultCourseData(url);
  }
  
  if (!pageContent || pageContent.length < 50) {
    console.log('[analyzeCourse] No content, returning default');
    return getDefaultCourseData(url);
  }
  
  // Quick regex extraction
  const priceMatch = pageContent.match(/(\d[\d\s]{3,})\s*(?:₽|руб)/i);
  const durationMatch = pageContent.match(/(\d{1,2})\s*(?:месяц|мес)/i);
  const startDateMatch = pageContent.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
  
  try {
    const zai = await ZAI.create();
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
    console.error('[analyzeCourse] AI error:', e);
    const data = getDefaultCourseData(url);
    if (priceMatch) data.totalPrice = priceMatch[1].replace(/\s/g, '') + ' ₽';
    if (durationMatch) data.duration = durationMatch[1] + ' месяцев';
    return data;
  }
}

async function compareCourses(competitor: CourseData, productLab: CourseData) {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Сравни курсы. Только JSON.' },
        { role: 'user', content: `Сравни:
КОНКУРЕНТ: ${competitor.courseName} | ${competitor.totalPrice} | ${competitor.duration} | AI:${competitor.hasAI?'Да':'Нет'}
PRODUCTLAB: ${productLab.courseName} | ${productLab.totalPrice} | ${productLab.duration} | AI:${productLab.hasAI?'Да':'Нет'}

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
  try {
    const body = await request.json();
    const { productLabUrl, competitorUrl, step, productLabData } = body;

    console.log('[API] Request:', { step, productLabUrl, competitorUrl });

    // Step 1: Analyze ProductLab only
    if (step === 1 && productLabUrl) {
      console.log('[API] Step 1: Analyzing ProductLab');
      const data = await analyzeCourse(productLabUrl);
      return NextResponse.json({ success: true, step: 1, productLab: data });
    }

    // Step 2: Analyze competitor only
    if (step === 2 && competitorUrl) {
      console.log('[API] Step 2: Analyzing competitor');
      const data = await analyzeCourse(competitorUrl);
      return NextResponse.json({ success: true, step: 2, competitor: data });
    }

    // Step 3: Compare (requires both data)
    if (step === 3 && productLabData && competitorUrl) {
      console.log('[API] Step 3: Comparing');
      const competitorData = await analyzeCourse(competitorUrl);
      const comparison = await compareCourses(competitorData, productLabData);
      return NextResponse.json({ success: true, step: 3, competitor: competitorData, comparison });
    }

    // Legacy: All-in-one (for backward compatibility)
    if (productLabUrl && competitorUrl) {
      console.log('[API] All-in-one mode');
      
      const [productLab, competitor] = await Promise.all([
        analyzeCourse(productLabUrl),
        analyzeCourse(competitorUrl)
      ]);
      
      const comparison = await compareCourses(competitor, productLab);
      
      return NextResponse.json({ success: true, productLab, competitor, comparison });
    }

    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
