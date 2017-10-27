var mongoClient = require('mongodb').MongoClient;
var https = require('https');
var querystring = require('querystring');

var ML_URL = 'https://ussouthcentral.services.azureml.net/workspaces/2be93aaa39be437784ae987ff07ae6c7/services/555611ac767c441a80a9405aa5cf38d2/execute?api-version=2.0&format=swagger'
var DB_CONNECTION_URL = 'mongodb://h4cker:phre4ker@ds115015-a0.mlab.com:15015,ds115015-a1.mlab.com:15015/winninghack?replicaSet=rs-ds115015';
var COLLECTION_ID = "videos";
var USER_ID = "";

var showsSuggestedByUserId = {};
var showsForUser = {};

function _getVideoForShow(showId) {
    return new Promise(function(resolve, reject) {
        mongoClient.connect(DB_CONNECTION_URL, function(err, db) {
            if (err) reject(err);
            db.collection(COLLECTION_ID).findOne({"mpxMetadata.showId": showId}, function(err, result) {
                if (err) reject(err);
                if (result == null) reject(err);
                resolve(result);
                db.close();
            });
        });
    });
}

function _getRecommenedShowsForUser(userId) {
    return new Promise(function(resolve, reject) {
        // ONLY ONCE per userID, call the ML service with userid to get an array of recommended shows
        /*
         Result: {"Results":{"output1":{"type":"table","value":{"ColumnNames":["User","Item 1","Item 2","Item 3","Item 4","Item 5","Item 6","Item 7","Item 8","Item 9","Item 10"],"ColumnTypes":["String","String","String","String","String","String","String","String","String","String","String"],"Values":[["9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f","350dfbc7-6233-4892-8c05-0051fce9bc5a","b0c990cb-af6f-45b4-a497-7c36745e360f","11fc3caf-6a7b-4476-83c5-14c15a5bdc95","9096fd5e-9415-4563-9151-40ae399e3555","c519218a-f020-4d8f-a6f1-161546145b98","b9a3fa04-cf65-46f3-8b77-8f8a48a9c0fd","dc8b1470-676a-4ee4-8c97-200f6cc129d5","b52ec151-b21b-41ee-aa71-c56173d10d61","d6788121-a10d-497f-a369-f76dd9e3d190","778cd77a-6f20-48ef-aebf-3fadb6f6e731"]]}}}}
        */
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

function _onShowsReceived(shows, userId, cb) {
    return new Promise(function(resolve, reject) {

        if (showsForUser[userId].length == 0) {
            reject("No recommended shows for user: " + userId);
        }

        var showId = showsForUser[userId].shift();

        // Loop through the shows
        showsForUser[userId].push(showId);


        _getVideoForShow(showId)
            .then(function(resp) {
                var result = {};
                result["showId"] = showId;
                result["showName"] = resp.mpxMetadata.seriesName;
                result["videoId"] = resp._id;
                resolve(result);
            })
            // Skips shows not in mongodb
            // TODO: Remove once all the shows have been ingested
            .catch(function(err) {
                getSuggestion(userId, cb);
            });
        });
}

function getSuggestion(userId, cb) {
    // console.log(cb);
    return new Promise(function(resolve, reject) {

        // Get the recommended shows for this new seen user
        if (showsForUser[userId] == undefined) {
            _getRecommenedShowsForUser(userId)
                .then(function(resp) {
                    var showResults = resp.Results.output1[0];
                    var shows = [];

                    for (var i in showResults) {
                        if (i.toLowerCase() == 'user') { continue; }
                        shows.push(showResults[i]);
                    }
                    showsForUser[userId] = shows;

                    _onShowsReceived(shows, userId, cb)
                        .then(function(resp) {
                            resolve(resp);
                            cb(resp);
                        });
                });
        }
        else {
            var shows = showsForUser[userId];
            _onShowsReceived(shows, userId, cb)
                .then(function(resp) {
                    resolve(resp);
                    cb(resp);
                });
        }

    });
}

// EXAMPLE CALLS
getSuggestion("9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f", function(resp) {
    console.log(resp);
});
getSuggestion("9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f", function(resp) {
    console.log(resp);
});
getSuggestion("9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f", function(resp) {
    console.log(resp);
});


module.exports = { getSuggestion: getSuggestion };
