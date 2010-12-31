// http://api.flickr.com/services/feeds/photos_public.gne

var flickrUserId = '47882233@N00';
var tags = [];

$(function() {

  var loading = new LoadingView();
  $('body').append(loading.render().el);

  var gallery = new Gallery({
    flickrUserId: flickrUserId,
    tags: tags
  });

  new GalleryView({ model: gallery });
  var controller = new GalleryController(gallery);

  gallery.fetch({
    success: function() {
      controller.start();
      loading.remove();
    }
  });

});


/*
* Represents a single photo.
*/
var Photo = Backbone.Model.extend({
  getLarge640Url: function(e) {
    var item = this.get('item');
    return item.media.m.replace(/m\.jpg$/, 'z.jpg');
  }
});

/*
* Represents a set of photos.
*/
var PhotoSet = Backbone.Collection.extend({
  model: Photo,
  setFlickrOptions: function(options) {
    this.flickrUserId = options.flickrUserId;
    this.tags = options.tags || [];
  },
  url: function() {
    return 'http://api.flickr.com/services/feeds/photos_public.gne?id=' + this.flickrUserId + '&tags=' + this.tags.join(',') + '&format=json&jsoncallback=?';
  },
  parse: function(response) {
    return response.items.map(function(item) {
      return { item: item };
    });
  }
});

/*
* Models a simple gallery where only one photo is visible at a time.
*/
var Gallery = Backbone.Model.extend({
  initialize: function(flickrOptions) {
    this.set({ index: -1 });
    var photoSet = new PhotoSet();
    photoSet.setFlickrOptions(flickrOptions);
    this.set({ photoSet: photoSet });
  },
  fetch: function(options) {
    this.get('photoSet').fetch(options);
  },
  setIndex: function(index) {
    this.set({ index: index });
  },
  getIndex: function() {
    return this.get('index');
  },
  getPhoto: function() {
    return this.get('photoSet').at(this.get('index'));
  },
  next: function() {
    var set = this.get('photoSet');
    var index = this.get('index') + 1;
    if (index >= set.length) {
      index = 0;
    }
    this.setIndex(index);
  }
});

/*
* Controls your interaction with the gallery.
*/
var GalleryController = Backbone.Controller.extend({
  initialize: function(gallery) {
    _.bindAll(this, "changePhoto");
    this.gallery = gallery;
    this.gallery.bind('change', this.changePhoto);
  },
  routes: {
    'photo/:index': "showPhoto"
  },
  start: function() {
    Backbone.history.start();
  },
  showPhoto: function(index) {
    this.gallery.setIndex(parseInt(index));
  },
  changePhoto: function() {
    this.saveLocation("photo/" + this.gallery.getIndex());
  }
});

/*
* A view for the initial loading message.
*/
var LoadingView = Backbone.View.extend({
  tagName: "div",
  className: "loading",

  render: function() {
    $(this.el).html('Loading...');
    return this;
  }
});

/*
* A view representing the gallery as a whole.
*/
var GalleryView = Backbone.View.extend({

  el: 'body',

  events: {
    'click': "nextPhoto"
  },

  initialize: function() {
    _.bindAll(this, "render", "nextPhoto");
    this.model.bind('change', this.render);
    this.currentView = null;
  },

  render: function() {
    if (this.currentView) {
      this.currentView.remove();
    }
    var photo = this.model.getPhoto();
    var view = new PhotoView({ model: photo });
    $(view.render().el).appendTo(this.el);
    this.currentView = view;
  },

  nextPhoto: function() {
    this.model.next();
  }
});

/*
* A view representing a single photo in a gallery.
*/
var PhotoView = Backbone.View.extend({

  tagName: 'div',
  className: 'photo',

  render: function() {
    var url = this.model.getLarge640Url();
    $('<img/>').attr('src', url).appendTo(this.el);
    return this;
  }
});


