// WHOMAP, Group 4, COSC2650 Programming Project 1

// ******************************************************************
// globals and helper functions
// ******************************************************************

var document;       // the web page
var window;         // the browser
var alert;          // browser alert messages
var console;        // browser console (for debug purposes)
var interval;       // for delayed instructions
var location;       // link address
var XMLHttpRequest; // api request
var firebase;       // firebase (https://firebase.google.com/)
var google;         // google maps (https://developers.google.com/maps/)
var map;            // google map instance
var marker;         // google map marker
var heatmap;        // google map heatmap layer

var source = 0;     // startup/current data source option number
var latitude = 0;   // startup/current latitude
var longitude = 45; // startup/current longitude
var zoom = 2;       // startup/current zoom
var gradient = 0;   // startup/current colour gradient of heatmap layer
var radius = 500;   // default heatmap radius default

// ranges displayed in legend
// sourced from - https://www.epa.vic.gov.au/your-environment/air/air-pollution
var ranges = [500, 250, 430, 250, 180, 300, 13500];

// return a URL parameter
function getParameter(parameter) {
    "use strict";
    
    var pageURL = window.location.search.substring(1),
        parameters = pageURL.split('&'),
        parameterName,
        i;
    
    for (i = 0; i < parameters.length; i = i + 1) {
        parameterName = parameters[i].split('=');
        if (parameterName[0] === parameter) {
            return parameterName[1];
        }
    }
}

// returns today's UTC date in yyyy-mm-dd format
function getDate() {
    "use strict";
    
    var today = new Date(), day, month, year;
    
    // get current date members
    day = today.getUTCDate();
    month = today.getUTCMonth() + 1;
    year = today.getUTCFullYear();
    
    // concatenate each date member for fully formatted date
    today = day + '-' + month + '-' + year;
    
    return today;
}

// array of api calls for heatmap layer
var apiCalls = [
    "https://api.waqi.info/map/bounds/?latlng=-90,-180,90,180" +
        "&token=c762bd0d8639828c66e77d63c10b6f60ff0cf2de",
    "https://api.openaq.org/v1/latest?parameter=pm25&has_geo=true&limit=10000",
    "https://api.openaq.org/v1/latest?parameter=pm10&has_geo=true&limit=10000",
    "https://api.openaq.org/v1/latest?parameter=o3&has_geo=true&limit=10000",
    "https://api.openaq.org/v1/latest?parameter=no2&has_geo=true&limit=10000",
    "https://api.openaq.org/v1/latest?parameter=so2&has_geo=true&limit=10000",
    "https://api.openaq.org/v1/latest?parameter=co&has_geo=true&limit=10000"
];

// show block element by id
function showElement(elementID) {
    "use strict";
    
    document.getElementById(elementID).style.display = "block";
}

// hide element by id
function hideElement(elementID) {
    "use strict";
    
    document.getElementById(elementID).style.display = "none";
}

// button - show about/contact/donate popup
function showAbout() {
    "use strict";
    
    showElement("transparency");
    showElement("about");
}

// button - show contact us popup
function showContact() {
    "use strict";
    
    showElement("contact");
}

// button - hide contact us popup
function hideContact() {
    "use strict";
    
    hideElement("contact");
}

// hide map marker
function hideMarker(markerID) {
    "use strict";
    
    marker.setMap(null);
    marker = [];
    
    hideElement(markerID);
}

// return radius of heatmap layer based on zoom/range ratio
function getRadius(zoom, range) {
    "use strict";
    
    var rad = range * 5;
    
    if (zoom === 9) {
        rad = rad / 2;
    } else if (zoom === 8) {
        rad = (rad / 2) / 2;
    } else if (zoom === 7) {
        rad = ((rad / 2) / 2) / 2;
    } else if (zoom === 6) {
        rad = (((rad / 2) / 2) / 2) / 2;
    } else if (zoom === 5) {
        rad = ((((rad / 2) / 2) / 2) / 2) / 2;
    } else if (zoom === 4) {
        rad = (((((rad / 2) / 2) / 2) / 2) / 2) / 2;
    } else if (zoom === 3) {
        rad = ((((((rad / 2) / 2) / 2) / 2) / 2) / 2) / 2;
    } else if (zoom === 2) {
        rad = (((((((rad / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2;
    } else if (zoom === 1) {
        rad = ((((((((rad / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2;
    } else if (zoom === 0) {
        rad = (((((((((rad / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2) / 2;
    }
    
    return rad;
}

// return correct heatmap colour gradient
function getGradient() {
    "use strict";
    
    var gradient0 = [
        'rgba(0, 255, 0, 0.5)', 'rgba(0, 255, 0, 1)',
        'rgba(255, 255, 128, 1)', 'rgba(255, 255, 0, 1)',
        'rgba(255, 128, 0, 1)', 'rgba(255, 0, 0, 1)',
        'rgba(255, 0, 128, 1)', 'rgba(128, 0, 255, 1)',
        'rgba(128, 0, 128, 1)', 'rgba(128, 0, 0, 1)',
        'rgba(96, 0, 0, 1)', 'rgba(64, 0, 0, 1)'
    ], gradient1 = [
        'rgba(0, 255, 255, 0.5)', 'rgba(0, 255, 255, 1)',
        'rgba(0, 192, 255, 1)', 'rgba(0, 128, 255, 1)',
        'rgba(0, 64, 255, 1)', 'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 192, 1)', 'rgba(0, 0, 128, 1)',
        'rgba(64, 0, 92, 1)', 'rgba(128, 0, 64, 1)',
        'rgba(192, 0, 32, 1)', 'rgba(255, 0, 0, 1)'
    ], gradient2 = [
        'rgba(95, 0, 195, 0.5)', 'rgba(95, 0, 195, 1)',
        'rgba(175, 0, 255, 1)', 'rgba(220, 0, 255, 1)',
        'rgba(255, 0, 175, 1)', 'rgba(255, 0, 125, 1)',
        'rgba(255, 0, 90, 1)', 'rgba(255, 100, 0, 1)',
        'rgba(255, 165, 0, 1)', 'rgba(255, 195, 0, 1)',
        'rgba(255, 230, 0, 1)', 'rgba(255, 255, 0, 1)'
    ], gradient3 = [
        'rgba(0, 67, 255, 0.5)', 'rgba(0, 67, 255, 1)',
        'rgba(0, 111, 255, 1)', 'rgba(111, 136, 212, 1)',
        'rgba(171, 172, 173, 1)', 'rgba(197, 188, 131, 1)',
        'rgba(201, 186, 73, 1)', 'rgba(228, 209, 0, 1)',
        'rgba(213, 204, 0, 1)', 'rgba(157, 146, 0, 1)',
        'rgba(115, 107, 0, 1)', 'rgba(50, 41, 0, 1)'
    ], gradient4 = [
        'rgba(12, 12, 12, 0.5)', 'rgba(12, 12, 12, 1)',
        'rgba(32, 32, 32, 1)', 'rgba(50, 50, 50, 1)',
        'rgba(74, 74, 74, 1)', 'rgba(98, 98, 98, 1)',
        'rgba(132, 132, 132, 1)', 'rgba(166, 166, 166, 1)',
        'rgba(180, 180, 180, 1)', 'rgba(192, 192, 192, 1)',
        'rgba(205, 205, 205, 1)', 'rgba(245, 245, 245,1)'
    ], gradient5 = [
        'rgba(221, 68, 68, 0.5)', 'rgba(221, 68, 68, 1)',
        'rgba(255, 220, 220, 1)', 'rgba(45, 103, 111, 1)',
        'rgba(25, 75, 79, 1)', 'rgba(0, 0, 0, 1)'
    ]; // add more gradients here...
    
    if (gradient === 0) {
        return gradient0;
    } else if (gradient === 1) {
        return gradient1;
    } else if (gradient === 2) {
        return gradient2;
    } else if (gradient === 3) {
        return gradient3;
    } else if (gradient === 4) {
        return gradient4;
    } else if (gradient === 5) {
        return gradient5;
    } // add more returns here...
}

// adjust gradient of legend element
function updateLegend() {
    "use strict";
    
    var i, gradientString = "linear-gradient(to top, ";
    
    if (getGradient()) {
        for (i = 0; i < getGradient().length - 1; i = i + 1) {
            gradientString = gradientString + getGradient()[i] + ", ";
        }
        gradientString = gradientString +
            getGradient()[getGradient().length - 1] + ")";
    } else {
        gradientString = "linear-gradient(to top, " +
            "rgb(0,255,0), rgb(255,255,0), rgb(255,0,0))";
    }
    
    document.getElementById("layer-gradient").style.backgroundImage =
        gradientString;
}

// ******************************************************************
// waqi api
//
// World Air Quality Index (https://waqi.info/)
// - returning data sourced from USEPA (https://www.epa.gov/)
// ******************************************************************
function waqiAPI(call) {
    "use strict";
    
    var dataPoints = [], i, request = new XMLHttpRequest(),
        lats = [], longs = [], weights = [];
    
    // send api request
    request.open('GET', call);
    
    request.onload = function () {
        var data = JSON.parse(this.response);
        if (request.status >= 200 && request.status < 400) {
            
            // fill lats, longs and weights arrays
            for (i = 0; i < data.data.length; i = i + 1) {
                lats.push(parseFloat(data.data[i].lat).toFixed(4));
                longs.push(parseFloat(data.data[i].lon).toFixed(4));
                weights.push(parseFloat(data.data[i].aqi).toFixed(0));
            }
            
            // remove repeats
            for (i = 0; i < lats.length; i = i + 1) {
                if (i < lats.length - 1) {
                    if (lats.indexOf(lats[i], lats[i + 1]) !== -1 &&
                            longs.indexOf(longs[i], longs[i + 1]) !== -1) {
                        
                        lats.splice(i, 1);
                        longs.splice(i, 1);
                        weights.splice(i, 1);
                    }
                }
            }
            
            // remove weights that are out of range
            for (i = 0; i < lats.length; i = i + 1) {
                if (weights[i] < 0 || weights[i] > ranges[0] ||
                        Number.isNaN(weights[i]) === true) {
                    
                    lats.splice(i, 1);
                    longs.splice(i, 1);
                    weights.splice(i, 1);
                }
            }
            
            // scale results between 0 and 500
            for (i = 0; i < weights.length; i = i + 1) {
                if (weights[i] > 0 && weights[i] < radius) {
                    dataPoints.push({
                        location: new google.maps.LatLng(lats[i], longs[i]),
                        weight: weights[i] / radius
                    });
                }
            }
            
        } else {
            // FOR DEBUG ONLY: display error status of API call
            console.log("waqi: " + data.error);
            
            alert("ERROR: Failed to connect to WAQI api");
        }
    };
    request.send();
    return dataPoints;
}

// ******************************************************************
// openaq api
//
// OpenAQ (https://openaq.org/)
// ******************************************************************
function openaqAPI(call, option) {
    "use strict";
    
    var dataPoints = [], i, request = new XMLHttpRequest(),
        lats = [], longs = [], weights = [], units = [];
    
    // send api request
    request.open('GET', call);
    
    request.onload = function () {
        var data = JSON.parse(this.response);
        if (request.status >= 200 && request.status < 400) {
            
            // fill lats, longs and weights arrays
            for (i = 0; i < data.results.length; i = i + 1) {
                lats.push(parseFloat(data.results[i]
                                     .coordinates.latitude.toFixed(4)));
                longs.push(parseFloat(data.results[i]
                                      .coordinates.longitude.toFixed(4)));
                weights.push(parseFloat(data.results[i]
                                        .measurements[0].value.toFixed(0)));
                units.push(data.results[i].unit);
            }
            
            // remove repeats
            for (i = 0; i < lats.length; i = i + 1) {
                if (i < lats.length - 1) {
                    if (lats.indexOf(lats[i], lats[i + 1]) !== -1 &&
                            longs.indexOf(longs[i], longs[i + 1]) !== -1) {
                        
                        lats.splice(i, 1);
                        longs.splice(i, 1);
                        weights.splice(i, 1);
                        units.splice(i, 1);
                    }
                }
                
                //convert ppm unit values to mg/m3
                if (units[i] === "ppm") {
                    weights[i] = weights[i] * 100;
                }
                
                // remove weight decimal places
                weights[i] = weights[i].toFixed(0);
            }
            
            // remove weights that are out of range
            for (i = 0; i < lats.length; i = i + 1) {
                if (weights[i] < 0 || weights[i] > ranges[option] ||
                        Number.isNaN(weights[i]) === true) {
                    
                    lats.splice(i, 1);
                    longs.splice(i, 1);
                    weights.splice(i, 1);
                    units.splice(i, 1);
                }
            }
            
            // scale results between 0 and ranges[option]
            for (i = 0; i < weights.length; i = i + 1) {
                if (lats[i] !== 0 && longs[i] !== 0 &&
                        weights[i] > 0 && weights[i] < ranges[option]) {
                    dataPoints.push({
                        location: new google.maps.LatLng(lats[i], longs[i]),
                        weight: weights[i] / ranges[option]
                    });
                }
            }
        } else {
            // FOR DEBUG ONLY: display error status of API call
            console.log("openaq: " + data.error);
            
            alert("ERROR: Failed to connect to OpenAQ api");
        }
    };
    request.send();
    return dataPoints;
}

// ******************************************************************
// getPOP api
//
// return population data for a single location
// ******************************************************************
function getPOP(latitude, longitude) {
    "use strict";
    
    var ref = firebase.database().ref(), found = 0;
    
    ref.on("value", function (locations) {
        locations.forEach(function (location) {
            if (location.val().lat.toFixed(1) === latitude.toFixed(1) &&
                    location.val().lng.toFixed(1) === longitude.toFixed(1) &&
                    found === 0) {
                found = found + 1;
                document.getElementById("marker-content").innerHTML =
                    document.getElementById("marker-content").innerHTML +
                    '<p class="marker-body" ' +
                    'style="display: flex; float: left; width: 110px">' +
                    "Population: " + '</p>' +
                    '<p class="marker-body" ' +
                    'style="display: flex; float: right">' +
                    location.val().population +
                    '</p></div>';
            }
        });
    });
}

// return detailed pollution data for a single location
function markerData(pollutionData, lat, lng) {
    "use strict";
    
    var request = new XMLHttpRequest(), call =
        "https://api.waqi.info/feed/geo:" + lat + ";" + lng +
        "/?token=c762bd0d8639828c66e77d63c10b6f60ff0cf2de";

    // send api request
    request.open('GET', call);
    
    request.onload = function () {
        var data = JSON.parse(this.response);
        if (request.status >= 200 && request.status < 400) {
            if (data.data !== "can not connect") {
                document.getElementById("marker-title").innerHTML =
                    data.data.city.name;
                
                // Add data if exists into pollution data array
                if (data.data.aqi) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Air Quality Index:</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            data.data.aqi + '</p>'
                    );
                }
                if (data.data.iaqi.pm25) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Sml. Particles (PM2.5):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            data.data.iaqi.pm25.v.toFixed(0) + '</p>'
                    );
                }
                if (data.data.iaqi.pm10) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Lge. Particles (PM10):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            data.data.iaqi.pm10.v.toFixed(0) + '</p>'
                    );
                }
                if (data.data.iaqi.o3) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left; width: 110px">' +
                            'Ozone (O\u2083):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            (data.data.iaqi.o3.v.toFixed(0) * 10) + '</p>'
                    );
                }
                if (data.data.iaqi.no2) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Nitrogen Dioxide (NO\u2082):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            data.data.iaqi.no2.v.toFixed(0) + '</p>'
                    );
                }
                if (data.data.iaqi.so2) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Sulfur Dioxide (SO\u2082):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            (data.data.iaqi.so2.v.toFixed(0) * 10) + '</p>'
                    );
                }
                if (data.data.iaqi.co) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Carbon Monoxide (CO\u2082):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            (data.data.iaqi.co.v.toFixed(0) * 100) + '</p>'
                    );
                }
                if (data.data.iaqi.t) {
                    pollutionData.push(
                        '<p class="marker-body" style="display: flex; ' +
                            'float: left">' +
                            'Temperature (\u2103):</p>' +
                            '<p class="marker-body" ' +
                            'style="display: flex; float: right">' +
                            data.data.iaqi.t.v.toFixed(1) + '</p>'
                    );
                }
                
            // if api call returns "can not connect" as data
            } else {
                pollutionData.push(
                    '<p class="marker-body">Data: unavailable</p>'
                );
            }
            
        } else {
            // FOR DEBUG ONLY: display error status of API call
            console.log("waqi: " + data.error);
            
            alert("ERROR: Failed to connect to WAQI api");
        }
    };
    request.send();
    return pollutionData;
}

// place marker on map 
function placeMarker(position, map) {
    "use strict";
    
    // move the exisiting marker or create new marker
    if (marker) {
        // marker has been removed then add a new marker
        // else re-position existing marker
        if (marker.length === 0) {
            marker = new google.maps.Marker({
                position: position,
                map: map
            });
        } else {
            marker.setPosition(position);
        }
    } else {
        marker = new google.maps.Marker({
            position: position,
            map: map
        });
    }
    map.panTo(position);
    
    latitude = map.getCenter().lat();
    longitude = map.getCenter().lng();
    zoom = map.zoom;
}

// validate marker data (always run within setInterval function)
function validatePollutionData(pollutionData, lat, lng) {
    "use strict";
    
    var i, markerBody;
    
    if (pollutionData.length > 0) {
        clearInterval(interval);
        
        for (i = 0; i < pollutionData.length; i = i + 1) {
            if (markerBody) {
                markerBody = markerBody + pollutionData[i];
            } else {
                markerBody = pollutionData[i];
            }
        }
        
        document.getElementById("marker-content").innerHTML = markerBody;
        getPOP(lat, lng);
        hideElement("transparency");
    }
}

// display air quality information in marker popup
function showMarkerData(lat, lng) {
    "use strict";
    
    var pollutionData = [];
    
    pollutionData = markerData(pollutionData, lat, lng);
    
    showElement("marker");
    
    interval = setInterval(function () {
        validatePollutionData(pollutionData, lat, lng);
    }, 1000);
}

// ******************************************************************
// google maps api
//
// Google Maps (https://maps.google.com/maps)
// ******************************************************************
function initMap() {
    "use strict";
    
    var data;
    
    if (getParameter("latitude")) {
        latitude = parseFloat(getParameter("latitude"));
    }
    if (getParameter("longitude")) {
        longitude = parseFloat(getParameter("longitude"));
    }
    if (getParameter("zoom")) {
        zoom = parseInt(getParameter("zoom"), 10);
    }
    if (getParameter("gradient")) {
        gradient = parseInt(getParameter("gradient"), 10);
    }
    if (getParameter("source")) {
        source = parseInt(getParameter("source"), 10);
    }
    
    if (source === 0) {
        radius = 500;
        data = waqiAPI(apiCalls[0]);
    } else {
        radius = 250;
        data = openaqAPI(apiCalls[source], source);
    }
    
    // load map
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: zoom,
        center: {lat: latitude, lng: longitude},
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        scaleControl: true,
        minZoom: 2,
        maxZoom: 10,
        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180
            }
        }
    });
    
    // load heatmap layer default (waqi)
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: data,
        map: map,
        radius: getRadius(map.zoom, radius),
        gradient: getGradient()
    });
    
    // scale heatmap radius with zoom
    map.addListener('zoom_changed', function () {
        heatmap.setMap(null);
        heatmap.radius = getRadius(map.zoom, radius);
        heatmap.setMap(map);
        zoom = map.zoom;
    });
    
    // update location variables on drag
    map.addListener('drag', function () {
        latitude = map.getCenter().lat();
        longitude = map.getCenter().lng();
    });
    
    // add marker to map on click
    map.addListener('click', function (e) {
        showElement("transparency");
        placeMarker(e.latLng, map);
        latitude = marker.getPosition().lat();
        longitude = marker.getPosition().lng();
        showMarkerData(latitude, longitude);
    });
    
    // focus data souce button always
    document.addEventListener('click', function () {
        if (document.getElementById("contact").style.display === "none") {
            document.getElementById("data" + source).focus();
        }
    });
}

// ******************************************************************
// heatmap controls
// ******************************************************************

// button - refresh heatmap layer
function refreshHeatmap() {
    "use strict";
    
    showElement("transparency");
    updateLegend();
    heatmap.radius = getRadius(map.zoom, radius);
    heatmap.gradient = getGradient();
    heatmap.setMap(map);
    clearInterval(interval);
    hideElement("transparency");
    document.getElementById("data" + source).focus();
}

// validate heatmap data (always run within setInterval function)
function validateData() {
    "use strict";
    
    if (heatmap.data.g === undefined) {
        alert("failed to connect to data source");
        clearInterval(interval);
        showAbout();
    } else if (heatmap.data.g.length > 0) {
        clearInterval(interval);
        refreshHeatmap();
    }
}

// button - hide about/contact/donate popup
function hideAbout() {
    "use strict";
    
    hideElement("about");
    interval = setInterval(function () { validateData(); }, 100);
}

// move map to current location
function showPosition(position) {
    "use strict";
    
    var center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    placeMarker(center, map);
    showMarkerData(position.coords.latitude, position.coords.longitude);
    
    map.setCenter(center);
    map.setZoom(5);
}

// error return if geolocation fail
function showError(error) {
    "use strict";
    
    if (error.PERMISSION_DENIED) {
        alert("User denied the request for Geolocation");
    } else if (error.POSITION_UNAVAILABLE) {
        alert("Location information is unavailable");
    } else if (error.TIMEOUT) {
        alert("The request to get user location timed out");
    } else if (error.UNKNOWN_ERROR) {
        alert("An unknown error occurred");
    }
}

// button - go to user's location on map based on ip address
function showMyLocation() {
    "use strict";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser");
    }
}

// button - share URL link on facebook
function facebook() {
    "use strict";
    
    // open new tab for Facebook and append site url and data
    window.open("https://www.facebook.com/sharer.php?" +
                "u=https://s3573663.github.io/WHOMAP/" +
                "?latitude=" + latitude +
                "&longitude=" + longitude +
                "&zoom=" + zoom +
                "&gradient=" + gradient +
                "&source=" + source);
}

// button - share URL link on twitter
function twitter() {
    "use strict";
    
    // open new tab for Twitter and append site url, data, summary and tags
    window.open("https://twitter.com/intent/tweet?" +
                "url=https://s3573663.github.io/WHOMAP/" +
                "?latitude=" + latitude +
                "&longitude=" + longitude +
                "&zoom=" + zoom +
                "&gradient=" + gradient +
                "&source=" + source +
                "&text=A%20useful%20application%20for%20" +
                "showing%20air%20quality%20data" +
                "&hashtags=heatmap,WHOmap,airquality,IoT");
}

// button - copy URL link to clipboard
function copyLink(showAlert) {
    "use strict";
    
    var link, textArea;
    
    link = "https://s3573663.github.io/WHOMAP/" +
        "?latitude=" + latitude +
        "&longitude=" + longitude +
        "&zoom=" + zoom +
        "&gradient=" + gradient +
        "&source=" + source;
    
    if (showAlert === true) {
        textArea = document.createElement("textarea");
        document.body.appendChild(textArea);
        textArea.value = link;
        textArea.select();
        document.execCommand("copy");
        alert("URL copied to clipboard");
        document.body.removeChild(textArea);
    } else {
        return link;
    }
}

// save or return image data in save-area element
function getImage(saveToDisk) {
    "use strict";
    
    var image, link;
    
    if (document.getElementById("save-area").innerHTML.length > 0) {
        clearInterval(interval);
        image = document.getElementById("save-area").innerHTML;
        image.replace("image/jpeg", "image/octet-stream");
        
        if (saveToDisk === true) {
            link = document.createElement("a");
            link.setAttribute("href", image);
            link.setAttribute("download", "WHOmap-" + getDate() + ".jpg");
            link.click();
        } else {
            return image;
        }
        
        document.getElementById("save-area").innerHTML = '';
        hideElement("transparency");
    }
}

// append grabzit response to save-area element
function callback(dataUri) {
    "use strict";
    
    document.getElementById('save-area').innerHTML = dataUri;
}

// ******************************************************************
// button - save screenshot with grabzit api
//
// GrabzIt (https://grabz.it/api/javascript/)
// ******************************************************************
function saveMap() {
    "use strict";
    
    var delay, image, script = document.createElement('script');
    
    // scale delay with zoom level
    if (zoom === 10) {
        delay = '"delay": 20000';
    } else if (zoom === 9) {
        delay = '"delay": 15000';
    } else {
        delay = '"delay": 10000';
    }
    
    script.innerHTML =
        'var link = copyLink(false) + "&screenshot=true";' +
        'GrabzIt("MmQ1YWQyMTE0M2FhNGE4NjkwYzBlYTlkZjhmOWYwOTk=")' +
        '.ConvertURL(link, {' +
        '"width": 2000,' +
        '"height": 2000,' +
        '"quality": 50,' +
        delay + '})' +
        '.DataURI(callback);';
    document.body.append(script);
    
    showElement("transparency");
    interval = setInterval(function () { image = getImage(true); }, 1000);
}

// button - change heatmap gradient colour using getGradient()
function changeGradient() {
    "use strict";
    
    gradient = gradient + 1;
    
    // increase the integer in the conditional as more gradients are added
    if (gradient === 6) {
        gradient = 0;
    }
    
    heatmap.set('gradient', getGradient());
    updateLegend();
}

// button - change opacity of data points on heatmap
function changeOpacity() {
    "use strict";
    
    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.3);
}

// button - donate to the cause via paypal
function donate() {
    "use strict";
    
    window.open('https://www.paypal.com/cgi-bin/webscr?' +
        'cmd=_donations' +
        '&business=whomapmaps@gmail.com' +
        '&item_name=WHOmap donation' +
        '&tax=0' +
        '&currency_code=AUD' +
        '&lc=AU' +
        '&bn=PP_DonationsBF');
}

// button - show data:
// 0 = air quality index (AQI)
// 1 = small particles (PM2.5)
// 2 = large particle (PM10)
// 3 = ozone
// 4 = nitrogen dioxide
// 5 = sulfur dioxide
// 6 = carbon monoxide
function showData(option) {
    "use strict";
    
    showElement("transparency");
    
    // if option undefined, refresh map
    if (option === undefined) {
        option = source;
    } else {
        source = option;
    }
    
    heatmap.data.g = null;
    
    if (option === 0) {
        radius = 500;
        heatmap.data.g = waqiAPI(apiCalls[option]);
    } else {
        radius = 250;
        heatmap.data.g = openaqAPI(apiCalls[option], option);
    }
    
    document.getElementById("legend-max").innerHTML = ranges[option];
    
    interval = setInterval(function () { validateData(); }, 100);
}

// ******************************************************************
// page startup
// ******************************************************************
function start() {
    "use strict";
    
    // load google maps (in async mode)
    var script = document.createElement('script'), screenshot, feedback;
    
    script.src = "https://maps.googleapis.com/maps/api/js?" +
        "key=AIzaSyCUsHc0oOi_Y2uo4YT7ZdNllBkS54emA0g" +
        "&libraries=visualization" +
        "&callback=initMap";
    
    document.body.append(script);
    updateLegend();
    hideElement("hide");
    
    screenshot = getParameter("screenshot");
    if (screenshot === "true") {
        showElement("transparency");
        interval = setInterval(function () { validateData(); }, 100);
    } else {
        showAbout();
    }
}