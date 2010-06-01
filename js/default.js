$(function() {
  var $images = $('.highlight-grid img').hover(
    function() {
      var $this = $(this);
      $images.clearQueue('fx');
      $images.not($this).fadeTo(500, 0.8);
      $this.fadeTo(500, 1);
    },
    function() {
      $images.clearQueue('fx');
      $images.fadeTo(500, 1);
    });
  $('#header').kern({
    'rv': 50
  }, 1000);
  $('#website').kern({
    'We': -50,
  }, 1000);

  // $('#wrapper').addClass('grid');
});

$.fn.kern = function(pairs, emSize) {
  var bail = 0;
  return this.each(function() {
    var $this = $(this);
    var html = $this.html();
    var len = html.length;
    $.each(pairs, function(pair, size) {
      var start = 0;
      var index = html.indexOf(pair);
      while (index != -1) {
        if (bail++ > 100) {
          return;
        };
        index += start;
        var before = html.substr(0, index);
        var after = html.substr(index - 1 + pair.length);
        if (before.lastIndexOf('<') > before.lastIndexOf('>')) {
          start = before.length + 1;
          index = after.indexOf(pair);
        } else {
          var change = before
            + '<kern style="letter-spacing:' + size / emSize + 'em;">'
            + pair.substr(0, 1)
            + '</kern>';
          start = change.length;
          index = after.indexOf(pair);
          html = change + after;
        }
      }
    });
    $this.html(html);
  });
};
