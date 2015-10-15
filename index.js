var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    decks = {};

app.use(express.static(__dirname + "/public"));

function genDeckId(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i=0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getLatestDecks(){
  var newDecks = {};
  for(var i in decks){
    var deck = decks[i];
    newDecks[i] = deck.name;
  }
  return newDecks;
}

io.on('connection', function(socket){
  socket.emit("hello");

  socket.on("decks:latest", function(){
    console.log(decks);
    socket.emit("decks:latest", getLatestDecks());
  });

  socket.on("deck:name", function(name){
    if(!socket.deck){
      var deckId = genDeckId();
      decks[deckId] = {
        name: "",
        accessToken: "",
        description: "Created with CAH Creator: cahcreator.com",
        expansion: true,
        blackCards: [ ],
        whiteCards: [ ]
      };
      var deck = decks[deckId];

      deck.accessToken = genDeckId();
      socket.deck = deckId;
      socket.join(deckId);
      socket.emit("deck:id", deckId);
      socket.emit("deck:token", deck.accessToken);
    }else{
      decks[socket.deck].name = name;
      console.log(decks[socket.deck]);
      console.log(decks);
      socket.to(socket.deck).emit("deck:name", name);
    }
  });

  socket.on("deck:card:black", function(card){
    if(socket.deck){
      decks[socket.deck].blackCards.push({text: card, pick: 1});
      socket.to(socket.deck).emit("deck:card:black", card);
      socket.emit("deck:card:black", card);
    }
  });

  socket.on("deck:card:white", function(card){
    if(socket.deck){
      decks[socket.deck].whiteCards.push(card);
      socket.to(socket.deck).emit("deck:card:white", card);
      socket.emit("deck:card:white", card);
    }
  });

  socket.on("deck:access", function(params){
    if(decks[params.id]){
      var deck = decks[params.id];
      socket.join(params.id);
      if(deck.accessToken === params.token) socket.deck = params.id;
      socket.emit("deck:id", params.id);
      socket.emit("deck:editor", (deck.accessToken === params.token));
      socket.emit("deck:name", deck.name);
      socket.emit("deck:cards:black", deck.blackCards);
      socket.emit("deck:cards:white", deck.whiteCards);
    }else{
      socket.emit("deck:access:err", "That deck doesn't exist. Note that decks are not stored permanently.");
    }
  });
});

app.get('/creator', function(req, res){
  res.redirect('/#creator');
});

http.listen(process.env.PORT || 3000);
