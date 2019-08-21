// @ts-check
const express = require("express");
const fs = require("fs");
const path = require("path");
const { getOrigin } = require("./../../utils");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + '/assets'));

// If you need or want to specify different initialization options you can create the SDK like this:
// const { createSDK } = require("@digime/digime-js-sdk");
// const { establishSession, getPostboxURL, pushDataToPostbox } = createSDK({ host: "api.digi.me" });

// Since we do not need to specify different initialization options we will import the functions directly:
const { establishSession, getPostboxURL, pushDataToPostbox } = require("@digime/digime-js-sdk");

// Options that we will pass to the Digi.me SDK
const APP = {

    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by Digi.me
    appId: "[PLACEHOLDER_APP_ID]",

    // Replace [PLACEHOLDER_CONTRACT_ID] with the Contract ID that was provided to you by Digi.me
    contractId: "[PLACEHOLDER_CONTRACT_ID]",
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get("/", (req, res) => {
    res.render("pages/index", {
        actionUrl: `${getOrigin(req)}/send-receipt`
    });
});

// Route hit by clicking on the "Send me the receipt button"
app.get("/send-receipt", (req, res) => {

    // First thing to do is to establish a session by using our Application ID and Contract ID
    establishSession(APP.appId, APP.contractId).then((session) => {

        // Retrieve URL for opening the digi.me application with the correct parameters
        const appUrl = getPostboxURL(
            APP.appId,
            session,
            `${getOrigin(req)}/push?sessionKey=${session.sessionKey}`
        );

        // Redirect to the digi.me application
        res.redirect(appUrl);
    });
});

// Route defined as a callback URL in the route above, digi.me app hits this after the user grants permission
app.get("/push", (req, res) => {
    const { result, postboxId, publicKey, sessionKey } = req.query;

    const canPush = result === "POSTBOX_READY" && postboxId && publicKey && sessionKey;

    if (!canPush) {
        res.render("pages/error");
        return;
    }

    const filePath = `${__dirname}/receipt.png`;
    const receipt = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    pushDataToPostbox(sessionKey, postboxId, publicKey, {
        fileData: receipt.toString("base64"),
        fileName,
        fileDescriptor: {
            mimeType: "image/png",
            tags: ["receipt"],
            reference: [fileName],
            accounts: [{ accountId: "1"}],
        },
    }).then(() => {
        res.render("pages/return");
        return;
    }).catch(() => {
        res.render("pages/error");
        return;
    });
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
