var markersstep = []; // Tableau pour stocker les marqueurs

document.getElementById('step-checkbox').addEventListener('change', function(event) {
    const baseURL2 = 'https://services.sandre.eaufrance.fr/geo/odp';

    // Construction de l'URL
    const urlbb2 = `${baseURL2}?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0`
        + `&TYPENAMES=sa:SysTraitementEauxUsees&COUNT=80000&SRSNAME=urn:ogc:def:crs:EPSG::4326`
        + `&BBOX=${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},urn:ogc:def:crs:EPSG::4326`;

    console.log('URL générée2:', urlbb2);

    // Icône marron STEP
    const customIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2" fill="#d4a37a" />
            </svg>
        `),
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });

    // Fetch des données
    fetch(urlbb2)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête réseau : ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            // Parser le XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const features = xmlDoc.getElementsByTagName('sa:SysTraitementEauxUsees');

            // Réinitialiser le tableau de marqueurs
            markersstep = [];

            // Extraire les données et créer des marqueurs
            Array.from(features).forEach(feature => {
                const lat = parseFloat(feature.getElementsByTagName('sa:LatWGS84OuvrageDepollution')[0]?.textContent);
                const lon = parseFloat(feature.getElementsByTagName('sa:LongWGS84OuvrageDepollution')[0]?.textContent);
                const info = `<strong>Nom :</strong> ${feature.getElementsByTagName('sa:NomOuvrageDepollution')[0]?.textContent || 'Nom non disponible'}`;
                
                if (lat && lon) {
                    const marker = L.marker([lat, lon], { icon: customIcon });
                    marker.bindPopup(info);
                    markersstep.push(marker); // Ajouter le marqueur au tableau
                }
            });

            // Ajouter ou retirer les marqueurs de la carte selon l'état de la case à cocher
            if (event.target.checked) { // On coche
                markersstep.forEach(marker => marker.addTo(stepLayer));
            } else { // On décoche
                stepLayer.clearLayers(); // On retire tous les marqueurs
            }

            console.log('Données WFS:', xmlDoc);
        })
        .catch(error => console.error('Error fetching WFS data:', error));
});