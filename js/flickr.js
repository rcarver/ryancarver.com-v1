// http://api.flickr.com/services/feeds/photos_public.gne

var flickrId = '47882233@N00';
var tags = [];

$(function() {

  var loading = new LoadingView();
  $('#main').append(loading.render().el);

  var photoList = new PhotoList({
    flickrId: flickrId,
    flickrTags: tags
  });


  photoList.fetch({
    success: function() {
      var photoSet = photoList.getPhotoSet();
      var loaded = photoSet.length;

      var gallery = new Gallery({
        photoSet: photoSet
      });


      photoSet.each(function(photo) {
        photo.fetch({
          success: function() {
            if (--loaded == 0) {

              new GalleryLayout({ model: gallery, el: $('#image') });
              new GalleryInteration({ model: gallery, el: $('#image') });

               new GalleryController(gallery);
              gallery.set({ loaded: true });

              loading.remove();
            }
          }
        });
      });
    }
  });

});


function paddingForCentering(item, space) {
  var width = item.outerWidth();
  var windowWidth = space.width();
  return (windowWidth - width) / 2;
}

var PhotoList = Backbone.Model.extend({
  url: function() {
    return 'http://api.flickr.com/services/feeds/photos_public.gne?id=' + this.get('flickrId')+ '&tags=' + this.get('flickrTags').join(',') + '&format=json&jsoncallback=?';
  },

  getPhotoSet: function() {
    var photoSet = new PhotoSet;
    _.each(this.get('items'), function(item) {
      photoSet.add(new Photo(item));
    });
    return photoSet;
  }
});

/*
* Represents a set of photos.
*/
var PhotoSet = Backbone.Collection.extend({
  model: Photo,
});

/*
* Represents a single photo.
*/
var Photo = Backbone.Model.extend({
  initialize: function(attributes) {
    var extractedId = this.get('link').match(/\/([^\/]+)\/$/)[1];
    this.set({ id: extractedId });
  },

  url: function() {
    var template = "http://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=3eff5a940d905ad02b98412d701909f3&photo_id=<%= photo_id %>&format=json&jsoncallback=?";
    return _.template(template, { photo_id: this.id });
  },

  parse: function(response) {
    return response.sizes;
  },

  getLarge: function() {
    var data = this.get('size');
    return _.detect(data, function(size) { return size.label == "Medium 640" });
  },
});


/*
* Models a simple gallery where only one photo is visible at a time.
*/
var Gallery = Backbone.Model.extend({
  initialize: function() {
    this.set({ index: null, loaded: false });
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
    _.bindAll(this, "saveState", "start");
    this.gallery = gallery;
    this.gallery.bind('change:index', this.saveState);
    this.gallery.bind('change:loaded', this.start);
  },
  routes: {
    'photo/:index': "setPhotoIndex"
  },
  start: function() {
    this.gallery.set({ scroll: false });
    if (document.location.href.indexOf('#') >= 0) {
      Backbone.history.start();
    } else {
      this.setPhotoIndex(0);
    }
    this.gallery.set({ scroll: true });
  },
  setPhotoIndex: function(index) {
    this.gallery.set({ index: parseInt(index) });
  },
  saveState: function() {
    this.saveLocation("photo/" + this.gallery.get('index'));
  }
});

var LoadingView = Backbone.View.extend({

  tagName: "div",
  className: "loading",

  render: function() {
    $(this.el).html('Loading...');
    return this;
  }
});

var GalleryLayout = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');
    this.model.bind('change:loaded', this.render);
  },

  render: function() {
    var wrapper = this.$('.wrapper');

    var photos = this.model.getPhotos();

    var table = $('<table/>').appendTo(wrapper);
    var row = $('<tr/>').appendTo(table);
    var template = this.$('.template').text();

    _.each(photos, function(photo, index) {
      var data = photo.getLarge();
      var src = _.template(template, { src: data.source, width: data.width, height: data.height });
      var cell = $('<td/>').append(src);
      row.append(cell);
    });

    // add space around the images based on the window size.
    var images = this.$('img');
    var avgWidth = _.inject(images, function(memo, img) { return memo + $(img).width(); }, 0) / images.length;
    var space = (this.el.width() - avgWidth) / 2;
    var padding = Math.max(space / 3, 30);
    this.$('.frame').css('padding-left', padding).css('padding-right', padding);
    this.$('.frame:first').css('padding-left', 0)
    this.$('.frame:last').css('padding-right', 0)

    // move the first image right so that it starts out centered.
    var img = this.$('img').eq(0);
    var position = paddingForCentering(img, this.el);
    this.$('td').eq(0).css('padding-left', position);

    // move the last image left so that ends centered.
    var img = this.$('img').eq(photos.length - 1);
    var position = paddingForCentering(img, this.el);
    this.$('td').eq(photos.length - 1).css('padding-right', position);
  }

});

var GalleryInteration = Backbone.View.extend({

  events: {
    'click': "nextPhoto"
  },

  initialize: function() {
    _.bindAll(this, "render", "nextPhoto", "setIndexViaScroll", "finishAnimating");
    this.model.bind('change:index', this.render);
    this.el.scroll(this.setIndexViaScroll);
  },

  render: function() {
    var index = this.model.get('index');
    var img = this.$('img').eq(index);

    this.$('td').removeClass('current');
    this.$('td').eq(index).addClass('current');

    if (!this.isScrolling()) {
      var position = this.leftForCentering(img);
      if (this.model.get('scroll')) {
        if (this.animating) {
          this.el.stop(true);
        }
        this.animating = true;
        this.el.animate({ scrollLeft: position }, 500, this.finishAnimating);
      } else {
        this.el.scrollLeft(position);
      }
    }
  },

  isScrolling: function() {
    return this.scrollingAt && (+new Date) - this.scrollingAt < 100;
  },

  finishAnimating: function() {
    this.animating = false;
  },

  nextPhoto: function(e) {
    this.model.nextIndex();
  },

  setIndexViaScroll: function() {
    if (this.animating) {
      return;
    }
    this.scrollingAt = +new Date;

    var model = this.model;
    var windowWidth = this.el.width();
    var center = windowWidth / 2;
    var currentIndex = this.model.get('index');

    _.each(this.$('img'), function(e, index) {
      if (index != currentIndex) {
        var img = $(e);
        var left = img.offset().left;
        var width = img.outerWidth();
        if (center > left && center < left + width) {
          model.set({ index: index });
        }
      }
    });
  },

 leftForCentering: function(item) {
    var left = item.position().left;
    var width = item.outerWidth();
    var windowWidth = this.el.width();
    return left - ((windowWidth - width) / 2);
  }

});

