const cityValue = document.getElementById("cityValue");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

// DOM elements for displaying weather data

// DOM Picture areas
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const feel = document.getElementById("feel");
const time = document.getElementById("time");

// DOM Info areas
const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const uvi = document.getElementById("uvi");
const sunset = document.getElementById("sunset");

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city === "") {
    alert("Please enter a city name.");
    return;
  }
  cityInput.value = "";
  localStorage.setItem(LAST_CITY_KEY, city);
  loadLocation(city);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// Local storage season
const STORAGE_KEY = "weather_map_";
const LAST_CITY_KEY = "last_city";

window.addEventListener("load", () => {
  if (typeof Storage === "undefined") {
    alert("Browser anda tidak mendukung local storage");
    return;
  }

  const lastCity = localStorage.getItem(LAST_CITY_KEY);
  if (lastCity) {
    loadLocation(lastCity);
  }
});

function getStorageKey(city) {
  return `${STORAGE_KEY}${city.toLowerCase()}`;
}

async function loadLocation(city) {
  const storageKey = getStorageKey(city);

  //cek Local storage
  const savedData = localStorage.getItem(storageKey);
  if (savedData) {
    try {
      const locationData = JSON.parse(savedData);
      const now = Date.now();
      const dataAge = now - locationData.savedAt;
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (dataAge < FIVE_MINUTES) {
        displayWeather(data.weather);
        updateMap(data.map);

        return;
      }
    } catch (error) {
      console.error("Data lokal storage rusak: ", error);
      localStorage.removeItem(storageKey);
    }
  }

  try {
    const mapData = await getMapFromAPI(city);
    const weatherData = await getWeatherFromAPI(city);

    // Simpan data ke Local storage
    const locationData = {
      city: city,
      weather: weatherData,
      map: mapData,
      savedAt: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(locationData));
    localStorage.setItem(LAST_CITY_KEY, city);

    updateMap(mapData);
    displayWeather(weatherData);
  } catch (error) {
    console.error(error);
    alert("Gagal mengambil data lokasi");
  }
}

async function getWeatherFromAPI(city) {
  const apiUrl = `http://api.weatherstack.com/current?access_key=cdc70919ef1cfccfdaf3f6df36725305&query=${city}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("Weather API gagal");
  }

  return await response.json();
}

function displayWeather(data) {
  // Dom picture areas
  const icon = data.current.weather_icons[0];
  weatherIcon.src = icon;
  const temp = data.current.temperature;
  temperature.textContent = `${temp}°C`;
  const desc = data.current.weather_descriptions[0];
  description.textContent = desc;
  const feelsLike = data.current.feelslike;
  feel.textContent = `Feels like: ${feelsLike}°C`;
  const currentTime = data.location.localtime;
  time.textContent = currentTime;
  // Dom info areas
  const windSpeed = data.current.wind_speed;
  wind.textContent = `${windSpeed} m/s SW`;
  const humidityValue = data.current.humidity;
  humidity.textContent = `${humidityValue}%`;
  const pressureValue = data.current.pressure;
  pressure.textContent = `${pressureValue} hPa`;
  const visibilityValue = data.current.visibility;
  visibility.textContent = `${visibilityValue} km`;
  const uviValue = data.current.uv_index;
  uvi.textContent = `${uviValue} UV`;
  const sunsetTime = data.current.astro.sunset;
  sunset.textContent = sunsetTime;
}

// DOM for maps
// Inisialisasi peta, default fokus ke Jakarta
const map = L.map("map").setView([-6.2088, 106.8456], 9);

// Layer tile dari OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let marker;

async function getMapFromAPI(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: { "User-Agent": "dwiwahyue4@gmail.com" },
  });
  const data = await response.json();

  if (data.length === 0) {
    alert("Tempat tidak ditemukan");
    return;
  }

  return {
    cityName: data[0].display_name,
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

function updateMap(mapData) {
  const { cityName, lat, lon } = mapData;

  // Dom value City Name
  cityValue.textContent = cityName;

  // Pindah peta ke lokasi hasil pencarian
  map.setView([lat, lon], 9);

  // Hapus marker lama, tambah marker baru
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map).bindPopup(cityName).openPopup();
}
