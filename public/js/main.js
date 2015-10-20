// hello, welcome to my very badly
// written code! I wrote this in an
// hour.
$(document).ready(function(){
  var socket = io.connect();

  var deckId, deckToken, internalDeck;

  internalDeck = {
    name: "",
    description: "Created with CAH Creator: cahcreator.com",
    expansion: true,
    blackCards: [ ],
    whiteCards: []
  };

  function urlQuery(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  if(urlQuery("partner")){
    switch(urlQuery("partner")){
      case "cae":
        swal({
          title: "Welcome CAE players!",
          text: "This is CAH Creator, a website where you can create your own Cards Against Humanity decks " +
                "and invite your friends to work on them with you. You're able to play " +
                "this deck in Cards Against Equestria once you're done!",
          confirmButtonText: "Let me in!",
          type: "info"
        });
        break;
      default:
        break;
    }
  }

  function genJsonTextarea(){
    var $textarea = $("<textarea>");
        $textarea.text(JSON.stringify(internalDeck))
                 .prop("disabled", true)
                 .css("width", "100%")
                 .css("height", "300px")
                 .css("font-family", "monospace");
    return $textarea[0].outerHTML; // lel hacky
  }

  function addCard(type, card, pick){
    var $newCard = $("<div class='card " + type + "'></div>");
        $newCard.text(card);

    if(pick){
      var $pick = $("<span class='black-card-pick-number'></span>");
          $pick.text("Pick " + pick);
      $newCard.append($pick);
    }

    $(".card." + type).last().after($newCard);

    switch(type){
      case "black":
        internalDeck.blackCards.push({text: card, pick: parseInt(pick)});
        break;
      case "white":
        internalDeck.whiteCards.push(card);
        break;
    }
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
    $(".latest-decks").text("");
    for(var i in decks){
      var deck = decks[i],
          $link = $("<a href='#'></a>");
          $link.click(function(){gotoDeck(i)}).text(deck);
      $(".latest-decks").append($link).append("<br>"); // lazy
    }
  });

  socket.on("deck:id", function(id){
    deckId = id;
    $(".card-ui").slideDown();
    $(".loading-overlay").fadeOut();
    window.location = "#creator-" + id;
    swal({
      title: "Before you start editing...",
      text: "<b>Decks are not stored permanently!</b> Export your deck when you're done. There is no defined time that decks will last, just remember to export often.",
      type: "info",
      html: true
    });
  });

  socket.on("deck:token", function(token){
    deckToken = token;
  });

  socket.on("deck:name", function(name){
    $(".deck-name").val(name);
    document.title = name + " // CAH Creator";
    internalDeck.name = name;
  });

  socket.on("deck:access:err", function(message){
    $("body").addClass("landing-mode").removeClass("creator-mode");
    $(".loading-overlay").fadeOut();
    swal({
      title: "Error loading deck!",
      text: message,
      type: "error",
      confirmButtonText: "Okay thanks for letting me know"
    });
  });

  socket.on("deck:card:black", function(card){
    addCard("black", card.text, card.pick);
  });

  socket.on("deck:card:white", function(card){
    addCard("white", card);
  });

  socket.on("deck:cards:black", function(cards){
    cards.forEach(function(card){
      addCard("black", card.text, card.pick);
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
    swal("Sharing URL", "Share this link with collaborators to let them edit this deck:\n\n" +
                        "http://" + window.location.host + "/" + deckId + "/" + deckToken +
                        "\n\nIf you only want to share the view-only deck, use this URL:\n\n" +
                        "http://" + window.location.host + "/" + deckId, "info");
    // prompt("Sharing link:", );
  });

  $(".deck-export").click(function(){
    swal({
      title: "Export Deck",
      text: "Here's your exported JSON. This should work in apps such as Cards Against Equestria (and forks).<br><br>" + genJsonTextarea() + "<br><br>" +
            "Deck ID: <b>" + deckId + "</b>",
      html: true
    });
  });

  $(".deck-name").keyup(function(){
    socket.emit("deck:name", $(".deck-name").val());
    document.title = $(".deck-name").val() + " // CAH Creator";
    internalDeck.name = $(".deck-name").val();
  });

  $("#black-card-input, #black-card-pick-input").keypress(function(e){
    if(e.keyCode === 13){
      e.preventDefault();
      socket.emit("deck:card:black", {text: $("#black-card-input").val(), pick: $("#black-card-pick-input").val()});
      $("#black-card-input, #black-card-pick-input").val("");
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
