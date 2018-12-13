# localhost-google
This contains the code for the live demo of the MLH Localhost Google Assistant workshop

# Setting up

## Prequisites
- Google Account

## Set up a Google Cloud Platform project (GCP)
- Log into Google Account
- Follow the instructions [here](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
- Take note of the project id (example: actions-test-224503)

## Enable NLP and billing
- Follow the instructions [here](https://cloud.google.com/natural-language/docs/quickstart) to enable the NLP APIs in your GCP project. (Note: You only need to follow until you Enable "Cloud Natural Language API")
- Follow the instructions [here](https://cloud.google.com/billing/docs/how-to/modify-project) to enable billing on your GCP project.

## Set up new Actions project
- Visit actions.google.com
- Click "Go to actions console"
- Click "Add/import project"
- Select your previously created GCP project
- Once on the "Welcome to your project" screen, click a category (e.g. Education and reference)
- Click and complete the Quick Setup (set a name for your Action, and a voice)
- Click the actions tab on the left and the click "Add your first action"
- In the popup, make sure "Custom intent" is selected, and click "Build"

You should now be taken to Dialogflow. 

## Set up Action on Dialogflow

### Set up agent
- You will need to login and accept the terms. 
- You will now need to create an agent. Click "Create Agent" from the left hand menu.
- Set a name, and choose your previous created Google Project. 

### Set up an intent
- Next, click Intents on the left side and click "Create Intent"
- Set a name at the top. Make note of this name
- Click "Add Training Phrases" and type "How do people feel about x?"
- Double click to highlight the "x" and click on "@sys.any" from the list.
- Click "Add Training Phrases" and type "Search for x"
- Double click to highlight the "x" and click on "@sys.any" from the list.
- Click "Add Training Phrases" and type "x"
- Double click to highlight the "x" and click on "@sys.any" from the list.
- Next, click "Add response" and type "Not sure how they feel about $any yet!" (without quotes)
- Click the Google Assistant tab in the responses section and turn it on if it is off.
- Finally, enable "Enable webhook calls for this intent" under fulfilment, and click Save on the top right.

### Set up fulfillment
- Click the fullfillment tab and enable the inline editor. Note: For external network calls, you need to set up the Firebase project to be on a paid plan, which is needed to test the external calls to Twitter. To do this, click "View execution logs in the Firebase console" after the inline editor has been deployed for the first time, and then change the plan from within Firebase. 
- Paste the [index.js](https://github.com/MLH/localhost-google/blob/master/cloud-function/index.js) and fill in the necessary variables, namely:
  - projectId: Use the GCP project id (example: actions-test-224503) you noted earlier.
  - CONSUMER_KEY, CONSUMER_SECRET: To retrieve your application consumer key and secret, follow the steps to create a Twitter developer account and app [here](
https://developer.twitter.com/en/docs/basics/developer-portal/guides/apps.html). Once you apply for a developer account and create an app, you can get access to the consumer key and secret under Apps -->
Details button on App --> Keys and Tokens --> Consumer API Keys.
  - TWITTER_ENV: The twitter environment you will use will be one you create [here](https://developer.twitter.com/en/account/environments) (after you have logged into your developer account).
- After this, click on the "package.json" tab and paste in the [package.json](https://github.com/MLH/localhost-google/blob/master/cloud-function/package.json) provided.
- Click deploy.

### Set up the Integrations
- From here, turn on Web Demo to have a page to test the bot.
- Then, click "Integration settigns" under Google Assistant, and click the field under "Implicit Invocation". Select the Intent you just created by the name you noted earlier.
- Then click "Test", "Continue" and you should be taken back to Actions Console (actions.google.com) to test your new Google Assistant bot.

### Other notes
- You can customize Theme customization on the Actions console.
