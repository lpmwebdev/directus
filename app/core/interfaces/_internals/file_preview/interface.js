define(['app', 'helpers/file', 'core/UIView'], function (app, FileHelper, UIView) {
  return UIView.extend({

    template: '_internals/file_preview/interface',

    serialize: function () {
      var data = {};
      var userId;
      var model = this.model;
      var authenticatedUser = app.users.getCurrentUser();

      data = model.toJSON();

      if (!model.has('id')) {
        userId = authenticatedUser.id;
        data.isNew = true;
      } else {
        userId = model.get('user');
      }

      data.link = undefined;
      data.thumbUrl = undefined;

      var storageAdapter = model.get('storage_adapter');

      if (storageAdapter !== null &&
        storageAdapter !== undefined &&
        storageAdapter !== '') {
        data.url = model.makeFileUrl(false);
        data.thumbUrl = model.makeFileUrl(true);
      } else if (model.isNew()) {
        data.url = model.get('url') || model.get('data');
        data.thumbUrl = model.get('thumbnailData') || model.get('url') || model.get('data');
      }

      data.name = model.get('name');
      data.orientation = (parseInt(model.get('width'), 10) > parseInt(model.get('height'), 10)) ? 'landscape' : 'portrait';

      if (model.has('type')) {
        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        var subtype = model.getSubType(true);

        // If we shouldnt show thumbnail, set thumbUrl to null
        if (type !== 'image' && type !== 'embed' && subtype !== 'pdf') {
          data.thumbUrl = null;
          data.type = subtype.toUpperCase();
        }

        if (model.get('html')) {
          data.html = $(model.get('html')).prop('outerHTML');
        }
      }

      return data;
    },

    events: {
      'click a[data-action=toggle-form]': function () {
        // $('.upload-form').toggleClass('hide');
      },
      'click li[data-action=swap]': function () {
        // This.$el.find('#swap-file').toggleClass('hide');
      },
      'click .swap-method-btn': function () {
        this.$el.find('.swap-method').toggleClass('hide');

        if (this.$el.find('#urlInput').is(':visible')) {
          this.$el.find('#urlInput').focus();
        }
      },
      'click #retriveUrlBtn': function () {
        var url = this.$el.find('#urlInput').val();
        var model = this.model;

        app.sendLink(url, function (data) {
          var item = data[0];

          item[app.statusMapping.status_name] = app.statusMapping.active_num;
          // Unset the model ID so that a new file record is created
          // (and the old file record isn't replaced w/ this data)
          item.id = undefined;
          item.user = self.userId;

          model.setData(item);
        });
      },
      'change input[type=file]': function (e) {
        var file = $(e.target)[0].files[0];
        var model = this.model;

        model.setFile(file);
      },
      'click .ui-thumbnail-dropzone': function () {
        this.$el.find('#fileAddInput').click();
      },
      'click button[data-action="swap"]': function () {
        this.$el.find('.swap-container').toggle();
        this.$el.find('.ui-thumbnail.has-file').toggle();
        var swapText = this.$el.find('.ui-text-hover').html();
        var newSwapText = (swapText === 'Swap file') ? 'Cancel' : 'Swap file';
        this.$el.find('.ui-text-hover').html(newSwapText);
      }
    },

    initialize: function () {
      var FilesModel = require('modules/files/FilesModel');
      if (!(this.model instanceof FilesModel)) {
        this.model = new FilesModel(this.model.attributes, {collection: this.collection});
      }
      this.listenTo(this.model, 'change', this.render);
    },

    afterRender: function () {
      var timer;
      var $dropzone = this.$el.find('.ui-thumbnail');
      var model = this.model;

      $dropzone.on('dragover', function (e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function () {
        clearInterval(timer);
        timer = setInterval(function () {
          $dropzone.removeClass('dragover');
          clearInterval(timer);
        }, 50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = function (e) {
        e.stopPropagation();
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }

        var file = e.dataTransfer.files[0];

        model.setFile(file);

        $dropzone.removeClass('dragover');
      };

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    }
  });
});
