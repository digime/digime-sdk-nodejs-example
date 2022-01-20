// @ts-check
const express = require("express");
const fs = require("fs");
const shortid = require("shortid");
const toNumber = require("lodash.tonumber");
const { getOrigin } = require("./../../utils");
const { URLSearchParams } = require("url");

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
  contractId: "yrg1LktWk2gldVk8atD5Pf7Um4c1LnMs",

  // Put your private key file (digi-me-private.key) provided by Digi.me next to your index.js file.
  // If the file name is different please update it below.
  privateKey: fs.readFileSync(__dirname + "/digi-me-example.key").toString(),

  // The redirect URL is linked to your contract. It will be called at the end of the authorization step.
  // For the default contract, this can be set to any correctly formatted URL.
  redirectUri: `http://localhost:8081/return`
};

// Set service id
const SERVICE_ID = toNumber(16);

// To initialize you can create the SDK like this:
const { init } = require("@digime/digime-sdk-nodejs");
const sdk = init({ applicationId: APP_ID });

// In this route, we are presenting the user with an action that will take them to digi.me
app.get("/", (req, res) => {

  // In this example, let's assume we assign every user who hits the page a new user ID unless specified
  let userId = (req.query.userId || req.query.userid) || shortid.generate();

  // Present the generated URL with a pretty template
  res.render("pages/index", {
    appUrl: `${getOrigin(req)}/fetch?userId=${userId}`,
  });
});

app.get("/error", (req, res) => {
  res.render("pages/error");
});

app.get("/fetch", async (req, res) => {
  const userId = (req.query.userId.toString() || req.query.userid.toString()) || shortid.generate();

  if (APP_ID === "PLACEHOLDER_APP_ID") {
    res.render("pages/error", {
      errorMessage: "The Application ID isn't set."
    });
    return;
  }

  // Options to be sent to getAuthorizeUrl to trigger authorization
  //
  // contractDetails - contract we want to authorize. Make sure it is a contract for reading user data.
  // callback - A callback if there are any errors. If successful, the redirect url linked to the contract will be used.
  // serviceId - 16 is the id of Spotify. You can replace this with the Service ID that you want to use.
  // To find out what services are available on digi.me:
  // https://digime.github.io/digime-sdk-nodejs/pages/fundamentals/available-services.html
  // state - provide any information that can identify this user when authorization is complete.
  let authorizationOptions = {
    contractDetails: CONTRACT_DETAILS,
    callback: `${getOrigin(req)}/error`,
    serviceId: SERVICE_ID,
    state: new URLSearchParams({ userId }).toString(),
  };

  // If we have an existing token for this user, we can try to get the valid session for this user and skip onboard of SDK
  const details = getUserById(userId);
  if (details && details.accessToken) {
    // If we can get a valid session with existing token then we can move to results page with this session and userId.
    try {
      const results = await sdk.readSession({
        contractDetails: CONTRACT_DETAILS,
        userAccessToken: details.accessToken,
      });
      res.redirect(
        `${getOrigin(req)}/preparing?sessionKey=${results.session.key}&userId=${userId}`
      );
      return;
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e.toString());
    }
  }

  // SDK API for user to onboard selected service and give us authorization
  // After the user has onboarded and finished with the authorization, the redirectUri provided in
  // contractDetails will be called.
  try {
    const { url, codeVerifier, session } = await sdk.getAuthorizeUrl(authorizationOptions);

    // Store the codeVerifer against this user to use later.
    if (codeVerifier) {
      saveUserInfo(userId, { codeVerifier, session });
    }

    // Redirect the user to start the authorization process.
    res.redirect(url);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error(e.toString());
    res.render("pages/error");
    return;
  }
});

// Here we are creating the path specified in redirectUri of the CONTRACT_DETAILS object.
app.get("/return", async (req, res) => {
  // This is the result of authorization that was sent to Digi.me
  const { code, success, state } = req.query;

  const params = new URLSearchParams(state.toString());
  const userId = params.get("userId");
  const details = getUserById(userId);

  // If we did not get the response that the private sharing was a SUCCESS, there's not much we can do,
  // so we're just gonna stop and show a sad error page. :(
  if (success !== "true") {
    res.render("pages/error");
    return;
  }

  // Now that we have a code returned, together with the code verifier which we stored for this user earlier
  // we can exchange it for an access token by calling "exchangeCodeForToken". The other params are similar
  // to the ones we used in the "getAuthorizeUrl" call earlier
  const userAccessToken = await sdk.exchangeCodeForToken({
    authorizationCode: code.toString(),
    contractDetails: CONTRACT_DETAILS,
    codeVerifier: details.codeVerifier,
  });

  if (userAccessToken.accessToken) {
    // Since they've given us ongoing consent, we can store the access token against the user so next time this user
    // logs in, we can use their access token to fetch their updated data without needing to use the digi.me app.
    saveUserInfo(userId, { accessToken: userAccessToken });
  }

  let session = details.session;

  if (!session) {
    // We should use the session returned in the authorization call to query data when we also need to authorize.
    // If you already had a user access token from a previous session, you can get a new session from this call
    // without authorization.
    const results = await sdk.readSession({
      contractDetails: CONTRACT_DETAILS,
      userAccessToken: userAccessToken,
    });

    session = results.session
  }

  res.redirect(
    `${getOrigin(req)}/preparing?sessionKey=${session.key}&userId=${userId}`
  );
});

app.post("/file-list", async (req, res) => {
  try {
    const response = await sdk.readFileList({
      sessionKey: req.query.sessionKey.toString(),
    });
    res.json(response);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error(e.toString());
    res.status(404);
    res.end();
  }
});

app.get("/preparing", async (req, res) => {
  const { sessionKey, userId } = req.query;
  res.render("pages/preparing", {
    checkFileListUrl: `${getOrigin(req)}/file-list?sessionKey=${sessionKey}`,
    showResultsUrl: `${getOrigin(
      req
    )}/results?userId=${userId}&sessionKey=${sessionKey}`,
    errorUrl: `${getOrigin(req)}/error`,
  });
});

app.get("/results", async (req, res) => {
  const { sessionKey, userId } = req.query;
  let genres = []; // Used for Genrefy App example

  // If we got the response from "readSession" that the data is authorized,
  // the data is ready to be retrieved and consumed!

  // Here, we're using `readAllFiles` to retrieve the data from digi.me API,
  // by using the Session Key and the private key.
  //
  // Additionally, we're passing in the function that will receive data from the retrieved files.
  // This function serves as a callback function that will be called for each file, with the decrypted data,
  // after it was retrieved and decrypted with your key.
  const { filePromise } = sdk.readAllFiles({
    sessionKey: sessionKey.toString(), // Our Session ID that we retrieved from the URL
    privateKey: CONTRACT_DETAILS.privateKey, // The private key we setup above
    onFileData: ({ fileData, fileName, fileMetadata }) => {
      // This is where you deal with any data you receive from digi.me,
      // in this case, we're just printing it out to the console.
      // You probably have a better idea on what to do with it! :)

      const data = JSON.parse(fileData.toString("utf8"));

      console.log(
        "============================================================================"
      );
      console.log("Retrieved: ", fileName);
      console.log(
        "============================================================================"
      );
      console.log("Metadata:\n", JSON.stringify(fileMetadata, null, 2));
      console.log("Content:\n", JSON.stringify(data, null, 2));
      console.log(
        "============================================================================"
      );

      // Begin preparing data for Genrefy App
      data.forEach((playHistroyObject) => {
        if (
          playHistroyObject &&
          playHistroyObject.track &&
          playHistroyObject.track.artists &&
          playHistroyObject.track.artists.length > 0
        ) {
          playHistroyObject.track.artists.forEach((artist) => {
            genres = genres.concat(artist.genres);
          });
        }
      });
      // End preparing data for Genrefy App
    },
    onFileError: ({ fileName, error }) => {
      console.log(
        "============================================================================"
      );
      console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
      console.log(
        "============================================================================"
      );
    },
  });
  await filePromise;

  // Begin preparing data for Genrefy App
  let songsNumber = [];

  const groupedGenres = genres.reduce((total, value) => {
    total[value] = (total[value] || 0) + 1;
    return total;
  }, {});

  const genresEntries = Object.entries(groupedGenres);
  const sortedGenres = genresEntries.sort((a, b) => b[1] - a[1]);
  const groupedGenresValues = Object.values(groupedGenres);

  if (groupedGenresValues && groupedGenresValues.length > 0) {
    songsNumber = groupedGenresValues.reduce((a, b) => a + b);
  }
  // End preparing data for Genrefy App

  // `readAllFiles` returns a promise that will resolve once every file was processed.
  console.log(
    "============================================================================"
  );
  console.log("Data fetching complete.");
  console.log(
    "============================================================================"
  );
  // And we're just presenting a nice page here, thanking the user for their data!

  // Now that we have the user's accessToken in our app, the next time they visit our site, we can automatically
  // check for their data without the need for the digi.me to be triggered.
  res.render("pages/return", {
    startOverUrl: `${getOrigin(req)}/?userId=${userId}`,
    sortedGenres: sortedGenres,
    songsNumber: songsNumber,
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
};

const getUserById = (id) => {
  return getUsers()[id];
};

const saveUserInfo = (userId, details) => {
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
