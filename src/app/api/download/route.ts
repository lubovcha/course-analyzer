import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json({ error: 'Файл не указан' }, { status: 400 });
    }
    
    // Security: only allow files from download directory
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Недопустимое имя файла' }, { status: 400 });
    }
    
    const filepath = `/home/z/my-project/download/${filename}`;
    
    let content: Buffer;
    try {
      content = await readFile(filepath);
    } catch {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }
    
    const contentType = filename.endsWith('.pdf') 
      ? 'application/pdf'
      : filename.endsWith('.pptx')
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/octet-stream';
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString()
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Ошибка скачивания',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
