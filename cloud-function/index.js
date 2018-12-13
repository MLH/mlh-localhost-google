// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const httpRequest = require("request-promise-native");
const language = require('@google-cloud/language');


const nlpClient = new language.LanguageServiceClient({
    projectId: 'your-project-id',
});

// This is the environment for the Twitter premium search api.
// See: https://developer.twitter.com/en/docs/tweets/search/api-reference/premium-search.html
const TWITTER_ENV = 'testing';
// This is the endpoint for the Twitter premium search api.
// See: https://developer.twitter.com/en/docs/tweets/search/api-reference/premium-search.html
const TWITTER_SEARCH_ENDPOINT = '30day';
// Constructed a complete base url for the API call.
const TWITTER_SEARCH_URL = 'https://api.twitter.com/1.1/tweets/search/'
  .concat(TWITTER_SEARCH_ENDPOINT)
  .concat('/')
  .concat(TWITTER_ENV)
  .concat('.json');
// Load the API credentials into constants for readability sake
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY_HERE';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET_HERE';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function lookup(agent) {
    const inputEntity = request.body.queryResult.parameters.any;  
    let request_options = {
      url: TWITTER_SEARCH_URL,
      oauth: { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
      json: true,
      headers: {
        'content-type': 'application/json'
      },
      body: { query: inputEntity }
    };

    // Send a request to the twitter api, then return the results (body)
    return httpRequest.post(request_options).then((body) => {
      // Get the results without all the retweets and extract the text
      let tweetText = extractText(filterRetweets(body.results));
    
      // Create a nlpClient request to detect the sentiment of all the tweets fetched
      return nlpClient.analyzeSentiment({document: { content: tweetText.join(' '), type: 'PLAIN_TEXT'} }).then(results => {
            const sentiment = results[0].documentSentiment.score;
            if (sentiment >= 0 && sentiment <= 0.1) {
                agent.add(`People have mixed feelings about ${inputEntity}`);
            } else if (sentiment < 0) {
                agent.add(`People feel negatively about ${inputEntity}`);
            } else { 
                agent.add(`People feel positively about ${inputEntity}`);
            }
         }).catch(err => {
            console.log(err);
            agent.add('Sorry, something went wrong.');
         });
    }).catch(err => {
        console.log(err);
        agent.add('Sorry, something went wrong.');
    });
  }
  
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

    

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Lookup entity', lookup);
  agent.handleRequest(intentMap);
});

