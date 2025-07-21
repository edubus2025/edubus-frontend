// types/quiz-question.ts

// Types pour le champ 'options'
export type QCMOptions = string[]
export type TrueFalseOptions = ["Vrai", "Faux"]
export type ShortAnswerOptions = [] // Vide pour réponse courte
export interface MatchingOptionPair {
  left: string
  right: string
}
export type MatchingOptions = MatchingOptionPair[]
export type OrderingOptions = string[]
export type FillInTheBlanksOptions = [] // Vide, le texte est dans question_text
export interface DragAndDropOptions {
  draggables: string[]
  targets: string[]
}

export type QuestionOptions =
  | QCMOptions
  | TrueFalseOptions
  | ShortAnswerOptions
  | MatchingOptions
  | OrderingOptions
  | FillInTheBlanksOptions
  | DragAndDropOptions

// Types pour le champ 'correct_answer'
export type QCMCorrectAnswer = string
export type TrueFalseCorrectAnswer = "Vrai" | "Faux"
export type ShortAnswerCorrectAnswer = string
export interface MatchingCorrectAnswer {
  [leftItem: string]: string // Ex: {"Question": "Réponse"}
}
export type OrderingCorrectAnswer = string[] // L'ordre correct des éléments
export type FillInTheBlanksCorrectAnswer = string[] // Liste des réponses pour chaque [BLANK]
export interface DragAndDropCorrectAnswer {
  [draggableItem: string]: string // Ex: {"Élément à glisser": "Cible"}
}

export type QuestionCorrectAnswer =
  | QCMCorrectAnswer
  | TrueFalseCorrectAnswer
  | ShortAnswerCorrectAnswer
  | MatchingCorrectAnswer
  | OrderingCorrectAnswer
  | FillInTheBlanksCorrectAnswer
  | DragAndDropCorrectAnswer

// Interface principale pour une question de quiz
export interface QuizQuestion {
  id?: string // Optionnel pour les nouvelles questions
  question_text: string
  type: "qcm" | "true_false" | "short_answer" | "matching" | "ordering" | "fill_in_the_blanks" | "drag_and_drop"
  options: QuestionOptions
  correct_answer: QuestionCorrectAnswer
}
