// not usable yet
var tour = new Shepherd.Tour({
  defaults: {
    class: 'shepherd-theme-dark',
    scrollTo: true
  }
});

tour.addStep('step-name-deck', {
  title: 'Step 1. Name your deck',
  text: 'First, you give your deck a name. Be creative!',
  attachTo: '.deck-name',
  buttons: [
    {
      text: 'Next',
      action: tour.next
    }
  ]
});

tour.addStep('step-add-cards', {
  title: 'Step 2. Add cards',
  text: 'Type the details of your card and then press [ENTER] when you want to save it.',
  attachTo: '.deck-name',
  buttons: [
    {
      text: 'Next',
      action: tour.next
    }
  ]
});

tour.addStep('step-sharing', {
  title: 'Step 3. Share with friends',
  text: 'If you want to work on this deck with friends, click here to get the sharing link.',
  attachTo: '.deck-share',
  buttons: [
    {
      text: 'Next',
      action: tour.next
    }
  ]
});

tour.addStep('step-export', {
  title: 'Step 4. Export your deck',
  text: 'Once you are done with your deck, you might want to export it. <b>Decks are not stored permanently, so keep this somewhere safe!</b>',
  attachTo: '.deck-export',
  buttons: [
    {
      text: 'Next',
      action: tour.next
    }
  ]
});
