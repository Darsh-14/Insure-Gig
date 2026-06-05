export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || " your_weather_key is ";

export async function fetchLiveWeather(city: string) {
  try {
    const encodedCity = encodeURIComponent(city.trim());
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    if (!response.ok) {
      throw new Error(`Error fetching weather for ${city}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      description: data.weather[0].main,
      temp: Math.round(data.main.temp),
      severity: calculateSeverityFromWeather(data.weather[0].main, data.main.temp),
      coord: data.coord, // Returned from OpenWeather {lat, lon}
      success: true,
    };
  } catch (error) {
    console.error("Weather API failed:", error);
    // Fallback to mock data so the demo never completely breaks if the API key is missing
    return {
      description: "Haze (API Key issue / Mocked Fallback)",
      temp: 32,
      severity: 25,
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function fetchWeatherByCoords(lat: number, lon: number) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    if (!response.ok) {
      throw new Error(`Error fetching weather for coords: ${response.status}`);
    }
    const data = await response.json();
    return {
      name: data.name, // The City Name automatically resolved by OpenWeatherMap!
      description: data.weather[0].main,
      temp: Math.round(data.main.temp),
      severity: calculateSeverityFromWeather(data.weather[0].main, data.main.temp),
      coord: { lat, lon },
      success: true,
    };
  } catch (error) {
    console.error("GPS Weather API failed:", error);
    return { 
      name: "Local Area",
      description: "Haze (API Key missing / Mocked)",
      temp: 32,
      severity: 25,
      success: false, 
      error: (error as Error).message 
    };
  }
}

// Automatically convert weather conditions into the 0-100 severity slider scale used by our Parametric engine
function calculateSeverityFromWeather(condition: string, temp: number): number {
  const c = condition.toLowerCase();
  let severity = 10; // Baseline

  if (c.includes('rain') || c.includes('drizzle')) severity += 50;
  if (c.includes('thunderstorm') || c.includes('storm') || c.includes('squall')) severity += 80;
  if (c.includes('snow')) severity += 60;
  if (c.includes('clear')) severity = 0;
  if (c.includes('haze') || c.includes('fog') || c.includes('mist')) severity += 30; // low visibility

  if (temp > 40) severity += 40; // Extreme heat

  return Math.min(Math.max(severity, 0), 100);
}
