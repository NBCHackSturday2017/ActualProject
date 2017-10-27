//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
// When manually setting this, include the protocol, port, and trailing slash eg:
exports.rokuAddress = "http://10.60.2.218:8060/";
// exports.rokuAddress = null;
exports.port=80; //this is the port you are enabling forwarding to. Reminder: you are port forwarding your public IP to the computer playing this script...NOT the roku IP
exports.pass='h4cker-phre4ker' //this is the password used in the AWS lambda files to help stop others from running commands on your roku, should they guess your IP and port
