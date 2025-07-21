"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { BookOpen, Play, TrendingUp, Brain, CheckCircle, ArrowRight, GraduationCap, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { loginUser, registerUser, getCurrentUser, isAuthenticated, getStoredUser } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LandingAndLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeAuthTab, setActiveAuthTab] = useState<"student" | "teacher">("student")
  const [showStudentRegister, setShowStudentRegister] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      // Vérifier d'abord si on a un token
      if (!isAuthenticated()) {
        return // Pas de token, rester sur la page de connexion
      }

      // Si on a un token, vérifier s'il est valide
      const { data: user } = await getCurrentUser()
      if (user) {
        // Rediriger selon le rôle
        if (user.role === "teacher") {
          router.push("/teacher/dashboard")
        } else if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/")
        }
      } else {
        // Token invalide, vérifier le localStorage
        const storedUser = getStoredUser()
        if (storedUser) {
          // On a un utilisateur en localStorage mais le token est invalide
          // Rediriger quand même selon le rôle stocké
          if (storedUser.role === "teacher") {
            router.push("/teacher/dashboard")
          } else if (storedUser.role === "admin") {
            router.push("/admin/dashboard")
          } else {
            router.push("/")
          }
        }
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent, role: "student" | "teacher") => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const { data, error: loginError } = await loginUser({ username, password })

    if (loginError) {
      setError(loginError)
    } else if (data) {
      // Connexion réussie, rediriger selon le rôle
      if (data.user.role === "teacher") {
        router.push("/teacher/dashboard")
      } else if (data.user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/")
      }
    }
    setLoading(false)
  }

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const { data, error: registerError } = await registerUser({ username, email, password })

    if (registerError) {
      setError(registerError)
    } else {
      setSuccessMessage("Compte créé avec succès ! Vous pouvez maintenant vous connecter.")
      setUsername("")
      setEmail("")
      setPassword("")
      setShowStudentRegister(false)
    }
    setLoading(false)
  }

  const features = [
    {
      icon: <Play className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Cours Multimédia",
      description: "Vidéos et audios pédagogiques pour un apprentissage moderne",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: <Brain className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Quiz Interactifs",
      description: "Tests et exercices variés pour valider vos acquis",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: <BookOpen className="w-6 h-6 md:w-8 md:h-8" />,
      title: "7 Matières",
      description:
        "Arabe, Français, Anglais, Histoire-Géo, Philosophie, Orientation scolaire et professionnelle, Soft-skills",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Suivi des Progrès",
      description: "Tableaux de bord personnalisés et badges de réussite",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const benefits = [
    "Apprentissage adapté à votre niveau",
    "Contenu pédagogique de qualité",
    "Suivi personnalisé de vos progrès",
    "Interface moderne et intuitive",
    "Accès 24h/24 depuis n'importe où",
    "Badges et récompenses motivantes",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Header avec logo et navigation */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          {/* Top-left section: Circular Logo + Text (mobile optimized) */}
          <div className="absolute top-4 md:top-8 left-4 flex items-center gap-2">
            <Image
              src="/images/edubus-circular-logo.png"
              alt="EduBus Icon"
              width={28}
              height={28}
              className="md:w-8 md:h-8 rounded-full bg-white p-1 shadow-sm"
            />
            <div className="flex flex-col">
              <h1 className="text-sm md:text-lg font-bold text-white">EduBus</h1>
              <p className="text-xs md:text-sm text-blue-100 hidden sm:block">Apprendre autrement, même en chemin</p>
            </div>
          </div>

          {/* Main Logo (Responsive) */}
          <div className="flex items-center justify-center mb-6 md:mb-8 pt-12 md:pt-0">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src="/images/edubus-logo.png"
                  alt="EduBus Logo"
                  className="w-32 h-32 md:w-60 md:h-60 rounded-full object-contain bg-white p-2 shadow-lg"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    imageRendering: "crisp-edges",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Top-right section: Theme Toggle */}
          <div className="absolute top-4 md:top-8 right-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center text-white space-y-4 md:space-y-6 py-8 md:py-12 px-4">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs md:text-sm font-medium">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Transformez vos trajets en moments d'apprentissage</span>
            <span className="sm:hidden">Apprenez en chemin</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold leading-tight px-2">
            Apprenez à votre rythme avec EduBus
          </h2>
          <p className="text-sm md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
            Accédez à des contenus pédagogiques de qualité, suivez vos progrès et développez vos compétences avec notre
            plateforme éducative innovante.
          </p>
        </div>

        {/* Vagues décoratives */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-8 md:h-12 fill-neutral-50 dark:fill-neutral-900">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16 space-y-16 md:space-y-20">
        {/* Section Pourquoi choisir EduBus */}
        <section className="text-center space-y-8 md:space-y-12">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              Pourquoi choisir EduBus ?
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Découvrez les fonctionnalités qui font d'EduBus la plateforme d'apprentissage de référence pour les
              étudiants marocains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={cn(
                  "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in",
                  feature.bgColor,
                  `animation-delay-${index * 150}`,
                )}
              >
                <CardHeader className="text-center space-y-3 md:space-y-4 p-4 md:p-6">
                  <div
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-r text-white shadow-lg",
                      feature.color,
                    )}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg md:text-xl font-bold text-neutral-800 dark:text-neutral-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <CardDescription className="text-center text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section Avantages */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8 md:mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                Une expérience d'apprentissage unique
              </h3>
              <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                EduBus révolutionne l'éducation en rendant l'apprentissage accessible, interactif et adapté aux besoins
                de chaque élève.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="space-y-4 md:space-y-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={cn("flex items-center gap-3 md:gap-4 animate-fade-in", `animation-delay-${index * 100}`)}
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 md:w-5 md:h-5 text-white" />
                    </div>
                    <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="bg-white dark:bg-neutral-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl">
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg md:rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-neutral-800 dark:text-neutral-200">
                        Témoignage
                      </h4>
                      <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">Élève de 1ère Bac</p>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 italic">
                    "EduBus m'a permis d'améliorer mes notes en français et en philosophie. Les quiz interactifs rendent
                    l'apprentissage vraiment amusant !"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Connexion/Inscription */}
        <section className="max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4 p-4 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl md:rounded-2xl mx-auto flex items-center justify-center">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  Accéder à votre espace
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
                  Connectez-vous ou inscrivez-vous pour commencer votre apprentissage.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Tabs
                value={activeAuthTab}
                onValueChange={(value) => setActiveAuthTab(value as "student" | "teacher")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-10 md:h-12">
                  <TabsTrigger value="student" className="text-xs md:text-sm">
                    Espace Élève
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="text-xs md:text-sm">
                    Espace Enseignant
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="mt-6">
                  {!showStudentRegister ? (
                    <form onSubmit={(e) => handleLogin(e, "student")} className="space-y-4 md:space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="student-username"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Nom d'utilisateur
                        </Label>
                        <Input
                          id="student-username"
                          type="text"
                          placeholder="Entrez votre nom d'utilisateur"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="student-password"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Mot de passe
                        </Label>
                        <Input
                          id="student-password"
                          type="password"
                          placeholder="Entrez votre mot de passe"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      {successMessage && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-10 md:h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Connexion...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Se connecter
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                      <div className="mt-4 md:mt-6 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Pas encore de compte ?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setShowStudentRegister(true)
                              setError(null)
                              setSuccessMessage(null)
                              setUsername("")
                              setEmail("")
                              setPassword("")
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                          >
                            S'inscrire
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleStudentRegister} className="space-y-4 md:space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="register-username"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Nom d'utilisateur
                        </Label>
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choisissez un nom d'utilisateur"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="register-email"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Email
                        </Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Entrez votre email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="register-password"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          Mot de passe
                        </Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Choisissez un mot de passe"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      {successMessage && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-10 md:h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Inscription en cours...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            S'inscrire
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                      <div className="mt-4 md:mt-6 text-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Déjà un compte ?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setShowStudentRegister(false)
                              setError(null)
                              setSuccessMessage(null)
                              setUsername("")
                              setEmail("")
                              setPassword("")
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                          >
                            Se connecter
                          </button>
                        </p>
                      </div>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="teacher" className="mt-6">
                  <form onSubmit={(e) => handleLogin(e, "teacher")} className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="teacher-username"
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Nom d'utilisateur
                      </Label>
                      <Input
                        id="teacher-username"
                        type="text"
                        placeholder="Entrez votre nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="teacher-password"
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Mot de passe
                      </Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        placeholder="Entrez votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 md:h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-10 md:h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Connexion...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Se connecter (Enseignant)
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 dark:bg-neutral-900 text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Image
                  src="/images/edubus-logo.png"
                  alt="EduBus Logo"
                  width={32}
                  height={32}
                  className="md:w-10 md:h-10 rounded-full bg-white p-1"
                />
                <h4 className="text-lg md:text-xl font-bold">EduBus</h4>
              </div>
              <p className="text-sm md:text-base text-neutral-400">
                Transformez vos trajets en moments d'apprentissage avec notre plateforme éducative innovante.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h5 className="font-semibold text-base md:text-lg">Matières</h5>
              <ul className="space-y-1 md:space-y-2 text-sm md:text-base text-neutral-400">
                {subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h5 className="font-semibold text-base md:text-lg">Contact</h5>
              <div className="space-y-1 md:space-y-2 text-sm md:text-base text-neutral-400">
                <p>📧 AIDPM@gmail.com</p>
                <p>📱 +212 661 57 22 07</p>
                <p>📘 Facebook: /AIDPM</p>
                <p>📍 Association Ighil pour le Développement de la Population Montagnarde Kelaa M'gouna BP 129</p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-sm md:text-base text-neutral-400">
            <p>&copy; 2024 EduBus. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
