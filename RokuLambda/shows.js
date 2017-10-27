var constants = require('./constants.js');
var mongoClient = require('mongodb').MongoClient;

var _episodes = {};
var _shows = {};
var _showsByShowNames = {};

function _fetchEpisodes(showId) {
    return new Promise(function(resolve, reject) {
        if (_episodes[showId]) {
            resolve(_episodes[showId]);
        }
        else {
            mongoClient.connect(constants.DB_CONNECTION_URL, function(err, db) {
                if (err) reject(err);
                var now = Date.now();
                var query = {
                    "published": true,
                    "fullEpisode": true,
                    "mpxMetadata.showId": showId,
                    "mpxMetadata.expirationDate": { $gte : now },
                    "mpxMetadata.availableDate": { $lte : now }
                };
                var sort = { "mpxMetadata.airDate": 1 };
                db.collection(constants.VIDEOS_COLLECTION_ID).find(query).sort(sort).toArray(function(err, result) {
                    if (err) reject(err);
                    if (result == null) reject(err);
                    db.close();
                    _episodes[showId] = result;
                    // console.log(result);
                    resolve(_episodes[showId]);
                });
            });
        }
    });
}

function _getShow(showId) {
    return new Promise(function(resolve, reject) {
        if (_shows[showId]) {
            resolve(_shows[showId]);
        }
        else {
            mongoClient.connect(constants.DB_CONNECTION_URL, function(err, db) {
                if (err) reject(err);
                var now = Date.now();
                var query = {
                    "_id": showId
                };
                var sort = { "mpxMetadata.airDate": 1 };
                db.collection(constants.SERIES_COLLECTION_ID).findOne(query, function(err, result) {
                    if (err) reject(err);
                    if (result == null) reject(err);
                    db.close();
                    _shows[showId] = result;
                    resolve(_shows[showId]);
                });
            });
        }
    });
}

function _getShowByShowName(showName) {
    return new Promise(function(resolve, reject) {
        if (_showsByShowNames[showName]) {
            resolve(_showsByShowNames[showName]);
        }
        else {
            mongoClient.connect(constants.DB_CONNECTION_URL, function(err, db) {
                if (err) reject(err);
                var now = Date.now();
                var query = {
                    "sortTitleLower": showName.toLowerCase()
                };
                var sort = { "mpxMetadata.airDate": 1 };
                db.collection(constants.SERIES_COLLECTION_ID).findOne(query, function(err, result) {
                    if (err) reject(err);
                    if (result == null) reject(err);
                    db.close();
                    _showsByShowNames[showName] = result;
                    resolve(_showsByShowNames[showName]);
                });
            });
        }
    });
}

function getFirstAvailEp(showId, cb) {
    _fetchEpisodes(showId)
        .then(function(episodes) {
            cb(episodes[0]);
        });
}

function getLastAvailEp(showId, cb) {
    _fetchEpisodes(showId)
        .then(function(episodes) {
            cb(episodes[episodes.length-1]);
        });
}

function getShowDescription(showId, cb) {
    _getShow(showId)
        .then(function(show) {
            cb(show["mediumDescription"]);
        });
}

function getShow(showId, cb) {
    _getShow(showId)
        .then(function(show) {
            cb(show);
        });
}

function getShowByShowName(showName, cb) {
    _getShowByShowName(showName)
        .then(function(show) {
            getFirstAvailEp(show._id, function(firstAvailEp) {
                getLastAvailEp(show._id, function(lastAvailEp) {
                    cb({
                        showId: show._id,
                        firstAvailEp: firstAvailEp._id,
                        lastAvailEp: lastAvailEp._id,
                        showDescription: show.mediumDescription,
                        brand: show.brand
                    });
                });
            });
        });
}

// EXAMPLE CALLS
// getShowByShowName("z nation", function(resp) {
//     console.log(resp);
// });

module.exports = {
    getFirstAvailEp: getFirstAvailEp,
    getLastAvailEp: getLastAvailEp,
    getShowDescription: getShowDescription,
    getShow: getShow,
    getShowByShowName: getShowByShowName
};
