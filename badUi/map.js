// --- Variables Globales ---
let map;
let gridLayer;
let userMarker = null;
let currentGridDrawId = 0; // Pour gérer l'annulation des dessins asynchrones obsolètes
const GRID_SIZE = 0.0002; // ~20 mètres

// --- Fonction d'affichage des erreurs ---
function showError(msg) {
    console.error("Erreur :", msg);
    const box = document.getElementById('error-box');
    if (box) {
        box.style.display = 'block';
        box.innerHTML += "⚠️ " + msg + "<br>";
    }
}

// --- Utilitaire Mathématique : Centre de Case Stable ---
// Garantit que n'importe quel point dans une case renvoie EXACTEMENT le même centre
function getGridCenter(lat, lon) {
    // 1. "Snap" au coin bas-gauche
    const rawLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
    const rawLon = Math.floor(lon / GRID_SIZE) * GRID_SIZE;

    // 2. Décalage au centre + Arrondi pour tuer les flottants (ex: 48.00000004)
    return {
        lat: parseFloat((rawLat + (GRID_SIZE / 2)).toFixed(6)),
        lon: parseFloat((rawLon + (GRID_SIZE / 2)).toFixed(6))
    };
}

// --- Initialisation de Leaflet ---
if (typeof L === 'undefined') {
    showError("Erreur : La librairie Leaflet n'a pas pu être chargée.");
} else {
    try {
        // Initialisation sur Paris (valeur par défaut avant GPS)
        map = L.map('map').setView([48.8566, 2.3522], 18);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        gridLayer = L.layerGroup().addTo(map);

        // Redessine quand on bouge
        map.on('moveend', drawGrid);

        console.log("Carte initialisée. Démarrage...");

        // Test HTTPS immédiat
        if (!window.isSecureContext && location.hostname !== "localhost") {
            showError("ATTENTION : Vous n'êtes pas en HTTPS. Le GPS sera bloqué.");
        }

        drawGrid();

    } catch (e) {
        showError("Crash Initialisation : " + e.message);
    }
}

// --- Dessin de la Grille (Corrigé) ---
async function drawGrid() {
    if (!map) return;

    // Si on est trop haut, on n'affiche rien pour ne pas faire ramer
    if (map.getZoom() < 18) {
        gridLayer.clearLayers();
        return;
    }

    // Incrémenter l'ID pour invalider les dessins précédents qui seraient encore en cours de calcul
    currentGridDrawId++;
    const myDrawId = currentGridDrawId;

    gridLayer.clearLayers();

    const bounds = map.getBounds();

    // Calcul des bornes alignées sur la grille
    const startLat = Math.floor(bounds.getSouth() / GRID_SIZE) * GRID_SIZE;
    const startLon = Math.floor(bounds.getWest() / GRID_SIZE) * GRID_SIZE;

    // Boucles avec marge de sécurité (+GRID_SIZE) pour couvrir tout l'écran
    for (let lat = startLat; lat < bounds.getNorth() + GRID_SIZE; lat += GRID_SIZE) {
        for (let lon = startLon; lon < bounds.getEast() + GRID_SIZE; lon += GRID_SIZE) {

            // Utilisation de notre fonction stable pour trouver le centre
            // On ajoute un epsilon (GRID_SIZE/2) pour être sûr d'être "dans" la case lors du calcul
            const center = getGridCenter(lat + (GRID_SIZE / 2), lon + (GRID_SIZE / 2));

            // 1. Dessin du rectangle bleu (immédiat)
            // On redessine le rectangle à partir du centre pour être parfaitement aligné
            const southWest = [center.lat - (GRID_SIZE/2), center.lon - (GRID_SIZE/2)];
            const northEast = [center.lat + (GRID_SIZE/2), center.lon + (GRID_SIZE/2)];

            L.rectangle([southWest, northEast], {
                color: "#3388ff", weight: 1, fillOpacity: 0.05, interactive: false
            }).addTo(gridLayer);

            // 2. Calcul et affichage de la lettre (Asynchrone)
            if (typeof computeCharForLocation === "function") {
                computeCharForLocation(center.lat, center.lon)
                    .then(char => {
                        // SI l'utilisateur a bougé la carte entre temps (nouvel ID), on annule
                        if (myDrawId !== currentGridDrawId) return;

                        L.marker([center.lat, center.lon], {
                            icon: L.divIcon({
                                className: 'grid-label',
                                html: `<b style="background:white; padding:2px;">${char}</b>`, // Petit style pour lisibilité
                                iconSize: [20, 20],
                                iconAnchor: [10, 10] // Centrage parfait du texte
                            }),
                            interactive: false
                        }).addTo(gridLayer);
                    })
                    .catch(err => console.warn("Erreur calcul lettre:", err));
            }
        }
    }
}

// --- Logique GPS ---

function showMyLocation() {
    if (!("geolocation" in navigator)) {
        showError("Pas de géolocalisation disponible dans ce navigateur.");
        return;
    }

    console.log("🔍 Recherche GPS en cours...");
    let firstFix = true;

    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy || 5000; // Par défaut grand si inconnu

            console.log(`📍 GPS Update: ${lat.toFixed(5)}, ${lon.toFixed(5)} (Précision: ${Math.round(accuracy)}m)`);

            // Filtre : Ignorer le bug (0,0) et les positions absurdes (>100km de saut soudain si IP change)
            if (lat === 0 && lon === 0) return;

            // Mise à jour visuelle
            if (!userMarker) {
                // Groupe : Cercle de précision (Bleu) + Point exact (Rouge)
                const accCircle = L.circle([lat, lon], { radius: accuracy, color: '#00aaff', weight: 1, fillOpacity: 0.15 });
                const dotMarker = L.circleMarker([lat, lon], { color: 'white', weight: 2, fillColor: '#f03', fillOpacity: 1, radius: 6 });

                userMarker = L.layerGroup([accCircle, dotMarker]).addTo(map);

                // Petit popup informatif au premier affichage
                dotMarker.bindPopup(`Précision: ~${Math.round(accuracy)}m`).openPopup();
            } else {
                const layers = userMarker.getLayers();
                layers[0].setLatLng([lat, lon]).setRadius(accuracy); // Cercle
                layers[1].setLatLng([lat, lon]); // Point
            }

            // Logique de centrage "intelligente"
            // On centre seulement au tout début OU si on a enfin une super précision (<50m) après une mauvaise
            if (firstFix) {
                map.setView([lat, lon], 18);
                firstFix = false;
            }

            // On rafraichit la grille autour du joueur
            drawGrid();
        },
        (error) => {
            console.error("Erreur GPS native:", error);
            let msg = "Erreur inconnue.";
            switch(error.code) {
                case 1: msg = "Accès refusé par l'utilisateur."; break;
                case 3: msg = "Délai d'attente dépassé."; break;
            }
            showError("GPS : " + msg);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

// --- Fonction pour récupérer la lettre sous le joueur (Bouton) ---
async function getMyChar() {
    if (!userMarker) {
        return;
    }

    // On récupère la position ACTUELLE affichée (le point rouge)
    // Pas besoin de refaire un getCurrentPosition qui prendrait du temps
    const layers = userMarker.getLayers();
    const lat = layers[1].getLatLng().lat;
    const lon = layers[1].getLatLng().lng;

    // On utilise la MEME mathématique que drawGrid
    const center = getGridCenter(lat, lon);

    if (typeof computeCharForLocation === "function") {
        const char = await computeCharForLocation(center.lat, center.lon);
        return char;
    } else {
        alert("Fonction de calcul introuvable.");
    }
}

async function afficherCharActuel() {
    let text = document.getElementById("charPosActuelle");
    text.value = await getMyChar();
}

async function validerChar() {
    let passwd = document.getElementById("mdp");
    passwd.value = passwd.value.concat(await getMyChar());
}
