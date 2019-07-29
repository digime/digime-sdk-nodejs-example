// @ts-check
const getBasePath = (req) => {
    const url = require("url");
    const trimEnd = require("lodash.trimend");

    return url.format({
        protocol: req.protocol,
        host: req.headers.host,
        pathname: trimEnd(req.originalUrl, "/"),
    });
};

module.exports = {
    getBasePath,
}
