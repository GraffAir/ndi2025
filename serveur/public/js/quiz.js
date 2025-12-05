/**
 * QUIZ NIRD - Script de gestion du questionnaire
 * Système de navigation et scoring pour le quiz NIRD
 */

class QuizNIRD {
  constructor() {
    // Définition des étapes du quiz
    this.steps = [
      { id: "debut", file: "debut.html", label: "Rôle" },
      { id: "engagement", file: null, label: "Engagement" }, // Dynamique selon le rôle
      {
        id: "systeme-informatique",
        file: "systeme-informatique.html",
        label: "Système informatique",
      },
      {
        id: "systeme-exploitation",
        file: "systeme-exploitation.html",
        label: "OS",
      },
      { id: "navigateur", file: "navigateur.html", label: "Navigateur" },
      { id: "recherche", file: "recherche.html", label: "Recherche" },
      { id: "bureautique", file: "bureautique.html", label: "Bureautique" },
      { id: "ent", file: "ent.html", label: "ENT" },
      { id: "messagerie", file: "messagerie.html", label: "Messagerie" },
      { id: "resultats", file: "resultats.html", label: "Résultats" },
    ];

    this.currentStep = 0;
    this.responses = {};
    this.scores = {
      openSource: 0,
      proprietary: 0,
      total: 0,
    };

    // Scoring des réponses
    this.scoring = {
      quizOS: {
        nird: { openSource: 3, label: "Linux NIRD" },
        linux: { openSource: 2, label: "Autre distribution Linux" },
        windows: { proprietary: 2, label: "Windows" },
        apple: { proprietary: 2, label: "Apple" },
      },
      quizNavigateur: {
        firefox: { openSource: 2, label: "Mozilla Firefox" },
        "open-source": { openSource: 2, label: "Navigateur open-source" },
        chromium: { openSource: 1, proprietary: 1, label: "Chromium" },
        chrome: { proprietary: 2, label: "Google Chrome" },
        "closed-source": { proprietary: 2, label: "Navigateur propriétaire" },
      },
      quizRecherche: {
        "open-source": { openSource: 2, label: "Moteur open-source" },
        google: { proprietary: 2, label: "Google" },
        bing: { proprietary: 2, label: "Bing" },
        yahoo: { proprietary: 1, label: "Yahoo" },
        "closed-source": { proprietary: 2, label: "Moteur propriétaire" },
      },
      quizBureautique: {
        nextcloud: { openSource: 3, label: "Nextcloud" },
        "open-source": { openSource: 2, label: "LibreOffice / Open-source" },
        microsoft: { proprietary: 2, label: "Microsoft 365" },
        google: { proprietary: 2, label: "Google Docs" },
        idk: { label: "Non spécifié" },
      },
      quizENT: {
        "open-source": { openSource: 2, label: "ENT open-source" },
        pronote: { proprietary: 1, label: "Pronote" },
        neo: { proprietary: 1, label: "OZE/NEO" },
        gouvernemental: { label: "Logiciel gouvernemental" },
      },
      quizMail: {
        "open-source": { openSource: 2, label: "SOGo" },
        zimbra: { openSource: 2, label: "Zimbra" },
        gmail: { proprietary: 2, label: "Gmail" },
        idk: { label: "Autre" },
      },
      quizRole: {
        public: { label: "Public" },
        eleve: { label: "Élève" },
        personnel: { label: "Enseignant/Personnel" },
        parent: { label: "Parent" },
      },
      quizEngagement: {
        oui: { openSource: 1, label: "Engagé" },
        non: { label: "Non engagé" },
      },
      quizTechnique: {
        oui: { openSource: 1, label: "Impliqué techniquement" },
        non: { label: "Non impliqué" },
      },
    };

    this.init();
  }

  init() {
    // Charger les réponses sauvegardées
    this.loadFromStorage();

    // Attacher les événements
    this.bindEvents();

    // Charger la première étape ou reprendre
    this.loadStep(this.currentStep);

    // Mettre à jour la barre de progression
    this.updateProgress();
  }

  bindEvents() {
    // Délégation d'événements pour les boutons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-choisir")) {
        this.handleChoice(e.target);
      }
      if (e.target.classList.contains("btn-prev")) {
        this.previousStep();
      }
      if (e.target.classList.contains("btn-restart")) {
        this.restart();
      }
    });
  }

  async loadStep(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    // Gérer les étapes dynamiques
    let file = step.file;

    // Étape engagement dynamique selon le rôle
    if (step.id === "engagement") {
      const role = this.responses.quizRole;
      if (role === "eleve") {
        file = "eleve-implication.html";
      } else if (role === "parent") {
        file = "parent-eleve.html";
      } else {
        // Passer cette étape pour public/personnel
        this.currentStep++;
        this.loadStep(this.currentStep);
        return;
      }
    }

    // Charger le contenu HTML
    if (file) {
      try {
        const response = await fetch(`/quiz/partial/${file}`);
        if (response.ok) {
          const html = await response.text();
          const mainContent = document.getElementById("main-content");
          if (mainContent) {
            mainContent.innerHTML = html;
          }
        }
      } catch (error) {
        console.error("Erreur de chargement:", error);
      }
    }

    // Gérer l'affichage des résultats
    if (step.id === "resultats") {
      this.showResults();
    }

    this.updateProgress();
    this.saveToStorage();
  }

  handleChoice(button) {
    const index = button.dataset.index;
    const reponse = button.dataset.reponse;

    // Sauvegarder la réponse
    this.responses[index] = reponse;

    // Calculer le score
    this.calculateScore(index, reponse);

    // Passer à l'étape suivante
    this.nextStep();
  }

  calculateScore(index, reponse) {
    const scoreData = this.scoring[index]?.[reponse];
    if (scoreData) {
      if (scoreData.openSource) {
        this.scores.openSource += scoreData.openSource;
      }
      if (scoreData.proprietary) {
        this.scores.proprietary += scoreData.proprietary;
      }
      this.scores.total++;
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.loadStep(this.currentStep);
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.loadStep(this.currentStep);
    }
  }

  updateProgress() {
    const progress = (this.currentStep / (this.steps.length - 1)) * 100;
    const progressBar = document.querySelector(".quiz-progress-bar");
    const stepIndicator = document.querySelector(".quiz-step-indicator");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (stepIndicator) {
      stepIndicator.textContent = `Étape ${this.currentStep + 1} sur ${
        this.steps.length
      }`;
    }
  }

  showResults() {
    const resultsList = document.getElementById("results-list");
    if (!resultsList) return;

    resultsList.innerHTML = "";

    // Calculer le pourcentage open-source
    const totalPoints = this.scores.openSource + this.scores.proprietary;
    const openSourcePercent =
      totalPoints > 0
        ? Math.round((this.scores.openSource / totalPoints) * 100)
        : 0;

    // Afficher le score global
    const scoreDiv = document.createElement("div");
    scoreDiv.className = "results-score";
    scoreDiv.textContent = `${openSourcePercent}%`;
    resultsList.parentElement.insertBefore(scoreDiv, resultsList);

    const messageDiv = document.createElement("div");
    messageDiv.className = "results-message";

    if (openSourcePercent >= 70) {
      messageDiv.textContent =
        "🎉 Excellent ! Votre établissement est bien engagé dans le libre !";
    } else if (openSourcePercent >= 40) {
      messageDiv.textContent =
        "🔄 Votre établissement est en transition vers le libre.";
    } else {
      messageDiv.textContent =
        "💡 Découvrez comment NIRD peut aider votre établissement !";
    }
    resultsList.parentElement.insertBefore(messageDiv, resultsList);

    // Afficher les détails des réponses
    Object.entries(this.responses).forEach(([key, value]) => {
      const scoreData = this.scoring[key]?.[value];
      if (scoreData && scoreData.label) {
        const li = document.createElement("li");

        // Déterminer la classe CSS
        if (scoreData.openSource && scoreData.openSource > 0) {
          li.className = "";
          li.innerHTML = `
                        <span class="result-icon">✅</span>
                        <span class="result-text">
                            <strong>${this.getQuestionLabel(key)}</strong>
                            <span>${scoreData.label}</span>
                        </span>
                    `;
        } else if (scoreData.proprietary && scoreData.proprietary > 0) {
          li.className = "bad";
          li.innerHTML = `
                        <span class="result-icon">⚠️</span>
                        <span class="result-text">
                            <strong>${this.getQuestionLabel(key)}</strong>
                            <span>${scoreData.label}</span>
                        </span>
                    `;
        } else {
          li.className = "neutral";
          li.innerHTML = `
                        <span class="result-icon">ℹ️</span>
                        <span class="result-text">
                            <strong>${this.getQuestionLabel(key)}</strong>
                            <span>${scoreData.label}</span>
                        </span>
                    `;
        }

        resultsList.appendChild(li);
      }
    });

    // Ajouter les boutons d'action
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "results-actions";
    actionsDiv.innerHTML = `
            <a href="/quiz" class="btn-results btn-restart">🔄 Recommencer le quiz</a>
            <a href="/applications" class="btn-results btn-discover">💻 Découvrir les applications</a>
            <a href="/demarche" class="btn-results btn-discover">📚 La démarche NIRD</a>
        `;
    resultsList.parentElement.appendChild(actionsDiv);
  }

  getQuestionLabel(key) {
    const labels = {
      quizRole: "Votre rôle",
      quizEngagement: "Engagement",
      quizTechnique: "Implication technique",
      quizOS: "Système d'exploitation",
      quizNavigateur: "Navigateur",
      quizRecherche: "Moteur de recherche",
      quizBureautique: "Suite bureautique",
      quizENT: "ENT",
      quizMail: "Messagerie",
    };
    return labels[key] || key;
  }

  saveToStorage() {
    const data = {
      currentStep: this.currentStep,
      responses: this.responses,
      scores: this.scores,
    };
    localStorage.setItem("quizNIRD", JSON.stringify(data));
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem("quizNIRD");
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStep = data.currentStep || 0;
        this.responses = data.responses || {};
        this.scores = data.scores || {
          openSource: 0,
          proprietary: 0,
          total: 0,
        };
      }
    } catch (error) {
      console.error("Erreur de chargement localStorage:", error);
    }
  }

  restart() {
    this.currentStep = 0;
    this.responses = {};
    this.scores = { openSource: 0, proprietary: 0, total: 0 };
    localStorage.removeItem("quizNIRD");
    this.loadStep(0);
  }
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".quiz-container")) {
    window.quizNIRD = new QuizNIRD();
  }
});
