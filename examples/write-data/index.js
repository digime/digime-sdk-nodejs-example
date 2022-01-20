// @ts-check
const express = require("express");
const fs = require("fs");
const path = require("path");
const shortid = require("shortid");
const { getOrigin } = require("./../../utils");
const merge = require("lodash.merge");

// Some setup for the Express server
const app = express();
const port = 8081;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/assets"));

// Options that we will pass to the digi.me SDK
// Visit https://go.digi.me/developers/register to get your Application ID
// Replace "PLACEHOLDER_APP_ID" with the Application ID that was provided to you by digi.me
const APP_ID = "PLACEHOLDER_APP_ID";

// This object contains properties that are linked to the contract you're using.
const CONTRACT_DETAILS = {

  // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
  // Replace test Contract ID with the Contract ID that was provided to you by digi.me
  contractId: "V5cRNEhdXHWqDEM54tZNqBaElDQcfl4v",

  // Put your private key file (digi-me-private.key) provided by Digi.me next to your index.js file.
  // If the file name is different please update it below.
  privateKey: fs.readFileSync(__dirname + "/example-write.key").toString(),

  // The redirect URL is linked to your contract. It will be called at the end of the authorization step.
  // For the default contract, this can be set to any correctly formatted URL.
  redirectUri: `http://localhost:8081/exchange-token`
};

const CONTRACT_DETAILS_READ_RAW = {

  // Visit https://developers.digi.me/sample-sharing-contracts for more info on sample contracts
  // Replace test Contract ID with the Contract ID that was provided to you by digi.me
  contractId: "slA5X9HyO2TnAxBIcRwf1VfpovcD1aQX",

  // Put your private key file (digi-me-private.key) provided by Digi.me next to your index.js file.
  // If the file name is different please update it below.
  privateKey: fs.readFileSync(__dirname + "/example-read-raw.key").toString(),

  // The redirect URL is linked to your contract. It will be called at the end of the authorization step.
  // For the default contract, this can be set to any correctly formatted URL.
  redirectUri: `http://localhost:8081/data`
};

// To initialize you can create the SDK like this:
// Only part required for initialization is the Application ID
const { init } = require("@digime/digime-sdk-nodejs");
const sdk = init({ applicationId: APP_ID });

// In this route, we are presenting the user with an action that will take them to digi.me
app.get("/", (req, res) => {
  let userId = (req.query.userId || req.query.userid) || shortid.generate();

  res.render("pages/index", {
    actionUrl: `${getOrigin(req)}/send-receipt?userId=${userId}`,
  });
});

app.get("/data", async (req, res) => {

  const { state, code } = req.query;
  const params = new URLSearchParams(state.toString())
  const userId = params.get("userId");
  const details = getUserById(userId);
  const exchangeCodeForTokenData = {
    codeVerifier: details.readRawCodeVerifier,
    authorizationCode: code ? code.toString() : "",
    contractDetails: CONTRACT_DETAILS_READ_RAW,
  }

  let sessionKey = undefined;
  let session = undefined;

  if (!details.sessionKey) {

    const accessToken = await sdk.exchangeCodeForToken(exchangeCodeForTokenData)

    const readSessionData = {
      contractDetails: CONTRACT_DETAILS_READ_RAW,
      userAccessToken: accessToken
    }

    session = await sdk.readSession(readSessionData);

    sessionKey = session.session.key;

    details.sessionKey = sessionKey;

    writeToUser(userId, details);

  } else {
    sessionKey = details.sessionKey;
  }

  let results = [];

  const newFilesHandler = async (files) => {
    const data = await Promise.all(
      files.map((file) =>
        sdk.readFile({
            sessionKey: sessionKey,
            fileName: file.name,
            privateKey: CONTRACT_DETAILS_READ_RAW.privateKey,
          })
        )
    );

    results = merge(results, data.reduce((acc, file) => {
        const isJSON = file.fileMetadata.mimetype === "application/json";

        const data = isJSON
            ? JSON.parse(file.fileData.toString("utf-8"))
            : Buffer.from(file.fileData).toString("base64");

        return [
            ...acc,
            {
                fileName: file.fileName,
                fileMetadata: file.fileMetadata,
                fileData: data,
            },
          ];
    }, []));
  };

  let queryStatus = 'pending';
  let offset = 0;

  while (queryStatus !== 'partial' && queryStatus !== 'completed') {
    const filesListResponse = await sdk.readFileList({ sessionKey: sessionKey });
    queryStatus = filesListResponse.status.state;
    const files = filesListResponse.fileList;
    const newFiles = files ? files.slice(offset, files.length) : [];
    offset = files ? files.length : 0;
    if (newFiles.length > 0) {
        await newFilesHandler(newFiles); // await for all files to be handled (i.e. retrieved) before fetching next available set
    }
    if (queryStatus == 'running' || queryStatus == 'pending') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  res.render("pages/data", {
    data: results,
  });
});

// Route hit by clicking on the "Send me the receipt button"
app.get("/read-postbox", async (req, res) => {

  if (APP_ID === "PLACEHOLDER_APP_ID") {
    res.render("pages/error", {
      errorMessage: "The Application ID isn't set."
    });
    return;
  }

  const userId = req.query.userId.toString();

  const state = new URLSearchParams({ userId }).toString();
  const details = getUserById(userId);

  // getAuthorizeUrl object to be send to onboard and give us authorization
  let authorizationOptions = {
    contractDetails: CONTRACT_DETAILS_READ_RAW,
    callback: `${getOrigin(req)}/error`,
    state,
  };

  // We have an existing token for this user.
  // Make sure to include any user access tokens you already have so we can link to the same library.
  if (details && details.accessToken) {
    authorizationOptions = {
      ...authorizationOptions,
      userAccessToken: details.accessToken,
    };
  }

  // SDK API for user to onboard selected service and give us authorization
  // After the user has onboarded and finished with the authorization, the redirectUri provided in
  // contractDetails will be called.
  try {
    const { url, codeVerifier } = await sdk.getAuthorizeUrl(authorizationOptions);

    if (codeVerifier) {
      details.readRawCodeVerifier = codeVerifier;
      writeToUser(userId, details);
    }
    // SaaS client will be called where we establish authorization and grant access to users data that we want.
    res.redirect(url);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error(e.toString());
    res.render("pages/error");
    return;
  }
});

// Route hit by clicking on the "Send me the receipt button"
app.get("/send-receipt", async (req, res) => {

  if (APP_ID === "PLACEHOLDER_APP_ID") {
    res.render("pages/error", {
      errorMessage: "The Application ID isn't set."
    });
    return;
  }

  const userId = req.query.userId.toString();

  const state = new URLSearchParams({ userId }).toString();
  const details = getUserById(userId);

  // getAuthorizeUrl object to be send to onboard and give us authorization
  let authorizationOptions = {
    contractDetails: CONTRACT_DETAILS,
    callback: `${getOrigin(req)}/error`,
    state,
  };

  // We have an existing token for this user.
  // Make sure to include any user access tokens you already have so we can link to the same library.
  if (details && details.accessToken && details.postboxId && details.publicKey) {
    // If data stored has postbox and publicKey we are skipping authorization process.
    if (details.postboxId && details.publicKey) {
      res.redirect(
        `${getOrigin(req)}/push?userId=${userId}`
      );
      return;
    }
    authorizationOptions = {
      ...authorizationOptions,
      userAccessToken: details.accessToken,
    };
  }

  // SDK API for user to onboard selected service and give us authorization
  // After the user has onboarded and finished with the authorization, the redirectUri provided in
  // contractDetails will be called.
  try {
    const { url, codeVerifier } = await sdk.getAuthorizeUrl(authorizationOptions);
    if (codeVerifier) {
      writeToUser(userId, { codeVerifier });
    }

    // SaaS client will be called where we establish authorization and grant access to users data that we want.
    res.redirect(url);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error(e.toString());
    res.render("pages/error");
    return;
  }
});

app.get("/exchange-token", async (req, res) => {
  const { success, postboxId, publicKey, state, code } = req.query;
  const canPush = (success === "true") && postboxId && publicKey && state;
  if (!canPush) {
      res.render("pages/error");
      return;
  }

  const params = new URLSearchParams(state.toString())
  const userId = params.get("userId");
  const details = getUserById(userId);
  const accessToken = await sdk.exchangeCodeForToken({
    codeVerifier: details.codeVerifier,
    authorizationCode: code.toString(),
    contractDetails: CONTRACT_DETAILS,
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

  const details = getUserById(userId);
  const receipt = fs.readFileSync(`${__dirname}/assets/receipt.json`);
  const receiptReference = `Receipt ${new Date().toLocaleString()}`;
  const result = await sdk.write({
    contractDetails: CONTRACT_DETAILS,
    userAccessToken: details.accessToken,
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

  if (result.status === "delivered") {
    res.render("pages/return", {
      pushAnotherUrl: `${getOrigin(req)}/push?userId=${userId}`,
      readPostbox: `${getOrigin(req)}/read-postbox?userId=${userId}`,
      receiptReference,
    });
  } else {
      res.render("pages/error");
  }
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
};

const getUserById = (id) => {
  return getUsers()[id];
};

const writeToUser = (userId, details) => {
  const users = getUsers();
  users[userId] = details;
  fs.writeFileSync(__dirname + "/users.json", JSON.stringify(users));
};

app.listen(port, () => {
  console.log(
    [
      "Example app now running on:",
      `- http://localhost:${port}`,
      `- http://${require("ip").address()}:${port} (probably)`,
    ].join("\n")
  );
});
