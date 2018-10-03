const express = require("express");
const { establishSession, getAppURL, getDataForSession } = require("../digime-js-sdk/dist/sdk");

const app = express();
const port = 8081;

app.set('view engine', 'ejs');

const APP = {
    appId: "[INSERT YOUR APP ID HERE]", // Insert valid app Id to test
    contractId: "gzqYsbQ1V1XROWjmqiFLcH2AF1jvcKcg",
};

app.get('/', (req, res) => {
    establishSession(APP.appId, APP.contractId).then((session) => {
        var data = {
            url: getAppURL(session, "http://localhost:8081/return?sessionId=" + session.sessionKey)
        };
        res.render('pages/index', data);
    });
});

app.get("/return", (req, res) => {

    const result = req.query.result;

    if (result === "DATA_READY") {
        const data = getDataForSession(req.query.sessionId, (fileData) => {
            console.log("File data:", fileData);
        });

        data.then(() => {
            console.log("End of data");
        });

        res.render('pages/return');
    } else {
        // quit quark flow
        res.render('pages/index', {
            url: getQuarkURL("http://localhost:8081/return?sessionId=" + req.query.sessionId)
        });
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));