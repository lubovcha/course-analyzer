import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Product Lab data for comparison
const PRODUCT_LAB_DATA = {
  name: "Product Lab",
  basicInfo: "Образовательная платформа для продакт-менеджеров с фокусом на практические навыки",
  pricePerMonth: "от 15 000 ₽",
  totalPrice: "от 60 000 ₽",
  duration: "4 месяца",
  platform: "Собственная платформа",
  hasAI: true,
  installment: true,
  license: "Лицензия на образовательную деятельность",
  completionDocument: "Сертификат о прохождении",
  format: "Онлайн, записанные уроки + live-сессии",
  homeworkChecker: "Преподаватель + AI",
  strengths: ["Практическая направленность", "AI-ассистент", "Сильное комьюнити", "Трудоустройство"],
  weaknesses: ["Высокая цена", "Ограниченный набор курсов"]
};

interface CourseAnalysis {
  url: string;
  success: boolean;
  error?: string;
  data?: {
    courseName: string;
    basicInfo: string;
    startDate: string;
    utp: string;
    targetAudience: string;
    duration: string;
    pricePerMonth: string;
    totalPrice: string;
    tariffs: string;
    tariffContent: string;
    platform: string;
    installment: boolean;
    license: string;
    completionDocument: string;
    training: string;
    program: string;
    hasAI: boolean;
    howClassesWork: string;
    homeworkChecker: string;
    teachers: string;
    teacherCommunication: string;
    bonuses: string;
    partner: string;
    advertising: string;
    contextualAds: string;
    promotions: string;
    additionalProducts: string;
    entryPoint: string;
    strengths: string[];
    weaknesses: string[];
    firstImpression: string;
  };
  comparison?: {
    priceComparison: string;
    durationComparison: string;
    platformComparison: string;
    strengthsVsProductLab: string[];
    weaknessesVsProductLab: string[];
    overallVerdict: string;
  };
  rawData?: string;
}

async function analyzeWithAI(content: string, url: string, searchContext: string = ''): Promise<CourseAnalysis['data']> {
  const zai = await ZAI.create();

  // Extract key info with regex before AI analysis
  const preExtractedData = {
    price: '',
    duration: '',
    startDate: ''
  };

  // Price extraction - look for various price patterns
  const pricePatterns = [
    /(\d[\d\s]{3,})\s*₽/g,
    /(\d[\d\s]{3,})\s*руб/gi,
    /стоимость[:\s]*(\d[\d\s]+)/gi,
    /цена[:\s]*(\d[\d\s]+)/gi,
    /от\s*(\d[\d\s]{3,})\s*(?:₽|руб)/gi
  ];
  for (const pattern of pricePatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      // Take the largest price found (likely total course price)
      const prices = matches.map(m => parseInt(m[1].replace(/\s/g, ''))).filter(p => p > 1000);
      if (prices.length > 0) {
        preExtractedData.price = Math.max(...prices).toLocaleString('ru-RU') + ' ₽';
        break;
      }
    }
  }

  // Duration extraction
  const durationMatch = content.match(/(\d{1,2})\s*(?:месяц|мес|months?)/i);
  if (durationMatch) {
    preExtractedData.duration = `${durationMatch[1]} месяцев`;
  }

  // Start date extraction
  const months = 'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря';
  const startDatePatterns = [
    new RegExp(`(?:старт|начало|дата\\s*старта|ближайший\\s*поток)[^\\d]*(\\d{1,2}\\s*(?:${months}))`, 'i'),
    new RegExp(`(\\d{1,2}\\s*(?:${months})\\s*\\d{0,4})`, 'gi')
  ];
  for (const pattern of startDatePatterns) {
    const match = content.match(pattern);
    if (match) {
      preExtractedData.startDate = match[1] || match[0];
      break;
    }
  }

  console.log('[Analyzer] Pre-extracted:', preExtractedData);

  const prompt = `Ты — эксперт по анализу образовательных курсов. Твоя задача — ТОЧНО извлечь данные о курсе из контента.

URL курса: ${url}

${preExtractedData.price ? `⚠️ ПРЕДОБРАБОТКА НАШЛА ЦЕНУ: ${preExtractedData.price} - ИСПОЛЬЗУЙ ЭТО!\n` : ''}${preExtractedData.duration ? `⚠️ ПРЕДОБРАБОТКА НАШЛА ДЛИТЕЛЬНОСТЬ: ${preExtractedData.duration} - ИСПОЛЬЗУЙ ЭТО!\n` : ''}${preExtractedData.startDate ? `⚠️ ПРЕДОБРАБОТКА НАШЛА ДАТУ СТАРТА: ${preExtractedData.startDate} - ИСПОЛЬЗУЙ ЭТО!\n` : ''}

${searchContext ? `ДАННЫЕ ИЗ ВЕБ-ПОИСКА:\n${searchContext}\n\n` : ''}

КОНТЕНТ СТРАНИЦЫ:
${content.substring(0, 25000)}

=== КРИТИЧЕСКИ ВАЖНЫЕ ИНСТРУКЦИИ ПО ИЗВЛЕЧЕНИЮ ===

1. ЦЕНА (totalPrice):
   - Ищи: числа с ₽, руб, рублей
   - Ищи: "стоимость", "цена", "от X ₽"
   - Если есть рассрочка - ищи "в месяц" или "/мес"
   - Формат: "XX XXX ₽" или "от XX XXX ₽"

2. ДАТА СТАРТА (startDate):
   - Ищи: "старт", "начало", "ближайший поток"
   - Формат: "XX февраля", "XX марта 2025"
   - Если даты нет - напиши "По расписанию"

3. ДЛИТЕЛЬНОСТЬ (duration):
   - Ищи: "X месяцев", "X мес", "X weeks"
   - Формат: "X месяцев"

4. ПРОГРАММА (program):
   - Ищи: модули, блоки, темы, разделы
   - Перечисли через запятую

5. ПРЕПОДАВАТЕЛИ (teachers):
   - Ищи имена, должности, "преподаватель", "эксперт"

ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON (БЕЗ MARKDOWN):
{"courseName":"название","basicInfo":"описание","startDate":"дата","utp":"УТП","targetAudience":"аудитория","duration":"длительность","pricePerMonth":"цена/мес","totalPrice":"полная цена","tariffs":"названия тарифов","tariffContent":"что входит","platform":"платформа","installment":false,"license":"лицензия","completionDocument":"документ","training":"формат","program":"модули","hasAI":false,"howClassesWork":"формат занятий","homeworkChecker":"кто проверяет","teachers":"имена","teacherCommunication":"связь","bonuses":"бонусы","partner":"партнёрка","advertising":"","contextualAds":"","promotions":"акции","additionalProducts":"допы","entryPoint":"точка входа","strengths":["сила"],"weaknesses":["слабость"],"firstImpression":"впечатление"}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты извлекаешь данные о курсах. Отвечай только JSON. Используй данные из поиска если есть. Не пиши "Не указано" если данные найдены в поиске.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log(`[Analyzer] AI response length: ${responseText.length}`);
    
    let cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanJson = jsonMatch[0];
    
    const parsed = JSON.parse(cleanJson);
    console.log(`[Analyzer] Parsed course name: ${parsed.courseName}`);

    // Override with pre-extracted data if AI returned empty/invalid values
    if (preExtractedData.price && (!parsed.totalPrice || parsed.totalPrice === 'Не указано' || parsed.totalPrice === '')) {
      parsed.totalPrice = preExtractedData.price;
    }
    if (preExtractedData.duration && (!parsed.duration || parsed.duration === 'Не указано' || parsed.duration === '')) {
      parsed.duration = preExtractedData.duration;
    }
    if (preExtractedData.startDate && (!parsed.startDate || parsed.startDate === 'Не указано' || parsed.startDate === '')) {
      parsed.startDate = preExtractedData.startDate;
    }

    return parsed;
  } catch (error) {
    console.error('[Analyzer] AI parsing error:', error);

    // Return pre-extracted data as fallback
    if (preExtractedData.price || preExtractedData.duration || preExtractedData.startDate) {
      return {
        courseName: url.split('/').filter(Boolean).pop() || 'Курс',
        basicInfo: 'Данные извлечены из контента',
        startDate: preExtractedData.startDate,
        utp: '',
        targetAudience: '',
        duration: preExtractedData.duration,
        pricePerMonth: preExtractedData.price ? `${Math.round(parseInt(preExtractedData.price.replace(/\D/g, '')) / 4).toLocaleString('ru-RU')} ₽/мес` : '',
        totalPrice: preExtractedData.price,
        tariffs: '',
        tariffContent: '',
        platform: new URL(url).hostname.replace('www.', ''),
        installment: false,
        license: '',
        completionDocument: '',
        training: 'Онлайн',
        program: '',
        hasAI: false,
        howClassesWork: '',
        homeworkChecker: '',
        teachers: '',
        teacherCommunication: '',
        bonuses: '',
        partner: '',
        advertising: '',
        contextualAds: '',
        promotions: '',
        additionalProducts: '',
        entryPoint: '',
        strengths: [],
        weaknesses: [],
        firstImpression: ''
      };
    }
    // Return partial data from search context if available
    if (searchContext) {
      const priceMatch = searchContext.match(/(\d[\d\s]{3,})\s*(?:₽|руб\.?)/i);
      const durationMatch = searchContext.match(/(\d+)\s*(?:месяц|мес)/i);
      const startDateMatch = searchContext.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
      
      return {
        courseName: url.split('/').filter(Boolean).pop() || 'Курс',
        basicInfo: 'Данные получены из поиска',
        startDate: startDateMatch ? startDateMatch[1] : '',
        utp: '',
        targetAudience: '',
        duration: durationMatch ? `${durationMatch[1]} месяцев` : '',
        pricePerMonth: priceMatch ? `${Math.round(parseInt(priceMatch[1].replace(/\s/g, '')) / 5).toLocaleString('ru-RU')} ₽/мес` : '',
        totalPrice: priceMatch ? `${priceMatch[1].replace(/\s/g, '')} ₽` : '',
        tariffs: '',
        tariffContent: '',
        platform: new URL(url).hostname.replace('www.', ''),
        installment: false,
        license: '',
        completionDocument: '',
        training: 'Онлайн',
        program: '',
        hasAI: false,
        howClassesWork: '',
        homeworkChecker: '',
        teachers: '',
        teacherCommunication: '',
        bonuses: '',
        partner: '',
        advertising: '',
        contextualAds: '',
        promotions: '',
        additionalProducts: '',
        entryPoint: '',
        strengths: [],
        weaknesses: [],
        firstImpression: ''
      };
    }
    return getDefaultCourseData();
  }
}

function getDefaultCourseData(): CourseAnalysis['data'] {
  return {
    courseName: "Ошибка анализа",
    basicInfo: "",
    startDate: "",
    utp: "",
    targetAudience: "",
    duration: "",
    pricePerMonth: "",
    totalPrice: "",
    tariffs: "",
    tariffContent: "",
    platform: "",
    installment: false,
    license: "",
    completionDocument: "",
    training: "",
    program: "",
    hasAI: false,
    howClassesWork: "",
    homeworkChecker: "",
    teachers: "",
    teacherCommunication: "",
    bonuses: "",
    partner: "",
    advertising: "",
    contextualAds: "",
    promotions: "",
    additionalProducts: "",
    entryPoint: "",
    strengths: [],
    weaknesses: [],
    firstImpression: ""
  };
}

async function compareWithProductLab(courseData: CourseAnalysis['data']): Promise<CourseAnalysis['comparison']> {
  if (!courseData || courseData.courseName === "Ошибка анализа") {
    return {
      priceComparison: "",
      durationComparison: "",
      platformComparison: "",
      strengthsVsProductLab: [],
      weaknessesVsProductLab: [],
      overallVerdict: "Не удалось выполнить сравнение из-за ошибки анализа"
    };
  }

  const zai = await ZAI.create();
  
  const prompt = `Сравни курс "${courseData.courseName}" с Product Lab и дай сравнение.

Данные анализируемого курса:
- Название: ${courseData.courseName}
- Цена: ${courseData.totalPrice} (${courseData.pricePerMonth}/мес)
- Длительность: ${courseData.duration}
- Платформа: ${courseData.platform}
- AI: ${courseData.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${courseData.installment ? 'Да' : 'Нет'}
- Формат: ${courseData.training}
- Сильные стороны: ${courseData.strengths?.join(', ') || 'Не указаны'}
- Слабые стороны: ${courseData.weaknesses?.join(', ') || 'Не указаны'}

Данные Product Lab:
- Название: ${PRODUCT_LAB_DATA.name}
- Цена: ${PRODUCT_LAB_DATA.totalPrice} (${PRODUCT_LAB_DATA.pricePerMonth}/мес)
- Длительность: ${PRODUCT_LAB_DATA.duration}
- Платформа: ${PRODUCT_LAB_DATA.platform}
- AI: ${PRODUCT_LAB_DATA.hasAI ? 'Да' : 'Нет'}
- Рассрочка: ${PRODUCT_LAB_DATA.installment ? 'Да' : 'Нет'}
- Сильные стороны: ${PRODUCT_LAB_DATA.strengths.join(', ')}
- Слабые стороны: ${PRODUCT_LAB_DATA.weaknesses.join(', ')}

Верни ТОЛЬКО валидный JSON (без markdown):
{
  "priceComparison": "Сравнение цен",
  "durationComparison": "Сравнение длительности",
  "platformComparison": "Сравнение платформ и форматов",
  "strengthsVsProductLab": ["чем лучше Product Lab 1", "чем лучше Product Lab 2"],
  "weaknessesVsProductLab": ["чем хуже Product Lab 1", "чем хуже Product Lab 2"],
  "overallVerdict": "Общий вывод и рекомендация"
}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Ты эксперт по сравнению образовательных курсов. Отвечай только валидным JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }
    
    return JSON.parse(cleanJson);
  } catch {
    return {
      priceComparison: "Не удалось сравнить",
      durationComparison: "",
      platformComparison: "",
      strengthsVsProductLab: [],
      weaknessesVsProductLab: [],
      overallVerdict: "Не удалось выполнить сравнение"
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { urls, rawContent } = body;

    console.log('[Analyzer] Received request:', { 
      urlsType: typeof urls, 
      urlsLength: urls?.length,
      urlsPreview: typeof urls === 'string' ? urls.substring(0, 200) : JSON.stringify(urls?.slice?.(0, 3))
    });

    // If raw content provided directly
    if (rawContent && typeof rawContent === 'string') {
      const courseData = await analyzeWithAI(rawContent, 'manual-input');
      const comparison = await compareWithProductLab(courseData);
      
      return NextResponse.json({ 
        success: true, 
        results: [{
          url: 'manual-input',
          success: true,
          data: courseData,
          comparison
        }],
        productLabReference: PRODUCT_LAB_DATA
      });
    }

    // Parse URLs if they come as a single string (fallback)
    if (typeof urls === 'string') {
      console.log('[Analyzer] URLs came as string, parsing...');
      // Split by tabs, newlines, and spaces, then extract URLs
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const matches = urls.match(urlRegex) || [];
      urls = matches.map((u: string) => u.trim()).filter((u: string) => {
        try {
          new URL(u);
          return true;
        } catch {
          return false;
        }
      });
      console.log('[Analyzer] Parsed URLs:', urls);
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ 
        error: 'Необходимо передать массив URL-адресов' 
      }, { status: 400 });
    }

    // Clean and validate each URL
    urls = urls.map((u: string) => u.trim()).filter((u: string) => {
      if (!u || !u.startsWith('http')) return false;
      try {
        new URL(u);
        return true;
      } catch {
        console.log('[Analyzer] Invalid URL filtered out:', u);
        return false;
      }
    });

    console.log('[Analyzer] Final URLs to process:', urls);

    if (urls.length === 0) {
      return NextResponse.json({ 
        error: 'Не найдено корректных URL-адресов' 
      }, { status: 400 });
    }

    const zai = await ZAI.create();
    const results: CourseAnalysis[] = [];

    for (const url of urls) {
      try {
        console.log(`[Analyzer] Starting: ${url}`);
        
        // Try to read page content
        let pageContent = '';
        let pageError = '';
        
        try {
          const pageResult = await zai.functions.invoke('page_reader', { url });
          
          if (pageResult?.data?.html) {
            pageContent = pageResult.data.html;
            console.log(`[Analyzer] Page read success: ${url} (${pageContent.length} chars)`);
          } else if (pageResult?.data?.text) {
            pageContent = pageResult.data.text;
            console.log(`[Analyzer] Page text extracted: ${url} (${pageContent.length} chars)`);
          } else {
            pageError = 'Пустой контент страницы';
          }
        } catch (fetchError: unknown) {
          console.error(`[Analyzer] Page read error:`, fetchError);
          pageError = fetchError instanceof Error ? fetchError.message : 'Ошибка чтения страницы';
        }
        
        // Always try web search for additional context
        let searchContextData = '';
        console.log(`[Analyzer] Running web search for: ${url}`);
        try {
          const urlPath = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
          const domain = new URL(url).hostname.replace('www.', '');
          const searchResult = await zai.functions.invoke('web_search', {
            query: `${domain} ${urlPath} курс цена стоимость длительность старт`,
            num: 5
          });
          
          console.log(`[Analyzer] Web search result type:`, typeof searchResult, Array.isArray(searchResult));
          
          // Handle different response formats
          let searchItems = searchResult;
          if (searchResult && typeof searchResult === 'object' && !Array.isArray(searchResult)) {
            searchItems = searchResult.results || searchResult.data || [];
          }
          
          if (searchItems && Array.isArray(searchItems) && searchItems.length > 0) {
            searchContextData = searchItems.map((r: {name?: string; snippet?: string, url?: string, title?: string}) => 
              `${r.name || r.title || ''}: ${r.snippet || ''}`
            ).join('\n');
            console.log(`[Analyzer] Found search context (${searchContextData.length} chars)`);
            
            // If page content failed, use search data as content
            if (!pageContent || pageContent.length < 100) {
              pageContent = `Данные из поиска:\n${searchContextData}`;
              console.log(`[Analyzer] Using search data as page content`);
            }
          }
        } catch (searchError) {
          console.log(`[Analyzer] Web search failed:`, searchError);
        }
        
        if (!pageContent || pageContent.length < 50) {
          results.push({
            url,
            success: false,
            error: `Не удалось получить данные. Попробуйте вставить текст страницы вручную.`
          });
          continue;
        }

        // Analyze with AI
        console.log(`[Analyzer] Starting AI analysis for: ${url}`);
        const courseData = await analyzeWithAI(pageContent, url, searchContextData);
        
        // Override with data from web search if AI didn't find it
        if (searchContextData) {
          const priceMatch = searchContextData.match(/(\d[\d\s]{3,})\s*(?:₽|руб\.?)/i);
          const durationMatch = searchContextData.match(/(\d+)\s*(?:месяц|мес)/i);
          const startDateMatch = searchContextData.match(/(?:старт|начало|дата)[^\d]*(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i) 
            || searchContextData.match(/(\d{1,2}\s*(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))/i);
          
          console.log(`[Analyzer] Price match:`, priceMatch ? priceMatch[1] : null);
          console.log(`[Analyzer] Duration match:`, durationMatch ? durationMatch[1] : null);
          console.log(`[Analyzer] Start date match:`, startDateMatch ? startDateMatch[1] : null);
          
          if (priceMatch && (courseData.totalPrice === 'Не указано' || courseData.totalPrice === '')) {
            const price = priceMatch[1].replace(/\s/g, '').trim();
            courseData.totalPrice = `${price} ₽`;
            courseData.pricePerMonth = `${Math.round(parseInt(price) / 5).toLocaleString('ru-RU')} ₽/мес`;
          }
          if (durationMatch && (courseData.duration === 'Не указано' || courseData.duration === '')) {
            courseData.duration = `${durationMatch[1]} месяцев`;
          }
          if (startDateMatch && (courseData.startDate === 'Не указано' || courseData.startDate === '')) {
            courseData.startDate = startDateMatch[1];
          }
        }
        
        // Compare with Product Lab
        console.log(`[Analyzer] Starting comparison for: ${url}`);
        const comparison = await compareWithProductLab(courseData);

        results.push({
          url,
          success: true,
          data: courseData,
          comparison
        });
        
        console.log(`[Analyzer] Completed: ${url}`);

      } catch (error: unknown) {
        console.error(`[Analyzer] Error for ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка анализа'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      productLabReference: PRODUCT_LAB_DATA
    });

  } catch (error) {
    console.error('[Analyzer] API Error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
