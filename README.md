# digime-js-sdk-example

---
## Preparation
In order to run this example app, you'll need to perform some preparation steps:

#### Obtain the following from digi.me:
* Contract ID
* Application ID
* Private key (PKCS1 PEM)
* Depending on which consent mode you run, you may need a valid Digi.me client application on your phone/desktop, with a library created on it ([See below for more info](#setting-up-the-digi.me-library))

#### On the machine that will run the example:
* Node version 8.6 or greater, with NPM
* git (optional)

## Installation
1. [Download](https://github.com/digime/digime-js-sdk-example/archive/sdk.zip) and extract, or clone the `sdk` branch on this repo with the following command:

    `git clone --single-branch -b sdk git@github.com:digime/digime-js-sdk-example.git`

2. In your terminal, navigate to the directory where you cloned/extracted this example (If you see this README in it, you're in the correct place!)

3. Run `npm install` in your terminal

4. Open the `index.js` file in your favourite code editor, and replace or adjust environment variable with values you received from digi.me (described in code comments as well).

5. Run `npm start` in your terminal

    This should print out something along these lines:

    ```Example app now running on:
    - http://localhost:8081
    - http://192.168.0.10:8081 (probably)
    ```

6. You should now be able to access the example app 🎉:
    - First URL should be able to be opened on the same machine you started the server (So you can be sure it's running)
    - The second URL is our best guess as to what your local network IP is. You should be able to open the example app from your phone with it, assuming that both machines are on the same network.

## Additional information

### Two user consent flows

There are two ways for users to give consent to your digi.me library:
A. **Using the official digi.me application (recommended)** - You will need to have the digi.me client installed to run this flow. Install the digi.me client from [here](https://digi.me/get-started) and create a library with some data that we can share. If you would like a pre-populated library, you can connect to one of our existing libraries, please contact digi.me for details.
B. **Guest consent (demo)** - We can offer a guest consent flow which asks for the user data from the browser. As part of this flow, the users will need to go through the adding of services to provide the data to be shared to your application. When the user data is ready, the callback URL will be called and you can then request user data using our SDK. This flow is currently in demo mode with improvements to come in the coming months.

### Going through the example - A. Native Application Flow

You are able to switch between the different user flows by either calling `getAppURL` (native application flow) or `getWebURL` (guest consent flow) from the SDK.
1. **Navigate to the example app** - Once you open up the second URL on your device, you should see a screen that has a button that says `Launch Native App Consent Request`

2. **Provide consent** - If you have the digi.me client installed, you should be able to complete the consent access flow. Click on the `Launch Consent Request` button in the starting page. It should bring up the digi.me client and prompt you for consent. Once the user gives consent, the user should be taken to a new page on the browser which displays `Thank you for your data!`

3. **See data shared** - In the last step of the example application, you'll be taken to an end page where we will list all the data that we've received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.

### Going through the example - B. Guest Consent Flow

You are able to switch between the different user flows by either calling `getAppURL` (mobile flow) or `getWebURL` (guest consent flow) from the SDK. By default, this example uses the guest consent flow.
1. **Navigate to the example app** - Once you open up the second URL on your device, you should see a screen that has a button that says `Launch Web Consent Request`

2. **Provide consent** - Click on the `Launch Web Consent Request` button in the starting page. It should bring up digi.me consent page in another browser tab. From this flow you should see the contract details. The user will need to onboard different services to provide the data that can be passed back to the example application. Once the services are onboarded, the user will be asked to consent to sharing their data. Upon given the consent, the user should be taken to a new page on the browser which displays `Thank you for your data!`

3. **See data shared** - In the last step of the example application, we will list all the data that we've received from the user. You should see the number of items that have been shared, all the objects listed per file, and a description of what kind of data has been listed under each file.