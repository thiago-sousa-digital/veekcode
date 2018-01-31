try {
  RapidEventLoader.eventAttach(document, 'contact-us-', 'onclick', function(
    event,
  ) {
    RapidUI.movePage({
      pageName: 'veeker',
    });
  });
} catch (ex) {
  console.error(ex);
}
