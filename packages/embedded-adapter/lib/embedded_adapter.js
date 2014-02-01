/**
  @module ember-data
  @submodule embedded-adapter
**/

var forEach = Ember.EnumerableUtils.forEach;

/**
  DS.EmbeddedAdapter extends the DS.RESTSerializer adding mixin:
  DS.UnderscoredAdapterMixin

  @class EmbeddedAdapter
  @constructor
  @namespace DS
  @extends DS.RESTAdapter
**/

DS.EmbeddedAdapter = DS.RESTAdapter.extend(DS.UnderscoredAdapterMixin, {
  defaultSerializer: '_embedded',

  /**
    Redefine adapter's ajax method and keep a reference to the hash
    in the closure, at times it was lost (without explicit ref).

    @method ajax
  **/
  ajax: function(url, type, hash) {
    var adapter, _hash;
    adapter = this;
    _hash = hash;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      hash = adapter.ajaxOptions(url, type, _hash);
      hash.success = function(json) {
        return Ember.run(null, resolve, json);
      };
      hash.error = function(jqXHR, textStatus, errorThrown) {
        return Ember.run(null, reject, adapter.ajaxError(jqXHR));
      };
      return Ember.$.ajax(hash);
    });
  },

  /**
    DS.UnderscoredAdapterMixin can override the `ajaxError` method
    to return a DS.InvalidError for all 422 Unprocessable Entity
    responses.

    A 422 HTTP response from the server generally implies that the request
    was well formed but the API was unable to process it because the
    content was not semantically correct or meaningful per the API.

    For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
    https://tools.ietf.org/html/rfc4918#section-11.2

    @method ajaxError
    @param jqXHR
    @return error
  */
  ajaxError: function(jqXHR) {
    var error = this._super(jqXHR),
      errors = {};

    if (jqXHR && jqXHR.status === 422) {
      var jsonErrors = Ember.$.parseJSON(jqXHR.responseText)["errors"];

      forEach(Ember.keys(jsonErrors), function (key) {
        errors[Ember.String.camelize(key)] = jsonErrors[key];
      });

      return new DS.InvalidError(errors);
    } else if (jqXHR && jqXHR.status === 404) {
      errors['404'] = 'Not Found';
      return new DS.InvalidError(errors);
    } else {
      return error;
    }
  }
});
