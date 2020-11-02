const http = require('https');
const azure = require('azure-storage');

module.exports = function (context, req) {
    const connectionString = process.env.AzureWebJobsStorage;
    const blobService = azure.createBlobService(connectionString);
    const containerName = "deepmap";
    var blobName = 'media/v1.mov';
    var url = "https://wetransfer.com/downloads/1a9be3cee7c428e59ee1944afb8cd38920190711130543/1548b5810487915369914796ebaaf0e820190711130543/13adc9";
    //var url = "http";
    blobService.context = context;
    blobService.createContainerIfNotExists(containerName, function (err, result, response) {
        if (err) {
            context.log("Couldn't create container %s", containerName);
            context.error(err);
        } else {
            if (result) {
                context.log('Container %s created', containerName);
            } else {
                context.log('Container %s already exists', containerName);
            }

        }
        http.get(url, function (httpResponse) {
            if (200 !== httpResponse.statusCode) {
                context.log('Unexpected status code: %d', httpResponse.statusCode);
            } else {
                var writeStream = blobService.createWriteStreamToBlockBlob(
                    containerName,
                    blobName,
                    {
                        contentSettings: {
                            contentType: 'text/html'
                        }
                    },
                    function (error, result, response) {
                        context.log("4");
                        if (error) {
                            context.log("Couldn't upload file %s from %s", fileName, domain);
                            context.error(error);
                        } else {
                            context.log('File %s from %s uploaded', fileName, domain);
                            context.res = {body:"hoorah!"};
                        }
                        context.done();
                    });
                context.log("3");
                httpResponse.pipe(writeStream);
            }

        }).on('error', function (e) {
            context.log("Got error: " + e.message);
        });
    });

    context.log("1");
};
