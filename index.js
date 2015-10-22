// TODO literally all the server-side code is in one file.
// I should probably split these up more. possibly use
// actual models for the decks?

var express = require('express'),
    namespace = require('express-namespace'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    helper = require('./lib/helper'),
    Deck = require('./lib/models/deck'),
    decks = {};

app.use(express.static(__dirname + "/public"));

function getLatestDecks(){
  var newDecks = [];
  for(var i in decks){
    var deck = decks[i];
    newDecks.push({id: i, name: deck.name});
  }
  return newDecks;
}

io.on('connection', function(socket){
  socket.emit("hello");

  socket.on("decks:latest", function(){
    socket.emit("decks:latest", getLatestDecks());
  });

  socket.on("deck:name", function(name){
    if(!socket.deck){
      var deckId = helper.randId();
      decks[deckId] = {
        name: "",
        accessToken: "",
        description: "Created with cahcreator.com",
        expansion: true,
        blackCards: [ ],
        whiteCards: [ ]
      };

      var deck = decks[deckId];

      deck.accessToken = helper.randId();
      socket.deck = deckId;
      socket.join(deckId);
      socket.emit("deck:id", deckId);
      socket.emit("deck:token", deck.accessToken);

      io.emit("decks:latest", getLatestDecks()); // tell all clients
    }else{
      decks[socket.deck].name = name;
      socket.to(socket.deck).emit("deck:name", name);

      io.emit("decks:latest", getLatestDecks()); // tell all clients
    }
  });

  socket.on("deck:import", function(importedJson){
    if(!socket.deck){
      var deckId = helper.randId(),
          invalid = false;

      Deck.forEach(function(prop){
        if(!importedJson[prop.name] || typeof(importedJson[prop.name]) !== prop.type) invalid = true;
      });

      if(!invalid){
        decks[deckId] = importedJson;

        var deck = decks[deckId];

        // overrides
        deck.description = "Created with cahcreator.com";
        deck.expansion = true;

        deck.accessToken = helper.randId();
        socket.deck = deckId;
        socket.join(deckId);

        socket.emit("deck:id", deckId);
        socket.emit("deck:token", deck.accessToken);
        socket.emit("deck:editor", true);
        socket.emit("deck:name", deck.name);
        socket.emit("deck:cards:black", deck.blackCards);
        socket.emit("deck:cards:white", deck.whiteCards);

        socket.emit("deck:import:complete", importedJson);

        io.emit("decks:latest", getLatestDecks());
      }else{
        socket.emit("deck:import:fail", "That doesn't look like a valid deck object.");
      }
    }
  });

  socket.on("deck:card:black", function(card){
    if(socket.deck && parseInt(card.pick) !== NaN && parseInt(card.pick) > 0 && card.text.trim() !== "" && card.pick.trim() !== ""){
      decks[socket.deck].blackCards.push({text: card.text, pick: parseInt(card.pick)});
      socket.to(socket.deck).emit("deck:card:black", {text: card.text, pick: parseInt(card.pick)});
      socket.emit("deck:card:black", {text: card.text, pick: parseInt(card.pick)});
    }
  });

  socket.on("deck:card:white", function(card){
    if(socket.deck && card.trim() !== ""){
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

app.get('/:deck', function(req, res){
  res.redirect('/#creator-' + req.params.deck);
});

app.namespace('/api', function(){
  app.get('/deck(s)?', function(req, res){
    var deckIds = [];
    for(var i in decks) deckIds.push(i);
    res.send(deckIds);
  });

  app.get('/deck/:id', function(req, res){
    if(decks[req.params.id]){
      res.send(helper.deckApiFilter(decks[req.params.id]));
    }else{
      res.send({error: "Deck not found"}, 404);
    }
  });
});

app.get('/partner/:partner', function(req, res){
  switch(req.params.partner){
    case "cae":
      res.redirect('/?partner=cae&game_id=' + req.query.game_id + '#creator');
      break;
    default:
      res.redirect('/');
      break;
  }
});

app.get('/:deck/:token', function(req, res){
  res.redirect('/#creator-' + req.params.deck + '/' + req.params.token);
});

http.listen(process.env.PORT || 3000);
