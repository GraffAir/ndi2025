// Récupère le paramètre "page" dans l'URL
const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.get('page') || 'debut'; // Par défaut : "accueil"
console.log(page);
console.log("Ceci est un test!");

// Agit comme un routeur
fetch(`pages/${page}.html`)
    .then(response => {
        if (!response.ok) throw new Error('Page introuvable');
        console.log(response.text);
        return response.text();
    })
    .then(html => {
        document.getElementById('main-content').innerHTML = html;
        gererChoix();
    })
    .catch(err => {
        console.error('Erreur :', err);
        document.getElementById('main-content').innerHTML = '<p>Page introuvable.</p>';
    });

function gererChoix() {
    document.querySelectorAll('.btn-choisir').forEach(button => {
        button.addEventListener('click', () => {
            const reponse = button.getAttribute('data-reponse');
            const index = button.getAttribute('data-index');
            sessionStorage.setItem(index, reponse);
            naviguer()
        });
    });
}

function naviguer(){
    console.log("On navigue vers : "+page);
    const role = sessionStorage.getItem("quizRole");
    switch (page){
        case "quiz/debut":
            switch (role){
                case "parent":
                    window.location.href = "template.html?page=quiz/parent-eleve";
                    break;
                case "personnel":
                    window.location.href = "template.html?page=quiz/systeme-informatique";
                    break;
                default:
                    window.location.href = "template.html?page=quiz/systeme-exploitation";
            }
            break;
        case "quiz/parent-eleve":
            window.location.href = "template.html?page=quiz/systeme-exploitation";
            break;
        case "quiz/systeme-informatique":
            if (sessionStorage.getItem("quizTechnique") == "oui"){
                window.location.href = "template.html?page=quiz/pare-feu";
            } else {
                window.location.href = "template.html?page=quiz/systeme-exploitation";
            }
            break;
        case "quiz/ent":
            window.location.href = "template.html?page=quiz/"+ (role === "personnel" ? "messagerie" : "bureautique");
            break;
        case "quiz/messagerie":
            window.location.href = "template.html?page=quiz/bureautique";
            break;
        case "quiz/bureautique":
            window.location.href = "template.html?page=quiz/navigateur";
            break;
        default:
            window.location.href = "template.html?page=quiz/debut";
    }
}