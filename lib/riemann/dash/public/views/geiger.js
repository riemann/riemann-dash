var GlobalAudioContext = new (window.AudioContext || window.webkitAudioContext)();

(function() {
  var Geiger = function(json) {
    // Init
    view.View.call(this, json);

    this.clickFocusable = true;
    this.selfid = Math.floor(Math.random() * 255);

    var self = this;

    // Config
    this.title = json.title;
    this.query = json.query;
    this.muted = json.muted || false;
    this.volume = parseFloat(json.volume || 0.2);
    this.sound = json.sound || 'sounds/geiger.wav';
    this.muted = json.muted || false;

    // State
    this.currentEvent = null;
    this.shouldPlay = false;
    this.soundBuffer = null;

    // HTML
    this.el.append(
        '<div class="box">' +
        '<h2 class="quickfit"></h2>' +
        '<button class="sound-mute" type="button">Mute</button><br />' +
        '</div>'
        );

    this.box = this.el.find('.box');
    this.el.find('h2').text(this.title);

    this.mute_button = this.el.find('.sound-mute');
    this.mute_button.text(this.muted ? 'Unmute' : 'Mute');
    this.mute_button.click(function () {
      self.muted = !self.muted;
      self.mute_button.text(self.muted ? 'Unmute' : 'Mute');
    });

    if (!json.virtual) {
      // Virtual instance of the geiger counter should not produce any sounds.
      // Moreover, to save resources, I will not create audio nodes and will
      // not load data.
      this.gainer = GlobalAudioContext.createGain();

      this.gainer.gain.value = Math.pow(this.volume, 2);
      this.gainer.connect(GlobalAudioContext.destination);

      this.compressor = GlobalAudioContext.createDynamicsCompressor();
      this.compressor.threshold.value = 0;
      this.compressor.knee.value = 0;
      this.compressor.ratio.value = 20;
      this.compressor.attack.value = 0;
      this.compressor.release.value = 2;
      this.compressor.connect(this.gainer);

      this.request = new XMLHttpRequest();
      this.request.open('GET', this.sound, true);
      this.request.responseType = 'arraybuffer';

      this.request.onload = function () {
        if (this.status != 200) {
          toastr.warning ("Could not load sound " + self.sound + ", HTTP status " + this.status);
        }

        GlobalAudioContext.decodeAudioData(this.response, function (buffer) {
          self.soundBuffer = buffer;
          self.shouldPlay = true;
        });
      };

      this.request.onerror = function () {
        toastr.warning ("Could not load sound " + self.sound + ", general error");
      }

      this.request.send();

      if (this.query) {
        var me = this;
        this.sub = subs.subscribe(this.query, function(e) {
          self.playSound();
          self.currentEvent = e;
        });
      }
    }
  }

  view.inherit(view.View, Geiger);
  view.Geiger = Geiger;
  view.types.Geiger = Geiger;

  Geiger.prototype.json = function() {
    return $.extend(view.View.prototype.json.call(this), {
      type: 'Geiger',
           title: this.title,
           query: this.query,
           volume: this.volume,
           sound: this.sound,
           muted: this.muted
    });
  }

  Geiger.prototype.playSound = function() {
    if (!this.shouldPlay || this.muted) {
      return;
    }

    source = GlobalAudioContext.createBufferSource();
    source.buffer = this.soundBuffer;
    source.connect(this.compressor);
    source.start();
  }


  var editTemplate = _.template(
      "<label for='title'>Title</label>" +
      "<input type='text' name='title' value='{{title}}' /><br />" +
      "<label for='query'>Query</label>" +
      '<textarea type="text" name="query" class="query">{{query}}</textarea>' +
      "<label for='sound'>Sound</label>" +
      "<input type='text' name='sound' value='{{sound}}' /><br />" +
      "<label for='volume'>Volume</label>" +
      "<input type='range' name='volume' min='0' max='1' step='0.05' value='{{volume}}' />" );

  Geiger.prototype.editForm = function() {
    return editTemplate(this);
  }

  Geiger.prototype.shutdownSound = function() {
    this.shouldPlay = false;
    this.gainer.disconnect();
    this.compressor.disconnect();
    this.gainer = null;
    this.compressor = null;

    this.soundBuffer = null;
  }

  Geiger.prototype.delete = function() {
    if (this.sub) {
      subs.unsubscribe(this.sub);
    }

    this.shutdownSound();
    return view.View.prototype.delete.call(this);
  }
})();
