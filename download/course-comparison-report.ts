const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, VerticalAlign, PageNumber, ExternalHyperlink, LevelFormat } = require('docx');
const fs = require('fs');

// Color palette - "Midnight Code" for tech/AI theme
const colors = {
  primary: "#020617",      // Midnight Black - Titles
  body: "#1E293B",         // Deep Slate Blue - Body text
  secondary: "#64748B",    // Cool Blue-Gray - Subtitles
  accent: "#94A3B8",       // Steady Silver - Accent
  tableBg: "#F8FAFC",      // Glacial Blue-White - Table background
  headerBg: "#E2E8F0",     // Light gray for table headers
  green: "#059669",        // For positive aspects
  red: "#DC2626",          // For negative aspects
  indigo: "#4F46E5"        // For highlights
};

const tableBorder = { style: BorderStyle.SINGLE, size: 12, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
const verticalBorder = { top: tableBorder, bottom: tableBorder, left: { style: BorderStyle.NONE }, right: tableBorder };

// ProductStar data from analysis
const productStar = {
  name: "Профессия Middle и Senior Product Manager",
  url: "https://productstar.ru/course/product-manager-middle",
  price: "700 000 ₽",
  pricePerMonth: "70 000 ₽/мес",
  duration: "10 месяцев",
  startDate: "По расписанию",
  platform: "Productstar",
  license: "Лицензия на образовательную деятельность",
  document: "Диплом о профессиональной переподготовке",
  format: "Онлайн-обучение",
  program: "Управление бюджетами, Управление командой, Разработка стратегии, Аналитика",
  teachers: "Спикеры из топовых IT-компаний",
  bonuses: "Помощь в трудоустройстве, доступ к закрытым сообществам",
  strengths: ["Преподаватели из топовых IT-компаний", "Помощь в трудоустройстве", "Практическая направленность"],
  weaknesses: ["Высокая стоимость курса", "Длительность обучения"],
  hasAI: false,
  installment: false
};

// ProductLab data from analysis
const productLab = {
  name: "Product Manager",
  url: "https://productlab.ru/product_manager",
  price: "269 900 ₽",
  pricePerMonth: "67 475 ₽/мес",
  duration: "3 месяца",
  startDate: "26 февраля",
  platform: "Собственная платформа",
  license: "Лицензия на образовательную деятельность",
  document: "Сертификат о прохождении",
  format: "Онлайн, записанные уроки + live-сессии",
  program: "Практические модули по продуктовой разработке",
  teachers: "Практикующие продакт-менеджеры",
  bonuses: "AI-ассистент, комьюнити",
  strengths: ["Практическая направленность", "AI-ассистент", "Сильное комьюнити", "Трудоустройство"],
  weaknesses: ["Ограниченный набор курсов"],
  hasAI: true,
  installment: true
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150 } } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "strengths-ps",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "✓", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: colors.green } } }] },
      { reference: "weaknesses-ps",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "✗", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: colors.red } } }] },
      { reference: "strengths-pl",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "✓", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: colors.green } } }] },
      { reference: "weaknesses-pl",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "✗", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: colors.red } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Сравнительный анализ курсов Product Manager", color: colors.secondary, size: 20 })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— ", color: colors.secondary }), new TextRun({ children: [PageNumber.CURRENT], color: colors.secondary }), new TextRun({ text: " —", color: colors.secondary })]
      })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Сравнительный анализ курсов")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "ProductStar vs ProductLab", size: 32, color: colors.indigo, bold: true })] }),
      
      // Intro
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "Данный документ представляет результаты автоматического анализа двух образовательных курсов для продакт-менеджеров. Анализ включает извлечение ключевых параметров с лендингов курсов и их сравнение по ключевым метрикам.", color: colors.body })] }),
      
      // Section 1: Overview
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Обзор анализируемых курсов")] }),
      
      // Course links
      new Paragraph({ spacing: { after: 100 },
        children: [
          new TextRun({ text: "ProductStar: ", bold: true }),
          new ExternalHyperlink({ children: [new TextRun({ text: productStar.url, style: "Hyperlink" })], link: productStar.url })
        ] }),
      new Paragraph({ spacing: { after: 200 },
        children: [
          new TextRun({ text: "ProductLab: ", bold: true }),
          new ExternalHyperlink({ children: [new TextRun({ text: productLab.url, style: "Hyperlink" })], link: productLab.url })
        ] }),
      
      // Comparison table
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Сравнительная таблица")] }),
      
      new Table({
        columnWidths: [3120, 3120, 3120],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        rows: [
          // Header row
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Параметр", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ProductStar", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ProductLab", bold: true, size: 22 })] })] })
            ]
          }),
          // Data rows
          createTableRow("Название курса", productStar.name, productLab.name),
          createTableRow("Полная стоимость", productStar.price, productLab.price),
          createTableRow("В месяц", productStar.pricePerMonth, productLab.pricePerMonth),
          createTableRow("Длительность", productStar.duration, productLab.duration),
          createTableRow("Дата старта", productStar.startDate, productLab.startDate),
          createTableRow("Платформа", productStar.platform, productLab.platform),
          createTableRow("AI-ассистент", productStar.hasAI ? "Да" : "Нет", productLab.hasAI ? "Да" : "Нет"),
          createTableRow("Рассрочка", productStar.installment ? "Да" : "Нет", productLab.installment ? "Да" : "Нет"),
          createTableRow("Лицензия", productStar.license, productLab.license),
          createTableRow("Документ", productStar.document, productLab.document),
        ]
      }),
      
      // Section 2: Detailed Analysis
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Детальный анализ курсов")] }),
      
      // ProductStar
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("ProductStar — Профессия Middle и Senior Product Manager")] }),
      new Paragraph({ spacing: { after: 150 },
        children: [new TextRun({ text: "Онлайн-курс «Middle и Senior Продакт-Менеджера» с нуля. Обучение управлению бюджетами и командой. Разработка стратегии и аналитика. Диплом и помощь в трудоустройстве. Спикеры из топовых IT-компаний.", color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Программа курса:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productStar.program, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Преподаватели:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productStar.teachers, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Бонусы:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productStar.bonuses, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Сильные стороны:", bold: true, color: colors.green })] }),
      ...productStar.strengths.map(s => new Paragraph({ numbering: { reference: "strengths-ps", level: 0 }, children: [new TextRun({ text: s, color: colors.body })] })),
      
      new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: "Слабые стороны:", bold: true, color: colors.red })] }),
      ...productStar.weaknesses.map(w => new Paragraph({ numbering: { reference: "weaknesses-ps", level: 0 }, children: [new TextRun({ text: w, color: colors.body })] })),
      
      // ProductLab
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun("ProductLab — Product Manager")] }),
      new Paragraph({ spacing: { after: 150 },
        children: [new TextRun({ text: "Курс для тех, кто хочет стать продакт-менеджером или повысить свой уровень. Практическая направленность с поддержкой AI-ассистента. Сильное комьюнити и помощь в трудоустройстве.", color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Программа курса:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productLab.program, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Преподаватели:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productLab.teachers, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Бонусы:", bold: true })] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: productLab.bonuses, color: colors.body })] }),
      
      new Paragraph({ children: [new TextRun({ text: "Сильные стороны:", bold: true, color: colors.green })] }),
      ...productLab.strengths.map(s => new Paragraph({ numbering: { reference: "strengths-pl", level: 0 }, children: [new TextRun({ text: s, color: colors.body })] })),
      
      new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: "Слабые стороны:", bold: true, color: colors.red })] }),
      ...productLab.weaknesses.map(w => new Paragraph({ numbering: { reference: "weaknesses-pl", level: 0 }, children: [new TextRun({ text: w, color: colors.body })] })),
      
      // Section 3: Comparison Analysis
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Сравнительный анализ")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Сравнение цен")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: `Курс ProductStar значительно дороже — ${productStar.price} против ${productLab.price} у ProductLab. При этом ProductLab предлагает рассрочку, что делает его более доступным для широкой аудитории. Разница в цене составляет примерно ${Math.round((700000 - 269900) / 1000)} тыс. рублей, что является существенным фактором при выборе курса. Однако стоит учитывать, что курс ProductStar длится 10 месяцев против 3 месяцев у ProductLab, что частично объясняет разницу в стоимости.`, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Сравнение длительности")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: `Курс ProductStar длится ${productStar.duration}, что более чем в 3 раза дольше, чем ${productLab.duration} у ProductLab. Это может быть как преимуществом для тех, кто хочет глубоко погрузиться в материал, так и недостатком для тех, кто хочет быстрее получить навыки и начать работу. Длительный формат ProductStar предполагает более детальное изучение каждой темы, но требует большей временнойcommitment от студента.`, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Сравнение платформ и технологий")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: `Оба курса предлагают онлайн-формат обучения. ProductStar использует платформу ${productStar.platform}, в то время как ProductLab имеет собственную платформу с интеграцией AI-ассистента, что даёт ему преимущество в технологичности. Наличие AI-ассистента у ProductLab позволяет студентам получать мгновенную обратную связь и поддержку 24/7, что является существенным конкурентным преимуществом.`, color: colors.body })] }),
      
      // Section 4: Conclusion
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Выводы и рекомендации")] }),
      
      new Paragraph({ spacing: { after: 150 },
        children: [new TextRun({ text: "Преимущества ProductStar перед ProductLab:", bold: true, color: colors.green })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "Преподаватели из топовых IT-компаний могут дать более глубокое понимание индустрии и реальные кейсы", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "Более длительный срок обучения позволяет глубже изучить материал и получить больше практического опыта", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Выдаётся диплом о профессиональной переподготовке установленного образца", color: colors.body })] }),
      
      new Paragraph({ spacing: { after: 150 },
        children: [new TextRun({ text: "Преимущества ProductLab перед ProductStar:", bold: true, color: colors.indigo })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "Значительно более доступная цена с возможностью рассрочки", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "Наличие AI-ассистента для мгновенной поддержки в обучении", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "Более короткий срок обучения — можно быстрее получить навыки и начать работу", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Сильное комьюнити и карьерная поддержка", color: colors.body })] }),
      
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "Общий вывод: ", bold: true }), new TextRun({ text: "ProductLab предлагает более доступный по цене, технологичный и короткий курс с сильным комьюнити и AI-поддержкой. ProductStar подходит для тех, кто готов инвестировать больше времени и денег в глубокое погружение с преподавателями из топовых компаний. Выбор зависит от бюджета, доступного времени и личных предпочтений в обучении.", color: colors.body })] }),
    ]
  }]
});

function createTableRow(param: string, val1: string, val2: string) {
  return new TableRow({
    children: [
      new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: param, bold: true, size: 20, color: colors.secondary })] })] }),
      new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val1, size: 20, color: colors.body })] })] }),
      new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val2, size: 20, color: colors.body })] })] })
    ]
  });
}

Packer.toBuffer(doc).then((buffer: Buffer) => {
  fs.writeFileSync("/home/z/my-project/download/Course_Comparison_Report.docx", buffer);
  console.log("Report saved to /home/z/my-project/download/Course_Comparison_Report.docx");
});
