//Globals
var context = new webkitAudioContext();

var synthesizer = {

    isPlaying: false,

    osc01: context.createOscillator(),

    filter: context.createBiquadFilter({
        type: 2, // Band-pass filter
        Q: 1
    }),

    gainNode: context.createGain(),

    makeSound: function() {

        var freq;

        synthesizer.osc01.type = 'sawtooth';
        synthesizer.osc01.connect(synthesizer.filter);
        synthesizer.filter.connect(synthesizer.gainNode);
        synthesizer.gainNode.connect(context.destination);

        if (weather.currentWeather.currentTemp < 0) {
            freq = 120;
        } else if (weather.currentWeather.currentTemp > 100) {
            freq = 3000.01;
        } else {
            freq = 130 + weather.currentWeather.currentTemp * 15;
        }

        synthesizer.filter.frequency.value = (1 - weather.currentWeather.cloudCover) * 3000 + 800;
        synthesizer.osc01.frequency.value = freq;
        synthesizer.gainNode.gain.value = 0.3;
        synthesizer.osc01.start(0);
        synthesizer.isPlaying = true;
    },

    updateSound: function() {

        var freq;

        if (weather.currentWeather.currentTemp < 0) {
            freq = 120;
        } else if (weather.currentWeather.currentTemp > 100) {
            freq = 3000.01;
        } else {
            freq = 130 + weather.currentWeather.currentTemp * 15;
        }
        synthesizer.filter.frequency.value = (1 - weather.currentWeather.cloudCover) * 3000 + 400;
        synthesizer.osc01.frequency.value = freq;
    },

    playSound: function() {
        if (synthesizer.isPlaying) {
            synthesizer.gainNode.gain.value = 0.3;
        } else {
            synthesizer.makeSound();
        }
    },

    stopSound: function() {
        synthesizer.gainNode.gain.value = 0;
    }
};

$(':button').on('click', function() {
    if (this.value == 'Play') {
        synthesizer.playSound();
        this.value = 'Stop';
    } else if (this.value == 'Stop') {
        synthesizer.stopSound();
        this.value = 'Play';
    };
});

// Mapbox JS    
var latitude = 40.73916085675278;
var longitude = -73.99360656738281;
var map = L.mapbox.map('map', 'mandroid.map-qqjmtrpd').setView([latitude, longitude], 7);
var layers = $('.menu-ui');
var marker = L.marker(new L.LatLng(latitude, longitude), {
    icon: L.mapbox.marker.icon({
        'marker-color': 'FF0000'
    }),
    draggable: true
}).addTo(map);


marker.on('dragend', function(e) {
    latitude = e.target._latlng.lat;
    longitude = e.target._latlng.lng;
    weather.getWeather(synthesizer.updateSound);
});

function addLayer(layer, name, zIndex) {

    // Create a simple layer switcher that
    // toggles layers on and off.
    var link = document.createElement('a');
    link.href = '#';
    link.innerHTML = name;

    link.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
            this.className = '';
        } else {
            map.addLayer(layer);
            layer.setZIndex(zIndex);
            this.className = 'active';
        }
    };

    layers.append(link);
};

map.on('ready', function() {
    weather.getWeather();
    addLayer(L.tileLayer('http://{s}.tile.openweathermap.org/map/temp/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenWeatherMap',
        maxZoom: 18,
        opacity: 0.5
    }), 'Temperature', 1);
    addLayer(L.tileLayer('http://{s}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenWeatherMap',
        maxZoom: 18,
        opacity: 0.7
    }), 'Clouds', 3);
    addLayer(L.tileLayer('http://{s}.tile.openweathermap.org/map/rain_cls/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenWeatherMap',
        maxZoom: 18,
        opacity: 0.5
    }), 'Rain', 2);    

});

var weather = {

    getWeather: function(callback) {

        var fioAPI = "https://api.forecast.io/forecast/71831aee2d912a63edf07149befb20ac/";

        $.getJSON(fioAPI + latitude + ',' + longitude + "?callback=?", function(json) {
            weather.currentWeather = new Object();
            weather.currentWeather.currentConditions = json.currently.summary;
            weather.currentWeather.currentTemp = json.currently.temperature;
            weather.currentWeather.windSpeed = json.currently.windSpeed;
            weather.currentWeather.humidity = json.currently.humidity;
            weather.currentWeather.cloudCover = json.currently.cloudCover;
            weather.currentWeather.humidityPercentage = weather.currentWeather.humidity * 100;
            weather.currentWeather.windDirection = weather.windDirectionConverter(json.currently.windBearing);

            if (weather.currentWeather) {
                $('#currentConditions').html(weather.currentWeather.currentConditions);
                $('#currentTemp').html(weather.currentWeather.currentTemp.toFixed(0) + '\u00B0');
                $('#wind').html('Winds from the ' + weather.currentWeather.windDirection + ' at ' + weather.currentWeather.windSpeed.toFixed(0) + 'mph');
                $('#wetness').html(weather.currentWeather.humidityPercentage.toFixed(0) + '% humidity');
            }
            if (callback != null) callback();
        });
    },

    windDirectionConverter: function(bearing) {
        if (bearing >= 337.5 || bearing <= 22.5) return 'N';
        else if (bearing >= 22.5 && bearing <= 67.5) return 'NE';
        else if (bearing >= 67.5 && bearing <= 112.5) return 'E';
        else if (bearing >= 112.5 && bearing <= 157.5) return 'SE';
        else if (bearing >= 157.5 && bearing <= 202.5) return 'S';
        else if (bearing >= 202.5 && bearing <= 247.5) return 'SW';
        else if (bearing >= 247.5 && bearing <= 292.5) return 'W';
        else if (bearing >= 292.5 && bearing <= 337.5) return 'NW';
    }
}
