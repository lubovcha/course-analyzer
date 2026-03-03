import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

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

interface Comparison {
  priceComparison: string;
  durationComparison: string;
  platformComparison: string;
  strengthsVsProductLab: string[];
  weaknessesVsProductLab: string[];
  overallVerdict: string;
}

interface ExportResult {
  url: string;
  success: boolean;
  data?: CourseData;
  comparison?: Comparison;
}

function generatePDF(results: ExportResult[]): Buffer {
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(18);
  doc.text('Сравнение курсов', 20, y);
  y += 15;
  
  doc.setFontSize(10);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, y);
  y += 20;
  
  for (const result of results) {
    if (!result.success || !result.data) continue;
    
    // Course name
    doc.setFontSize(14);
    doc.setTextColor(75, 0, 130);
    doc.text(result.data.courseName || 'Курс', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Course details
    const fields = [
      ['Цена', result.data.totalPrice],
      ['В месяц', result.data.pricePerMonth],
      ['Длительность', result.data.duration],
      ['Старт', result.data.startDate],
      ['Платформа', result.data.platform],
      ['AI', result.data.hasAI ? 'Да' : 'Нет'],
      ['Рассрочка', result.data.installment ? 'Да' : 'Нет'],
      ['Программа', result.data.program?.substring(0, 100)],
      ['Преподаватели', result.data.teachers],
    ];
    
    for (const [label, value] of fields) {
      if (value) {
        doc.text(`${label}: ${value}`, 20, y);
        y += 6;
      }
    }
    
    // Strengths
    if (result.data.strengths?.length) {
      doc.setTextColor(0, 128, 0);
      doc.text('Сильные стороны:', 20, y);
      y += 6;
      for (const s of result.data.strengths) {
        doc.text(`+ ${s}`, 25, y);
        y += 5;
      }
    }
    
    // Weaknesses
    if (result.data.weaknesses?.length) {
      doc.setTextColor(200, 0, 0);
      doc.text('Слабые стороны:', 20, y);
      y += 6;
      for (const w of result.data.weaknesses) {
        doc.text(`- ${w}`, 25, y);
        y += 5;
      }
    }
    
    doc.setTextColor(0, 0, 0);
    y += 10;
    
    // Comparison
    if (result.comparison) {
      doc.setFontSize(12);
      doc.setTextColor(75, 0, 130);
      doc.text('Сравнение с ProductLab', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      if (result.comparison.priceComparison) {
        doc.text(`Цена: ${result.comparison.priceComparison}`, 20, y);
        y += 6;
      }
      if (result.comparison.durationComparison) {
        doc.text(`Длительность: ${result.comparison.durationComparison}`, 20, y);
        y += 6;
      }
      
      if (result.comparison.strengthsVsProductLab?.length) {
        doc.setTextColor(0, 128, 0);
        doc.text('Преимущества перед ProductLab:', 20, y);
        y += 6;
        for (const s of result.comparison.strengthsVsProductLab) {
          doc.text(`+ ${s}`, 25, y);
          y += 5;
        }
      }
      
      if (result.comparison.weaknessesVsProductLab?.length) {
        doc.setTextColor(200, 0, 0);
        doc.text('Недостатки перед ProductLab:', 20, y);
        y += 6;
        for (const w of result.comparison.weaknessesVsProductLab) {
          doc.text(`- ${w}`, 25, y);
          y += 5;
        }
      }
      
      doc.setTextColor(0, 0, 0);
      if (result.comparison.overallVerdict) {
        y += 5;
        const verdict = doc.splitTextToSize(result.comparison.overallVerdict, 170);
        doc.text(verdict, 20, y);
        y += verdict.length * 5;
      }
    }
    
    y += 15;
    
    // New page if needed
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generatePPTX(results: ExportResult[]): Buffer {
  const pptx = new PptxGenJS();
  
  for (const result of results) {
    if (!result.success || !result.data) continue;
    
    const slide = pptx.addSlide();
    
    // Title
    slide.addText(result.data.courseName || 'Курс', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 28, bold: true, color: '4B0082'
    });
    
    // Course info
    let y = 1.5;
    const fields = [
      ['Цена', result.data.totalPrice],
      ['Длительность', result.data.duration],
      ['Старт', result.data.startDate],
      ['Платформа', result.data.platform],
      ['AI-ассистент', result.data.hasAI ? 'Да' : 'Нет'],
      ['Рассрочка', result.data.installment ? 'Да' : 'Нет'],
    ];
    
    for (const [label, value] of fields) {
      if (value) {
        slide.addText(`${label}: ${value}`, {
          x: 0.5, y, w: 9, h: 0.4,
          fontSize: 14
        });
        y += 0.4;
      }
    }
    
    // Strengths
    if (result.data.strengths?.length) {
      y += 0.3;
      slide.addText('Сильные стороны:', {
        x: 0.5, y, w: 9, h: 0.4,
        fontSize: 14, bold: true, color: '008000'
      });
      y += 0.4;
      for (const s of result.data.strengths.slice(0, 5)) {
        slide.addText(`+ ${s}`, {
          x: 0.7, y, w: 8.8, h: 0.35,
          fontSize: 12, color: '008000'
        });
        y += 0.35;
      }
    }
    
    // Comparison slide
    if (result.comparison) {
      const compSlide = pptx.addSlide();
      compSlide.addText('Сравнение с ProductLab', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 28, bold: true, color: '4B0082'
      });
      
      let cy = 1.5;
      
      if (result.comparison.priceComparison) {
        compSlide.addText(`Цена: ${result.comparison.priceComparison}`, {
          x: 0.5, y: cy, w: 9, h: 0.5,
          fontSize: 14
        });
        cy += 0.6;
      }
      
      if (result.comparison.overallVerdict) {
        compSlide.addText(result.comparison.overallVerdict, {
          x: 0.5, y: cy, w: 9, h: 1,
          fontSize: 12
        });
      }
    }
  }
  
  return Buffer.from(pptx.write({ outputType: 'buffer' }) as ArrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, results } = body as { format: 'pdf' | 'pptx'; results: ExportResult[] };
    
    if (!format || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    let filename: string;
    let buffer: Buffer;
    let contentType: string;
    
    if (format === 'pdf') {
      filename = `course-analysis-${timestamp}.pdf`;
      buffer = generatePDF(results);
      contentType = 'application/pdf';
    } else {
      filename = `course-analysis-${timestamp}.pptx`;
      buffer = generatePPTX(results);
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    
    // Save to download directory
    const fs = await import('fs/promises');
    const downloadDir = '/home/z/my-project/download';
    
    try {
      await fs.mkdir(downloadDir, { recursive: true });
    } catch {}
    
    await fs.writeFile(`${downloadDir}/${filename}`, buffer);
    
    return NextResponse.json({ 
      success: true, 
      filename,
      size: buffer.length
    });
    
  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json({ 
      error: 'Ошибка генерации файла',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
