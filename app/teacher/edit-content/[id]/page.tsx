"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { apiRequest, getCurrentUser } from "@/lib/api"
import { Textarea } from "@/components/ui/textarea"
import { useParams } from "next/navigation"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
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

interface ContentItem {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
  quizzes: { id: string; title: string }[]
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
  "soft-skills",
]

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("")
  const [url, setUrl] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setPageLoading(true)
      try {
        const { data: userData, error: userError } = await getCurrentUser()

        if (userError || !userData || userData.role !== "teacher") {
          router.push("/login")
          return
        }
        setUser(userData)

        const { data: contentData, error: contentError } = await apiRequest<ContentItem>(
          `/api/teacher/content/${contentId}/`,
        )

        if (contentError) {
          console.error("Error fetching content:", contentError)
          setError("Impossible de charger le contenu. Veuillez réessayer.")
          return
        }

        setTitle(contentData?.title || "")
        setDescription(contentData?.description || "")
        setType(contentData?.type || "")
        setUrl(contentData?.url || "")
        setSelectedLevels(contentData?.levels || [])
        setSelectedSubjects(contentData?.subjects || [])

        if (contentData?.quizzes && contentData.quizzes.length > 0) {
          const firstQuizId = contentData.quizzes[0].id
          setQuizId(firstQuizId)
          const { data: questionsData, error: questionsError } = await apiRequest<QuizQuestion[]>(
            `/api/quizzes/${firstQuizId}/questions/`,
          )

          if (questionsError) {
            console.error("Error fetching quiz questions:", questionsError)
            setError("Impossible de charger les questions du quiz. Veuillez réessayer.")
          } else {
            setQuizQuestions(questionsData || [])
          }
        } else {
          setQuizQuestions([])
        }
      } catch (e: any) {
        console.error("Unexpected error during initial data fetch:", e)
        setError(e.message || "Une erreur inattendue est survenue lors du chargement.")
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [contentId, router])

  const handleLevelChange = (level: string) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects((prev) => (prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]))
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...quizQuestions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
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
    // Update correct_answer dynamically for matching
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (
      !title.trim() ||
      !type.trim() ||
      !url.trim() ||
      selectedLevels.length === 0 ||
      selectedSubjects.length === 0 ||
      quizQuestions.length === 0 ||
      quizQuestions.some(
        (q) => !q.question_text.trim() || (q.type === "qcm" && !(q.options as QCMOptions).every((opt) => opt.trim())),
      )
    ) {
      setError("Tous les champs obligatoires (y compris les questions de quiz) doivent être remplis.")
      setLoading(false)
      return
    }

    try {
      const { error: contentUpdateError } = await apiRequest(`/api/teacher/content/${contentId}/`, "PATCH", {
        title,
        description,
        type,
        url,
        levels: selectedLevels,
        subjects: selectedSubjects,
      })

      if (contentUpdateError) {
        console.error("Error updating content:", contentUpdateError)
        setError(contentUpdateError)
        return
      }

      if (quizId && quizQuestions.length > 0) {
        for (const q of quizQuestions) {
          if (q.id) {
            const { error: questionUpdateError } = await apiRequest(`/api/questions/${q.id}/`, "PATCH", {
              question_text: q.question_text,
              type: q.type,
              options: q.options,
              correct_answer: q.correct_answer,
            })
            if (questionUpdateError) {
              console.error(`Error updating question ${q.id}:`, questionUpdateError)
              setError(`Erreur lors de la mise à jour d'une question : ${questionUpdateError}`)
              return
            }
          }
        }
      }

      setSuccess("Contenu et quiz mis à jour avec succès !")
      setTimeout(() => {
        router.push("/teacher/manage-content")
      }, 2000)
    } catch (e: any) {
      console.error("Unexpected error during form submission:", e)
      setError(e.message || "Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement de la page d'édition..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle="Modification de contenu" />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm">
            <Link href="/teacher/manage-content">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Modification du contenu</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            Modifier le Contenu
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Mettez à jour les informations de votre contenu éducatif
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-fade-in">
            {success}
          </div>
        )}

        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Détails du Contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre du Contenu</Label>
                <Input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type de Contenu</Label>
                <Select name="type" required value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL du Fichier (Audio/Vidéo)</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://example.com/content.mp4"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Niveaux Scolaires Ciblés</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {schoolLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={() => handleLevelChange(level)}
                      />
                      <Label htmlFor={`level-${level}`}>{level}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Matières/Domaines d'apprentissage</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => handleSubjectChange(subject)}
                      />
                      <Label htmlFor={`subject-${subject}`}>{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Questions du Quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quizQuestions.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucun quiz associé à ce contenu ou aucune question trouvée.
                    </p>
                  ) : (
                    quizQuestions.map((q, qIndex) => (
                      <div key={q.id || qIndex} className="border p-4 rounded-md space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>
                            Question {qIndex + 1} ({q.type})
                          </Label>
                        </div>
                        <Input
                          placeholder="Texte de la question"
                          value={q.question_text}
                          onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                          required
                        />

                        {/* Rendu conditionnel des champs d'options et de réponse correcte */}
                        {q.type === "qcm" && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              {(q.options as QCMOptions).map((option, oIndex) => (
                                <Input
                                  key={oIndex}
                                  placeholder={`Option ${oIndex + 1}`}
                                  value={option}
                                  onChange={(e) => handleQCMOptionChange(qIndex, oIndex, e.target.value)}
                                  required
                                />
                              ))}
                            </div>
                            <div className="grid gap-2">
                              <Label>Bonne Réponse</Label>
                              <Select
                                value={q.correct_answer as QCMCorrectAnswer}
                                onValueChange={(value) => handleQuestionChange(qIndex, "correct_answer", value)}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner la bonne réponse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(q.options as QCMOptions)
                                    .filter((opt) => opt.trim())
                                    .map((option, optIndex) => (
                                      <SelectItem key={optIndex} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {q.type === "true_false" && (
                          <div className="grid gap-2">
                            <Label>Bonne Réponse</Label>
                            <Select
                              value={q.correct_answer as string}
                              onValueChange={(value) => handleQuestionChange(qIndex, "correct_answer", value)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la bonne réponse" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Vrai">Vrai</SelectItem>
                                <SelectItem value="Faux">Faux</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {q.type === "short_answer" && (
                          <div className="grid gap-2">
                            <Label>Bonne Réponse</Label>
                            <Input
                              placeholder="Réponse courte attendue"
                              value={q.correct_answer as string}
                              onChange={(e) => handleQuestionChange(qIndex, "correct_answer", e.target.value)}
                              required
                            />
                          </div>
                        )}

                        {q.type === "matching" && (
                          <>
                            <Label>Paires d'Appariement (Gauche - Droite)</Label>
                            {(q.options as MatchingOptions).map((pair, pairIndex) => (
                              <div key={pairIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder="Élément gauche"
                                  value={pair.left}
                                  onChange={(e) => handleMatchingChange(qIndex, pairIndex, "left", e.target.value)}
                                  required
                                />
                                <Input
                                  placeholder="Correspondance droite"
                                  value={pair.right}
                                  onChange={(e) => handleMatchingChange(qIndex, pairIndex, "right", e.target.value)}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMatchingPair(qIndex, pairIndex)}
                                  disabled={(q.options as MatchingOptions).length <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addMatchingPair(qIndex)}>
                              Ajouter une paire
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                              La bonne réponse est automatiquement générée à partir des paires.
                            </p>
                          </>
                        )}

                        {q.type === "ordering" && (
                          <>
                            <Label>Éléments à Classer (Ordre Arbitraire)</Label>
                            {(q.options as OrderingOptions).map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Élément ${itemIndex + 1}`}
                                  value={item}
                                  onChange={(e) => handleOrderingChange(qIndex, itemIndex, e.target.value)}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOrderingItem(qIndex, itemIndex)}
                                  disabled={(q.options as OrderingOptions).length <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addOrderingItem(qIndex)}>
                              Ajouter un élément
                            </Button>
                            <Label className="mt-4">Ordre Correct des Éléments</Label>
                            {(q.correct_answer as OrderingCorrectAnswer).map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Position ${itemIndex + 1}`}
                                  value={item}
                                  onChange={(e) => handleOrderingCorrectAnswerChange(qIndex, itemIndex, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                            <p className="text-sm text-gray-500 mt-2">
                              Assurez-vous que les éléments de l'ordre correct correspondent aux éléments à classer.
                            </p>
                          </>
                        )}

                        {q.type === "fill_in_the_blanks" && (
                          <>
                            <Label>Texte avec Trous (Utilisez [BLANK] pour chaque trou)</Label>
                            <Textarea
                              placeholder="Ex: Le [BLANK] de la France est Paris."
                              value={q.question_text}
                              onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                              required
                            />
                            <Label className="mt-4">Réponses pour les Trous (dans l'ordre)</Label>
                            {(q.correct_answer as FillInTheBlanksCorrectAnswer).map((answer, blankIndex) => (
                              <div key={blankIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Réponse pour le trou ${blankIndex + 1}`}
                                  value={answer}
                                  onChange={(e) =>
                                    handleFillInTheBlanksCorrectAnswerChange(qIndex, blankIndex, e.target.value)
                                  }
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFillInTheBlank(qIndex, blankIndex)}
                                  disabled={(q.correct_answer as FillInTheBlanksCorrectAnswer).length <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addFillInTheBlank(qIndex)}>
                              Ajouter un trou
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                              Le nombre de réponses doit correspondre au nombre de [BLANK] dans le texte.
                            </p>
                          </>
                        )}

                        {q.type === "drag_and_drop" && (
                          <>
                            <Label>Éléments à Glisser</Label>
                            {(q.options as DragAndDropOptions).draggables.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Élément glissable ${itemIndex + 1}`}
                                  value={item}
                                  onChange={(e) =>
                                    handleDragAndDropChange(qIndex, "draggables", itemIndex, e.target.value)
                                  }
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDragAndDropItem(qIndex, "draggables", itemIndex)}
                                  disabled={(q.options as DragAndDropOptions).draggables.length <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addDragAndDropItem(qIndex, "draggables")}
                            >
                              Ajouter un élément glissable
                            </Button>

                            <Label className="mt-4">Zones de Dépôt (Cibles)</Label>
                            {(q.options as DragAndDropOptions).targets.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`Zone de dépôt ${itemIndex + 1}`}
                                  value={item}
                                  onChange={(e) =>
                                    handleDragAndDropChange(qIndex, "targets", itemIndex, e.target.value)
                                  }
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDragAndDropItem(qIndex, "targets", itemIndex)}
                                  disabled={(q.options as DragAndDropOptions).targets.length <= 1}
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addDragAndDropItem(qIndex, "targets")}
                            >
                              Ajouter une zone de dépôt
                            </Button>

                            <Label className="mt-4">Correspondances Correctes (Glisser-Déposer)</Label>
                            {(q.options as DragAndDropOptions).draggables.map((draggableItem, draggableIndex) => (
                              <div key={draggableIndex} className="flex gap-2 items-center">
                                <Label className="w-1/2">{draggableItem}</Label>
                                <Select
                                  value={(q.correct_answer as DragAndDropCorrectAnswer)[draggableItem] || ""}
                                  onValueChange={(value) =>
                                    handleDragAndDropCorrectAnswerChange(qIndex, draggableItem, value)
                                  }
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Associer à..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(q.options as DragAndDropOptions).targets
                                      .filter((target) => target.trim())
                                      .map((targetItem, targetIndex) => (
                                        <SelectItem key={targetIndex} value={targetItem}>
                                          {targetItem}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            <p className="text-sm text-gray-500 mt-2">
                              Associez chaque élément glissable à sa zone de dépôt correcte.
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Mise à jour en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Mettre à jour
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
