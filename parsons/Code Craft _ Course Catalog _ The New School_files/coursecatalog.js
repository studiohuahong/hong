jQuery.noConflict();

(function($) {

  /****************************************************************************/
  // The core 'document ready' logic.
  $(document).ready(function() {

    /**************************************************************************/
    // Enable Bootstrap tooltips.
    // $('body').tooltip({ selector: '[data-toggle=tooltip]' });

    /**************************************************************************/
    // Set the data URL and data URI values.
    data_url = typeof($('#BASE_URL').val()) != 'undefined' ? $('#BASE_URL').val() : '';
    data_uri = typeof($('#BASE_URI').val()) != 'undefined' ? $('#BASE_URI').val() : '';

    /**************************************************************************/
    // Set the cookie name and expiration.
    cookie_name = typeof($('#COOKIE_NAME').val()) != 'undefined' ? $('#COOKIE_NAME').val() : '';
    cookie_expiration = 365;

    /**************************************************************************/
    // Assign these elements to a variable to prevent rescanning the page on each call.
    list_wrapper = $('div.list_wrapper');
    list_header = $('div.list_header');
    search_form = $('form#main_form');
    search_filters = search_form.find('div.search_filters');
    search_filters_hidden = search_filters.find('div.secondary');
    search_filters_toggle = $('div.search_filters_toggle');
    search_filters_controls = $('div.search_filters_controls');
    search_filters_tags = $('div.search_filters_tags');
    total_results = $('div.total_results');
    bookmark = $('a.bookmark');
    csv_export = $('a.csv_export');
    load_more_button = $('a.load_more');
    pagination = $('ul.pagination');

    /**************************************************************************/
    // Set the debounce value in milliseconds.
    general_debounce = 50;
    nested_content_debounce = 50;
    load_more_debounce = 50;
    live_search_text_debounce = 200;
    live_search_filters_debounce = 50;
    live_tags_debounce = 50;

    /**************************************************************************/
    // Set an interval for the cookie handler.
    cookie_watcher_interval = 500;

    /**************************************************************************/
    // Init 'toggle_filters'.
    toggle_filters();

    /**************************************************************************/
    // Init 'nested_content'.
    nested_content_watcher();

    /**************************************************************************/
    // Init 'load_more'.
    load_more_watcher();

    /**************************************************************************/
    // Init 'live_search'.
    live_search_watcher();

    /**************************************************************************/
    // Init 'live_tags'.
    live_tags_watcher();

    /**************************************************************************/
    // Init 'cookie_watcher'.
    cookie_watcher();

  }); // $(document).ready

  /****************************************************************************/
  // The function to toggle search filters.
  function toggle_filters() {

    /**************************************************************************/
    // Toggle the filters based on a user click.
    if (!search_filters_toggle.hasClass('bound')) {
      search_filters_toggle.addClass('bound').on('click', _.debounce(toggle_filters_process, general_debounce));
    }

  } // toggle_filters

  /****************************************************************************/
  // The function to toggle search filters.
  function toggle_filters_process() {

    /****************************************************************************/
    // Toggle the search filters.
    if (search_filters_hidden.hasClass('hide')) {
      search_filters_hidden.removeClass('hide').addClass('show');
      search_filters_toggle.find('span.show_text').removeClass('show').addClass('hide');
      search_filters_toggle.find('span.hide_text').removeClass('hide').addClass('show');
    }
    else {
      search_filters_hidden.removeClass('show').addClass('hide');
      search_filters_toggle.find('span.show_text').removeClass('hide').addClass('show');
      search_filters_toggle.find('span.hide_text').removeClass('show').addClass('hide');
    }

  } // toggle_filters_process

  /****************************************************************************/
  // Function to bind the 'list_wrapper' and watch for clicks on the 'list_row > main_content' div.
  function nested_content_watcher() {
    list_wrapper.on('click', 'div.list_row > div.main_content', _.debounce(nested_content_handler, nested_content_debounce));
  } // nested_content

  /****************************************************************************/
  // Handler to toggle nested list content.
  function nested_content_handler(event) {

    /************************************************************************/
    // Find the 'nested_content' that should be right next to the 'main_content'.
    var nested_content = $(this).siblings('div.nested_content');

    /************************************************************************/
    // We only do this if there is a 'nested_content' div.
    if (nested_content.length >= 1) {

      /**********************************************************************/
      // And we only do this if the click target is not an 'a' link.
      if (!$(event.target).is('a')) {

        /********************************************************************/
        // Prevent default click behavior.
        event.preventDefault();

        /********************************************************************/
        // Set the Ajax option values.
        var data_type = 'json';
        var data_headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };
        var data_method = 'get';
        var data_array = search_form.find(':input').filter(function(index, element) {return $(element).val() != '';}).serializeArray();

        /********************************************************************/
        // Do things with the data array.
        data_array.forEach(function (item) {
          if (item.name === 'query') {
            if (data_array[0].value.indexOf('“') > -1 || data_array[0].value.indexOf('”') > -1 || data_array[0].value.indexOf('‘') > -1 || data_array[0].value.indexOf('’') > -1) {
              data_array[0].value = data_array[0].value.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, '"');
            }
          }
        });

        /********************************************************************/
        // Do things with the data array.
        var list_row_id = nested_content.parents('div.list_row').attr('id').split('_');
        data_array.push({ name: 'crse_id', value: list_row_id[0] });
        if (typeof(list_row_id[1]) != 'undefined') {
          data_array.push({ name: 'crn', value: list_row_id[1] });
        }
        data_array.push({ name: 'mode', value: data_type });

        /********************************************************************/
        // Set the Ajax options.
        var ajax_options = {
          url: data_url + data_uri,
          data: data_array,
          dataType: data_type,
          method: data_method,
          async: true,
          cache: false,
          headers: data_headers,
          success: function(response_data, textStatus, jqXHR) {
            nested_content_success(response_data, nested_content);
          },
          error: function(jqXHR, textStatus) {
            console.log('error: ' + jqXHR.status + ' ' + textStatus + ' | ' + jqXHR.getResponseHeader('content-type'));
          },
          complete: function(jqXHR, textStatus) {
          }
        };

        /********************************************************************/
        // Run the Ajax call.
        if (nested_content.hasClass('hide') && nested_content.children('div').length == 0) {
          $.ajax(ajax_options);
        }
        else {
          nested_content.removeClass('show')
                        .addClass('hide')
                        .empty()
                        .parent('div.list_row.loaded')
                        .removeClass('loaded')
                        ;
        }

      }

    }

  } // nested_content_handler

  /****************************************************************************/
  // Core logic to toggle nested list content.
  function nested_content_success(response_data, nested_content) {

    /****************************************************************/
    // Act on the clicked row. Show it and append content or hide it and empty content.
    if (nested_content.find('a > div').length == 0) {
      if (nested_content.hasClass('hide')) {
        nested_content.parent('div.list_row').addClass('loaded');
        nested_content.append(response_data.data.attributes)
                      .removeClass('hide')
                      .addClass('show')
                      ;
      }
    }
    else {
      nested_content.removeClass('show')
                    .addClass('hide')
                    .empty()
                    .parent('div.list_row.loaded')
                    .removeClass('loaded')
                    ;
    }

    /****************************************************************/
    // Find the sibling rows that are shown and hide them and empty them.
    nested_content.parent('div.list_row')
                  .siblings('div.list_row')
                  .find('div.nested_content.show')
                  .removeClass('show')
                  .addClass('hide')
                  .empty()
                  ;

    /****************************************************************/
    // Hamfisted way of getting rid of the 'loading' class.
    nested_content.parent('div.list_row')
                  .siblings('div.list_row.loaded')
                  .removeClass('loaded')
                  ;

  } // nested_content_success

  /****************************************************************************/
  // Core logic to tload more list content.
  function load_more_watcher() {
    if (!load_more_button.hasClass('bound')) {
      load_more_button.addClass('bound').on('click', _.debounce(load_more_handler, load_more_debounce));
    }
  } // load_more

  /****************************************************************************/
  // Handler to load more list content.
  function load_more_handler() {

    /**************************************************************************/
    // Set the Ajax option values.
    var data_type = 'json';
    var data_headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };
    var data_method = 'get';
    var search_form_array = search_form.find(':input').filter(function(index, element) { return $(element).val() != ''; }).serializeArray();
    var list_header_array = list_header.find(':input').filter(function(index, element) { return $(element).val() != ''; }).serializeArray();
    var data_array = search_form_array.concat(list_header_array);

    /**************************************************************************/
    // Do things with the data array.
    data_array.forEach(function (item) {
      if (item.name === 'query') {
        if (data_array[0].value.indexOf('“') > -1 || data_array[0].value.indexOf('”') > -1 || data_array[0].value.indexOf('‘') > -1 || data_array[0].value.indexOf('’') > -1) {
          data_array[0].value = data_array[0].value.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, '"');
        }
      }
    });

    /**************************************************************************/
    // Do things with the data array.
    data_array.push({ name: 'mode', value: data_type });
    data_array.forEach(function (item) {
      if (item.name === 'page') {
        item.value++;
        $('form input[type="hidden"][name="page"]').val(item.value);
      }
    });

    /**************************************************************************/
    // Set the Ajax options.
    var ajax_options = {
      url: data_url + data_uri,
      data: data_array,
      dataType: data_type,
      method: data_method,
      async: true,
      cache: false,
      headers: data_headers,
      success: function(response_data, textStatus, jqXHR) {
        load_more_success(response_data);
      },
      error: function(jqXHR, textStatus) {
        console.log('error: ' + jqXHR.status + ' ' + textStatus + ' | ' + jqXHR.getResponseHeader('content-type'));
      },
      complete: function(jqXHR, textStatus) {
      }
    };

    /**************************************************************************/
    // Run the Ajax call.
    $.ajax(ajax_options);

  } // load_more_handler

  /****************************************************************************/
  // Core logic to load more list content.
  function load_more_success(response_data) {

    /**************************************************************************/
    // Adjust the pagination based on the returned values.
    if (pagination.length) {
      var current_class = 'current';
      pagination.find('li.' + current_class).removeAttr('class');
      pagination.find('li#page_' + response_data.meta.page).addClass(current_class);
    }

    /**************************************************************************/
    // Disable the 'Load More' button if the current page is less than or equal to the total pages.
    if (response_data.meta.page < response_data.meta.pages) {
      list_wrapper.find('div.list_content').empty().append(response_data.data.attributes);
      $('div.load_more_wrapper').show();
    }
    else {
      list_wrapper.find('div.list_content').append(response_data.data.attributes);
      $('div.load_more_wrapper').hide();
    }

  } // load_more_success

  /****************************************************************************/
  // Function to load live search data.
  function live_search_watcher() {
    search_form.find('input:text').addClass('bound').on('keyup', _.debounce(live_search_handler, live_search_text_debounce));
    search_form.find('select, input[type="date"], input[type="time"], input:checkbox, input:radio').addClass('bound').on('change', _.debounce(live_search_handler, live_search_filters_debounce));
    list_header.find('select, input[type="date"], input[type="time"], input:checkbox, input:radio').addClass('bound').on('change', _.debounce(live_search_handler, live_search_filters_debounce));
  } // live_search

  /****************************************************************************/
  // Handler to load more live search data.
  function live_search_handler() {

    /************************************************************************/
    // Set the Ajax option values.
    var data_type = 'json';
    var data_headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };
    var data_method = 'get';
    var search_form_array = search_form.find(':input').filter(function(index, element) { return $(element).val() != ''; }).serializeArray();
    var list_header_array = list_header.find(':input').filter(function(index, element) { return $(element).val() != ''; }).serializeArray();
    var data_array = search_form_array.concat(list_header_array);

    /************************************************************************/
    // Do things with the data array.
    data_array.push({ name: 'mode', value: data_type });
    data_array.forEach(function (item) {
      if (item.name === 'page') {
        item.value = 1;
        $('form input[type="hidden"][name="page"]').val(item.value);
      }
      else if (item.name === 'query') {
        if (data_array[0].value.indexOf('“') > -1 || data_array[0].value.indexOf('”') > -1 || data_array[0].value.indexOf('‘') > -1 || data_array[0].value.indexOf('’') > -1) {
          data_array[0].value = data_array[0].value.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, '"');
        }
      }
    });

    /************************************************************************/
    // Set the cookie path.
    var cookie_path = typeof(data_uri) != 'undefined' ? window.location.pathname : '/';

    /************************************************************************/
    // Save the filters to a cookie.
    Cookies.set(cookie_name, JSON.stringify(data_array), { expires: cookie_expiration, path: cookie_path });

    /************************************************************************/
    // Set the Ajax options.
    var ajax_options = {
      url: data_url + data_uri,
      data: data_array,
      dataType: data_type,
      method: data_method,
      async: true,
      cache: false,
      headers: data_headers,
      success: function(response_data, textStatus, jqXHR) {
        live_search_success(response_data);
      },
      error: function(jqXHR, textStatus) {
        console.log('error: ' + jqXHR.status + ' ' + textStatus + ' | ' + jqXHR.getResponseHeader('content-type'));
      },
      complete: function(jqXHR, textStatus) {
      }
    };

    /************************************************************************/
    // Run the Ajax call.
    $.ajax(ajax_options);

  } // live_search_handler

  /****************************************************************************/
  // Core logic to execiuting a live search.
  function live_search_success(response_data) {

    /**************************************************************************/
    // Append the returned data to the list.
    list_wrapper.find('div.list_content').empty().append(response_data.data.attributes);

    /**************************************************************************/
    // Adjust the pagination based on the returned values.
    if (pagination.length) {
      var current_class = 'current';
      pagination.find('li.' + current_class).removeAttr('class');
      pagination.find('li#page_' + response_data.meta.page).addClass(current_class);
    }

    /**************************************************************************/
    // Disable the 'Load More' button if the current page is less than or equal to the total pages.
    if (response_data.meta.page < response_data.meta.pages) {
      $('div.load_more_wrapper').show();
    }
    else {
      $('div.load_more_wrapper').hide();
    }

    /**************************************************************************/
    // Run the live tags builder.
    live_tags_builder();

    /**************************************************************************/
    // Set the permlink URL for the bookmark and CSV export links.
    if (response_data.meta.filters > 0 || (response_data.meta.query && response_data.meta.total > 0)) {

      /************************************************************************/
      // Set the data array stuff.
      var search_form_array = search_form.find(':input:not([type="hidden"])').filter(function(item, element) { return $(element).val() != ''; } ).serializeArray();
      var list_header_array = list_header.find(':input:not([type="hidden"])').filter(function(item, element) { return $(element).val() != ''; } ).serializeArray();
      var data_array = search_form_array.concat(list_header_array);
      var data_array_csv = data_array;

      /************************************************************************/
      // Do things with the data array.
      data_array.forEach(function (item) {
        if (item.name === 'query') {
          if (data_array[0].value.indexOf('“') > -1 || data_array[0].value.indexOf('”') > -1 || data_array[0].value.indexOf('‘') > -1 || data_array[0].value.indexOf('’') > -1) {
            data_array[0].value = data_array[0].value.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, '"');
          }
        }
      });

      /************************************************************************/
      // Set the URL permalink for the bookmark.
      var url_permalink = data_url + data_uri;
      if (data_array.length){
        var url_permalink = data_url + data_uri + '?' + $.param(data_array);
      }
      bookmark.attr('href', url_permalink);

      /************************************************************************/
      // Set the URL permalink for the CSV export.
      data_array_csv.push({ name: 'mode', value: 'csv' });
      var url_permalink_csv = data_url + data_uri;
      if (data_array.length){
        var url_permalink_csv = data_url + data_uri + '?' + $.param(data_array_csv);
      }
      csv_export.attr('href', url_permalink_csv);

    }

    /**************************************************************************/
    // Update the total div with new data.
    total_results_builder(response_data);

  } // live_search_success

  /****************************************************************************/
  // A process for setting live search tags.
  function live_tags_builder() {

    /**************************************************************************/
    // Get the values of active form items.
    var active_form_items = search_form.find('input[type="text"], select option:selected, input[type="date"], input[type="time"], input[type="checkbox"]:checked, input[type="radio"]:checked')
                          .filter(function(index, element) {return $(element).val() != '';})
                          ;

    /**************************************************************************/
    // Filter through the active form items and get a list of tags.
    var tags = new Array();
    active_form_items.each(function() {
      var legend = $(this).closest('fieldset').find('legend');
      if (legend.length > 0) {
        var legend_id_value = legend.attr('id').replace('_legend', '');
        if (tags.indexOf(legend_id_value) === -1) {
          tags.push(legend_id_value);
        }
      }
    });

    /**************************************************************************/
    // If we have tags let’s do this.
    if (active_form_items.length > 0) {

      /**************************************************************************/
      // Show the tags area and the the reset button.
      search_filters_tags.addClass('show').removeClass('hide');
      search_filters_tags.find('div#reset_search').addClass('show').removeClass('hide');

      /************************************************************************/
      // Find all of the active tags and hide them.
      search_filters_tags.find('div.label.tag.show').addClass('hide').removeClass('show');

      /************************************************************************/
      // Find all of the active items and enable their tags.
      for (var i = 0; i < tags.length; i++) {
        var id = tags[i] + '_tag';
        search_filters_tags.find('#' + id).addClass('show').removeClass('hide');
      };

    }
    else {

      /**************************************************************************/
      // Show the tags area and the the reset button.
      search_filters_tags.addClass('hide').removeClass('show');
      search_filters_tags.find('div#reset_search').addClass('hide').removeClass('show');

    }

  } // live_tags_builder

  /****************************************************************************/
  // Function to bind the 'search_filters_tags' and watch for clicks on the labels.
  function live_tags_watcher() {
    search_filters_tags.on('click', 'div.label', _.debounce(live_tags_handler, live_tags_debounce));
  } // live_tags_watcher

  /****************************************************************************/
  // Handler to handle the live search tags.
  function live_tags_handler(event) {

    /**************************************************************************/
    // Reset the browser’s location path.
    window.history.replaceState(null, null, window.location.pathname);

    /**************************************************************************/
    // Set the clicked element value.
    var clicked_element = $(event.target).closest('div.label');

    /**************************************************************************/
    // Remove whatever tag was clicked.
    // $('#' + event.target.id).removeClass('show').addClass('hide');
    // $(event.target).closest('div.label').removeClass('show').addClass('hide');
    clicked_element.closest('div.label').removeClass('show').addClass('hide');

    /**************************************************************************/
    // Determine what form element we are acting on.
    // var id = event.target.id.replace('_tag', '');
    // var id = $(event.target).closest('div.label').attr('id').replace('_tag', '');
    var id = clicked_element.attr('id').replace('_tag', '');
    if (id == 'reset_search') {
      reset_form_fields_handler(true);
      search_filters_tags.find('div.label.show').removeClass('show').addClass('hide');
      search_filters_tags.find('a.total_results.show').removeClass('show').addClass('hide');
      search_filters_tags.removeClass('show').addClass('hide');
    }
    else {
      var form_element = search_form.find('fieldset.' + id).find('select option:selected, input[type="date"], input[type="time"], input[type="checkbox"]:checked, input[type="radio"]:checked');
      if (form_element.length > 0) {
        form_element.prop('value', null).removeAttr('value').attr('value', null);
        form_element.prop('checked', false).removeAttr('checked');
        form_element.prop('selected', false).removeAttr('selected');
      }
    }

    /**************************************************************************/
    // Trigger a change on the first element to get the search to run again.
    setTimeout(function() {
      search_form.find('select:first, input[type="date"]:first, input[type="time"]:first, input:checkbox:first, input:radio:first').trigger('change');
    }, 100);

  } // live_tags_handler

  /****************************************************************************/
  // Function to bind the 'cookie_handler' and watch for clicks on the labels.
  function cookie_watcher() {

    /**************************************************************************/
    // Only send to the cookie handler if the URL does not have any parameters.
    if (window.location.href.indexOf('?') == -1) {
      setTimeout(cookie_handler, cookie_watcher_interval);
    } // if

  } // cookie_watcher

  /****************************************************************************/
  // Function to watch out for the 'filters' cookie.
  function cookie_handler() {

    /**************************************************************************/
    // Set the cookie array if there is a cookie.
    var cookie_array = typeof(Cookies.get(cookie_name)) != 'undefined' ? Cookies.get(cookie_name) : new Array();

    /**************************************************************************/
    // Init the value array.
    var value_array =  new Array();

    /**************************************************************************/
    // If there is a cookie array, do something.
    if (cookie_array.length >= 1) {
      // reset_form_fields_handler();
      var cookie_parsed_array = JSON.parse(cookie_array);
      $.each(cookie_parsed_array, function(i, item) {
        var key_name = item.name;
        var key_value = item.value;
        value_array.push({ name: key_name, value: key_value });
        // var key_name = item.name.replace(/[^a-zA-Z 0-9.!?_-]+/g, '');
        // var key_value = item.value;
        // if (typeof(value_array[key_name]) == 'undefined') {
        //   value_array[key_name] =  new Array();
        // } // if 
        // value_array[key_name].push(key_value);
      });
    } // if

    /**************************************************************************/
    // If there is a value array, do something.
    if (value_array.length >= 1) {
      $.each(value_array, function(i, item) {
        var key_name = item.name;
        var key_value = item.value;
        var text = search_form.find("input[type='text'][name='" + key_name + "']");
        if (text.length) {
          text.val(key_value).trigger('keyup');
        } // if
        else {
          var time = search_form.find("input[type='time'][name='" + key_name + "']:first-of-type:is(input[value=''])");
          if (time.length) {
            time.val(key_value).trigger('change');
          } // if
          else {
            var date = search_form.find("input[type='date'][name='" + key_name + "']:first-of-type:is(input[value=''])");
            if (date.length) {
              date.val(key_value).trigger('change');
            } // if
            else {
              var checkbox = search_form.find("input[type='checkbox'][name='" + key_name + "'][value='" + key_value + "']:not(:checked)");
              if (checkbox.length) {
                checkbox.prop('checked', true).trigger('change');
              } // if
              else {
                var radio = search_form.find("input[type='radio'][name='" + key_name + "'][value='" + key_value + "']:not(:checked)");
                if (radio.length) {
                  radio.prop('checked', true).trigger('change');
                } // if
                else {
                  var select = search_form.find("select[name='" + key_name + "'] option[value='" + key_value + "']:not(:selected)");
                  if (select.length) {
                    select.prop('selected', true).trigger('change');
                  } // if
                } // else
              } // else
            } // else
          } // else
        } // else
      });
    } // if

  } // cookie_handler

  /****************************************************************************/
  // Determines what to do with the total results area.
  function total_results_builder(response_data) {

    if (typeof(response_data) != 'undefined') {
      if (response_data.meta.total > 0) {
        if (response_data.meta.query) {
          total_results_process(response_data.meta.total);
        }
        else if (response_data.meta.filters > 0) {
          total_results_process(response_data.meta.total);
        }
      }
      else {
        // total_results.removeClass('show').addClass('hide');
        total_results_process(0);
      }
    }

  } // total_results_builder

  /****************************************************************************/
  // The process that juggles the magic behind the total results display area.
  function total_results_process(total) {

    /**************************************************************************/
    // Show the 'Searching…' thing and hide the search results span.
    total_results.removeClass('hide').addClass('show loading').find('span.searching').removeClass('hide').addClass('show');
    total_results.find('span.results').removeClass('show').addClass('hide');

    /**************************************************************************/
    // Only show the bookmark and CSV export links if results are greater than 0.
    if (total > 0) {
      bookmark.removeClass('hide').addClass('show');
      csv_export.removeClass('hide').addClass('show');
    }
    else {
      bookmark.removeClass('show').addClass('hide');
      csv_export.removeClass('show').addClass('hide');
    }

    /************************************************************************/
    // After a delay, hide the 'Searching…' thing and change the value of the search results to match the new values.
    setTimeout(function(){
      total_results.removeClass('loading').find('span.searching').removeClass('show').addClass('hide');
      total_results.find('span.results').removeClass('hide').addClass('show').find('span.total').text(total.toLocaleString());
    }, 400);

  } // total_results_process

  /****************************************************************************/
  // Handler to reset form field values.
  function reset_form_fields_handler(reset_browser_path) {

    /**************************************************************************/
    // Reset the browser’s location path.
    if (typeof(reset_browser_path) != 'undefined') {
      window.history.replaceState(null, null, window.location.pathname);
    } // if

    /**************************************************************************/
    // Reset 'select' field items in the search filter.
    var select_items = search_form.find('select option:selected');
    select_items_active = select_items.filter(function(index, element) {return $(element).val() != '';});
    if (select_items_active.length > 0) {
      select_items.prop('selected', false).removeAttr('selected');
    }

    /**************************************************************************/
    // Reset 'select' field items in the sort items.
    var select_items = list_header.find('select option:selected');
    select_items_active = select_items.filter(function(index, element) {return $(element).val() != '';});
    if (select_items_active.length > 0) {
      select_items.prop('selected', false).removeAttr('selected');
    }

    /**************************************************************************/
    // Reset 'radio' and 'checkbox' field items in the search filter.
    var input_items = search_form.find('input[type="checkbox"]:checked, input[type="radio"]:checked');
    input_items_active = input_items.filter(function(index, element) {return $(element).val() != '';});
    if (input_items_active.length > 0) {
      input_items.prop('checked', false).removeAttr('checked');
    }

    /**************************************************************************/
    // Reset 'radio' and 'checkbox' field items in the sort items.
    var input_items = list_header.find('input[type="checkbox"]:checked, input[type="radio"]:checked');
    input_items_active = input_items.filter(function(index, element) {return $(element).val() != '';});
    if (input_items_active.length > 0) {
      input_items.prop('checked', false).removeAttr('checked').parent().removeClass('active');
    }

    /**************************************************************************/
    // Reset 'text' field items in the search filter.
    // search_form.find('input[type="text"]').prop('value', null).removeAttr('value').attr('value', null);
    search_form.find('input:text').prop('value', null).removeAttr('value').attr('value', null);

    /**************************************************************************/
    // Reset 'date' field items in the search filter.
    search_form.find('input[type="date"]').prop('value', null).removeAttr('value').attr('value', null);

    /**************************************************************************/
    // Reset 'time' field items in the search filter.
    search_form.find('input[type="time"]').prop('value', null).removeAttr('value').attr('value', null);

    /**************************************************************************/
    // Trigger a change on the last element to get the search to run again.
    setTimeout(function() {
      search_form.find('select:first, input[type="date"]:first, input[type="time"]:first, input:checkbox:first, input:radio:first').trigger('change');
    }, 100);

    /**************************************************************************/
    // Empty the list content area if the class 'empty_on_reset' is set.
    list_wrapper.find('div.list_content.empty_on_reset').empty();

  } // reset_form_fields_handler

  // /****************************************************************************/
  // // A function to get a specific URL parameter.
  // function get_url_param(name) {
  //   return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20')) || null;
  // } // get_url_param

  // /****************************************************************************/
  // // The function to scroll to the open list item.
  // // Some kind of WebKit method might be best.
  // function scroll_to_opened_list_item() {
  //
  //   var offset = $(this).offset().top - $(window).scrollTop();
  //   var row_size = $(this).find('div.main_content').outerHeight();
  //   $('html, body').stop().animate({ scrollTop: $(this).offset().top }, 300, 'swing');
  //
  // } // scroll_to_opened_list_item

})(jQuery);
