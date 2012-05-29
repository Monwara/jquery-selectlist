/**
 * jQuery selectList
 *
 * @author Monwara LLC / Branko Vukelic <branko@monwara.com>
 * @version 0.0.1
 * @license MIT
 */

(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'makefit'], factory);
  } else {
    factory(jQuery);
  }
}(this, function($) {

  // Set up global event handler
  $(window).on('focus', 'a.select-list', function(e) {

    var $this = $(this);

    if ($this.data('select') !== true) {
      // This is not a select list, so just bail
      return;
    }

    // Retrieve select list options
    var list = $this.data('list');

    // Bail if there is no list
    if (!list || !list.length) {
      return;
    }

    // Retrieve options
    var opts = $this.data('opts');

    if (list.length > 2) {
      if ($this.data('listelement')) {
        // List is already shown
        return;
      }

      // Show the select list
      var optsHTML = list.map(function(o) {
        return '<div class="' + opts.prefix + '-item" ' +
          'data-value="' + o[0] + '">' + o[1] + '</div>';
      }).join('');

      // Create the list element
      var $list = $('<div class="' + opts.prefix + '-list">' + optsHTML + 
                    '</div>');

      // Store the list in data property
      $this.data('listelement', $list);

      $list.css({
        'z-index': Math.pow(2, 32)
      });

      // Mark selected item as selected
      $list.find('div').each(function(i, element) {
        if ($(element).data('value') == $this.data('input').val()) {
          $(element).addClass('selected');
        }
      });

      // Appedn the list element to BODY
      $list.appendTo('body');

      // Position the list element relative to label
      $list.relativeTo($this);

      // Handle the click event on the list item
      $list.on('click', '.' + opts.prefix + '-item', function(e) {
        var label = $(this).text();
        var val = $(this).data('value');
        $this.data('label', label);
        $this.data('val', val);
        $this.text(label);
        $this.data('input').val(val).change();
      });

    } else if (list.length === 2) {

      var r = list.filter(function(v) {
        return v[0] !== $this.data('val');
      })[0];

      $this.data('val', r[0]);
      $this.data('label', r[1]);
      $this.text(r[1]);
      $this.data('input').val(r[0]).change();
    }

  });

  // Handle click event on select list label
  $(window).on('click', 'a.select-list', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).focus();
  });

  // Handle blur event on select list label
  $(window).on('blur', 'a.select-list', function(e) {
    var $this = $(this);

    // Need to delay the following action by 150ms because blur happens
    // before click event is triggered on list items. We want blur to
    // happen AFTER we handle the click event on list items so that the
    // click handler can properly set the necessary values.
    setTimeout(function() {
      if (!$this.data('listelement')) {
        return;
      }
      $this.data('listelement').remove();
      $this.data('listelement', null);
    }, 150);
  });

  $(window).on('keydown', 'a.select-list', function(e) {
    var key = e.which;
    var $selected;
    var $next;
    var $prev;
    var $this = $(this);

    var $list = $this.data('listelement');
    var list = $this.data('list');

    if ($list && list.length > 1) {
      if ($list && $this.data('list').length > 1) {
        $selected = $list.find('.selected');

        if ($selected.length) {
          $next = $selected.next();
          $next = $next.length ? $next : $list.find('div').filter(':first');
          $prev = $selected.prev();
          $prev = $prev.length ? $prev : $list.find('div').filter(':last');
        } else {
          $next = $list.find('div').filter(':first');
          $prev = $list.find('div').filter(':last');
        }
      }
    }

    switch (key) {

      // down arrow - select next choice
      case 40: 
        if (!$list) {
          return $this.focus();
        }

        if (list.length < 2) {
          return $this.click();
        }

        $list.find('.selected').removeClass('selected');
        $next.addClass('selected');
        $this.data('input').val($next.data('value'));
        $this.text($next.text());
        $this.data('val', $next.data('value'));
        $this.data('label', $next.text());
        e.preventDefault();
        e.stopPropagation();
        break;

      // up arrow - select previous choice
      case 38:
        if (!$list) {
          return;
        }

        if (list.length < 2) {
          return $this.click();
        }

        $list.find('.selected').removeClass('selected');
        $prev.addClass('selected');
        $this.data('input').val($prev.data('value'));
        $this.text($prev.text());
        $this.data('val', $prev.data('value'));
        $this.data('label', $prev.text());
        e.preventDefault();
        e.stopPropagation();
        break;

      // Retrun / Esc - confirm choice and close the list
      case 13:
      case 27:
        if (!$list) {
          return;
        }
        $list.remove();
        $this.data('listelement', null);
        e.preventDefault();
        e.stopPropagation();
        break;

    }
  });

  var DEFAULTS = {
    prefix: 'jquery-select',
    opts: null
  };

  $.fn.select = function(opts, def) {
    return $(this).map(function(idx, el) {

      if (typeof opts !== 'object') {
        def = opts;
        opts = {};
      }

      opts = $.extend({}, DEFAULTS, opts);

      var $el = $(el);

      // If $el is already select list, just update the options
      if ($el.data('select') === true) {
        $el.data('opts', opts);
        $el.data('list', opts.opts ? opts.opts : $this.data('list'));
        $el.data('input').val(def);
        return;
      }

      // Recover value list and current value either from user-supplied options
      // or underlying HTML.
      var listVals = [];
      var currentVal;
      var currentLabel;

      if (opts.opts) {
        // User-supplied values
        listVals = opts.opts;
        if (typeof def !== 'undefined') {
          currentVal = def.toString();
          currentLabel = listVals.length ? listVals.filter(function(v) {
            return v[0] === currentVal;
          })[0][1] : '';
        }
      } else {
        // Derive values from the OPTION elements
        $el.find('option').each(function(i, optionElement) {
          optionElement = $(optionElement);
          listVals.push([optionElement.val(), optionElement.text()]);
          if (optionElement.is('selected')) {
            currentVal = optionElement.val();
            currentLabel = optionElement.text();
          }
        });
      }
      currentVal = currentVal || listVals.length ? listVals[0][0] : null;
      currentLabel = currentLabel || currentVal ? listVals[0][1] : '';

      // Replace the SELECT with hidden input
      var $input = $('<input type="hidden" class="select-list">');
      if ($el.attr('name')) {
        $input.attr('name', $el.attr('name'));
      }
      if ($el.attr('id')) {
        $input.attr('id', $el.attr('id'));
      }
      $el.replaceWith($input); // XXX: This doesn't work?
      
      // Create label and insert after hidden input
      var $label = $('<a href="JavaScript:void(0)" class="' + 
                 opts.prefix + '-label select-list"></a>');
      if ($el.attr('id')) {
        $label.attr('id', $el.attr('id') + '-label');
      }

      $input.after($label);

      // Store state in input and label elements
      $input.data({
        label: $label,
        select: true
      });

      $label.data({
        list: listVals,
        val: currentVal,
        label: currentLabel,
        input: $input,
        opts: opts,
        select: true
      });

      // Update label when input is changed
      $input.change(function(e) {
        var val = $input.val();
        var list = $label.data('list');
        list.forEach(function(v) {
          if (val == v[0]) {
            $label.text(v[1]);
            $label.data('label', v[1]);
            $label.data('val', val);
          }
        });
      });

      // Set the current value and label
      if (currentVal) {
        $input.val(currentVal);
        $label.text(listVals.filter(function(v) {
          return currentVal === v[0];
        })[0][1]);
      } else {
        $input.val(listVals[0][0]);
        $label.text(listVals[0][1]);
      }

      return $input;
    });
  };

  $.fn.linkTo = function(selector, callback) {
    var $input = $(this);

    // Bail early if not a select widget
    if (!$input.data('select')) {
      return;
    }

    var $label = $input.data('label');

    // When linked control is changed, call the callback
    $(selector).change(function(e) {
      var res = callback(
        $(this).val(), 
        $label.data('val'), 
        $label.data('label'), 
        $label.data('list'));

      $label.data('list', res[0]);
      $label.data('val', res[1]);
      $label.data('label', res[2]);
      $input.val(res[1]);
      $label.text(res[2]);
    });

    return $input;
  };

}));
