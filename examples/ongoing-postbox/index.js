// @ts-check
const express = require("express");
const fs = require("fs");
const path = require("path");
const shortid = require('shortid');
const { getOrigin } = require("./../../utils");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + '/assets'));

// If you need or want to specify different initialization options you can create the SDK like this:
// const { init } = require("@digime/digime-js-sdk");
// const { establishSession, authorize, push } = init({ baseUrl: "https://api.digi.me" });

// Since we do not need to specify different initialization options we will import the functions directly:
const { establishSession, authorize, push } = require("@digime/digime-js-sdk");

// Options that we will pass to the digi.me SDK
const APP = {

    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by digi.me
    appId: "PLACEHOLDER_APP_ID",

    // Replace [PLACEHOLDER_CONTRACT_ID] with the Contract ID that was provided to you by digi.me
    contractId: "V5cRNEhdXHWqDEM54tZNqBaElDQcfl4v",

    // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
    // We also need the private key of the contract to encrypt the data we send via postbox.
    key: fs.readFileSync(__dirname + "/example-ongoing-postbox.key").toString(),

    // This is the redirectUri that will be used after the user has given consent on the digi.me client.
    // This uri needs to be whitelisted on the contract.
    redirectUri: "http://localhost:8081/exchange-token",
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get("/", (req, res) => {

    let userId = req.query.userId || shortid.generate();

    res.render("pages/index", {
        actionUrl: `${getOrigin(req)}/send-receipt?userId=${userId}`
    });
});

// Route hit by clicking on the "Send me the receipt button"
app.get("/send-receipt", async (req, res) => {

    const {userId} = req.query;

    // Let's check whether we have the access token for this user in our system.
    // For demo purposes, we have stored this on a text file on the server.
    // In your system, you may want something a bit more sophisticated.
    const userDetails = getUserbyId(userId)
    if (userDetails && userDetails.accessToken){

        // If we already have an access token, we can go ahead and push data to the user.
        res.redirect(`${getOrigin(req)}/push?userId=${userId}`);
        return;
    }

    // We don't have an existing access token for this user. Let's create one.
    // First thing to do is to establish a session by using our Application ID and Contract ID
    const session = await establishSession({
        applicationId: APP.appId,
        contractId: APP.contractId
    });

    const state = new URLSearchParams({
        sessionKey: session.sessionKey,
        userId: userId.toString(),
    }).toString();

    // Retrieve URL for opening the digi.me application with the correct parameters
    const result = await authorize.ongoing.getCreatePostboxUrl({
        redirectUri: APP.redirectUri,
        session,
        state,
        applicationId: APP.appId,
        contractId: APP.contractId,
        privateKey: APP.key,
    });

    writeToUser(userId, {
        codeVerifier: result.codeVerifier
    })

    res.redirect(result.url);
});

app.get("/exchange-token", async (req, res) => {
    const { result, postboxId, publicKey, state, code } = req.query;

    const canPush = (result === "SUCCESS" || result === "POSTBOX_READY") && postboxId && publicKey && state;

    if (!canPush) {
        res.render("pages/error");
        return;
    }

    const params = new URLSearchParams(state.toString())
    const userId = params.get("userId");
    const details = getUserbyId(userId);

    const accessToken = await authorize.exchangeCodeForToken({
        applicationId: APP.appId,
        contractId: APP.contractId,
        privateKey: APP.key,
        redirectUri: APP.redirectUri,
        authorizationCode: code.toString(),
        codeVerifier: details.codeVerifier,
    })

    writeToUser(userId, { accessToken, postboxId, publicKey });

    res.redirect(`${getOrigin(req)}/push?userId=${userId}`)
});

// Route defined as a callback URL in the route above, digi.me app hits this after the user grants permission
app.get("/push", async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        res.render("pages/error");
        return;
    }

    const session = await establishSession({
        applicationId: APP.appId,
        contractId: APP.contractId
    })

    const details = getUserbyId(userId);
    const receipt = fs.readFileSync(`${__dirname}/assets/receipt.json`);
    const receiptReference = `Receipt ${new Date().toLocaleString()}`;

    await push.pushDataToPostbox({
        applicationId: APP.appId,
        contractId: APP.contractId,
        privateKey: APP.key,
        redirectUri: APP.redirectUri,
        userAccessToken: details.accessToken,
        sessionKey: session.sessionKey,
        postboxId: details.postboxId,
        publicKey: details.publicKey,
        data: {
            fileData: receipt,
            fileName: receiptReference,
            fileDescriptor: {
                mimeType: "application/json",
                tags: ["receipt, groceries"],
                reference: [receiptReference],
                accounts: [{ accountId: "accountId"}],
            },
        }
    });

    res.render("pages/return", {
        pushAnotherUrl: `${getOrigin(req)}/push?userId=${userId}`,
        receiptReference,
        actionUrl: push.getPostboxImportUrl()
    });
});

const getUsers = () => {
    let users;
    try {
        // See if we already have an existing access token for this user. We have stored user tokens on
        // a text file on the server. You may want to use a database for this.
        users = JSON.parse(fs.readFileSync(__dirname + "/users.json", "utf8"));
    } catch (error) {
        users = {};
    }

    return users;
}

const getUserbyId = (id) => {
    return getUsers()[id];
}

const writeToUser = (userId, details) => {
    const users = getUsers();
    users[userId] = details;
    fs.writeFileSync(__dirname + "/users.json", JSON.stringify(users));
}

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
