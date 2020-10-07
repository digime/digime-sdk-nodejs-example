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

# Example applications built on the digi.me JavaScript SDK.
This repository contains example applications built on the [digi.me JavaScript SDK](https://github.com/digime/digime-sdk-js/). There are two example applications in this repository. One showcases private sharing, and the other showcasing postbox. You can find out more able both of these in our [documentation](https://github.com/digime/digime-sdk-js/docs).

## Preparation

### On the machine that will run the example you'll need:
* Node version 10.16 or greater, with NPM
* git (optional)

## Installation
1. [Download](https://github.com/digime/digime-js-sdk-example/archive/master.zip) and extract, or clone the `master` branch on this repo with the following command:

    `git clone https://github.com/digime/digime-js-sdk-example.git`

2. In your terminal, navigate to the directory where you cloned/extracted this example (If you see this README in it, you're in the correct place!)

3. Run `npm install` in your terminal

4. Open the desired example in the `examples/[your desired example]/index.js` file in your favourite code editor, and replace the placeholders with the values you received from digi.me (described in the code comments as well).

5. Run `npm start:[your desired example]` in your terminal

    This should print out something along these lines:

    ```Example app now running on:
    - http://localhost:8081
    - http://192.168.0.10:8081 (probably)
    ```

6. You should now be able to access the example app 🎉:
    - First URL should be able to be opened on the same machine you started the server (So you can be sure it's running)
    - The second URL is our best guess as to what your local network IP is. You should be able to open the example app from your phone with it, assuming that both machines are on the same network.

## To run the private share example application

In order to run this example app, you'll need to perform some preparation steps. From digi.me, you'll need to obtain the following:
* Contract ID
* Application ID
* Private key (PKCS1 PEM)
* Depending on which private sharing mode you run, you may need a valid digi.me client application ([See below for more info](#setting-up-the-digi.me-library))

We've provided an example contract ID and private key for testing out private sharing. In order to obtain an application ID, please fill out the [registration form](https://go.digi.me/developers/register).

Contract ID : `fJI8P5Z4cIhP3HawlXVvxWBrbyj5QkTF`

Example Key: [digi-me-example.key](/examples/private-sharing/digi-me-example.key)

To run the application, please run the command: `npm start:private-sharing`

### Two user private sharing flows

There are two ways for users to give consent to your digi.me library:
A. **Using the official digi.me application (recommended)** - You will need to have the digi.me client installed to run this flow. Install the digi.me client from [here](https://digi.me/get-started) and create a library with some data that we can share. If you would like a pre-populated library, you can connect to one of our existing libraries, please contact digi.me for details.
B. **Guest consent (demo)** - We can offer a private sharing flow which asks for the user data from the browser. As part of this flow, the users will need to go through the adding of services to provide the data to be shared to your application. When the user data is ready, the callback URL will be called and you can then request user data using our SDK. This flow is currently in demo mode with improvements to come in the coming months.

### Going through the example - A. Native Application Flow

You are able to switch between the different user flows by either calling `getAuthorizeUrl` (native application flow) or `getGuestAuthorizeUrl` (guest consent flow) from the SDK.
1. **Navigate to the example app** - Once you open up the second URL on your device, you should see a screen that has a button that says `Share via digi.me`

2. **Provide consent** - If you have the digi.me client installed, you should be able to complete the private sharing flow. Click on the `Share via digi.me` button in the starting page. It should bring up the digi.me client and prompt you for consent. Once the user gives consent, the user should be taken to a new page on the browser which displays `Thank you for sharing your data...`

3. **See data shared** - After consent has been given, in the console log you should see a list of all the data that was received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.

### Going through the example - B. Guest Consent Flow

You are able to switch between the different user flows by either calling `getAuthorizeUrl` (mobile flow) or `getGuestAuthorizeUrl` (guest consent flow) from the SDK. By default, this example uses the guest consent flow.
1. **Navigate to the example app** - Once you open up the second URL on your device, you should see a screen that has a button that says `Share as guest`

2. **Provide consent** - Click on the `Share as guest` button in the starting page. It should bring up digi.me private sharing page in another browser tab. From this flow you should see the contract details. The user will need to onboard different services to provide the data that can be passed back to the example application. Once the services are onboarded, the user will be asked to consent to sharing their data. Upon given the consent, the user should be taken to a new page on the browser which displays `Thank you for sharing your data...`

3. **See data shared** - After consent has been given, in the console log you should see a list of all the data that was received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.

## To run the postbox example application
In this example you will see how we are able to push data into a user's digi.me using Postbox. Before you can run the application you'll need:

* Contract ID
* Application ID

We've provided an example contract ID and private key for testing out private sharing.

Contract ID : `Cb1JC2tIatLfF7LH1ksmdNx4AfYPszIn`

In order to obtain an application ID, please fill out the [registration form](https://go.digi.me/developers/register).

To run the application, please run the command: `npm start:postbox`

## Checking out our SDK

This example was built upon the digi.me JavaScript SDK. You can find more information [here](https://github.com/digime/digime-sdk-js/).
