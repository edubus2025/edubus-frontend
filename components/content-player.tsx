"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle,
  ArrowRight,
  Clock,
  BookOpen,
  Users,
  Star,
  ArrowLeft,
  SkipBack,
  SkipForward,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContentItem } from "@/types/content-item"

interface ContentPlayerProps {
  content: ContentItem
  onQuizStart: () => void
}

export function ContentPlayer({ content, onQuizStart }: ContentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedControls, setShowSpeedControls] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [isGoogleDrive, setIsGoogleDrive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setHasStarted(true)
    setIsGoogleDrive(content.url.includes("drive.google.com"))

    // Forcer le scroll en haut de la page au chargement - avec délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 0)

    // Empêcher le zoom automatique sur mobile
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
    } else {
      // Créer la balise viewport si elle n'existe pas
      const newViewport = document.createElement("meta")
      newViewport.name = "viewport"
      newViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      document.head.appendChild(newViewport)
    }

    // Nettoyer au démontage du composant
    return () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute("content", "width=device-width, initial-scale=1.0")
      }
    }
  }, [content])

  const handleMediaPlay = () => {
    setIsPlaying(true)
  }

  const handleMediaPause = () => {
    setIsPlaying(false)
  }

  const handleMediaError = (e: any) => {
    console.error("Media error:", e)
    setAudioError(true)
    setAudioLoaded(false)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setAudioLoaded(true)
      setAudioError(false)
    }
  }

  const handleCanPlay = () => {
    setAudioLoaded(true)
    setAudioError(false)
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioLoaded) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current && audioLoaded) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const skipBackward = () => {
    if (audioRef.current && audioLoaded) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const skipForward = () => {
    if (audioRef.current && audioLoaded) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
    }
  }

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
    setShowSpeedControls(false)
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
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

  // Fonction pour extraire l'ID Google Drive de différents formats d'URL
  const getGoogleDriveFileId = (url: string) => {
    // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    if (url.includes("/file/d/") && url.includes("/view")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//)
      return match ? match[1] : null
    }

    // Format 2: https://drive.google.com/uc?export=download&id=FILE_ID
    if (url.includes("id=")) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/)
      return match ? match[1] : null
    }

    return null
  }

  // Fonction pour obtenir l'URL d'iframe Google Drive (sécurisée)
  const getGoogleDriveIframeUrl = (url: string) => {
    const fileId = getGoogleDriveFileId(url)

    if (!fileId) {
      return url
    }

    return `https://drive.google.com/file/d/${fileId}/preview`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Bouton retour */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              // Utiliser le router Next.js au lieu de window.history.back()
              window.location.href = "/"
            }}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux contenus
          </Button>
        </div>

        {/* En-tête de la leçon */}
        <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-xs sm:text-sm font-medium shadow-lg">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            Leçon en cours
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent px-4">
            {content.title}
          </h1>
        </div>

        {/* Carte principale du contenu */}
        <Card className="overflow-hidden shadow-2xl border-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md animate-fade-in animation-delay-200">
          <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white relative overflow-hidden p-4 sm:p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">{content.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    {content.type === "video" ? "Vidéo" : "Audio"}
                  </Badge>
                  {isPlaying && (
                    <div className="flex items-center gap-1 text-white/80">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs sm:text-sm">En lecture</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                {content.type === "video" ? (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Lecteur média */}
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 overflow-hidden">
              {content.type === "video" ? (
                <div className="relative aspect-video">
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
                      src={getGoogleDriveIframeUrl(content.url)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={content.title}
                    />
                  ) : content.url.includes(".mp4") || content.url.includes(".webm") || content.url.includes(".ogg") ? (
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
                    <iframe src={content.url} className="w-full h-full" allowFullScreen title={content.title} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              ) : (
                // Section audio avec hauteur flexible (pas aspect-video)
                <div className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex items-center justify-center overflow-hidden py-4 sm:py-8">
                  {/* Lecteur audio adaptatif */}
                  <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
                    {/* En-tête élégant */}
                    <div className="text-center space-y-4 sm:space-y-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                        <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                          Contenu Audio
                        </h3>
                        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400">
                          Écoutez attentivement la leçon
                        </p>
                      </div>
                    </div>

                    {isGoogleDrive ? (
                      // Interface épurée pour Google Drive
                      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mx-auto max-w-full sm:max-w-3xl">
                        <div className="p-4 sm:p-6">
                          <div className="relative">
                            <iframe
                              src={getGoogleDriveIframeUrl(content.url)}
                              className="w-full h-16 sm:h-20 lg:h-24 border-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900"
                              title={content.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                              style={{ pointerEvents: "auto" }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Lecteur HTML5 complet pour les autres sources - Responsive
                      <div className="space-y-4 sm:space-y-6">
                        {/* Lecteur audio HTML5 caché */}
                        <audio
                          ref={audioRef}
                          onPlay={handleMediaPlay}
                          onPause={handleMediaPause}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onCanPlay={handleCanPlay}
                          onError={handleMediaError}
                          preload="metadata"
                          crossOrigin="anonymous"
                          style={{ display: "none" }}
                        >
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/mpeg" />
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/wav" />
                          <source src={getOptimizedAudioUrl(content.url)} type="audio/ogg" />
                          Votre navigateur ne supporte pas la balise audio.
                        </audio>

                        {/* Contrôles personnalisés élégants - Responsive */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 mx-auto max-w-full sm:max-w-3xl">
                          {/* Barre de progression */}
                          {audioLoaded && duration > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                              <Slider
                                value={[currentTime]}
                                max={duration}
                                step={1}
                                onValueChange={handleSeek}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                              </div>
                            </div>
                          )}

                          {/* Contrôles principaux - Responsive */}
                          <div className="flex items-center justify-center gap-4 sm:gap-6">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={skipBackward}
                              disabled={!audioLoaded}
                              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900 bg-transparent transition-all duration-200"
                            >
                              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                            </Button>

                            <Button
                              onClick={togglePlayPause}
                              disabled={!audioLoaded}
                              className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl transition-all duration-200 hover:scale-105"
                            >
                              {isPlaying ? (
                                <Pause className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                              ) : (
                                <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white ml-0.5 sm:ml-1" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={skipForward}
                              disabled={!audioLoaded}
                              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900 bg-transparent transition-all duration-200"
                            >
                              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                            </Button>
                          </div>

                          {/* Contrôles secondaires - Responsive */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 pt-2 sm:pt-4">
                            {/* Volume */}
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleMute}
                                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                              >
                                {isMuted ? (
                                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                ) : (
                                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                                )}
                              </Button>
                              <div className="w-20 sm:w-24 lg:w-32">
                                <Slider
                                  value={[isMuted ? 0 : volume]}
                                  max={1}
                                  step={0.1}
                                  onValueChange={handleVolumeChange}
                                />
                              </div>
                            </div>

                            {/* Vitesse de lecture */}
                            <div className="relative">
                              <Button
                                variant="outline"
                                onClick={() => setShowSpeedControls(!showSpeedControls)}
                                className="flex items-center gap-2 h-8 sm:h-10 lg:h-12 px-3 sm:px-4 rounded-full border-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm"
                              >
                                <Settings className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                                <span className="font-semibold">{playbackRate}x</span>
                              </Button>

                              {showSpeedControls && (
                                <div className="absolute bottom-full right-0 mb-2 sm:mb-3 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 sm:p-3 min-w-[120px] sm:min-w-[140px] z-50">
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-2">
                                    Vitesse de lecture
                                  </div>
                                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                    <Button
                                      key={rate}
                                      variant={playbackRate === rate ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => changePlaybackRate(rate)}
                                      className="w-full justify-start mb-1 last:mb-0 rounded-lg sm:rounded-xl text-xs sm:text-sm h-7 sm:h-8"
                                    >
                                      {rate}x {rate === 1 && "(Normal)"}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Statut du lecteur */}
                          <div className="text-center pt-2">
                            {audioError ? (
                              <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                                Erreur de chargement de l'audio
                              </p>
                            ) : !audioLoaded ? (
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Chargement de l'audio...
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                                Audio prêt à être lu
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section description */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                  Description
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {content.description ||
                    "Découvrez ce contenu éducatif soigneusement préparé pour enrichir vos connaissances."}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {content.levels?.map((level) => (
                    <Badge key={level} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                      {level}
                    </Badge>
                  ))}
                  {content.subjects?.map((subject) => (
                    <Badge
                      key={subject}
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300 text-xs"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouton Quiz amélioré */}
            <div className="p-4 sm:p-6 bg-white dark:bg-neutral-900">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Prêt pour le quiz ?</span>
                </div>

                <Button
                  onClick={onQuizStart}
                  className={cn(
                    "relative overflow-hidden px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl",
                    "bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500",
                    "hover:from-primary-600 hover:via-secondary-600 hover:to-accent-600",
                    "transform transition-all duration-300 hover:scale-105 hover:shadow-2xl",
                    "text-white shadow-lg",
                    "group animate-fade-in animation-delay-500",
                    "w-full sm:w-auto",
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" />
                    <span>J'ai Compris ! Passer au Quiz</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Button>

                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  Testez vos connaissances avec notre quiz interactif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cartes informatives en bas - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 animate-fade-in animation-delay-700">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-200">Apprentissage</h4>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">Contenu pédagogique</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-sm sm:text-base text-green-800 dark:text-green-200">Qualité</h4>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-300">Contenu vérifié</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 sm:p-4 text-center">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-sm sm:text-base text-purple-800 dark:text-purple-200">Évaluation</h4>
              <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">Quiz interactif</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
