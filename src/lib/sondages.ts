import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { genPin, genId } from "./utils";
import type { Participant, Reponse, Sondage, Question } from "./types";

const COL_SONDAGES = "sondages";
const COL_PINS = "pins";

function tsToMillis(v: unknown): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  return 0;
}

function docToSondage(d: QueryDocumentSnapshot): Sondage {
  const data = d.data() as Record<string, unknown>;
  return {
    id: d.id,
    title: (data.title as string) ?? "Sans titre",
    ownerEmail: (data.ownerEmail as string) ?? "",
    ownerUid: (data.ownerUid as string) ?? "",
    createdAt: tsToMillis(data.createdAt),
    updatedAt: tsToMillis(data.updatedAt),
    isLive: Boolean(data.isLive),
    pin: (data.pin as string) ?? null,
    currentQuestionIndex: (data.currentQuestionIndex as number) ?? -1,
    questionVisible: Boolean(data.questionVisible),
    showResults: Boolean(data.showResults),
    questions: (data.questions as Question[]) ?? [],
  };
}

export async function creerSondage(
  ownerEmail: string,
  ownerUid: string,
  title: string
): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, COL_SONDAGES), {
    title,
    ownerEmail,
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isLive: false,
    pin: null,
    currentQuestionIndex: -1,
    questionVisible: false,
    showResults: false,
    questions: [],
  });
  return ref.id;
}

export async function listerSondagesProf(uid: string): Promise<Sondage[]> {
  const db = getDb();
  const q = query(
    collection(db, COL_SONDAGES),
    where("ownerUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToSondage);
}

export function ecouterSondage(
  sondageId: string,
  cb: (s: Sondage | null) => void
) {
  const db = getDb();
  return onSnapshot(doc(db, COL_SONDAGES, sondageId), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(docToSondage(snap as QueryDocumentSnapshot));
  });
}

export async function lireSondage(id: string): Promise<Sondage | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COL_SONDAGES, id));
  if (!snap.exists()) return null;
  return docToSondage(snap as QueryDocumentSnapshot);
}

export async function majTitre(id: string, title: string) {
  const db = getDb();
  await updateDoc(doc(db, COL_SONDAGES, id), {
    title,
    updatedAt: serverTimestamp(),
  });
}

export async function majQuestions(id: string, questions: Question[]) {
  const db = getDb();
  await updateDoc(doc(db, COL_SONDAGES, id), {
    questions,
    updatedAt: serverTimestamp(),
  });
}

export async function supprimerSondage(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, COL_SONDAGES, id));
}

// --- Lancement / arrêt ---

export async function lancerSondage(id: string): Promise<string> {
  const db = getDb();
  // Génère un PIN unique
  let pin = "";
  for (let i = 0; i < 10; i++) {
    pin = genPin(6);
    const existing = await getDoc(doc(db, COL_PINS, pin));
    if (!existing.exists()) break;
  }
  await setDoc(doc(db, COL_PINS, pin), {
    sondageId: id,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COL_SONDAGES, id), {
    isLive: true,
    pin,
    currentQuestionIndex: 0,
    questionVisible: false,
    showResults: false,
    updatedAt: serverTimestamp(),
  });
  return pin;
}

export async function arreterSondage(id: string, pin: string | null) {
  const db = getDb();
  if (pin) {
    await deleteDoc(doc(db, COL_PINS, pin)).catch(() => {});
  }
  await updateDoc(doc(db, COL_SONDAGES, id), {
    isLive: false,
    pin: null,
    currentQuestionIndex: -1,
    questionVisible: false,
    showResults: false,
    updatedAt: serverTimestamp(),
  });
}

export async function naviguerQuestion(id: string, index: number) {
  const db = getDb();
  await updateDoc(doc(db, COL_SONDAGES, id), {
    currentQuestionIndex: index,
    questionVisible: false,
    showResults: false,
    updatedAt: serverTimestamp(),
  });
}

export async function afficherQuestion(id: string, visible: boolean) {
  const db = getDb();
  const patch: Record<string, unknown> = {
    questionVisible: visible,
    updatedAt: serverTimestamp(),
  };
  // Si on cache la question, on cache aussi les résultats
  if (!visible) patch.showResults = false;
  await updateDoc(doc(db, COL_SONDAGES, id), patch);
}

export async function basculeResultats(id: string, show: boolean) {
  const db = getDb();
  await updateDoc(doc(db, COL_SONDAGES, id), {
    showResults: show,
    updatedAt: serverTimestamp(),
  });
}

// --- PIN -> sondage ---

export async function lireSondageParPin(pin: string): Promise<string | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COL_PINS, pin));
  if (!snap.exists()) return null;
  const data = snap.data();
  return (data.sondageId as string) ?? null;
}

// --- Participants ---

export async function rejoindreSondage(
  sondageId: string,
  participantId: string,
  prenom: string
) {
  const db = getDb();
  await setDoc(
    doc(db, COL_SONDAGES, sondageId, "participants", participantId),
    {
      prenom,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function ecouterParticipants(
  sondageId: string,
  cb: (list: Participant[]) => void
) {
  const db = getDb();
  return onSnapshot(
    collection(db, COL_SONDAGES, sondageId, "participants"),
    (snap) => {
      const list: Participant[] = snap.docs.map((d) => ({
        id: d.id,
        prenom: (d.data().prenom as string) ?? "",
        joinedAt: tsToMillis(d.data().joinedAt),
      }));
      cb(list);
    }
  );
}

// --- Réponses ---

export async function envoyerReponse(
  sondageId: string,
  participantId: string,
  participantPrenom: string,
  questionIndex: number,
  valeur: Reponse["valeur"]
) {
  const db = getDb();
  const reponseId = `${participantId}_${questionIndex}`;
  await setDoc(
    doc(db, COL_SONDAGES, sondageId, "reponses", reponseId),
    {
      participantId,
      participantPrenom,
      questionIndex,
      valeur,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function ecouterReponses(
  sondageId: string,
  cb: (list: Reponse[]) => void
) {
  const db = getDb();
  return onSnapshot(
    collection(db, COL_SONDAGES, sondageId, "reponses"),
    (snap) => {
      const list: Reponse[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          participantId: (data.participantId as string) ?? "",
          participantPrenom: (data.participantPrenom as string) ?? "",
          questionIndex: (data.questionIndex as number) ?? 0,
          valeur: data.valeur as Reponse["valeur"],
          createdAt: tsToMillis(data.createdAt),
        };
      });
      cb(list);
    }
  );
}

// --- Helpers ---

export function questionVide(type: Question["type"]): Question {
  const id = genId();
  switch (type) {
    case "qcm":
      return {
        id,
        type: "qcm",
        question: "",
        options: ["", ""],
        multiAllowed: false,
      };
    case "vrai-faux":
      return { id, type: "vrai-faux", question: "" };
    case "nuage-mots":
      return { id, type: "nuage-mots", question: "", maxMots: 3 };
    case "evaluation":
      return { id, type: "evaluation", question: "", items: [""] };
  }
}
