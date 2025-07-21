const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.93:8000"

interface ApiResponse<T> {
  data: T | null
  error: string | null
}

interface LoginData {
  username: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface User {
  id: number
  username: string
  email: string
  role: "student" | "teacher" | "admin"
  first_name?: string
  last_name?: string
}

interface LoginResponse {
  token: string
  user: User
}

// Configuration fetch avec gestion d'erreur améliorée
export async function apiRequest<T>(endpoint: string, method = "GET", body?: any): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      credentials: "include",
    }

    // Ajouter le token d'authentification si disponible
    const token = getAuthToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Token ${token}`,
      }
    }

    // Ajouter le body si présent
    if (body && method !== "GET") {
      config.body = JSON.stringify(body)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || `Erreur HTTP: ${response.status}`

      // Si erreur 401, le token est probablement invalide
      if (response.status === 401) {
        setAuthToken(null)
        localStorage.removeItem("user")
      }

      return { data: null, error: errorMessage }
    }

    // Gérer les réponses sans contenu (comme logout qui retourne 204)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return { data: null, error: null }
    }

    // Vérifier si la réponse contient du JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return { data, error: null }
    } else {
      // Pour les réponses non-JSON, retourner null comme data
      return { data: null, error: null }
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Une erreur réseau est survenue",
    }
  }
}

// Fonctions utilitaires pour le token
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem("authToken", token)
  } else {
    localStorage.removeItem("authToken")
  }
}

// Fonction de connexion
export async function loginUser(loginData: LoginData): Promise<ApiResponse<LoginResponse>> {
  const response = await apiRequest<LoginResponse>("/api/accounts/login/", "POST", loginData)

  if (response.data?.token) {
    setAuthToken(response.data.token)
    localStorage.setItem("user", JSON.stringify(response.data.user))
  }

  return response
}

// Fonction d'inscription
export async function registerUser(registerData: RegisterData): Promise<ApiResponse<User>> {
  return apiRequest<User>("/api/accounts/register/", "POST", registerData)
}

// Fonction pour obtenir l'utilisateur actuel - CORRIGÉE
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const token = getAuthToken()
  if (!token) {
    // Ne pas logger d'erreur si pas de token - c'est normal au début
    return { data: null, error: null }
  }

  const response = await apiRequest<User>("/api/accounts/profile/")

  if (response.error) {
    // Si le token est invalide, le supprimer
    setAuthToken(null)
    localStorage.removeItem("user")
  }

  return response
}

// Fonction de déconnexion
export async function logoutUser(): Promise<ApiResponse<null>> {
  const response = await apiRequest<null>("/api/accounts/logout/", "POST")

  // Supprimer les données locales même si la requête échoue
  setAuthToken(null)
  localStorage.removeItem("user")

  return response
}

// Fonction pour récupérer les contenus
export async function getContents(): Promise<ApiResponse<any[]>> {
  const user = getStoredUser()
  if (user?.role === "teacher") {
    return apiRequest<any[]>("/api/teacher/content/")
  } else {
    return apiRequest<any[]>("/api/student/content/")
  }
}

// Fonction pour récupérer un contenu spécifique
export async function getContent(id: string): Promise<ApiResponse<any>> {
  const user = getStoredUser()
  if (user?.role === "teacher") {
    return apiRequest<any>(`/api/teacher/content/${id}/`)
  } else {
    return apiRequest<any>(`/api/student/content/${id}/`)
  }
}

// Fonction pour créer un contenu (enseignant seulement)
export async function createContent(contentData: any): Promise<ApiResponse<any>> {
  return apiRequest<any>("/api/teacher/content/", "POST", contentData)
}

// Fonction pour mettre à jour un contenu (enseignant seulement)
export async function updateContent(id: string, contentData: any): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/teacher/content/${id}/`, "PUT", contentData)
}

// Fonction pour supprimer un contenu (enseignant seulement)
export async function deleteContent(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/teacher/content/${id}/`, "DELETE")
}

// Fonction pour créer un quiz avec questions
export async function createQuiz(contentId: string, quizData: any): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/teacher/content/${contentId}/add_quiz_and_questions/`, "POST", quizData)
}

// Fonction pour récupérer les statistiques de progression
export async function getProgressStats(): Promise<ApiResponse<any>> {
  return apiRequest<any>("/api/progress/")
}

// Fonction pour soumettre une réponse de quiz
export async function submitQuizAnswer(contentId: string, quizId: string, score: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/progress/submit_quiz_answer/`, "POST", {
    content_id: contentId,
    quiz_id: quizId,
    score: score,
  })
}

// Fonction pour récupérer les résultats d'un quiz
export async function getQuizResults(quizId: string): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/quizzes/${quizId}/`)
}

// Fonction utilitaire pour vérifier si l'utilisateur est connecté
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

// Fonction utilitaire pour obtenir l'utilisateur depuis le localStorage
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Fonction de test pour vérifier la connectivité API
export async function testApiConnection(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/`, {
      method: "GET",
      mode: "cors",
    })
    console.log("🔍 Test API Response:", response.status, response.statusText)
  } catch (error) {
    console.error("❌ Erreur de connectivité API:", error)
  }
}
