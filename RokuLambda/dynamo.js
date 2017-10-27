var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1",
    endpoint: "https://us-east-1.console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=mytv-mobilehub-1825522716-Recommendations"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Recommendations";

var params = {
    TableName:table,
    Item:{
        "year": year,
        "title": title,
        "info":{
            "plot": "Nothing happens at all.",
            "rating": 0
        }
    }
};

console.log("Adding a new item...");
docClient.put(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});


module.exports = {

}