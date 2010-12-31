// http://api.flickr.com/services/feeds/photos_public.gne

var flickrId = '47882233@N00';
var tags = [];

$(function() {

  var loading = new LoadingView();
  $('#main').append(loading.render().el);

  var photoSet = new PhotoSet();
  photoSet.setFlickrOptions({
    flickrId: flickrId,
    flickrTags: tags
  });

  var gallery = new Gallery({
    photoSet: photoSet
  });

  var grid = new GalleryGridView({ model: gallery, el: '#main #grid' });
  var single = new GallerySingleView({ model: gallery, el: '#main #single' });
  var controller = new GalleryController(gallery);

  photoSet.fetch({
    success: function() {
      controller.start();
      grid.render();
      loading.remove();
    }
  });

});


/*
* Represents a single photo.
*/
var Photo = Backbone.Model.extend({
  getLargeUrl: function() {
    var item = this.get('item');
    return item.media.m.replace(/m\.jpg$/, 'm.jpg');
  },
  getSmallUrl: function() {
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
    this.flickrId = options.flickrId;
    this.flickrTags = options.flickrTags || [];
  },
  url: function() {
    return 'http://api.flickr.com/services/feeds/photos_public.gne?id=' + this.flickrId + '&tags=' + this.flickrTags.join(',') + '&format=json&jsoncallback=?';
  },
  parse: function(response) {
    return _.map(response.items, function(item) {
      return { item: item };
    });
  }
});

/*
* Models a simple gallery where only one photo is visible at a time.
*/
var Gallery = Backbone.Model.extend({
  initialize: function() {
    this.set({ index: 0, view: false });
  },
  getPhoto: function() {
    return this.get('photoSet').at(this.get('index'));
  },
  getPhotos: function() {
    return this.get('photoSet').models;
  },
  nextIndex: function() {
    var set = this.get('photoSet');
    var index = this.get('index') + 1;
    if (index >= set.length) {
      index = 0;
    }
    this.set({ index: index });
  }
});

/*
* Controls your interaction with the gallery.
*/
var GalleryController = Backbone.Controller.extend({
  initialize: function(gallery) {
    _.bindAll(this, "updateGallery");
    this.gallery = gallery;
    this.gallery.bind('change', this.updateGallery);
  },
  routes: {
    '': "showGrid",
    'photo/:index': "showView"
  },
  start: function() {
    Backbone.history.start();
  },
  showGrid: function() {
    this.gallery.set({ view: false });
  },
  showView: function(index) {
    this.gallery.set({ index: parseInt(index), view: true });
  },
  updateGallery: function() {
    if (this.gallery.get('view')) {
      this.saveLocation("photo/" + this.gallery.get('index'));
    } else {
      this.saveLocation();
    }
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
var GallerySingleView = Backbone.View.extend({

  events: {
    'click .photo': "next",
    'click .close': "close",
  },

  initialize: function() {
    _.bindAll(this, "render", "next", "close");
    this.model.bind('change', this.render);
    this.currentView = null;
  },

  render: function() {
    $(this.el).html('');
    if (this.currentView) {
      this.currentView.remove();
    }
    var photo = this.model.getPhoto();
    var view = new PhotoView({ model: photo, size: 'large' });
    $(view.render().el).appendTo(this.el);
    $('<div class="close">Close</div>').appendTo(this.el);
    this.currentView = view;

    if (this.model.get('view')) {
      $(this.el).show();
    } else {
      $(this.el).hide();
    }
  },

  next: function() {
    this.model.nextIndex();
  },

  close: function() {
    this.model.set({ view: false });
  }
});

/*
* A view representing the gallery as a whole.
*/
var GalleryGridView = Backbone.View.extend({

  events: {
    'click': "showPhoto"
  },

  initialize: function() {
    _.bindAll(this, "render", "showPhoto");
    this.model.bind('change', this.render);
  },

  render: function() {
    var el = this.el;
    $(el).html('');
    var photos = this.model.getPhotos();
    var currentIndex = this.model.get('index');
    var table = $('<table><tr/></table>').appendTo(el);
    _.each(photos, function(photo, index) {
      var current = index == currentIndex;
      var url = photo.getSmallUrl();
      var img = $('<img/>').attr('src', url);
      var cell = $('<td/>').append(img);
      table.append(cell);
      if (current) {
        cell.addClass('current');
      }
    });
    // Scroll to the current image.
    var cell = table.find('td img').eq(currentIndex);
    var left = cell.offset().left;
    var width = cell.outerWidth();
    var windowWidth = document.body.clientWidth;
    $('body').animate({ scrollLeft: left + (width / 2) - (windowWidth / 2) }, 500);
  },

  showPhoto: function(e) {
    // TODO: set the real index based on the clicked element.
    this.model.set({ index: 2, view: true });
  }
});

/*
* A view representing a single photo in a gallery.
*/
var PhotoView = Backbone.View.extend({

  tagName: 'div',
  className: 'photo',

  initialize: function() {
    this.size = this.options.size || 'small';
    this.current = this.options.current;
    _.bindAll(this, "render");
    this.model.bind('change', this.render);
  },

  render: function() {
    if (this.size == 'large') {
      var url = this.model.getLargeUrl();
    } else {
      var url = this.model.getSmallUrl();
    }
    var img = $('<img/>').attr('src', url).appendTo(this.el);
    if (this.current) {
      img.addClass('current');
    }
    return this;
  }
});


