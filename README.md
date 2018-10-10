# digime-js-sdk-example

---

## Instructions

### Prerequisites
1. **Obtain credentials from digi.me** - In order to run this example app, you'll need from digi.me:
    1. Contract ID
    2. Application ID
    3. Private key (in PKCS1 format)
    4. Valid iOS and/or Android client applications

2. **Update example app with custom details** - 

    a. Once you have all the above from step 1, you will need to update the config object on [`line 14` in `index.js` ](https://github.com/digime/digime-js-sdk-example/blob/sdk/index.js#L14) to add your Application ID and Contract ID. 
    
    b. Copy the private key to the root of the project folder and update the [private key path](https://github.com/digime/digime-js-sdk-example/blob/sdk/index.js#L16) accordingly. 
    
    c. Find the IP address of your local server by typing `ipconfig` (or `ifconfig` for macOS) in your terminal on the server and make note of your IPv4 address. 
    
    d. Update the callback URL on [`line 22` in `index.js`](https://github.com/digime/digime-js-sdk-example/blob/sdk/index.js#L22) so the line looks something like:
    
    ```javascript
    url: getAppURL(APP.appId, session, "http://<YOUR_LOCAL_SERVER_ADDRESS>:8081/return?sessionId=" + session.sessionKey)
    ```

3. **Set up local server** - In order to run the example application, you'll also need to have Node 8 or above and npm installed on your machine. We will run a local server on your machine which will serve the pages that the mobile clients will read. On [line 11](https://github.com/digime/digime-js-sdk-example/blob/sdk/index.js#L11) you can find the initialisation of our SDK to a specific digi.me environment. Unless otherwise instructed, you can leave the parameters to `createSDK` blank.

4. **Set up digi.me library on your iOS/Android phone** - You'll also need to have an Android or iOS device with the digi.me client installed. You will need a special build that digi.me will provide. Install the digi.me client and create a library with some data that we can share. If you would like a pre-populated library, you can connect to one of our existing libraries, please contact us for details.

### Running the example
1. **Start the local server** - To run, install all dependencies by typing `npm install` in your terminal. Afterwards type `npm run start` to run the local server. To see the starting page, on your local server, go to the address `http://localhost:8081/` in your browser. You should see a screen that has a button that says `Launch Consent Request`

2. **Go to the start page on your mobile device** - In order to test the whole flow on consent access, you'll need to start this webpage on your mobile device. In the browser of your phone, go to the address `http://<YOUR_LOCAL_SERVER_IP_ADDRESS>:8081/`. You should see the same starting page on your mobile device. Please note that your mobile device must be on the same network as your local server. 

3. **Provide consent** - If you have the digi.me client installed, you should be able to complete the consent access flow. Click on the `Launch Consent Request` button in the starting page. It should bring up the digi.me client and prompt you for consent. Once the user gives consent, the user should be taken to a new page on the browser which displays `Thank you for your data!`

4. **See data shared** - In the terminal from step 1, you should see the data that is shared from the user. This is what the user has given consent to in step 3 above.
