'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

interface AnalysisResult {
  productLab: CourseData | null;
  competitor: CourseData | null;
  comparison: Comparison | null;
}

const STEPS = [
  { id: 'productlab', label: 'Анализ ProductLab', icon: '🔍' },
  { id: 'competitor', label: 'Анализ конкурента', icon: '📊' },
  { id: 'compare', label: 'Сравнение', icon: '⚡' },
]

export default function CourseAnalyzerPage() {
  const [productLabUrl, setProductLabUrl] = useState('')
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null)

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http')
    } catch {
      return false
    }
  }

  const analyzeCourses = async () => {
    if (!productLabUrl.trim() || !competitorUrl.trim()) {
      setError('Введите оба URL-адреса')
      return
    }

    if (!isValidUrl(productLabUrl)) {
      setError('Некорректный URL ProductLab')
      return
    }

    if (!isValidUrl(competitorUrl)) {
      setError('Некорректный URL конкурента')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCurrentStep(0)

    try {
      // Step 1: Analyze ProductLab
      setCurrentStep(0)
      const step1Res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, productLabUrl: productLabUrl.trim() })
      })
      const step1Data = await step1Res.json()
      if (!step1Data.success) throw new Error(step1Data.error || 'Ошибка анализа ProductLab')

      // Step 2: Analyze Competitor
      setCurrentStep(1)
      const step2Res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, competitorUrl: competitorUrl.trim() })
      })
      const step2Data = await step2Res.json()
      if (!step2Data.success) throw new Error(step2Data.error || 'Ошибка анализа конкурента')

      // Step 3: Compare
      setCurrentStep(2)
      const step3Res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step: 3, 
          productLabData: step1Data.productLab,
          competitorUrl: competitorUrl.trim()
        })
      })
      const step3Data = await step3Res.json()
      if (!step3Data.success) throw new Error(step3Data.error || 'Ошибка сравнения')

      setResult({
        productLab: step1Data.productLab,
        competitor: step3Data.competitor,
        comparison: step3Data.comparison
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка соединения')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!result) return
    setExporting('pdf')
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format: 'pdf', 
          results: [{
            url: competitorUrl,
            success: true,
            data: result.competitor,
            comparison: result.comparison
          }]
        })
      })
      const data = await response.json()
      if (data.success) {
        window.open(`/api/download?file=${encodeURIComponent(data.filename)}`, '_blank')
      } else {
        setError(data.error || 'Ошибка генерации PDF')
      }
    } catch (err) {
      setError('Ошибка экспорта PDF')
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  const exportToPPTX = async () => {
    if (!result) return
    setExporting('pptx')
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format: 'pptx', 
          results: [{
            url: competitorUrl,
            success: true,
            data: result.competitor,
            comparison: result.comparison
          }]
        })
      })
      const data = await response.json()
      if (data.success) {
        window.open(`/api/download?file=${encodeURIComponent(data.filename)}`, '_blank')
      } else {
        setError(data.error || 'Ошибка генерации PPTX')
      }
    } catch (err) {
      setError('Ошибка экспорта PPTX')
      console.error(err)
    } finally {
      setExporting(null)
    }
  }

  const exportJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `course-comparison-${new Date().toISOString().split('T')[0]}.json`
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
                <p className="text-sm text-slate-500">Сравнение курсов с ProductLab</p>
              </div>
            </div>
            {result && (
              <div className="flex gap-2">
                <Button onClick={exportToPDF} disabled={exporting !== null} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  {exporting === 'pdf' ? '...' : 'PDF'}
                </Button>
                <Button onClick={exportToPPTX} disabled={exporting !== null} variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  {exporting === 'pptx' ? '...' : 'PPTX'}
                </Button>
                <Button onClick={exportJSON} variant="outline" className="border-indigo-200 text-indigo-600">
                  JSON
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="mb-8 border-0 shadow-xl shadow-indigo-500/5 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Сравнение курсов</CardTitle>
            <CardDescription>
              Вставьте ссылку на курс ProductLab (эталон) и ссылку на курс конкурента
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ProductLab URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                Курс ProductLab (эталон)
              </label>
              <Input
                placeholder="https://productlab.ru/product_manager"
                value={productLabUrl}
                onChange={(e) => setProductLabUrl(e.target.value)}
                className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            {/* Competitor URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                Курс конкурента
              </label>
              <Input
                placeholder="https://competitor.ru/course/product-manager"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>

            {/* Progress */}
            {loading && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                  {STEPS.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        i < currentStep ? 'bg-green-500 text-white' :
                        i === currentStep ? 'bg-indigo-500 text-white animate-pulse' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {i < currentStep ? '✓' : step.icon}
                      </div>
                      <span className={`text-sm hidden sm:inline ${
                        i <= currentStep ? 'text-indigo-700 font-medium' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-indigo-600 mt-2 text-center">
                  {currentStep === 0 && '🔍 Анализирую страницу ProductLab...'}
                  {currentStep === 1 && '📊 Анализирую страницу конкурента...'}
                  {currentStep === 2 && '⚡ Сравниваю курсы...'}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button 
              onClick={analyzeCourses} 
              disabled={loading || !productLabUrl.trim() || !competitorUrl.trim()}
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
                'Запустить сравнение'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Quick Stats Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100/50 shadow-lg">
                <div className="text-xs text-slate-500 mb-1">Цена</div>
                <div className="text-lg font-bold text-indigo-600">{result.productLab?.totalPrice || '—'}</div>
                <div className="text-xs text-slate-400">ProductLab</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-100/50 shadow-lg">
                <div className="text-xs text-slate-500 mb-1">Цена</div>
                <div className="text-lg font-bold text-purple-600">{result.competitor?.totalPrice || '—'}</div>
                <div className="text-xs text-slate-400">Конкурент</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-teal-100/50 shadow-lg">
                <div className="text-xs text-slate-500 mb-1">Длительность</div>
                <div className="text-lg font-bold text-teal-600">{result.productLab?.duration || '—'}</div>
                <div className="text-xs text-slate-400">ProductLab</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/50 shadow-lg">
                <div className="text-xs text-slate-500 mb-1">Длительность</div>
                <div className="text-lg font-bold text-amber-600">{result.competitor?.duration || '—'}</div>
                <div className="text-xs text-slate-400">Конкурент</div>
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* ProductLab */}
              <Card className="border-0 shadow-xl shadow-indigo-500/5 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700">Эталон</Badge>
                  </div>
                  <CardTitle className="text-indigo-700">{result.productLab?.courseName || 'ProductLab'}</CardTitle>
                  <CardDescription>{result.productLab?.basicInfo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Цена" value={result.productLab?.totalPrice} />
                  <Field label="В месяц" value={result.productLab?.pricePerMonth} />
                  <Field label="Длительность" value={result.productLab?.duration} />
                  <Field label="Старт" value={result.productLab?.startDate} />
                  <Field label="Платформа" value={result.productLab?.platform} />
                  <Field label="AI-ассистент" value={result.productLab?.hasAI ? 'Да' : 'Нет'} />
                  <Field label="Рассрочка" value={result.productLab?.installment ? 'Да' : 'Нет'} />
                  <Field label="Программа" value={result.productLab?.program} />
                  <Field label="Преподаватели" value={result.productLab?.teachers} />
                  
                  {result.productLab?.strengths && result.productLab.strengths.length > 0 && (
                    <div className="pt-3">
                      <h4 className="font-medium text-green-600 mb-2 text-sm">Сильные стороны</h4>
                      <ul className="text-sm space-y-1">
                        {result.productLab.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Competitor */}
              <Card className="border-0 shadow-xl shadow-purple-500/5 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700">Конкурент</Badge>
                  </div>
                  <CardTitle className="text-purple-700">{result.competitor?.courseName || 'Курс конкурента'}</CardTitle>
                  <CardDescription>{result.competitor?.basicInfo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Цена" value={result.competitor?.totalPrice} />
                  <Field label="В месяц" value={result.competitor?.pricePerMonth} />
                  <Field label="Длительность" value={result.competitor?.duration} />
                  <Field label="Старт" value={result.competitor?.startDate} />
                  <Field label="Платформа" value={result.competitor?.platform} />
                  <Field label="AI-ассистент" value={result.competitor?.hasAI ? 'Да' : 'Нет'} />
                  <Field label="Рассрочка" value={result.competitor?.installment ? 'Да' : 'Нет'} />
                  <Field label="Программа" value={result.competitor?.program} />
                  <Field label="Преподаватели" value={result.competitor?.teachers} />
                  
                  {result.competitor?.strengths && result.competitor.strengths.length > 0 && (
                    <div className="pt-3">
                      <h4 className="font-medium text-green-600 mb-2 text-sm">Сильные стороны</h4>
                      <ul className="text-sm space-y-1">
                        {result.competitor.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.competitor?.weaknesses && result.competitor.weaknesses.length > 0 && (
                    <div className="pt-3">
                      <h4 className="font-medium text-red-600 mb-2 text-sm">Слабые стороны</h4>
                      <ul className="text-sm space-y-1">
                        {result.competitor.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500">−</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comparison Analysis */}
            {result.comparison && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      VS Сравнение
                    </Badge>
                  </div>
                  <CardTitle>Анализ различий</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="💰 Сравнение цен" value={result.comparison.priceComparison} />
                  <Field label="⏱️ Сравнение длительности" value={result.comparison.durationComparison} />
                  <Field label="🖥️ Сравнение платформ" value={result.comparison.platformComparison} />
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">
                      🚀 Преимущества конкурента перед ProductLab
                    </h4>
                    {result.comparison.strengthsVsProductLab && result.comparison.strengthsVsProductLab.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {result.comparison.strengthsVsProductLab.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-sm">Не выявлено</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-amber-600 mb-2">
                      ⚠️ Недостатки конкурента перед ProductLab
                    </h4>
                    {result.comparison.weaknessesVsProductLab && result.comparison.weaknessesVsProductLab.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {result.comparison.weaknessesVsProductLab.map((w, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500">−</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-sm">Не выявлено</p>
                    )}
                  </div>

                  <Separator />

                  <div className="bg-white/70 rounded-xl p-4">
                    <h4 className="font-medium mb-2">📋 Общий вывод</h4>
                    <p className="text-sm text-slate-600">{result.comparison.overallVerdict}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'Не указано' || value === 'null' || value === 'undefined' || value === '') return null
  
  return (
    <div>
      <span className="text-xs text-slate-500">{label}:</span>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}
