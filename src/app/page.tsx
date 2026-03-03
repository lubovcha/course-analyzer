'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface CourseData {
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
}

interface Comparison {
  priceComparison: string;
  durationComparison: string;
  platformComparison: string;
  strengthsVsProductLab: string[];
  weaknessesVsProductLab: string[];
  overallVerdict: string;
}

interface AnalysisResult {
  url: string;
  success: boolean;
  error?: string;
  data?: CourseData;
  comparison?: Comparison;
}

export default function CourseAnalyzerPage() {
  const [mode, setMode] = useState<'url' | 'text'>('url')
  const [urls, setUrls] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [contentName, setContentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [activeTab, setActiveTab] = useState('0')
  const [error, setError] = useState('')

  const parseUrls = (input: string): string[] => {
    // Split by newlines, tabs, and multiple spaces
    const parts = input.split(/[\n\t]+/)
    
    // Extract URLs from each part
    const urlList: string[] = []
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
    
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.startsWith('http')) {
        // Direct URL
        urlList.push(trimmed)
      } else {
        // Try to extract URLs from the text
        const matches = trimmed.match(urlRegex)
        if (matches) {
          urlList.push(...matches.map(m => m.trim()))
        }
      }
    }
    
    // Remove duplicates and validate
    return [...new Set(urlList)].filter(url => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })
  }

  const analyzeUrls = async () => {
    if (mode === 'url') {
      const urlList = parseUrls(urls)
      
      if (urlList.length === 0) {
        setError('Введите хотя бы один корректный URL (начинается с http:// или https://)')
        return
      }

      setLoading(true)
      setError('')
      setResults([])

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: urlList })
        })

        const data = await response.json()

        if (data.success) {
          setResults(data.results)
          setActiveTab('0')
        } else {
          setError(data.error || 'Ошибка анализа')
        }
      } catch (err) {
        setError('Ошибка соединения с сервером')
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      // Text mode
      if (!rawContent.trim()) {
        setError('Вставьте текст страницы курса')
        return
      }

      setLoading(true)
      setError('')
      setResults([])

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawContent, urls: [contentName || 'Курс'] })
        })

        const data = await response.json()

        if (data.success) {
          setResults(data.results.map((r: AnalysisResult) => ({
            ...r,
            url: contentName || r.url
          })))
          setActiveTab('0')
        } else {
          setError(data.error || 'Ошибка анализа')
        }
      } catch (err) {
        setError('Ошибка соединения с сервером')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const exportResults = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `course-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-indigo-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Анализатор курсов
                </h1>
                <p className="text-sm text-slate-500">Автоматический анализ и сравнение с Product Lab</p>
              </div>
            </div>
            {results.length > 0 && (
              <Button onClick={exportResults} variant="outline" className="border-indigo-200 text-indigo-600">
                Экспорт JSON
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="mb-8 border-0 shadow-xl shadow-indigo-500/5 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Введите данные для анализа</CardTitle>
                <CardDescription>
                  Вставьте URL-адреса или текст страницы курса для автоматического анализа
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={mode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('url')}
                  className={mode === 'url' ? 'bg-indigo-600' : ''}
                >
                  По URL
                </Button>
                <Button 
                  variant={mode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('text')}
                  className={mode === 'text' ? 'bg-indigo-600' : ''}
                >
                  По тексту
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'url' ? (
              <>
                <Textarea
                  placeholder="Вставьте URL курсов (можно в любом формате):&#10;&#10;https://course1.com&#10;https://course2.com&#10;&#10;или через табы/пробелы:&#10;https://course1.com       https://course2.com     https://course3.com"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={5}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
                {urls.trim() && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 mb-2">
                      Найдено URL: {parseUrls(urls).length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parseUrls(urls).slice(0, 10).map((url, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-600 truncate max-w-[200px]">
                          {url.replace('https://', '').replace('http://', '').split('/')[0]}
                        </span>
                      ))}
                      {parseUrls(urls).length > 10 && (
                        <span className="text-xs text-slate-500">+ ещё {parseUrls(urls).length - 10}</span>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  💡 Вставьте URL-адреса курсов в любом формате (через перенос строки, табы или пробелы). 
                  Если страница не читается, используйте режим &quot;По тексту&quot;.
                </p>
              </>
            ) : (
              <>
                <Input
                  placeholder="Название курса (для отображения)"
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
                <Textarea
                  placeholder="Вставьте сюда текст со страницы курса (Ctrl+A, Ctrl+C на странице курса, затем Ctrl+V сюда)..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  rows={10}
                  className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
                <p className="text-xs text-slate-400">
                  💡 Откройте страницу курса, нажмите Ctrl+A (выделить всё), Ctrl+C (копировать), 
                  затем вставьте сюда Ctrl+V. AI проанализирует текст и извлечёт данные.
                </p>
              </>
            )}
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <Button 
              onClick={analyzeUrls} 
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Анализирую...
                </span>
              ) : (
                'Запустить AI-анализ'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-2xl border border-indigo-100/50">
                {results.map((result, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl"
                  >
                    {result.success ? (result.data?.courseName?.substring(0, 20) || `Курс ${index + 1}`) : `Ошибка ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {results.map((result, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-6 mt-6">
                  {!result.success ? (
                    <Card className="border-red-200 bg-red-50/50">
                      <CardContent className="pt-6">
                        <p className="text-red-600 font-medium">❌ Ошибка анализа</p>
                        <p className="text-sm text-slate-600 mt-2">{result.error}</p>
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-800">💡 Рекомендация:</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Попробуйте переключиться в режим &quot;По тексту&quot; и вставить содержимое страницы вручную:
                          </p>
                          <ol className="text-sm text-amber-700 mt-2 list-decimal list-inside space-y-1">
                            <li>Откройте страницу курса в браузере</li>
                            <li>Нажмите Ctrl+A (выделить всё)</li>
                            <li>Нажмите Ctrl+C (копировать)</li>
                            <li>Вернитесь сюда и нажмите Ctrl+V</li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100/50 shadow-lg shadow-indigo-500/5">
                          <div className="text-sm text-slate-500 mb-1">Цена</div>
                          <div className="text-xl font-bold text-indigo-600">{result.data?.totalPrice || '—'}</div>
                          <div className="text-xs text-slate-400">{result.data?.pricePerMonth && `${result.data.pricePerMonth}/мес`}</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-100/50 shadow-lg shadow-purple-500/5">
                          <div className="text-sm text-slate-500 mb-1">Длительность</div>
                          <div className="text-xl font-bold text-purple-600">{result.data?.duration || '—'}</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-teal-100/50 shadow-lg shadow-teal-500/5">
                          <div className="text-sm text-slate-500 mb-1">AI</div>
                          <div className="text-xl font-bold text-teal-600">{result.data?.hasAI ? 'Да' : 'Нет'}</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/50 shadow-lg shadow-amber-500/5">
                          <div className="text-sm text-slate-500 mb-1">Рассрочка</div>
                          <div className="text-xl font-bold text-amber-600">{result.data?.installment ? 'Да' : 'Нет'}</div>
                        </div>
                      </div>

                      {/* Main Analysis */}
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Course Data */}
                        <Card className="border-0 shadow-xl shadow-indigo-500/5 bg-white/80 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle>{result.data?.courseName}</CardTitle>
                            <CardDescription>{result.data?.basicInfo}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <Field label="УТП" value={result.data?.utp} />
                              <Field label="Целевая аудитория" value={result.data?.targetAudience} />
                              <Field label="Дата старта" value={result.data?.startDate} />
                              <Field label="Тарифы" value={result.data?.tariffs} />
                              <Field label="Содержание тарифов" value={result.data?.tariffContent} />
                              <Field label="Платформа" value={result.data?.platform} />
                              <Field label="Лицензия" value={result.data?.license} />
                              <Field label="Документ об окончании" value={result.data?.completionDocument} />
                              <Field label="Формат обучения" value={result.data?.training} />
                              <Field label="Программа" value={result.data?.program} />
                              <Field label="Как проходят занятия" value={result.data?.howClassesWork} />
                              <Field label="Проверка ДЗ" value={result.data?.homeworkChecker} />
                              <Field label="Преподаватели" value={result.data?.teachers} />
                              <Field label="Коммуникация" value={result.data?.teacherCommunication} />
                              <Field label="Бонусы" value={result.data?.bonuses} />
                              <Field label="Партнёрка" value={result.data?.partner} />
                              <Field label="Акции" value={result.data?.promotions} />
                              <Field label="Лид-магниты" value={result.data?.additionalProducts} />
                              <Field label="Точка входа" value={result.data?.entryPoint} />
                              <Field label="Первое впечатление" value={result.data?.firstImpression} />
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                              <div>
                                <h4 className="font-medium text-green-600 mb-2">✅ Сильные стороны</h4>
                                <ul className="text-sm space-y-1">
                                  {result.data?.strengths?.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-green-500">•</span>
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-red-600 mb-2">❌ Слабые стороны</h4>
                                <ul className="text-sm space-y-1">
                                  {result.data?.weaknesses?.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-red-500">•</span>
                                      {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Comparison with Product Lab */}
                        <Card className="border-0 shadow-xl shadow-purple-500/5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                VS Product Lab
                              </Badge>
                            </div>
                            <CardTitle>Сравнение с Product Lab</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Field label="💰 Сравнение цен" value={result.comparison?.priceComparison} />
                            <Field label="⏱️ Сравнение длительности" value={result.comparison?.durationComparison} />
                            <Field label="🖥️ Сравнение платформ" value={result.comparison?.platformComparison} />
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium text-green-600 mb-2">🚀 Преимущества перед Product Lab</h4>
                              <ul className="text-sm space-y-1">
                                {result.comparison?.strengthsVsProductLab?.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-500">+</span>
                                    {s}
                                  </li>
                                ))}
                                {(!result.comparison?.strengthsVsProductLab || result.comparison.strengthsVsProductLab.length === 0) && (
                                  <li className="text-slate-400">Не выявлено</li>
                                )}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-amber-600 mb-2">⚠️ Отставание от Product Lab</h4>
                              <ul className="text-sm space-y-1">
                                {result.comparison?.weaknessesVsProductLab?.map((w, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-500">−</span>
                                    {w}
                                  </li>
                                ))}
                                {(!result.comparison?.weaknessesVsProductLab || result.comparison.weaknessesVsProductLab.length === 0) && (
                                  <li className="text-slate-400">Не выявлено</li>
                                )}
                              </ul>
                            </div>

                            <Separator />

                            <div className="bg-white/50 rounded-xl p-4">
                              <h4 className="font-medium mb-2">📋 Общий вывод</h4>
                              <p className="text-sm text-slate-600">{result.comparison?.overallVerdict}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Product Lab Reference */}
        {results.length > 0 && (
          <Card className="mt-8 border-0 shadow-xl shadow-indigo-500/5 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-indigo-100 text-indigo-700">Референс</Badge>
                Product Lab
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Цена:</span>
                  <span className="ml-2 font-medium">от 60 000 ₽ (от 15 000 ₽/мес)</span>
                </div>
                <div>
                  <span className="text-slate-500">Длительность:</span>
                  <span className="ml-2 font-medium">4 месяца</span>
                </div>
                <div>
                  <span className="text-slate-500">Платформа:</span>
                  <span className="ml-2 font-medium">Собственная</span>
                </div>
                <div>
                  <span className="text-slate-500">AI:</span>
                  <span className="ml-2 font-medium text-green-600">Да</span>
                </div>
                <div>
                  <span className="text-slate-500">Рассрочка:</span>
                  <span className="ml-2 font-medium text-green-600">Да</span>
                </div>
                <div>
                  <span className="text-slate-500">Лицензия:</span>
                  <span className="ml-2 font-medium">Да</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'Не указано' || value === 'null' || value === 'undefined') return null
  
  return (
    <div>
      <span className="text-sm text-slate-500">{label}:</span>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}
