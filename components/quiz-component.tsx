"use client"
import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, Brain, Lightbulb, Target, ArrowRight, RotateCcw, Move, GripVertical } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { EnhancedCard } from "@/components/enhanced-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { cn } from "@/lib/utils"
import type {
  QuizQuestion,
  QCMOptions,
  MatchingOptions,
  MatchingCorrectAnswer,
  OrderingOptions,
  DragAndDropOptions,
  DragAndDropCorrectAnswer,
} from "@/types/quiz-question"

type UserAnswer = string | { [key: string]: string } | string[] | null

interface QuizComponentProps {
  contentId: string
  quizId: string
  onQuizComplete: (score: number) => void
  isTeacherTestMode?: boolean
}

// Fonction pour détecter le contenu arabe - CORRIGÉE COMPLÈTEMENT
function hasArabicContent(questions: QuizQuestion[]): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

  return questions.some((question) => {
    // Vérifier le texte de la question
    if (arabicRegex.test(question.question_text)) {
      return true
    }

    // Vérifier les options selon le type de question - CORRECTION FINALE
    if (question.options) {
      // Pour QCM et True/False - options est un tableau de strings
      if (question.type === "qcm" || question.type === "true_false") {
        if (Array.isArray(question.options)) {
          return (question.options as string[]).some((option: string) => arabicRegex.test(option))
        }
      }

      // Pour Matching - options est un tableau de MatchingOptionPair
      if (question.type === "matching") {
        if (Array.isArray(question.options)) {
          const matchingOptions = question.options as MatchingOptions
          return matchingOptions.some((pair) => arabicRegex.test(pair.left || "") || arabicRegex.test(pair.right || ""))
        }
      }

      // Pour Drag and Drop - options a des propriétés draggables et targets
      if (question.type === "drag_and_drop") {
        const dragDropOptions = question.options as DragAndDropOptions
        if (dragDropOptions.draggables && dragDropOptions.targets) {
          return (
            dragDropOptions.draggables.some((item: string) => arabicRegex.test(item)) ||
            dragDropOptions.targets.some((item: string) => arabicRegex.test(item))
          )
        }
      }

      // Pour Ordering - options est un tableau de strings
      if (question.type === "ordering") {
        if (Array.isArray(question.options)) {
          const orderingOptions = question.options as OrderingOptions
          return orderingOptions.some((item: string) => arabicRegex.test(item))
        }
      }

      // Pour Fill in the blanks - vérifier le texte de la question qui contient les blancs
      if (question.type === "fill_in_the_blanks") {
        // Le contenu arabe sera dans question_text, déjà vérifié ci-dessus
        return false
      }
    }

    return false
  })
}

export function QuizComponent({ contentId, quizId, onQuizComplete, isTeacherTestMode = false }: QuizComponentProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<UserAnswer>(null)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [quizFinished, setQuizFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [continueTimer, setContinueTimer] = useState(5)
  const [canContinue, setCanContinue] = useState(false)

  // Détecter si le quiz contient du contenu arabe
  const isRTL = hasArabicContent(questions)

  // Messages traduits selon la langue détectée
  const messages = {
    loadingQuiz: isRTL ? "جاري تحميل الاختبار..." : "Chargement du quiz...",
    retry: isRTL ? "إعادة المحاولة" : "Réessayer",
    noQuestions: isRTL ? "لم يتم العثور على أسئلة لهذا الاختبار." : "Aucune question trouvée pour ce quiz.",
    question: isRTL ? "سؤال" : "Question",
    of: isRTL ? "من" : "sur",
    currentScore: isRTL ? "النتيجة الحالية" : "Score actuel",
    seconds: isRTL ? "ث" : "s",
    validateAnswer: isRTL ? "تأكيد الإجابة" : "Valider ma réponse",
    nextQuestion: isRTL ? "السؤال التالي" : "Question suivante",
    finishQuiz: isRTL ? "إنهاء الاختبار" : "Terminer le quiz",
    quizCompleted: isRTL ? "تم إكمال الاختبار!" : "Quiz Terminé !",
    successRate: isRTL ? "معدل النجاح" : "de réussite",
    excellentWork: isRTL ? "🎉 عمل ممتاز!" : "🎉 Excellent travail !",
    goodWork: isRTL ? "👍 عمل جيد!" : "👍 Bon travail !",
    keepTrying: isRTL ? "💪 استمر في المحاولة!" : "💪 Continuez vos efforts !",
    teacherTestMode: isRTL ? "وضع اختبار المعلم - لم يتم حفظ النتيجة" : "Mode test enseignant - Score non enregistré",
    takeTimeToSee: isRTL ? "خذ وقتك لرؤية نتيجتك!" : "Prenez le temps de voir votre score !",
    continue: isRTL ? "متابعة" : "Continuer",
    continueIn: isRTL ? "متابعة خلال" : "Continuer dans",
    correctAnswer: isRTL ? "إجابة صحيحة!" : "Bonne réponse !",
    incorrectAnswer: isRTL ? "إجابة خاطئة" : "Réponse incorrecte",
    correctAnswerWas: isRTL ? "الإجابة الصحيحة كانت:" : "La bonne réponse était :",
    yourAnswer: isRTL ? "إجابتك" : "Votre réponse",
    typeHere: isRTL ? "اكتب هنا..." : "Tapez votre réponse ici...",
    selectOption: isRTL ? "اختر..." : "Sélectionner...",
    matchEach: isRTL
      ? "اربط كل عنصر من اليسار بما يناسبه من اليمين:"
      : "Associez chaque élément de gauche avec sa correspondance de droite :",
    orderElements: isRTL
      ? "رتب العناصر التالية في الترتيب الصحيح (اسحب لإعادة الترتيب):"
      : "Classez les éléments suivants dans l'ordre correct (glissez pour réorganiser) :",
    completeText: isRTL ? "أكمل النص بملء الفراغات:" : "Complétez le texte en remplissant les blancs :",
    dragToZone: isRTL
      ? "اربط كل عنصر قابل للسحب بمنطقة الإسقاط الصحيحة:"
      : "Associez chaque élément glissable à sa zone de dépôt correcte :",
    dropIn: isRTL ? "أسقط في..." : "Déposer dans...",
    answer: isRTL ? "إجابة" : "Réponse",
    type: isRTL ? "النوع" : "Type",
  }

  useEffect(() => {
    async function fetchQuizQuestions() {
      setLoading(true)
      const { data, error } = await apiRequest<QuizQuestion[]>(`/api/quizzes/${quizId}/questions/`)

      if (error) {
        console.error("Error fetching quiz questions:", error)
        setError("Impossible de charger le quiz. Veuillez réessayer.")
      } else {
        setQuestions(data || [])
        if (data && data.length > 0) {
          const firstQuestion = data[0]
          initializeAnswerForQuestion(firstQuestion)
          setTimerActive(true)
        }
      }
      setLoading(false)
    }
    fetchQuizQuestions()
  }, [quizId])

  // Timer pour chaque question
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0 && !feedback) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && !feedback) {
      handleSubmitAnswer()
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft, feedback])

  // Timer pour la boîte de dialogue de fin
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quizFinished && continueTimer > 0) {
      interval = setInterval(() => {
        setContinueTimer((prev) => {
          if (prev <= 1) {
            // Auto-continue après 5 secondes
            onQuizComplete(score)
            return 0
          }
          if (prev === 3) {
            // Activer le bouton après 3 secondes
            setCanContinue(true)
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [quizFinished, continueTimer, score, onQuizComplete])

  const initializeAnswerForQuestion = (question: QuizQuestion) => {
    if (question.type === "matching" || question.type === "drag_and_drop") {
      setSelectedAnswer({})
    } else if (question.type === "ordering") {
      setSelectedAnswer([...(question.options as OrderingOptions)])
    } else if (question.type === "fill_in_the_blanks") {
      const blankCount = (question.question_text.match(/\[BLANK\]/g) || []).length
      setSelectedAnswer(Array(blankCount).fill(""))
    } else {
      setSelectedAnswer(null)
    }
  }

  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex]
      initializeAnswerForQuestion(currentQuestion)
      setTimeLeft(30)
      setTimerActive(true)
      setFeedback(null)
      setShowExplanation(false)
    }
  }, [currentQuestionIndex, questions])

  const handleAnswerChange = useCallback(
    (value: UserAnswer, key?: string | number) => {
      setFeedback(null)
      const currentQuestion = questions[currentQuestionIndex]

      if (
        currentQuestion.type === "qcm" ||
        currentQuestion.type === "true_false" ||
        currentQuestion.type === "short_answer"
      ) {
        setSelectedAnswer(value as string)
      } else if (currentQuestion.type === "matching" || currentQuestion.type === "drag_and_drop") {
        setSelectedAnswer((prev: any) => ({
          ...(prev || {}),
          [key as string]: value as string,
        }))
      } else if (currentQuestion.type === "ordering" || currentQuestion.type === "fill_in_the_blanks") {
        setSelectedAnswer((prev: any) => {
          const newArray = [...((prev as string[]) || [])]
          newArray[key as number] = value as string
          return newArray
        })
      }
    },
    [currentQuestionIndex, questions],
  )

  const moveOrderingItem = (fromIndex: number, toIndex: number) => {
    const currentAnswer = selectedAnswer as string[]
    const newAnswer = [...currentAnswer]
    const [movedItem] = newAnswer.splice(fromIndex, 1)
    newAnswer.splice(toIndex, 0, movedItem)
    setSelectedAnswer(newAnswer)
  }

  const handleSubmitAnswer = () => {
    setTimerActive(false)
    if (selectedAnswer === null && timeLeft > 0) return

    const currentQuestion = questions[currentQuestionIndex]
    let isCorrect = false

    switch (currentQuestion.type) {
      case "qcm":
      case "true_false":
      case "short_answer":
        isCorrect = selectedAnswer === (currentQuestion.correct_answer as string)
        break
      case "matching":
      case "drag_and_drop":
        const userMatchingAnswer = selectedAnswer as MatchingCorrectAnswer | DragAndDropCorrectAnswer
        const correctMatchingAnswer = currentQuestion.correct_answer as MatchingCorrectAnswer | DragAndDropCorrectAnswer

        isCorrect =
          Object.keys(correctMatchingAnswer).length === Object.keys(userMatchingAnswer || {}).length &&
          Object.keys(correctMatchingAnswer).every((key) => userMatchingAnswer?.[key] === correctMatchingAnswer[key])
        break
      case "ordering":
      case "fill_in_the_blanks":
        const userArrayAnswer = selectedAnswer as string[]
        const correctArrayAnswer = currentQuestion.correct_answer as string[]

        isCorrect =
          userArrayAnswer?.length === correctArrayAnswer.length &&
          userArrayAnswer.every((val, index) => val === correctArrayAnswer[index])
        break
      default:
        isCorrect = false
    }

    if (isCorrect) {
      setScore(score + 1)
      setFeedback("correct")
    } else {
      setFeedback("incorrect")
    }
    setShowExplanation(true)
  }

  const handleNextQuestion = async () => {
    setSelectedAnswer(null)
    setFeedback(null)
    setShowExplanation(false)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizFinished(true)
      setContinueTimer(5)
      setCanContinue(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text={messages.loadingQuiz} />
      </div>
    )
  }

  if (error) {
    return (
      <EnhancedCard className="max-w-md mx-auto text-center" gradient>
        <div className="py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            {messages.retry}
          </Button>
        </div>
      </EnhancedCard>
    )
  }

  if (questions.length === 0) {
    return (
      <EnhancedCard className="max-w-md mx-auto text-center" gradient>
        <div className="py-8">
          <Brain className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{messages.noQuestions}</p>
        </div>
      </EnhancedCard>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (quizFinished) {
    const percentage = (score / questions.length) * 100
    const isExcellent = percentage >= 80
    const isGood = percentage >= 60

    return (
      <div
        className={cn("max-w-md mx-auto text-center animate-fade-in", isRTL && "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <EnhancedCard gradient>
          <div className="py-8 space-y-6">
            <div className="relative">
              {isExcellent ? (
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              ) : isGood ? (
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                  <Target className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                  <Brain className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            <div className="animate-slide-up-delayed-1">
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                {messages.quizCompleted}
              </h2>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                {score} / {questions.length}
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                {percentage.toFixed(0)}% {messages.successRate}
              </p>
            </div>

            <div className="space-y-2 animate-slide-up-delayed-2">
              {isExcellent && <p className="text-green-600 font-medium">{messages.excellentWork}</p>}
              {isGood && !isExcellent && <p className="text-yellow-600 font-medium">{messages.goodWork}</p>}
              {!isGood && <p className="text-blue-600 font-medium">{messages.keepTrying}</p>}

              {isTeacherTestMode && (
                <p className="text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                  {messages.teacherTestMode}
                </p>
              )}

              <p className="text-sm text-neutral-500">{messages.takeTimeToSee}</p>
            </div>

            <div className="animate-slide-up-delayed-3">
              <Button
                onClick={() => onQuizComplete(score)}
                disabled={!canContinue}
                className={cn(
                  "bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white transform hover:scale-105 transition-all duration-200",
                  !canContinue && "opacity-50 cursor-not-allowed",
                  isRTL && "flex-row-reverse",
                )}
              >
                {canContinue ? messages.continue : `${messages.continueIn} ${continueTimer}s...`}
                <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2 rotate-180" : "ml-2")} />
              </Button>
            </div>
          </div>
        </EnhancedCard>
      </div>
    )
  }

  return (
    <div
      className={cn("max-w-2xl mx-auto space-y-6 animate-fade-in", isRTL && "text-right")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* En-tête avec progression */}
      <div className="space-y-4">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">
                {messages.question} {currentQuestionIndex + 1} {messages.of} {questions.length}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {messages.currentScore} : {score}/{currentQuestionIndex}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors",
              timeLeft <= 10 ? "bg-red-100 text-red-700 animate-pulse" : "bg-primary-100 text-primary-700",
              isRTL && "flex-row-reverse",
            )}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
            {timeLeft}
            {messages.seconds}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <EnhancedCard gradient className="transition-all duration-300">
        <div className="space-y-6">
          <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg mt-1">
              <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {currentQuestion.question_text}
              </h3>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {messages.type}: {currentQuestion.type.replace("_", " ").toUpperCase()}
              </div>
            </div>
          </div>

          {/* Options de réponse avec animations */}
          <div className="space-y-4">
            {/* QCM et Vrai/Faux */}
            {(currentQuestion.type === "qcm" || currentQuestion.type === "true_false") && (
              <RadioGroup
                onValueChange={(value) => handleAnswerChange(value)}
                value={(selectedAnswer as string) || ""}
                className="space-y-3"
              >
                {(currentQuestion.options as QCMOptions).map((option, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950",
                      selectedAnswer === option
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                        : "border-neutral-200 dark:border-neutral-700",
                      "animate-fade-in",
                      isRTL && "flex-row-reverse space-x-reverse",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Réponse courte */}
            {currentQuestion.type === "short_answer" && (
              <div className="space-y-2">
                <Label
                  htmlFor="short-answer-input"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {messages.yourAnswer}
                </Label>
                <Input
                  id="short-answer-input"
                  type="text"
                  value={(selectedAnswer as string) || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={messages.typeHere}
                  className={cn(
                    "text-lg p-4 border-2 focus:border-primary-500 transition-colors",
                    isRTL && "text-right",
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            )}

            {/* Appariement (Matching) */}
            {currentQuestion.type === "matching" && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {messages.matchEach}
                </div>
                {(currentQuestion.options as MatchingOptions).map((pair, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg animate-fade-in",
                      isRTL && "flex-row-reverse",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1 font-medium text-neutral-800 dark:text-neutral-200">{pair.left}</div>
                    <div className={cn("text-neutral-400", isRTL && "rotate-180")}>→</div>
                    <div className="flex-1">
                      <Select
                        value={(selectedAnswer as MatchingCorrectAnswer)?.[pair.left] || ""}
                        onValueChange={(value) => handleAnswerChange(value, pair.left)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={messages.selectOption} />
                        </SelectTrigger>
                        <SelectContent>
                          {(currentQuestion.options as MatchingOptions).map((opt, optIndex) => (
                            <SelectItem key={optIndex} value={opt.right}>
                              {opt.right}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Classement (Ordering) */}
            {currentQuestion.type === "ordering" && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {messages.orderElements}
                </div>
                <div className="space-y-2">
                  {(selectedAnswer as string[])?.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 animate-fade-in",
                        isRTL && "flex-row-reverse",
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <GripVertical className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-medium text-primary-600 bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 font-medium text-neutral-800 dark:text-neutral-200">{item}</div>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveOrderingItem(index, index - 1)}
                            className="h-8 w-8 p-0"
                          >
                            ↑
                          </Button>
                        )}
                        {index < (selectedAnswer as string[]).length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveOrderingItem(index, index + 1)}
                            className="h-8 w-8 p-0"
                          >
                            ↓
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Texte à trous (Fill in the blanks) */}
            {currentQuestion.type === "fill_in_the_blanks" && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {messages.completeText}
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-lg leading-relaxed">
                    {currentQuestion.question_text.split("[BLANK]").map((part, index, array) => (
                      <React.Fragment key={index}>
                        <span className="text-neutral-800 dark:text-neutral-200">{part}</span>
                        {index < array.length - 1 && (
                          <Input
                            className={cn("inline-flex w-32 mx-2 text-center font-medium", isRTL && "text-right")}
                            placeholder={`${messages.answer} ${index + 1}`}
                            value={((selectedAnswer as string[]) || [])[index] || ""}
                            onChange={(e) => handleAnswerChange(e.target.value, index)}
                            dir={isRTL ? "rtl" : "ltr"}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Glisser-Déposer (Drag and Drop) */}
            {currentQuestion.type === "drag_and_drop" && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {messages.dragToZone}
                </div>
                {(currentQuestion.options as DragAndDropOptions).draggables.map((draggableItem, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg animate-fade-in",
                      isRTL && "flex-row-reverse",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Move className="w-4 h-4 text-neutral-400" />
                      <div className="font-medium text-neutral-800 dark:text-neutral-200 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                        {draggableItem}
                      </div>
                    </div>
                    <div className={cn("text-neutral-400", isRTL && "rotate-180")}>→</div>
                    <div className="flex-1">
                      <Select
                        value={(selectedAnswer as DragAndDropCorrectAnswer)?.[draggableItem] || ""}
                        onValueChange={(value) => handleAnswerChange(value, draggableItem)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={messages.dropIn} />
                        </SelectTrigger>
                        <SelectContent>
                          {(currentQuestion.options as DragAndDropOptions).targets.map((targetItem, targetIndex) => (
                            <SelectItem key={targetIndex} value={targetItem}>
                              📍 {targetItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback avec animations */}
          {feedback && showExplanation && (
            <div
              className={cn(
                "p-4 rounded-lg border-l-4 animate-fade-in",
                feedback === "correct"
                  ? "bg-green-50 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200",
                isRTL && "border-r-4 border-l-0",
              )}
            >
              <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse")}>
                {feedback === "correct" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {feedback === "correct" ? messages.correctAnswer : messages.incorrectAnswer}
                </span>
              </div>
              {feedback === "incorrect" && (
                <div className="text-sm">
                  <p className="mb-2">{messages.correctAnswerWas}</p>
                  <div className="font-medium bg-white/50 dark:bg-neutral-800/50 p-2 rounded">
                    {typeof currentQuestion.correct_answer === "string"
                      ? currentQuestion.correct_answer
                      : JSON.stringify(currentQuestion.correct_answer, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </EnhancedCard>

      {/* Boutons d'action */}
      <div className={cn("flex justify-end gap-3", isRTL && "flex-row-reverse justify-start")}>
        {!feedback ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={
              selectedAnswer === null ||
              (Array.isArray(selectedAnswer) && selectedAnswer.some((item) => !item)) ||
              (typeof selectedAnswer === "object" &&
                selectedAnswer !== null &&
                Object.keys(selectedAnswer).length === 0)
            }
            className={cn(
              "bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-2",
              isRTL && "flex-row-reverse",
            )}
          >
            {messages.validateAnswer}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className={cn(
              "bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-2",
              isRTL && "flex-row-reverse",
            )}
          >
            {currentQuestionIndex < questions.length - 1 ? messages.nextQuestion : messages.finishQuiz}
            <ArrowRight className={cn("w-4 h-4", isRTL ? "mr-2 rotate-180" : "ml-2")} />
          </Button>
        )}
      </div>
    </div>
  )
}
