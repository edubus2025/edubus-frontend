"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedCard } from "@/components/enhanced-card"
import { getCurrentUser, apiRequest } from "@/lib/api"
import {
  ArrowLeft,
  Edit,
  Video,
  Music,
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  Volume2,
  Trash2,
  Eye,
  Settings,
  FileText,
  Clock,
  X,
  Info,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/types/quiz-question"

interface ContentItem {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
  created_at: string
  updated_at: string
  quizzes: Array<{
    id: string
    title: string
    description: string
    questions: QuizQuestion[]
  }>
}

export default function ViewContentPage() {
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string

  const [content, setContent] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [activeView, setActiveView] = useState<"details" | "preview" | "quiz">("details")
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      // Vérifier l'utilisateur
      const { data: userData, error: userError } = await getCurrentUser()
      if (userError || !userData || userData.role !== "teacher") {
        router.push("/login")
        return
      }
      setUser(userData)

      // Récupérer le contenu
      const { data: contentData, error: contentError } = await apiRequest<ContentItem>(
        `/api/teacher/content/${contentId}/`,
      )

      if (contentError || !contentData) {
        setError(contentError || "Contenu non trouvé")
      } else {
        console.log("Content data loaded:", contentData)
        setContent(contentData)
      }

      setLoading(false)
    }

    if (contentId) {
      fetchData()
    }
  }, [contentId, router])

  const handleDelete = async () => {
    if (!content || !confirm("Êtes-vous sûr de vouloir supprimer ce contenu ?")) {
      return
    }

    const { error: deleteError } = await apiRequest(`/api/teacher/content/${content.id}/`, "DELETE")

    if (deleteError) {
      setError(deleteError)
    } else {
      router.push("/teacher/manage-content")
    }
  }

  const handleMediaError = (e: any) => {
    console.error("Media error:", e)
    setMediaError("Impossible de charger le fichier média. Vérifiez que l'URL est correcte et accessible.")
  }

  const handleMediaPlay = () => {
    setIsPlaying(true)
  }

  const handleMediaPause = () => {
    setIsPlaying(false)
  }

  // Fonction pour obtenir l'URL YouTube embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`
    }
    return url
  }

  // Fonction pour obtenir l'URL Google Drive pour la lecture (pas le téléchargement)
  const getGoogleDriveStreamUrl = (url: string) => {
    // Format: https://drive.google.com/uc?export=download&id=FILE_ID
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const fileId = url.split("id=")[1]?.split("&")[0]

      if (content?.type === "video") {
        // Pour les vidéos, utiliser l'URL de prévisualisation
        return `https://drive.google.com/file/d/${fileId}/preview`
      } else if (content?.type === "audio") {
        // Pour l'audio, utiliser l'URL de streaming direct
        return `https://docs.google.com/uc?export=open&id=${fileId}`
      }
    }
    return url
  }

  // Fonction pour convertir les URLs Dropbox en URLs directes
  const convertDropboxUrl = (url: string) => {
    // Nouveau format Dropbox (scl/fi)
    if (url.includes("dropbox.com/scl/fi/")) {
      return url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("dl=0", "dl=1")
    }

    // Ancien format Dropbox (s/)
    if (url.includes("dropbox.com/s/")) {
      return url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "").replace("&dl=0", "")
    }

    return url
  }

  // Fonction pour détecter si c'est une URL Dropbox
  const isDropboxUrl = (url: string) => {
    return url.includes("dropbox.com/scl/fi/") || url.includes("dropbox.com/s/")
  }

  // Fonction pour obtenir l'URL audio optimisée
  const getOptimizedAudioUrl = (url: string) => {
    if (isDropboxUrl(url)) {
      return convertDropboxUrl(url)
    }
    return url
  }

  // Fonction pour déterminer le type d'URL
  const getUrlType = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube"
    } else if (url.includes("drive.google.com")) {
      return "google-drive"
    } else if (url.includes("dropbox.com")) {
      return "dropbox"
    } else if (url.includes(".mp4") || url.includes(".webm") || url.includes(".ogg")) {
      return "video-file"
    } else if (url.includes(".mp3") || url.includes(".wav") || url.includes(".ogg")) {
      return "audio-file"
    } else {
      return "other"
    }
  }

  const renderQuestionPreview = (question: QuizQuestion, index: number) => {
    const getCorrectAnswerDisplay = () => {
      try {
        switch (question.type) {
          case "qcm":
          case "true_false":
          case "short_answer":
            return question.correct_answer as string
          case "matching":
            const matchingAnswer = question.correct_answer as { [key: string]: string }
            return Object.entries(matchingAnswer)
              .map(([left, right]) => `${left} → ${right}`)
              .join(", ")
          case "ordering":
            return (question.correct_answer as string[]).join(" → ")
          case "fill_in_the_blanks":
            return (question.correct_answer as string[]).join(", ")
          case "drag_and_drop":
            const ddAnswer = question.correct_answer as { [key: string]: string }
            return Object.entries(ddAnswer)
              .map(([draggable, target]) => `${draggable} → ${target}`)
              .join(", ")
          default:
            return "N/A"
        }
      } catch (error) {
        console.error("Error displaying correct answer:", error)
        return "Erreur d'affichage"
      }
    }

    const getOptionsDisplay = () => {
      try {
        switch (question.type) {
          case "qcm":
          case "true_false":
            return (question.options as string[]).join(", ")
          case "matching":
            const matchingOptions = question.options as { left: string; right: string }[]
            return matchingOptions.map((pair) => `${pair.left} ↔ ${pair.right}`).join(", ")
          case "ordering":
            return (question.options as string[]).join(", ")
          case "fill_in_the_blanks":
            return "Texte à trous"
          case "drag_and_drop":
            const ddOptions = question.options as { draggables: string[]; targets: string[] }
            return `Glissables: ${ddOptions.draggables.join(", ")} | Cibles: ${ddOptions.targets.join(", ")}`
          default:
            return "N/A"
        }
      } catch (error) {
        console.error("Error displaying options:", error)
        return "Erreur d'affichage"
      }
    }

    return (
      <Card key={index} className="border-l-4 border-l-primary-500">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-semibold text-base sm:text-lg">Question {index + 1}</h4>
            <Badge variant="outline" className="capitalize text-xs sm:text-sm w-fit">
              {question.type.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="font-medium text-neutral-700 dark:text-neutral-300 mb-2 text-sm sm:text-base">Question :</h5>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg break-words">
              {question.question_text}
            </p>
          </div>

          {question.type !== "short_answer" && (
            <div>
              <h5 className="font-medium text-neutral-700 dark:text-neutral-300 mb-2 text-sm sm:text-base">
                Options :
              </h5>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg break-words">
                {getOptionsDisplay()}
              </p>
            </div>
          )}

          <div>
            <h5 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Réponse correcte :
            </h5>
            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-lg font-medium break-words">
              {getCorrectAnswerDisplay()}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement du contenu..." />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <X className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Contenu non trouvé</h2>
            <p className="text-sm sm:text-base text-red-600 dark:text-red-400 mb-4">
              {error || "Le contenu demandé n'existe pas ou vous n'avez pas les permissions pour le voir."}
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto bg-transparent">
              <Link href="/teacher/manage-content">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la gestion
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle="Visualisation de contenu" />

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Navigation et actions */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm flex-shrink-0">
                <Link href="/teacher/manage-content">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Retour</span>
                </Link>
              </Button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">
                  Contenu #{content.id}
                </span>
              </div>
            </div>

            {/* Boutons d'onglets - Responsive */}
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={activeView === "details" ? "default" : "outline"}
                onClick={() => setActiveView("details")}
                size="sm"
                className={cn(
                  "flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3",
                  activeView === "details" && "bg-primary-500 text-white",
                )}
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Détails</span>
                <span className="sm:hidden">Info</span>
              </Button>
              <Button
                variant={activeView === "preview" ? "default" : "outline"}
                onClick={() => {
                  setActiveView("preview")
                  setMediaError(null)
                }}
                size="sm"
                className={cn(
                  "flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3",
                  activeView === "preview" && "bg-primary-500 text-white",
                )}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Aperçu</span>
                <span className="sm:hidden">Vue</span>
              </Button>
              {content.quizzes && content.quizzes.length > 0 && (
                <Button
                  variant={activeView === "quiz" ? "default" : "outline"}
                  onClick={() => setActiveView("quiz")}
                  size="sm"
                  className={cn(
                    "flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3",
                    activeView === "quiz" && "bg-primary-500 text-white",
                  )}
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Quiz
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* En-tête du contenu */}
        <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-xs sm:text-sm font-medium shadow-lg">
            {content.type === "video" ? (
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            {content.type === "video" ? "Contenu Vidéo" : "Contenu Audio"}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent px-4 break-words">
            {content.title}
          </h1>
          {content.description && (
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4 break-words">
              {content.description}
            </p>
          )}
        </div>

        {activeView === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Informations générales */}
              <EnhancedCard className="animate-fade-in animation-delay-100" gradient>
                <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    Informations Générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-neutral-600 dark:text-neutral-400">Créé le :</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {new Date(content.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-neutral-600 dark:text-neutral-400">Modifié le :</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {new Date(content.updated_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-neutral-600 dark:text-neutral-400">Type :</span>
                    <Badge variant="outline" className="text-xs">
                      {content.type === "video" ? "Vidéo" : "Audio"}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-600 dark:text-neutral-400 flex-shrink-0">URL :</span>
                    <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded break-all min-w-0">
                      {content.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-neutral-600 dark:text-neutral-400">Type détecté :</span>
                    <Badge variant="outline" className="capitalize text-xs">
                      {getUrlType(content.url)}
                    </Badge>
                  </div>
                  {isDropboxUrl(content.url) && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Info className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-600 dark:text-neutral-400 flex-shrink-0">URL optimisée :</span>
                      <span className="font-mono text-xs bg-green-50 dark:bg-green-950 px-2 py-1 rounded break-all min-w-0 text-green-700 dark:text-green-300">
                        {getOptimizedAudioUrl(content.url)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </EnhancedCard>

              {/* Actions rapides */}
              <EnhancedCard className="animate-fade-in animation-delay-200" hover>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm sm:text-base"
                  >
                    <Link href={`/teacher/edit-content/${content.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier ce contenu
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full bg-transparent text-sm sm:text-base">
                    <Link href="/teacher/manage-content">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour à la gestion
                    </Link>
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} className="w-full text-sm sm:text-base">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer ce contenu
                  </Button>
                </CardContent>
              </EnhancedCard>
            </div>

            {/* Sidebar avec informations */}
            <div className="space-y-4 sm:space-y-6">
              {/* Niveaux */}
              <EnhancedCard className="animate-fade-in animation-delay-300" hover>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Niveaux Ciblés</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {content.levels?.map((level) => (
                      <Badge key={level} variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </EnhancedCard>

              {/* Matières */}
              <EnhancedCard className="animate-fade-in animation-delay-400" hover>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Matières</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {content.subjects?.map((subject) => (
                      <Badge
                        key={subject}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </EnhancedCard>

              {/* Informations quiz */}
              <EnhancedCard className="animate-fade-in animation-delay-500" hover>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Quiz Associé</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-neutral-500">Quiz créés</p>
                      <p className="font-medium text-sm sm:text-base">{content.quizzes?.length || 0}</p>
                    </div>
                  </div>
                  {content.quizzes && content.quizzes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs sm:text-sm text-neutral-500 mb-2">Questions totales</p>
                      <p className="font-medium text-sm sm:text-base">{content.quizzes[0].questions?.length || 0}</p>
                    </div>
                  )}
                </CardContent>
              </EnhancedCard>
            </div>
          </div>
        )}

        {activeView === "preview" && (
          <div className="animate-fade-in">
            {/* Lecteur de contenu */}
            <EnhancedCard className="animate-fade-in animation-delay-100" gradient>
              <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    {content.type === "video" ? (
                      <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="text-sm sm:text-base">Aperçu du Contenu</span>
                  </div>
                  {isPlaying && (
                    <div className="flex items-center gap-1 text-white/80">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs sm:text-sm">En lecture</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {mediaError && (
                  <div className="mb-4 p-3 sm:p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-2 text-orange-700 dark:text-orange-300">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-sm sm:text-base">Erreur de lecture</span>
                        <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 mt-1">{mediaError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {content.type === "video" ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      {content.url.includes("youtube.com") || content.url.includes("youtu.be") ? (
                        <iframe
                          src={getYouTubeEmbedUrl(content.url)}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title={content.title}
                        />
                      ) : content.url.includes("drive.google.com") ? (
                        <iframe
                          src={getGoogleDriveStreamUrl(content.url)}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title={content.title}
                        />
                      ) : content.url.includes(".mp4") ||
                        content.url.includes(".webm") ||
                        content.url.includes(".ogg") ? (
                        <video
                          ref={videoRef}
                          className="w-full h-full"
                          controls
                          onPlay={handleMediaPlay}
                          onPause={handleMediaPause}
                          onError={handleMediaError}
                          preload="metadata"
                          crossOrigin="anonymous"
                        >
                          <source src={content.url} type="video/mp4" />
                          <source src={content.url} type="video/webm" />
                          <source src={content.url} type="video/ogg" />
                          Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                      ) : (
                        <iframe
                          src={content.url}
                          className="w-full h-full"
                          allowFullScreen
                          title={content.title}
                          onError={handleMediaError}
                        />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500 space-y-1">
                      <p className="break-all">URL: {content.url}</p>
                      <p>
                        Type détecté:{" "}
                        {content.url.includes("youtube.com") || content.url.includes("youtu.be")
                          ? "YouTube"
                          : content.url.includes("drive.google.com")
                            ? "Google Drive"
                            : content.url.includes("dropbox.com")
                              ? "Dropbox"
                              : content.url.includes(".mp4") ||
                                  content.url.includes(".webm") ||
                                  content.url.includes(".ogg")
                                ? "Fichier vidéo"
                                : "Iframe générique"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 sm:p-8 rounded-lg">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                      <Volume2 className="w-8 h-8 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-400" />
                    </div>

                    {/* Gestion spéciale pour Google Drive Audio */}
                    {content.url.includes("drive.google.com") ? (
                      <div className="bg-white dark:bg-purple-800 p-3 sm:p-4 rounded-lg">
                        <iframe
                          src={`https://drive.google.com/file/d/${content.url.split("id=")[1]?.split("&")[0]}/preview`}
                          className="w-full h-32 sm:h-48 border-0 rounded"
                          title={content.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-purple-800 p-3 sm:p-4 rounded-lg">
                        <audio
                          ref={audioRef}
                          controls
                          className="w-full"
                          onPlay={handleMediaPlay}
                          onPause={handleMediaPause}
                          onError={handleMediaError}
                          preload="metadata"
                          crossOrigin="anonymous"
                        >
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/mpeg" />
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/wav" />
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/ogg" />
                          Votre navigateur ne supporte pas la balise audio.
                        </audio>
                      </div>
                    )}

                    <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-4 text-center space-y-1">
                      <p className="break-all">URL originale: {content.url}</p>
                      {isDropboxUrl(content.url) && (
                        <p className="break-all text-green-600 dark:text-green-400">
                          URL optimisée: {getOptimizedAudioUrl(content.url)}
                        </p>
                      )}
                      <p>
                        Si l'audio ne se charge pas, vérifiez que l'URL est accessible et que le format est supporté.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </EnhancedCard>
          </div>
        )}

        {activeView === "quiz" && (
          <div className="animate-fade-in">
            {/* Questions du quiz */}
            <EnhancedCard className="animate-fade-in animation-delay-200">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Questions du Quiz ({content.quizzes?.[0]?.questions?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {!content.quizzes ||
                content.quizzes.length === 0 ||
                !content.quizzes[0] ||
                !content.quizzes[0].questions ||
                content.quizzes[0].questions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-neutral-500">
                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-neutral-300" />
                    <p className="text-sm sm:text-base">Aucune question de quiz associée à ce contenu.</p>
                    <div className="mt-4 text-xs sm:text-sm space-y-2">
                      <p>Debug info:</p>
                      <p>Quizzes: {content.quizzes?.length || 0}</p>
                      <p>Questions: {content.quizzes?.[0]?.questions?.length || 0}</p>

                      {content.quizzes && content.quizzes.length > 0 && (
                        <div className="mt-4 p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <p className="font-medium mb-2 text-xs sm:text-sm">Données du quiz :</p>
                          <pre className="text-xs text-left overflow-auto max-h-32 sm:max-h-40">
                            {JSON.stringify(content.quizzes[0], null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {content.quizzes[0].questions.map((question: QuizQuestion, index: number) => {
                      // Vérification de sécurité pour éviter l'erreur
                      if (!question || !question.question_text) {
                        return (
                          <Card key={index} className="border-l-4 border-l-red-500">
                            <CardContent className="p-3 sm:p-4">
                              <p className="text-red-500 text-sm sm:text-base">
                                Question {index + 1}: Données manquantes
                              </p>
                              <pre className="text-xs mt-2 bg-red-50 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(question, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                        )
                      }
                      return renderQuestionPreview(question, index)
                    })}
                  </div>
                )}
              </CardContent>
            </EnhancedCard>
          </div>
        )}
      </main>
    </div>
  )
}
