module.exports = {
  deckApiFilter: function(deck){
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      expansion: deck.expansion,
      blackCards: deck.blackCards,
      whiteCards: deck.whiteCards
    };
  },
  randId: function(){
    var id = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i=0; i < 10; i++)
      id += chars.charAt(Math.floor(Math.random() * chars.length));

    return id;
  }
};
