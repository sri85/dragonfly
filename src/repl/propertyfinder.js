﻿/**
 * Resolve the properties of an object in a runtime.
 *
 * Singleton. Every instanciation will return the same instance. Contains
 * no state apart from the caching, which should be shared.
 */

window.cls = window.cls || {};
window.cls.PropertyFinder = function(rt_id) {
  if (window.cls.PropertyFinder.instance) {
    return window.cls.PropertyFinder.instance;
  }
  else {
    window.cls.PropertyFinder.instance = this;
  }

  // this cond is here so we can instanciate the class even without running
  // with scope. Means we can run tests on functions that don't require
  // scope.
  if (window.services)
  {
    this._service = window.services['ecmascript-debugger'];
  }

  this._cache = {};

  /**
   * Method that does The Right Thing with regards to what method is
   * available for requesting an eval() in a connected Opera instance.
   *
   * Subclasses that adds support for never ecma service versions can
   * override this method
   *
   */
  this._requestEval = function(callback, js, scope, identifier, input, frameinfo, context) {
    context = context || [];

    var tag = tagManager.set_callback(this, this._onRequestEval,
                                      [callback, scope, identifier, input, frameinfo]);

    this._service.requestEval(
      tag, [frameinfo.runtime_id, frameinfo.thread_id, frameinfo.index, js, context]
    );
  };

  this._requestExamineObjects = function(callback, scope, identifier, input, frameinfo) {
    var tag = tagManager.set_callback(this, this._onRequestExamineObjects,
                                      [callback, scope, identifier, input, frameinfo]);

    var scopes = [frameinfo.scope_id];
    if (frameinfo.scope_list)
    {
      // Skip last scope in list, it's t global one which
      // isn't in completer (for now. should be an option)
      scopes = frameinfo.scope_list.slice(0, -1);
    }

    this._service.requestExamineObjects(
      tag, [frameinfo.runtime_id, scopes, 0, 1]
    );
  };

  /**
   * Figure out the object to which input belongs.
   * foo.bar -> foo
   * window.bleh.meh -> window.bleh
   * phlebotinum -> this
   * phlebotinum. -> phlebotinum
   * foo(bar.bleh -> bar
   * foo[window -> window
   * foo[bar].a -> foo[bar]
   */
  this._find_input_parts = function(input)
  {
    var last_bracket = input.lastIndexOf('[');
    var last_brace = input.lastIndexOf('(');

    last_brace = input.lastIndexOf(')') <= last_brace ? last_brace : -1;
    last_bracket = input.lastIndexOf(']') <= last_bracket ? last_bracket : -1;
    input = input.slice( Math.max(
                  last_brace,
                  last_bracket,
                  input.lastIndexOf('=') ) + 1
                ).replace(/^\s+/, '');

    var last_dot = input.lastIndexOf('.');
    var new_path = '';
    var new_id = '';
    var ret = '';

    if(last_dot > -1)
    {
      new_path = input.slice(0, last_dot);
      new_id = input.slice(last_dot + 1).replace(/^\s+/, '');
    }
    else
    {
      new_id = input;
    }

    return {scope: new_path, identifier: new_id};
  };

  this._onRequestEval = function(status, message, callback, scope, identifier, input, frameinfo) {
    var ret = {
      props: [],
      scope: scope,
      input: input,
      identifier: identifier,
      frameinfo: frameinfo
    };

    if (status == 0) {
      const STATUS = 0, TYPE = 1, VALUE = 2, OBJECT_VALUE = 3;
      if(message[STATUS] == 'completed')
      {
        if(message[VALUE])
        {
          ret.props = message[VALUE].split('_,_').filter(
                        function(e) { return e != ""; }
          );
        }

        if (!ret.scope && ret.props.indexOf("this") == -1)
        {
          ret.props.push("this");
        }
      }
    }

    this._cache_put(ret);
    callback(ret);
  };

  this._onRequestExamineObjects = function(status, message, callback, scope, identifier, input, frameinfo) {
    var ret = {
      props: [],
      scope: scope,
      input: input,
      identifier: identifier,
      frameinfo: frameinfo
    };

    if (status == 0) {
      const OBJECT_CHAIN_LIST = 0, OBJECT_LIST = 0, PROPERTY_LIST = 1, NAME = 0;
      var names = [];
      (message[OBJECT_CHAIN_LIST] || []).forEach(function(chain){
        var objectlist = chain[OBJECT_LIST] || [];
        objectlist.forEach(function(obj) {
          names = names.concat((obj[PROPERTY_LIST] || []).map(function(prop) {
            return prop[NAME];
          }));
        });
      });

      ret.props = names;

      if (ret.props.indexOf("this") == -1)
      {
        ret.props.push("this");
      }

      if (ret.frameinfo.argument_id !== undefined && ret.props.indexOf("arguments"))
      {
        ret.props.push("arguments");
      }
    }
    this._cache_put(ret);
    callback(ret);
  };

  /**
   * Returns a list of properties that match the input string in the given
   * runtime.
   *
   */
  this.find_props = function(callback, input, frameinfo, context) {
    frameinfo = frameinfo ||
    {
      runtime_id: runtimes.getSelectedRuntimeId(),
      thread_id: 0,
      scope_id: runtimes.getRuntime(runtimes.getSelectedRuntimeId()).object_id,
      index: 0
    };

    frameinfo.stopped = Boolean(frameinfo.thread_id);

    var parts = this._find_input_parts(input);

    var props = this._cache_get(parts.scope, frameinfo);
    if (props) {
      props.input = input;
      props.identifier = parts.identifier;
      callback(props);
    }
    else {
      this._get_scope_contents(callback, parts.scope, parts.identifier, input,
                               frameinfo, context);
    }
  };

  /**
   * Tell the caching mechanism that it need no longer keep track of data
   * about a particular runtime. Can be hooked up to messages about closed
   * tabs/runtimes
   */
  this.clear_cache = function(rt_id) {
    this._cache = {};
  };

  this._cache_key = function(scope, frameinfo) {
    return "" + scope + "." + frameinfo.runtime_id + "." + frameinfo.thread_id + "." + frameinfo.index;
  };

  this._cache_put = function(result)
  {
    var key = this._cache_key(result.scope, result.frameinfo);
    this._cache[key] = result;
  };

  this._cache_get = function(scope, frameinfo) {
    var key = this._cache_key(scope, frameinfo);
    return this._cache[key];
  };

  this._get_scope_contents = function(callback, scope, identifier, input, frameinfo, context) {
    if (!scope) { // if there is no scope, use examineObject call
      this._requestExamineObjects(callback, scope, identifier, input, frameinfo);
    }
    else
    {
      var script = "(function(scope){var a = '', b= ''; for( a in scope ){ b += a + '_,_'; }; return b;})(%s)";
      var eval_str = script.replace("%s", scope || "this");

      var magicvars = [];
      if (context) {
        for (var key in context) { magicvars.push([key, context[key]]) }
      }

      if (frameinfo.index !== undefined) {
        this._requestEval(callback, eval_str, scope, identifier, input,
                          frameinfo, magicvars);
      }
    }
  };

  this.toString = function() {
    return "[PropertyFinder singleton instance]";
  };
};

cls.PropertyFinder.prop_sorter = function(a, b)
{
  a = a.toLowerCase();
  b = b.toLowerCase();

  if (a.isdigit() && b.isdigit())
  {
    return parseInt(a, 10) - parseInt(b, 10);
  }
  else if (a>b)
  {
    return 1;
  }
  else if (a<b)
  {
    return -1;
  }
  return 0;
};
