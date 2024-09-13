![](https://securedownloads.digi.me/partners/digime/SDKReadmeBanner.png)
<p align="center">
    <a href="https://developers.digi.me/slack/join">
        <img src="https://img.shields.io/badge/chat-slack-blueviolet.svg" alt="Developer Chat">
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/language-typescript-ff69b4.svg" alt="Typescript">
    </a>
    <a href="https://developers.digi.me/">
        <img src="https://img.shields.io/badge/web-digi.me-red.svg" alt="Web">
    </a>
</p>

# Example applications built on the digi.me Node.js SDK.
This repository contains example applications built on the [digi.me Node.js SDK](https://github.com/digime/digime-sdk-nodejs/). There are two example applications in this repository. One showcases private sharing, and the other showcasing push flow. You can find more on our NodeJS SDK [documentation](https://digime.github.io/digime-sdk-nodejs/pages/guides/start.html).

## Preparation

### On the machine that will run the example you'll need:
* Node version 18.0 or greater, with NPM
* git (optional)

## Installation
1. [Download](https://github.com/digime/digime-sdk-nodejs-example/archive/master.zip) and extract, or clone the `master` branch on this repo with the following command:

    `git clone https://github.com/digime/digime-sdk-nodejs-example.git`

2. In your terminal, navigate to the directory where you cloned/extracted this example (If you see this README in it, you're in the correct place!)

3. Run `npm install` in your terminal

4. Run `npm run start:read-example` or `npm run start:write-example` in your terminal to run the read or write example:

    This should print out something along these lines:

    ```Example app now running on:
    - http://localhost:8081
    ```

5. You should now be able to access the example app on http://localhost:8081.

## To run the private share example application

We've provided an example contract ID, application ID and private key for testing out private sharing. In order to obtain your contract ID, application ID and private key please fill out the [registration form](https://go.digi.me/developers/register).

To run read example application, please run the command: `npm run start:read-example`

## To run the read example application

1. **Navigate to the example app** - Once you initialize the flow our SaaS webpage will be opened where we request from user authorization and user should be permitted to `Give access` for requested data.

2. **See data shared** -  After doing swipe to consent and give access to requested account you should see a list of all the data that was received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.

## To run the write example application
In this example you will see how we are able to push data into a user's digi.me.

To run write example application, please run the command: `npm run start:write-example`

## Checking out our SDK

This example was built upon the digi.me Node.js SDK. You can find more information [here](https://github.com/digime/digime-sdk-nodejs/).
