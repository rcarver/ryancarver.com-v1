$(function() {
  var $images = $('.grid img').hover(
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
})
