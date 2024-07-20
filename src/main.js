// Load environment variables from the .env file
require('dotenv').config();
// Import the axios library for making HTTP requests
const axios = require('axios');
const dayjs = require('dayjs');
// Import the discord.js library
const { Client, GatewayIntentBits } = require('discord.js');

// Create a new Discord client with the specified intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// When the bot is ready and connected to Discord
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Call the updateNicknames function initially
  updateNicknames();
  // Call the updateNicknames function every minute (60 * 1000 milliseconds)
  setInterval(updateNicknames, 60 * 1000);
});

// Function to fetch the price data from the API

async function getPrice() {
  try {
    // Get today's date and the previous day's date
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    // Construct the API URL
    const apiUrl = `https://api.prod.flash.trade/flp-stats/by-date-range?from=${yesterday}&to=${today}`;

    // Make an HTTP GET request to fetch the data
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Find the latest price for the symbol "FLP.1"
    let latestTimestamp = 0;
    let latestPrice = null;
    for (const item of data) {
      if (item.symbol === "FLP.1" && item.timestamp > latestTimestamp) {
        latestTimestamp = item.timestamp;
        latestPrice = item.price;
      }
    }

    // Return the price in USD
    const adjustedPrice = latestPrice ? (parseFloat(latestPrice) * Math.pow(10, -6)).toFixed(4) : null; // Changed to 4 decimal places
    return adjustedPrice;
  } catch (error) {
    // Log any errors that occur during the API request
    console.error('Error fetching price:', error.message);
    return null;
  }
}


// Function to update the bot's nickname in all joined servers
async function updateNicknames() {
  // Fetch the price
  const price = await getPrice();
  
  // If there was an error fetching the price, skip the update
  if (price === null) {
    console.log('Skipping nickname update due to failed price fetch');
    return;
  }
  
  // Format the price to four decimal places and prepend a dollar sign
  const newNickname = "$" + parseFloat(price).toFixed(4); // Changed to 4 decimal places

  // Iterate through all the servers the bot is a member of
  client.guilds.cache.each(async (guild) => {
    try {
      // Fetch the bot's member object in the current server
      const me = await guild.members.fetch(client.user.id);
      // Update the bot's nickname in the current server
      await me.setNickname(newNickname);

      console.log(`Nickname updated in ${guild.name}`);
    } catch (error) {
      // Log any errors that occur during the nickname update
      console.error(`Error updating nickname in ${guild.name}:`, error.message);
    }
  });
}

// Log in to the Discord client using the bot token from the .env file
client.login(process.env.DISCORD_TOKEN);
