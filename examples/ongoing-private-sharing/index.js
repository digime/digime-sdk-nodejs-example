// @ts-check
const express = require("express");
const fs = require("fs");
const shortid = require('shortid');
const { getOrigin } = require("./../../utils");
const { URLSearchParams } = require("url");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + '/assets'));

// If you need or want to specify different initialization options you can create the SDK like this:
// const { init } = require("@digime/digime-js-sdk");
// const { establishSession, exchangeCodeForToken, getSessionData, authorizeOngoingAccess, getFileList } = init({ baseUrl: "https://api.development.devdigi.me/v1.4" });


// Since we do not need to specify different initialization options we will import the functions directly:
const { establishSession, exchangeCodeForToken, getSessionData, authorizeOngoingAccess, getFileList } = require("@digime/digime-js-sdk");

// Options that we will pass to the digi.me SDK
const APP = {

    // Visit https://go.digi.me/developers/register to get your Application ID
    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by digi.me
    appId: "PLACEHOLDER_APP_ID",

    // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
    // Replace test Contract ID with the Contract ID that was provided to you by digi.me
    contractId: "yrg1LktWk2gldVk8atD5Pf7Um4c1LnMs",

    // Put your private key file (digi-me-private.key) provided by Digi.me next to your index.js file.
    // If the file name is different please update it below.
    key: fs.readFileSync(__dirname + "/digi-me-example.key"),
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get('/', (req, res) => {

    // In this example, let's assume we assign every user who hits the page a new user ID unless specified
    let userId = req.query.userId || shortid.generate();

    // Present the generated URL with a pretty template
    res.render("pages/index", { appUrl: `${getOrigin(req)}/fetch?userId=${userId}` });
});

app.get('/error', (req, res) => {
    res.render("pages/error");
});

app.get("/fetch", async (req, res) => {
    const userId = req.query.userId.toString();

    if(!userId){
        res.render("pages/error");
        return;
    }

    // We are using scoping to select only playHistory objects (406) since we do not need any other data
    const scope = {
        serviceGroups: [
            {
                id: 5,
                serviceTypes: [
                    {
                        id: 19,
                        serviceObjectTypes: [{ id: 406 }]
                    }
                ]
            }
        ]
    }

    // First thing to do is to establish a session by using our Application ID and Contract ID
    const session = await establishSession(APP.appId, APP.contractId, scope);

    /*
    * Once we have a session, we can call "authorizeOngoingAccess" to see if we are authorized to fetch user data
    * In order to call this function you'll need to following details:
    *
    * - application ID - The same one you used when establishing the session
    * - contract ID - The same one you used when establishing the session
    * - private key - Private key provided by digi.me
    * - redirect URI - The URL which is called when the digi.me flow is complete. This needs to match the one that is
    *                  set in the contract.
    * - state (optional) - All extra information that you'd like to be passed back with the redirect URL. It is
    *                      useful to pass something that can help you identify the user when the digi.me flow is
    *                      complete. In this example, we're passing in the user ID here.
    * - access token (optional) - If you already have an access token for this user from previous fetches, pass this
    *                             in here. If the token is valid, you can go straight to getting the data.
    *
    *
    * With regards to the callback URL:
    *
    * The route for it is created later on in this file.
    * You should probably lock this down in your own production code, but for demonstation purposes we're just
    * blindly using the hostname from the request, which you probably shouldn't do.
    */

    let users;
    try {
        // See if we already have an existing access token for this user. We have stored user tokens on
        // a text file on the server. You may want to use a database for this.
        users = JSON.parse(fs.readFileSync(__dirname + "/users.json", "utf8"));
    } catch (error) {
        users = {};
    }

    const state = new URLSearchParams({ userId, sessionKey: session.sessionKey }).toString();
    const accessToken = users[userId] ? users[userId].accessToken : null;
    const authorizationResponse = await authorizeOngoingAccess(
        {
            applicationId: APP.appId,
            contractId: APP.contractId,
            privateKey: APP.key,
            redirectUri: `${getOrigin(req)}/return`,
            state,
            accessToken,
        },
        session,
    );

    if (authorizationResponse.dataAuthorized) {
        // Authorization successful. The user token we have provided can be used to fetch.
        const {updatedAccessToken} = authorizationResponse;

        // The latest token is also passed back and can be stored on our server for future fetches. We have stored
        // user tokens on a text file on the server. You may want to use a database for this.
        users[userId] = {accessToken : updatedAccessToken};
        fs.writeFileSync(__dirname + "/users.json", JSON.stringify(users));

        // With authorization success, we can forward the user to a page where we can display the data
        res.redirect(`${getOrigin(req)}/preparing?sessionKey=${session.sessionKey}&userId=${userId}`);
    } else {
        // Authorization unsuccessful. We need to ask user for permission for their data.
        const {authorizationUrl, codeVerifier} = authorizationResponse;

        // We need to store the code verifier for this user so we can exchange for an access token further down the line
        users[userId] = {codeVerifier};

        fs.writeFileSync(__dirname + "/users.json", JSON.stringify(users));

        // Authorization URL can be called to prompt the user for consent. They will need to have
        // the digi.me client installed.
        res.redirect(authorizationUrl);
    }
});

// Here we are creating the return path we mentioned earlier and was passed to the `authorizeOngoingAccess` function.
app.get("/return", async (req, res) => {

    // This is the result of private sharing request that was sent to Digi.me
    const {code, result, state} = req.query;

    const params = new URLSearchParams(state.toString())
    const sessionKey = params.get("sessionKey");
    const userId = params.get("userId");

    // If we did not get the response that the private sharing was a SUCCESS, there's not much we can do,
    // so we're just gonna stop and show a sad error page. :(
    if (result !== "SUCCESS") {
        res.render("pages/error");
        return;
    }

    // Now that we have a code returned, together with the code verifier which we stored for this user earlier
    // we can exchange it for an access token by calling "exchangeCodeForToken". The other params are similar
    // to the ones we used in the "authorizeOngoingAccess" call earlier
    const users = JSON.parse(fs.readFileSync(__dirname + "/users.json", "utf8"));

    const accessToken = await exchangeCodeForToken(
        {
            applicationId: APP.appId,
            contractId: APP.contractId,
            privateKey: APP.key,
            redirectUri: `${getOrigin(req)}/return`,
        },
        code.toString(),
        users[userId].codeVerifier, // user ID is passed back as "state" from the digi.me flow.

    );

    users[userId] = {accessToken};

    // Since they've given us ongoing consent, we can store the access token against the user so next time this user
    // logs in, we can use their access token to fetch their updated data without needing to use the digi.me app.
    fs.writeFileSync(__dirname + "/users.json", JSON.stringify(users));

    res.redirect(`${getOrigin(req)}/preparing?sessionKey=${sessionKey}&userId=${userId}`)
});

app.post("/file-list", (req, res) => {
    getFileList(req.query.sessionKey.toString()).then((response) => {
        res.json(response);
    }).catch((e) => {
        // tslint:disable-next-line:no-console
        console.error(e.toString());
        res.status(404);
        res.end();
    });
});

app.get("/preparing", async (req, res) => {
    const {sessionKey, userId} = req.query;
    res.render("pages/preparing", {
        checkFileListUrl: `${getOrigin(req)}/file-list?sessionKey=${sessionKey}`,
        showResultsUrl: `${getOrigin(req)}/results?userId=${userId}&sessionKey=${sessionKey}`,
        errorUrl: `${getOrigin(req)}/error`,
    });
});

app.get("/results", async (req, res) => {
    const {sessionKey, userId} = req.query;
    let genres = []; // Used for Genrefy App example

    // If we got the response from "authorizeOngoingAccess" that the data is authorized,
    // the data is ready to be retrieved and consumed!

    // Here, we're using `getSessionData` to retrieve the data from digi.me API,
    // by using the Session Key and the private key.
    //
    // Additionally, we're passing in the function that will receive data from the retrieved files.
    // This function serves as a callback function that will be called for each file, with the decrypted data,
    // after it was retrieved and decrypted with your key.
    const {filePromise} = getSessionData(
        sessionKey.toString(), // Our Session ID that we retrieved from the URL
        APP.key, // The private key we setup above
        ({fileData, fileName, fileMetadata}) => {
            // This is where you deal with any data you receive from digi.me,
            // in this case, we're just printing it out to the console.
            // You probably have a better idea on what to do with it! :)
            console.log("============================================================================");
            console.log("Retrieved: ", fileName);
            console.log("============================================================================");
            console.log("Metadata:\n", JSON.stringify(fileMetadata, null, 2));
            console.log("Content:\n", JSON.stringify(fileData, null, 2));
            console.log("============================================================================");

            // Begin preparing data for Genrefy App
            fileData.forEach(playHistroyObject => {
                if (
                    playHistroyObject &&
                    playHistroyObject.track &&
                    playHistroyObject.track.artists &&
                    playHistroyObject.track.artists.length > 0
                ) {
                    playHistroyObject.track.artists.forEach(artist => {
                        genres = genres.concat(artist.genres);
                    });
                }
            });
            // End preparing data for Genrefy App
        },
        ({fileName, error}) => {
            console.log("============================================================================");
            console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
            console.log("============================================================================");
        },
    );
    await filePromise;

    // Begin preparing data for Genrefy App
    let songsNumber = [];

    const groupedGenres = genres.reduce((total, value) => {
        total[value] = (total[value] || 0) + 1;
        return total;
    }, {});

    const genresEntries = Object.entries(groupedGenres);
    const sortedGenres = genresEntries.sort((a, b) =>  b[1] - a[1]);
    const groupedGenresValues = Object.values(groupedGenres);

    if (groupedGenresValues && groupedGenresValues.length > 0) {
        songsNumber = groupedGenresValues.reduce((a, b) => a + b);
    }
    // End preparing data for Genrefy App

    // `getSessionData` returns a promise that will resolve once every file was processed.
    console.log("============================================================================");
    console.log("Data fetching complete.");
    console.log("============================================================================");
    // And we're just presenting a nice page here, thanking the user for their data!

    // Now that we have the user's accessToken in our app, the next time they visit our site, we can automatically
    // check for their data without the need for the digi.me to be triggered.
    res.render("pages/return", {
        startOverUrl: `${getOrigin(req)}/?userId=${userId}`,
        sortedGenres: sortedGenres,
        songsNumber: songsNumber,
    });
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
