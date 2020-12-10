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
// const { init } = require("@digime/digime-sdk-js");
// const { establishSession, authorize, push } = init({ baseUrl: "https://api.digi.me/v1.5" });

// Since we do not need to specify different initialization options we will import the functions directly:
 const { establishSession, authorize, push } = require("@digime/digime-js-sdk");

// Options that we will pass to the digi.me SDK
const APP = {

    // Visit https://go.digi.me/developers/register to get your Application ID
    // Replace [PLACEHOLDER_APP_ID] with the Application ID that was provided to you by digi.me
    appId: "PLACEHOLDER_APP_ID",

    // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
    // Replace test Contract ID with the Contract ID that was provided to you by digi.me
    contractId: "Cb1JC2tIatLfF7LH1ksmdNx4AfYPszIn",

    // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
    // We also need the private key of the contract to encrypt the data we send via postbox.
    privateKey: fs.readFileSync(__dirname + "/postbox-example.key").toString(),

    // This is the redirectUri that will be used after the user has given consent on the digi.me client.
    // This uri needs to be whitelisted on the contract. 
    redirectUri: "http://localhost:8081/push",
};

// In this route, we are presenting the user with an action that will take them to digi.me
app.get("/", (req, res) => {
    res.render("pages/index", {
        actionUrl: `${getOrigin(req)}/send-receipt`
    });
});

// Route hit by clicking on the "Send me the receipt button"
app.get("/send-receipt", async (req, res) => {

    // First thing to do is to establish a session by using our Application ID and Contract ID
    const session = await establishSession({
        applicationId: APP.appId, 
        contractId: APP.contractId
    })

    // Retrieve URL for opening the digi.me application with the correct parameters
    const appUrl = authorize.once.getCreatePostboxUrl({
        applicationId: APP.appId,
        session,
        callbackUrl: `${getOrigin(req)}/push?sessionKey=${session.sessionKey}`
    });

    // Redirect to the digi.me application
    res.redirect(appUrl);
});

// Route defined as a callback URL in the route above, digi.me app hits this after the user grants permission
app.get("/push", async (req, res) => {
    const { result, postboxId, publicKey, sessionKey } = req.query;

    const canPush = (result === "SUCCESS" || result === "POSTBOX_READY") && postboxId && publicKey && sessionKey;

    if (!canPush) {
        res.render("pages/error");
        return;
    }

    const filePath = `${__dirname}/receipt.png`;
    const receipt = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    try {
        await push.pushDataToPostbox({
            sessionKey: sessionKey.toString(), 
            postboxId: postboxId.toString(), 
            publicKey: publicKey.toString(), 
            data: {
                fileData: receipt,
                fileName,
                fileDescriptor: {
                    mimeType: "image/png",
                    tags: ["receipt"],
                    reference: [fileName],
                    accounts: [{ accountId: "1"}],
                },
            },
            applicationId: APP.appId,
            contractId: APP.contractId,
            redirectUri: `${getOrigin(req)}/push`,
            privateKey: APP.privateKey,
        })
        
        res.render("pages/return", {
            actionUrl: push.getPostboxImportUrl()
        });
    } catch(e) {
        // tslint:disable-next-line:no-console
        console.error(e.toString());
        res.render("pages/error");
        return;
    }
});

app.listen(port, () => {
    console.log([
        "Example app now running on:",
        `- http://localhost:${port}`,
        `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n"));
});
