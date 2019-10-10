// @ts-check
const express = require("express");
const fs = require("fs");
const { getBasePath } = require("./../../utils");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + '/assets'));

// If you need or want to specify different initialization options you can create the SDK like this:
// const { init } = require("@digime/digime-js-sdk");
// const { establishSession, getGuestAuthorizeUrl, getSessionData, getAuthorizeUrl } = init({ baseUrl: "https://api.development.devdigi.me/v1.4" });


// Since we do not need to specify different initialization options we will import the functions directly:
const { establishSession, getGuestAuthorizeUrl, getSessionData, getAuthorizeUrl } = require("@digime/digime-js-sdk");

// Options that we will pass to the digi.me SDK
const APP = {

    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by digi.me
    appId: "[PLACEHOLDER_APP_ID]",

    // Replace [PLACEHOLDER_CONTRACT_ID] with the Contract ID that was provided to you by digi.me
    contractId: "[PLACEHOLDER_CONTRACT_ID]",

    // Put your private key file (digi-me-private.key) provided by digi.me next to your index.js file.
    // Replace [PLACEHOLDER_PATH_TO_PRIVATE_KEY] with the path to the key in relation to the private-sharing folder.
    // For example, if the file is digi-me-private.key and next to the index.js file, put in /digi-me-private.key.
    key: fs.readFileSync(__dirname + "[PLACEHOLDER_PATH_TO_PRIVATE_KEY]"),
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
        const webUrl = getGuestAuthorizeUrl(
            session,
            `${getBasePath(req)}/return?sessionId=${session.sessionKey}`
        );

        const appUrl = getAuthorizeUrl(
            APP.appId,
            session,
            `${getBasePath(req)}/return?sessionId=${session.sessionKey}`
        );

        // Present the generated URL with a pretty template
        res.render("pages/index", { webUrl, appUrl });
    });
});

// Here we are creating the return path, that was mentioned earlier and was passed to the `getAppURL` function.
app.get("/return", (req, res) => {

    // This is the result of private sharing request that was sent to Digi.me
    const result = req.query.result;

    // If we did not get the response that the private sharing was APPROVED, there's not much we can do,
    // so we're just gonna stop and show an sad error page. :(
    if (result !== "SUCCESS") {
        res.render("pages/error");
        return;
    }

    // If we get do get the information that the private sharing request was APPROVED,
    // the data is ready to be retrieved and consumed!

    // Here, we're using `getSessionData` to retrieve the data from digi.me API,
    // by using the Session ID and the private key.
    //
    // Additionally, we're passing in the function that will receive data from the retrieved files.
    // This function serves as a callback function that will be called for each file, with the decrypted data,
    // after it was retrieved and decrypted with your key.
    const {filePromise} = getSessionData(
        req.query.sessionId, // Our Session ID that we retrieved from the URL
        APP.key, // The private key we setup above
        ({fileData, fileName, fileDescriptor}) => {
            // This is where you deal with any data you receive from digi.me,
            // in this case, we're just printing it out to the console.
            // You probably have a better idea on what to do with it! :)
            console.log("============================================================================");
            console.log("Retrieved: ", fileName);
            console.log("============================================================================");
            console.log("Descriptor:\n", JSON.stringify(fileDescriptor, null, 2));
            console.log("Content:\n", JSON.stringify(fileData, null, 2));
            console.log("============================================================================");
        },
        ({fileName, error}) => {
            console.log("============================================================================");
            console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
            console.log("============================================================================");
        },
    );

    // `getSessionData` returns a promise that will resolve once every file was processed.
    filePromise.then(() => {
        console.log("============================================================================");
        console.log("Data fetching complete.");
        console.log("============================================================================");
        // And we're just presenting a nice page here, thanking the user for their data!
        res.render("pages/return");
    });
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
