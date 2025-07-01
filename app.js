import express from "express";
import axios from "axios";

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));


// Set view engine to EJS
app.set("view engine", "ejs");

// Serve static files (CSS)
app.use(express.static("public"));

// Home route – shows input form
app.get("/", (req, res) => {
  res.render("index");
});

// Joke route – fetches a random joke and renders it
app.get("/joke", async (req, res) => {
  try {
    // 🔍 Read the category from query string
    const category = req.query.category || "Any";

    // 🔗 Call JokeAPI with selected category
    const response = await axios.get(`https://v2.jokeapi.dev/joke/${category}`);

    const jokeData = response.data;
    let jokeText;

    if (jokeData.type === "single") {
      jokeText = jokeData.joke;
    } else {
      jokeText = `${jokeData.setup} <br><strong>${jokeData.delivery}</strong>`;
    }

    res.render("result", { data: jokeText });

  } catch (error) {
    console.error("Error fetching joke:", error.message);
    res.render("result", { data: "Oops! Couldn't fetch a joke." });
  }
});


app.get("/loading", (req, res) => {
  const category = req.query.category || "Any";
  const query = `?category=${category}`;
  res.render("loading", { query });
});


app.get("/weather", (req, res) => {
  // Render the weather form page
  res.render("weather");
});

app.post("/getweather", async (req, res) => {
  try {
    const city = req.body.city; // Get the city from the form input

    // 🔍 Step 1: Get latitude and longitude of the city
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
    const geoResponse = await axios.get(geoURL);
    const location = geoResponse.data.results?.[0];

    if (!location) {
      return res.render("weather-result", {
        city,
        temperature: "N/A",
        windSpeed: "N/A",
        rainChance: "N/A"
      });
    }

    const lat = location.latitude;
    const lon = location.longitude;

    // 🌤️ Step 2: Get weather using those coordinates
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability`;
    const weatherResponse = await axios.get(weatherURL);
    
    const currentWeather = weatherResponse.data.current_weather;
    const rainChance = weatherResponse.data.hourly?.precipitation_probability?.[0] ?? "N/A";

    // 🎯 Render weather result page with data
    res.render("weather-result", {
      city,
      temperature: currentWeather.temperature,
      windSpeed: currentWeather.windspeed,
      rainChance
    });

  } catch (error) {
    console.error("Error fetching weather:", error.message);
    res.render("weather-result", {
      city: "Unknown",
      temperature: "N/A",
      windSpeed: "N/A",
      rainChance: "N/A"
    });
  }
});


app.get("/crypto", (req, res) => {
  // Render the crypto form page
  res.render("crypto");
});


app.post("/getcrypto", async (req, res) => {
  try {
    const coin = req.body.crypto; // Get coin from form (e.g. "bitcoin")

    // 🪙 CoinGecko API for live price in INR and USD
    const apiURL = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=inr,usd`;

    // 🌐 Use axios to call the API
    const response = await axios.get(apiURL);

    // ✅ Extract prices from the response
    const inrPrice = response.data[coin].inr;
    const usdPrice = response.data[coin].usd;

    // 🎯 Show prices on result page
    res.render("crypto-result", {
      coin: coin.charAt(0).toUpperCase() + coin.slice(1), // Capitalize first letter
      inrPrice,
      usdPrice
    });

  } catch (error) {
    console.error("Error fetching crypto data:", error.message);

    // ❌ Fallback if error occurs
    res.render("crypto-result", {
      coin: "Unknown",
      inrPrice: "N/A",
      usdPrice: "N/A"
    });
  }
});



app.get("/cocktail", async (req, res) => {
  try {
    const apiURL = "https://www.thecocktaildb.com/api/json/v1/1/random.php";
    const response = await axios.get(apiURL);

    const drink = response.data.drinks[0];

    // Extract basic info
    const name = drink.strDrink;
    const image = drink.strDrinkThumb;
    const instructions = drink.strInstructions;

    // Extract ingredients dynamically
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (ingredient) {
        ingredients.push(`${ingredient}${measure ? ` - ${measure}` : ""}`);
      }
    }

    // Render cocktail.ejs
    res.render("cocktail", {
      name,
      image,
      instructions,
      ingredients
    });

  } catch (error) {
    console.error("Error fetching cocktail:", error.message);
    res.send("❌ Failed to load cocktail. Please try again.");
  }
});

app.get("/news", (req, res) => {
  res.render("news");
});
app.post("/getnews", async (req, res) => {
  try {
    const country = req.body.country;

    // ✅ Your actual API key
    const apiKey = "0d96c241f5248ca88f0d2299dadc3e49";

    // ✅ Correct API URL
    const apiURL = `https://gnews.io/api/v4/top-headlines?lang=en&country=${country}&max=10&apikey=${apiKey}`;

    console.log("🔗 Calling API:", apiURL); // Debugging

    const response = await axios.get(apiURL);

    const articles = response.data.articles;
    console.log("✅ Articles received:", articles.length);

    res.render("news-result", { articles, country });

  } catch (error) {
    console.error("❌ GNews API error:", error.response?.data || error.message);
    res.send("❌ Failed to load news. Check your API key or try again later.");
  }
});






// Result route – will call API later
app.get("/result", async (req, res) => {
  res.render("result", { data: null });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
