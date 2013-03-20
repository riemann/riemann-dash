
  (function($) {
    var Quickfit, QuickfitHelper, defaults, pluginName;
    pluginName = 'quickfit';
    defaults = {
      min: 8,
      max: 12,
      tolerance: 0.02,
      truncate: false,
      width: null,
      height: null,
      sample_number_of_letters: 10,
      sample_font_size: 12,
      font_height_scale: 0.85
    };
    QuickfitHelper = (function() {
      var shared_instance;

      shared_instance = null;

      QuickfitHelper.instance = function(options) {
        if (!shared_instance) shared_instance = new QuickfitHelper(options);
        return shared_instance;
      };

      function QuickfitHelper(options) {
        this.options = options;
        this.item = $('<span id="meassure"></span>');
        this.item.css({
          position: 'absolute',
          left: '-1000px',
          top: '-1000px',
          'font-size': "" + this.options.sample_font_size + "px"
        });
        $('body').append(this.item);
        this.meassures = {};
      }

      QuickfitHelper.prototype.get_meassure = function(letter) {
        var current_meassure;
        current_meassure = this.meassures[letter];
        if (current_meassure === void 0) {
          current_meassure = this.set_meassure(letter);
        }
        return current_meassure;
      };

      QuickfitHelper.prototype.set_meassure = function(letter) {
        var current_meassure, index, sample_letter, text, _ref;
        text = '';
        sample_letter = letter === ' ' ? '&nbsp;' : letter;
        for (index = 0, _ref = this.options.sample_number_of_letters - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
          text += sample_letter;
        }
        this.item.html(text);
        current_meassure = this.item.width() / this.options.sample_number_of_letters / this.options.sample_font_size;
        this.meassures[letter] = current_meassure;
        return current_meassure;
      };

      return QuickfitHelper;

    })();
    Quickfit = (function() {

      function Quickfit(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this.element = $(this.element);
        this._defaults = defaults;
        this._name = pluginName;
        this.quickfit_helper = QuickfitHelper.instance(this.options);
      }

      Quickfit.prototype.fit = function() {
        var element_width;
        if (!this.options.width) {
          element_width = this.element.width();
          this.options.width = element_width - this.options.tolerance * element_width;
        }
        if (!this.options.height) {
          this.options.height = this.element.height();
        }
        if (this.text = this.element.attr('data-quickfit')) {
          this.previously_truncated = true;
        } else {
          this.text = this.element.html();
        }
        this.calculate_font_size();
        if (this.options.truncate) this.truncate();
        return this.element.css('font-size', "" + this.font_size + "px");
      };

      Quickfit.prototype.calculate_font_size = function() {
        var letter, text_width, _i, _len, _ref;
        text_width = 0;
        _ref = this.text;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          letter = _ref[_i];
          text_width += this.quickfit_helper.get_meassure(letter);
        }
        var vertical_font_size = this.options.height * this.options.font_height_scale;
        this.target_font_size = parseInt(this.options.width / text_width);
        return this.font_size = Math.max(
          this.options.min, 
          Math.min(
            vertical_font_size,
            this.options.max, 
            this.target_font_size));
      };

      Quickfit.prototype.truncate = function() {
        var index, last_letter, letter, set_text, text_width;
        if (this.font_size > this.target_font_size) {
          set_text = '';
          text_width = 3 * this.quickfit_helper.get_meassure('.') * this.font_size;
          index = 0;
          while (text_width < this.options.width && index < this.text.length) {
            letter = this.text[index++];
            if (last_letter) set_text += last_letter;
            text_width += this.font_size * this.quickfit_helper.get_meassure(letter);
            last_letter = letter;
          }
          if (set_text.length + 1 === this.text.length) {
            set_text = this.text;
          } else {
            set_text += '...';
          }
          this.text_was_truncated = true;
          return this.element.attr('data-quickfit', this.text).html(set_text);
        } else {
          if (this.previously_truncated) return this.element.html(this.text);
        }
      };

      return Quickfit;

    })();
    return $.fn.quickfit = function(options) {
      return this.each(function() {
        return new Quickfit(this, options).fit();
      });
    };
  })(jQuery, window);
