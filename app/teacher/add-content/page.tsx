"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, Video, Music, FileText, CheckCircle, ArrowLeft, Minus, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiRequest, getCurrentUser } from "@/lib/api"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedCard } from "@/components/enhanced-card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type {
  QuizQuestion,
  QCMOptions,
  QCMCorrectAnswer,
  MatchingOptions,
  MatchingCorrectAnswer,
  OrderingOptions,
  OrderingCorrectAnswer,
  FillInTheBlanksCorrectAnswer,
  DragAndDropOptions,
  DragAndDropCorrectAnswer,
} from "@/types/quiz-question"

interface ContentResponse {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
}

const schoolLevels = [
  "1ère année collégial",
  "2ème année collégial",
  "3ème année collégial",
  "Tronc commun",
  "1ère année bac",
  "2ème année bac",
]

const subjects = [
  "Arabe",
  "Français",
  "Anglais",
  "Histoire-Géographie",
  "Philosophie",
  "Orientation scolaire et professionnelle",
  "Soft-skills",
]

const QUESTION_TYPES = [
  { value: "qcm", label: "QCM (Choix Multiple)" },
  { value: "true_false", label: "Vrai/Faux" },
  { value: "short_answer", label: "Réponse Courte" },
  { value: "matching", label: "Appariement (Correspondance)" },
  { value: "ordering", label: "Classement (Ordre Spécifique)" },
  { value: "fill_in_the_blanks", label: "Texte à Trous" },
  { value: "drag_and_drop", label: "Glisser-Déposer (Simple)" },
]

// Structure de base pour une nouvelle question
const getInitialQuestion = (type: QuizQuestion["type"] = "qcm"): QuizQuestion => {
  switch (type) {
    case "qcm":
      return {
        question_text: "",
        type: "qcm",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "",
      }
    case "true_false":
      return { question_text: "", type: "true_false", options: ["Vrai", "Faux"], correct_answer: "Vrai" }
    case "short_answer":
      return { question_text: "", type: "short_answer", options: [], correct_answer: "" }
    case "matching":
      return {
        question_text: "",
        type: "matching",
        options: [{ left: "", right: "" }],
        correct_answer: {},
      }
    case "ordering":
      return { question_text: "", type: "ordering", options: ["", "", ""], correct_answer: ["", "", ""] }
    case "fill_in_the_blanks":
      return { question_text: "", type: "fill_in_the_blanks", options: [], correct_answer: [""] }
    case "drag_and_drop":
      return {
        question_text: "",
        type: "drag_and_drop",
        options: { draggables: ["", ""], targets: ["", ""] },
        correct_answer: {},
      }
    default:
      return {
        question_text: "",
        type: "qcm",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "",
      }
  }
}

export default function AddContentPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contentType, setContentType] = useState<"video" | "audio" | "">("")
  const [url, setUrl] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkUserRole() {
      const { data: userData, error: userError } = await getCurrentUser()

      if (userError || !userData || userData.role !== "teacher") {
        router.push("/login")
      } else {
        setUser(userData)
      }
      setPageLoading(false)
    }
    checkUserRole()
  }, [router])

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setSelectedLevels([...selectedLevels, level])
    } else {
      setSelectedLevels(selectedLevels.filter((l) => l !== level))
    }
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subject])
    } else {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))
    }
  }

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, getInitialQuestion("qcm")])
  }

  const removeQuestion = (index: number) => {
    const newQuestions = quizQuestions.filter((_, i) => i !== index)
    setQuizQuestions(newQuestions)
  }

  const handleQuestionTypeChange = (qIndex: number, newType: QuizQuestion["type"]) => {
    const newQuestions = [...quizQuestions]
    newQuestions[qIndex] = getInitialQuestion(newType)
    setQuizQuestions(newQuestions)
  }

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const newQuestions = [...quizQuestions]
    newQuestions[qIndex].question_text = value
    setQuizQuestions(newQuestions)
  }

  const handleQCMOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...quizQuestions]
    const options = newQuestions[qIndex].options as QCMOptions
    options[oIndex] = value
    setQuizQuestions(newQuestions)
  }

  const handleMatchingChange = (qIndex: number, pairIndex: number, field: "left" | "right", value: string) => {
    const newQuestions = [...quizQuestions]
    const options = newQuestions[qIndex].options as MatchingOptions
    options[pairIndex][field] = value
    const newCorrectAnswer: MatchingCorrectAnswer = {}
    options.forEach((pair) => {
      if (pair.left.trim() && pair.right.trim()) {
        newCorrectAnswer[pair.left] = pair.right
      }
    })
    newQuestions[qIndex].correct_answer = newCorrectAnswer
    setQuizQuestions(newQuestions)
  }

  const addMatchingPair = (qIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].options as MatchingOptions).push({ left: "", right: "" })
    setQuizQuestions(newQuestions)
  }

  const removeMatchingPair = (qIndex: number, pairIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].options as MatchingOptions).splice(pairIndex, 1)
    setQuizQuestions(newQuestions)
  }

  const handleOrderingChange = (qIndex: number, itemIndex: number, value: string) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].options as OrderingOptions)[itemIndex] = value
    setQuizQuestions(newQuestions)
  }

  const handleOrderingCorrectAnswerChange = (qIndex: number, itemIndex: number, value: string) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].correct_answer as OrderingCorrectAnswer)[itemIndex] = value
    setQuizQuestions(newQuestions)
  }

  const addOrderingItem = (qIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].options as OrderingOptions).push("")
    ;(newQuestions[qIndex].correct_answer as OrderingCorrectAnswer).push("")
    setQuizQuestions(newQuestions)
  }

  const removeOrderingItem = (qIndex: number, itemIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].options as OrderingOptions).splice(itemIndex, 1)
    ;(newQuestions[qIndex].correct_answer as OrderingCorrectAnswer).splice(itemIndex, 1)
    setQuizQuestions(newQuestions)
  }

  const handleFillInTheBlanksCorrectAnswerChange = (qIndex: number, blankIndex: number, value: string) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].correct_answer as FillInTheBlanksCorrectAnswer)[blankIndex] = value
    setQuizQuestions(newQuestions)
  }

  const addFillInTheBlank = (qIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].correct_answer as FillInTheBlanksCorrectAnswer).push("")
    setQuizQuestions(newQuestions)
  }

  const removeFillInTheBlank = (qIndex: number, blankIndex: number) => {
    const newQuestions = [...quizQuestions]
    ;(newQuestions[qIndex].correct_answer as FillInTheBlanksCorrectAnswer).splice(blankIndex, 1)
    setQuizQuestions(newQuestions)
  }

  const handleDragAndDropChange = (
    qIndex: number,
    listType: "draggables" | "targets",
    itemIndex: number,
    value: string,
  ) => {
    const newQuestions = [...quizQuestions]
    const options = newQuestions[qIndex].options as DragAndDropOptions
    options[listType][itemIndex] = value
    setQuizQuestions(newQuestions)
  }

  const addDragAndDropItem = (qIndex: number, listType: "draggables" | "targets") => {
    const newQuestions = [...quizQuestions]
    const options = newQuestions[qIndex].options as DragAndDropOptions
    options[listType].push("")
    setQuizQuestions(newQuestions)
  }

  const removeDragAndDropItem = (qIndex: number, listType: "draggables" | "targets", itemIndex: number) => {
    const newQuestions = [...quizQuestions]
    const options = newQuestions[qIndex].options as DragAndDropOptions
    options[listType].splice(itemIndex, 1)
    setQuizQuestions(newQuestions)
  }

  const handleDragAndDropCorrectAnswerChange = (qIndex: number, draggable: string, target: string) => {
    const newQuestions = [...quizQuestions]
    const correctAnswer = newQuestions[qIndex].correct_answer as DragAndDropCorrectAnswer
    correctAnswer[draggable] = target
    setQuizQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation des champs obligatoires
      if (
        !title.trim() ||
        !contentType ||
        !url.trim() ||
        selectedLevels.length === 0 ||
        selectedSubjects.length === 0
      ) {
        throw new Error("Veuillez remplir tous les champs obligatoires du contenu.")
      }

      // Créer le contenu
      const contentData = {
        title,
        description,
        type: contentType,
        url,
        levels: selectedLevels,
        subjects: selectedSubjects,
      }

      const { data: content, error: contentError } = await apiRequest<ContentResponse>(
        "/api/teacher/content/",
        "POST",
        contentData,
      )

      if (contentError) {
        throw new Error(contentError)
      }

      if (!content) {
        throw new Error("Erreur lors de la création du contenu")
      }

      // Créer le quiz si des questions existent
      if (quizQuestions.length > 0) {
        // Validation des questions
        for (const question of quizQuestions) {
          if (!question.question_text.trim()) {
            throw new Error("Toutes les questions doivent avoir un texte.")
          }

          // Validation spécifique selon le type de question
          switch (question.type) {
            case "qcm":
              const qcmOptions = question.options as QCMOptions
              if (!qcmOptions.every((opt) => opt.trim()) || !(question.correct_answer as string).trim()) {
                throw new Error(
                  "Toutes les options QCM doivent être remplies et une réponse correcte doit être sélectionnée.",
                )
              }
              break
            case "true_false":
              if (!question.correct_answer) {
                throw new Error("Une réponse correcte doit être sélectionnée pour les questions Vrai/Faux.")
              }
              break
            case "short_answer":
              if (!(question.correct_answer as string).trim()) {
                throw new Error("Une réponse correcte doit être fournie pour les questions à réponse courte.")
              }
              break
            case "matching":
              const matchingOptions = question.options as MatchingOptions
              if (matchingOptions.length === 0 || matchingOptions.some((p) => !p.left.trim() || !p.right.trim())) {
                throw new Error("Toutes les paires d'appariement doivent être complètes.")
              }
              break
            case "ordering":
              const orderingOptions = question.options as OrderingOptions
              const orderingCorrect = question.correct_answer as OrderingCorrectAnswer
              if (
                orderingOptions.length === 0 ||
                orderingOptions.some((item) => !item.trim()) ||
                orderingCorrect.some((item) => !item.trim())
              ) {
                throw new Error("Tous les éléments de classement doivent être remplis.")
              }
              break
            case "fill_in_the_blanks":
              const blanksCorrect = question.correct_answer as FillInTheBlanksCorrectAnswer
              if (!question.question_text.includes("[BLANK]") || blanksCorrect.some((ans) => !ans.trim())) {
                throw new Error(
                  "Les questions à trous doivent contenir [BLANK] et toutes les réponses doivent être remplies.",
                )
              }
              break
            case "drag_and_drop":
              const ddOptions = question.options as DragAndDropOptions
              if (ddOptions.draggables.some((item) => !item.trim()) || ddOptions.targets.some((item) => !item.trim())) {
                throw new Error("Tous les éléments glissables et zones de dépôt doivent être remplis.")
              }
              break
          }
        }

        const { error: quizError } = await apiRequest(
          `/api/teacher/content/${content.id}/add_quiz_and_questions/`,
          "POST",
          {
            quiz: {
              title: `Quiz pour "${title}"`,
              description: `Questions pour le contenu "${title}"`,
            },
            questions: quizQuestions.map((q) => ({
              question_text: q.question_text,
              type: q.type,
              options: q.options,
              correct_answer: q.correct_answer,
            })),
          },
        )

        if (quizError) {
          throw new Error(`Erreur lors de la création du quiz: ${quizError}`)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/teacher/manage-content")
      }, 2000)
    } catch (error: any) {
      console.error("Erreur lors de la création:", error)
      setError(error.message || "Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement de la page d'ajout de contenu..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Contenu créé avec succès !
            </h2>
            <p className="text-sm sm:text-base text-green-600 dark:text-green-400">
              Redirection vers la gestion des contenus...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle="Créez du contenu éducatif de qualité" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in">
          <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm w-full sm:w-auto">
            <Link href="/teacher/manage-content">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">Nouveau contenu</span>
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Ajouter un Nouveau Contenu
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 px-2">
            Créez des leçons interactives avec quiz pour vos élèves
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm sm:text-base">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Informations de base */}
          <EnhancedCard>
            <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">
                    Titre du contenu *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Introduction à la philosophie"
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm sm:text-base">
                    Type de contenu *
                  </Label>
                  <Select value={contentType} onValueChange={(value: "video" | "audio") => setContentType(value)}>
                    <SelectTrigger className="h-10 sm:h-12">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-sm sm:text-base">Vidéo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-sm sm:text-base">Audio</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le contenu de votre leçon..."
                  rows={3}
                  className="text-sm sm:text-base resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm sm:text-base">
                  URL du contenu *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... ou lien direct vers fichier"
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base break-all"
                />
                <p className="text-xs sm:text-sm text-neutral-500">
                  Supports: YouTube, liens directs vers fichiers MP4/MP3, etc.
                </p>
              </div>
            </CardContent>
          </EnhancedCard>

          {/* Niveaux et matières */}
          <EnhancedCard>
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Niveaux et Matières</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-base">Niveaux scolaires *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {schoolLevels.map((level) => (
                    <div
                      key={level}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => handleLevelChange(level, checked as boolean)}
                        className="flex-shrink-0"
                      />
                      <Label htmlFor={`level-${level}`} className="text-xs sm:text-sm leading-tight cursor-pointer">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedLevels.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {selectedLevels.map((level) => (
                      <Badge key={level} variant="secondary" className="text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-base">Matières *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
                        className="flex-shrink-0"
                      />
                      <Label htmlFor={`subject-${subject}`} className="text-xs sm:text-sm leading-tight cursor-pointer">
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </EnhancedCard>

          {/* Questions du quiz */}
          <EnhancedCard>
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-lg sm:text-xl">Questions du Quiz (Optionnel)</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addQuestion}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full sm:w-auto"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Ajouter une question
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {quizQuestions.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-neutral-500">
                  <p className="text-sm sm:text-base">
                    Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {quizQuestions.map((question, qIndex) => (
                    <Card key={qIndex} className="border-2 border-neutral-200 dark:border-neutral-700">
                      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm sm:text-base">Question {qIndex + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Type de question</Label>
                            <Select
                              value={question.type}
                              onValueChange={(value: QuizQuestion["type"]) => handleQuestionTypeChange(qIndex, value)}
                            >
                              <SelectTrigger className="h-10 sm:h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUESTION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <span className="text-sm sm:text-base">{type.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base">Question *</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                            placeholder={
                              question.type === "fill_in_the_blanks"
                                ? "Ex: La capitale de la France est [BLANK]."
                                : "Tapez votre question ici..."
                            }
                            required
                            rows={2}
                            className="text-sm sm:text-base resize-none"
                          />
                        </div>

                        {/* Rendu conditionnel selon le type de question */}
                        {question.type === "qcm" && (
                          <div className="space-y-3 sm:space-y-4">
                            <Label className="text-sm sm:text-base">Options de réponse</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                              {(question.options as QCMOptions).map((option, oIndex) => (
                                <Input
                                  key={oIndex}
                                  value={option}
                                  onChange={(e) => handleQCMOptionChange(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                  required
                                  className="h-10 sm:h-12 text-sm sm:text-base"
                                />
                              ))}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm sm:text-base">Réponse correcte *</Label>
                              <Select
                                value={question.correct_answer as QCMCorrectAnswer}
                                onValueChange={(value) => {
                                  const newQuestions = [...quizQuestions]
                                  newQuestions[qIndex].correct_answer = value
                                  setQuizQuestions(newQuestions)
                                }}
                              >
                                <SelectTrigger className="h-10 sm:h-12">
                                  <SelectValue placeholder="Sélectionner la bonne réponse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(question.options as QCMOptions)
                                    .filter((opt) => opt.trim())
                                    .map((option, optIndex) => (
                                      <SelectItem key={optIndex} value={option}>
                                        <span className="text-sm sm:text-base">{option}</span>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {question.type === "true_false" && (
                          <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Réponse correcte *</Label>
                            <Select
                              value={question.correct_answer as string}
                              onValueChange={(value) => {
                                const newQuestions = [...quizQuestions]
                                newQuestions[qIndex].correct_answer = value
                                setQuizQuestions(newQuestions)
                              }}
                            >
                              <SelectTrigger className="h-10 sm:h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Vrai">Vrai</SelectItem>
                                <SelectItem value="Faux">Faux</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {question.type === "short_answer" && (
                          <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Réponse attendue *</Label>
                            <Input
                              value={question.correct_answer as string}
                              onChange={(e) => {
                                const newQuestions = [...quizQuestions]
                                newQuestions[qIndex].correct_answer = e.target.value
                                setQuizQuestions(newQuestions)
                              }}
                              placeholder="Réponse courte attendue"
                              required
                              className="h-10 sm:h-12 text-sm sm:text-base"
                            />
                          </div>
                        )}

                        {question.type === "matching" && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <Label className="text-sm sm:text-base">Paires d'appariement</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addMatchingPair(qIndex)}
                                className="w-full sm:w-auto"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            {(question.options as MatchingOptions).map((pair, pairIndex) => (
                              <div
                                key={pairIndex}
                                className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                              >
                                <Input
                                  value={pair.left}
                                  onChange={(e) => handleMatchingChange(qIndex, pairIndex, "left", e.target.value)}
                                  placeholder="Élément gauche"
                                  required
                                  className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                />
                                <span className="text-neutral-400 text-center sm:px-2">↔</span>
                                <Input
                                  value={pair.right}
                                  onChange={(e) => handleMatchingChange(qIndex, pairIndex, "right", e.target.value)}
                                  placeholder="Correspondance droite"
                                  required
                                  className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMatchingPair(qIndex, pairIndex)}
                                  disabled={(question.options as MatchingOptions).length <= 1}
                                  className="text-red-500 hover:text-red-700 w-full sm:w-auto"
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "ordering" && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <Label className="text-sm sm:text-base">Éléments à classer</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOrderingItem(qIndex)}
                                className="w-full sm:w-auto"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs sm:text-sm">Éléments (ordre arbitraire)</Label>
                                {(question.options as OrderingOptions).map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex gap-2 items-center">
                                    <Input
                                      value={item}
                                      onChange={(e) => handleOrderingChange(qIndex, itemIndex, e.target.value)}
                                      placeholder={`Élément ${itemIndex + 1}`}
                                      required
                                      className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOrderingItem(qIndex, itemIndex)}
                                      disabled={(question.options as OrderingOptions).length <= 1}
                                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs sm:text-sm">Ordre correct</Label>
                                {(question.correct_answer as OrderingCorrectAnswer).map((item, itemIndex) => (
                                  <Input
                                    key={itemIndex}
                                    value={item}
                                    onChange={(e) =>
                                      handleOrderingCorrectAnswerChange(qIndex, itemIndex, e.target.value)
                                    }
                                    placeholder={`Position ${itemIndex + 1}`}
                                    required
                                    className="h-10 sm:h-12 text-sm sm:text-base"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {question.type === "fill_in_the_blanks" && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <Label className="text-sm sm:text-base">Réponses pour les trous</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addFillInTheBlank(qIndex)}
                                className="w-full sm:w-auto"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            {(question.correct_answer as FillInTheBlanksCorrectAnswer).map((answer, blankIndex) => (
                              <div key={blankIndex} className="flex gap-2 items-center">
                                <Input
                                  value={answer}
                                  onChange={(e) =>
                                    handleFillInTheBlanksCorrectAnswerChange(qIndex, blankIndex, e.target.value)
                                  }
                                  placeholder={`Réponse pour le trou ${blankIndex + 1}`}
                                  required
                                  className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFillInTheBlank(qIndex, blankIndex)}
                                  disabled={(question.correct_answer as FillInTheBlanksCorrectAnswer).length <= 1}
                                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            ))}
                            <p className="text-xs sm:text-sm text-neutral-500">
                              Utilisez [BLANK] dans le texte de la question pour chaque trou.
                            </p>
                          </div>
                        )}

                        {question.type === "drag_and_drop" && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <Label className="text-xs sm:text-sm">Éléments glissables</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addDragAndDropItem(qIndex, "draggables")}
                                    className="w-full sm:w-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                {(question.options as DragAndDropOptions).draggables.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex gap-2 items-center">
                                    <Input
                                      value={item}
                                      onChange={(e) =>
                                        handleDragAndDropChange(qIndex, "draggables", itemIndex, e.target.value)
                                      }
                                      placeholder={`Élément ${itemIndex + 1}`}
                                      required
                                      className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeDragAndDropItem(qIndex, "draggables", itemIndex)}
                                      disabled={(question.options as DragAndDropOptions).draggables.length <= 1}
                                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <Label className="text-xs sm:text-sm">Zones de dépôt</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addDragAndDropItem(qIndex, "targets")}
                                    className="w-full sm:w-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                {(question.options as DragAndDropOptions).targets.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex gap-2 items-center">
                                    <Input
                                      value={item}
                                      onChange={(e) =>
                                        handleDragAndDropChange(qIndex, "targets", itemIndex, e.target.value)
                                      }
                                      placeholder={`Zone ${itemIndex + 1}`}
                                      required
                                      className="h-10 sm:h-12 text-sm sm:text-base flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeDragAndDropItem(qIndex, "targets", itemIndex)}
                                      disabled={(question.options as DragAndDropOptions).targets.length <= 1}
                                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm">Correspondances correctes</Label>
                              {(question.options as DragAndDropOptions).draggables.map(
                                (draggableItem, draggableIndex) => (
                                  <div
                                    key={draggableIndex}
                                    className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                                  >
                                    <span className="w-full sm:w-1/3 text-xs sm:text-sm font-medium p-2 bg-neutral-50 dark:bg-neutral-800 rounded truncate">
                                      {draggableItem || `Élément ${draggableIndex + 1}`}
                                    </span>
                                    <span className="text-neutral-400 text-center sm:px-2">→</span>
                                    <Select
                                      value={(question.correct_answer as DragAndDropCorrectAnswer)[draggableItem] || ""}
                                      onValueChange={(value) =>
                                        handleDragAndDropCorrectAnswerChange(qIndex, draggableItem, value)
                                      }
                                    >
                                      <SelectTrigger className="flex-1 h-10 sm:h-12">
                                        <SelectValue placeholder="Associer à..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(question.options as DragAndDropOptions).targets
                                          .filter((target) => target.trim())
                                          .map((targetItem, targetIndex) => (
                                            <SelectItem key={targetIndex} value={targetItem}>
                                              <span className="text-sm sm:text-base">{targetItem}</span>
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </EnhancedCard>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 sm:px-8 py-3",
                "hover:from-primary-600 hover:to-secondary-600 transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2",
              )}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Créer le contenu
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
