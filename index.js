const express = require("express");
const { establishSession, getAppURL, getDataForSession } = require("../digime-js-sdk/dist/sdk");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8081;

app.set('view engine', 'ejs');

const APP = {
    appId: "[INSERT YOUR APP ID HERE]",
    contractId: "[INSERT YOUR CONTRACT ID HERE]",
    key: fs.readFileSync(path.resolve(__dirname, "path-to-your.key")),
};

app.get('/', (req, res) => {
    establishSession(APP.appId, APP.contractId).then((session) => {
        var data = {
            url: getAppURL(APP.appId, session, "http://localhost:8081/return?sessionId=" + session.sessionKey)
        };
        res.render('pages/index', data);
    });
});

app.get("/return", (req, res) => {

    const result = req.query.result;

    // Data is ready to be consumed
    if (result === "DATA_READY") {

        const data = getDataForSession(
            req.query.sessionId,
            APP.key,
            (fileData) => {
                console.log("File data: \n", fileData);
            }
        );

        data.then(() => {
            console.log("All files processed");
        });

        res.render('pages/return');
    } else {
        // Something went wrong and we received a different result
        res.render('pages/error');
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));