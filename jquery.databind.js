// Cross-browser object.watch and object.unwatch

// object.watch
if (!Object.prototype.watchObject) {
	Object.prototype.watchObject = function (prop, handler) {
		var oldval = this[prop], newval = oldval,
		getter = function () {
			return newval;
		},
		setter = function (val) {
			oldval = newval;
			return newval = handler.call(this, prop, oldval, val);
		};
		if (delete this[prop]) { // can't watch constants
			if (Object.defineProperty) { // ECMAScript 5
				Object.defineProperty(this, prop, {
					get: getter,
					set: setter,
					enumerable: true,
					configurable: true
				});
			} else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) { // legacy
				Object.prototype.__defineGetter__.call(this, prop, getter);
				Object.prototype.__defineSetter__.call(this, prop, setter);
			}
		}
	};
}

// object.unwatch
if (!Object.prototype.unwatchObject) {
	Object.prototype.unwatchObject = function (prop) {
		var val = this[prop];
		delete this[prop]; // remove accessors
		this[prop] = val;
	};
}


var dataBind = (function($){

  // monkey patched jQuery val in order to trigger changes
  var _oldval = $.fn.val;
  $.fn.val = function(value) { 
    var result = null;
    if (value == undefined) {
      result = _oldval.call(this);
    }
    else {
      result = _oldval.call(this, [value]);
      $(this).trigger('change', ["name", value]);
    }
    return result;
  }

  var options = {},
    types = {".": "class", "#": "id", "$": "object"},
    fcache = {};
  
   /**
   * Sets trigger on from element.
   *
   * @param f - from element.method
   * @param fe - from element
   * @param fm - from method 
   */
  var _setTriggerFromElement = function(f, fe, fm) {
    if (fcache[f] == undefined) {
      $(fe).live({
        keyup: function(){
          $.event.trigger(fe, $(this)[fm]());
        },
        change: function(){
          $.event.trigger(fe, $(this)[fm]());
        }
      });
      fcache[f] = true;
    }
  }

  var _setTriggerFromObject = function(f, fe) {
    var otmp = f.replace("$", "").split('.'),
      last = otmp[otmp.length - 1],
      first = otmp[0];
    // remove last element
    otmp.splice(otmp.length -1, 1); 
    var obj = window[first];
    // remove first element
    otmp.splice(0, 1); 
    
    $.each(otmp, function(index, value) {
      obj = obj[value];
    });

    obj.watchObject(last, function (id, oldval, newval) {
      $.event.trigger(fe.replace(".", ""), newval);
    });
  }

  var _dataBind = function() {

    $('[data-bind]').each(function(){
      var self = this,
        binding = $(this).data('bind'),
        //TODO: replace ':' with something else?
        ft = binding.split(":"),
        f = ft[0],
        t = ft[1];

      // if to not set try 
      // set it to default value
      if (t === undefined) {
        t = "this.html";
      }

      var type = f[0],
        fem = f.split('.'),
        tem = t.split('.'),
        fe = fem[0];

      if (fem.length < 2) {
        throw("invalid from element: " + f + " in " + $(this).get(0).tagName);
      }

      if (tem.length === 1) {
        tem[1] = tem[0];
        tem[0] = "this";
      }

      if (types[type] === "class") {
        fem.splice(0, 1);
        fe = "." + fem[0];
      }
                
      var tm = tem[1],
        fm = fem[1];

      if (types[type] === "object") { 
        _setTriggerFromObject(f, fe);
      }
      else {
        _setTriggerFromElement(f, fe.replace(".", ""), fm);
      }
      
      // bind to from element
      $(this).bind(fe.replace(".", ""), function(e,d) {
        $(self)[tm](d);
      });        
    });
  }

  var init = function(ops){
    $(function(){
      options = $.extend(true, options, ops);
      _dataBind();
    });
  }
  init();

  return {
    init: init
  }
})(jQuery);
