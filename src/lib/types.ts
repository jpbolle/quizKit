export type QuestionType = "qcm" | "vrai-faux" | "nuage-mots" | "evaluation";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
}

export interface QuestionQCM extends BaseQuestion {
  type: "qcm";
  options: string[];
  multiAllowed?: boolean;
}

export interface QuestionVraiFaux extends BaseQuestion {
  type: "vrai-faux";
}

export interface QuestionNuageMots extends BaseQuestion {
  type: "nuage-mots";
  maxMots?: number;
}

export interface QuestionEvaluation extends BaseQuestion {
  type: "evaluation";
  /** Items à évaluer de 1 (critère absent) à 5 (critère présent) */
  items: string[];
}

export type Question =
  | QuestionQCM
  | QuestionVraiFaux
  | QuestionNuageMots
  | QuestionEvaluation;

export interface Sondage {
  id: string;
  title: string;
  ownerEmail: string;
  ownerUid: string;
  createdAt: number;
  updatedAt: number;
  isLive: boolean;
  pin: string | null;
  /** Index de la question affichée (-1 = pas démarré, length = terminé) */
  currentQuestionIndex: number;
  /** true = on a révélé les résultats de la question courante */
  showResults: boolean;
  questions: Question[];
}

export interface Participant {
  id: string;
  prenom: string;
  joinedAt: number;
}

/** Une réponse d'un participant à une question donnée */
export interface Reponse {
  id: string;
  participantId: string;
  participantPrenom: string;
  questionIndex: number;
  /**
   * - qcm: index choisi (number) ou number[] si multiAllowed
   * - vrai-faux: boolean
   * - nuage-mots: string[] (mots saisis)
   * - evaluation: Record<itemIndex, 1..5>
   */
  valeur: number | number[] | boolean | string[] | Record<number, number>;
  createdAt: number;
}

export interface PinMapping {
  pin: string;
  sondageId: string;
  createdAt: number;
}

export type GroupingMode = "identique" | "different";

export interface Groupe {
  label: string;
  membres: { participantId: string; prenom: string; valeurAffichee: string }[];
}
