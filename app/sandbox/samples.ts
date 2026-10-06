import type { PostTypeId } from "@/lib/post-types"

// Réponses fictives pour tester vite chaque type de post. Clés = identifiants des questions.
export const SAMPLE_ANSWERS: Record<PostTypeId, Record<string, string>> = {
  employer_brand: {
    moment: "demo du vendredi 16h, 20 min, qqn montre son taf de la semaine",
    people: "toute l'equipe, 25 personnes, souvent les juniors presentent",
    meaning: "on apprend des echecs, on rigole, ambiance bienveillante",
  },
  delivered_project: {
    project: "refonte dashboard commercial pour un distributeur de materiel de jardin, ~40 commerciaux",
    problem: "chiffres le lundi pour la semaine d'avant, export excel a la main, plein d'erreurs",
    result: "chiffres dispo chaque matin a 7h, le controle de gestion a recupere 1 jour/semaine",
    team: "Ines (data eng), Theo (BI), Sarah cheffe de projet. 8 semaines",
  },
  tech_feedback: {
    topic: "tests de qualite de donnees dans nos pipelines",
    difficulty: "jobs qui tombaient la nuit sans alerte, 2 incidents en 1 mois",
    lesson: "tests sur chaque table (unicite, null, fraicheur) + alerte slack. 0 incident depuis 3 mois",
  },
  event: {
    event: "meetup data a Lyon, jeudi 15 octobre, 19h",
    role: "on organise et Ines fait un talk sur les tests de donnees",
    takeaway: "retours concrets, 60 places, apero apres",
  },
  new_hire: {
    who: "camille, consultante data senior",
    background: "6 ans chez un retailer, a monte leur equipe BI, fan de dataviz et d'escalade",
    mission: "projets BI clients retail + ateliers internes dataviz",
  },
}
