const express = require("express");
const fs = require("fs");
const path = require("path");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set('view engine', 'ejs');

// If you have no need to modify init options, you should just import the necessary funcitons directly like so:
// const { establishSession, getAppURL, getDataForSession } = require("digime-js-sdk");

// In this case, we're creating a new instance of SDK here because we want to specifiy different initialization options.
const { createSDK } = require("digime-js-sdk");
const { establishSession, getAppURL, getDataForSession, getWebURL } = createSDK({ host: "api.test06.devdigi.me" });

// Options that we will pass to the Digi.me SDK
const APP = {

    // Replace this string with the Application ID that was provided to you by Digi.me
    appId: "[INSERT YOUR APP ID HERE]",

    // Replace this string with the Contract ID that was provided to you by Digi.me
    contractId: "[INSERT YOUR CONTRACT ID HERE]",

    // The key accepts a buffer or a string that contains a PKCS1 PEM key, here we are importing the key from a file
    key: fs.readFileSync(path.resolve(__dirname, "path-to-your.key")),

    // If you're storing this in an environment variable or something similar, you can simply pass it in, for example:
    // key: process.env.digiMeSdkKey
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get('/', (req, res) => {

    // First thing to do is to establish a session by using our Application ID and Contract ID
    establishSession(APP.appId, APP.contractId).then((session) => {

        /*
         OPTION 1
         * Once the session is established we pass the Application ID, session, and a callback URL
         * to the "getAppUrl" to get a link to which you will need to direct the user to.
         *
         * With regards to the callback URL:
         *
         * The route for it is created later on in this file.
         * You should probably lock this down in your own production code,
         * but for demonstation purposes we're just blindly using the hostname from the request,
         * which you probably shouldn't do.
         *
         * We're also passing in the session key, so that we know what session to retrieve the data from
         * when the user returns from Digi.me. You can make this URL contain any additional info you want,
         * for example, the users ID in your system, or something like that.
         *
         * When the Digi.me flow is complete, the user will be directed to this URL, with one of the following
         * added to the query string:
         *
         * - consent=DATA_READY (User has approved our request, and data is available to be retrieved)
         * - consent=CANCELLED (User has denied our request)
         *
            const url = getAppURL(
                APP.appId,
                session,
                `http://${req.headers.host}/return?sessionId=${session.sessionKey}`
            )
        */

        /*
         OPTION 2
         * This option is similar to one explained above but in this flow we will not use app url but web url
         * Method will receive session and a callback URL to get a link to which you will need to direct the user to.
        */
        const url = getWebURL(
            session,
            `http://${req.headers.host}/return?sessionId=${session.sessionKey}`
        )

        // Present the generated URL with a pretty template
        res.render('pages/index', { url });
    });
});

// Here we are creating the return path, that was mentioned earlier and was passed to the `getAppURL` function.
app.get("/return", (req, res) => {

    // This is the result of consent request that was sent to Digi.me
    const result = req.query.result;

    // If we did not get the response that the result was DATA_READY, there's not much we can do,
    // so we're just gonna stop and show an sad error page. :(
    if (result !== "DATA_READY") {
        res.render('pages/error');
        return;
    }

    // If we get do get the information that the result request was DATA_READY,
    // the data is ready to be retrieved and consumed!

    // Here, we're using `getDataForSession` to retrieve the data from Digi.me API,
    // by using the Session ID and the Application ID.
    //
    // Additionally, we're passing in the function that will receive data from the retrieved files.
    // This function serves as a callback function that will be called for each file, with the decrypted data,
    // after it was retrieved and decrypted with your key.
    const data = getDataForSession(
        req.query.sessionId, // Our Session ID that we retrieved from the URL
        APP.key, // The private key we setup above
        (fileData) => {
            // This is where you deal with any data you receive from Digi.me,
            // in this case, we're just printing it out to the console.
            // You probably have a better idea on what to do with it! :)
            console.log("File data: \n", fileData);
        }
    );

    // `getDataForSession` returns a promise that will resolve once every file was processed.
    // Again, we're just logging to console here as an example
    data.then(() => {
        console.log("All files processed");
    });

    // And we're just presenting a nice page here, thanking the user for their data!
    res.render('pages/return');
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
