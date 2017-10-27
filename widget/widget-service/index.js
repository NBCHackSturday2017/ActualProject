var https = require('https');
var http = require('http');
var express = require('express');

var constants = require('./constants.js');
var showService = require('./shows.js');
var channels = require('./channels.js');

var app = express();

function _getRecommenedShowsForUser(userId) {
    return new Promise(function(resolve, reject) {
        var options = {
            hostname: 'ussouthcentral.services.azureml.net',
            path: '/workspaces/2be93aaa39be437784ae987ff07ae6c7/services/555611ac767c441a80a9405aa5cf38d2/execute?api-version=2.0&format=swagger',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer C96t5Gi+/d3RkoldtD31VE5a6LKtYSPhLe7uofJN59Gn4yeAmdw4AaZuUmQ/xE87R7HY0UCFaW5udACrjit1kw=='
            }
        };

        var params = { "Inputs": { "input1": [ {"userId": userId } ] }, "GlobalParameters": { } };
        var req = https.request(options, function(resp) {
            var data = '';

            // A chunk of data has been recieved.
            resp.on('data', function(chunk) {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', function() {
                // Get the first videoID for this show
                resolve(JSON.parse(data));
            });

        })

        req.on("error", function(err) {
            console.log("Error: " + err.message);
            reject(err.message)
        });

        req.write(JSON.stringify(params));
        req.end();
    });
}

function _getShowImage(brand, showId) {
    return new Promise(function(resolve, reject) {
        var options = {
            hostname: 'api.nbcuni.com',
            path: '/networks/'+brand+'/j/shows/'+showId+'?include=shows,image&derivatives=landscape_255x143_x1_5',
            method: 'GET',
            headers: {
                api_key : "czubfy6anfskpwgv54858dn3"
            }
        }
        var req = https.request(options, function(resp) {
            var data = '';

            // A chunk of data has been recieved.
            resp.on('data', function(chunk) {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', function() {
                // Get the first videoID for this show
                var jsonResp = JSON.parse(data);
                console.log(jsonResp["included"][0].attributes.derivatives.landscape["255x143"].x1[5].uri);
                // resolve(jsonResp);
                resolve(jsonResp["included"][0].attributes.derivatives.landscape["255x143"].x1[5].uri);
            });
        });

        req.on("error", function(err) {
            console.log("Error: " + err.message);
            reject(err.message)
        });

        req.end();
    });
}

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
});

app.get('/recommendedShows/:userId', function(req, res) {
    var userId = req.params.userId;
    _getRecommenedShowsForUser(userId)
        .then(function(resp) {
            var showResults = resp.Results.output1[0];
            var shows = [];

            for (var i in showResults) {
                if (i.toLowerCase() == 'user') { continue; }
                shows.push(showResults[i]);
            }

            console.log(shows);
            res.send(shows);
        });
});

app.get('/showImage/:showId', function(req, res) {
    showService.getShow(req.params.showId, function(show) {
        _getShowImage(show.brand, req.params.showId)
            .then(function(resp) {
                res.send({ image: resp });
            });
    });
});

app.get('/playShow/:showId', function(req, res) {
    showService.getShow(req.params.showId, function(show) {
        showService.getLastAvailEp(req.params.showId, function(episode) {
            var contentId = episode._id;
            var path = "launch/" + channels[show.brand] + "?contentID=" + contentId +'&mediaType=episode';

            console.log(path);

            var opt = {
                host: 'rimesmedia.ngrok.io',
                port: 80,
                path: '/roku/play',
                method: 'POST',
                headers: {'Authorization': 'h4cker-phre4ker'},
            };

           var req = http.request(opt, function(res1) {
               console.log(res1.statusCode);
               res.send({name: episode.mpxMetadata.seriesName});
            });


            req.write(path);
            req.end();


        });

    });

});

app.listen(8000, function () {
  console.log('Server listening on port 8000')
});
