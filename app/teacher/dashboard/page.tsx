"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EnhancedCard } from "@/components/enhanced-card"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getCurrentUser, apiRequest } from "@/lib/api"
import { Plus, BookOpen, Users, BarChart3, TrendingUp, Award, Clock, Edit, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStats {
  totalContents: number
  totalStudents: number
  totalQuizzes: number
  averageScore: number
  recentActivity: ProgressItem[]
}

interface ContentItem {
  id: number
  title: string
  quizzes: any[]
}

interface ProgressItem {
  id: number
  score: number
  user?: {
    id: string
    username: string
    email: string
  }
  student_name?: string
  content?: {
    id: string
    title: string
  }
  content_title?: string
  completed_at?: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalContents: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    averageScore: 0,
    recentActivity: [],
  })

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError(null)

      try {
        // Vérifier l'utilisateur
        const { data: userData, error: userError } = await getCurrentUser()

        if (userError || !userData || userData.role !== "teacher") {
          router.push("/login")
          return
        }
        setUser(userData)

        console.log("🔍 Récupération des données du tableau de bord...")

        // Récupérer les données avec gestion d'erreurs individuelles
        const contentsResponse = await apiRequest("/api/teacher/content/")
        const progressResponse = await apiRequest("/api/progress/")

        console.log("📊 Réponse contenus:", contentsResponse)
        console.log("📈 Réponse progression:", progressResponse)

        // Traitement sécurisé des contenus
        let contentsData: ContentItem[] = []
        if (contentsResponse.data && Array.isArray(contentsResponse.data)) {
          contentsData = contentsResponse.data
        } else if (contentsResponse.data && typeof contentsResponse.data === "object") {
          // Si l'API retourne un objet au lieu d'un tableau, essayer de l'extraire
          contentsData = Object.values(contentsResponse.data).filter(
            (item) => item && typeof item === "object" && "id" in item,
          ) as ContentItem[]
        }

        console.log("📚 Contenus traités:", contentsData)

        const totalContents = contentsData.length

        // Calcul du nombre total de quiz
        const totalQuizzes = contentsData.reduce((acc: number, content: ContentItem) => {
          return acc + (content.quizzes && Array.isArray(content.quizzes) ? content.quizzes.length : 0)
        }, 0)

        // Traitement sécurisé des données de progression
        let progressData: ProgressItem[] = []
        if (progressResponse.data && Array.isArray(progressResponse.data)) {
          progressData = progressResponse.data
        } else if (progressResponse.data && typeof progressResponse.data === "object") {
          progressData = Object.values(progressResponse.data).filter(
            (item) => item && typeof item === "object" && "score" in item,
          ) as ProgressItem[]
        }

        console.log("📊 Progression traitée:", progressData)
        console.log("👥 Structure des données de progression:", progressData[0])

        // Calcul du score moyen
        const averageScore =
          progressData.length > 0
            ? progressData.reduce((acc: number, p: ProgressItem) => acc + (p.score || 0), 0) / progressData.length
            : 0

        // CORRECTION: Calcul correct du nombre d'étudiants uniques
        const uniqueStudentIds = new Set<string>()
        const uniqueStudentNames = new Set<string>()

        progressData.forEach((p) => {
          // Essayer d'abord avec la structure user.id
          if (p.user?.id) {
            uniqueStudentIds.add(p.user.id)
          }
          // Essayer avec user.username
          if (p.user?.username) {
            uniqueStudentNames.add(p.user.username)
          }
          // Fallback avec student_name si elle existe
          if (p.student_name) {
            uniqueStudentNames.add(p.student_name)
          }
        })

        // Prendre le maximum entre les deux méthodes de comptage
        const totalStudents = Math.max(uniqueStudentIds.size, uniqueStudentNames.size)

        console.log("👥 Étudiants uniques par ID:", uniqueStudentIds.size)
        console.log("👥 Étudiants uniques par nom:", uniqueStudentNames.size)
        console.log("👥 Total étudiants calculé:", totalStudents)

        // Activité récente (derniers 5 résultats) avec noms d'étudiants corrects
        const recentActivity = progressData
          .sort((a, b) => new Date(b.completed_at || "").getTime() - new Date(a.completed_at || "").getTime())
          .slice(0, 5)
          .map((activity) => ({
            ...activity,
            // Normaliser le nom de l'étudiant
            student_name: activity.user?.username || activity.student_name || "Étudiant anonyme",
            // Normaliser le titre du contenu
            content_title: activity.content?.title || activity.content_title || "Contenu inconnu",
          }))

        const finalStats = {
          totalContents,
          totalStudents,
          totalQuizzes,
          averageScore,
          recentActivity,
        }

        console.log("📈 Statistiques finales:", finalStats)

        setStats(finalStats)
      } catch (err) {
        console.error("❌ Erreur lors du chargement du tableau de bord:", err)
        setError("Impossible de charger les données du tableau de bord. Veuillez réessayer.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement de votre tableau de bord..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <EnhancedCard className="max-w-md text-center" gradient>
          <div className="py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Réessayer
            </Button>
          </div>
        </EnhancedCard>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const quickStats = [
    {
      label: "Contenus Créés",
      value: stats.totalContents,
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Quiz Actifs",
      value: stats.totalQuizzes,
      icon: <Award className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Étudiants Actifs",
      value: stats.totalStudents,
      icon: <Users className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Score Moyen",
      value: stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}/10` : "N/A",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      textColor: "text-orange-600 dark:text-orange-400",
    },
  ]

  const quickActions = [
    {
      title: "Créer un Nouveau Contenu",
      description: "Ajoutez une nouvelle leçon avec quiz interactif",
      icon: <Plus className="w-6 h-6" />,
      href: "/teacher/add-content",
      color: "from-primary-500 to-secondary-500",
      primary: true,
    },
    {
      title: "Gérer mes Contenus",
      description: "Modifiez et organisez vos leçons existantes",
      icon: <Edit className="w-6 h-6" />,
      href: "/teacher/manage-content",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Progression des Élèves",
      description: "Suivez les performances de vos étudiants",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/teacher/student-progress",
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle={`Bienvenue, ${user.username} !`} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Message de bienvenue */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium shadow-lg">
            <Sparkles className="w-4 h-4" />
            Tableau de bord enseignant
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Gérez votre contenu éducatif
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Créez, modifiez et suivez vos leçons interactives. Analysez les performances de vos étudiants en temps réel.
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <EnhancedCard
              key={stat.label}
              className={cn("text-center animate-fade-in", `animation-delay-${index * 100}`)}
              hover
            >
              <div className="space-y-3">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto", stat.bgColor)}>
                  <div className={stat.textColor}>{stat.icon}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{stat.value}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</div>
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 text-center">Actions Rapides</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <EnhancedCard
                  hover
                  gradient
                  className={cn(
                    "h-full transition-all duration-300 animate-fade-in cursor-pointer",
                    `animation-delay-${index * 150}`,
                    action.primary && "ring-2 ring-primary-200 dark:ring-primary-800",
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-xl bg-gradient-to-r text-white shadow-lg", action.color)}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">{action.title}</h3>
                      </div>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                      {action.description}
                    </p>
                    <Button
                      className={cn(
                        "w-full bg-gradient-to-r text-white shadow-lg transition-all duration-300",
                        action.color,
                        "hover:scale-105 hover:shadow-xl",
                      )}
                    >
                      {action.primary ? "Commencer" : "Accéder"}
                    </Button>
                  </div>
                </EnhancedCard>
              </Link>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        {stats.recentActivity.length > 0 && (
          <EnhancedCard
            title="Activité Récente"
            icon={<Clock className="w-5 h-5 text-primary-600" />}
            gradient
            className="animate-fade-in animation-delay-500"
          >
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-white/50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {activity.student_name} a complété un quiz
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {activity.content_title} • Score: {activity.score}/10 •
                      {activity.completed_at
                        ? new Date(activity.completed_at).toLocaleDateString("fr-FR")
                        : "Récemment"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-600">{activity.score}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </EnhancedCard>
        )}

        {/* Message si aucune donnée */}
        {stats.totalContents === 0 && (
          <EnhancedCard className="text-center" gradient>
            <div className="py-8">
              <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Aucun contenu créé</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Commencez par créer votre premier contenu éducatif avec quiz interactif.
              </p>
              <Link href="/teacher/add-content">
                <Button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer mon premier contenu
                </Button>
              </Link>
            </div>
          </EnhancedCard>
        )}

        {/* Debug info en mode développement */}
        {process.env.NODE_ENV === "development" && (
          <EnhancedCard className="bg-neutral-100 dark:bg-neutral-800">
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p>Total Contents: {stats.totalContents}</p>
              <p>Total Quizzes: {stats.totalQuizzes}</p>
              <p>Total Students: {stats.totalStudents}</p>
              <p>Average Score: {stats.averageScore.toFixed(2)}</p>
              <p>Recent Activity: {stats.recentActivity.length} items</p>
              <p>Progress Data Length: {stats.recentActivity.length > 0 ? "Available" : "Empty"}</p>
            </div>
          </EnhancedCard>
        )}
      </main>
    </div>
  )
}
