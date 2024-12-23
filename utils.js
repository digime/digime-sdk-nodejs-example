// @ts-check

const { customAlphabet } = require("nanoid")
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

const getOrigin = (req) => {
    const url = require("url");

    return url.format({
        protocol: req.protocol,
        host: req.headers.host,
    });
}

const getBasePath = (req) => {
    const url = require("url");

    const trimEnd = (str, c = '\\s') => str.replace(new RegExp(`^(.*?)([${c}]*)$`), '$1')

    return url.format({
        protocol: req.protocol,
        host: req.headers.host,
        pathname: trimEnd(req.originalUrl, "/"),
    });
};

const getQueryItems = (urlString) => {
    const url = require("url");

    return url.parse(urlString, true).query;
};

const randomUserId = () => {
    return customAlphabet(alphabet, 10)()
};

module.exports = {
    getOrigin,
    getBasePath,
    getQueryItems,
    randomUserId,
}
