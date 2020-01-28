$(document).ready(function () {

    $("#submit-flow-btn").hide();

    var fileListUrl = $("#fileListUrl").attr("file-list-url");
    var resultsUrl = $("#resultsUrl").attr("results-url");
    var errorUrl = $("#errorUrl").attr("error-url");

    function checkFileList() {
        $.ajax({
            url: fileListUrl,
            type: 'POST',
            dataType: 'json',
            success: function (data) {
                const state = data.status.state;
                if (state === "partial" || state === "completed") {
                    window.location.href = resultsUrl;
                    clearInterval(checkFileInterval);
                }
            },
            error: function () {
                window.location.href = errorUrl;
                clearInterval(checkFileInterval);
            }
        });
    }

    checkFileInterval = setInterval(checkFileList, 5000);

});
