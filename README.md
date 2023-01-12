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
This repository contains example applications built on the [digi.me Node.js SDK](https://github.com/digime/digime-sdk-nodejs/). There are two example applications in this repository. One showcases private sharing, and the other showcasing postbox. You can find out more able both of these in our [documentation](https://digime.github.io/digime-sdk-nodejs/pages/guides/start.html).

## Preparation

### On the machine that will run the example you'll need:
* Node version 14.0 or greater, with NPM
* git (optional)

## Installation
1. [Download](https://github.com/digime/digime-sdk-nodejs-example/archive/master.zip) and extract, or clone the `master` branch on this repo with the following command:

    `git clone https://github.com/digime/digime-sdk-nodejs-example.git`

2. In your terminal, navigate to the directory where you cloned/extracted this example (If you see this README in it, you're in the correct place!)

3. Run `npm install` in your terminal

4. Open the desired example in the `examples/[your desired example]/index.js` file in your favourite code editor, and replace the placeholders with the values you received from digi.me (described in the code comments as well).

5. Run `npm start:read-example` or `npm start:write-example` in your terminal to run the read or write example:

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

We've provided an example contract ID and private key for testing out private sharing. In order to obtain an application ID, please fill out the [registration form](https://go.digi.me/developers/register).

Contract ID : `fJI8P5Z4cIhP3HawlXVvxWBrbyj5QkTF`

Example Key: [digi-me-example.key](/examples/private-sharing/digi-me-example.key)

To run the application, please run the command: `npm start:read-example`

### Two user private sharing flows

1. **Navigate to the example app** - Once you initialize the flow our SaaS webpage will be opened where we request from user authorization and user should be permitted to `Give access` for requested data.

2. **Give access** - Click on the `Give access` button in the SaaS page you user should be brought back to the partner app and presented with a screen of partner choice congratulation or given access data.

3. **See data shared** - After consent has been given, in the console log you should see a list of all the data that was received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.

## To run the write example application
In this example you will see how we are able to push data into a user's digi.me. Before you can run the application you'll need:

* Contract ID
* Application ID

We've provided an example contract ID and private key for testing out private sharing.

Contract ID : `Cb1JC2tIatLfF7LH1ksmdNx4AfYPszIn`

In order to obtain an application ID, please fill out the [registration form](https://go.digi.me/developers/register).

To run the application, please run the command: `npm start:write-example`

## Checking out our SDK

This example was built upon the digi.me Node.js SDK. You can find more information [here](https://github.com/digime/digime-sdk-nodejs-example/).
