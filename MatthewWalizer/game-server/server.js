const express = require('express');
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 8080;
var buttonList = [
  0, 0, 0, 0, 
  0, 0, 0, 0,
  1, 1, 1, 1,
  1, 1, 1, 1
]

app.use(express.static('public'))

app.get('/', function(req, res) {
   res.sendFile('index.html');
});
io.on('connection', (socket) => {
  console.log('user connected');
  for (buttonNumber in buttonList) {
      socket.emit("recievedata", {buttonNumber: buttonNumber, buttonValue: buttonList[buttonNumber]})
  }
  socket.on('senddata', function (message) {
    console.log('Controls recieved');
    console.log(message);
    buttonList[message.buttonNumber] = message.buttonValue 
    for (buttonNumber in buttonList) {
      socket.emit("recievedata", {buttonNumber: buttonNumber, buttonValue: buttonList[buttonNumber]})
    }
    
  })
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
})
server.listen(port, function() {
  console.log(`Listening on port ${port}`);
});