const API_KEY = "2e2e13eef83f05a83c1ae98da64b4dd2";
let currentCity = localStorage.getItem("lastCity") || "Tokyo";
let currentLat = 0;
let currentLon = 0;

// Преобразование имени в японскую катакану
function showJapaneseName() {
    let name = document.getElementById("nameInput").value.trim();
    if (!name) name = "ゲスト";
    
    const katakana = {
        'а':'ア','б':'ブ','в':'ブ','г':'グ','д':'ド','е':'エ','ё':'ヨ',
        'ж':'ジ','з':'ズ','и':'イ','й':'イ','к':'ク','л':'ル','м':'ム',
        'н':'ン','о':'オ','п':'プ','р':'ル','с':'ス','т':'ト','у':'ウ',
        'ф':'フ','х':'フ','ц':'ツ','ч':'チ','ш':'シ','щ':'シュ','ы':'イ',
        'э':'エ','ю':'ユ','я':'ヤ',' ':' '
    };
    
    let result = "";
    for (let char of name.toLowerCase()) {
        result += katakana[char] || char.toUpperCase();
    }
    
    document.getElementById("japaneseName").textContent = result + "さん ようこそ！";
}

// Получение погоды из dropdown списка
async function getWeather() {
    const city = document.getElementById("citySelect").value;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ru`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.main) {
            currentCity = city;
            currentLat = data.coord.lat;
            currentLon = data.coord.lon;
            localStorage.setItem("lastCity", currentCity);
            updateWeatherUI(data);
            getForecast(data.coord.lat, data.coord.lon);
            updateTime();
        }
    } catch (error) {
        document.getElementById("desc").textContent = "Ошибка загрузки 😔";
        console.error("Ошибка:", error);
    }
}

// Поиск по названию города
function searchWeather() {
    const searchInput = document.getElementById("searchCity").value.trim();
    if (searchInput) {
        getWeatherFromInput(searchInput);
    } else {
        alert("Введи название города!");
    }
}

// Получение погоды по введённому названию
async function getWeatherFromInput(cityName) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=ru`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.main) {
            currentCity = data.name;
            currentLat = data.coord.lat;
            currentLon = data.coord.lon;
            localStorage.setItem("lastCity", currentCity);
            updateWeatherUI(data);
            getForecast(data.coord.lat, data.coord.lon);
            updateTime();
        } else {
            alert("Город не найден! 😔");
        }
    } catch (error) {
        alert("Ошибка при поиске города!");
        console.error("Ошибка:", error);
    }
}

// Обновление UI с данными о погоде
function updateWeatherUI(data) {
    document.getElementById("city").textContent = data.name;
    document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
    document.getElementById("feelsLike").textContent = Math.round(data.main.feels_like) + "°C";
    document.getElementById("humidity").textContent = data.main.humidity + "%";
    document.getElementById("wind").textContent = data.wind.speed.toFixed(1) + " м/с";
    document.getElementById("pressure").textContent = data.main.pressure + " гПа";
    document.getElementById("desc").textContent = 
        data.weather[0].main + " " + getWeatherEmoji(data.weather[0].main);
}

function getWeatherEmoji(condition) {
    const emojis = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Drizzle': '🌦️',
        'Squall': '🌪️'
    };
    return emojis[condition] || '🌤️';
}

// Получение прогноза на 5 дней
async function getForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Берем прогноз на каждые 24 часа (индекс 8, 16, 24, 32, 40)
        const forecasts = [8, 16, 24, 32, 40];
        const forecastHTML = forecasts.map(idx => {
            if (idx >= data.list.length) return '';
            
            const forecast = data.list[idx];
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' });
            const temp = Math.round(forecast.main.temp);
            const icon = getWeatherEmoji(forecast.weather[0].main);
            
            return `
                <div class="forecast-card">
                    <p class="forecast-day">${day}</p>
                    <p class="forecast-icon">${icon}</p>
                    <p class="forecast-temp">${temp}°C</p>
                    <p class="forecast-desc">${forecast.weather[0].main}</p>
                </div>
            `;
        }).join('');
        
        document.getElementById("forecastGrid").innerHTML = forecastHTML;
    } catch (error) {
        console.error("Ошибка при получении прогноза:", error);
    }
}

// Геолокация - определяет город по текущему местоположению
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon);
            },
            error => {
                alert("Не удалось определить твоё местоположение. Проверь разрешения браузера!");
                console.error("Ошибка геолокации:", error);
            }
        );
    } else {
        alert("Твой браузер не поддерживает геолокацию!");
    }
}

// Получение погоды по координатам
async function getWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.main) {
            currentCity = data.name;
            currentLat = lat;
            currentLon = lon;
            localStorage.setItem("lastCity", currentCity);
            updateWeatherUI(data);
            getForecast(lat, lon);
            updateTime();
        }
    } catch (error) {
        alert("Ошибка при загрузке погоды!");
        console.error("Ошибка:", error);
    }
}

// Обновление времени последнего обновления
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById("updateTime").textContent = `${hours}:${minutes}`;
}

// Ручное обновление
function manualUpdate() {
    if (currentLat && currentLon) {
        getWeatherByCoords(currentLat, currentLon);
    } else {
        getWeather();
    }
    alert("Данные обновлены! 🔄");
}

// Загружаем погоду при открытии страницы
window.addEventListener('load', () => {
    // Восстанавливаем последний город из localStorage
    const lastCity = localStorage.getItem("lastCity") || "Tokyo";
    document.getElementById("citySelect").value = lastCity;
    
    // Загружаем погоду
    getWeather();
});