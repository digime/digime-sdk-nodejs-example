const express = require("express");
const url = require("url");
const trimEnd = require("lodash.trimend");
const fs = require("fs");

const getBasePath = (req) => url.format({
    protocol: req.protocol,
    host: req.headers.host,
    pathname: trimEnd(req.originalUrl, "/"),
});

// Some setup for the Express server
const app = express();
const port = 8081;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// If you need or want to specify different initialization options you can create the SDK like this:
// const { createSDK } = require("@digime/digime-js-sdk");
// const { establishSession, getWebURL, getDataForSession, getAppURL } = createSDK({ host: "api.digi.me" });

// Since we do not need to specify different initialization options we will import the functions directly:
const { establishSession, getWebURL, getDataForSession, getAppURL } = require("@digime/digime-js-sdk");

// Options that we will pass to the Digi.me SDK
const APP = {

    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by Digi.me
    appId: "[PLACEHOLDER_APP_ID]",

    // Replace [PLACEHOLDER_CONTRACT_ID] with the Contract ID that was provided to you by Digi.me
    contractId: "[PLACEHOLDER_CONTRACT_ID]",

    // Put your private key file (digi-me-private.key) provided by Digi.me next to your index.js file.
    // If the file name is different please update it below.
    key: fs.readFileSync("./digi-me-private.key"),
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get('/', (req, res) => {

    // First thing to do is to establish a session by using our Application ID and Contract ID
    establishSession(APP.appId, APP.contractId).then((session) => {

        /*
         * Once the session is established we have two options here:
         * we can pass the Application ID, session and a callback URL
         * to the "getAppUrl" to get a link to which you will need to direct the user to.
         * or we pass the session and a callback URL
         * to the "getWebURL" to get a web link to which you will need to direct the user to.
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
         * - result=DATA_READY (User has approved our request, and data is available to be retrieved)
         * - result=CANCELLED (User has denied our request)
         *
         */
        const weburl = getWebURL(
            session,
            `${getBasePath(req)}/return?sessionId=${session.sessionKey}`
        );

        const appurl = getAppURL(
            APP.appId,
            session,
            `${getBasePath(req)}/return?sessionId=${session.sessionKey}`
        );

        // Present the generated URL with a pretty template
        res.render('pages/index', { weburl, appurl });
    });
});

// Here we are creating the return path, that was mentioned earlier and was passed to the `getAppURL` function.
app.get("/return", (req, res) => {

    // Next three variables are used for UI presentation only
    let consentdata = [];
    let totalItems = 0;
    let errors = [];

    // This is the result of consent request that was sent to Digi.me
    const result = req.query.result;

    // If we did not get the response that the consent was APPROVED, there's not much we can do,
    // so we're just gonna stop and show an sad error page. :(
    if (result !== "DATA_READY") {
        res.render('pages/error');
        return;
    }

    // If we get do get the information that the consent request was APPROVED,
    // the data is ready to be retrieved and consumed!

    // Here, we're using `getDataForSession` to retrieve the data from Digi.me API,
    // by using the Session ID and the private key.
    //
    // Additionally, we're passing in the function that will receive data from the retrieved files.
    // This function serves as a callback function that will be called for each file, with the decrypted data,
    // after it was retrieved and decrypted with your key.
    const data = getDataForSession(
        req.query.sessionId, // Our Session ID that we retrieved from the URL
        APP.key, // The private key we setup above
        ({fileData, fileName, fileDescriptor}) => {
            // This is where you deal with any data you receive from Digi.me,
            // in this case, we're just printing it out to the console.
            // You probably have a better idea on what to do with it! :)
            console.log("============================================================================");
            console.log("Retrieved: ", fileName);
            console.log("============================================================================");
            console.log("Descriptor:\n", JSON.stringify(fileDescriptor, null, 2));
            console.log("Content:\n", JSON.stringify(fileData, null, 2));
            console.log("============================================================================");

            // Used to show total items and data we got on UI
            totalItems += fileData.length;
            consentdata.push({
                fileName,
                fileDescriptor,
                fileData
            });
        },
        ({fileName, error}) => {
            console.log("============================================================================");
            console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
            console.log("============================================================================");

            // Used to show errors on UI
            errors.push(`Error retrieving file ${fileName}: ${error.toString()}`);
        },
    );

    // `getDataForSession` returns a promise that will resolve once every file was processed.
    data.then(() => {
        console.log("============================================================================");
        console.log("Data fetching complete.");
        console.log("============================================================================");
        // And we're just presenting a nice page here, thanking the user for their data!
        res.render('pages/return', { errors, consentdata, totalItems });
    });
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
