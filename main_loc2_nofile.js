
proj4.defs("EPSG:2154", "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

//On définit les variables pour pouvoir les utiliser dans les fichiers fonctions

var map = L.map("map").setView([46.603354, 1.888334], 7);
var pollutionLayer = L.layerGroup().addTo(map);
var stepLayer = L.layerGroup().addTo(map);
var jsonData = null;
var bbox;
var greenIcon = new L.Icon({
iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});
var lastGeoJSON4326 = null;
var lastPollueurspoints = null;
var lastStepspoints = null;
var currentPolygon = null;
var currentBBox = null;
var markerbv = null;

import { sendPostRequest } from './postRequestob.js';


//

        function initializeMap() {
 ///////////////////
            if (typeof Gp === 'undefined') {
                console.error("Gp is not defined. Ensure the Geoportal script is loaded.");
                return;
            }
            Gp.Services.getConfig({
                apiKey: "essentiels",
                onSuccess: function(config) {
                    console.log("Configuration retrieved successfully:", config);
                    go();
                },
                onError: function(error) {
                    console.error("Failed to retrieve configuration:", error);
                }
            });
            function go() {
                enableGeolocation(map);
                var myRenderer = L.canvas({ padding: 0.5 });

// Gestion du chargement du fichier GeoJSON quand on clique file-input

                var lyrOrtho = L.geoportalLayer.WMTS({
                    layer: "ORTHOIMAGERY.ORTHOPHOTOS"
                });

                var lyrMaps = L.geoportalLayer.WMTS({
                    layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
                }, {
                    opacity: 0.7
                }).addTo(map);

                var lyrOSM = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                });

                var baseLayers = {
                    "OpenStreetMap": lyrOSM,
                    "Orthophotos": lyrOrtho,
                    "Plan IGN": lyrMaps
                };

                L.control.layers(baseLayers).addTo(map);
            //}
///////////////
           

               
    function convertGeoJSON(geojson, fromProj, toProj) {
                    var newGeoJSON = JSON.parse(JSON.stringify(geojson));
                    newGeoJSON.features.forEach(feature => {
                        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                            feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
                                return polygon.map(ring => {
                                    return ring.map(coord => {
                                        var convertedCoord = proj4(fromProj, toProj, coord);
                                        return [convertedCoord[0], convertedCoord[1]];
                                    });
                                });
                            });
                        }
                    });
                    return newGeoJSON;
                }


////////////////////////////////////////////////////////////////////////

//                                                                                                //         MAP ON CLICK  //

////////
map.on('click', function(e) {
                    var latlng = e.latlng;
                    var coords = proj4('EPSG:4326', 'EPSG:2154', [latlng.lng, latlng.lat]);

                    sendPostRequest(coords);
                   //si il y avait déjà un point BV on l'enlève pour qu'il n'y en ait qu'un
                    if (markerbv) {
                        map.removeLayer(markerbv);
                    }
                    markerbv = L.marker([latlng.lat, latlng.lng], { icon: greenIcon }).addTo(map);   //on rajoute la couche recalculée à chaque fois même si et c'est improbable
                    //le clic était le même 
                }        
            );
            map.on('zoomend', function() {
                    var zoomLevel = map.getZoom();
                    document.getElementById('zoom-level').textContent = "Le niveau de zoom est de " + zoomLevel + ". Le niveau conseillé pour choisir un point est de 13 au moins.";
                });




///


///
//                                                                                                  SEND POST REQUEST FOR BV
sendPostRequest(coords, map);




                
                function calculateBBoxFromGeoJSON(geojson) {
                    var bbox = [];
                    geojson.features.forEach(feature => {
                        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                            feature.geometry.coordinates.forEach(polygon => {
                                polygon.forEach(ring => {
                                    ring.forEach(coord => {
                                        if (bbox.length === 0) {
                                            bbox = [coord[0], coord[1], coord[0], coord[1]];
                                        } else {
                                            bbox[0] = Math.min(bbox[0], coord[0]);
                                            bbox[1] = Math.min(bbox[1], coord[1]);
                                            bbox[2] = Math.max(bbox[2], coord[0]);
                                            bbox[3] = Math.max(bbox[3], coord[1]);
                                        }
                                    });
                                });
                            });
                        }
                    });
                    return bbox.length ? bbox : null;
                }

//                                                                   //                            //     EVENT DOWNLOAD  //
//////////////////////////////////////////////////////////////////////// 

document.getElementById('download-button').addEventListener('click', function() {
                    if (lastGeoJSON4326) {
                        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastGeoJSON4326));
                        var downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", "bassin_versant_EPSG4326.geojson");
                        document.body.appendChild(downloadAnchorNode); // Required for Firefox
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    } else {
                        alert("Aucun GeoJSON disponible à télécharger.");
                    }
                });
////////////////////////////////////////////////////////////////////////  EVENT TOPAGE DEPT

let topage41Layer = null;

document.getElementById('checkbox-41').addEventListener('change', function(event) {
    if (event.target.checked) {
        fetch('./topage41.json')
            .then(response => response.json())
            .then(data => {
                topage41Layer = L.geoJSON(data, {
                    style: function (feature) {
                        return { color: "#8B4513" };
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Erreur lors du chargement du fichier topage41.json:', error));
    } else {
        if (topage41Layer) {
            map.removeLayer(topage41Layer);
        }
    }
});


//                                                                   //                              //   EVENT BBOX  //
//////////////////////////////////////////////////////////////////////// 
                document.getElementById('bboxbvorange-checkbox').addEventListener('change', function() {
                    if (this.checked && lastGeoJSON4326) {
                        var bbox = calculateBBoxFromGeoJSON(lastGeoJSON4326);
                        console.log("BBOX (checkbox change):", bbox);
                        if (bbox) {
                            var bboxPolygon = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Polygon",
                                    "coordinates": [[
                                        [bbox[0], bbox[1]],
										[bbox[2], bbox[1]],
                                        [bbox[2], bbox[3]],
                                        [bbox[0], bbox[3]],
                                        [bbox[0], bbox[1]]
                                    ]]
                                }
															
                            };

                            if (currentBBox) {
                                map.removeLayer(currentBBox);
                            }

                            currentBBox = L.geoJSON(bboxPolygon, {
                                style: {
                                    color: 'orange',
                                    fillColor: 'orange',
                                    fillOpacity: 0.5
                                }
                            }).addTo(map);
                        }
                    } else if (currentBBox) {
                        map.removeLayer(currentBBox);
                        currentBBox = null;
                    }
                }
            
            
            
            );
//////////                                                                                               FIN EVENT DOWNLOAD ET BBOX



/////////////////defaut couleur
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//ecouteur ETAB POLLUEURS
document.getElementById('pollueurs-checkbox').addEventListener(
  'change', function(event) {

    ////SI la variable  lastpollpoints a déjà été initialisée
const baseURL = 'https://georisques.gouv.fr/services';
const params = new URLSearchParams({
    language: 'fre',
    SERVICE: 'WFS',
    REQUEST: 'GetFeature',
    VERSION: '2.0.0',
    TYPENAMES: 'ms:ETABLISSEMENTS_POLLUEURS',
    COUNT: '80000',
    SRSNAME: 'urn:ogc:def:crs:EPSG::4326',
    BBOX: `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},urn:ogc:def:crs:EPSG::4326`,
    outputFormat: 'application/json; subtype=geojson; charset=utf-8'
});
// Construire l'URL complète avec les paramètres encodés
const urlbb = `${baseURL}?${params.toString()}`;
console.log('URL générée:', urlbb);
// Utilisez la fonction avec l'URL du fichier ZIP
fetch(urlbb)
   .then(response => response.json())
                     .then(data => {
                        jsonData = data;
                        console.log("Parsed GeoJSON:", data);
						console.log("valeurbbox or1",bbox[0]);
									
    console.log('Données WFS:', data);
 							
                        var markerspoll = parseWFSData(data);
                        lastpollpoints=markerspoll;
///
///
                        if (document.getElementById('pollueurs-checkbox').checked) {
                            markerspoll.forEach(marker => marker.addTo(pollutionLayer));
                                     
                        }
                        document.getElementById('pollueurs-checkbox').addEventListener('change', function(event) {
                            if (event.target.checked) {///on coche
///si il y avait déjà une couche on la nettoie
///
                                markerspoll.forEach(marker => marker.addTo(pollutionLayer));
								console.log("box checkée",bbox[0]); 
                            } else {//on decoche
                               pollutionLayer.clearLayers();//on affiche plus
                           
                            }
                        });
                    })
                    .catch(error => console.error('Error fetching WFS data:', error));
   
  }
)///fin de l'écouteur sur le clic afficher les étab polluers



//ecouteur STEP //dans fichier event
  

/////////
            function parseWFSData(data) {
                var markers = [];
                var features = data.features;

                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    var geometry = feature.geometry;
                    var properties = feature.properties;

                    if (geometry.type === "Point") {
                        var coords = geometry.coordinates;
                        var marker = L.marker([coords[1], coords[0]]).bindPopup(Object.keys(properties).map(key => `${key}: ${properties[key]}`).join('<br>'));
                        markers.push(marker);
                    }
                }

                return markers;
            }

           
			


            document.getElementById('download-json-button').addEventListener('click', function() {
                if (jsonData) {
                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
                    var downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "data.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                } else {
                    alert('Aucune donnée JSON disponible pour le téléchargement.');
                }
            });

            document.getElementById('download-csv-button').addEventListener('click', function() {
                if (jsonData) {
                    var csvContent = "data:text/csv;charset=utf-8,";
                    var headers = ["latitude", "longitude", ...Object.keys(jsonData.features[0].properties)];
                    csvContent += headers.join(",") + "\n";

                    jsonData.features.forEach(feature => {
                        if (feature.geometry.type === "Point") {
                            var coords = feature.geometry.coordinates;
                            var properties = Object.values(feature.properties).map(value => `"${value}"`);
                            csvContent += [coords[1], coords[0], ...properties].join(",") + "\n";
                        }
                    });

                    var encodedUri = encodeURI(csvContent);
                    var downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", encodedUri);
                    downloadAnchorNode.setAttribute("download", "data.csv");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                } else {
                    alert('Aucune donnée CSV disponible pour le téléchargement.');
                }
            });

           // fetchWFSData();

        }
    
    
    
    
    
        

    
    }
//FIN initializeMap();

      





        window.addEventListener('load', initializeMap);

        function enableGeolocation(map) {
    var geoMarker = null;  // Initialement aucun marqueur

    // Fonction pour afficher la position de l'utilisateur
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        // Si aucun marqueur n'existe, on le crée
        if (!geoMarker) {
            geoMarker = L.marker(e.latlng, {
                icon: L.icon({
                    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                })
            }).addTo(map);
        }

        // Mettre à jour la position et le contenu du popup
        geoMarker.setLatLng(e.latlng)
            .setPopupContent("Vous êtes ici. Précision: " + Math.round(radius) + " mètres.")
            .openPopup();

        // Centrer la carte sur la position de l'utilisateur
        map.setView(e.latlng, 13);
    }

    // Fonction appelée lorsque la géolocalisation échoue
    function onLocationError(e) {
        switch (e.code) {
            case 1:
                alert("L'utilisateur a refusé la demande de géolocalisation.");
                break;
            case 2:
                alert("La position est indisponible.");
                break;
            case 3:
                alert("Le délai d'attente pour obtenir la localisation a expiré.");
                break;
            default:
                alert("Une erreur inconnue s'est produite.");
        }
    }

    // Options de géolocalisation
    var geoOptions = {
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true, // Essayer d'obtenir la meilleure précision
        timeout: 10000, // Temps maximum avant d'abandonner (10s)
        maximumAge: 0 // Ne pas utiliser une position en cache
    };

    // Activer la géolocalisation
    map.locate(geoOptions);

    // Écouter les événements de géolocalisation
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
}
       // var myRenderer = L.canvas({ padding: 0.5 });

// Gestion du chargement du fichier GeoJSON


    // Fonction pour créer le contenu du popup
    function createPopupContent(properties) {
        var content = '<b>Propriétés de l\'objet :</b><br>';
        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                content += '<b>' + key + ':</b> ' + properties[key] + '<br>';
            }
        }
        return content;
    }







