var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var rokuChannel = require("./rokuchannels");
var rokuShows = require("./rokushows");
var recommender = require("./recommender");
var showMan = require("./shows");
var printf = require('util').format;
var http = require("http");
var dialogues = [
    "you might like %s", "please consider %s", "may i suggest %s ?", "heres a good show. %s",  "have you tried %s ?", "you should check out %s"
]

if (serverinfo.host == "127.0.0.1") {
    throw "Default hostname found, edit your serverinfo.js file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, serverinfo.appId);
};
AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host: serverinfo.host,
        port: serverinfo.port,
        path: path,
        method: 'POST',
        headers: {'Authorization': serverinfo.pass},
    };

    var req = http.request(opt, function(res) {
        callback();
        res.
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    if (body) req.write(body);
    req.end();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

AlexaRoku.prototype.intentHandlers = {
    Home: function (intent, session, response) {
        sendCommand("/roku/home",null,function() {
            response.tellWithCard("Going Home");
        });
    },
    Launch: function (intent, session, response) {
        sendCommand("/roku/launch",intent.slots.Channel.value,function() {
            response.tellWithCard("Launching "+ intent.slots.Channel.value);
        });
    },
    Captionson: function (intent, session, response) {
        sendCommand("/roku/captionson",null,function() {
            response.tellWithCard("Turning On Captions");
        });
    },
    Captionsoff: function (intent, session, response) {
        sendCommand("/roku/captionsoff",null,function() {
            response.tellWithCard("Turning Off Captions");
        });
    },
    Select: function (intent, session, response) {
        sendCommand("/roku/select",null,function() {
            response.tellWithCard("Ok");
        });
    },
    Back: function (intent, session, response) {
        sendCommand("/roku/back",null,function() {
            response.tellWithCard("Going Back");
        });
    },
    TV: function (intent, session, response) {
        sendCommand("/roku/tv",null,function() {
            response.tellWithCard("TV");
        });
    },
    Rewind: function (intent, session, response) {
        sendCommand("/roku/rewind",null,function() {
            response.tellWithCard("Rewinding");
        });
    
    },
    Fastforward: function (intent, session, response) {
        sendCommand("/roku/fastforward",null,function() {
            response.tellWithCard("Fast forwarding");
        });
    
    },
    Instantreplay: function (intent, session, response) {
        sendCommand("/roku/instantreplay",null,function() {
            response.tellWithCard("Instant Replay");
        });
    
    },
    Up: function (intent, session, response) {
        sendCommand("/roku/up",null,function() {
            response.tellWithCard("Up");
        });
    
    },
    Down: function (intent, session, response) {
        sendCommand("/roku/down",null,function() {
            response.tellWithCard("Down");
        });
    
    },
    Power: function (intent, session, response) {
        sendCommand("/roku/power",null,function() {
            response.tellWithCard("Power");
        });
    
    },
    Left: function (intent, session, response) {
        sendCommand("/roku/left",null,function() {
            response.tellWithCard("Left");
        });
    
    },
    Right: function (intent, session, response) {
        sendCommand("/roku/right",null,function() {
            response.tellWithCard("Right");
        });
    
    },
    Type: function (intent, session, response) {
        sendCommand("/roku/type",intent.slots.Text.value,function() {
            response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
        });
    },
    PlayPause: function (intent, session, response) {
        sendCommand("/roku/playpause",null,function() {
            response.tell("Ok");
        });
    },
    Playlastyoutube: function (intent, session, response) {
        sendCommand("/roku/playlastyoutube",null,function() {
            response.tellWithCard("Playing Last Search on YouTube");
        });

    },
    Play: function (intent, session, response) {
        showMan.getShowByShowName(intent.slots.Show.value,function(showResult) {
            /*
             { showId: ‘05e4ca60-93ff-4053-8d5c-83e1e0ddd006’,
             firstAvailEp: ‘2820210’,
             lastAvailEp: ‘3597756’,
             showDescription: ‘A group of survivors must cross the ...’ }
             */
            console.log("showValue = " + intent.slots.Show.value)
            console.log("showResult = " + showResult)
            var brandAppId = rokuChannel[showResult["brand"]];
            var showId = showResult["showId"];
            var contentId = showResult["firstAvailEp"];
            console.log("showId = " + showId);
            console.log("contentId = " + contentId);
            var dialog = printf(dialogues[getRandomInt(0,5)], intent.slots.Show.value);
            var rokuPath = "launch/" + brandAppId + "?contentID=" + contentId +'&mediaType=episode';
            console.log("about to call local with path = " + rokuPath);
/*
            // TODO make dynamo remember played shows one at a time by userid
            dynamo.pushPlayedUserShow(userId,showId);
*/
            sendCommand("/roku/play",rokuPath,function(receipt) {
                response.tellWithCard("Playing " + intent.slots.Show.value);
            });
        })
    },
    PlayLatest: function (intent, session, response) {
        showMan.getShowByShowName(intent.slots.Show.value,function(showResult) {
            /*
             { showId: ‘05e4ca60-93ff-4053-8d5c-83e1e0ddd006’,
             firstAvailEp: ‘2820210’,
             lastAvailEp: ‘3597756’,
             showDescription: ‘A group of survivors must cross the ...’ }
             */
            console.log("showValue = " + intent.slots.Show.value)
            console.log("showResult = " + showResult)
            var brandAppId = rokuChannel[showResult["brand"]];
            var showId = showResult["showId"];
            var contentId = showResult["lastAvailEp"];
            console.log("showId = " + showId);
            console.log("contentId = " + contentId);
            var dialog = printf(dialogues[getRandomInt(0,5)], intent.slots.Show.value);
            var rokuPath = "launch/" + brandAppId + "?contentID=" + contentId +'&mediaType=episode';
            console.log("about to call local with path = " + rokuPath);
/*
            // TODO make dynamo remember played shows one at a time by userid
            dynamo.pushPlayedUserShow(userId,showId);
*/
            sendCommand("/roku/play",rokuPath,function(receipt) {
                response.tellWithCard("Playing " + intent.slots.Show.value);
            });
        })
    },
    DescribeShow: function (intent, session, response) {
        showMan.getShowByShowName(intent.slots.Show.value,function(showResult) {
            /*
             { showId: ‘05e4ca60-93ff-4053-8d5c-83e1e0ddd006’,
             firstAvailEp: ‘2820210’,
             lastAvailEp: ‘3597756’,
             showDescription: ‘A group of survivors must cross the ...’ }
             */
            response.tellWithCard(showResult.showDescription);
        })
    },
    Recommend: function (intent, session, response) {
        recommender.getSuggestion("9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f",function(showTriple){
            var showName = showTriple["showName"];
            var brandAppId = rokuChannel[showTriple["brand"]];
            var showId = showTriple["showId"];
            var contentId = showTriple["videoId"];
            var dialog = printf(dialogues[getRandomInt(0,5)], showName);
            console.log("Loading Show: " + showName);
            console.log("showId = " + showId);
            console.log("contentId = " + contentId);
            var rokuPath = "launch/" + brandAppId + "?contentID=" + contentId +'&mediaType=series';
            console.log("about to call local with path = " + rokuPath);
            sendCommand("/roku/recommend",rokuPath,function(receipt) {
                response.tellWithCard(dialog);
            });
        })
    },
    PlayMyNext: function (intent, session, response) {
        sendCommand("/roku/playmynext",null,function() {
            var isSubscribedToShow = false || checkIfFavorite(intent.slots.Text.value)
            if(!isSubscribedToShow) {
                response.tellWithCard("You have not favorited " + intent.slots.Text.value);
            } else {
                response.tellWithCard("NEW NEW NEW Playing your next episode " + intent.slots.Text.value);
            }
        });

    },
    Search: function (intent, session, response) {
        sendCommand("/roku/search",intent.slots.Text.value,function() {
            response.tellWithCard("Searching: " + intent.slots.Text.value, "Roku", "Playing: " + intent.slots.Text.value);
        });
    },
    SearchChannel: function (intent, session, response) {
        // join multiple slot values with arbitrary ampersand, which we will split in server code.
        var slots = intent.slots.Text.value + "&" + intent.slots.Channel.value
        sendCommand("/roku/searchChannel",slots,function() {
            response.tellWithCard("Searching: " + intent.slots.Text.value + " on " + intent.slots.Channel.value, "Roku", "Playing: "+intent.slots.Text.value+" on "+ intent.slots.Channel.value);
        });
    },
    HelpIntent: function (intent, session, response) {
        response.tell("No help available at this time.");
    }
};

exports.handler = function (event, context) {
    var roku = new AlexaRoku();
    roku.execute(event, context);
};
