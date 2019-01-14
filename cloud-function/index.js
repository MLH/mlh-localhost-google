// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";

const functions = require("firebase-functions");
const language = require("@google-cloud/language");
const httpRequest = require("request-promise-native");
const { dialogflow } = require('actions-on-google');

// Create an app instance
const app = dialogflow();

const languageClient = new language.LanguageServiceClient({
  projectId: "YOUR_PROJECT_ID_HERE"
});

// This is the environment for the Twitter premium search api.
// See: https://developer.twitter.com/en/docs/tweets/search/api-reference/premium-search.html
const TWITTER_ENV = "testing";

// This is the endpoint for the Twitter premium search api.
// See: https://developer.twitter.com/en/docs/tweets/search/api-reference/premium-search.html
const TWITTER_SEARCH_ENDPOINT = "30day";

// Constructed a complete base url for the API call.
const TWITTER_SEARCH_URL = "https://api.twitter.com/1.1/tweets/search/"
  .concat(TWITTER_SEARCH_ENDPOINT)
  .concat("/")
  .concat(TWITTER_ENV)
  .concat(".json");

// Load the API credentials into constants for readability sake
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY_HERE';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET_HERE';

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

/**
 * Filter out the retweets from the results returned from the Twitter premium search API.
 * @param searchResults
 * @returns {Array}
 */
function filterRetweets(searchResults) {
  let filtered = [];
  searchResults.forEach((result) => {
    if (!result.retweeted_status) { // Check if details about a retweet exist, if they do, do not execute this block
      filtered.push(result); // Since this is not a retweet, push it
    }
  });
  return filtered;
}

/**
 * Pluck the ids from the result array containing tweet objects returned from the Twitter premium search API.
 * @param searchResults
 * @returns {Array}
 */
function extractText(searchResults) {
  let tweets = [];
  searchResults.forEach((result) => {
    tweets.push(result.text); // Push the tweet's ID into the array
  });
  return tweets;
}

// The Sentiment intent
app.intent('Sentiment', (conv, params) => {
  const inputEntity = params.any;
  let request_options = {
    url: TWITTER_SEARCH_URL,
    oauth: { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
    json: true,
    headers: {
      "content-type": "application/json"
    },
    body: { query: inputEntity.concat(" lang:en"), }
  };

  // Send a request to the twitter api, then return the results (body)
  return httpRequest.post(request_options).then((body) => {
    // Get the results without all the retweets and extract the text of the tweet to be analyzed
    let tweetText = extractText(filterRetweets(body.results));

    // Create a nlpClient request to detect the sentiment of all the tweets fetched
    return languageClient.analyzeSentiment({
      document: {
        content: tweetText.join(" "),
        type: "PLAIN_TEXT"
      }
    }).then(results => {
      // Get the overall document score (all the tweets concatenated together)
      const sentiment = results[ 0 ].documentSentiment.score;
      // 0 -> 0.1 is a somewhat neutral score
      if (sentiment >= 0 && sentiment <= 0.1) {
        conv.close(`People have mixed feelings about ${inputEntity}.`);
        // Less than 0 is usually negative
      } else if (sentiment < 0) {
        conv.close(`People feel negatively about ${inputEntity}.`);
        // Greater than 0.1 usually indicates positive.
      } else {
        conv.close(`People feel positively about ${inputEntity}.`);
      }
    }).catch(err => {
      console.log(err);
      conv.close("Sorry, something went wrong.");
    });
  }).catch(err => {
    console.log(err);
    conv.close("Sorry, something went wrong.");
  });
});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
