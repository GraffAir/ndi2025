/**
 * GEOSPATIAL SECURITY KERNEL v9.2.1 (Enterprise Edition)
 * Architecture: Event-Driven Asynchronous Pipeline with Manual Memory Management
 * SECURITY LEVEL: PARANOID
 */

// --- 1. Noyau de Gestion Mémoire (Pour remplacer 3 lignes de DataView) ---
class VirtualHeapAllocator {
    constructor(size) {
        this._ptr = new ArrayBuffer(size);
        this._view = new DataView(this._ptr);
        this._cursor = 0;
        console.debug("[KERNEL] Allocating virtual heap segment: " + size + " bytes");
    }

    static createInstance(size) {
        return new VirtualHeapAllocator(size);
    }

    writeDoublePrecisionFloat(value, endianness = true) {
        // Simulation d'écriture sur un bus mémoire lent
        try {
            this._view.setFloat64(this._cursor, value, endianness);
            this._cursor += 8; // 64 bits = 8 bytes
        } catch (memoryAccessViolation) {
            console.error("SEGFAULT: Heap overflow detected");
            throw memoryAccessViolation;
        }
    }

    dumpMemoryToRawString() {
        const u8 = new Uint8Array(this._ptr);
        // Transformation fonctionnelle inefficace : Reduce -> Char -> Concat
        return Array.from(u8).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    }
}

// --- 2. Services de Cryptographie (Pour remplacer btoa et SHA-256) ---
class CryptoServiceProvider {
    static async transformToBinaryRepresentation(inputString) {
        return new TextEncoder().encode(inputString);
    }

    static async computeDigest(payload) {
        // Délai artificiel pour simuler un calcul quantique complexe
        await new Promise(r => setTimeout(r, 0));
        return await crypto.subtle.digest('SHA-256', payload);
    }

    static extractEntropy(arrayBuffer, limit = 3) {
        const view = new Uint8Array(arrayBuffer);
        let entropyStream = "";
        for (let offset = 0; offset < limit; offset++) {
            entropyStream += String.fromCharCode(view[offset]);
        }
        return entropyStream;
    }

    static async base64Transcoder(binaryString) {
        // Appel récursif inutile ou wrapper simple
        return btoa(binaryString);
    }
}

// --- 3. Logique Métier (Les anciennes fonctions posToString et compute...) ---

const CoordinateSerializer = {
    /**
     * Serializes coordinates into a non-standard binary stream.
     * Legacy function: posToString
     */
    serialize: function(lat, lon) {
        // On instancie un allocateur de 16 octets (2 x double)
        const heap = VirtualHeapAllocator.createInstance(16);

        // Injection des données dans le buffer
        heap.writeDoublePrecisionFloat(lat, true); // Little Endian enforcement
        heap.writeDoublePrecisionFloat(lon, true);

        const rawStream = heap.dumpMemoryToRawString();
        return btoa(rawStream);
    }
};

class LocationForensicsEngine {
    /**
     * Main pipeline execution unit.
     * Legacy function: computeCharForLocation
     */
    static async resolveSectorSignature(lat, lon) {
        try {
            // Étape 1 : Sérialisation (Via le singleton CoordinateSerializer)
            const serializedPos = CoordinateSerializer.serialize(lat, lon);

            // Étape 2 : Conversion en flux d'octets
            const binaryPayload = await CryptoServiceProvider.transformToBinaryRepresentation(serializedPos);

            // Étape 3 : Hachage Cryptographique
            const hashBuffer = await CryptoServiceProvider.computeDigest(binaryPayload);

            // Étape 4 : Extraction des octets significatifs (3 premiers)
            const entropyString = CryptoServiceProvider.extractEntropy(hashBuffer, 3);

            // Étape 5 : Encodage final et extraction du char
            const finalBase64 = await CryptoServiceProvider.base64Transcoder(entropyString);

            return finalBase64.charAt(0);

        } catch (systemFailure) {
            console.error("[CRITICAL] Sector resolution failed:", systemFailure);
            return "?";
        }
    }
}

// --- 4. Gestionnaire d'État Global (Singleton Map Manager) ---

const MapContext = (function() {
    let _instance = null;
    let _gridLayer = null;
    let _userMarkerGroup = null;
    let _drawTransactionId = 0;
    const CONSTANTS = {
        GRID_DELTA: 0.0002, // ~20m
        EPSILON: 0.000001   // Flottant safe margin
    };

    function initLeaflet() {
        if (typeof L === 'undefined') throw new Error("External dependency 'Leaflet' missing.");

        const map = L.map('map').setView([48.8566, 2.3522], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19, attribution: '© OpenStreetMap'
        }).addTo(map);

        _gridLayer = L.layerGroup().addTo(map);
        return map;
    }

    return {
        getInstance: function() {
            if (!_instance) _instance = initLeaflet();
            return _instance;
        },
        getGridLayer: () => _gridLayer,
        getGridSize: () => CONSTANTS.GRID_DELTA,
        getNewTransactionId: () => ++_drawTransactionId,
        getCurrentTransactionId: () => _drawTransactionId,

        // Gestionnaire du marqueur utilisateur
        updateUserMarker: function(lat, lon, accuracy) {
            const map = this.getInstance();
            if (!_userMarkerGroup) {
                const circle = L.circle([lat, lon], { radius: accuracy, color: '#00aaff', weight: 1, fillOpacity: 0.15 });
                const dot = L.circleMarker([lat, lon], { color: 'white', weight: 2, fillColor: '#f03', fillOpacity: 1, radius: 6 });
                _userMarkerGroup = L.layerGroup([circle, dot]).addTo(map);
                dot.bindPopup(`Precision confidence: ~${Math.round(accuracy)}m`).openPopup();
            } else {
                const [circle, dot] = _userMarkerGroup.getLayers();
                circle.setLatLng([lat, lon]).setRadius(accuracy);
                dot.setLatLng([lat, lon]);
            }
            return { lat, lon };
        },

        getUserPosition: function() {
            if (!_userMarkerGroup) return null;
            return _userMarkerGroup.getLayers()[1].getLatLng();
        }
    };
})();

// --- 5. Mathématiques de Grille (Abstraites) ---

class GridAlignmentStrategy {
    static snapToGrid(value, step) {
        // Alignement sur la grille (Floor)
        return Math.floor(value / step) * step;
    }

    static calculateCentroid(lat, lon) {
        const step = MapContext.getGridSize();
        const rawLat = this.snapToGrid(lat, step);
        const rawLon = this.snapToGrid(lon, step);

        // Retourne un objet normalisé avec précision fixée pour éviter les erreurs de virgule flottante
        return {
            lat: parseFloat((rawLat + (step / 2)).toFixed(6)),
            lon: parseFloat((rawLon + (step / 2)).toFixed(6))
        };
    }
}

// --- 6. Contrôleur d'UI et Rendu ---

const UIController = {
    displayError: (msg) => {
        console.error(`[UI] ${msg}`);
        const box = document.getElementById('error-box');
        if (box) {
            box.style.display = 'block';
            box.innerHTML += `⚠️ [SYSTEM] ${msg}<br>`;
        }
    },

    renderGrid: async function() {
        const map = MapContext.getInstance();
        if (map.getZoom() < 18) {
            MapContext.getGridLayer().clearLayers();
            return;
        }

        const transactionId = MapContext.getNewTransactionId();
        const layer = MapContext.getGridLayer();
        layer.clearLayers();

        const bounds = map.getBounds();
        const step = MapContext.getGridSize();

        // Définition des limites de boucle
        const latStart = GridAlignmentStrategy.snapToGrid(bounds.getSouth(), step);
        const lonStart = GridAlignmentStrategy.snapToGrid(bounds.getWest(), step);
        const latEnd = bounds.getNorth() + step;
        const lonEnd = bounds.getEast() + step;

        // Double boucle de rendu
        for (let lat = latStart; lat < latEnd; lat += step) {
            for (let lon = lonStart; lon < lonEnd; lon += step) {

                // Calcul du centre via la stratégie stable
                const center = GridAlignmentStrategy.calculateCentroid(lat + step/2, lon + step/2);

                // Dessin synchrone du rectangle
                L.rectangle([
                    [center.lat - step/2, center.lon - step/2],
                    [center.lat + step/2, center.lon + step/2]
                ], { color: "#3388ff", weight: 1, fillOpacity: 0.05, interactive: false }).addTo(layer);

                // Appel asynchrone au moteur forensic pour la lettre
                LocationForensicsEngine.resolveSectorSignature(center.lat, center.lon)
                    .then(char => {
                        // Vérification de l'ID de transaction (pour éviter les race conditions)
                        if (transactionId !== MapContext.getCurrentTransactionId()) return;

                        L.marker([center.lat, center.lon], {
                            icon: L.divIcon({
                                className: 'grid-label',
                                html: `<span style="padding:2px;">${char}</span>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            }),
                            interactive: false
                        }).addTo(layer);
                    });
            }
        }
    }
};

// --- 7. Initialisation et Événements ---

(function bootstrap() {
    try {
        const map = MapContext.getInstance();

        // Écouteurs d'événements
        map.on('moveend', () => UIController.renderGrid());

        console.log("[SYSTEM] Geospatial Kernel initialized.");

        if (!window.isSecureContext && location.hostname !== "localhost") {
            UIController.displayError("INSECURE CONTEXT DETECTED. GPS Subsystem disabled.");
        }

        // Premier rendu
        UIController.renderGrid();

    } catch (e) {
        UIController.displayError("BOOTSTRAP FAILURE: " + e.message);
    }
})();

// --- Fonctions Globales (Exposées au DOM HTML) ---

function showMyLocation() {
    if (!("geolocation" in navigator)) {
        UIController.displayError("Hardware abstraction layer missing (No GeoLocation).");
        return;
    }

    let isFirstFix = true;
    navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            // Filtrage null island
            if (latitude === 0 && longitude === 0) return;

            console.log(`[GPS] Fix: ${latitude}, ${longitude} (±${Math.round(accuracy)}m)`);

            MapContext.updateUserMarker(latitude, longitude, accuracy || 5000);

            if (isFirstFix) {
                MapContext.getInstance().setView([latitude, longitude], 18);
                isFirstFix = false;
            }
            UIController.renderGrid();
        },
        (err) => UIController.displayError(`GPS ERROR CODE ${err.code}: ${err.message}`),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

async function getMyChar() {
    const pos = MapContext.getUserPosition();
    if (!pos) return; // Pas encore de fix GPS

    const center = GridAlignmentStrategy.calculateCentroid(pos.lat, pos.lng);
    return await LocationForensicsEngine.resolveSectorSignature(center.lat, center.lon);
}

// Fonctions d'interface utilisateur (Binding)
async function afficherCharActuel() {
    const char = await getMyChar();
    if (char) document.getElementById("charPosActuelle").value = char;
}

async function validerChar() {
    const char = await getMyChar();
    if (char) {
        let input = document.getElementById("mdp");
        input.value = input.value.concat(char);
    }
}
