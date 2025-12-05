function posToString(lat, lon){
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setFloat64(0, lat, true);
    view.setFloat64(8, lon, true);
    let rawString = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) rawString += String.fromCharCode(bytes[i]);
    return btoa(rawString);
}

async function computeCharForLocation(lat, lon) {
    try {
        // 1. On prépare les données de position
        const posString = posToString(lat, lon);
        const msgBuffer = new TextEncoder().encode(posString);

        // 2. On calcule le SHA-256 (ArrayBuffer brut)
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        // 3. On convertit le buffer brut directement en chaîne binaire
        // (C'est l'étape clé qu'on sautait avant)
        const hashArray = new Uint8Array(hashBuffer);
        let binaryString = "";
        // On ne prend que les 3 premiers octets, ça suffit pour avoir le premier caractère Base64
        for (let i = 0; i < 3; i++) {
            binaryString += String.fromCharCode(hashArray[i]);
        }

        // 4. On convertit en Base64
        const base64 = btoa(binaryString);

        // 5. On retourne le premier caractère
        return base64.charAt(0);

    } catch (e) {
        console.error(e);
        return "?";
    }
}