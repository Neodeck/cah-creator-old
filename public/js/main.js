// hello, welcome to my very badly
// written code! I wrote this in an
// hour.
$(document).ready(function(){
  var socket = io.connect();

  var deckId, deckToken;

  function addCard(type, card){
    var $newCard = $("<div class='card " + type + "'></div>");
        $newCard.text(card);
    $(".card." + type).last().after($newCard);
  }

  function gotoDeck(id){
    socket.emit("deck:access", {id: id, token: undefined});

    console.log("Loading deck " + id);

    $("body").addClass("creator-mode").removeClass("landing-mode");
    $(".loading-overlay").fadeIn();
  }

  socket.on("hello", function(){
    socket.emit("decks:latest");
  });

  socket.on("decks:latest", function(decks){
    for(var i in decks){
      var deck = decks[i],
          $link = $("<a href='#'>" + deck + "</a><br>");
          $link.click(function(){gotoDeck(i)});
      $(".latest-decks").append($link);
    }
  });

  socket.on("deck:id", function(id){
    deckId = id;
    $(".card-ui").slideDown();
    $(".loading-overlay").fadeOut();
    window.location = "#creator-" + id;
  });

  socket.on("deck:token", function(token){
    deckToken = token;
  });

  socket.on("deck:name", function(name){
    $(".deck-name").val(name);
    document.title = name + " // CAH Creator";
  });

  socket.on("deck:access:err", function(message){
    $("body").addClass("landing-mode").removeClass("creator-mode");
    $(".loading-overlay").fadeOut();
    alert(message);
  });

  socket.on("deck:card:black", function(card){
    addCard("black", card);
  });

  socket.on("deck:card:white", function(card){
    addCard("white", card);
  });

  socket.on("deck:cards:black", function(cards){
    cards.forEach(function(card){
      addCard("black", card.text);
    });
  });

  socket.on("deck:cards:white", function(cards){
    cards.forEach(function(card){
      addCard("white", card);
    });
  });

  socket.on("deck:editor", function(haveAccess){
    if(!haveAccess){
      $("input, textarea").prop("disabled", true);
      $(".deck-name").before("[read-only]");
      $(".deck-share").remove();
    }
  });

  socket.on("deck:viewers", function(count){
    $(".viewer-count").text("Viewers: " + count);
  });

  $("#start").click(function(){
    $("body").addClass("creator-mode").removeClass("landing-mode");
    window.location = "#creator";
  });

  $(".deck-share").click(function(){
    prompt("Sharing link:", "http://" + window.location.host + "/#creator-" + deckId + "/" + deckToken);
  });

  $(".deck-export").click(function(){
    alert("Coming soon! This will be compatible with Cards Against Equestria (and forks).");
  });

  $(".deck-name").keyup(function(){
    socket.emit("deck:name", $(".deck-name").val());
    document.title = $(".deck-name").val() + " // CAH Creator";
  });

  $("#black-card-input").keypress(function(e){
    if(e.keyCode === 13){
      e.preventDefault();
      socket.emit("deck:card:black", $("#black-card-input").val());
      $("#black-card-input").val("");
    }
  });

  $("#white-card-input").keypress(function(e){
    if(e.keyCode === 13){
      e.preventDefault();
      socket.emit("deck:card:white", $("#white-card-input").val());
      $("#white-card-input").val("");
    }
  });

  if(window.location.hash === "#creator") $("#start").click();

  if(window.location.hash.indexOf("#creator") === 0 && window.location.hash !== "#creator"){
    var deckId = window.location.hash.split("/")[0].substr(9),
        deckToken = window.location.hash.split("/")[1];

    socket.emit("deck:access", {id: deckId, token: deckToken});

    console.log("Loading deck " + deckId);

    $("body").addClass("creator-mode").removeClass("landing-mode");
    $(".loading-overlay").fadeIn();
  }
});
