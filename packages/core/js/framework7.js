/**
 * Framework7 3.2.3
 * Full featured mobile HTML framework for building iOS & Android apps
 * http://framework7.io/
 *
 * Copyright 2014-2018 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: September 9, 2018
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Framework7 = factory());
}(this, (function () { 'use strict';

  /**
   * Template7 1.4.0
   * Mobile-first HTML template engine
   * 
   * http://www.idangero.us/template7/
   * 
   * Copyright 2018, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   * 
   * Licensed under MIT
   * 
   * Released on: August 31, 2018
   */
  var t7ctx;
  if (typeof window !== 'undefined') {
    t7ctx = window;
  } else if (typeof global !== 'undefined') {
    t7ctx = global;
  } else {
    t7ctx = undefined;
  }

  var Template7Context = t7ctx;

  var Template7Utils = {
    quoteSingleRexExp: new RegExp('\'', 'g'),
    quoteDoubleRexExp: new RegExp('"', 'g'),
    isFunction: function isFunction(func) {
      return typeof func === 'function';
    },
    escape: function escape(string) {
      return (typeof Template7Context !== 'undefined' && Template7Context.escape) ?
        Template7Context.escape(string) :
        string
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
    },
    helperToSlices: function helperToSlices(string) {
      var quoteDoubleRexExp = Template7Utils.quoteDoubleRexExp;
      var quoteSingleRexExp = Template7Utils.quoteSingleRexExp;
      var helperParts = string.replace(/[{}#}]/g, '').trim().split(' ');
      var slices = [];
      var shiftIndex;
      var i;
      var j;
      for (i = 0; i < helperParts.length; i += 1) {
        var part = helperParts[i];
        var blockQuoteRegExp = (void 0);
        var openingQuote = (void 0);
        if (i === 0) { slices.push(part); }
        else if (part.indexOf('"') === 0 || part.indexOf('\'') === 0) {
          blockQuoteRegExp = part.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
          openingQuote = part.indexOf('"') === 0 ? '"' : '\'';
          // Plain String
          if (part.match(blockQuoteRegExp).length === 2) {
            // One word string
            slices.push(part);
          } else {
            // Find closed Index
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              part += " " + (helperParts[j]);
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                slices.push(part);
                break;
              }
            }
            if (shiftIndex) { i = shiftIndex; }
          }
        } else if (part.indexOf('=') > 0) {
          // Hash
          var hashParts = part.split('=');
          var hashName = hashParts[0];
          var hashContent = hashParts[1];
          if (!blockQuoteRegExp) {
            blockQuoteRegExp = hashContent.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
            openingQuote = hashContent.indexOf('"') === 0 ? '"' : '\'';
          }
          if (hashContent.match(blockQuoteRegExp).length !== 2) {
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              hashContent += " " + (helperParts[j]);
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                break;
              }
            }
            if (shiftIndex) { i = shiftIndex; }
          }
          var hash = [hashName, hashContent.replace(blockQuoteRegExp, '')];
          slices.push(hash);
        } else {
          // Plain variable
          slices.push(part);
        }
      }
      return slices;
    },
    stringToBlocks: function stringToBlocks(string) {
      var blocks = [];
      var i;
      var j;
      if (!string) { return []; }
      var stringBlocks = string.split(/({{[^{^}]*}})/);
      for (i = 0; i < stringBlocks.length; i += 1) {
        var block = stringBlocks[i];
        if (block === '') { continue; }
        if (block.indexOf('{{') < 0) {
          blocks.push({
            type: 'plain',
            content: block,
          });
        } else {
          if (block.indexOf('{/') >= 0) {
            continue;
          }
          block = block
            .replace(/{{([#/])*([ ])*/, '{{$1')
            .replace(/([ ])*}}/, '}}');
          if (block.indexOf('{#') < 0 && block.indexOf(' ') < 0 && block.indexOf('else') < 0) {
            // Simple variable
            blocks.push({
              type: 'variable',
              contextName: block.replace(/[{}]/g, ''),
            });
            continue;
          }
          // Helpers
          var helperSlices = Template7Utils.helperToSlices(block);
          var helperName = helperSlices[0];
          var isPartial = helperName === '>';
          var helperContext = [];
          var helperHash = {};
          for (j = 1; j < helperSlices.length; j += 1) {
            var slice = helperSlices[j];
            if (Array.isArray(slice)) {
              // Hash
              helperHash[slice[0]] = slice[1] === 'false' ? false : slice[1];
            } else {
              helperContext.push(slice);
            }
          }

          if (block.indexOf('{#') >= 0) {
            // Condition/Helper
            var helperContent = '';
            var elseContent = '';
            var toSkip = 0;
            var shiftIndex = (void 0);
            var foundClosed = false;
            var foundElse = false;
            var depth = 0;
            for (j = i + 1; j < stringBlocks.length; j += 1) {
              if (stringBlocks[j].indexOf('{{#') >= 0) {
                depth += 1;
              }
              if (stringBlocks[j].indexOf('{{/') >= 0) {
                depth -= 1;
              }
              if (stringBlocks[j].indexOf(("{{#" + helperName)) >= 0) {
                helperContent += stringBlocks[j];
                if (foundElse) { elseContent += stringBlocks[j]; }
                toSkip += 1;
              } else if (stringBlocks[j].indexOf(("{{/" + helperName)) >= 0) {
                if (toSkip > 0) {
                  toSkip -= 1;
                  helperContent += stringBlocks[j];
                  if (foundElse) { elseContent += stringBlocks[j]; }
                } else {
                  shiftIndex = j;
                  foundClosed = true;
                  break;
                }
              } else if (stringBlocks[j].indexOf('else') >= 0 && depth === 0) {
                foundElse = true;
              } else {
                if (!foundElse) { helperContent += stringBlocks[j]; }
                if (foundElse) { elseContent += stringBlocks[j]; }
              }
            }
            if (foundClosed) {
              if (shiftIndex) { i = shiftIndex; }
              if (helperName === 'raw') {
                blocks.push({
                  type: 'plain',
                  content: helperContent,
                });
              } else {
                blocks.push({
                  type: 'helper',
                  helperName: helperName,
                  contextName: helperContext,
                  content: helperContent,
                  inverseContent: elseContent,
                  hash: helperHash,
                });
              }
            }
          } else if (block.indexOf(' ') > 0) {
            if (isPartial) {
              helperName = '_partial';
              if (helperContext[0]) {
                if (helperContext[0].indexOf('[') === 0) { helperContext[0] = helperContext[0].replace(/[[\]]/g, ''); }
                else { helperContext[0] = "\"" + (helperContext[0].replace(/"|'/g, '')) + "\""; }
              }
            }
            blocks.push({
              type: 'helper',
              helperName: helperName,
              contextName: helperContext,
              hash: helperHash,
            });
          }
        }
      }
      return blocks;
    },
    parseJsVariable: function parseJsVariable(expression, replace, object) {
      return expression.split(/([+ \-*/^])/g).map(function (part) {
        if (part.indexOf(replace) < 0) { return part; }
        if (!object) { return JSON.stringify(''); }
        var variable = object;
        if (part.indexOf((replace + ".")) >= 0) {
          part.split((replace + "."))[1].split('.').forEach(function (partName) {
            if (partName in variable) { variable = variable[partName]; }
            else { variable = undefined; }
          });
        }
        if (typeof variable === 'string') {
          variable = JSON.stringify(variable);
        }
        if (variable === undefined) { variable = 'undefined'; }
        return variable;
      }).join('');
    },
    parseJsParents: function parseJsParents(expression, parents) {
      return expression.split(/([+ \-*^])/g).map(function (part) {
        if (part.indexOf('../') < 0) { return part; }
        if (!parents || parents.length === 0) { return JSON.stringify(''); }
        var levelsUp = part.split('../').length - 1;
        var parentData = levelsUp > parents.length ? parents[parents.length - 1] : parents[levelsUp - 1];

        var variable = parentData;
        var parentPart = part.replace(/..\//g, '');
        parentPart.split('.').forEach(function (partName) {
          if (variable[partName]) { variable = variable[partName]; }
          else { variable = 'undefined'; }
        });
        return JSON.stringify(variable);
      }).join('');
    },
    getCompileVar: function getCompileVar(name, ctx, data) {
      if ( data === void 0 ) data = 'data_1';

      var variable = ctx;
      var parts;
      var levelsUp = 0;
      var newDepth;
      if (name.indexOf('../') === 0) {
        levelsUp = name.split('../').length - 1;
        newDepth = variable.split('_')[1] - levelsUp;
        variable = "ctx_" + (newDepth >= 1 ? newDepth : 1);
        parts = name.split('../')[levelsUp].split('.');
      } else if (name.indexOf('@global') === 0) {
        variable = 'Template7.global';
        parts = name.split('@global.')[1].split('.');
      } else if (name.indexOf('@root') === 0) {
        variable = 'root';
        parts = name.split('@root.')[1].split('.');
      } else {
        parts = name.split('.');
      }
      for (var i = 0; i < parts.length; i += 1) {
        var part = parts[i];
        if (part.indexOf('@') === 0) {
          var dataLevel = data.split('_')[1];
          if (levelsUp > 0) {
            dataLevel = newDepth;
          }
          if (i > 0) {
            variable += "[(data_" + dataLevel + " && data_" + dataLevel + "." + (part.replace('@', '')) + ")]";
          } else {
            variable = "(data_" + dataLevel + " && data_" + dataLevel + "." + (part.replace('@', '')) + ")";
          }
        } else if (Number.isFinite ? Number.isFinite(part) : Template7Context.isFinite(part)) {
          variable += "[" + part + "]";
        } else if (part === 'this' || part.indexOf('this.') >= 0 || part.indexOf('this[') >= 0 || part.indexOf('this(') >= 0) {
          variable = part.replace('this', ctx);
        } else {
          variable += "." + part;
        }
      }
      return variable;
    },
    getCompiledArguments: function getCompiledArguments(contextArray, ctx, data) {
      var arr = [];
      for (var i = 0; i < contextArray.length; i += 1) {
        if (/^['"]/.test(contextArray[i])) { arr.push(contextArray[i]); }
        else if (/^(true|false|\d+)$/.test(contextArray[i])) { arr.push(contextArray[i]); }
        else {
          arr.push(Template7Utils.getCompileVar(contextArray[i], ctx, data));
        }
      }

      return arr.join(', ');
    },
  };

  /* eslint no-eval: "off" */
  var Template7Helpers = {
    _partial: function _partial(partialName, options) {
      var ctx = this;
      var p = Template7Class.partials[partialName];
      if (!p || (p && !p.template)) { return ''; }
      if (!p.compiled) {
        p.compiled = new Template7Class(p.template).compile();
      }
      Object.keys(options.hash).forEach(function (hashName) {
        ctx[hashName] = options.hash[hashName];
      });
      return p.compiled(ctx, options.data, options.root);
    },
    escape: function escape(context) {
      if (typeof context !== 'string') {
        throw new Error('Template7: Passed context to "escape" helper should be a string');
      }
      return Template7Utils.escape(context);
    },
    if: function if$1(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    unless: function unless(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (!ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    each: function each(context, options) {
      var ctx = context;
      var ret = '';
      var i = 0;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (Array.isArray(ctx)) {
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
        for (i = 0; i < ctx.length; i += 1) {
          ret += options.fn(ctx[i], { first: i === 0, last: i === ctx.length - 1, index: i });
        }
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
      } else {
        // eslint-disable-next-line
        for (var key in ctx) {
          i += 1;
          ret += options.fn(ctx[key], { key: key });
        }
      }
      if (i > 0) { return ret; }
      return options.inverse(this);
    },
    with: function with$1(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = context.call(this); }
      return options.fn(ctx);
    },
    join: function join(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      return ctx.join(options.hash.delimiter || options.hash.delimeter);
    },
    js: function js(expression, options) {
      var data = options.data;
      var func;
      var execute = expression;
      ('index first last key').split(' ').forEach(function (prop) {
        if (typeof data[prop] !== 'undefined') {
          var re1 = new RegExp(("this.@" + prop), 'g');
          var re2 = new RegExp(("@" + prop), 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = "(function(){" + execute + "})";
      } else {
        func = "(function(){return (" + execute + ")})";
      }
      return eval(func).call(this);
    },
    js_if: function js_if(expression, options) {
      var data = options.data;
      var func;
      var execute = expression;
      ('index first last key').split(' ').forEach(function (prop) {
        if (typeof data[prop] !== 'undefined') {
          var re1 = new RegExp(("this.@" + prop), 'g');
          var re2 = new RegExp(("@" + prop), 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = "(function(){" + execute + "})";
      } else {
        func = "(function(){return (" + execute + ")})";
      }
      var condition = eval(func).call(this);
      if (condition) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
  };
  Template7Helpers.js_compare = Template7Helpers.js_if;

  var Template7Options = {};
  var Template7Partials = {};

  var Template7Class = function Template7Class(template) {
    var t = this;
    t.template = template;
  };

  var staticAccessors = { options: { configurable: true },partials: { configurable: true },helpers: { configurable: true } };
  Template7Class.prototype.compile = function compile (template, depth) {
      if ( template === void 0 ) template = this.template;
      if ( depth === void 0 ) depth = 1;

    var t = this;
    if (t.compiled) { return t.compiled; }

    if (typeof template !== 'string') {
      throw new Error('Template7: Template must be a string');
    }
    var stringToBlocks = Template7Utils.stringToBlocks;
      var getCompileVar = Template7Utils.getCompileVar;
      var getCompiledArguments = Template7Utils.getCompiledArguments;

    var blocks = stringToBlocks(template);
    var ctx = "ctx_" + depth;
    var data = "data_" + depth;
    if (blocks.length === 0) {
      return function empty() { return ''; };
    }

    function getCompileFn(block, newDepth) {
      if (block.content) { return t.compile(block.content, newDepth); }
      return function empty() { return ''; };
    }
    function getCompileInverse(block, newDepth) {
      if (block.inverseContent) { return t.compile(block.inverseContent, newDepth); }
      return function empty() { return ''; };
    }

    var resultString = '';
    if (depth === 1) {
      resultString += "(function (" + ctx + ", " + data + ", root) {\n";
    } else {
      resultString += "(function (" + ctx + ", " + data + ") {\n";
    }
    if (depth === 1) {
      resultString += 'function isArray(arr){return Array.isArray(arr);}\n';
      resultString += 'function isFunction(func){return (typeof func === \'function\');}\n';
      resultString += 'function c(val, ctx) {if (typeof val !== "undefined" && val !== null) {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n';
      resultString += 'root = root || ctx_1 || {};\n';
    }
    resultString += 'var r = \'\';\n';
    var i;
    for (i = 0; i < blocks.length; i += 1) {
      var block = blocks[i];
      // Plain block
      if (block.type === 'plain') {
        // eslint-disable-next-line
        resultString += "r +='" + ((block.content).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, '\\' + '\'')) + "';";
        continue;
      }
      var variable = (void 0);
      var compiledArguments = (void 0);
      // Variable block
      if (block.type === 'variable') {
        variable = getCompileVar(block.contextName, ctx, data);
        resultString += "r += c(" + variable + ", " + ctx + ");";
      }
      // Helpers block
      if (block.type === 'helper') {
        var parents = (void 0);
        if (ctx !== 'ctx_1') {
          var level = ctx.split('_')[1];
          var parentsString = "ctx_" + (level - 1);
          for (var j = level - 2; j >= 1; j -= 1) {
            parentsString += ", ctx_" + j;
          }
          parents = "[" + parentsString + "]";
        } else {
          parents = "[" + ctx + "]";
        }
        var dynamicHelper = (void 0);
        if (block.helperName.indexOf('[') === 0) {
          block.helperName = getCompileVar(block.helperName.replace(/[[\]]/g, ''), ctx, data);
          dynamicHelper = true;
        }
        if (dynamicHelper || block.helperName in Template7Helpers) {
          compiledArguments = getCompiledArguments(block.contextName, ctx, data);
          resultString += "r += (Template7Helpers" + (dynamicHelper ? ("[" + (block.helperName) + "]") : ("." + (block.helperName))) + ").call(" + ctx + ", " + (compiledArguments && ((compiledArguments + ", "))) + "{hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
        } else if (block.contextName.length > 0) {
          throw new Error(("Template7: Missing helper: \"" + (block.helperName) + "\""));
        } else {
          variable = getCompileVar(block.helperName, ctx, data);
          resultString += "if (" + variable + ") {";
          resultString += "if (isArray(" + variable + ")) {";
          resultString += "r += (Template7Helpers.each).call(" + ctx + ", " + variable + ", {hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
          resultString += '}else {';
          resultString += "r += (Template7Helpers.with).call(" + ctx + ", " + variable + ", {hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
          resultString += '}}';
        }
      }
    }
    resultString += '\nreturn r;})';

    if (depth === 1) {
      // eslint-disable-next-line
      t.compiled = eval(resultString);
      return t.compiled;
    }
    return resultString;
  };
  staticAccessors.options.get = function () {
    return Template7Options;
  };
  staticAccessors.partials.get = function () {
    return Template7Partials;
  };
  staticAccessors.helpers.get = function () {
    return Template7Helpers;
  };

  Object.defineProperties( Template7Class, staticAccessors );

  function Template7() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var template = args[0];
    var data = args[1];
    if (args.length === 2) {
      var instance = new Template7Class(template);
      var rendered = instance.compile()(data);
      instance = null;
      return (rendered);
    }
    return new Template7Class(template);
  }
  Template7.registerHelper = function registerHelper(name, fn) {
    Template7Class.helpers[name] = fn;
  };
  Template7.unregisterHelper = function unregisterHelper(name) {
    Template7Class.helpers[name] = undefined;
    delete Template7Class.helpers[name];
  };
  Template7.registerPartial = function registerPartial(name, template) {
    Template7Class.partials[name] = { template: template };
  };
  Template7.unregisterPartial = function unregisterPartial(name) {
    if (Template7Class.partials[name]) {
      Template7Class.partials[name] = undefined;
      delete Template7Class.partials[name];
    }
  };
  Template7.compile = function compile(template, options) {
    var instance = new Template7Class(template, options);
    return instance.compile();
  };

  Template7.options = Template7Class.options;
  Template7.helpers = Template7Class.helpers;
  Template7.partials = Template7Class.partials;

  /**
   * SSR Window 1.0.1
   * Better handling for window object in SSR environment
   * https://github.com/nolimits4web/ssr-window
   *
   * Copyright 2018, Vladimir Kharlampidi
   *
   * Licensed under MIT
   *
   * Released on: July 18, 2018
   */
  var doc = (typeof document === 'undefined') ? {
    body: {},
    addEventListener: function addEventListener() {},
    removeEventListener: function removeEventListener() {},
    activeElement: {
      blur: function blur() {},
      nodeName: '',
    },
    querySelector: function querySelector() {
      return null;
    },
    querySelectorAll: function querySelectorAll() {
      return [];
    },
    getElementById: function getElementById() {
      return null;
    },
    createEvent: function createEvent() {
      return {
        initEvent: function initEvent() {},
      };
    },
    createElement: function createElement() {
      return {
        children: [],
        childNodes: [],
        style: {},
        setAttribute: function setAttribute() {},
        getElementsByTagName: function getElementsByTagName() {
          return [];
        },
      };
    },
    location: { hash: '' },
  } : document; // eslint-disable-line

  var win = (typeof window === 'undefined') ? {
    document: doc,
    navigator: {
      userAgent: '',
    },
    location: {},
    history: {},
    CustomEvent: function CustomEvent() {
      return this;
    },
    addEventListener: function addEventListener() {},
    removeEventListener: function removeEventListener() {},
    getComputedStyle: function getComputedStyle() {
      return {
        getPropertyValue: function getPropertyValue() {
          return '';
        },
      };
    },
    Image: function Image() {},
    Date: function Date() {},
    screen: {},
    setTimeout: function setTimeout() {},
    clearTimeout: function clearTimeout() {},
  } : window; // eslint-disable-line

  /**
   * Dom7 2.1.1
   * Minimalistic JavaScript library for DOM manipulation, with a jQuery-compatible API
   * http://framework7.io/docs/dom.html
   *
   * Copyright 2018, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   *
   * Licensed under MIT
   *
   * Released on: September 6, 2018
   */

  var Dom7 = function Dom7(arr) {
    var self = this;
    // Create array-like object
    for (var i = 0; i < arr.length; i += 1) {
      self[i] = arr[i];
    }
    self.length = arr.length;
    // Return collection with methods
    return this;
  };

  function $(selector, context) {
    var arr = [];
    var i = 0;
    if (selector && !context) {
      if (selector instanceof Dom7) {
        return selector;
      }
    }
    if (selector) {
        // String
      if (typeof selector === 'string') {
        var els;
        var tempParent;
        var html = selector.trim();
        if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
          var toCreate = 'div';
          if (html.indexOf('<li') === 0) { toCreate = 'ul'; }
          if (html.indexOf('<tr') === 0) { toCreate = 'tbody'; }
          if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) { toCreate = 'tr'; }
          if (html.indexOf('<tbody') === 0) { toCreate = 'table'; }
          if (html.indexOf('<option') === 0) { toCreate = 'select'; }
          tempParent = doc.createElement(toCreate);
          tempParent.innerHTML = html;
          for (i = 0; i < tempParent.childNodes.length; i += 1) {
            arr.push(tempParent.childNodes[i]);
          }
        } else {
          if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
            // Pure ID selector
            els = [doc.getElementById(selector.trim().split('#')[1])];
          } else {
            // Other selectors
            els = (context || doc).querySelectorAll(selector.trim());
          }
          for (i = 0; i < els.length; i += 1) {
            if (els[i]) { arr.push(els[i]); }
          }
        }
      } else if (selector.nodeType || selector === win || selector === doc) {
        // Node/element
        arr.push(selector);
      } else if (selector.length > 0 && selector[0].nodeType) {
        // Array of elements or instance of Dom
        for (i = 0; i < selector.length; i += 1) {
          arr.push(selector[i]);
        }
      }
    }
    return new Dom7(arr);
  }

  $.fn = Dom7.prototype;
  $.Class = Dom7;
  $.Dom7 = Dom7;

  function unique(arr) {
    var uniqueArray = [];
    for (var i = 0; i < arr.length; i += 1) {
      if (uniqueArray.indexOf(arr[i]) === -1) { uniqueArray.push(arr[i]); }
    }
    return uniqueArray;
  }
  function toCamelCase(string) {
    return string.toLowerCase().replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
  }

  function requestAnimationFrame(callback) {
    if (win.requestAnimationFrame) { return win.requestAnimationFrame(callback); }
    else if (win.webkitRequestAnimationFrame) { return win.webkitRequestAnimationFrame(callback); }
    return win.setTimeout(callback, 1000 / 60);
  }
  function cancelAnimationFrame(id) {
    if (win.cancelAnimationFrame) { return win.cancelAnimationFrame(id); }
    else if (win.webkitCancelAnimationFrame) { return win.webkitCancelAnimationFrame(id); }
    return win.clearTimeout(id);
  }

  // Classes and attributes
  function addClass(className) {
    var this$1 = this;

    if (typeof className === 'undefined') {
      return this;
    }
    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.add(classes[i]); }
      }
    }
    return this;
  }
  function removeClass(className) {
    var this$1 = this;

    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.remove(classes[i]); }
      }
    }
    return this;
  }
  function hasClass(className) {
    if (!this[0]) { return false; }
    return this[0].classList.contains(className);
  }
  function toggleClass(className) {
    var this$1 = this;

    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.toggle(classes[i]); }
      }
    }
    return this;
  }
  function attr(attrs, value) {
    var arguments$1 = arguments;
    var this$1 = this;

    if (arguments.length === 1 && typeof attrs === 'string') {
      // Get attr
      if (this[0]) { return this[0].getAttribute(attrs); }
      return undefined;
    }

    // Set attrs
    for (var i = 0; i < this.length; i += 1) {
      if (arguments$1.length === 2) {
        // String
        this$1[i].setAttribute(attrs, value);
      } else {
        // Object
        // eslint-disable-next-line
        for (var attrName in attrs) {
          this$1[i][attrName] = attrs[attrName];
          this$1[i].setAttribute(attrName, attrs[attrName]);
        }
      }
    }
    return this;
  }
  // eslint-disable-next-line
  function removeAttr(attr) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].removeAttribute(attr);
    }
    return this;
  }
  // eslint-disable-next-line
  function prop(props, value) {
    var arguments$1 = arguments;
    var this$1 = this;

    if (arguments.length === 1 && typeof props === 'string') {
      // Get prop
      if (this[0]) { return this[0][props]; }
    } else {
      // Set props
      for (var i = 0; i < this.length; i += 1) {
        if (arguments$1.length === 2) {
          // String
          this$1[i][props] = value;
        } else {
          // Object
          // eslint-disable-next-line
          for (var propName in props) {
            this$1[i][propName] = props[propName];
          }
        }
      }
      return this;
    }
  }
  function data(key, value) {
    var this$1 = this;

    var el;
    if (typeof value === 'undefined') {
      el = this[0];
      // Get value
      if (el) {
        if (el.dom7ElementDataStorage && (key in el.dom7ElementDataStorage)) {
          return el.dom7ElementDataStorage[key];
        }

        var dataKey = el.getAttribute(("data-" + key));
        if (dataKey) {
          return dataKey;
        }
        return undefined;
      }
      return undefined;
    }

    // Set value
    for (var i = 0; i < this.length; i += 1) {
      el = this$1[i];
      if (!el.dom7ElementDataStorage) { el.dom7ElementDataStorage = {}; }
      el.dom7ElementDataStorage[key] = value;
    }
    return this;
  }
  function removeData(key) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.dom7ElementDataStorage && el.dom7ElementDataStorage[key]) {
        el.dom7ElementDataStorage[key] = null;
        delete el.dom7ElementDataStorage[key];
      }
    }
  }
  function dataset() {
    var el = this[0];
    if (!el) { return undefined; }
    var dataset = {}; // eslint-disable-line
    if (el.dataset) {
      // eslint-disable-next-line
      for (var dataKey in el.dataset) {
        dataset[dataKey] = el.dataset[dataKey];
      }
    } else {
      for (var i = 0; i < el.attributes.length; i += 1) {
        // eslint-disable-next-line
        var attr = el.attributes[i];
        if (attr.name.indexOf('data-') >= 0) {
          dataset[toCamelCase(attr.name.split('data-')[1])] = attr.value;
        }
      }
    }
    // eslint-disable-next-line
    for (var key in dataset) {
      if (dataset[key] === 'false') { dataset[key] = false; }
      else if (dataset[key] === 'true') { dataset[key] = true; }
      else if (parseFloat(dataset[key]) === dataset[key] * 1) { dataset[key] *= 1; }
    }
    return dataset;
  }
  function val(value) {
    var dom = this;
    if (typeof value === 'undefined') {
      if (dom[0]) {
        if (dom[0].multiple && dom[0].nodeName.toLowerCase() === 'select') {
          var values = [];
          for (var i = 0; i < dom[0].selectedOptions.length; i += 1) {
            values.push(dom[0].selectedOptions[i].value);
          }
          return values;
        }
        return dom[0].value;
      }
      return undefined;
    }

    for (var i$1 = 0; i$1 < dom.length; i$1 += 1) {
      var el = dom[i$1];
      if (Array.isArray(value) && el.multiple && el.nodeName.toLowerCase() === 'select') {
        for (var j = 0; j < el.options.length; j += 1) {
          el.options[j].selected = value.indexOf(el.options[j].value) >= 0;
        }
      } else {
        el.value = value;
      }
    }
    return dom;
  }
  // Transforms
  // eslint-disable-next-line
  function transform(transform) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var elStyle = this$1[i].style;
      elStyle.webkitTransform = transform;
      elStyle.transform = transform;
    }
    return this;
  }
  function transition(duration) {
    var this$1 = this;

    if (typeof duration !== 'string') {
      duration = duration + "ms"; // eslint-disable-line
    }
    for (var i = 0; i < this.length; i += 1) {
      var elStyle = this$1[i].style;
      elStyle.webkitTransitionDuration = duration;
      elStyle.transitionDuration = duration;
    }
    return this;
  }
  // Events
  function on() {
    var this$1 = this;
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    function handleLiveEvent(e) {
      var target = e.target;
      if (!target) { return; }
      var eventData = e.target.dom7EventData || [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      if ($(target).is(targetSelector)) { listener.apply(target, eventData); }
      else {
        var parents = $(target).parents(); // eslint-disable-line
        for (var k = 0; k < parents.length; k += 1) {
          if ($(parents[k]).is(targetSelector)) { listener.apply(parents[k], eventData); }
        }
      }
    }
    function handleEvent(e) {
      var eventData = e && e.target ? e.target.dom7EventData || [] : [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      listener.apply(this, eventData);
    }
    var events = eventType.split(' ');
    var j;
    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (!targetSelector) {
        for (j = 0; j < events.length; j += 1) {
          var event = events[j];
          if (!el.dom7Listeners) { el.dom7Listeners = {}; }
          if (!el.dom7Listeners[event]) { el.dom7Listeners[event] = []; }
          el.dom7Listeners[event].push({
            listener: listener,
            proxyListener: handleEvent,
          });
          el.addEventListener(event, handleEvent, capture);
        }
      } else {
        // Live events
        for (j = 0; j < events.length; j += 1) {
          var event$1 = events[j];
          if (!el.dom7LiveListeners) { el.dom7LiveListeners = {}; }
          if (!el.dom7LiveListeners[event$1]) { el.dom7LiveListeners[event$1] = []; }
          el.dom7LiveListeners[event$1].push({
            listener: listener,
            proxyListener: handleLiveEvent,
          });
          el.addEventListener(event$1, handleLiveEvent, capture);
        }
      }
    }
    return this;
  }
  function off() {
    var this$1 = this;
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    var events = eventType.split(' ');
    for (var i = 0; i < events.length; i += 1) {
      var event = events[i];
      for (var j = 0; j < this.length; j += 1) {
        var el = this$1[j];
        var handlers = (void 0);
        if (!targetSelector && el.dom7Listeners) {
          handlers = el.dom7Listeners[event];
        } else if (targetSelector && el.dom7LiveListeners) {
          handlers = el.dom7LiveListeners[event];
        }
        if (handlers && handlers.length) {
          for (var k = handlers.length - 1; k >= 0; k -= 1) {
            var handler = handlers[k];
            if (listener && handler.listener === listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            } else if (!listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            }
          }
        }
      }
    }
    return this;
  }
  function once() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var dom = this;
    var eventName = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventName = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    function proxy() {
      var eventArgs = [], len = arguments.length;
      while ( len-- ) eventArgs[ len ] = arguments[ len ];

      listener.apply(this, eventArgs);
      dom.off(eventName, targetSelector, proxy, capture);
    }
    return dom.on(eventName, targetSelector, proxy, capture);
  }
  function trigger() {
    var this$1 = this;
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var events = args[0].split(' ');
    var eventData = args[1];
    for (var i = 0; i < events.length; i += 1) {
      var event = events[i];
      for (var j = 0; j < this.length; j += 1) {
        var el = this$1[j];
        var evt = (void 0);
        try {
          evt = new win.CustomEvent(event, {
            detail: eventData,
            bubbles: true,
            cancelable: true,
          });
        } catch (e) {
          evt = doc.createEvent('Event');
          evt.initEvent(event, true, true);
          evt.detail = eventData;
        }
        // eslint-disable-next-line
        el.dom7EventData = args.filter(function (data, dataIndex) { return dataIndex > 0; });
        el.dispatchEvent(evt);
        el.dom7EventData = [];
        delete el.dom7EventData;
      }
    }
    return this;
  }
  function transitionEnd(callback) {
    var events = ['webkitTransitionEnd', 'transitionend'];
    var dom = this;
    var i;
    function fireCallBack(e) {
      /* jshint validthis:true */
      if (e.target !== this) { return; }
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  function animationEnd(callback) {
    var events = ['webkitAnimationEnd', 'animationend'];
    var dom = this;
    var i;
    function fireCallBack(e) {
      if (e.target !== this) { return; }
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  // Sizing/Styles
  function width() {
    if (this[0] === win) {
      return win.innerWidth;
    }

    if (this.length > 0) {
      return parseFloat(this.css('width'));
    }

    return null;
  }
  function outerWidth(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        var styles = this.styles();
        return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
      }
      return this[0].offsetWidth;
    }
    return null;
  }
  function height() {
    if (this[0] === win) {
      return win.innerHeight;
    }

    if (this.length > 0) {
      return parseFloat(this.css('height'));
    }

    return null;
  }
  function outerHeight(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        var styles = this.styles();
        return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
      }
      return this[0].offsetHeight;
    }
    return null;
  }
  function offset() {
    if (this.length > 0) {
      var el = this[0];
      var box = el.getBoundingClientRect();
      var body = doc.body;
      var clientTop = el.clientTop || body.clientTop || 0;
      var clientLeft = el.clientLeft || body.clientLeft || 0;
      var scrollTop = el === win ? win.scrollY : el.scrollTop;
      var scrollLeft = el === win ? win.scrollX : el.scrollLeft;
      return {
        top: (box.top + scrollTop) - clientTop,
        left: (box.left + scrollLeft) - clientLeft,
      };
    }

    return null;
  }
  function hide() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].style.display = 'none';
    }
    return this;
  }
  function show() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.style.display === 'none') {
        el.style.display = '';
      }
      if (win.getComputedStyle(el, null).getPropertyValue('display') === 'none') {
        // Still not visible
        el.style.display = 'block';
      }
    }
    return this;
  }
  function styles() {
    if (this[0]) { return win.getComputedStyle(this[0], null); }
    return {};
  }
  function css(props, value) {
    var this$1 = this;

    var i;
    if (arguments.length === 1) {
      if (typeof props === 'string') {
        if (this[0]) { return win.getComputedStyle(this[0], null).getPropertyValue(props); }
      } else {
        for (i = 0; i < this.length; i += 1) {
          // eslint-disable-next-line
          for (var prop in props) {
            this$1[i].style[prop] = props[prop];
          }
        }
        return this;
      }
    }
    if (arguments.length === 2 && typeof props === 'string') {
      for (i = 0; i < this.length; i += 1) {
        this$1[i].style[props] = value;
      }
      return this;
    }
    return this;
  }

  // Dom manipulation
  function toArray() {
    var this$1 = this;

    var arr = [];
    for (var i = 0; i < this.length; i += 1) {
      arr.push(this$1[i]);
    }
    return arr;
  }
  // Iterate over the collection passing elements to `callback`
  function each(callback) {
    var this$1 = this;

    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this$1[i], i, this$1[i]) === false) {
        // End the loop early
        return this$1;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function forEach(callback) {
    var this$1 = this;

    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this$1[i], this$1[i], i) === false) {
        // End the loop early
        return this$1;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function filter(callback) {
    var matchedItems = [];
    var dom = this;
    for (var i = 0; i < dom.length; i += 1) {
      if (callback.call(dom[i], i, dom[i])) { matchedItems.push(dom[i]); }
    }
    return new Dom7(matchedItems);
  }
  function map(callback) {
    var modifiedItems = [];
    var dom = this;
    for (var i = 0; i < dom.length; i += 1) {
      modifiedItems.push(callback.call(dom[i], i, dom[i]));
    }
    return new Dom7(modifiedItems);
  }
  // eslint-disable-next-line
  function html(html) {
    var this$1 = this;

    if (typeof html === 'undefined') {
      return this[0] ? this[0].innerHTML : undefined;
    }

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].innerHTML = html;
    }
    return this;
  }
  // eslint-disable-next-line
  function text(text) {
    var this$1 = this;

    if (typeof text === 'undefined') {
      if (this[0]) {
        return this[0].textContent.trim();
      }
      return null;
    }

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].textContent = text;
    }
    return this;
  }
  function is(selector) {
    var el = this[0];
    var compareWith;
    var i;
    if (!el || typeof selector === 'undefined') { return false; }
    if (typeof selector === 'string') {
      if (el.matches) { return el.matches(selector); }
      else if (el.webkitMatchesSelector) { return el.webkitMatchesSelector(selector); }
      else if (el.msMatchesSelector) { return el.msMatchesSelector(selector); }

      compareWith = $(selector);
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) { return true; }
      }
      return false;
    } else if (selector === doc) { return el === doc; }
    else if (selector === win) { return el === win; }

    if (selector.nodeType || selector instanceof Dom7) {
      compareWith = selector.nodeType ? [selector] : selector;
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) { return true; }
      }
      return false;
    }
    return false;
  }
  function indexOf(el) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i] === el) { return i; }
    }
    return -1;
  }
  function index() {
    var child = this[0];
    var i;
    if (child) {
      i = 0;
      // eslint-disable-next-line
      while ((child = child.previousSibling) !== null) {
        if (child.nodeType === 1) { i += 1; }
      }
      return i;
    }
    return undefined;
  }
  // eslint-disable-next-line
  function eq(index) {
    if (typeof index === 'undefined') { return this; }
    var length = this.length;
    var returnIndex;
    if (index > length - 1) {
      return new Dom7([]);
    }
    if (index < 0) {
      returnIndex = length + index;
      if (returnIndex < 0) { return new Dom7([]); }
      return new Dom7([this[returnIndex]]);
    }
    return new Dom7([this[index]]);
  }
  function append() {
    var this$1 = this;
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var newChild;

    for (var k = 0; k < args.length; k += 1) {
      newChild = args[k];
      for (var i = 0; i < this.length; i += 1) {
        if (typeof newChild === 'string') {
          var tempDiv = doc.createElement('div');
          tempDiv.innerHTML = newChild;
          while (tempDiv.firstChild) {
            this$1[i].appendChild(tempDiv.firstChild);
          }
        } else if (newChild instanceof Dom7) {
          for (var j = 0; j < newChild.length; j += 1) {
            this$1[i].appendChild(newChild[j]);
          }
        } else {
          this$1[i].appendChild(newChild);
        }
      }
    }

    return this;
  }
   // eslint-disable-next-line
  function appendTo(parent) {
    $(parent).append(this);
    return this;
  }
  function prepend(newChild) {
    var this$1 = this;

    var i;
    var j;
    for (i = 0; i < this.length; i += 1) {
      if (typeof newChild === 'string') {
        var tempDiv = doc.createElement('div');
        tempDiv.innerHTML = newChild;
        for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
          this$1[i].insertBefore(tempDiv.childNodes[j], this$1[i].childNodes[0]);
        }
      } else if (newChild instanceof Dom7) {
        for (j = 0; j < newChild.length; j += 1) {
          this$1[i].insertBefore(newChild[j], this$1[i].childNodes[0]);
        }
      } else {
        this$1[i].insertBefore(newChild, this$1[i].childNodes[0]);
      }
    }
    return this;
  }
   // eslint-disable-next-line
  function prependTo(parent) {
    $(parent).prepend(this);
    return this;
  }
  function insertBefore(selector) {
    var this$1 = this;

    var before = $(selector);
    for (var i = 0; i < this.length; i += 1) {
      if (before.length === 1) {
        before[0].parentNode.insertBefore(this$1[i], before[0]);
      } else if (before.length > 1) {
        for (var j = 0; j < before.length; j += 1) {
          before[j].parentNode.insertBefore(this$1[i].cloneNode(true), before[j]);
        }
      }
    }
  }
  function insertAfter(selector) {
    var this$1 = this;

    var after = $(selector);
    for (var i = 0; i < this.length; i += 1) {
      if (after.length === 1) {
        after[0].parentNode.insertBefore(this$1[i], after[0].nextSibling);
      } else if (after.length > 1) {
        for (var j = 0; j < after.length; j += 1) {
          after[j].parentNode.insertBefore(this$1[i].cloneNode(true), after[j].nextSibling);
        }
      }
    }
  }
  function next(selector) {
    if (this.length > 0) {
      if (selector) {
        if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
          return new Dom7([this[0].nextElementSibling]);
        }
        return new Dom7([]);
      }

      if (this[0].nextElementSibling) { return new Dom7([this[0].nextElementSibling]); }
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function nextAll(selector) {
    var nextEls = [];
    var el = this[0];
    if (!el) { return new Dom7([]); }
    while (el.nextElementSibling) {
      var next = el.nextElementSibling; // eslint-disable-line
      if (selector) {
        if ($(next).is(selector)) { nextEls.push(next); }
      } else { nextEls.push(next); }
      el = next;
    }
    return new Dom7(nextEls);
  }
  function prev(selector) {
    if (this.length > 0) {
      var el = this[0];
      if (selector) {
        if (el.previousElementSibling && $(el.previousElementSibling).is(selector)) {
          return new Dom7([el.previousElementSibling]);
        }
        return new Dom7([]);
      }

      if (el.previousElementSibling) { return new Dom7([el.previousElementSibling]); }
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function prevAll(selector) {
    var prevEls = [];
    var el = this[0];
    if (!el) { return new Dom7([]); }
    while (el.previousElementSibling) {
      var prev = el.previousElementSibling; // eslint-disable-line
      if (selector) {
        if ($(prev).is(selector)) { prevEls.push(prev); }
      } else { prevEls.push(prev); }
      el = prev;
    }
    return new Dom7(prevEls);
  }
  function siblings(selector) {
    return this.nextAll(selector).add(this.prevAll(selector));
  }
  function parent(selector) {
    var this$1 = this;

    var parents = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i].parentNode !== null) {
        if (selector) {
          if ($(this$1[i].parentNode).is(selector)) { parents.push(this$1[i].parentNode); }
        } else {
          parents.push(this$1[i].parentNode);
        }
      }
    }
    return $(unique(parents));
  }
  function parents(selector) {
    var this$1 = this;

    var parents = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      var parent = this$1[i].parentNode; // eslint-disable-line
      while (parent) {
        if (selector) {
          if ($(parent).is(selector)) { parents.push(parent); }
        } else {
          parents.push(parent);
        }
        parent = parent.parentNode;
      }
    }
    return $(unique(parents));
  }
  function closest(selector) {
    var closest = this; // eslint-disable-line
    if (typeof selector === 'undefined') {
      return new Dom7([]);
    }
    if (!closest.is(selector)) {
      closest = closest.parents(selector).eq(0);
    }
    return closest;
  }
  function find(selector) {
    var this$1 = this;

    var foundElements = [];
    for (var i = 0; i < this.length; i += 1) {
      var found = this$1[i].querySelectorAll(selector);
      for (var j = 0; j < found.length; j += 1) {
        foundElements.push(found[j]);
      }
    }
    return new Dom7(foundElements);
  }
  function children(selector) {
    var this$1 = this;

    var children = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      var childNodes = this$1[i].childNodes;

      for (var j = 0; j < childNodes.length; j += 1) {
        if (!selector) {
          if (childNodes[j].nodeType === 1) { children.push(childNodes[j]); }
        } else if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) {
          children.push(childNodes[j]);
        }
      }
    }
    return new Dom7(unique(children));
  }
  function remove() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i].parentNode) { this$1[i].parentNode.removeChild(this$1[i]); }
    }
    return this;
  }
  function detach() {
    return this.remove();
  }
  function add() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var dom = this;
    var i;
    var j;
    for (i = 0; i < args.length; i += 1) {
      var toAdd = $(args[i]);
      for (j = 0; j < toAdd.length; j += 1) {
        dom[dom.length] = toAdd[j];
        dom.length += 1;
      }
    }
    return dom;
  }
  function empty() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.nodeType === 1) {
        for (var j = 0; j < el.childNodes.length; j += 1) {
          if (el.childNodes[j].parentNode) {
            el.childNodes[j].parentNode.removeChild(el.childNodes[j]);
          }
        }
        el.textContent = '';
      }
    }
    return this;
  }

  var Methods = /*#__PURE__*/Object.freeze({
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    toggleClass: toggleClass,
    attr: attr,
    removeAttr: removeAttr,
    prop: prop,
    data: data,
    removeData: removeData,
    dataset: dataset,
    val: val,
    transform: transform,
    transition: transition,
    on: on,
    off: off,
    once: once,
    trigger: trigger,
    transitionEnd: transitionEnd,
    animationEnd: animationEnd,
    width: width,
    outerWidth: outerWidth,
    height: height,
    outerHeight: outerHeight,
    offset: offset,
    hide: hide,
    show: show,
    styles: styles,
    css: css,
    toArray: toArray,
    each: each,
    forEach: forEach,
    filter: filter,
    map: map,
    html: html,
    text: text,
    is: is,
    indexOf: indexOf,
    index: index,
    eq: eq,
    append: append,
    appendTo: appendTo,
    prepend: prepend,
    prependTo: prependTo,
    insertBefore: insertBefore,
    insertAfter: insertAfter,
    next: next,
    nextAll: nextAll,
    prev: prev,
    prevAll: prevAll,
    siblings: siblings,
    parent: parent,
    parents: parents,
    closest: closest,
    find: find,
    children: children,
    remove: remove,
    detach: detach,
    add: add,
    empty: empty
  });

  function scrollTo() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var left = args[0];
    var top = args[1];
    var duration = args[2];
    var easing = args[3];
    var callback = args[4];
    if (args.length === 4 && typeof easing === 'function') {
      callback = easing;
      (assign = args, left = assign[0], top = assign[1], duration = assign[2], callback = assign[3], easing = assign[4]);
    }
    if (typeof easing === 'undefined') { easing = 'swing'; }

    return this.each(function animate() {
      var el = this;
      var currentTop;
      var currentLeft;
      var maxTop;
      var maxLeft;
      var newTop;
      var newLeft;
      var scrollTop; // eslint-disable-line
      var scrollLeft; // eslint-disable-line
      var animateTop = top > 0 || top === 0;
      var animateLeft = left > 0 || left === 0;
      if (typeof easing === 'undefined') {
        easing = 'swing';
      }
      if (animateTop) {
        currentTop = el.scrollTop;
        if (!duration) {
          el.scrollTop = top;
        }
      }
      if (animateLeft) {
        currentLeft = el.scrollLeft;
        if (!duration) {
          el.scrollLeft = left;
        }
      }
      if (!duration) { return; }
      if (animateTop) {
        maxTop = el.scrollHeight - el.offsetHeight;
        newTop = Math.max(Math.min(top, maxTop), 0);
      }
      if (animateLeft) {
        maxLeft = el.scrollWidth - el.offsetWidth;
        newLeft = Math.max(Math.min(left, maxLeft), 0);
      }
      var startTime = null;
      if (animateTop && newTop === currentTop) { animateTop = false; }
      if (animateLeft && newLeft === currentLeft) { animateLeft = false; }
      function render(time) {
        if ( time === void 0 ) time = new Date().getTime();

        if (startTime === null) {
          startTime = time;
        }
        var progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        var easeProgress = easing === 'linear' ? progress : (0.5 - (Math.cos(progress * Math.PI) / 2));
        var done;
        if (animateTop) { scrollTop = currentTop + (easeProgress * (newTop - currentTop)); }
        if (animateLeft) { scrollLeft = currentLeft + (easeProgress * (newLeft - currentLeft)); }
        if (animateTop && newTop > currentTop && scrollTop >= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateTop && newTop < currentTop && scrollTop <= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateLeft && newLeft > currentLeft && scrollLeft >= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }
        if (animateLeft && newLeft < currentLeft && scrollLeft <= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }

        if (done) {
          if (callback) { callback(); }
          return;
        }
        if (animateTop) { el.scrollTop = scrollTop; }
        if (animateLeft) { el.scrollLeft = scrollLeft; }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    });
  }
  // scrollTop(top, duration, easing, callback) {
  function scrollTop() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var top = args[0];
    var duration = args[1];
    var easing = args[2];
    var callback = args[3];
    if (args.length === 3 && typeof easing === 'function') {
      (assign = args, top = assign[0], duration = assign[1], callback = assign[2], easing = assign[3]);
    }
    var dom = this;
    if (typeof top === 'undefined') {
      if (dom.length > 0) { return dom[0].scrollTop; }
      return null;
    }
    return dom.scrollTo(undefined, top, duration, easing, callback);
  }
  function scrollLeft() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var left = args[0];
    var duration = args[1];
    var easing = args[2];
    var callback = args[3];
    if (args.length === 3 && typeof easing === 'function') {
      (assign = args, left = assign[0], duration = assign[1], callback = assign[2], easing = assign[3]);
    }
    var dom = this;
    if (typeof left === 'undefined') {
      if (dom.length > 0) { return dom[0].scrollLeft; }
      return null;
    }
    return dom.scrollTo(left, undefined, duration, easing, callback);
  }

  var Scroll = /*#__PURE__*/Object.freeze({
    scrollTo: scrollTo,
    scrollTop: scrollTop,
    scrollLeft: scrollLeft
  });

  function animate(initialProps, initialParams) {
    var els = this;
    var a = {
      props: Object.assign({}, initialProps),
      params: Object.assign({
        duration: 300,
        easing: 'swing', // or 'linear'
        /* Callbacks
        begin(elements)
        complete(elements)
        progress(elements, complete, remaining, start, tweenValue)
        */
      }, initialParams),

      elements: els,
      animating: false,
      que: [],

      easingProgress: function easingProgress(easing, progress) {
        if (easing === 'swing') {
          return 0.5 - (Math.cos(progress * Math.PI) / 2);
        }
        if (typeof easing === 'function') {
          return easing(progress);
        }
        return progress;
      },
      stop: function stop() {
        if (a.frameId) {
          cancelAnimationFrame(a.frameId);
        }
        a.animating = false;
        a.elements.each(function (index, el) {
          var element = el;
          delete element.dom7AnimateInstance;
        });
        a.que = [];
      },
      done: function done(complete) {
        a.animating = false;
        a.elements.each(function (index, el) {
          var element = el;
          delete element.dom7AnimateInstance;
        });
        if (complete) { complete(els); }
        if (a.que.length > 0) {
          var que = a.que.shift();
          a.animate(que[0], que[1]);
        }
      },
      animate: function animate(props, params) {
        if (a.animating) {
          a.que.push([props, params]);
          return a;
        }
        var elements = [];

        // Define & Cache Initials & Units
        a.elements.each(function (index, el) {
          var initialFullValue;
          var initialValue;
          var unit;
          var finalValue;
          var finalFullValue;

          if (!el.dom7AnimateInstance) { a.elements[index].dom7AnimateInstance = a; }

          elements[index] = {
            container: el,
          };
          Object.keys(props).forEach(function (prop) {
            initialFullValue = win.getComputedStyle(el, null).getPropertyValue(prop).replace(',', '.');
            initialValue = parseFloat(initialFullValue);
            unit = initialFullValue.replace(initialValue, '');
            finalValue = parseFloat(props[prop]);
            finalFullValue = props[prop] + unit;
            elements[index][prop] = {
              initialFullValue: initialFullValue,
              initialValue: initialValue,
              unit: unit,
              finalValue: finalValue,
              finalFullValue: finalFullValue,
              currentValue: initialValue,
            };
          });
        });

        var startTime = null;
        var time;
        var elementsDone = 0;
        var propsDone = 0;
        var done;
        var began = false;

        a.animating = true;

        function render() {
          time = new Date().getTime();
          var progress;
          var easeProgress;
          // let el;
          if (!began) {
            began = true;
            if (params.begin) { params.begin(els); }
          }
          if (startTime === null) {
            startTime = time;
          }
          if (params.progress) {
            // eslint-disable-next-line
            params.progress(els, Math.max(Math.min((time - startTime) / params.duration, 1), 0), ((startTime + params.duration) - time < 0 ? 0 : (startTime + params.duration) - time), startTime);
          }

          elements.forEach(function (element) {
            var el = element;
            if (done || el.done) { return; }
            Object.keys(props).forEach(function (prop) {
              if (done || el.done) { return; }
              progress = Math.max(Math.min((time - startTime) / params.duration, 1), 0);
              easeProgress = a.easingProgress(params.easing, progress);
              var ref = el[prop];
              var initialValue = ref.initialValue;
              var finalValue = ref.finalValue;
              var unit = ref.unit;
              el[prop].currentValue = initialValue + (easeProgress * (finalValue - initialValue));
              var currentValue = el[prop].currentValue;

              if (
                (finalValue > initialValue && currentValue >= finalValue) ||
                (finalValue < initialValue && currentValue <= finalValue)) {
                el.container.style[prop] = finalValue + unit;
                propsDone += 1;
                if (propsDone === Object.keys(props).length) {
                  el.done = true;
                  elementsDone += 1;
                }
                if (elementsDone === elements.length) {
                  done = true;
                }
              }
              if (done) {
                a.done(params.complete);
                return;
              }
              el.container.style[prop] = currentValue + unit;
            });
          });
          if (done) { return; }
          // Then call
          a.frameId = requestAnimationFrame(render);
        }
        a.frameId = requestAnimationFrame(render);
        return a;
      },
    };

    if (a.elements.length === 0) {
      return els;
    }

    var animateInstance;
    for (var i = 0; i < a.elements.length; i += 1) {
      if (a.elements[i].dom7AnimateInstance) {
        animateInstance = a.elements[i].dom7AnimateInstance;
      } else { a.elements[i].dom7AnimateInstance = a; }
    }
    if (!animateInstance) {
      animateInstance = a;
    }

    if (initialProps === 'stop') {
      animateInstance.stop();
    } else {
      animateInstance.animate(a.props, a.params);
    }

    return els;
  }

  function stop() {
    var els = this;
    for (var i = 0; i < els.length; i += 1) {
      if (els[i].dom7AnimateInstance) {
        els[i].dom7AnimateInstance.stop();
      }
    }
  }

  var Animate = /*#__PURE__*/Object.freeze({
    animate: animate,
    stop: stop
  });

  var noTrigger = ('resize scroll').split(' ');
  function eventShortcut(name) {
    var this$1 = this;
    var ref;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    if (typeof args[0] === 'undefined') {
      for (var i = 0; i < this.length; i += 1) {
        if (noTrigger.indexOf(name) < 0) {
          if (name in this$1[i]) { this$1[i][name](); }
          else {
            $(this$1[i]).trigger(name);
          }
        }
      }
      return this;
    }
    return (ref = this).on.apply(ref, [ name ].concat( args ));
  }

  function click() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'click' ].concat( args ));
  }
  function blur() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'blur' ].concat( args ));
  }
  function focus() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focus' ].concat( args ));
  }
  function focusin() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focusin' ].concat( args ));
  }
  function focusout() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focusout' ].concat( args ));
  }
  function keyup() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keyup' ].concat( args ));
  }
  function keydown() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keydown' ].concat( args ));
  }
  function keypress() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keypress' ].concat( args ));
  }
  function submit() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'submit' ].concat( args ));
  }
  function change() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'change' ].concat( args ));
  }
  function mousedown() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mousedown' ].concat( args ));
  }
  function mousemove() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mousemove' ].concat( args ));
  }
  function mouseup() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseup' ].concat( args ));
  }
  function mouseenter() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseenter' ].concat( args ));
  }
  function mouseleave() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseleave' ].concat( args ));
  }
  function mouseout() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseout' ].concat( args ));
  }
  function mouseover() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseover' ].concat( args ));
  }
  function touchstart() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchstart' ].concat( args ));
  }
  function touchend() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchend' ].concat( args ));
  }
  function touchmove() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchmove' ].concat( args ));
  }
  function resize() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'resize' ].concat( args ));
  }
  function scroll() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'scroll' ].concat( args ));
  }

  var eventShortcuts = /*#__PURE__*/Object.freeze({
    click: click,
    blur: blur,
    focus: focus,
    focusin: focusin,
    focusout: focusout,
    keyup: keyup,
    keydown: keydown,
    keypress: keypress,
    submit: submit,
    change: change,
    mousedown: mousedown,
    mousemove: mousemove,
    mouseup: mouseup,
    mouseenter: mouseenter,
    mouseleave: mouseleave,
    mouseout: mouseout,
    mouseover: mouseover,
    touchstart: touchstart,
    touchend: touchend,
    touchmove: touchmove,
    resize: resize,
    scroll: scroll
  });

  [Methods, Scroll, Animate, eventShortcuts].forEach(function (group) {
    Object.keys(group).forEach(function (methodName) {
      $.fn[methodName] = group[methodName];
    });
  });

  /**
   * https://github.com/gre/bezier-easing
   * BezierEasing - use bezier curve for transition easing function
   * by Gaëtan Renaudeau 2014 - 2015 – MIT License
   */

  /* eslint-disable */

  // These values are established by empiricism with tests (tradeoff: performance VS precision)
  var NEWTON_ITERATIONS = 4;
  var NEWTON_MIN_SLOPE = 0.001;
  var SUBDIVISION_PRECISION = 0.0000001;
  var SUBDIVISION_MAX_ITERATIONS = 10;

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  var float32ArraySupported = typeof Float32Array === 'function';

  function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C (aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

  function binarySubdivide (aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  }

  function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
   for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
     var currentSlope = getSlope(aGuessT, mX1, mX2);
     if (currentSlope === 0.0) {
       return aGuessT;
     }
     var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
     aGuessT -= currentX / currentSlope;
   }
   return aGuessT;
  }

  function bezier (mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
      throw new Error('bezier x values must be in [0, 1] range');
    }

    // Precompute samples table
    var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX (aX) {
      var intervalStart = 0.0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      // Interpolate to provide an initial guess for t
      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;

      var initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }
    }

    return function BezierEasing (x) {
      if (mX1 === mY1 && mX2 === mY2) {
        return x; // linear
      }
      // Because JavaScript number are imprecise, we should guarantee the extremes are right.
      if (x === 0) {
        return 0;
      }
      if (x === 1) {
        return 1;
      }
      return calcBezier(getTForX(x), mY1, mY2);
    };
  }

  /* eslint no-control-regex: "off" */

  // Remove Diacritics
  var defaultDiacriticsRemovalap = [
    { base: 'A', letters: '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F' },
    { base: 'AA', letters: '\uA732' },
    { base: 'AE', letters: '\u00C6\u01FC\u01E2' },
    { base: 'AO', letters: '\uA734' },
    { base: 'AU', letters: '\uA736' },
    { base: 'AV', letters: '\uA738\uA73A' },
    { base: 'AY', letters: '\uA73C' },
    { base: 'B', letters: '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181' },
    { base: 'C', letters: '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E' },
    { base: 'D', letters: '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779' },
    { base: 'DZ', letters: '\u01F1\u01C4' },
    { base: 'Dz', letters: '\u01F2\u01C5' },
    { base: 'E', letters: '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E' },
    { base: 'F', letters: '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B' },
    { base: 'G', letters: '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E' },
    { base: 'H', letters: '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D' },
    { base: 'I', letters: '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197' },
    { base: 'J', letters: '\u004A\u24BF\uFF2A\u0134\u0248' },
    { base: 'K', letters: '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2' },
    { base: 'L', letters: '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780' },
    { base: 'LJ', letters: '\u01C7' },
    { base: 'Lj', letters: '\u01C8' },
    { base: 'M', letters: '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C' },
    { base: 'N', letters: '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4' },
    { base: 'NJ', letters: '\u01CA' },
    { base: 'Nj', letters: '\u01CB' },
    { base: 'O', letters: '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C' },
    { base: 'OI', letters: '\u01A2' },
    { base: 'OO', letters: '\uA74E' },
    { base: 'OU', letters: '\u0222' },
    { base: 'OE', letters: '\u008C\u0152' },
    { base: 'oe', letters: '\u009C\u0153' },
    { base: 'P', letters: '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754' },
    { base: 'Q', letters: '\u0051\u24C6\uFF31\uA756\uA758\u024A' },
    { base: 'R', letters: '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782' },
    { base: 'S', letters: '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784' },
    { base: 'T', letters: '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786' },
    { base: 'TZ', letters: '\uA728' },
    { base: 'U', letters: '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244' },
    { base: 'V', letters: '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245' },
    { base: 'VY', letters: '\uA760' },
    { base: 'W', letters: '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72' },
    { base: 'X', letters: '\u0058\u24CD\uFF38\u1E8A\u1E8C' },
    { base: 'Y', letters: '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE' },
    { base: 'Z', letters: '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762' },
    { base: 'a', letters: '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250' },
    { base: 'aa', letters: '\uA733' },
    { base: 'ae', letters: '\u00E6\u01FD\u01E3' },
    { base: 'ao', letters: '\uA735' },
    { base: 'au', letters: '\uA737' },
    { base: 'av', letters: '\uA739\uA73B' },
    { base: 'ay', letters: '\uA73D' },
    { base: 'b', letters: '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253' },
    { base: 'c', letters: '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184' },
    { base: 'd', letters: '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A' },
    { base: 'dz', letters: '\u01F3\u01C6' },
    { base: 'e', letters: '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD' },
    { base: 'f', letters: '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C' },
    { base: 'g', letters: '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F' },
    { base: 'h', letters: '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265' },
    { base: 'hv', letters: '\u0195' },
    { base: 'i', letters: '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131' },
    { base: 'j', letters: '\u006A\u24D9\uFF4A\u0135\u01F0\u0249' },
    { base: 'k', letters: '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3' },
    { base: 'l', letters: '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747' },
    { base: 'lj', letters: '\u01C9' },
    { base: 'm', letters: '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F' },
    { base: 'n', letters: '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5' },
    { base: 'nj', letters: '\u01CC' },
    { base: 'o', letters: '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275' },
    { base: 'oi', letters: '\u01A3' },
    { base: 'ou', letters: '\u0223' },
    { base: 'oo', letters: '\uA74F' },
    { base: 'p', letters: '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755' },
    { base: 'q', letters: '\u0071\u24E0\uFF51\u024B\uA757\uA759' },
    { base: 'r', letters: '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783' },
    { base: 's', letters: '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B' },
    { base: 't', letters: '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787' },
    { base: 'tz', letters: '\uA729' },
    { base: 'u', letters: '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289' },
    { base: 'v', letters: '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C' },
    { base: 'vy', letters: '\uA761' },
    { base: 'w', letters: '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73' },
    { base: 'x', letters: '\u0078\u24E7\uFF58\u1E8B\u1E8D' },
    { base: 'y', letters: '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF' },
    { base: 'z', letters: '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763' } ];

  var diacriticsMap = {};
  for (var i = 0; i < defaultDiacriticsRemovalap.length; i += 1) {
    var letters = defaultDiacriticsRemovalap[i].letters;
    for (var j = 0; j < letters.length; j += 1) {
      diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
    }
  }

  var createPromise = function createPromise(handler) {
    var resolved = false;
    var rejected = false;
    var resolveArgs;
    var rejectArgs;
    var promiseHandlers = {
      then: undefined,
      catch: undefined,
    };
    var promise = {
      then: function then(thenHandler) {
        if (resolved) {
          thenHandler.apply(void 0, resolveArgs);
        } else {
          promiseHandlers.then = thenHandler;
        }
        return promise;
      },
      catch: function catch$1(catchHandler) {
        if (rejected) {
          catchHandler.apply(void 0, rejectArgs);
        } else {
          promiseHandlers.catch = catchHandler;
        }
        return promise;
      },
    };

    function resolve() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      resolved = true;
      if (promiseHandlers.then) { promiseHandlers.then.apply(promiseHandlers, args); }
      else { resolveArgs = args; }
    }
    function reject() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      rejected = true;
      if (promiseHandlers.catch) { promiseHandlers.catch.apply(promiseHandlers, args); }
      else { rejectArgs = args; }
    }
    handler(resolve, reject);

    return promise;
  };

  var uniqueNumber = 1;

  var Utils = {
    uniqueNumber: function uniqueNumber$1() {
      uniqueNumber += 1;
      return uniqueNumber;
    },
    id: function id(mask, map) {
      if ( mask === void 0 ) mask = 'xxxxxxxxxx';
      if ( map === void 0 ) map = '0123456789abcdef';

      var length = map.length;
      return mask.replace(/x/g, function () { return map[Math.floor((Math.random() * length))]; });
    },
    mdPreloaderContent: "\n    <span class=\"preloader-inner\">\n      <span class=\"preloader-inner-gap\"></span>\n      <span class=\"preloader-inner-left\">\n          <span class=\"preloader-inner-half-circle\"></span>\n      </span>\n      <span class=\"preloader-inner-right\">\n          <span class=\"preloader-inner-half-circle\"></span>\n      </span>\n    </span>\n  ".trim(),
    eventNameToColonCase: function eventNameToColonCase(eventName) {
      var hasColon;
      return eventName.split('').map(function (char, index) {
        if (char.match(/[A-Z]/) && index !== 0 && !hasColon) {
          hasColon = true;
          return (":" + (char.toLowerCase()));
        }
        return char.toLowerCase();
      }).join('');
    },
    deleteProps: function deleteProps(obj) {
      var object = obj;
      Object.keys(object).forEach(function (key) {
        try {
          object[key] = null;
        } catch (e) {
          // no setter for object
        }
        try {
          delete object[key];
        } catch (e) {
          // something got wrong
        }
      });
    },
    bezier: function bezier$1() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return bezier.apply(void 0, args);
    },
    nextTick: function nextTick(callback, delay) {
      if ( delay === void 0 ) delay = 0;

      return setTimeout(callback, delay);
    },
    nextFrame: function nextFrame(callback) {
      return Utils.requestAnimationFrame(callback);
    },
    now: function now() {
      return Date.now();
    },
    promise: function promise(handler) {
      return win.Promise ? new Promise(handler) : createPromise(handler);
    },
    requestAnimationFrame: function requestAnimationFrame(callback) {
      if (win.requestAnimationFrame) { return win.requestAnimationFrame(callback); }
      if (win.webkitRequestAnimationFrame) { return win.webkitRequestAnimationFrame(callback); }
      return win.setTimeout(callback, 1000 / 60);
    },
    cancelAnimationFrame: function cancelAnimationFrame(id) {
      if (win.cancelAnimationFrame) { return win.cancelAnimationFrame(id); }
      if (win.webkitCancelAnimationFrame) { return win.webkitCancelAnimationFrame(id); }
      return win.clearTimeout(id);
    },
    removeDiacritics: function removeDiacritics(str) {
      return str.replace(/[^\u0000-\u007E]/g, function (a) { return diacriticsMap[a] || a; });
    },
    parseUrlQuery: function parseUrlQuery(url) {
      var query = {};
      var urlToParse = url || win.location.href;
      var i;
      var params;
      var param;
      var length;
      if (typeof urlToParse === 'string' && urlToParse.length) {
        urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
        params = urlToParse.split('&').filter(function (paramsPart) { return paramsPart !== ''; });
        length = params.length;

        for (i = 0; i < length; i += 1) {
          param = params[i].replace(/#\S+/g, '').split('=');
          query[decodeURIComponent(param[0])] = typeof param[1] === 'undefined' ? undefined : decodeURIComponent(param.slice(1).join('=')) || '';
        }
      }
      return query;
    },
    getTranslate: function getTranslate(el, axis) {
      if ( axis === void 0 ) axis = 'x';

      var matrix;
      var curTransform;
      var transformMatrix;

      var curStyle = win.getComputedStyle(el, null);

      if (win.WebKitCSSMatrix) {
        curTransform = curStyle.transform || curStyle.webkitTransform;
        if (curTransform.split(',').length > 6) {
          curTransform = curTransform.split(', ').map(function (a) { return a.replace(',', '.'); }).join(', ');
        }
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new win.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
      } else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
      }

      if (axis === 'x') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) { curTransform = transformMatrix.m41; }
        // Crazy IE10 Matrix
        else if (matrix.length === 16) { curTransform = parseFloat(matrix[12]); }
        // Normal Browsers
        else { curTransform = parseFloat(matrix[4]); }
      }
      if (axis === 'y') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) { curTransform = transformMatrix.m42; }
        // Crazy IE10 Matrix
        else if (matrix.length === 16) { curTransform = parseFloat(matrix[13]); }
        // Normal Browsers
        else { curTransform = parseFloat(matrix[5]); }
      }
      return curTransform || 0;
    },
    serializeObject: function serializeObject(obj, parents) {
      if ( parents === void 0 ) parents = [];

      if (typeof obj === 'string') { return obj; }
      var resultArray = [];
      var separator = '&';
      var newParents;
      function varName(name) {
        if (parents.length > 0) {
          var parentParts = '';
          for (var j = 0; j < parents.length; j += 1) {
            if (j === 0) { parentParts += parents[j]; }
            else { parentParts += "[" + (encodeURIComponent(parents[j])) + "]"; }
          }
          return (parentParts + "[" + (encodeURIComponent(name)) + "]");
        }
        return encodeURIComponent(name);
      }
      function varValue(value) {
        return encodeURIComponent(value);
      }
      Object.keys(obj).forEach(function (prop) {
        var toPush;
        if (Array.isArray(obj[prop])) {
          toPush = [];
          for (var i = 0; i < obj[prop].length; i += 1) {
            if (!Array.isArray(obj[prop][i]) && typeof obj[prop][i] === 'object') {
              newParents = parents.slice();
              newParents.push(prop);
              newParents.push(String(i));
              toPush.push(Utils.serializeObject(obj[prop][i], newParents));
            } else {
              toPush.push(((varName(prop)) + "[]=" + (varValue(obj[prop][i]))));
            }
          }
          if (toPush.length > 0) { resultArray.push(toPush.join(separator)); }
        } else if (obj[prop] === null || obj[prop] === '') {
          resultArray.push(((varName(prop)) + "="));
        } else if (typeof obj[prop] === 'object') {
          // Object, convert to named array
          newParents = parents.slice();
          newParents.push(prop);
          toPush = Utils.serializeObject(obj[prop], newParents);
          if (toPush !== '') { resultArray.push(toPush); }
        } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
          // Should be string or plain value
          resultArray.push(((varName(prop)) + "=" + (varValue(obj[prop]))));
        } else if (obj[prop] === '') { resultArray.push(varName(prop)); }
      });
      return resultArray.join(separator);
    },
    isObject: function isObject(o) {
      return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
    },
    merge: function merge() {
      var args = [], len$1 = arguments.length;
      while ( len$1-- ) args[ len$1 ] = arguments[ len$1 ];

      var to = args[0];
      args.splice(0, 1);
      var from = args;

      for (var i = 0; i < from.length; i += 1) {
        var nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          var keysArray = Object.keys(Object(nextSource));
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    extend: function extend() {
      var args = [], len$1 = arguments.length;
      while ( len$1-- ) args[ len$1 ] = arguments[ len$1 ];

      var deep = true;
      var to;
      var from;
      if (typeof args[0] === 'boolean') {
        deep = args[0];
        to = args[1];
        args.splice(0, 2);
        from = args;
      } else {
        to = args[0];
        args.splice(0, 1);
        from = args;
      }
      for (var i = 0; i < from.length; i += 1) {
        var nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          var keysArray = Object.keys(Object(nextSource));
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              if (!deep) {
                to[nextKey] = nextSource[nextKey];
              } else if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                to[nextKey] = {};
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
      }
      return to;
    },
  };

  var Device = (function Device() {
    var platform = win.navigator.platform;
    var ua = win.navigator.userAgent;

    var device = {
      ios: false,
      android: false,
      androidChrome: false,
      desktop: false,
      windowsPhone: false,
      iphone: false,
      iphoneX: false,
      ipod: false,
      ipad: false,
      edge: false,
      ie: false,
      firefox: false,
      macos: false,
      windows: false,
      cordova: !!(win.cordova || win.phonegap),
      phonegap: !!(win.cordova || win.phonegap),
    };

    var windowsPhone = ua.match(/(Windows Phone);?[\s\/]+([\d.]+)?/); // eslint-disable-line
    var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
    var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
    var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
    var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
    var iphoneX = iphone && win.screen.width === 375 && win.screen.height === 812;
    var ie = ua.indexOf('MSIE ') >= 0 || ua.indexOf('Trident/') >= 0;
    var edge = ua.indexOf('Edge/') >= 0;
    var firefox = ua.indexOf('Gecko/') >= 0 && ua.indexOf('Firefox/') >= 0;
    var macos = platform === 'MacIntel';
    var windows = platform === 'Win32';

    device.ie = ie;
    device.edge = edge;
    device.firefox = firefox;

    // Windows
    if (windowsPhone) {
      device.os = 'windows';
      device.osVersion = windows[2];
      device.windowsPhone = true;
    }
    // Android
    if (android && !windows) {
      device.os = 'android';
      device.osVersion = android[2];
      device.android = true;
      device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
    }
    if (ipad || iphone || ipod) {
      device.os = 'ios';
      device.ios = true;
    }
    // iOS
    if (iphone && !ipod) {
      device.osVersion = iphone[2].replace(/_/g, '.');
      device.iphone = true;
      device.iphoneX = iphoneX;
    }
    if (ipad) {
      device.osVersion = ipad[2].replace(/_/g, '.');
      device.ipad = true;
    }
    if (ipod) {
      device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
      device.iphone = true;
    }
    // iOS 8+ changed UA
    if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
      if (device.osVersion.split('.')[0] === '10') {
        device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
      }
    }

    // Webview
    device.webView = !!((iphone || ipad || ipod) && (ua.match(/.*AppleWebKit(?!.*Safari)/i) || win.navigator.standalone));
    device.webview = device.webView;


    // Desktop
    device.desktop = !(device.os || device.android || device.webView);
    if (device.desktop) {
      device.macos = macos;
      device.windows = windows;
    }

    // Minimal UI
    if (device.os && device.os === 'ios') {
      var osVersionArr = device.osVersion.split('.');
      var metaViewport = doc.querySelector('meta[name="viewport"]');
      device.minimalUi = !device.webView
        && (ipod || iphone)
        && (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7)
        && metaViewport && metaViewport.getAttribute('content').indexOf('minimal-ui') >= 0;
    }

    // Check for status bar and fullscreen app mode
    device.needsStatusbarOverlay = function needsStatusbarOverlay() {
      if ((device.webView || (device.android && device.cordova)) && (win.innerWidth * win.innerHeight === win.screen.width * win.screen.height)) {
        if (device.iphoneX && (win.orientation === 90 || win.orientation === -90)) {
          return false;
        }
        return true;
      }
      return false;
    };
    device.statusbar = device.needsStatusbarOverlay();

    // Pixel Ratio
    device.pixelRatio = win.devicePixelRatio || 1;

    // Export object
    return device;
  }());

  var Framework7Class = function Framework7Class(params, parents) {
    if ( params === void 0 ) params = {};
    if ( parents === void 0 ) parents = [];

    var self = this;
    self.params = params;

    // Events
    self.eventsParents = parents;
    self.eventsListeners = {};

    if (self.params && self.params.on) {
      Object.keys(self.params.on).forEach(function (eventName) {
        self.on(eventName, self.params.on[eventName]);
      });
    }
  };

  var staticAccessors$1 = { components: { configurable: true } };

  Framework7Class.prototype.on = function on (events, handler, priority) {
    var self = this;
    if (typeof handler !== 'function') { return self; }
    var method = priority ? 'unshift' : 'push';
    events.split(' ').forEach(function (event) {
      if (!self.eventsListeners[event]) { self.eventsListeners[event] = []; }
      self.eventsListeners[event][method](handler);
    });
    return self;
  };

  Framework7Class.prototype.once = function once (events, handler, priority) {
    var self = this;
    if (typeof handler !== 'function') { return self; }
    function onceHandler() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

      handler.apply(self, args);
      self.off(events, onceHandler);
    }
    return self.on(events, onceHandler, priority);
  };

  Framework7Class.prototype.off = function off (events, handler) {
    var self = this;
    if (!self.eventsListeners) { return self; }
    events.split(' ').forEach(function (event) {
      if (typeof handler === 'undefined') {
        self.eventsListeners[event] = [];
      } else {
        self.eventsListeners[event].forEach(function (eventHandler, index) {
          if (eventHandler === handler) {
            self.eventsListeners[event].splice(index, 1);
          }
        });
      }
    });
    return self;
  };

  Framework7Class.prototype.emit = function emit () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

    var self = this;
    if (!self.eventsListeners) { return self; }
    var events;
    var data;
    var context;
    var eventsParents;
    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
      events = args[0];
      data = args.slice(1, args.length);
      context = self;
      eventsParents = self.eventsParents;
    } else {
      events = args[0].events;
      data = args[0].data;
      context = args[0].context || self;
      eventsParents = args[0].local ? [] : args[0].parents || self.eventsParents;
    }
    var eventsArray = Array.isArray(events) ? events : events.split(' ');
    var localEvents = eventsArray.map(function (eventName) { return eventName.replace('local::', ''); });
    var parentEvents = eventsArray.filter(function (eventName) { return eventName.indexOf('local::') < 0; });

    localEvents.forEach(function (event) {
      if (self.eventsListeners && self.eventsListeners[event]) {
        var handlers = [];
        self.eventsListeners[event].forEach(function (eventHandler) {
          handlers.push(eventHandler);
        });
        handlers.forEach(function (eventHandler) {
          eventHandler.apply(context, data);
        });
      }
    });
    if (eventsParents && eventsParents.length > 0) {
      eventsParents.forEach(function (eventsParent) {
        eventsParent.emit.apply(eventsParent, [ parentEvents ].concat( data ));
      });
    }
    return self;
  };

  Framework7Class.prototype.useModulesParams = function useModulesParams (instanceParams) {
    var instance = this;
    if (!instance.modules) { return; }
    Object.keys(instance.modules).forEach(function (moduleName) {
      var module = instance.modules[moduleName];
      // Extend params
      if (module.params) {
        Utils.extend(instanceParams, module.params);
      }
    });
  };

  Framework7Class.prototype.useModules = function useModules (modulesParams) {
      if ( modulesParams === void 0 ) modulesParams = {};

    var instance = this;
    if (!instance.modules) { return; }
    Object.keys(instance.modules).forEach(function (moduleName) {
      var module = instance.modules[moduleName];
      var moduleParams = modulesParams[moduleName] || {};
      // Extend instance methods and props
      if (module.instance) {
        Object.keys(module.instance).forEach(function (modulePropName) {
          var moduleProp = module.instance[modulePropName];
          if (typeof moduleProp === 'function') {
            instance[modulePropName] = moduleProp.bind(instance);
          } else {
            instance[modulePropName] = moduleProp;
          }
        });
      }
      // Add event listeners
      if (module.on && instance.on) {
        Object.keys(module.on).forEach(function (moduleEventName) {
          instance.on(moduleEventName, module.on[moduleEventName]);
        });
      }
      // Add vnode hooks
      if (module.vnode) {
        if (!instance.vnodeHooks) { instance.vnodeHooks = {}; }
        Object.keys(module.vnode).forEach(function (vnodeId) {
          Object.keys(module.vnode[vnodeId]).forEach(function (hookName) {
            var handler = module.vnode[vnodeId][hookName];
            if (!instance.vnodeHooks[hookName]) { instance.vnodeHooks[hookName] = {}; }
            if (!instance.vnodeHooks[hookName][vnodeId]) { instance.vnodeHooks[hookName][vnodeId] = []; }
            instance.vnodeHooks[hookName][vnodeId].push(handler.bind(instance));
          });
        });
      }
      // Module create callback
      if (module.create) {
        module.create.bind(instance)(moduleParams);
      }
    });
  };

  staticAccessors$1.components.set = function (components) {
    var Class = this;
    if (!Class.use) { return; }
    Class.use(components);
  };

  Framework7Class.installModule = function installModule (module) {
      var params = [], len = arguments.length - 1;
      while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    var Class = this;
    if (!Class.prototype.modules) { Class.prototype.modules = {}; }
    var name = module.name || (((Object.keys(Class.prototype.modules).length) + "_" + (Utils.now())));
    Class.prototype.modules[name] = module;
    // Prototype
    if (module.proto) {
      Object.keys(module.proto).forEach(function (key) {
        Class.prototype[key] = module.proto[key];
      });
    }
    // Class
    if (module.static) {
      Object.keys(module.static).forEach(function (key) {
        Class[key] = module.static[key];
      });
    }
    // Callback
    if (module.install) {
      module.install.apply(Class, params);
    }
    return Class;
  };

  Framework7Class.use = function use (module) {
      var params = [], len = arguments.length - 1;
      while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    var Class = this;
    if (Array.isArray(module)) {
      module.forEach(function (m) { return Class.installModule(m); });
      return Class;
    }
    return Class.installModule.apply(Class, [ module ].concat( params ));
  };

  Object.defineProperties( Framework7Class, staticAccessors$1 );

  var Framework7 = (function (Framework7Class$$1) {
    function Framework7(params) {
      Framework7Class$$1.call(this, params);

      var passedParams = Utils.extend({}, params);

      // App Instance
      var app = this;

      // Default
      var defaults = {
        version: '1.0.0',
        id: 'io.framework7.testapp',
        root: 'body',
        theme: 'auto',
        language: win.navigator.language,
        routes: [],
        name: 'Framework7',
        initOnDeviceReady: true,
        init: true,
      };

      // Extend defaults with modules params
      app.useModulesParams(defaults);

      // Extend defaults with passed params
      app.params = Utils.extend(defaults, params);

      var $rootEl = $(app.params.root);

      Utils.extend(app, {
        // App Id
        id: app.params.id,
        // App Name
        name: app.params.name,
        // App version
        version: app.params.version,
        // Routes
        routes: app.params.routes,
        // Lang
        language: app.params.language,
        // Root
        root: $rootEl,
        // RTL
        rtl: $rootEl.css('direction') === 'rtl',
        // Theme
        theme: (function getTheme() {
          if (app.params.theme === 'auto') {
            return Device.ios ? 'ios' : 'md';
          }
          return app.params.theme;
        }()),
        // Initially passed parameters
        passedParams: passedParams,
      });

      // Save Root
      if (app.root && app.root[0]) {
        app.root[0].f7 = app;
      }

      // Install Modules
      app.useModules();

      // Init
      if (app.params.init) {
        if (Device.cordova && app.params.initOnDeviceReady) {
          $(doc).on('deviceready', function () {
            app.init();
          });
        } else {
          app.init();
        }
      }
      // Return app instance
      return app;
    }

    if ( Framework7Class$$1 ) Framework7.__proto__ = Framework7Class$$1;
    Framework7.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Framework7.prototype.constructor = Framework7;

    var prototypeAccessors = { $: { configurable: true },t7: { configurable: true } };
    var staticAccessors = { Dom7: { configurable: true },$: { configurable: true },Template7: { configurable: true },Class: { configurable: true } };

    Framework7.prototype.init = function init () {
      var app = this;
      if (app.initialized) { return app; }

      app.root.addClass('framework7-initializing');

      // RTL attr
      if (app.rtl) {
        $('html').attr('dir', 'rtl');
      }

      // Root class
      app.root.addClass('framework7-root');

      // Theme class
      $('html').removeClass('ios md').addClass(app.theme);

      // Data
      app.data = {};
      if (app.params.data && typeof app.params.data === 'function') {
        Utils.extend(app.data, app.params.data.bind(app)());
      } else if (app.params.data) {
        Utils.extend(app.data, app.params.data);
      }
      // Methods
      app.methods = {};
      if (app.params.methods) {
        Object.keys(app.params.methods).forEach(function (methodName) {
          if (typeof app.params.methods[methodName] === 'function') {
            app.methods[methodName] = app.params.methods[methodName].bind(app);
          } else {
            app.methods[methodName] = app.params.methods[methodName];
          }
        });
      }
      // Init class
      Utils.nextFrame(function () {
        app.root.removeClass('framework7-initializing');
      });
      // Emit, init other modules
      app.initialized = true;
      app.emit('init');

      return app;
    };

    Framework7.prototype.getVnodeHooks = function getVnodeHooks (hook, id) {
      var app = this;
      if (!app.vnodeHooks || !app.vnodeHooks[hook]) { return []; }
      return app.vnodeHooks[hook][id] || [];
    };

    // eslint-disable-next-line
    prototypeAccessors.$.get = function () {
      return $;
    };
    // eslint-disable-next-line
    prototypeAccessors.t7.get = function () {
      return Template7;
    };

    staticAccessors.Dom7.get = function () {
      return $;
    };

    staticAccessors.$.get = function () {
      return $;
    };

    staticAccessors.Template7.get = function () {
      return Template7;
    };

    staticAccessors.Class.get = function () {
      return Framework7Class$$1;
    };

    Object.defineProperties( Framework7.prototype, prototypeAccessors );
    Object.defineProperties( Framework7, staticAccessors );

    return Framework7;
  }(Framework7Class));

  var DeviceModule = {
    name: 'device',
    proto: {
      device: Device,
    },
    static: {
      device: Device,
    },
    on: {
      init: function init() {
        var classNames = [];
        var html = doc.querySelector('html');
        if (!html) { return; }
        // Pixel Ratio
        classNames.push(("device-pixel-ratio-" + (Math.floor(Device.pixelRatio))));
        if (Device.pixelRatio >= 2) {
          classNames.push('device-retina');
        }
        // OS classes
        if (Device.os) {
          classNames.push(
            ("device-" + (Device.os)),
            ("device-" + (Device.os) + "-" + (Device.osVersion.split('.')[0])),
            ("device-" + (Device.os) + "-" + (Device.osVersion.replace(/\./g, '-')))
          );
          if (Device.os === 'ios') {
            var major = parseInt(Device.osVersion.split('.')[0], 10);
            for (var i = major - 1; i >= 6; i -= 1) {
              classNames.push(("device-ios-gt-" + i));
            }
            if (Device.iphoneX) {
              classNames.push('device-iphone-x');
            }
          }
        } else if (Device.desktop) {
          classNames.push('device-desktop');
          if (Device.macos) { classNames.push('device-macos'); }
          else if (Device.windows) { classNames.push('device-windows'); }
        }
        if (Device.cordova || Device.phonegap) {
          classNames.push('device-cordova');
        }

        // Add html classes
        classNames.forEach(function (className) {
          html.classList.add(className);
        });
      },
    },
  };

  var Support = (function Support() {
    var positionSticky = (function supportPositionSticky() {
      var support = false;
      var div = doc.createElement('div');
      ('sticky -webkit-sticky -moz-sticky').split(' ').forEach(function (prop) {
        if (support) { return; }
        div.style.position = prop;
        if (div.style.position === prop) {
          support = true;
        }
      });
      return support;
    }());

    var testDiv = doc.createElement('div');

    return {
      positionSticky: positionSticky,
      touch: (function checkTouch() {
        return !!(('ontouchstart' in win) || (win.DocumentTouch && doc instanceof win.DocumentTouch));
      }()),

      pointerEvents: !!(win.navigator.pointerEnabled || win.PointerEvent),
      prefixedPointerEvents: !!win.navigator.msPointerEnabled,

      transition: (function checkTransition() {
        var style = testDiv.style;
        return ('transition' in style || 'webkitTransition' in style || 'MozTransition' in style);
      }()),
      transforms3d: (win.Modernizr && win.Modernizr.csstransforms3d === true) || (function checkTransforms3d() {
        var style = testDiv.style;
        return ('webkitPerspective' in style || 'MozPerspective' in style || 'OPerspective' in style || 'MsPerspective' in style || 'perspective' in style);
      }()),

      flexbox: (function checkFlexbox() {
        var div = doc.createElement('div').style;
        var styles = ('alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient').split(' ');
        for (var i = 0; i < styles.length; i += 1) {
          if (styles[i] in div) { return true; }
        }
        return false;
      }()),

      observer: (function checkObserver() {
        return ('MutationObserver' in win || 'WebkitMutationObserver' in win);
      }()),

      passiveListener: (function checkPassiveListener() {
        var supportsPassive = false;
        try {
          var opts = Object.defineProperty({}, 'passive', {
            // eslint-disable-next-line
            get: function get() {
              supportsPassive = true;
            },
          });
          win.addEventListener('testPassiveListener', null, opts);
        } catch (e) {
          // No support
        }
        return supportsPassive;
      }()),

      gestures: (function checkGestures() {
        return 'ongesturestart' in win;
      }()),
    };
  }());

  var SupportModule = {
    name: 'support',
    proto: {
      support: Support,
    },
    static: {
      support: Support,
    },
    on: {
      init: function init() {
        var html = doc.querySelector('html');
        if (!html) { return; }
        var classNames = [];
        if (Support.positionSticky) {
          classNames.push('support-position-sticky');
        }
        // Add html classes
        classNames.forEach(function (className) {
          html.classList.add(className);
        });
      },
    },
  };

  var UtilsModule = {
    name: 'utils',
    proto: {
      utils: Utils,
    },
    static: {
      utils: Utils,
    },
  };

  var ResizeModule = {
    name: 'resize',
    instance: {
      getSize: function getSize() {
        var app = this;
        if (!app.root[0]) { return { width: 0, height: 0, left: 0, top: 0 }; }
        var offset = app.root.offset();
        var ref = [app.root[0].offsetWidth, app.root[0].offsetHeight, offset.left, offset.top];
        var width = ref[0];
        var height = ref[1];
        var left = ref[2];
        var top = ref[3];
        app.width = width;
        app.height = height;
        app.left = left;
        app.top = top;
        return { width: width, height: height, left: left, top: top };
      },
    },
    on: {
      init: function init() {
        var app = this;

        // Get Size
        app.getSize();

        // Emit resize
        win.addEventListener('resize', function () {
          app.emit('resize');
        }, false);

        // Emit orientationchange
        win.addEventListener('orientationchange', function () {
          app.emit('orientationchange');
        });
      },
      orientationchange: function orientationchange() {
        var app = this;
        if (app.device && app.device.minimalUi) {
          if (win.orientation === 90 || win.orientation === -90) {
            doc.body.scrollTop = 0;
          }
        }
        // Fix iPad weird body scroll
        if (app.device.ipad) {
          doc.body.scrollLeft = 0;
          setTimeout(function () {
            doc.body.scrollLeft = 0;
          }, 0);
        }
      },
      resize: function resize() {
        var app = this;
        app.getSize();
      },
    },
  };

  var globals = {};
  var jsonpRequests = 0;

  function Request(requestOptions) {
    var globalsNoCallbacks = Utils.extend({}, globals);
    ('beforeCreate beforeOpen beforeSend error complete success statusCode').split(' ').forEach(function (callbackName) {
      delete globalsNoCallbacks[callbackName];
    });
    var defaults = Utils.extend({
      url: win.location.toString(),
      method: 'GET',
      data: false,
      async: true,
      cache: true,
      user: '',
      password: '',
      headers: {},
      xhrFields: {},
      statusCode: {},
      processData: true,
      dataType: 'text',
      contentType: 'application/x-www-form-urlencoded',
      timeout: 0,
    }, globalsNoCallbacks);

    var options = Utils.extend({}, defaults, requestOptions);
    var proceedRequest;

    // Function to run XHR callbacks and events
    function fireCallback(callbackName) {
      var data = [], len = arguments.length - 1;
      while ( len-- > 0 ) data[ len ] = arguments[ len + 1 ];

      /*
        Callbacks:
        beforeCreate (options),
        beforeOpen (xhr, options),
        beforeSend (xhr, options),
        error (xhr, status),
        complete (xhr, stautus),
        success (response, status, xhr),
        statusCode ()
      */
      var globalCallbackValue;
      var optionCallbackValue;
      if (globals[callbackName]) {
        globalCallbackValue = globals[callbackName].apply(globals, data);
      }
      if (options[callbackName]) {
        optionCallbackValue = options[callbackName].apply(options, data);
      }
      if (typeof globalCallbackValue !== 'boolean') { globalCallbackValue = true; }
      if (typeof optionCallbackValue !== 'boolean') { optionCallbackValue = true; }
      return (globalCallbackValue && optionCallbackValue);
    }

    // Before create callback
    proceedRequest = fireCallback('beforeCreate', options);
    if (proceedRequest === false) { return undefined; }

    // For jQuery guys
    if (options.type) { options.method = options.type; }

    // Parameters Prefix
    var paramsPrefix = options.url.indexOf('?') >= 0 ? '&' : '?';

    // UC method
    var method = options.method.toUpperCase();

    // Data to modify GET URL
    if ((method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') && options.data) {
      var stringData;
      if (typeof options.data === 'string') {
        // Should be key=value string
        if (options.data.indexOf('?') >= 0) { stringData = options.data.split('?')[1]; }
        else { stringData = options.data; }
      } else {
        // Should be key=value object
        stringData = Utils.serializeObject(options.data);
      }
      if (stringData.length) {
        options.url += paramsPrefix + stringData;
        if (paramsPrefix === '?') { paramsPrefix = '&'; }
      }
    }

    // JSONP
    if (options.dataType === 'json' && options.url.indexOf('callback=') >= 0) {
      var callbackName = "f7jsonp_" + (Date.now() + ((jsonpRequests += 1)));
      var abortTimeout;
      var callbackSplit = options.url.split('callback=');
      var requestUrl = (callbackSplit[0]) + "callback=" + callbackName;
      if (callbackSplit[1].indexOf('&') >= 0) {
        var addVars = callbackSplit[1].split('&').filter(function (el) { return el.indexOf('=') > 0; }).join('&');
        if (addVars.length > 0) { requestUrl += "&" + addVars; }
      }

      // Create script
      var script = doc.createElement('script');
      script.type = 'text/javascript';
      script.onerror = function onerror() {
        clearTimeout(abortTimeout);
        fireCallback('error', null, 'scripterror');
        fireCallback('complete', null, 'scripterror');
      };
      script.src = requestUrl;

      // Handler
      win[callbackName] = function jsonpCallback(data) {
        clearTimeout(abortTimeout);
        fireCallback('success', data);
        script.parentNode.removeChild(script);
        script = null;
        delete win[callbackName];
      };
      doc.querySelector('head').appendChild(script);

      if (options.timeout > 0) {
        abortTimeout = setTimeout(function () {
          script.parentNode.removeChild(script);
          script = null;
          fireCallback('error', null, 'timeout');
        }, options.timeout);
      }

      return undefined;
    }

    // Cache for GET/HEAD requests
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') {
      if (options.cache === false) {
        options.url += paramsPrefix + "_nocache" + (Date.now());
      }
    }

    // Create XHR
    var xhr = new XMLHttpRequest();

    // Save Request URL
    xhr.requestUrl = options.url;
    xhr.requestParameters = options;

    // Before open callback
    proceedRequest = fireCallback('beforeOpen', xhr, options);
    if (proceedRequest === false) { return xhr; }

    // Open XHR
    xhr.open(method, options.url, options.async, options.user, options.password);

    // Create POST Data
    var postData = null;

    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && options.data) {
      if (options.processData) {
        var postDataInstances = [ArrayBuffer, Blob, Document, FormData];
        // Post Data
        if (postDataInstances.indexOf(options.data.constructor) >= 0) {
          postData = options.data;
        } else {
          // POST Headers
          var boundary = "---------------------------" + (Date.now().toString(16));

          if (options.contentType === 'multipart/form-data') {
            xhr.setRequestHeader('Content-Type', ("multipart/form-data; boundary=" + boundary));
          } else {
            xhr.setRequestHeader('Content-Type', options.contentType);
          }
          postData = '';
          var data$1 = Utils.serializeObject(options.data);
          if (options.contentType === 'multipart/form-data') {
            data$1 = data$1.split('&');
            var newData = [];
            for (var i = 0; i < data$1.length; i += 1) {
              newData.push(("Content-Disposition: form-data; name=\"" + (data$1[i].split('=')[0]) + "\"\r\n\r\n" + (data$1[i].split('=')[1]) + "\r\n"));
            }
            postData = "--" + boundary + "\r\n" + (newData.join(("--" + boundary + "\r\n"))) + "--" + boundary + "--\r\n";
          } else {
            postData = data$1;
          }
        }
      } else {
        postData = options.data;
        xhr.setRequestHeader('Content-Type', options.contentType);
      }
    }

    // Additional headers
    if (options.headers) {
      Object.keys(options.headers).forEach(function (headerName) {
        xhr.setRequestHeader(headerName, options.headers[headerName]);
      });
    }

    // Check for crossDomain
    if (typeof options.crossDomain === 'undefined') {
      // eslint-disable-next-line
      options.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(options.url) && RegExp.$2 !== win.location.host;
    }

    if (!options.crossDomain) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    if (options.xhrFields) {
      Utils.extend(xhr, options.xhrFields);
    }

    var xhrTimeout;

    // Handle XHR
    xhr.onload = function onload() {
      if (xhrTimeout) { clearTimeout(xhrTimeout); }
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
        var responseData;
        if (options.dataType === 'json') {
          var parseError;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch (err) {
            parseError = true;
          }
          if (!parseError) {
            fireCallback('success', responseData, xhr.status, xhr);
          } else {
            fireCallback('error', xhr, 'parseerror');
          }
        } else {
          responseData = xhr.responseType === 'text' || xhr.responseType === '' ? xhr.responseText : xhr.response;
          fireCallback('success', responseData, xhr.status, xhr);
        }
      } else {
        fireCallback('error', xhr, xhr.status);
      }
      if (options.statusCode) {
        if (globals.statusCode && globals.statusCode[xhr.status]) { globals.statusCode[xhr.status](xhr); }
        if (options.statusCode[xhr.status]) { options.statusCode[xhr.status](xhr); }
      }
      fireCallback('complete', xhr, xhr.status);
    };

    xhr.onerror = function onerror() {
      if (xhrTimeout) { clearTimeout(xhrTimeout); }
      fireCallback('error', xhr, xhr.status);
      fireCallback('complete', xhr, 'error');
    };

    // Timeout
    if (options.timeout > 0) {
      xhr.onabort = function onabort() {
        if (xhrTimeout) { clearTimeout(xhrTimeout); }
      };
      xhrTimeout = setTimeout(function () {
        xhr.abort();
        fireCallback('error', xhr, 'timeout');
        fireCallback('complete', xhr, 'timeout');
      }, options.timeout);
    }

    // Ajax start callback
    proceedRequest = fireCallback('beforeSend', xhr, options);
    if (proceedRequest === false) { return xhr; }

    // Send XHR
    xhr.send(postData);

    // Return XHR object
    return xhr;
  }
  function RequestShortcut(method) {
    var assign, assign$1;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    var ref = [];
    var url = ref[0];
    var data = ref[1];
    var success = ref[2];
    var error = ref[3];
    var dataType = ref[4];
    if (typeof args[1] === 'function') {
      (assign = args, url = assign[0], success = assign[1], error = assign[2], dataType = assign[3]);
    } else {
      (assign$1 = args, url = assign$1[0], data = assign$1[1], success = assign$1[2], error = assign$1[3], dataType = assign$1[4]);
    }
    [success, error].forEach(function (callback) {
      if (typeof callback === 'string') {
        dataType = callback;
        if (callback === success) { success = undefined; }
        else { error = undefined; }
      }
    });
    dataType = dataType || (method === 'json' || method === 'postJSON' ? 'json' : undefined);
    var requestOptions = {
      url: url,
      method: method === 'post' || method === 'postJSON' ? 'POST' : 'GET',
      data: data,
      success: success,
      error: error,
      dataType: dataType,
    };
    if (method === 'postJSON') {
      Utils.extend(requestOptions, {
        contentType: 'application/json',
        processData: false,
        crossDomain: true,
        data: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }
    return Request(requestOptions);
  }
  Request.get = function get() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'get' ].concat( args ));
  };
  Request.post = function post() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'post' ].concat( args ));
  };
  Request.json = function json() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'json' ].concat( args ));
  };
  Request.getJSON = Request.json;
  Request.postJSON = function postJSON() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'postJSON' ].concat( args ));
  };
  Request.setup = function setup(options) {
    if (options.type && !options.method) {
      Utils.extend(options, { method: options.type });
    }
    Utils.extend(globals, options);
  };

  /* eslint no-param-reassign: "off" */

  var RequestModule = {
    name: 'request',
    proto: {
      request: Request,
    },
    static: {
      request: Request,
    },
  };

  function initTouch() {
    var app = this;
    var params = app.params.touch;
    var useRipple = app.theme === 'md' && params.materialRipple;

    if (Device.ios && Device.webView) {
      // Strange hack required for iOS 8 webview to work on inputs
      win.addEventListener('touchstart', function () {});
    }

    var touchStartX;
    var touchStartY;
    var touchStartTime;
    var targetElement;
    var trackClick;
    var activeSelection;
    var scrollParent;
    var lastClickTime;
    var isMoved;
    var tapHoldFired;
    var tapHoldTimeout;

    var activableElement;
    var activeTimeout;

    var needsFastClick;
    var needsFastClickTimeOut;

    var rippleWave;
    var rippleTarget;
    var rippleTimeout;

    function findActivableElement(el) {
      var target = $(el);
      var parents = target.parents(params.activeStateElements);
      var activable;
      if (target.is(params.activeStateElements)) {
        activable = target;
      }
      if (parents.length > 0) {
        activable = activable ? activable.add(parents) : parents;
      }
      return activable || target;
    }

    function isInsideScrollableView(el) {
      var pageContent = el.parents('.page-content, .panel');

      if (pageContent.length === 0) {
        return false;
      }

      // This event handler covers the "tap to stop scrolling".
      if (pageContent.prop('scrollHandlerSet') !== 'yes') {
        pageContent.on('scroll', function () {
          clearTimeout(activeTimeout);
          clearTimeout(rippleTimeout);
        });
        pageContent.prop('scrollHandlerSet', 'yes');
      }

      return true;
    }
    function addActive() {
      if (!activableElement) { return; }
      activableElement.addClass('active-state');
    }
    function removeActive() {
      if (!activableElement) { return; }
      activableElement.removeClass('active-state');
      activableElement = null;
    }
    function isFormElement(el) {
      var nodes = ('input select textarea label').split(' ');
      if (el.nodeName && nodes.indexOf(el.nodeName.toLowerCase()) >= 0) { return true; }
      return false;
    }
    function androidNeedsBlur(el) {
      var noBlur = ('button input textarea select').split(' ');
      if (doc.activeElement && el !== doc.activeElement && doc.activeElement !== doc.body) {
        if (noBlur.indexOf(el.nodeName.toLowerCase()) >= 0) {
          return false;
        }
        return true;
      }
      return false;
    }
    function targetNeedsFastClick(el) {
      /*
      if (
        Device.ios
        &&
        (
          Device.osVersion.split('.')[0] > 9
          ||
          (Device.osVersion.split('.')[0] * 1 === 9 && Device.osVersion.split('.')[1] >= 1)
        )
      ) {
        return false;
      }
      */
      var $el = $(el);
      if (el.nodeName.toLowerCase() === 'input' && (el.type === 'file' || el.type === 'range')) { return false; }
      if (el.nodeName.toLowerCase() === 'select' && Device.android) { return false; }
      if ($el.hasClass('no-fastclick') || $el.parents('.no-fastclick').length > 0) { return false; }
      if (params.fastClicksExclude && $el.closest(params.fastClicksExclude).length > 0) { return false; }

      return true;
    }
    function targetNeedsFocus(el) {
      if (doc.activeElement === el) {
        return false;
      }
      var tag = el.nodeName.toLowerCase();
      var skipInputs = ('button checkbox file image radio submit').split(' ');
      if (el.disabled || el.readOnly) { return false; }
      if (tag === 'textarea') { return true; }
      if (tag === 'select') {
        if (Device.android) { return false; }
        return true;
      }
      if (tag === 'input' && skipInputs.indexOf(el.type) < 0) { return true; }
      return false;
    }
    function targetNeedsPrevent(el) {
      var $el = $(el);
      var prevent = true;
      if ($el.is('label') || $el.parents('label').length > 0) {
        if (Device.android) {
          prevent = false;
        } else if (Device.ios && $el.is('input')) {
          prevent = true;
        } else { prevent = false; }
      }
      return prevent;
    }

    // Ripple handlers
    function findRippleElement(el) {
      var rippleElements = params.materialRippleElements;
      var $el = $(el);
      if ($el.is(rippleElements)) {
        if ($el.hasClass('no-ripple')) {
          return false;
        }
        return $el;
      }
      if ($el.parents(rippleElements).length > 0) {
        var rippleParent = $el.parents(rippleElements).eq(0);
        if (rippleParent.hasClass('no-ripple')) {
          return false;
        }
        return rippleParent;
      }
      return false;
    }
    function createRipple($el, x, y) {
      if (!$el) { return; }
      rippleWave = app.touchRipple.create($el, x, y);
    }

    function removeRipple() {
      if (!rippleWave) { return; }
      rippleWave.remove();
      rippleWave = undefined;
      rippleTarget = undefined;
    }
    function rippleTouchStart(el) {
      rippleTarget = findRippleElement(el);
      if (!rippleTarget || rippleTarget.length === 0) {
        rippleTarget = undefined;
        return;
      }
      if (!isInsideScrollableView(rippleTarget)) {
        createRipple(rippleTarget, touchStartX, touchStartY);
      } else {
        rippleTimeout = setTimeout(function () {
          createRipple(rippleTarget, touchStartX, touchStartY);
        }, 80);
      }
    }
    function rippleTouchMove() {
      clearTimeout(rippleTimeout);
      removeRipple();
    }
    function rippleTouchEnd() {
      if (rippleWave) {
        removeRipple();
      } else if (rippleTarget && !isMoved) {
        clearTimeout(rippleTimeout);
        createRipple(rippleTarget, touchStartX, touchStartY);
        setTimeout(removeRipple, 0);
      } else {
        removeRipple();
      }
    }

    // Mouse Handlers
    function handleMouseDown(e) {
      findActivableElement(e.target).addClass('active-state');
      if ('which' in e && e.which === 3) {
        setTimeout(function () {
          $('.active-state').removeClass('active-state');
        }, 0);
      }
      if (useRipple) {
        touchStartX = e.pageX;
        touchStartY = e.pageY;
        rippleTouchStart(e.target, e.pageX, e.pageY);
      }
    }
    function handleMouseMove() {
      $('.active-state').removeClass('active-state');
      if (useRipple) {
        rippleTouchMove();
      }
    }
    function handleMouseUp() {
      $('.active-state').removeClass('active-state');
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    // Send Click
    function sendClick(e) {
      var touch = e.changedTouches[0];
      var evt = doc.createEvent('MouseEvents');
      var eventType = 'click';
      if (Device.android && targetElement.nodeName.toLowerCase() === 'select') {
        eventType = 'mousedown';
      }
      evt.initMouseEvent(eventType, true, true, win, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
      evt.forwardedTouchEvent = true;

      if (app.device.ios && win.navigator.standalone) {
        // Fix the issue happens in iOS home screen apps where the wrong element is selected during a momentum scroll.
        // Upon tapping, we give the scrolling time to stop, then we grab the element based where the user tapped.
        setTimeout(function () {
          targetElement = doc.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          targetElement.dispatchEvent(evt);
        }, 10);
      } else {
        targetElement.dispatchEvent(evt);
      }
    }

    // Touch Handlers
    function handleTouchStart(e) {
      var this$1 = this;

      isMoved = false;
      tapHoldFired = false;
      if (e.targetTouches.length > 1) {
        if (activableElement) { removeActive(); }
        return true;
      }
      if (e.touches.length > 1 && activableElement) {
        removeActive();
      }
      if (params.tapHold) {
        if (tapHoldTimeout) { clearTimeout(tapHoldTimeout); }
        tapHoldTimeout = setTimeout(function () {
          if (e && e.touches && e.touches.length > 1) { return; }
          tapHoldFired = true;
          e.preventDefault();
          $(e.target).trigger('taphold');
        }, params.tapHoldDelay);
      }
      if (needsFastClickTimeOut) { clearTimeout(needsFastClickTimeOut); }
      needsFastClick = targetNeedsFastClick(e.target);

      if (!needsFastClick) {
        trackClick = false;
        return true;
      }
      if (Device.ios || (Device.android && 'getSelection' in win)) {
        var selection = win.getSelection();
        if (
          selection.rangeCount
          && selection.focusNode !== doc.body
          && (!selection.isCollapsed || doc.activeElement === selection.focusNode)
        ) {
          activeSelection = true;
          return true;
        }

        activeSelection = false;
      }
      if (Device.android) {
        if (androidNeedsBlur(e.target)) {
          doc.activeElement.blur();
        }
      }

      trackClick = true;
      targetElement = e.target;
      touchStartTime = (new Date()).getTime();
      touchStartX = e.targetTouches[0].pageX;
      touchStartY = e.targetTouches[0].pageY;

      // Detect scroll parent
      if (Device.ios) {
        scrollParent = undefined;
        $(targetElement).parents().each(function () {
          var parent = this$1;
          if (parent.scrollHeight > parent.offsetHeight && !scrollParent) {
            scrollParent = parent;
            scrollParent.f7ScrollTop = scrollParent.scrollTop;
          }
        });
      }
      if ((touchStartTime - lastClickTime) < params.fastClicksDelayBetweenClicks) {
        e.preventDefault();
      }

      if (params.activeState) {
        activableElement = findActivableElement(targetElement);
        // If it's inside a scrollable view, we don't trigger active-state yet,
        // because it can be a scroll instead. Based on the link:
        // http://labnote.beedesk.com/click-scroll-and-pseudo-active-on-mobile-webk
        if (!isInsideScrollableView(activableElement)) {
          addActive();
        } else {
          activeTimeout = setTimeout(addActive, 80);
        }
      }
      if (useRipple) {
        rippleTouchStart(targetElement, touchStartX, touchStartY);
      }
      return true;
    }
    function handleTouchMove(e) {
      if (!trackClick) { return; }
      var distance = params.fastClicksDistanceThreshold;
      if (distance) {
        var pageX = e.targetTouches[0].pageX;
        var pageY = e.targetTouches[0].pageY;
        if (Math.abs(pageX - touchStartX) > distance || Math.abs(pageY - touchStartY) > distance) {
          isMoved = true;
        }
      } else {
        isMoved = true;
      }
      if (isMoved) {
        trackClick = false;
        targetElement = null;
        isMoved = true;
        if (params.tapHold) {
          clearTimeout(tapHoldTimeout);
        }
        if (params.activeState) {
          clearTimeout(activeTimeout);
          removeActive();
        }
        if (useRipple) {
          rippleTouchMove();
        }
      }
    }
    function handleTouchEnd(e) {
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);

      var touchEndTime = (new Date()).getTime();

      if (!trackClick) {
        if (!activeSelection && needsFastClick) {
          if (!(Device.android && !e.cancelable) && e.cancelable) {
            e.preventDefault();
          }
        }
        return true;
      }

      if (doc.activeElement === e.target) {
        if (params.activeState) { removeActive(); }
        if (useRipple) {
          rippleTouchEnd();
        }
        return true;
      }

      if (!activeSelection) {
        e.preventDefault();
      }

      if ((touchEndTime - lastClickTime) < params.fastClicksDelayBetweenClicks) {
        setTimeout(removeActive, 0);
        return true;
      }

      lastClickTime = touchEndTime;

      trackClick = false;

      if (Device.ios && scrollParent) {
        if (scrollParent.scrollTop !== scrollParent.f7ScrollTop) {
          return false;
        }
      }

      // Add active-state here because, in a very fast tap, the timeout didn't
      // have the chance to execute. Removing active-state in a timeout gives
      // the chance to the animation execute.
      if (params.activeState) {
        addActive();
        setTimeout(removeActive, 0);
      }
      // Remove Ripple
      if (useRipple) {
        rippleTouchEnd();
      }

      // Trigger focus when required
      if (targetNeedsFocus(targetElement)) {
        if (Device.ios && Device.webView) {
          targetElement.focus();
          return false;
        }

        targetElement.focus();
      }

      // Blur active elements
      if (doc.activeElement && targetElement !== doc.activeElement && doc.activeElement !== doc.body && targetElement.nodeName.toLowerCase() !== 'label') {
        doc.activeElement.blur();
      }

      // Send click
      e.preventDefault();
      if (params.tapHoldPreventClicks && tapHoldFired) {
        return false;
      }
      sendClick(e);
      return false;
    }
    function handleTouchCancel() {
      trackClick = false;
      targetElement = null;

      // Remove Active State
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);
      if (params.activeState) {
        removeActive();
      }

      // Remove Ripple
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    function handleClick(e) {
      var allowClick = false;
      if (trackClick) {
        targetElement = null;
        trackClick = false;
        return true;
      }
      if ((e.target.type === 'submit' && e.detail === 0) || e.target.type === 'file') {
        return true;
      }
      if (!targetElement) {
        if (!isFormElement(e.target)) {
          allowClick = true;
        }
      }
      if (!needsFastClick) {
        allowClick = true;
      }
      if (doc.activeElement === targetElement) {
        allowClick = true;
      }
      if (e.forwardedTouchEvent) {
        allowClick = true;
      }
      if (!e.cancelable) {
        allowClick = true;
      }
      if (params.tapHold && params.tapHoldPreventClicks && tapHoldFired) {
        allowClick = false;
      }
      if (!allowClick) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (targetElement) {
          if (targetNeedsPrevent(targetElement) || isMoved) {
            e.preventDefault();
          }
        } else {
          e.preventDefault();
        }
        targetElement = null;
      }
      needsFastClickTimeOut = setTimeout(function () {
        needsFastClick = false;
      }, (Device.ios || Device.androidChrome ? 100 : 400));

      if (params.tapHold) {
        tapHoldTimeout = setTimeout(function () {
          tapHoldFired = false;
        }, (Device.ios || Device.androidChrome ? 100 : 400));
      }

      return allowClick;
    }

    function emitAppTouchEvent(name, e) {
      app.emit({
        events: name,
        data: [e],
      });
    }
    function appClick(e) {
      emitAppTouchEvent('click', e);
    }
    function appTouchStartActive(e) {
      emitAppTouchEvent('touchstart touchstart:active', e);
    }
    function appTouchMoveActive(e) {
      emitAppTouchEvent('touchmove touchmove:active', e);
    }
    function appTouchEndActive(e) {
      emitAppTouchEvent('touchend touchend:active', e);
    }
    function appTouchStartPassive(e) {
      emitAppTouchEvent('touchstart:passive', e);
    }
    function appTouchMovePassive(e) {
      emitAppTouchEvent('touchmove:passive', e);
    }
    function appTouchEndPassive(e) {
      emitAppTouchEvent('touchend:passive', e);
    }

    var passiveListener = Support.passiveListener ? { passive: true } : false;
    var activeListener = Support.passiveListener ? { passive: false } : false;

    doc.addEventListener('click', appClick, true);

    if (Support.passiveListener) {
      doc.addEventListener(app.touchEvents.start, appTouchStartActive, activeListener);
      doc.addEventListener(app.touchEvents.move, appTouchMoveActive, activeListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndActive, activeListener);

      doc.addEventListener(app.touchEvents.start, appTouchStartPassive, passiveListener);
      doc.addEventListener(app.touchEvents.move, appTouchMovePassive, passiveListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndPassive, passiveListener);
    } else {
      doc.addEventListener(app.touchEvents.start, function (e) {
        appTouchStartActive(e);
        appTouchStartPassive(e);
      }, false);
      doc.addEventListener(app.touchEvents.move, function (e) {
        appTouchMoveActive(e);
        appTouchMovePassive(e);
      }, false);
      doc.addEventListener(app.touchEvents.end, function (e) {
        appTouchEndActive(e);
        appTouchEndPassive(e);
      }, false);
    }

    if (Support.touch) {
      app.on('click', handleClick);
      app.on('touchstart', handleTouchStart);
      app.on('touchmove', handleTouchMove);
      app.on('touchend', handleTouchEnd);
      doc.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    } else if (params.activeState) {
      app.on('touchstart', handleMouseDown);
      app.on('touchmove', handleMouseMove);
      app.on('touchend', handleMouseUp);
    }
    doc.addEventListener('contextmenu', function (e) {
      if (params.disableContextMenu && (Device.ios || Device.android || Device.cordova)) {
        e.preventDefault();
      }
      if (useRipple) {
        if (activableElement) { removeActive(); }
        rippleTouchEnd();
      }
    });
  }

  var TouchModule = {
    name: 'touch',
    params: {
      touch: {
        // Fast clicks
        fastClicks: true,
        fastClicksDistanceThreshold: 10,
        fastClicksDelayBetweenClicks: 50,
        fastClicksExclude: '', // CSS selector
        // ContextMenu
        disableContextMenu: true,
        // Tap Hold
        tapHold: false,
        tapHoldDelay: 750,
        tapHoldPreventClicks: true,
        // Active State
        activeState: true,
        activeStateElements: 'a, button, label, span, .actions-button, .stepper-button, .stepper-button-plus, .stepper-button-minus',
        materialRipple: true,
        materialRippleElements: '.ripple, .link, .item-link, .links-list a, .button, button, .input-clear-button, .dialog-button, .tab-link, .item-radio, .item-checkbox, .actions-button, .searchbar-disable-button, .fab a, .checkbox, .radio, .data-table .sortable-cell:not(.input-cell), .notification-close-button, .stepper-button, .stepper-button-minus, .stepper-button-plus',
      },
    },
    instance: {
      touchEvents: {
        start: Support.touch ? 'touchstart' : 'mousedown',
        move: Support.touch ? 'touchmove' : 'mousemove',
        end: Support.touch ? 'touchend' : 'mouseup',
      },
    },
    on: {
      init: initTouch,
    },
  };

  /**
   * Expose `pathToRegexp`.
   */
  var pathToRegexp_1 = pathToRegexp;
  var parse_1 = parse;
  var compile_1 = compile;
  var tokensToFunction_1 = tokensToFunction;
  var tokensToRegExp_1 = tokensToRegExp;

  /**
   * Default configs.
   */
  var DEFAULT_DELIMITER = '/';
  var DEFAULT_DELIMITERS = './';

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
    // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
  ].join('|'), 'g');

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string}  str
   * @param  {Object=} options
   * @return {!Array}
   */
  function parse (str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
    var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
    var pathEscaped = false;
    var res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1];
        pathEscaped = true;
        continue
      }

      var prev = '';
      var next = str[index];
      var name = res[2];
      var capture = res[3];
      var group = res[4];
      var modifier = res[5];

      if (!pathEscaped && path.length) {
        var k = path.length - 1;

        if (delimiters.indexOf(path[k]) > -1) {
          prev = path[k];
          path = path.slice(0, k);
        }
      }

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path);
        path = '';
        pathEscaped = false;
      }

      var partial = prev !== '' && next !== undefined && next !== prev;
      var repeat = modifier === '+' || modifier === '*';
      var optional = modifier === '?' || modifier === '*';
      var delimiter = prev || defaultDelimiter;
      var pattern = capture || group;

      tokens.push({
        name: name || key++,
        prefix: prev,
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
      });
    }

    // Push any remaining characters.
    if (path || index < str.length) {
      tokens.push(path + str.substr(index));
    }

    return tokens
  }

  /**
   * Compile a string to a template function for the path.
   *
   * @param  {string}             str
   * @param  {Object=}            options
   * @return {!function(Object=, Object=)}
   */
  function compile (str, options) {
    return tokensToFunction(parse(str, options))
  }

  /**
   * Expose a method for transforming tokens into the path function.
   */
  function tokensToFunction (tokens) {
    // Compile all the tokens into regexps.
    var matches = new Array(tokens.length);

    // Compile all the patterns before compilation.
    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] === 'object') {
        matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
      }
    }

    return function (data, options) {
      var path = '';
      var encode = (options && options.encode) || encodeURIComponent;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          path += token;
          continue
        }

        var value = data ? data[token.name] : undefined;
        var segment;

        if (Array.isArray(value)) {
          if (!token.repeat) {
            throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
          }

          if (value.length === 0) {
            if (token.optional) { continue }

            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }

          for (var j = 0; j < value.length; j++) {
            segment = encode(value[j], token);

            if (!matches[i].test(segment)) {
              throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
            }

            path += (j === 0 ? token.prefix : token.delimiter) + segment;
          }

          continue
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          segment = encode(String(value), token);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
          }

          path += token.prefix + segment;
          continue
        }

        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) { path += token.prefix; }

          continue
        }

        throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
      }

      return path
    }
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options && options.sensitive ? '' : 'i'
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {Array=}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    if (!keys) { return path }

    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g);

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          pattern: null
        });
      }
    }

    return path
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}  tokens
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, keys, options) {
    options = options || {};

    var strict = options.strict;
    var start = options.start !== false;
    var end = options.end !== false;
    var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
    var delimiters = options.delimiters || DEFAULT_DELIMITERS;
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    var route = start ? '^' : '';
    var isEndDelimited = tokens.length === 0;

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
        isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
      } else {
        var capture = token.repeat
          ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
          : token.pattern;

        if (keys) { keys.push(token); }

        if (token.optional) {
          if (token.partial) {
            route += escapeString(token.prefix) + '(' + capture + ')?';
          } else {
            route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
          }
        } else {
          route += escapeString(token.prefix) + '(' + capture + ')';
        }
      }
    }

    if (end) {
      if (!strict) { route += '(?:' + delimiter + ')?'; }

      route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
    } else {
      if (!strict) { route += '(?:' + delimiter + '(?=' + endsWith + '))?'; }
      if (!isEndDelimited) { route += '(?=' + delimiter + '|' + endsWith + ')'; }
    }

    return new RegExp(route, flags(options))
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {Array=}                keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
    }

    return stringToRegexp(/** @type {string} */ (path), keys, options)
  }
  pathToRegexp_1.parse = parse_1;
  pathToRegexp_1.compile = compile_1;
  pathToRegexp_1.tokensToFunction = tokensToFunction_1;
  pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

  var History = {
    queue: [],
    clearQueue: function clearQueue() {
      if (History.queue.length === 0) { return; }
      var currentQueue = History.queue.shift();
      currentQueue();
    },
    routerQueue: [],
    clearRouterQueue: function clearRouterQueue() {
      if (History.routerQueue.length === 0) { return; }
      var currentQueue = History.routerQueue.pop();
      var router = currentQueue.router;
      var stateUrl = currentQueue.stateUrl;
      var action = currentQueue.action;

      var animate = router.params.animate;
      if (router.params.pushStateAnimate === false) { animate = false; }

      if (action === 'back') {
        router.back({ animate: animate, pushState: false });
      }
      if (action === 'load') {
        router.navigate(stateUrl, { animate: animate, pushState: false });
      }
    },
    handle: function handle(e) {
      if (History.blockPopstate) { return; }
      var app = this;
      // const mainView = app.views.main;
      var state = e.state;
      History.previousState = History.state;
      History.state = state;

      History.allowChange = true;
      History.clearQueue();

      state = History.state;
      if (!state) { state = {}; }

      app.views.forEach(function (view) {
        var router = view.router;
        var viewState = state[view.id];
        if (!viewState && view.params.pushState) {
          viewState = {
            url: view.router.history[0],
          };
        }
        if (!viewState) { return; }
        var stateUrl = viewState.url || undefined;

        var animate = router.params.animate;
        if (router.params.pushStateAnimate === false) { animate = false; }

        if (stateUrl !== router.url) {
          if (router.history.indexOf(stateUrl) >= 0) {
            // Go Back
            if (router.allowPageChange) {
              router.back({ animate: animate, pushState: false });
            } else {
              History.routerQueue.push({
                action: 'back',
                router: router,
              });
            }
          } else if (router.allowPageChange) {
            // Load page
            router.navigate(stateUrl, { animate: animate, pushState: false });
          } else {
            History.routerQueue.unshift({
              action: 'load',
              stateUrl: stateUrl,
              router: router,
            });
          }
        }
      });
    },
    initViewState: function initViewState(viewId, viewState) {
      var obj;

      var newState = Utils.extend({}, (History.state || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.replaceState(newState, '');
    },
    push: function push(viewId, viewState, url) {
      var obj;

      if (!History.allowChange) {
        History.queue.push(function () {
          History.push(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      var newState = Utils.extend({}, (History.previousState || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.pushState(newState, '', url);
    },
    replace: function replace(viewId, viewState, url) {
      var obj;

      if (!History.allowChange) {
        History.queue.push(function () {
          History.replace(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      var newState = Utils.extend({}, (History.previousState || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.replaceState(newState, '', url);
    },
    go: function go(index) {
      History.allowChange = false;
      win.history.go(index);
    },
    back: function back() {
      History.allowChange = false;
      win.history.back();
    },
    allowChange: true,
    previousState: {},
    state: win.history.state,
    blockPopstate: true,
    init: function init(app) {
      $(win).on('load', function () {
        setTimeout(function () {
          History.blockPopstate = false;
        }, 0);
      });

      if (doc.readyState && doc.readyState === 'complete') {
        History.blockPopstate = false;
      }

      $(win).on('popstate', History.handle.bind(app));
    },
  };

  function SwipeBack(r) {
    var router = r;
    var $el = router.$el;
    var $navbarEl = router.$navbarEl;
    var app = router.app;
    var params = router.params;
    var isTouched = false;
    var isMoved = false;
    var touchesStart = {};
    var isScrolling;
    var currentPage = [];
    var previousPage = [];
    var viewContainerWidth;
    var touchesDiff;
    var allowViewTouchMove = true;
    var touchStartTime;
    var currentNavbar = [];
    var previousNavbar = [];
    var currentNavElements;
    var previousNavElements;
    var activeNavBackIcon;
    var activeNavBackIconText;
    var previousNavBackIcon;
    // let previousNavBackIconText;
    var dynamicNavbar;
    var separateNavbar;
    var pageShadow;
    var pageOpacity;
    var navbarWidth;

    var paramsSwipeBackAnimateShadow = params[((app.theme) + "SwipeBackAnimateShadow")];
    var paramsSwipeBackAnimateOpacity = params[((app.theme) + "SwipeBackAnimateOpacity")];
    var paramsSwipeBackActiveArea = params[((app.theme) + "SwipeBackActiveArea")];
    var paramsSwipeBackThreshold = params[((app.theme) + "SwipeBackThreshold")];

    function handleTouchStart(e) {
      var swipeBackEnabled = params[((app.theme) + "SwipeBack")];
      if (!allowViewTouchMove || !swipeBackEnabled || isTouched || (app.swipeout && app.swipeout.el) || !router.allowPageChange) { return; }
      if ($(e.target).closest('.range-slider, .calendar-months').length > 0) { return; }
      isMoved = false;
      isTouched = true;
      isScrolling = undefined;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchStartTime = Utils.now();
      dynamicNavbar = router.dynamicNavbar;
      separateNavbar = router.separateNavbar;
    }
    function handleTouchMove(e) {
      if (!isTouched) { return; }
      var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x)) || (pageX < touchesStart.x && !app.rtl) || (pageX > touchesStart.x && app.rtl);
      }
      if (isScrolling || e.f7PreventSwipeBack || app.preventSwipeBack) {
        isTouched = false;
        return;
      }
      if (!isMoved) {
        // Calc values during first move fired
        var cancel = false;
        var target = $(e.target);

        var swipeout = target.closest('.swipeout');
        if (swipeout.length > 0) {
          if (!app.rtl && swipeout.find('.swipeout-actions-left').length > 0) { cancel = true; }
          if (app.rtl && swipeout.find('.swipeout-actions-right').length > 0) { cancel = true; }
        }

        currentPage = target.closest('.page');
        if (currentPage.hasClass('no-swipeback') || target.closest('.no-swipeback').length > 0) { cancel = true; }
        previousPage = $el.find('.page-previous:not(.stacked)');

        var notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        viewContainerWidth = $el.width();
        if (app.rtl) {
          notFromBorder = touchesStart.x < ($el.offset().left - $el[0].scrollLeft) + (viewContainerWidth - paramsSwipeBackActiveArea);
        } else {
          notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        }
        if (notFromBorder) { cancel = true; }
        if (previousPage.length === 0 || currentPage.length === 0) { cancel = true; }
        if (cancel) {
          isTouched = false;
          return;
        }

        if (paramsSwipeBackAnimateShadow) {
          pageShadow = currentPage.find('.page-shadow-effect');
          if (pageShadow.length === 0) {
            pageShadow = $('<div class="page-shadow-effect"></div>');
            currentPage.append(pageShadow);
          }
        }
        if (paramsSwipeBackAnimateOpacity) {
          pageOpacity = previousPage.find('.page-opacity-effect');
          if (pageOpacity.length === 0) {
            pageOpacity = $('<div class="page-opacity-effect"></div>');
            previousPage.append(pageOpacity);
          }
        }

        if (dynamicNavbar) {
          if (separateNavbar) {
            currentNavbar = $navbarEl.find('.navbar-current:not(.stacked)');
            previousNavbar = $navbarEl.find('.navbar-previous:not(.stacked)');
          } else {
            currentNavbar = currentPage.children('.navbar').children('.navbar-inner');
            previousNavbar = previousPage.children('.navbar').children('.navbar-inner');
          }
          navbarWidth = $navbarEl[0].offsetWidth;
          currentNavElements = currentNavbar.children('.left, .title, .right, .subnavbar, .fading');
          previousNavElements = previousNavbar.children('.left, .title, .right, .subnavbar, .fading');
          if (params.iosAnimateNavbarBackIcon) {
            if (currentNavbar.hasClass('sliding')) {
              activeNavBackIcon = currentNavbar.children('.left').find('.back .icon');
              activeNavBackIconText = currentNavbar.children('.left').find('.back span').eq(0);
            } else {
              activeNavBackIcon = currentNavbar.children('.left.sliding').find('.back .icon');
              activeNavBackIconText = currentNavbar.children('.left.sliding').find('.back span').eq(0);
            }
            if (previousNavbar.hasClass('sliding')) {
              previousNavBackIcon = previousNavbar.children('.left').find('.back .icon');
              // previousNavBackIconText = previousNavbar.children('left').find('.back span').eq(0);
            } else {
              previousNavBackIcon = previousNavbar.children('.left.sliding').find('.back .icon');
              // previousNavBackIconText = previousNavbar.children('.left.sliding').find('.back span').eq(0);
            }
          }
        }

        // Close/Hide Any Picker
        if ($('.sheet.modal-in').length > 0 && app.sheet) {
          app.sheet.close($('.sheet.modal-in'));
        }
      }
      e.f7PreventPanelSwipe = true;
      isMoved = true;
      app.preventSwipePanelBySwipeBack = true;
      e.preventDefault();

      // RTL inverter
      var inverter = app.rtl ? -1 : 1;

      // Touches diff
      touchesDiff = (pageX - touchesStart.x - paramsSwipeBackThreshold) * inverter;
      if (touchesDiff < 0) { touchesDiff = 0; }
      var percentage = touchesDiff / viewContainerWidth;

      // Swipe Back Callback
      var callbackData = {
        percentage: percentage,
        currentPageEl: currentPage[0],
        previousPageEl: previousPage[0],
        currentNavbarEl: currentNavbar[0],
        previousNavbarEl: previousNavbar[0],
      };
      $el.trigger('swipeback:move', callbackData);
      router.emit('swipebackMove', callbackData);

      // Transform pages
      var currentPageTranslate = touchesDiff * inverter;
      var previousPageTranslate = ((touchesDiff / 5) - (viewContainerWidth / 5)) * inverter;
      if (Device.pixelRatio === 1) {
        currentPageTranslate = Math.round(currentPageTranslate);
        previousPageTranslate = Math.round(previousPageTranslate);
      }

      currentPage.transform(("translate3d(" + currentPageTranslate + "px,0,0)"));
      if (paramsSwipeBackAnimateShadow) { pageShadow[0].style.opacity = 1 - (1 * percentage); }

      if (app.theme !== 'md') {
        previousPage.transform(("translate3d(" + previousPageTranslate + "px,0,0)"));
      }
      if (paramsSwipeBackAnimateOpacity) { pageOpacity[0].style.opacity = 1 - (1 * percentage); }

      // Dynamic Navbars Animation
      if (dynamicNavbar) {
        currentNavElements.each(function (index, navEl) {
          var $navEl = $(navEl);
          if (!$navEl.is('.subnavbar')) { $navEl[0].style.opacity = (1 - (Math.pow( percentage, 0.33 ))); }
          if ($navEl[0].className.indexOf('sliding') >= 0 || currentNavbar.hasClass('sliding')) {
            var activeNavTranslate = percentage * $navEl[0].f7NavbarRightOffset;
            if (Device.pixelRatio === 1) { activeNavTranslate = Math.round(activeNavTranslate); }
            $navEl.transform(("translate3d(" + activeNavTranslate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if ($navEl[0].className.indexOf('left') >= 0 && activeNavBackIcon.length > 0) {
                var iconTranslate = -activeNavTranslate;
                if (!separateNavbar) {
                  iconTranslate -= navbarWidth * percentage;
                }
                activeNavBackIcon.transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }
        });
        previousNavElements.each(function (index, navEl) {
          var $navEl = $(navEl);
          if (!$navEl.is('.subnavbar')) { $navEl[0].style.opacity = (Math.pow( percentage, 3 )); }
          if ($navEl[0].className.indexOf('sliding') >= 0 || previousNavbar.hasClass('sliding')) {
            var previousNavTranslate = $navEl[0].f7NavbarLeftOffset * (1 - percentage);
            if ($navEl[0].className.indexOf('title') >= 0 && activeNavBackIcon && activeNavBackIcon.length && activeNavBackIconText.length) {
              previousNavTranslate = ($navEl[0].f7NavbarLeftOffset + activeNavBackIconText[0].offsetLeft) * (1 - percentage);
            } else {
              previousNavTranslate = $navEl[0].f7NavbarLeftOffset * (1 - percentage);
            }
            if (Device.pixelRatio === 1) { previousNavTranslate = Math.round(previousNavTranslate); }
            $navEl.transform(("translate3d(" + previousNavTranslate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if ($navEl[0].className.indexOf('left') >= 0 && previousNavBackIcon.length > 0) {
                var iconTranslate = -previousNavTranslate;
                if (!separateNavbar) {
                  iconTranslate += (navbarWidth / 5) * (1 - percentage);
                }
                previousNavBackIcon.transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }
        });
      }
    }
    function handleTouchEnd() {
      app.preventSwipePanelBySwipeBack = false;
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      if (touchesDiff === 0) {
        $([currentPage[0], previousPage[0]]).transform('');
        if (pageShadow && pageShadow.length > 0) { pageShadow.remove(); }
        if (pageOpacity && pageOpacity.length > 0) { pageOpacity.remove(); }
        if (dynamicNavbar) {
          currentNavElements.transform('').css({ opacity: '' });
          previousNavElements.transform('').css({ opacity: '' });
          if (activeNavBackIcon && activeNavBackIcon.length > 0) { activeNavBackIcon.transform(''); }
          if (previousNavBackIcon && activeNavBackIcon.length > 0) { previousNavBackIcon.transform(''); }
        }
        return;
      }
      var timeDiff = Utils.now() - touchStartTime;
      var pageChanged = false;
      // Swipe back to previous page
      if (
        (timeDiff < 300 && touchesDiff > 10)
        || (timeDiff >= 300 && touchesDiff > viewContainerWidth / 2)
      ) {
        currentPage.removeClass('page-current').addClass(("page-next" + (app.theme === 'md' ? ' page-next-on-right' : '')));
        previousPage.removeClass('page-previous').addClass('page-current').removeAttr('aria-hidden');
        if (pageShadow) { pageShadow[0].style.opacity = ''; }
        if (pageOpacity) { pageOpacity[0].style.opacity = ''; }
        if (dynamicNavbar) {
          currentNavbar.removeClass('navbar-current').addClass('navbar-next');
          previousNavbar.removeClass('navbar-previous').addClass('navbar-current').removeAttr('aria-hidden');
        }
        pageChanged = true;
      }
      // Reset custom styles
      // Add transitioning class for transition-duration
      $([currentPage[0], previousPage[0]]).addClass('page-transitioning page-transitioning-swipeback').transform('');

      if (dynamicNavbar) {
        currentNavElements.css({ opacity: '' })
          .each(function (navElIndex, navEl) {
            var translate = pageChanged ? navEl.f7NavbarRightOffset : 0;
            var sliding = $(navEl);
            var iconTranslate = pageChanged ? -translate : 0;
            if (!separateNavbar && pageChanged) { iconTranslate -= navbarWidth; }
            sliding.transform(("translate3d(" + translate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if (sliding.hasClass('left') && activeNavBackIcon.length > 0) {
                activeNavBackIcon.addClass('navbar-transitioning').transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }).addClass('navbar-transitioning');

        previousNavElements.transform('').css({ opacity: '' }).each(function (navElIndex, navEl) {
          var translate = pageChanged ? 0 : navEl.f7NavbarLeftOffset;
          var sliding = $(navEl);
          var iconTranslate = pageChanged ? 0 : -translate;
          if (!separateNavbar && !pageChanged) { iconTranslate += navbarWidth / 5; }
          sliding.transform(("translate3d(" + translate + "px,0,0)"));
          if (params.iosAnimateNavbarBackIcon) {
            if (sliding.hasClass('left') && previousNavBackIcon.length > 0) {
              previousNavBackIcon.addClass('navbar-transitioning').transform(("translate3d(" + iconTranslate + "px,0,0)"));
            }
          }
        }).addClass('navbar-transitioning');
      }
      allowViewTouchMove = false;
      router.allowPageChange = false;

      // Swipe Back Callback
      var callbackData = {
        currentPage: currentPage[0],
        previousPage: previousPage[0],
        currentNavbar: currentNavbar[0],
        previousNavbar: previousNavbar[0],
      };

      if (pageChanged) {
        // Update Route
        router.currentRoute = previousPage[0].f7Page.route;
        router.currentPage = previousPage[0];

        // Page before animation callback
        router.pageCallback('beforeOut', currentPage, currentNavbar, 'current', 'next', { route: currentPage[0].f7Page.route, swipeBack: true });
        router.pageCallback('beforeIn', previousPage, previousNavbar, 'previous', 'current', { route: previousPage[0].f7Page.route, swipeBack: true });

        $el.trigger('swipeback:beforechange', callbackData);
        router.emit('swipebackBeforeChange', callbackData);
      } else {
        $el.trigger('swipeback:beforereset', callbackData);
        router.emit('swipebackBeforeReset', callbackData);
      }

      currentPage.transitionEnd(function () {
        $([currentPage[0], previousPage[0]]).removeClass('page-transitioning page-transitioning-swipeback');

        if (dynamicNavbar) {
          currentNavElements.removeClass('navbar-transitioning').css({ opacity: '' }).transform('');
          previousNavElements.removeClass('navbar-transitioning').css({ opacity: '' }).transform('');
          if (activeNavBackIcon && activeNavBackIcon.length > 0) { activeNavBackIcon.removeClass('navbar-transitioning'); }
          if (previousNavBackIcon && previousNavBackIcon.length > 0) { previousNavBackIcon.removeClass('navbar-transitioning'); }
        }
        allowViewTouchMove = true;
        router.allowPageChange = true;
        if (pageChanged) {
          // Update History
          if (router.history.length === 1) {
            router.history.unshift(router.url);
          }
          router.history.pop();
          router.saveHistory();

          // Update push state
          if (params.pushState) {
            History.back();
          }

          // Page after animation callback
          router.pageCallback('afterOut', currentPage, currentNavbar, 'current', 'next', { route: currentPage[0].f7Page.route, swipeBack: true });
          router.pageCallback('afterIn', previousPage, previousNavbar, 'previous', 'current', { route: previousPage[0].f7Page.route, swipeBack: true });

          // Remove Old Page
          if (params.stackPages && router.initialPages.indexOf(currentPage[0]) >= 0) {
            currentPage.addClass('stacked');
            if (separateNavbar) {
              currentNavbar.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', currentPage, currentNavbar, 'next', { swipeBack: true });
            router.removePage(currentPage);
            if (separateNavbar) {
              router.removeNavbar(currentNavbar);
            }
          }

          $el.trigger('swipeback:afterchange', callbackData);
          router.emit('swipebackAfterChange', callbackData);

          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

          if (params.preloadPreviousPage) {
            router.back(router.history[router.history.length - 2], { preload: true });
          }
        } else {
          $el.trigger('swipeback:afterreset', callbackData);
          router.emit('swipebackAfterReset', callbackData);
        }
        if (pageShadow && pageShadow.length > 0) { pageShadow.remove(); }
        if (pageOpacity && pageOpacity.length > 0) { pageOpacity.remove(); }
      });
    }

    function attachEvents() {
      var passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.on(app.touchEvents.start, handleTouchStart, passiveListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
    }
    function detachEvents() {
      var passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.off(app.touchEvents.start, handleTouchStart, passiveListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
    }

    attachEvents();

    router.on('routerDestroy', detachEvents);
  }

  function redirect (direction, route, options) {
    var router = this;
    var redirect = route.route.redirect;
    if (options.initial && router.params.pushState) {
      options.replaceState = true; // eslint-disable-line
      options.history = true; // eslint-disable-line
    }
    function redirectResolve(redirectUrl, redirectOptions) {
      if ( redirectOptions === void 0 ) redirectOptions = {};

      router.allowPageChange = true;
      router[direction](redirectUrl, Utils.extend({}, options, redirectOptions));
    }
    function redirectReject() {
      router.allowPageChange = true;
    }
    if (typeof redirect === 'function') {
      router.allowPageChange = false;
      var redirectUrl = redirect.call(router, route, redirectResolve, redirectReject);
      if (redirectUrl && typeof redirectUrl === 'string') {
        router.allowPageChange = true;
        return router[direction](redirectUrl, options);
      }
      return router;
    }
    return router[direction](redirect, options);
  }

  function processQueue(router, routerQueue, routeQueue, to, from, resolve, reject) {
    var queue = [];

    if (Array.isArray(routeQueue)) {
      queue.push.apply(queue, routeQueue);
    } else if (routeQueue && typeof routeQueue === 'function') {
      queue.push(routeQueue);
    }
    if (routerQueue) {
      if (Array.isArray(routerQueue)) {
        queue.push.apply(queue, routerQueue);
      } else {
        queue.push(routerQueue);
      }
    }

    function next() {
      if (queue.length === 0) {
        resolve();
        return;
      }
      var queueItem = queue.shift();

      queueItem.call(
        router,
        to,
        from,
        function () {
          next();
        },
        function () {
          reject();
        }
      );
    }
    next();
  }

  function processRouteQueue (to, from, resolve, reject) {
    var router = this;
    function enterNextRoute() {
      if (to && to.route && (router.params.routesBeforeEnter || to.route.beforeEnter)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeEnter,
          to.route.beforeEnter,
          to,
          from,
          function () {
            router.allowPageChange = true;
            resolve();
          },
          function () {
            reject();
          }
        );
      } else {
        resolve();
      }
    }
    function leaveCurrentRoute() {
      if (from && from.route && (router.params.routesBeforeLeave || from.route.beforeLeave)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeLeave,
          from.route.beforeLeave,
          to,
          from,
          function () {
            router.allowPageChange = true;
            enterNextRoute();
          },
          function () {
            reject();
          }
        );
      } else {
        enterNextRoute();
      }
    }
    leaveCurrentRoute();
  }

  function refreshPage() {
    var router = this;
    return router.navigate(router.currentRoute.url, {
      ignoreCache: true,
      reloadCurrent: true,
    });
  }

  function forward(el, forwardOptions) {
    if ( forwardOptions === void 0 ) forwardOptions = {};

    var router = this;
    var app = router.app;
    var view = router.view;

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      replaceState: false,
      history: true,
      reloadCurrent: router.params.reloadPages,
      reloadPrevious: false,
      reloadAll: false,
      clearPreviousHistory: false,
      on: {},
    }, forwardOptions);

    var currentRouteIsModal = router.currentRoute.modal;
    var modalType;
    if (!currentRouteIsModal) {
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach(function (modalLoadProp) {
        if (router.currentRoute && router.currentRoute.route && router.currentRoute.route[modalLoadProp]) {
          currentRouteIsModal = true;
          modalType = modalLoadProp;
        }
      });
    }

    if (currentRouteIsModal) {
      var modalToClose = router.currentRoute.modal
                           || router.currentRoute.route.modalInstance
                           || app[modalType].get();
      var previousUrl = router.history[router.history.length - 2];
      var previousRoute = router.findMatchingRoute(previousUrl);
      if (!previousRoute && previousUrl) {
        previousRoute = {
          url: previousUrl,
          path: previousUrl.split('?')[0],
          query: Utils.parseUrlQuery(previousUrl),
          route: {
            path: previousUrl.split('?')[0],
            url: previousUrl,
          },
        };
      }

      router.modalRemove(modalToClose);
    }

    var dynamicNavbar = router.dynamicNavbar;
    var separateNavbar = router.separateNavbar;

    var $viewEl = router.$el;
    var $newPage = $(el);
    var reload = options.reloadPrevious || options.reloadCurrent || options.reloadAll;
    var $oldPage;

    var $navbarEl;
    var $newNavbarInner;
    var $oldNavbarInner;

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    if (dynamicNavbar) {
      $newNavbarInner = $newPage.children('.navbar').children('.navbar-inner');
      if (separateNavbar) {
        $navbarEl = router.$navbarEl;
        if ($newNavbarInner.length > 0) {
          $newPage.children('.navbar').remove();
        }
        if ($newNavbarInner.length === 0 && $newPage[0].f7Page) {
          // Try from pageData
          $newNavbarInner = $newPage[0].f7Page.$navbarEl;
        }
      }
    }

    router.allowPageChange = false;
    if ($newPage.length === 0) {
      router.allowPageChange = true;
      return router;
    }

    // Pages In View
    var $pagesInView = $viewEl
      .children('.page:not(.stacked)')
      .filter(function (index, pageInView) { return pageInView !== $newPage[0]; });

    // Navbars In View
    var $navbarsInView;
    if (separateNavbar) {
      $navbarsInView = $navbarEl
        .children('.navbar-inner:not(.stacked)')
        .filter(function (index, navbarInView) { return navbarInView !== $newNavbarInner[0]; });
    }

    // Exit when reload previous and only 1 page in view so nothing ro reload
    if (options.reloadPrevious && $pagesInView.length < 2) {
      router.allowPageChange = true;
      return router;
    }

    // New Page
    var newPagePosition = 'next';
    if (options.reloadCurrent || options.reloadAll) {
      newPagePosition = 'current';
    } else if (options.reloadPrevious) {
      newPagePosition = 'previous';
    }
    $newPage
      .addClass(("page-" + newPagePosition))
      .removeClass('stacked');

    if (dynamicNavbar && $newNavbarInner.length) {
      $newNavbarInner
        .addClass(("navbar-" + newPagePosition))
        .removeClass('stacked');
    }

    // Find Old Page
    if (options.reloadCurrent) {
      $oldPage = $pagesInView.eq($pagesInView.length - 1);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 1);
        $oldNavbarInner = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadPrevious) {
      $oldPage = $pagesInView.eq($pagesInView.length - 2);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 2);
        $oldNavbarInner = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadAll) {
      $oldPage = $pagesInView.filter(function (index, pageEl) { return pageEl !== $newPage[0]; });
      if (separateNavbar) {
        $oldNavbarInner = $navbarsInView.filter(function (index, navbarEl) { return navbarEl !== $newNavbarInner[0]; });
      }
    } else {
      if ($pagesInView.length > 1) {
        var i = 0;
        for (i = 0; i < $pagesInView.length - 1; i += 1) {
          var oldNavbarInnerEl = app.navbar.getElByPage($pagesInView.eq(i));
          if (router.params.stackPages) {
            $pagesInView.eq(i).addClass('stacked');
            if (separateNavbar) {
              // $navbarsInView.eq(i).addClass('stacked');
              $(oldNavbarInnerEl).addClass('stacked');
            }
          } else {
            // Page remove event
            router.pageCallback('beforeRemove', $pagesInView[i], $navbarsInView && $navbarsInView[i], 'previous', undefined, options);
            router.removePage($pagesInView[i]);
            if (separateNavbar && oldNavbarInnerEl) {
              router.removeNavbar(oldNavbarInnerEl);
            }
          }
        }
      }
      $oldPage = $viewEl
        .children('.page:not(.stacked)')
        .filter(function (index, page) { return page !== $newPage[0]; });
      if (separateNavbar) {
        $oldNavbarInner = $navbarEl
          .children('.navbar-inner:not(.stacked)')
          .filter(function (index, navbarInner) { return navbarInner !== $newNavbarInner[0]; });
      }
    }
    if (dynamicNavbar && !separateNavbar) {
      $oldNavbarInner = $oldPage.children('.navbar').children('.navbar-inner');
    }

    // Push State
    if (router.params.pushState && (options.pushState || options.replaceState) && !options.reloadPrevious) {
      var pushStateRoot = router.params.pushStateRoot || '';
      History[options.reloadCurrent || options.reloadAll || options.replaceState ? 'replace' : 'push'](
        view.id,
        {
          url: options.route.url,
        },
        pushStateRoot + router.params.pushStateSeparator + options.route.url
      );
    }

    if (!options.reloadPrevious) {
      // Current Page & Navbar
      router.currentPageEl = $newPage[0];
      if (dynamicNavbar && $newNavbarInner.length) {
        router.currentNavbarEl = $newNavbarInner[0];
      } else {
        delete router.currentNavbarEl;
      }

      // Current Route
      router.currentRoute = options.route;
    }

    // Update router history
    var url = options.route.url;

    if (options.history) {
      if ((options.reloadCurrent && router.history.length) > 0 || options.replaceState) {
        router.history[router.history.length - (options.reloadPrevious ? 2 : 1)] = url;
      } else if (options.reloadPrevious) {
        router.history[router.history.length - 2] = url;
      } else if (options.reloadAll) {
        router.history = [url];
      } else {
        router.history.push(url);
      }
    }
    router.saveHistory();

    // Insert new page and navbar
    var newPageInDom = $newPage.parents(doc).length > 0;
    var f7Component = $newPage[0].f7Component;
    if (options.reloadPrevious) {
      if (f7Component && !newPageInDom) {
        f7Component.$mount(function (componentEl) {
          $(componentEl).insertBefore($oldPage);
        });
      } else {
        $newPage.insertBefore($oldPage);
      }
      if (separateNavbar && $newNavbarInner.length) {
        if ($oldNavbarInner.length) {
          $newNavbarInner.insertBefore($oldNavbarInner);
        } else {
          if (!router.$navbarEl.parents(doc).length) {
            router.$el.prepend(router.$navbarEl);
          }
          $navbarEl.append($newNavbarInner);
        }
      }
    } else {
      if ($oldPage.next('.page')[0] !== $newPage[0]) {
        if (f7Component && !newPageInDom) {
          f7Component.$mount(function (componentEl) {
            $viewEl.append(componentEl);
          });
        } else {
          $viewEl.append($newPage[0]);
        }
      }
      if (separateNavbar && $newNavbarInner.length) {
        if (!router.$navbarEl.parents(doc).length) {
          router.$el.prepend(router.$navbarEl);
        }
        $navbarEl.append($newNavbarInner[0]);
      }
    }
    if (!newPageInDom) {
      router.pageCallback('mounted', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);
    }

    // Remove old page
    if (options.reloadCurrent && $oldPage.length > 0) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    } else if (options.reloadAll) {
      $oldPage.each(function (index, pageEl) {
        var $oldPageEl = $(pageEl);
        var $oldNavbarInnerEl = $(app.navbar.getElByPage($oldPageEl));
        if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
          $oldPageEl.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInnerEl.addClass('stacked');
          }
        } else {
          // Page remove event
          router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarInner && $oldNavbarInner.eq(index), 'previous', undefined, options);
          router.removePage($oldPageEl);
          if (separateNavbar && $oldNavbarInnerEl.length) {
            router.removeNavbar($oldNavbarInnerEl);
          }
        }
      });
    } else if (options.reloadPrevious) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    }

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }

    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);

    if (options.reloadCurrent || options.reloadAll) {
      router.allowPageChange = true;
      router.pageCallback('beforeIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      router.pageCallback('afterIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      if (options.reloadCurrent && options.clearPreviousHistory) { router.clearPreviousHistory(); }
      return router;
    }
    if (options.reloadPrevious) {
      router.allowPageChange = true;
      return router;
    }

    // Before animation event
    router.pageCallback('beforeIn', $newPage, $newNavbarInner, 'next', 'current', options);
    router.pageCallback('beforeOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

    // Animation
    function afterAnimation() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $newPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $oldPage.removeClass(pageClasses).addClass('page-previous').attr('aria-hidden', 'true');
      if (dynamicNavbar) {
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-previous').attr('aria-hidden', 'true');
      }
      // After animation event
      router.allowPageChange = true;
      router.pageCallback('afterIn', $newPage, $newNavbarInner, 'next', 'current', options);
      router.pageCallback('afterOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

      var keepOldPage = app.theme === 'ios' ? (router.params.preloadPreviousPage || router.params.iosSwipeBack) : router.params.preloadPreviousPage;
      if (!keepOldPage) {
        if ($newPage.hasClass('smart-select-page') || $newPage.hasClass('photo-browser-page') || $newPage.hasClass('autocomplete-page')) {
          keepOldPage = true;
        }
      }
      if (!keepOldPage) {
        if (router.params.stackPages) {
          $oldPage.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInner.addClass('stacked');
          }
        } else if (!($newPage.attr('data-name') && $newPage.attr('data-name') === 'smart-select-page')) {
          // Remove event
          router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
          router.removePage($oldPage);
          if (separateNavbar && $oldNavbarInner.length) {
            router.removeNavbar($oldNavbarInner);
          }
        }
      }
      if (options.clearPreviousHistory) { router.clearPreviousHistory(); }
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      if (router.params.pushState) {
        History.clearRouterQueue();
      }
    }
    function setPositionClasses() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $oldPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $newPage.removeClass(pageClasses).addClass('page-next').removeAttr('aria-hidden');
      if (dynamicNavbar) {
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-next').removeAttr('aria-hidden');
      }
    }
    if (options.animate) {
      var delay = router.app.theme === 'md' ? router.params.materialPageLoadDelay : router.params.iosPageLoadDelay;
      if (delay) {
        setTimeout(function () {
          setPositionClasses();
          router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', function () {
            afterAnimation();
          });
        }, delay);
      } else {
        setPositionClasses();
        router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', function () {
          afterAnimation();
        });
      }
    } else {
      afterAnimation();
    }
    return router;
  }
  function load(loadParams, loadOptions, ignorePageChange) {
    if ( loadParams === void 0 ) loadParams = {};
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    if (!router.allowPageChange && !ignorePageChange) { return router; }
    var params = loadParams;
    var options = loadOptions;
    var url = params.url;
    var content = params.content;
    var el = params.el;
    var pageName = params.pageName;
    var template = params.template;
    var templateUrl = params.templateUrl;
    var component = params.component;
    var componentUrl = params.componentUrl;

    if (!options.reloadCurrent
      && options.route
      && options.route.route
      && options.route.route.parentPath
      && router.currentRoute.route
      && router.currentRoute.route.parentPath === options.route.route.parentPath) {
      // Do something nested
      if (options.route.url === router.url) {
        return false;
      }
      // Check for same params
      var sameParams = Object.keys(options.route.params).length === Object.keys(router.currentRoute.params).length;
      if (sameParams) {
        // Check for equal params name
        Object.keys(options.route.params).forEach(function (paramName) {
          if (
            !(paramName in router.currentRoute.params)
            || (router.currentRoute.params[paramName] !== options.route.params[paramName])
          ) {
            sameParams = false;
          }
        });
      }
      if (sameParams) {
        if (options.route.route.tab) {
          return router.tabLoad(options.route.route.tab, options);
        }
        return false;
      }
    }

    if (
      options.route
      && options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      router.allowPageChange = true;
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
      Utils.extend(options.route, { route: { url: url, path: url } });
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.forward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.forward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.forward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.forward(router.$el.children((".page[data-name=\"" + pageName + "\"]")).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
      if (router.xhr) {
        router.xhr.abort();
        router.xhr = false;
      }
      router.xhrRequest(url, options)
        .then(function (pageContent) {
          router.forward(router.getPageEl(pageContent), options);
        })
        .catch(function () {
          router.allowPageChange = true;
        });
    }
    return router;
  }
  function navigate(navigateParams, navigateOptions) {
    if ( navigateOptions === void 0 ) navigateOptions = {};

    var router = this;
    var url;
    var createRoute;
    var name;
    var query;
    var params;
    var route;
    if (typeof navigateParams === 'string') {
      url = navigateParams;
    } else {
      url = navigateParams.url;
      createRoute = navigateParams.route;
      name = navigateParams.name;
      query = navigateParams.query;
      params = navigateParams.params;
    }
    if (name) {
      // find route by name
      route = router.findRouteByKey('name', name);
      if (!route) {
        throw new Error(("Framework7: route with name \"" + name + "\" not found"));
      }
      url = router.constructRouteUrl(route, { params: params, query: query });
      if (url) {
        return router.navigate(url, navigateOptions);
      }
      throw new Error(("Framework7: can't construct URL for route with name \"" + name + "\""));
    }
    var app = router.app;
    if (!router.view) {
      if (app.views.main) {
        app.views.main.router.navigate(url, navigateOptions);
      }
      return router;
    }
    if (url === '#' || url === '') {
      return router;
    }

    var navigateUrl = url.replace('./', '');
    if (navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      var currentPath = router.currentRoute.parentPath || router.currentRoute.path;
      navigateUrl = ((currentPath ? (currentPath + "/") : '/') + navigateUrl)
        .replace('///', '/')
        .replace('//', '/');
    }
    if (createRoute) {
      route = Utils.extend(router.parseRouteUrl(navigateUrl), {
        route: Utils.extend({}, createRoute),
      });
    } else {
      route = router.findMatchingRoute(navigateUrl);
    }

    if (!route) {
      return router;
    }

    if (route.route.redirect) {
      return redirect.call(router, 'navigate', route, navigateOptions);
    }


    var options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions, { route: route });
    } else {
      Utils.extend(options, navigateOptions, { route: route });
    }

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    function resolve() {
      var routerLoaded = false;
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach(function (modalLoadProp) {
        if (route.route[modalLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.modalLoad(modalLoadProp, route, options);
        }
      });
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach(function (pageLoadProp) {
        var obj;

        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.load(( obj = {}, obj[pageLoadProp] = route.route[pageLoadProp], obj ), options);
        }
      });
      if (routerLoaded) { return; }
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        var resolvedAsModal = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) { route.context = resolveOptions.context; }
          else { route.context = Utils.extend({}, route.context, resolveOptions.context); }
          options.route.context = route.context;
        }
        ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach(function (modalLoadProp) {
          if (resolveParams[modalLoadProp]) {
            resolvedAsModal = true;
            var modalRoute = Utils.extend({}, route, { route: resolveParams });
            router.allowPageChange = true;
            router.modalLoad(modalLoadProp, modalRoute, Utils.extend(options, resolveOptions));
          }
        });
        if (resolvedAsModal) { return; }
        router.load(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;

        route.route.async.call(router, route, router.currentRoute, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    processRouteQueue.call(
      router,
      route,
      router.currentRoute,
      function () {
        resolve();
      },
      function () {
        reject();
      }
    );

    // Return Router
    return router;
  }

  function tabLoad(tabRoute, loadOptions) {
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      parentPageEl: null,
      preload: false,
      on: {},
    }, loadOptions);

    var currentRoute;
    var previousRoute;
    if (options.route) {
      // Set Route
      if (!options.preload && options.route !== router.currentRoute) {
        previousRoute = router.previousRoute;
        router.currentRoute = options.route;
      }
      if (options.preload) {
        currentRoute = options.route;
        previousRoute = router.currentRoute;
      } else {
        currentRoute = router.currentRoute;
        if (!previousRoute) { previousRoute = router.previousRoute; }
      }

      // Update Browser History
      if (router.params.pushState && options.pushState && !options.reloadPrevious) {
        History.replace(
          router.view.id,
          {
            url: options.route.url,
          },
          (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
        );
      }

      // Update Router History
      if (options.history) {
        router.history[Math.max(router.history.length - 1, 0)] = options.route.url;
        router.saveHistory();
      }
    }

    // Show Tab
    var $parentPageEl = $(options.parentPageEl || router.currentPageEl);
    var tabEl;
    if ($parentPageEl.length && $parentPageEl.find(("#" + (tabRoute.id))).length) {
      tabEl = $parentPageEl.find(("#" + (tabRoute.id))).eq(0);
    } else if (router.view.selector) {
      tabEl = (router.view.selector) + " #" + (tabRoute.id);
    } else {
      tabEl = "#" + (tabRoute.id);
    }
    var tabShowResult = router.app.tab.show({
      tabEl: tabEl,
      animate: options.animate,
      tabRoute: options.route,
    });

    var $newTabEl = tabShowResult.$newTabEl;
    var $oldTabEl = tabShowResult.$oldTabEl;
    var animated = tabShowResult.animated;
    var onTabsChanged = tabShowResult.onTabsChanged;

    if ($newTabEl && $newTabEl.parents('.page').length > 0 && options.route) {
      var tabParentPageData = $newTabEl.parents('.page')[0].f7Page;
      if (tabParentPageData && options.route) {
        tabParentPageData.route = options.route;
      }
    }

    // Tab Content Loaded
    function onTabLoaded(contentEl) {
      // Remove theme elements
      router.removeThemeElements($newTabEl);

      var tabEventTarget = $newTabEl;
      if (typeof contentEl !== 'string') { tabEventTarget = $(contentEl); }

      tabEventTarget.trigger('tab:init tab:mounted', tabRoute);
      router.emit('tabInit tabMounted', $newTabEl[0], tabRoute);

      if ($oldTabEl && $oldTabEl.length) {
        if (animated) {
          onTabsChanged(function () {
            router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
            if (router.params.unloadTabContent) {
              router.tabRemove($oldTabEl, $newTabEl, tabRoute);
            }
          });
        } else {
          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
          if (router.params.unloadTabContent) {
            router.tabRemove($oldTabEl, $newTabEl, tabRoute);
          }
        }
      }
    }

    if ($newTabEl[0].f7RouterTabLoaded) {
      if (!$oldTabEl || !$oldTabEl.length) { return router; }
      if (animated) {
        onTabsChanged(function () {
          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
        });
      } else {
        router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
      }
      return router;
    }

    // Load Tab Content
    function loadTab(loadTabParams, loadTabOptions) {
      // Load Tab Props
      var url = loadTabParams.url;
      var content = loadTabParams.content;
      var el = loadTabParams.el;
      var template = loadTabParams.template;
      var templateUrl = loadTabParams.templateUrl;
      var component = loadTabParams.component;
      var componentUrl = loadTabParams.componentUrl;
      // Component/Template Callbacks
      function resolve(contentEl) {
        router.allowPageChange = true;
        if (!contentEl) { return; }
        if (typeof contentEl === 'string') {
          $newTabEl.html(contentEl);
        } else {
          $newTabEl.html('');
          if (contentEl.f7Component) {
            contentEl.f7Component.$mount(function (componentEl) {
              $newTabEl.append(componentEl);
            });
          } else {
            $newTabEl.append(contentEl);
          }
        }
        $newTabEl[0].f7RouterTabLoaded = true;
        onTabLoaded(contentEl);
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }

      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.tabTemplateLoader(template, templateUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (el) {
        resolve(el);
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.tabComponentLoader($newTabEl[0], component, componentUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.xhrRequest(url, loadTabOptions)
          .then(function (tabContent) {
            resolve(tabContent);
          })
          .catch(function () {
            router.allowPageChange = true;
          });
      }
    }

    ('url content component el componentUrl template templateUrl').split(' ').forEach(function (tabLoadProp) {
      var obj;

      if (tabRoute[tabLoadProp]) {
        loadTab(( obj = {}, obj[tabLoadProp] = tabRoute[tabLoadProp], obj ), options);
      }
    });

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadTab(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (tabRoute.async) {
      tabRoute.async.call(router, currentRoute, previousRoute, asyncResolve, asyncReject);
    }

    return router;
  }
  function tabRemove($oldTabEl, $newTabEl, tabRoute) {
    var router = this;

    var hasTabComponentChild;
    if ($oldTabEl[0]) {
      $oldTabEl[0].f7RouterTabLoaded = false;
      delete $oldTabEl[0].f7RouterTabLoaded;
    }
    $oldTabEl.children().each(function (index, tabChild) {
      if (tabChild.f7Component) {
        hasTabComponentChild = true;
        $(tabChild).trigger('tab:beforeremove', tabRoute);
        tabChild.f7Component.$destroy();
      }
    });
    if (!hasTabComponentChild) {
      $oldTabEl.trigger('tab:beforeremove', tabRoute);
    }
    router.emit('tabBeforeRemove', $oldTabEl[0], $newTabEl[0], tabRoute);
    router.removeTabContent($oldTabEl[0], tabRoute);
  }

  function modalLoad(modalType, route, loadOptions) {
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    var app = router.app;
    var isPanel = modalType === 'panel';
    var modalOrPanel = isPanel ? 'panel' : 'modal';

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      on: {},
    }, loadOptions);

    var modalParams = Utils.extend({}, route.route[modalType]);
    var modalRoute = route.route;

    function onModalLoaded() {
      // Create Modal
      var modal = app[modalType].create(modalParams);
      modalRoute.modalInstance = modal;

      var hasEl = modal.el;

      function closeOnSwipeBack() {
        modal.close();
      }
      modal.on((modalOrPanel + "Open"), function () {
        if (!hasEl) {
          // Remove theme elements
          router.removeThemeElements(modal.el);

          // Emit events
          modal.$el.trigger(((modalType.toLowerCase()) + ":init " + (modalType.toLowerCase()) + ":mounted"), route, modal);
          router.emit(((!isPanel ? 'modalInit' : '') + " " + modalType + "Init " + modalType + "Mounted"), modal.el, route, modal);
        }
        router.once('swipeBackMove', closeOnSwipeBack);
      });
      modal.on((modalOrPanel + "Close"), function () {
        router.off('swipeBackMove', closeOnSwipeBack);
        if (!modal.closeByRouter) {
          router.back();
        }
      });

      modal.on((modalOrPanel + "Closed"), function () {
        modal.$el.trigger(((modalType.toLowerCase()) + ":beforeremove"), route, modal);
        modal.emit(("" + (!isPanel ? 'modalBeforeRemove ' : '') + modalType + "BeforeRemove"), modal.el, route, modal);
        var modalComponent = modal.el.f7Component;
        if (modalComponent) {
          modalComponent.$destroy();
        }
        Utils.nextTick(function () {
          if (modalComponent || modalParams.component) {
            router.removeModal(modal.el);
          }
          modal.destroy();
          delete modalRoute.modalInstance;
        });
      });

      if (options.route) {
        // Update Browser History
        if (router.params.pushState && options.pushState) {
          History.push(
            router.view.id,
            {
              url: options.route.url,
              modal: modalType,
            },
            (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
          );
        }

        // Set Route
        if (options.route !== router.currentRoute) {
          router.currentRoute = Utils.extend(options.route, { modal: modal });
        }

        // Update Router History
        if (options.history) {
          router.history.push(options.route.url);
          router.saveHistory();
        }
      }

      if (hasEl) {
        // Remove theme elements
        router.removeThemeElements(modal.el);

        // Emit events
        modal.$el.trigger(((modalType.toLowerCase()) + ":init " + (modalType.toLowerCase()) + ":mounted"), route, modal);
        router.emit((modalOrPanel + "Init " + modalType + "Init " + modalType + "Mounted"), modal.el, route, modal);
      }

      // Open
      modal.open();
    }

    // Load Modal Content
    function loadModal(loadModalParams, loadModalOptions) {
      // Load Modal Props
      var url = loadModalParams.url;
      var content = loadModalParams.content;
      var template = loadModalParams.template;
      var templateUrl = loadModalParams.templateUrl;
      var component = loadModalParams.component;
      var componentUrl = loadModalParams.componentUrl;

      // Component/Template Callbacks
      function resolve(contentEl) {
        if (contentEl) {
          if (typeof contentEl === 'string') {
            modalParams.content = contentEl;
          } else if (contentEl.f7Component) {
            contentEl.f7Component.$mount(function (componentEl) {
              modalParams.el = componentEl;
              app.root.append(componentEl);
            });
          } else {
            modalParams.el = contentEl;
          }
          onModalLoaded();
        }
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }

      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.modalTemplateLoader(template, templateUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.modalComponentLoader(app.root[0], component, componentUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.xhrRequest(url, loadModalOptions)
          .then(function (modalContent) {
            modalParams.content = modalContent;
            onModalLoaded();
          })
          .catch(function () {
            router.allowPageChange = true;
          });
      } else {
        onModalLoaded();
      }
    }

    var foundLoadProp;
    ('url content component el componentUrl template templateUrl').split(' ').forEach(function (modalLoadProp) {
      var obj;

      if (modalParams[modalLoadProp] && !foundLoadProp) {
        foundLoadProp = true;
        loadModal(( obj = {}, obj[modalLoadProp] = modalParams[modalLoadProp], obj ), options);
      }
    });
    if (!foundLoadProp && modalType === 'actions') {
      onModalLoaded();
    }

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadModal(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (modalParams.async) {
      modalParams.async.call(router, options.route, router.currentRoute, asyncResolve, asyncReject);
    }
    return router;
  }
  function modalRemove(modal) {
    Utils.extend(modal, { closeByRouter: true });
    modal.close();
  }

  function backward(el, backwardOptions) {
    var router = this;
    var app = router.app;
    var view = router.view;

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
    }, backwardOptions);

    var dynamicNavbar = router.dynamicNavbar;
    var separateNavbar = router.separateNavbar;

    var $newPage = $(el);
    var $oldPage = router.$el.children('.page-current');

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    var $navbarEl;
    var $newNavbarInner;
    var $oldNavbarInner;

    if (dynamicNavbar) {
      $newNavbarInner = $newPage.children('.navbar').children('.navbar-inner');
      if (separateNavbar) {
        $navbarEl = router.$navbarEl;
        if ($newNavbarInner.length > 0) {
          $newPage.children('.navbar').remove();
        }
        if ($newNavbarInner.length === 0 && $newPage[0].f7Page) {
          // Try from pageData
          $newNavbarInner = $newPage[0].f7Page.$navbarEl;
        }
        $oldNavbarInner = $navbarEl.find('.navbar-current');
      } else {
        $oldNavbarInner = $oldPage.children('.navbar').children('.navbar-inner');
      }
    }

    router.allowPageChange = false;
    if ($newPage.length === 0 || $oldPage.length === 0) {
      router.allowPageChange = true;
      return router;
    }

    // Remove theme elements
    router.removeThemeElements($newPage);

    // New Page
    $newPage
      .addClass('page-previous')
      .removeClass('stacked')
      .removeAttr('aria-hidden');

    if (dynamicNavbar && $newNavbarInner.length > 0) {
      $newNavbarInner
        .addClass('navbar-previous')
        .removeClass('stacked')
        .removeAttr('aria-hidden');
    }


    // Remove previous page in case of "forced"
    var backIndex;
    if (options.force) {
      if ($oldPage.prev('.page-previous:not(.stacked)').length > 0 || $oldPage.prev('.page-previous').length === 0) {
        if (router.history.indexOf(options.route.url) >= 0) {
          backIndex = router.history.length - router.history.indexOf(options.route.url) - 1;
          router.history = router.history.slice(0, router.history.indexOf(options.route.url) + 2);
          view.history = router.history;
        } else if (router.history[[router.history.length - 2]]) {
          router.history[router.history.length - 2] = options.route.url;
        } else {
          router.history.unshift(router.url);
        }

        if (backIndex && router.params.stackPages) {
          $oldPage.prevAll('.page-previous').each(function (index, pageToRemove) {
            var $pageToRemove = $(pageToRemove);
            var $navbarToRemove;
            if (separateNavbar) {
              // $navbarToRemove = $oldNavbarInner.prevAll('.navbar-previous').eq(index);
              $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
            }
            if ($pageToRemove[0] !== $newPage[0] && $pageToRemove.index() > $newPage.index()) {
              if (router.initialPages.indexOf($pageToRemove[0]) >= 0) {
                $pageToRemove.addClass('stacked');
                if (separateNavbar) {
                  $navbarToRemove.addClass('stacked');
                }
              } else {
                router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
                router.removePage($pageToRemove);
                if (separateNavbar && $navbarToRemove.length > 0) {
                  router.removeNavbar($navbarToRemove);
                }
              }
            }
          });
        } else {
          var $pageToRemove = $oldPage.prev('.page-previous:not(.stacked)');
          var $navbarToRemove;
          if (separateNavbar) {
            // $navbarToRemove = $oldNavbarInner.prev('.navbar-inner:not(.stacked)');
            $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf($pageToRemove[0]) >= 0) {
            $pageToRemove.addClass('stacked');
            $navbarToRemove.addClass('stacked');
          } else if ($pageToRemove.length > 0) {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
            router.removePage($pageToRemove);
            if (separateNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        }
      }
    }

    // Insert new page
    var newPageInDom = $newPage.parents(doc).length > 0;
    var f7Component = $newPage[0].f7Component;

    function insertPage() {
      if ($newPage.next($oldPage).length === 0) {
        if (!newPageInDom && f7Component) {
          f7Component.$mount(function (componentEl) {
            $(componentEl).insertBefore($oldPage);
          });
        } else {
          $newPage.insertBefore($oldPage);
        }
      }
      if (separateNavbar && $newNavbarInner.length) {
        $newNavbarInner.insertBefore($oldNavbarInner);
        if ($oldNavbarInner.length > 0) {
          $newNavbarInner.insertBefore($oldNavbarInner);
        } else {
          if (!router.$navbarEl.parents(doc).length) {
            router.$el.prepend(router.$navbarEl);
          }
          $navbarEl.append($newNavbarInner);
        }
      }
      if (!newPageInDom) {
        router.pageCallback('mounted', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);
      }
    }

    if (options.preload) {
      // Insert Page
      insertPage();
      // Tab route
      if (options.route.route.tab) {
        router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
          history: false,
          pushState: false,
          preload: true,
        }));
      }
      // Page init and before init events
      router.pageCallback('init', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);
      if ($newPage.prevAll('.page-previous:not(.stacked)').length > 0) {
        $newPage.prevAll('.page-previous:not(.stacked)').each(function (index, pageToRemove) {
          var $pageToRemove = $(pageToRemove);
          var $navbarToRemove;
          if (separateNavbar) {
            // $navbarToRemove = $newNavbarInner.prevAll('.navbar-previous:not(.stacked)').eq(index);
            $navbarToRemove = $(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf(pageToRemove) >= 0) {
            $pageToRemove.addClass('stacked');
            if (separateNavbar) {
              $navbarToRemove.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined);
            router.removePage($pageToRemove);
            if (separateNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        });
      }
      router.allowPageChange = true;
      return router;
    }

    // History State
    if (!(Device.ie || Device.edge || (Device.firefox && !Device.ios))) {
      if (router.params.pushState && options.pushState) {
        if (backIndex) { History.go(-backIndex); }
        else { History.back(); }
      }
    }

    // Update History
    if (router.history.length === 1) {
      router.history.unshift(router.url);
    }
    router.history.pop();
    router.saveHistory();

    // Current Page & Navbar
    router.currentPageEl = $newPage[0];
    if (dynamicNavbar && $newNavbarInner.length) {
      router.currentNavbarEl = $newNavbarInner[0];
    } else {
      delete router.currentNavbarEl;
    }

    // Current Route
    router.currentRoute = options.route;

    // History State
    if (Device.ie || Device.edge || (Device.firefox && !Device.ios)) {
      if (router.params.pushState && options.pushState) {
        if (backIndex) { History.go(-backIndex); }
        else { History.back(); }
      }
    }

    // Insert Page
    insertPage();

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }

    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);

    // Before animation callback
    router.pageCallback('beforeIn', $newPage, $newNavbarInner, 'previous', 'current', options);
    router.pageCallback('beforeOut', $oldPage, $oldNavbarInner, 'current', 'next', options);

    // Animation
    function afterAnimation() {
      // Set classes
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $newPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $oldPage.removeClass(pageClasses).addClass('page-next').attr('aria-hidden', 'true');
      if (dynamicNavbar) {
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-next').attr('aria-hidden', 'true');
      }

      // After animation event
      router.pageCallback('afterIn', $newPage, $newNavbarInner, 'previous', 'current', options);
      router.pageCallback('afterOut', $oldPage, $oldNavbarInner, 'current', 'next', options);

      // Remove Old Page
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'next', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }

      router.allowPageChange = true;
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      // Preload previous page
      var preloadPreviousPage = app.theme === 'ios' ? (router.params.preloadPreviousPage || router.params.iosSwipeBack) : router.params.preloadPreviousPage;
      if (preloadPreviousPage && router.history[router.history.length - 2]) {
        router.back(router.history[router.history.length - 2], { preload: true });
      }
      if (router.params.pushState) {
        History.clearRouterQueue();
      }
    }

    function setPositionClasses() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $oldPage.removeClass(pageClasses).addClass('page-current');
      $newPage.removeClass(pageClasses).addClass('page-previous').removeAttr('aria-hidden');
      if (dynamicNavbar) {
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-current');
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-previous').removeAttr('aria-hidden');
      }
    }

    if (options.animate) {
      setPositionClasses();
      router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'backward', function () {
        afterAnimation();
      });
    } else {
      afterAnimation();
    }

    return router;
  }
  function loadBack(backParams, backOptions, ignorePageChange) {
    var router = this;

    if (!router.allowPageChange && !ignorePageChange) { return router; }
    var params = backParams;
    var options = backOptions;
    var url = params.url;
    var content = params.content;
    var el = params.el;
    var pageName = params.pageName;
    var template = params.template;
    var templateUrl = params.templateUrl;
    var component = params.component;
    var componentUrl = params.componentUrl;

    if (
      options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.backward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.backward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.backward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.backward(router.$el.children((".page[data-name=\"" + pageName + "\"]")).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
      if (router.xhr) {
        router.xhr.abort();
        router.xhr = false;
      }
      router.xhrRequest(url, options)
        .then(function (pageContent) {
          router.backward(router.getPageEl(pageContent), options);
        })
        .catch(function () {
          router.allowPageChange = true;
        });
    }
    return router;
  }
  function back() {
    var ref;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var router = this;
    var navigateUrl;
    var navigateOptions;
    var route;
    if (typeof args[0] === 'object') {
      navigateOptions = args[0] || {};
    } else {
      navigateUrl = args[0];
      navigateOptions = args[1] || {};
    }

    var name = navigateOptions.name;
    var params = navigateOptions.params;
    var query = navigateOptions.query;
    if (name) {
      // find route by name
      route = router.findRouteByKey('name', name);
      if (!route) {
        throw new Error(("Framework7: route with name \"" + name + "\" not found"));
      }
      navigateUrl = router.constructRouteUrl(route, { params: params, query: query });
      if (navigateUrl) {
        return router.back(navigateUrl, Utils.extend({}, navigateOptions, {
          name: null,
          params: null,
          query: null,
        }));
      }
      throw new Error(("Framework7: can't construct URL for route with name \"" + name + "\""));
    }

    var app = router.app;
    if (!router.view) {
      (ref = app.views.main.router).back.apply(ref, args);
      return router;
    }

    var currentRouteIsModal = router.currentRoute.modal;
    var modalType;
    if (!currentRouteIsModal) {
      ('popup popover sheet loginScreen actions customModal panel').split(' ').forEach(function (modalLoadProp) {
        if (router.currentRoute.route[modalLoadProp]) {
          currentRouteIsModal = true;
          modalType = modalLoadProp;
        }
      });
    }
    if (currentRouteIsModal) {
      var modalToClose = router.currentRoute.modal
                           || router.currentRoute.route.modalInstance
                           || app[modalType].get();
      var previousUrl = router.history[router.history.length - 2];
      var previousRoute = router.findMatchingRoute(previousUrl);
      if (!previousRoute && previousUrl) {
        previousRoute = {
          url: previousUrl,
          path: previousUrl.split('?')[0],
          query: Utils.parseUrlQuery(previousUrl),
          route: {
            path: previousUrl.split('?')[0],
            url: previousUrl,
          },
        };
      }
      if (!previousRoute || !modalToClose) {
        return router;
      }
      if (router.params.pushState && navigateOptions.pushState !== false) {
        History.back();
      }
      router.currentRoute = previousRoute;
      router.history.pop();
      router.saveHistory();
      router.modalRemove(modalToClose);
      return router;
    }
    var $previousPage = router.$el.children('.page-current').prevAll('.page-previous').eq(0);
    if (!navigateOptions.force && $previousPage.length > 0) {
      if (router.params.pushState
        && $previousPage[0].f7Page
        && router.history[router.history.length - 2] !== $previousPage[0].f7Page.route.url
      ) {
        router.back(
          router.history[router.history.length - 2],
          Utils.extend(navigateOptions, { force: true })
        );
        return router;
      }

      var previousPageRoute = $previousPage[0].f7Page.route;
      processRouteQueue.call(
        router,
        previousPageRoute,
        router.currentRoute,
        function () {
          router.loadBack({ el: $previousPage }, Utils.extend(navigateOptions, {
            route: previousPageRoute,
          }));
        },
        function () {}
      );

      return router;
    }

    // Navigate URL
    if (navigateUrl === '#') {
      navigateUrl = undefined;
    }
    if (navigateUrl && navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      navigateUrl = ((router.path || '/') + navigateUrl).replace('//', '/');
    }
    if (!navigateUrl && router.history.length > 1) {
      navigateUrl = router.history[router.history.length - 2];
    }

    // Find route to load
    route = router.findMatchingRoute(navigateUrl);
    if (!route) {
      if (navigateUrl) {
        route = {
          url: navigateUrl,
          path: navigateUrl.split('?')[0],
          query: Utils.parseUrlQuery(navigateUrl),
          route: {
            path: navigateUrl.split('?')[0],
            url: navigateUrl,
          },
        };
      }
    }
    if (!route) {
      return router;
    }

    if (route.route.redirect) {
      return redirect.call(router, 'back', route, navigateOptions);
    }

    var options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions, { route: route });
    } else {
      Utils.extend(options, navigateOptions, { route: route });
    }

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    var backForceLoaded;
    if (options.force && router.params.stackPages) {
      router.$el.children('.page-previous.stacked').each(function (index, pageEl) {
        if (pageEl.f7Page && pageEl.f7Page.route && pageEl.f7Page.route.url === route.url) {
          backForceLoaded = true;
          router.loadBack({ el: pageEl }, options);
        }
      });
      if (backForceLoaded) {
        return router;
      }
    }
    function resolve() {
      var routerLoaded = false;
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach(function (pageLoadProp) {
        var obj;

        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.loadBack(( obj = {}, obj[pageLoadProp] = route.route[pageLoadProp], obj ), options);
        }
      });
      if (routerLoaded) { return; }
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) { route.context = resolveOptions.context; }
          else { route.context = Utils.extend({}, route.context, resolveOptions.context); }
          options.route.context = route.context;
        }
        router.loadBack(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;

        route.route.async.call(router, route, router.currentRoute, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    if (options.preload) {
      resolve();
    } else {
      processRouteQueue.call(
        router,
        route,
        router.currentRoute,
        function () {
          resolve();
        },
        function () {
          reject();
        }
      );
    }

    // Return Router
    return router;
  }

  function clearPreviousHistory() {
    var router = this;
    var app = router.app;
    var separateNavbar = router.separateNavbar;
    var url = router.history[router.history.length - 1];

    var $currentPageEl = $(router.currentPageEl);

    var $pagesToRemove = router.$el
      .children('.page:not(.stacked)')
      .filter(function (index, pageInView) { return pageInView !== $currentPageEl[0]; });

    $pagesToRemove.each(function (index, pageEl) {
      var $oldPageEl = $(pageEl);
      var $oldNavbarInnerEl = $(app.navbar.getElByPage($oldPageEl));
      if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
        $oldPageEl.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInnerEl.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarInnerEl, 'previous', undefined, {});
        router.removePage($oldPageEl);
        if (separateNavbar && $oldNavbarInnerEl.length) {
          router.removeNavbar($oldNavbarInnerEl);
        }
      }
    });

    router.history = [url];
    router.view.history = [url];
    router.saveHistory();
  }

  var Router = (function (Framework7Class$$1) {
    function Router(app, view) {
      Framework7Class$$1.call(this, {}, [typeof view === 'undefined' ? app : view]);
      var router = this;

      // Is App Router
      router.isAppRouter = typeof view === 'undefined';

      if (router.isAppRouter) {
        // App Router
        Utils.extend(false, router, {
          app: app,
          params: app.params.view,
          routes: app.routes || [],
          cache: app.cache,
        });
      } else {
        // View Router
        Utils.extend(false, router, {
          app: app,
          view: view,
          viewId: view.id,
          params: view.params,
          routes: view.routes,
          $el: view.$el,
          el: view.el,
          $navbarEl: view.$navbarEl,
          navbarEl: view.navbarEl,
          history: view.history,
          scrollHistory: view.scrollHistory,
          cache: app.cache,
          dynamicNavbar: app.theme === 'ios' && view.params.iosDynamicNavbar,
          separateNavbar: app.theme === 'ios' && view.params.iosDynamicNavbar && view.params.iosSeparateDynamicNavbar,
          initialPages: [],
          initialNavbars: [],
        });
      }

      // Install Modules
      router.useModules();

      // Temporary Dom
      router.tempDom = doc.createElement('div');

      // AllowPageChage
      router.allowPageChange = true;

      // Current Route
      var currentRoute = {};
      var previousRoute = {};
      Object.defineProperty(router, 'currentRoute', {
        enumerable: true,
        configurable: true,
        set: function set(newRoute) {
          if ( newRoute === void 0 ) newRoute = {};

          previousRoute = Utils.extend({}, currentRoute);
          currentRoute = newRoute;
          if (!currentRoute) { return; }
          router.url = currentRoute.url;
          router.emit('routeChange', newRoute, previousRoute, router);
        },
        get: function get() {
          return currentRoute;
        },
      });
      Object.defineProperty(router, 'previousRoute', {
        enumerable: true,
        configurable: true,
        get: function get() {
          return previousRoute;
        },
        set: function set(newRoute) {
          previousRoute = newRoute;
        },
      });

      return router;
    }

    if ( Framework7Class$$1 ) Router.__proto__ = Framework7Class$$1;
    Router.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Router.prototype.constructor = Router;

    Router.prototype.animatableNavElements = function animatableNavElements (newNavbarInner, oldNavbarInner) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var animateIcon = router.params.iosAnimateNavbarBackIcon;

      var newNavEls;
      var oldNavEls;
      function animatableNavEl(el, navbarInner) {
        var $el = $(el);
        var isSliding = $el.hasClass('sliding') || navbarInner.hasClass('sliding');
        var isSubnavbar = $el.hasClass('subnavbar');
        var needsOpacityTransition = isSliding ? !isSubnavbar : true;
        var hasIcon = isSliding && animateIcon && $el.hasClass('left') && $el.find('.back .icon').length > 0;
        var $iconEl;
        if (hasIcon) { $iconEl = $el.find('.back .icon'); }
        return {
          $el: $el,
          $iconEl: $iconEl,
          hasIcon: hasIcon,
          leftOffset: $el[0].f7NavbarLeftOffset,
          rightOffset: $el[0].f7NavbarRightOffset,
          isSliding: isSliding,
          isSubnavbar: isSubnavbar,
          needsOpacityTransition: needsOpacityTransition,
        };
      }
      if (dynamicNavbar) {
        newNavEls = [];
        oldNavEls = [];
        newNavbarInner.children('.left, .right, .title, .subnavbar').each(function (index, navEl) {
          newNavEls.push(animatableNavEl(navEl, newNavbarInner));
        });
        oldNavbarInner.children('.left, .right, .title, .subnavbar').each(function (index, navEl) {
          oldNavEls.push(animatableNavEl(navEl, oldNavbarInner));
        });
        [oldNavEls, newNavEls].forEach(function (navEls) {
          navEls.forEach(function (navEl) {
            var n = navEl;
            var isSliding = navEl.isSliding;
            var $el = navEl.$el;
            var otherEls = navEls === oldNavEls ? newNavEls : oldNavEls;
            if (!(isSliding && $el.hasClass('title') && otherEls)) { return; }
            otherEls.forEach(function (otherNavEl) {
              if (otherNavEl.$el.hasClass('left') && otherNavEl.hasIcon) {
                var iconTextEl = otherNavEl.$el.find('.back span')[0];
                n.leftOffset += iconTextEl ? iconTextEl.offsetLeft : 0;
              }
            });
          });
        });
      }

      return { newNavEls: newNavEls, oldNavEls: oldNavEls };
    };

    Router.prototype.animateWithCSS = function animateWithCSS (oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var separateNavbar = router.separateNavbar;
      var ios = router.app.theme === 'ios';
      // Router Animation class
      var routerTransitionClass = "router-transition-" + direction + " router-transition-css-" + direction;

      var newNavEls;
      var oldNavEls;
      var navbarWidth = 0;

      if (ios && dynamicNavbar) {
        if (!separateNavbar) {
          navbarWidth = newNavbarInner[0].offsetWidth;
        }
        var navEls = router.animatableNavElements(newNavbarInner, oldNavbarInner);
        newNavEls = navEls.newNavEls;
        oldNavEls = navEls.oldNavEls;
      }

      function animateNavbars(progress) {
        if (ios && dynamicNavbar) {
          newNavEls.forEach(function (navEl) {
            var $el = navEl.$el;
            var offset = direction === 'forward' ? navEl.rightOffset : navEl.leftOffset;
            if (navEl.isSliding) {
              $el.transform(("translate3d(" + (offset * (1 - progress)) + "px,0,0)"));
            }
            if (navEl.hasIcon) {
              if (direction === 'forward') {
                navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (1 - progress)) + "px,0,0)"));
              } else {
                navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (1 - progress)) + "px,0,0)"));
              }
            }
          });
          oldNavEls.forEach(function (navEl) {
            var $el = navEl.$el;
            var offset = direction === 'forward' ? navEl.leftOffset : navEl.rightOffset;
            if (navEl.isSliding) {
              $el.transform(("translate3d(" + (offset * (progress)) + "px,0,0)"));
            }
            if (navEl.hasIcon) {
              if (direction === 'forward') {
                navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (progress)) + "px,0,0)"));
              } else {
                navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (progress)) + "px,0,0)"));
              }
            }
          });
        }
      }

      // AnimationEnd Callback
      function onDone() {
        if (router.dynamicNavbar) {
          if (newNavbarInner.hasClass('sliding')) {
            newNavbarInner.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            newNavbarInner.find('.sliding').transform('');
          }
          if (oldNavbarInner.hasClass('sliding')) {
            oldNavbarInner.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            oldNavbarInner.find('.sliding').transform('');
          }
        }
        router.$el.removeClass(routerTransitionClass);
        if (callback) { callback(); }
      }

      (direction === 'forward' ? newPage : oldPage).animationEnd(function () {
        onDone();
      });

      // Animate
      if (dynamicNavbar) {
        // Prepare Navbars
        animateNavbars(0);
        Utils.nextTick(function () {
          // Add class, start animation
          animateNavbars(1);
          router.$el.addClass(routerTransitionClass);
        });
      } else {
        // Add class, start animation
        router.$el.addClass(routerTransitionClass);
      }
    };

    Router.prototype.animateWithJS = function animateWithJS (oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var separateNavbar = router.separateNavbar;
      var ios = router.app.theme === 'ios';
      var duration = ios ? 400 : 250;
      var routerTransitionClass = "router-transition-" + direction + " router-transition-js-" + direction;

      var startTime = null;
      var done = false;

      var newNavEls;
      var oldNavEls;
      var navbarWidth = 0;

      if (ios && dynamicNavbar) {
        if (!separateNavbar) {
          navbarWidth = newNavbarInner[0].offsetWidth;
        }
        var navEls = router.animatableNavElements(newNavbarInner, oldNavbarInner);
        newNavEls = navEls.newNavEls;
        oldNavEls = navEls.oldNavEls;
      }

      var $shadowEl;
      var $opacityEl;

      if (ios) {
        $shadowEl = $('<div class="page-shadow-effect"></div>');
        $opacityEl = $('<div class="page-opacity-effect"></div>');

        if (direction === 'forward') {
          newPage.append($shadowEl);
          oldPage.append($opacityEl);
        } else {
          newPage.append($opacityEl);
          oldPage.append($shadowEl);
        }
      }
      var easing = Utils.bezier(0.25, 0.1, 0.25, 1);

      function onDone() {
        newPage.transform('').css('opacity', '');
        oldPage.transform('').css('opacity', '');
        if (ios) {
          $shadowEl.remove();
          $opacityEl.remove();
          if (dynamicNavbar) {
            newNavEls.forEach(function (navEl) {
              navEl.$el.transform('');
              navEl.$el.css('opacity', '');
            });
            oldNavEls.forEach(function (navEl) {
              navEl.$el.transform('');
              navEl.$el.css('opacity', '');
            });
            newNavEls = [];
            oldNavEls = [];
          }
        }

        router.$el.removeClass(routerTransitionClass);

        if (callback) { callback(); }
      }

      function render() {
        var time = Utils.now();
        if (!startTime) { startTime = time; }
        var progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        var easeProgress = easing(progress);

        if (progress >= 1) {
          done = true;
        }
        var inverter = router.app.rtl ? -1 : 1;
        if (ios) {
          if (direction === 'forward') {
            newPage.transform(("translate3d(" + ((1 - easeProgress) * 100 * inverter) + "%,0,0)"));
            oldPage.transform(("translate3d(" + (-easeProgress * 20 * inverter) + "%,0,0)"));
            $shadowEl[0].style.opacity = easeProgress;
            $opacityEl[0].style.opacity = easeProgress;
          } else {
            newPage.transform(("translate3d(" + (-(1 - easeProgress) * 20 * inverter) + "%,0,0)"));
            oldPage.transform(("translate3d(" + (easeProgress * 100 * inverter) + "%,0,0)"));
            $shadowEl[0].style.opacity = 1 - easeProgress;
            $opacityEl[0].style.opacity = 1 - easeProgress;
          }
          if (dynamicNavbar) {
            newNavEls.forEach(function (navEl) {
              var $el = navEl.$el;
              var offset = direction === 'forward' ? navEl.rightOffset : navEl.leftOffset;
              if (navEl.needsOpacityTransition) {
                $el[0].style.opacity = easeProgress;
              }
              if (navEl.isSliding) {
                $el.transform(("translate3d(" + (offset * (1 - easeProgress)) + "px,0,0)"));
              }
              if (navEl.hasIcon) {
                if (direction === 'forward') {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (1 - easeProgress)) + "px,0,0)"));
                } else {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (1 - easeProgress)) + "px,0,0)"));
                }
              }
            });
            oldNavEls.forEach(function (navEl) {
              var $el = navEl.$el;
              var offset = direction === 'forward' ? navEl.leftOffset : navEl.rightOffset;
              if (navEl.needsOpacityTransition) {
                $el[0].style.opacity = (1 - easeProgress);
              }
              if (navEl.isSliding) {
                $el.transform(("translate3d(" + (offset * (easeProgress)) + "px,0,0)"));
              }
              if (navEl.hasIcon) {
                if (direction === 'forward') {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (easeProgress)) + "px,0,0)"));
                } else {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (easeProgress)) + "px,0,0)"));
                }
              }
            });
          }
        } else if (direction === 'forward') {
          newPage.transform(("translate3d(0, " + ((1 - easeProgress) * 56) + "px,0)"));
          newPage.css('opacity', easeProgress);
        } else {
          oldPage.transform(("translate3d(0, " + (easeProgress * 56) + "px,0)"));
          oldPage.css('opacity', 1 - easeProgress);
        }

        if (done) {
          onDone();
          return;
        }
        Utils.nextFrame(render);
      }

      router.$el.addClass(routerTransitionClass);

      Utils.nextFrame(render);
    };

    Router.prototype.animate = function animate () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // Args: oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback
      var router = this;
      if (router.params.animateCustom) {
        router.params.animateCustom.apply(router, args);
      } else if (router.params.animateWithJS) {
        router.animateWithJS.apply(router, args);
      } else {
        router.animateWithCSS.apply(router, args);
      }
    };

    Router.prototype.removeModal = function removeModal (modalEl) {
      var router = this;
      router.removeEl(modalEl);
    };
    // eslint-disable-next-line
    Router.prototype.removeTabContent = function removeTabContent (tabEl) {
      var $tabEl = $(tabEl);
      $tabEl.html('');
    };

    Router.prototype.removeNavbar = function removeNavbar (el) {
      var router = this;
      router.removeEl(el);
    };

    Router.prototype.removePage = function removePage (el) {
      var router = this;
      router.removeEl(el);
    };

    Router.prototype.removeEl = function removeEl (el) {
      if (!el) { return; }
      var router = this;
      var $el = $(el);
      if ($el.length === 0) { return; }
      $el.find('.tab').each(function (tabIndex, tabEl) {
        $(tabEl).children().each(function (index, tabChild) {
          if (tabChild.f7Component) {
            $(tabChild).trigger('tab:beforeremove');
            tabChild.f7Component.$destroy();
          }
        });
      });
      if ($el[0].f7Component && $el[0].f7Component.$destroy) {
        $el[0].f7Component.$destroy();
      }
      if (!router.params.removeElements) {
        return;
      }
      if (router.params.removeElementsWithTimeout) {
        setTimeout(function () {
          $el.remove();
        }, router.params.removeElementsTimeout);
      } else {
        $el.remove();
      }
    };

    Router.prototype.getPageEl = function getPageEl (content) {
      var router = this;
      if (typeof content === 'string') {
        router.tempDom.innerHTML = content;
      } else {
        if ($(content).hasClass('page')) {
          return content;
        }
        router.tempDom.innerHTML = '';
        $(router.tempDom).append(content);
      }

      return router.findElement('.page', router.tempDom);
    };

    Router.prototype.findElement = function findElement (stringSelector, container, notStacked) {
      var router = this;
      var view = router.view;
      var app = router.app;

      // Modals Selector
      var modalsSelector = '.popup, .dialog, .popover, .actions-modal, .sheet-modal, .login-screen, .page';

      var $container = $(container);
      var selector = stringSelector;
      if (notStacked) { selector += ':not(.stacked)'; }

      var found = $container
        .find(selector)
        .filter(function (index, el) { return $(el).parents(modalsSelector).length === 0; });

      if (found.length > 1) {
        if (typeof view.selector === 'string') {
          // Search in related view
          found = $container.find(((view.selector) + " " + selector));
        }
        if (found.length > 1) {
          // Search in main view
          found = $container.find(("." + (app.params.viewMainClass) + " " + selector));
        }
      }
      if (found.length === 1) { return found; }

      // Try to find not stacked
      if (!notStacked) { found = router.findElement(selector, $container, true); }
      if (found && found.length === 1) { return found; }
      if (found && found.length > 1) { return $(found[0]); }
      return undefined;
    };

    Router.prototype.flattenRoutes = function flattenRoutes (routes) {
      var this$1 = this;
      if ( routes === void 0 ) routes = this.routes;

      var flattenedRoutes = [];
      routes.forEach(function (route) {
        if ('routes' in route) {
          var mergedPathsRoutes = route.routes.map(function (childRoute) {
            var cRoute = Utils.extend({}, childRoute);
            cRoute.path = (((route.path) + "/" + (cRoute.path))).replace('///', '/').replace('//', '/');
            return cRoute;
          });
          flattenedRoutes = flattenedRoutes.concat(route, this$1.flattenRoutes(mergedPathsRoutes));
        } else if ('tabs' in route && route.tabs) {
          var mergedPathsRoutes$1 = route.tabs.map(function (tabRoute) {
            var tRoute = Utils.extend({}, route, {
              path: (((route.path) + "/" + (tabRoute.path))).replace('///', '/').replace('//', '/'),
              parentPath: route.path,
              tab: tabRoute,
            });
            delete tRoute.tabs;
            return tRoute;
          });
          flattenedRoutes = flattenedRoutes.concat(this$1.flattenRoutes(mergedPathsRoutes$1));
        } else {
          flattenedRoutes.push(route);
        }
      });
      return flattenedRoutes;
    };

    // eslint-disable-next-line
    Router.prototype.parseRouteUrl = function parseRouteUrl (url) {
      if (!url) { return {}; }
      var query = Utils.parseUrlQuery(url);
      var hash = url.split('#')[1];
      var params = {};
      var path = url.split('#')[0].split('?')[0];
      return {
        query: query,
        hash: hash,
        params: params,
        url: url,
        path: path,
      };
    };

    // eslint-disable-next-line
    Router.prototype.constructRouteUrl = function constructRouteUrl (route, ref) {
      if ( ref === void 0 ) ref = {};
      var params = ref.params;
      var query = ref.query;

      var path = route.path;
      var toUrl = pathToRegexp_1.compile(path);
      var url;
      try {
        url = toUrl(params || {});
      } catch (error) {
        throw new Error(("Framework7: error constructing route URL from passed params:\nRoute: " + path + "\n" + (error.toString())));
      }

      if (query) {
        if (typeof query === 'string') { url += "?" + query; }
        else { url += "?" + (Utils.serializeObject(query)); }
      }

      return url;
    };

    Router.prototype.findTabRoute = function findTabRoute (tabEl) {
      var router = this;
      var $tabEl = $(tabEl);
      var parentPath = router.currentRoute.route.parentPath;
      var tabId = $tabEl.attr('id');
      var flattenedRoutes = router.flattenRoutes(router.routes);
      var foundTabRoute;
      flattenedRoutes.forEach(function (route) {
        if (
          route.parentPath === parentPath
          && route.tab
          && route.tab.id === tabId
        ) {
          foundTabRoute = route;
        }
      });
      return foundTabRoute;
    };

    Router.prototype.findRouteByKey = function findRouteByKey (key, value) {
      var router = this;
      var routes = router.routes;
      var flattenedRoutes = router.flattenRoutes(routes);
      var matchingRoute;

      flattenedRoutes.forEach(function (route) {
        if (matchingRoute) { return; }
        if (route[key] === value) {
          matchingRoute = route;
        }
      });
      return matchingRoute;
    };

    Router.prototype.findMatchingRoute = function findMatchingRoute (url) {
      if (!url) { return undefined; }
      var router = this;
      var routes = router.routes;
      var flattenedRoutes = router.flattenRoutes(routes);
      var ref = router.parseRouteUrl(url);
      var path = ref.path;
      var query = ref.query;
      var hash = ref.hash;
      var params = ref.params;
      var matchingRoute;
      flattenedRoutes.forEach(function (route) {
        if (matchingRoute) { return; }
        var keys = [];

        var pathsToMatch = [route.path];
        if (route.alias) {
          if (typeof route.alias === 'string') { pathsToMatch.push(route.alias); }
          else if (Array.isArray(route.alias)) {
            route.alias.forEach(function (aliasPath) {
              pathsToMatch.push(aliasPath);
            });
          }
        }

        var matched;
        pathsToMatch.forEach(function (pathToMatch) {
          if (matched) { return; }
          matched = pathToRegexp_1(pathToMatch, keys).exec(path);
        });

        if (matched) {
          keys.forEach(function (keyObj, index) {
            if (typeof keyObj.name === 'number') { return; }
            var paramValue = matched[index + 1];
            params[keyObj.name] = paramValue;
          });

          var parentPath;
          if (route.parentPath) {
            parentPath = path.split('/').slice(0, route.parentPath.split('/').length - 1).join('/');
          }

          matchingRoute = {
            query: query,
            hash: hash,
            params: params,
            url: url,
            path: path,
            parentPath: parentPath,
            route: route,
            name: route.name,
          };
        }
      });
      return matchingRoute;
    };

    Router.prototype.removeFromXhrCache = function removeFromXhrCache (url) {
      var router = this;
      var xhrCache = router.cache.xhr;
      var index = false;
      for (var i = 0; i < xhrCache.length; i += 1) {
        if (xhrCache[i].url === url) { index = i; }
      }
      if (index !== false) { xhrCache.splice(index, 1); }
    };

    Router.prototype.xhrRequest = function xhrRequest (requestUrl, options) {
      var router = this;
      var params = router.params;
      var ignoreCache = options.ignoreCache;
      var url = requestUrl;

      var hasQuery = url.indexOf('?') >= 0;
      if (params.passRouteQueryToRequest
        && options
        && options.route
        && options.route.query
        && Object.keys(options.route.query).length
      ) {
        url += "" + (hasQuery ? '&' : '?') + (Utils.serializeObject(options.route.query));
        hasQuery = true;
      }

      if (params.passRouteParamsToRequest
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        url += "" + (hasQuery ? '&' : '?') + (Utils.serializeObject(options.route.params));
        hasQuery = true;
      }

      if (url.indexOf('{{') >= 0
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        Object.keys(options.route.params).forEach(function (paramName) {
          var regExp = new RegExp(("{{" + paramName + "}}"), 'g');
          url = url.replace(regExp, options.route.params[paramName] || '');
        });
      }
      // should we ignore get params or not
      if (params.xhrCacheIgnoreGetParameters && url.indexOf('?') >= 0) {
        url = url.split('?')[0];
      }
      return Utils.promise(function (resolve, reject) {
        if (params.xhrCache && !ignoreCache && url.indexOf('nocache') < 0 && params.xhrCacheIgnore.indexOf(url) < 0) {
          for (var i = 0; i < router.cache.xhr.length; i += 1) {
            var cachedUrl = router.cache.xhr[i];
            if (cachedUrl.url === url) {
              // Check expiration
              if (Utils.now() - cachedUrl.time < params.xhrCacheDuration) {
                // Load from cache
                resolve(cachedUrl.content);
                return;
              }
            }
          }
        }
        router.xhr = router.app.request({
          url: url,
          method: 'GET',
          beforeSend: function beforeSend(xhr) {
            router.emit('routerAjaxStart', xhr, options);
          },
          complete: function complete(xhr, status) {
            router.emit('routerAjaxComplete', xhr);
            if ((status !== 'error' && status !== 'timeout' && (xhr.status >= 200 && xhr.status < 300)) || xhr.status === 0) {
              if (params.xhrCache && xhr.responseText !== '') {
                router.removeFromXhrCache(url);
                router.cache.xhr.push({
                  url: url,
                  time: Utils.now(),
                  content: xhr.responseText,
                });
              }
              router.emit('routerAjaxSuccess', xhr, options);
              resolve(xhr.responseText);
            } else {
              router.emit('routerAjaxError', xhr, options);
              reject(xhr);
            }
          },
          error: function error(xhr) {
            router.emit('routerAjaxError', xhr, options);
            reject(xhr);
          },
        });
      });
    };

    // Remove theme elements
    Router.prototype.removeThemeElements = function removeThemeElements (el) {
      var router = this;
      var theme = router.app.theme;
      $(el).find(("." + (theme === 'md' ? 'ios' : 'md') + "-only, .if-" + (theme === 'md' ? 'ios' : 'md'))).remove();
    };

    Router.prototype.templateLoader = function templateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      function compile(t) {
        var compiledHtml;
        var context;
        try {
          context = options.context || {};
          if (typeof context === 'function') { context = context.call(router); }
          else if (typeof context === 'string') {
            try {
              context = JSON.parse(context);
            } catch (err) {
              reject();
              throw (err);
            }
          }
          if (typeof t === 'function') {
            compiledHtml = t(context);
          } else {
            compiledHtml = Template7.compile(t)(Utils.extend({}, context || {}, {
              $app: router.app,
              $root: Utils.extend({}, router.app.data, router.app.methods),
              $route: options.route,
              $router: router,
              $theme: {
                ios: router.app.theme === 'ios',
                md: router.app.theme === 'md',
              },
            }));
          }
        } catch (err) {
          reject();
          throw (err);
        }
        resolve(compiledHtml, { context: context });
      }
      if (templateUrl) {
        // Load via XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router
          .xhrRequest(templateUrl, options)
          .then(function (templateContent) {
            compile(templateContent);
          })
          .catch(function () {
            reject();
          });
      } else {
        compile(template);
      }
    };

    Router.prototype.modalTemplateLoader = function modalTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html) {
        resolve(html);
      }, reject);
    };

    Router.prototype.tabTemplateLoader = function tabTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html) {
        resolve(html);
      }, reject);
    };

    Router.prototype.pageTemplateLoader = function pageTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html, newOptions) {
        if ( newOptions === void 0 ) newOptions = {};

        resolve(router.getPageEl(html), newOptions);
      }, reject);
    };

    Router.prototype.componentLoader = function componentLoader (component, componentUrl, options, resolve, reject) {
      if ( options === void 0 ) options = {};

      var router = this;
      var app = router.app;
      var url = typeof component === 'string' ? component : componentUrl;
      function compile(componentOptions) {
        var context = options.context || {};
        if (typeof context === 'function') { context = context.call(router); }
        else if (typeof context === 'string') {
          try {
            context = JSON.parse(context);
          } catch (err) {
            reject();
            throw (err);
          }
        }
        var extendContext = Utils.merge(
          {},
          context,
          {
            $route: options.route,
            $router: router,
            $theme: {
              ios: app.theme === 'ios',
              md: app.theme === 'md',
            },
          }
        );
        var createdComponent = app.component.create(componentOptions, extendContext);
        resolve(createdComponent.el);
      }
      var cachedComponent;
      if (url) {
        router.cache.components.forEach(function (cached) {
          if (cached.url === url) { cachedComponent = cached.component; }
        });
      }
      if (url && cachedComponent) {
        compile(cachedComponent);
      } else if (url && !cachedComponent) {
        // Load via XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router
          .xhrRequest(url, options)
          .then(function (loadedComponent) {
            var parsedComponent = app.component.parse(loadedComponent);
            router.cache.components.push({
              url: url,
              component: parsedComponent,
            });
            compile(parsedComponent);
          })
          .catch(function (err) {
            reject();
            throw (err);
          });
      } else {
        compile(component);
      }
    };

    Router.prototype.modalComponentLoader = function modalComponentLoader (rootEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el) {
        resolve(el);
      }, reject);
    };

    Router.prototype.tabComponentLoader = function tabComponentLoader (tabEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el) {
        resolve(el);
      }, reject);
    };

    Router.prototype.pageComponentLoader = function pageComponentLoader (routerEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el, newOptions) {
        if ( newOptions === void 0 ) newOptions = {};

        resolve(el, newOptions);
      }, reject);
    };

    Router.prototype.getPageData = function getPageData (pageEl, navbarEl, from, to, route, pageFromEl) {
      if ( route === void 0 ) route = {};

      var router = this;
      var $pageEl = $(pageEl);
      var $navbarEl = $(navbarEl);
      var currentPage = $pageEl[0].f7Page || {};
      var direction;
      var pageFrom;
      if ((from === 'next' && to === 'current') || (from === 'current' && to === 'previous')) { direction = 'forward'; }
      if ((from === 'current' && to === 'next') || (from === 'previous' && to === 'current')) { direction = 'backward'; }
      if (currentPage && !currentPage.fromPage) {
        var $pageFromEl = $(pageFromEl);
        if ($pageFromEl.length) {
          pageFrom = $pageFromEl[0].f7Page;
        }
      }
      pageFrom = currentPage.pageFrom || pageFrom;
      if (pageFrom && pageFrom.pageFrom) {
        pageFrom.pageFrom = null;
      }
      var page = {
        app: router.app,
        view: router.view,
        router: router,
        $el: $pageEl,
        el: $pageEl[0],
        $pageEl: $pageEl,
        pageEl: $pageEl[0],
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl[0],
        name: $pageEl.attr('data-name'),
        position: from,
        from: from,
        to: to,
        direction: direction,
        route: currentPage.route ? currentPage.route : route,
        pageFrom: pageFrom,
      };

      if ($navbarEl && $navbarEl[0]) {
        $navbarEl[0].f7Page = page;
      }
      $pageEl[0].f7Page = page;
      return page;
    };

    // Callbacks
    Router.prototype.pageCallback = function pageCallback (callback, pageEl, navbarEl, from, to, options, pageFromEl) {
      if ( options === void 0 ) options = {};

      if (!pageEl) { return; }
      var router = this;
      var $pageEl = $(pageEl);
      if (!$pageEl.length) { return; }
      var route = options.route;
      var restoreScrollTopOnBack = router.params.restoreScrollTopOnBack;

      var camelName = "page" + (callback[0].toUpperCase() + callback.slice(1, callback.length));
      var colonName = "page:" + (callback.toLowerCase());

      var page = {};
      if (callback === 'beforeRemove' && $pageEl[0].f7Page) {
        page = Utils.extend($pageEl[0].f7Page, { from: from, to: to, position: from });
      } else {
        page = router.getPageData(pageEl, navbarEl, from, to, route, pageFromEl);
      }
      page.swipeBack = !!options.swipeBack;

      var ref = options.route ? options.route.route : {};
      var on = ref.on; if ( on === void 0 ) on = {};
      var once = ref.once; if ( once === void 0 ) once = {};
      if (options.on) {
        Utils.extend(on, options.on);
      }
      if (options.once) {
        Utils.extend(once, options.once);
      }

      function attachEvents() {
        if ($pageEl[0].f7RouteEventsAttached) { return; }
        $pageEl[0].f7RouteEventsAttached = true;
        if (on && Object.keys(on).length > 0) {
          $pageEl[0].f7RouteEventsOn = on;
          Object.keys(on).forEach(function (eventName) {
            on[eventName] = on[eventName].bind(router);
            $pageEl.on(Utils.eventNameToColonCase(eventName), on[eventName]);
          });
        }
        if (once && Object.keys(once).length > 0) {
          $pageEl[0].f7RouteEventsOnce = once;
          Object.keys(once).forEach(function (eventName) {
            once[eventName] = once[eventName].bind(router);
            $pageEl.once(Utils.eventNameToColonCase(eventName), once[eventName]);
          });
        }
      }

      function detachEvents() {
        if (!$pageEl[0].f7RouteEventsAttached) { return; }
        if ($pageEl[0].f7RouteEventsOn) {
          Object.keys($pageEl[0].f7RouteEventsOn).forEach(function (eventName) {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOn[eventName]);
          });
        }
        if ($pageEl[0].f7RouteEventsOnce) {
          Object.keys($pageEl[0].f7RouteEventsOnce).forEach(function (eventName) {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOnce[eventName]);
          });
        }
        $pageEl[0].f7RouteEventsAttached = null;
        $pageEl[0].f7RouteEventsOn = null;
        $pageEl[0].f7RouteEventsOnce = null;
        delete $pageEl[0].f7RouteEventsAttached;
        delete $pageEl[0].f7RouteEventsOn;
        delete $pageEl[0].f7RouteEventsOnce;
      }

      if (callback === 'mounted') {
        attachEvents();
      }
      if (callback === 'init') {
        if (restoreScrollTopOnBack && (from === 'previous' || !from) && to === 'current' && router.scrollHistory[page.route.url] && !$pageEl.hasClass('no-restore-scroll')) {
          var $pageContent = $pageEl.find('.page-content');
          if ($pageContent.length > 0) {
            // eslint-disable-next-line
            $pageContent = $pageContent.filter(function (pageContentIndex, pageContentEl) {
              return (
                $(pageContentEl).parents('.tab:not(.tab-active)').length === 0
                && !$(pageContentEl).is('.tab:not(.tab-active)')
              );
            });
          }
          $pageContent.scrollTop(router.scrollHistory[page.route.url]);
        }
        attachEvents();
        if ($pageEl[0].f7PageInitialized) {
          $pageEl.trigger('page:reinit', page);
          router.emit('pageReinit', page);
          return;
        }
        $pageEl[0].f7PageInitialized = true;
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'previous') {
        // Save scroll position
        var $pageContent$1 = $pageEl.find('.page-content');
        if ($pageContent$1.length > 0) {
          // eslint-disable-next-line
          $pageContent$1 = $pageContent$1.filter(function (pageContentIndex, pageContentEl) {
            return (
              $(pageContentEl).parents('.tab:not(.tab-active)').length === 0
              && !$(pageContentEl).is('.tab:not(.tab-active)')
            );
          });
        }
        router.scrollHistory[page.route.url] = $pageContent$1.scrollTop();
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'next') {
        // Delete scroll position
        delete router.scrollHistory[page.route.url];
      }

      $pageEl.trigger(colonName, page);
      router.emit(camelName, page);

      if (callback === 'beforeRemove') {
        detachEvents();
        $pageEl[0].f7Page = null;
      }
    };

    Router.prototype.saveHistory = function saveHistory () {
      var router = this;
      router.view.history = router.history;
      if (router.params.pushState) {
        win.localStorage[("f7router-" + (router.view.id) + "-history")] = JSON.stringify(router.history);
      }
    };

    Router.prototype.restoreHistory = function restoreHistory () {
      var router = this;
      if (router.params.pushState && win.localStorage[("f7router-" + (router.view.id) + "-history")]) {
        router.history = JSON.parse(win.localStorage[("f7router-" + (router.view.id) + "-history")]);
        router.view.history = router.history;
      }
    };

    Router.prototype.clearHistory = function clearHistory () {
      var router = this;
      router.history = [];
      if (router.view) { router.view.history = []; }
      router.saveHistory();
    };

    Router.prototype.updateCurrentUrl = function updateCurrentUrl (newUrl) {
      var router = this;
      // Update history
      if (router.history.length) {
        router.history[router.history.length - 1] = newUrl;
      } else {
        router.history.push(newUrl);
      }

      // Update current route params
      var ref = router.parseRouteUrl(newUrl);
      var query = ref.query;
      var hash = ref.hash;
      var params = ref.params;
      var url = ref.url;
      var path = ref.path;
      if (router.currentRoute) {
        Utils.extend(router.currentRoute, {
          query: query,
          hash: hash,
          params: params,
          url: url,
          path: path,
        });
      }

      if (router.params.pushState) {
        var pushStateRoot = router.params.pushStateRoot || '';
        History.replace(
          router.view.id,
          {
            url: newUrl,
          },
          pushStateRoot + router.params.pushStateSeparator + newUrl
        );
      }

      // Save History
      router.saveHistory();

      router.emit('routeUrlUpdate', router.currentRoute, router);
    };

    Router.prototype.init = function init () {
      var router = this;
      var app = router.app;
      var view = router.view;

      // Init Swipeback
      {
        if (
          (view && router.params.iosSwipeBack && app.theme === 'ios')
          || (view && router.params.mdSwipeBack && app.theme === 'md')
        ) {
          SwipeBack(router);
        }
      }

      // Dynamic not separated navbbar
      if (router.dynamicNavbar && !router.separateNavbar) {
        router.$el.addClass('router-dynamic-navbar-inside');
      }

      var initUrl = router.params.url;
      var documentUrl = doc.location.href.split(doc.location.origin)[1];
      var historyRestored;
      var ref = router.params;
      var pushState = ref.pushState;
      var pushStateOnLoad = ref.pushStateOnLoad;
      var pushStateSeparator = ref.pushStateSeparator;
      var pushStateAnimateOnLoad = ref.pushStateAnimateOnLoad;
      var ref$1 = router.params;
      var pushStateRoot = ref$1.pushStateRoot;
      if (win.cordova && pushState && !pushStateSeparator && !pushStateRoot && doc.location.pathname.indexOf('index.html')) {
        // eslint-disable-next-line
        console.warn('Framework7: wrong or not complete pushState configuration, trying to guess pushStateRoot');
        pushStateRoot = doc.location.pathname.split('index.html')[0];
      }

      if (!pushState || !pushStateOnLoad) {
        if (!initUrl) {
          initUrl = documentUrl;
        }
        if (doc.location.search && initUrl.indexOf('?') < 0) {
          initUrl += doc.location.search;
        }
        if (doc.location.hash && initUrl.indexOf('#') < 0) {
          initUrl += doc.location.hash;
        }
      } else {
        if (pushStateRoot && documentUrl.indexOf(pushStateRoot) >= 0) {
          documentUrl = documentUrl.split(pushStateRoot)[1];
          if (documentUrl === '') { documentUrl = '/'; }
        }
        if (pushStateSeparator.length > 0 && documentUrl.indexOf(pushStateSeparator) >= 0) {
          initUrl = documentUrl.split(pushStateSeparator)[1];
        } else {
          initUrl = documentUrl;
        }
        router.restoreHistory();
        if (router.history.indexOf(initUrl) >= 0) {
          router.history = router.history.slice(0, router.history.indexOf(initUrl) + 1);
        } else if (router.params.url === initUrl) {
          router.history = [initUrl];
        } else if (History.state && History.state[view.id] && History.state[view.id].url === router.history[router.history.length - 1]) {
          initUrl = router.history[router.history.length - 1];
        } else {
          router.history = [documentUrl.split(pushStateSeparator)[0] || '/', initUrl];
        }
        if (router.history.length > 1) {
          historyRestored = true;
        } else {
          router.history = [];
        }
        router.saveHistory();
      }
      var currentRoute;
      if (router.history.length > 1) {
        // Will load page
        currentRoute = router.findMatchingRoute(router.history[0]);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(router.history[0]), {
            route: {
              url: router.history[0],
              path: router.history[0].split('?')[0],
            },
          });
        }
      } else {
        // Don't load page
        currentRoute = router.findMatchingRoute(initUrl);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(initUrl), {
            route: {
              url: initUrl,
              path: initUrl.split('?')[0],
            },
          });
        }
      }

      if (router.params.stackPages) {
        router.$el.children('.page').each(function (index, pageEl) {
          var $pageEl = $(pageEl);
          router.initialPages.push($pageEl[0]);
          if (router.separateNavbar && $pageEl.children('.navbar').length > 0) {
            router.initialNavbars.push($pageEl.children('.navbar').find('.navbar-inner')[0]);
          }
        });
      }

      if (router.$el.children('.page:not(.stacked)').length === 0 && initUrl) {
        // No pages presented in DOM, reload new page
        router.navigate(initUrl, {
          initial: true,
          reloadCurrent: true,
          pushState: false,
        });
      } else {
        // Init current DOM page
        var hasTabRoute;
        router.currentRoute = currentRoute;
        router.$el.children('.page:not(.stacked)').each(function (index, pageEl) {
          var $pageEl = $(pageEl);
          var $navbarInnerEl;
          $pageEl.addClass('page-current');
          if (router.separateNavbar) {
            $navbarInnerEl = $pageEl.children('.navbar').children('.navbar-inner');
            if ($navbarInnerEl.length > 0) {
              if (!router.$navbarEl.parents(doc).length) {
                router.$el.prepend(router.$navbarEl);
              }
              router.$navbarEl.append($navbarInnerEl);
              $pageEl.children('.navbar').remove();
            } else {
              router.$navbarEl.addClass('navbar-hidden');
            }
          }
          var initOptions = {
            route: router.currentRoute,
          };
          if (router.currentRoute && router.currentRoute.route && router.currentRoute.route.options) {
            Utils.extend(initOptions, router.currentRoute.route.options);
          }
          router.currentPageEl = $pageEl[0];
          if (router.dynamicNavbar && $navbarInnerEl.length) {
            router.currentNavbarEl = $navbarInnerEl[0];
          }
          router.removeThemeElements($pageEl);
          if (router.dynamicNavbar && $navbarInnerEl.length) {
            router.removeThemeElements($navbarInnerEl);
          }
          if (initOptions.route.route.tab) {
            hasTabRoute = true;
            router.tabLoad(initOptions.route.route.tab, Utils.extend({}, initOptions));
          }
          router.pageCallback('init', $pageEl, $navbarInnerEl, 'current', undefined, initOptions);
        });
        if (historyRestored) {
          router.navigate(initUrl, {
            initial: true,
            pushState: false,
            history: false,
            animate: pushStateAnimateOnLoad,
            once: {
              pageAfterIn: function pageAfterIn() {
                if (router.history.length > 2) {
                  router.back({ preload: true });
                }
              },
            },
          });
        }
        if (!historyRestored && !hasTabRoute) {
          router.history.push(initUrl);
          router.saveHistory();
        }
      }
      if (initUrl && pushState && pushStateOnLoad && (!History.state || !History.state[view.id])) {
        History.initViewState(view.id, {
          url: initUrl,
        });
      }
      router.emit('local::init routerInit', router);
    };

    Router.prototype.destroy = function destroy () {
      var router = this;

      router.emit('local::destroy routerDestroy', router);

      // Delete props & methods
      Object.keys(router).forEach(function (routerProp) {
        router[routerProp] = null;
        delete router[routerProp];
      });

      router = null;
    };

    return Router;
  }(Framework7Class));

  // Load
  Router.prototype.forward = forward;
  Router.prototype.load = load;
  Router.prototype.navigate = navigate;
  Router.prototype.refreshPage = refreshPage;
  // Tab
  Router.prototype.tabLoad = tabLoad;
  Router.prototype.tabRemove = tabRemove;
  // Modal
  Router.prototype.modalLoad = modalLoad;
  Router.prototype.modalRemove = modalRemove;
  // Back
  Router.prototype.backward = backward;
  Router.prototype.loadBack = loadBack;
  Router.prototype.back = back;
  // Clear history
  Router.prototype.clearPreviousHistory = clearPreviousHistory;

  var Router$1 = {
    name: 'router',
    static: {
      Router: Router,
    },
    instance: {
      cache: {
        xhr: [],
        templates: [],
        components: [],
      },
    },
    create: function create() {
      var instance = this;
      if (instance.app) {
        // View Router
        if (instance.params.router) {
          instance.router = new Router(instance.app, instance);
        }
      } else {
        // App Router
        instance.router = new Router(instance);
      }
    },
  };

  var View = (function (Framework7Class$$1) {
    function View(appInstance, el, viewParams) {
      if ( viewParams === void 0 ) viewParams = {};

      Framework7Class$$1.call(this, viewParams, [appInstance]);

      var app = appInstance;
      var $el = $(el);
      var view = this;

      var defaults = {
        routes: [],
        routesAdd: [],
      };

      // Default View params
      view.params = Utils.extend(defaults, app.params.view, viewParams);

      // Routes
      if (view.params.routes.length > 0) {
        view.routes = view.params.routes;
      } else {
        view.routes = [].concat(app.routes, view.params.routesAdd);
      }

      // Selector
      var selector;
      if (typeof el === 'string') { selector = el; }
      else {
        // Supposed to be HTMLElement or Dom7
        selector = ($el.attr('id') ? ("#" + ($el.attr('id'))) : '') + ($el.attr('class') ? ("." + ($el.attr('class').replace(/ /g, '.').replace('.active', ''))) : '');
      }

      // DynamicNavbar
      var $navbarEl;
      if (app.theme === 'ios' && view.params.iosDynamicNavbar && view.params.iosSeparateDynamicNavbar) {
        $navbarEl = $el.children('.navbar').eq(0);
        if ($navbarEl.length === 0) {
          $navbarEl = $('<div class="navbar"></div>');
        }
      }

      // View Props
      Utils.extend(false, view, {
        app: app,
        $el: $el,
        el: $el[0],
        name: view.params.name,
        main: view.params.main || $el.hasClass('view-main'),
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl ? $navbarEl[0] : undefined,
        selector: selector,
        history: [],
        scrollHistory: {},
      });

      // Save in DOM
      $el[0].f7View = view;

      // Install Modules
      view.useModules();

      // Add to app
      app.views.push(view);
      if (view.main) {
        app.views.main = view;
      }
      if (view.name) {
        app.views[view.name] = view;
      }

      // Index
      view.index = app.views.indexOf(view);

      // View ID
      var viewId;
      if (view.name) {
        viewId = "view_" + (view.name);
      } else if (view.main) {
        viewId = 'view_main';
      } else {
        viewId = "view_" + (view.index);
      }
      view.id = viewId;

      // Init View
      if (app.initialized) {
        view.init();
      } else {
        app.on('init', function () {
          view.init();
        });
      }

      return view;
    }

    if ( Framework7Class$$1 ) View.__proto__ = Framework7Class$$1;
    View.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    View.prototype.constructor = View;

    View.prototype.destroy = function destroy () {
      var view = this;
      var app = view.app;

      view.$el.trigger('view:beforedestroy', view);
      view.emit('local::beforeDestroy viewBeforeDestroy', view);

      if (view.main) {
        app.views.main = null;
        delete app.views.main;
      } else if (view.name) {
        app.views[view.name] = null;
        delete app.views[view.name];
      }
      view.$el[0].f7View = null;
      delete view.$el[0].f7View;

      app.views.splice(app.views.indexOf(view), 1);

      // Destroy Router
      if (view.params.router && view.router) {
        view.router.destroy();
      }

      view.emit('local::destroy viewDestroy', view);

      // Delete props & methods
      Object.keys(view).forEach(function (viewProp) {
        view[viewProp] = null;
        delete view[viewProp];
      });

      view = null;
    };

    View.prototype.init = function init () {
      var view = this;
      if (view.params.router) {
        view.router.init();
      }
    };

    return View;
  }(Framework7Class));

  // Use Router
  View.use(Router$1);

  function initClicks(app) {
    function handleClicks(e) {
      var clicked = $(e.target);
      var clickedLink = clicked.closest('a');
      var isLink = clickedLink.length > 0;
      var url = isLink && clickedLink.attr('href');
      var isTabLink = isLink && clickedLink.hasClass('tab-link') && (clickedLink.attr('data-tab') || (url && url.indexOf('#') === 0));

      // Check if link is external
      if (isLink) {
        // eslint-disable-next-line
        if (clickedLink.is(app.params.clicks.externalLinks) || (url && url.indexOf('javascript:') >= 0)) {
          var target = clickedLink.attr('target');
          if (
            url
            && win.cordova
            && win.cordova.InAppBrowser
            && (target === '_system' || target === '_blank')
          ) {
            e.preventDefault();
            win.cordova.InAppBrowser.open(url, target);
          }
          return;
        }
      }

      // Modules Clicks
      Object.keys(app.modules).forEach(function (moduleName) {
        var moduleClicks = app.modules[moduleName].clicks;
        if (!moduleClicks) { return; }
        Object.keys(moduleClicks).forEach(function (clickSelector) {
          var matchingClickedElement = clicked.closest(clickSelector).eq(0);
          if (matchingClickedElement.length > 0) {
            moduleClicks[clickSelector].call(app, matchingClickedElement, matchingClickedElement.dataset());
          }
        });
      });

      // Load Page
      var clickedLinkData = {};
      if (isLink) {
        e.preventDefault();
        clickedLinkData = clickedLink.dataset();
      }
      var validUrl = url && url.length > 0 && url !== '#' && !isTabLink;
      if (validUrl || clickedLink.hasClass('back')) {
        var view;
        if (clickedLinkData.view) {
          view = $(clickedLinkData.view)[0].f7View;
        } else {
          view = clicked.parents('.view')[0] && clicked.parents('.view')[0].f7View;
          if (!clickedLink.hasClass('back') && view && view.params.linksView) {
            if (typeof view.params.linksView === 'string') { view = $(view.params.linksView)[0].f7View; }
            else if (view.params.linksView instanceof View) { view = view.params.linksView; }
          }
        }
        if (!view) {
          if (app.views.main) { view = app.views.main; }
        }
        if (!view || !view.router) { return; }
        if (clickedLinkData.context && typeof clickedLinkData.context === 'string') {
          try {
            clickedLinkData.context = JSON.parse(clickedLinkData.context);
          } catch (err) {
            // something wrong there
          }
        }
        if (clickedLink.hasClass('back')) { view.router.back(url, clickedLinkData); }
        else { view.router.navigate(url, clickedLinkData); }
      }
    }

    app.on('click', handleClicks);

    // Prevent scrolling on overlays
    function preventScrolling(e) {
      e.preventDefault();
    }
    if (Support.touch && !Device.android) {
      var activeListener = Support.passiveListener ? { passive: false, capture: false } : false;
      $(doc).on((app.params.touch.fastClicks ? 'touchstart' : 'touchmove'), '.panel-backdrop, .dialog-backdrop, .preloader-backdrop, .popup-backdrop, .searchbar-backdrop', preventScrolling, activeListener);
    }
  }
  var ClicksModule = {
    name: 'clicks',
    params: {
      clicks: {
        // External Links
        externalLinks: '.external',
      },
    },
    on: {
      init: function init() {
        var app = this;
        initClicks(app);
      },
    },
  };

  var HistoryModule = {
    name: 'history',
    static: {
      history: History,
    },
    on: {
      init: function init() {
        History.init(this);
      },
    },
  };

  var keyPrefix = 'f7storage-';
  var Storage = {
    get: function get(key) {
      return Utils.promise(function (resolve, reject) {
        try {
          var value = JSON.parse(win.localStorage.getItem(("" + keyPrefix + key)));
          resolve(value);
        } catch (e) {
          reject(e);
        }
      });
    },
    set: function set(key, value) {
      return Utils.promise(function (resolve, reject) {
        try {
          win.localStorage.setItem(("" + keyPrefix + key), JSON.stringify(value));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
    remove: function remove(key) {
      return Utils.promise(function (resolve, reject) {
        try {
          win.localStorage.removeItem(("" + keyPrefix + key));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
    clear: function clear() {

    },
    length: function length() {

    },
    keys: function keys() {
      return Utils.promise(function (resolve, reject) {
        try {
          var keys = Object.keys(win.localStorage)
            .filter(function (keyName) { return keyName.indexOf(keyPrefix) === 0; })
            .map(function (keyName) { return keyName.replace(keyPrefix, ''); });
          resolve(keys);
        } catch (e) {
          reject(e);
        }
      });
    },
    forEach: function forEach(callback) {
      return Utils.promise(function (resolve, reject) {
        try {
          Object.keys(win.localStorage)
            .filter(function (keyName) { return keyName.indexOf(keyPrefix) === 0; })
            .forEach(function (keyName, index) {
              var key = keyName.replace(keyPrefix, '');
              Storage.get(key).then(function (value) {
                callback(key, value, index);
              });
            });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
  };

  var StorageModule = {
    name: 'storage',
    static: {
      Storage: Storage,
      storage: Storage,
    },
  };

  function vnode(sel, data, children, text, elm) {
      var key = data === undefined ? undefined : data.key;
      return { sel: sel, data: data, children: children,
          text: text, elm: elm, key: key };
  }

  var array = Array.isArray;
  function primitive(s) {
      return typeof s === 'string' || typeof s === 'number';
  }

  function addNS(data, children, sel) {
      data.ns = 'http://www.w3.org/2000/svg';
      if (sel !== 'foreignObject' && children !== undefined) {
          for (var i = 0; i < children.length; ++i) {
              var childData = children[i].data;
              if (childData !== undefined) {
                  addNS(childData, children[i].children, children[i].sel);
              }
          }
      }
  }
  function h(sel, b, c) {
      var data = {}, children, text, i;
      if (c !== undefined) {
          data = b;
          if (array(c)) {
              children = c;
          }
          else if (primitive(c)) {
              text = c;
          }
          else if (c && c.sel) {
              children = [c];
          }
      }
      else if (b !== undefined) {
          if (array(b)) {
              children = b;
          }
          else if (primitive(b)) {
              text = b;
          }
          else if (b && b.sel) {
              children = [b];
          }
          else {
              data = b;
          }
      }
      if (array(children)) {
          for (i = 0; i < children.length; ++i) {
              if (primitive(children[i]))
                  { children[i] = vnode(undefined, undefined, undefined, children[i], undefined); }
          }
      }
      if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
          (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
          addNS(data, children, sel);
      }
      return vnode(sel, data, children, text, undefined);
  }

  /* eslint no-use-before-define: "off" */

  var selfClosing = 'area base br col command embed hr img input keygen link menuitem meta param source track wbr'.split(' ');
  var propsAttrs = 'hidden checked disabled readonly selected autocomplete autofocus autoplay required multiple value'.split(' ');
  var booleanProps = 'hidden checked disabled readonly selected autocomplete autofocus autoplay required multiple readOnly'.split(' ');
  var tempDom = doc.createElement('div');

  function getHooks(data, app, initial, isRoot) {
    var hooks = {};
    if (!data || !data.attrs || !data.attrs.class) { return hooks; }
    var classNames = data.attrs.class;
    var insert = [];
    var destroy = [];
    var update = [];
    var postpatch = [];
    classNames.split(' ').forEach(function (className) {
      if (!initial) {
        insert.push.apply(insert, app.getVnodeHooks('insert', className));
      }
      destroy.push.apply(destroy, app.getVnodeHooks('destroy', className));
      update.push.apply(update, app.getVnodeHooks('update', className));
      postpatch.push.apply(postpatch, app.getVnodeHooks('postpatch', className));
    });

    if (isRoot && !initial) {
      postpatch.push(function (oldVnode, vnode) {
        var vn = vnode || oldVnode;
        if (!vn) { return; }
        if (vn.data && vn.data.context && vn.data.context.$options.updated) {
          vn.data.context.$options.updated();
        }
      });
    }
    if (insert.length === 0 && destroy.length === 0 && update.length === 0 && postpatch.length === 0) {
      return hooks;
    }
    if (insert.length) {
      hooks.insert = function (vnode) {
        insert.forEach(function (f) { return f(vnode); });
      };
    }
    if (destroy.length) {
      hooks.destroy = function (vnode) {
        destroy.forEach(function (f) { return f(vnode); });
      };
    }
    if (update.length) {
      hooks.update = function (oldVnode, vnode) {
        update.forEach(function (f) { return f(oldVnode, vnode); });
      };
    }
    if (postpatch.length) {
      hooks.postpatch = function (oldVnode, vnode) {
        postpatch.forEach(function (f) { return f(oldVnode, vnode); });
      };
    }

    return hooks;
  }
  function getEventHandler(handlerString, context, ref) {
    if ( ref === void 0 ) ref = {};
    var stop = ref.stop;
    var prevent = ref.prevent;
    var once = ref.once;

    var fired = false;

    var methodName;
    var method;
    var customArgs = [];
    var needMethodBind = true;

    if (handlerString.indexOf('(') < 0) {
      methodName = handlerString;
    } else {
      methodName = handlerString.split('(')[0];
    }
    if (methodName.indexOf('.') >= 0) {
      methodName.split('.').forEach(function (path, pathIndex) {
        if (pathIndex === 0 && path === 'this') { return; }
        if (pathIndex === 0 && path === 'window') {
          // eslint-disable-next-line
          method = win;
          needMethodBind = false;
          return;
        }
        if (!method) { method = context; }
        if (method[path]) { method = method[path]; }
        else {
          throw new Error(("Framework7: Component doesn't have method \"" + (methodName.split('.').slice(0, pathIndex + 1).join('.')) + "\""));
        }
      });
    } else {
      if (!context[methodName]) {
        throw new Error(("Framework7: Component doesn't have method \"" + methodName + "\""));
      }
      method = context[methodName];
    }
    if (needMethodBind) {
      method = method.bind(context);
    }

    function handler() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var e = args[0];
      if (once && fired) { return; }
      if (stop) { e.stopPropagation(); }
      if (prevent) { e.preventDefault(); }
      fired = true;

      if (handlerString.indexOf('(') < 0) {
        customArgs = args;
      } else {
        handlerString.split('(')[1].split(')')[0].split(',').forEach(function (argument) {
          var arg = argument.trim();
          // eslint-disable-next-line
          if (!isNaN(arg)) { arg = parseFloat(arg); }
          else if (arg === 'true') { arg = true; }
          else if (arg === 'false') { arg = false; }
          else if (arg === 'null') { arg = null; }
          else if (arg === 'undefined') { arg = undefined; }
          else if (arg[0] === '"') { arg = arg.replace(/"/g, ''); }
          else if (arg[0] === '\'') { arg = arg.replace(/'/g, ''); }
          else if (arg.indexOf('.') > 0) {
            var deepArg;
            arg.split('.').forEach(function (path) {
              if (!deepArg) { deepArg = context; }
              deepArg = deepArg[path];
            });
            arg = deepArg;
          } else {
            arg = context[arg];
          }
          customArgs.push(arg);
        });
      }

      method.apply(void 0, customArgs);
    }

    return handler;
  }

  function getData(el, context, app, initial, isRoot) {
    var data = {
      context: context,
    };
    var attributes = el.attributes;
    Array.prototype.forEach.call(attributes, function (attr) {
      var attrName = attr.name;
      var attrValue = attr.value;
      if (propsAttrs.indexOf(attrName) >= 0) {
        if (!data.props) { data.props = {}; }
        if (attrName === 'readonly') {
          attrName = 'readOnly';
        }
        if (booleanProps.indexOf(attrName) >= 0) {
          // eslint-disable-next-line
          data.props[attrName] = attrValue === false ? false : true;
        } else {
          data.props[attrName] = attrValue;
        }
      } else if (attrName === 'key') {
        data.key = attrValue;
      } else if (attrName.indexOf('@') === 0) {
        if (!data.on) { data.on = {}; }
        var eventName = attrName.substr(1);
        var stop = false;
        var prevent = false;
        var once = false;
        if (eventName.indexOf('.') >= 0) {
          eventName.split('.').forEach(function (eventNamePart, eventNameIndex) {
            if (eventNameIndex === 0) { eventName = eventNamePart; }
            else {
              if (eventNamePart === 'stop') { stop = true; }
              if (eventNamePart === 'prevent') { prevent = true; }
              if (eventNamePart === 'once') { once = true; }
            }
          });
        }
        data.on[eventName] = getEventHandler(attrValue, context, { stop: stop, prevent: prevent, once: once });
      } else {
        if (!data.attrs) { data.attrs = {}; }
        data.attrs[attrName] = attrValue;

        if (attrName === 'id' && !data.key && !isRoot) {
          data.key = attrValue;
        }
      }
    });
    var hooks = getHooks(data, app, initial, isRoot);
    hooks.prepatch = function (oldVnode, vnode) {
      if (!oldVnode || !vnode) { return; }
      if (oldVnode && oldVnode.data && oldVnode.data.props) {
        Object.keys(oldVnode.data.props).forEach(function (key) {
          if (booleanProps.indexOf(key) < 0) { return; }
          if (!vnode.data) { vnode.data = {}; }
          if (!vnode.data.props) { vnode.data.props = {}; }
          if (oldVnode.data.props[key] === true && !(key in vnode.data.props)) {
            vnode.data.props[key] = false;
          }
        });
      }
    };
    if (hooks) {
      data.hook = hooks;
    }
    return data;
  }

  function getChildren(el, context, app, initial) {
    var children = [];
    var nodes = el.childNodes;
    for (var i = 0; i < nodes.length; i += 1) {
      var childNode = nodes[i];
      var child = elementToVNode(childNode, context, app, initial);
      if (child) {
        children.push(child);
      }
    }
    return children;
  }

  function elementToVNode(el, context, app, initial, isRoot) {
    if (el.nodeType === 1) {
      // element
      var tagName = el.nodeName.toLowerCase();
      return h(
        tagName,
        getData(el, context, app, initial, isRoot),
        selfClosing.indexOf(tagName) >= 0 ? [] : getChildren(el, context, app, initial)
      );
    }
    if (el.nodeType === 3) {
      // text
      return el.textContent;
    }
    return null;
  }

  function vdom (html, context, app, initial) {
    if ( html === void 0 ) html = '';

    // Save to temp dom
    tempDom.innerHTML = html.trim();

    // Parse DOM
    var rootEl;
    for (var i = 0; i < tempDom.childNodes.length; i += 1) {
      if (!rootEl && tempDom.childNodes[i].nodeType === 1) {
        rootEl = tempDom.childNodes[i];
      }
    }
    var result = elementToVNode(rootEl, context, app, initial, true);

    // Clean
    tempDom.innerHTML = '';

    return result;
  }

  function createElement(tagName) {
      return document.createElement(tagName);
  }
  function createElementNS(namespaceURI, qualifiedName) {
      return document.createElementNS(namespaceURI, qualifiedName);
  }
  function createTextNode(text) {
      return document.createTextNode(text);
  }
  function createComment(text) {
      return document.createComment(text);
  }
  function insertBefore$1(parentNode, newNode, referenceNode) {
      parentNode.insertBefore(newNode, referenceNode);
  }
  function removeChild(node, child) {
      if (!node) { return; }
      node.removeChild(child);
  }
  function appendChild(node, child) {
      node.appendChild(child);
  }
  function parentNode(node) {
      return node.parentNode;
  }
  function nextSibling(node) {
      return node.nextSibling;
  }
  function tagName(elm) {
      return elm.tagName;
  }
  function setTextContent(node, text) {
      node.textContent = text;
  }
  function getTextContent(node) {
      return node.textContent;
  }
  function isElement(node) {
      return node.nodeType === 1;
  }
  function isText(node) {
      return node.nodeType === 3;
  }
  function isComment(node) {
      return node.nodeType === 8;
  }
  var htmlDomApi = {
      createElement: createElement,
      createElementNS: createElementNS,
      createTextNode: createTextNode,
      createComment: createComment,
      insertBefore: insertBefore$1,
      removeChild: removeChild,
      appendChild: appendChild,
      parentNode: parentNode,
      nextSibling: nextSibling,
      tagName: tagName,
      setTextContent: setTextContent,
      getTextContent: getTextContent,
      isElement: isElement,
      isText: isText,
      isComment: isComment,
  };

  function isUndef(s) { return s === undefined; }
  function isDef(s) { return s !== undefined; }
  var emptyNode = vnode('', {}, [], undefined, undefined);
  function sameVnode(vnode1, vnode2) {
      return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
  }
  function isVnode(vnode$$1) {
      return vnode$$1.sel !== undefined;
  }
  function createKeyToOldIdx(children, beginIdx, endIdx) {
      var i, map = {}, key, ch;
      for (i = beginIdx; i <= endIdx; ++i) {
          ch = children[i];
          if (ch != null) {
              key = ch.key;
              if (key !== undefined)
                  { map[key] = i; }
          }
      }
      return map;
  }
  var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
  function init$1(modules, domApi) {
      var i, j, cbs = {};
      var api = domApi !== undefined ? domApi : htmlDomApi;
      for (i = 0; i < hooks.length; ++i) {
          cbs[hooks[i]] = [];
          for (j = 0; j < modules.length; ++j) {
              var hook = modules[j][hooks[i]];
              if (hook !== undefined) {
                  cbs[hooks[i]].push(hook);
              }
          }
      }
      function emptyNodeAt(elm) {
          var id = elm.id ? '#' + elm.id : '';
          var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
          return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
      }
      function createRmCb(childElm, listeners) {
          return function rmCb() {
              if (--listeners === 0) {
                  var parent_1 = api.parentNode(childElm);
                  api.removeChild(parent_1, childElm);
              }
          };
      }
      function createElm(vnode$$1, insertedVnodeQueue) {
          var i, data = vnode$$1.data;
          if (data !== undefined) {
              if (isDef(i = data.hook) && isDef(i = i.init)) {
                  i(vnode$$1);
                  data = vnode$$1.data;
              }
          }
          var children = vnode$$1.children, sel = vnode$$1.sel;
          if (sel === '!') {
              if (isUndef(vnode$$1.text)) {
                  vnode$$1.text = '';
              }
              vnode$$1.elm = api.createComment(vnode$$1.text);
          }
          else if (sel !== undefined) {
              // Parse selector
              var hashIdx = sel.indexOf('#');
              var dotIdx = sel.indexOf('.', hashIdx);
              var hash = hashIdx > 0 ? hashIdx : sel.length;
              var dot = dotIdx > 0 ? dotIdx : sel.length;
              var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
              var elm = vnode$$1.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                  : api.createElement(tag);
              if (hash < dot)
                  { elm.setAttribute('id', sel.slice(hash + 1, dot)); }
              if (dotIdx > 0)
                  { elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' ')); }
              for (i = 0; i < cbs.create.length; ++i)
                  { cbs.create[i](emptyNode, vnode$$1); }
              if (array(children)) {
                  for (i = 0; i < children.length; ++i) {
                      var ch = children[i];
                      if (ch != null) {
                          api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                      }
                  }
              }
              else if (primitive(vnode$$1.text)) {
                  api.appendChild(elm, api.createTextNode(vnode$$1.text));
              }
              i = vnode$$1.data.hook; // Reuse variable
              if (isDef(i)) {
                  if (i.create)
                      { i.create(emptyNode, vnode$$1); }
                  if (i.insert)
                      { insertedVnodeQueue.push(vnode$$1); }
              }
          }
          else {
              vnode$$1.elm = api.createTextNode(vnode$$1.text);
          }
          return vnode$$1.elm;
      }
      function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
          for (; startIdx <= endIdx; ++startIdx) {
              var ch = vnodes[startIdx];
              if (ch != null) {
                  api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
              }
          }
      }
      function invokeDestroyHook(vnode$$1) {
          var i, j, data = vnode$$1.data;
          if (data !== undefined) {
              if (isDef(i = data.hook) && isDef(i = i.destroy))
                  { i(vnode$$1); }
              for (i = 0; i < cbs.destroy.length; ++i)
                  { cbs.destroy[i](vnode$$1); }
              if (vnode$$1.children !== undefined) {
                  for (j = 0; j < vnode$$1.children.length; ++j) {
                      i = vnode$$1.children[j];
                      if (i != null && typeof i !== "string") {
                          invokeDestroyHook(i);
                      }
                  }
              }
          }
      }
      function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
          for (; startIdx <= endIdx; ++startIdx) {
              var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
              if (ch != null) {
                  if (isDef(ch.sel)) {
                      invokeDestroyHook(ch);
                      listeners = cbs.remove.length + 1;
                      rm = createRmCb(ch.elm, listeners);
                      for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                          { cbs.remove[i_1](ch, rm); }
                      if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                          i_1(ch, rm);
                      }
                      else {
                          rm();
                      }
                  }
                  else {
                      api.removeChild(parentElm, ch.elm);
                  }
              }
          }
      }
      function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
          var oldStartIdx = 0, newStartIdx = 0;
          var oldEndIdx = oldCh.length - 1;
          var oldStartVnode = oldCh[0];
          var oldEndVnode = oldCh[oldEndIdx];
          var newEndIdx = newCh.length - 1;
          var newStartVnode = newCh[0];
          var newEndVnode = newCh[newEndIdx];
          var oldKeyToIdx;
          var idxInOld;
          var elmToMove;
          var before;
          while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
              if (oldStartVnode == null) {
                  oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
              }
              else if (oldEndVnode == null) {
                  oldEndVnode = oldCh[--oldEndIdx];
              }
              else if (newStartVnode == null) {
                  newStartVnode = newCh[++newStartIdx];
              }
              else if (newEndVnode == null) {
                  newEndVnode = newCh[--newEndIdx];
              }
              else if (sameVnode(oldStartVnode, newStartVnode)) {
                  patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                  oldStartVnode = oldCh[++oldStartIdx];
                  newStartVnode = newCh[++newStartIdx];
              }
              else if (sameVnode(oldEndVnode, newEndVnode)) {
                  patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                  oldEndVnode = oldCh[--oldEndIdx];
                  newEndVnode = newCh[--newEndIdx];
              }
              else if (sameVnode(oldStartVnode, newEndVnode)) {
                  patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                  api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                  oldStartVnode = oldCh[++oldStartIdx];
                  newEndVnode = newCh[--newEndIdx];
              }
              else if (sameVnode(oldEndVnode, newStartVnode)) {
                  patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                  api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                  oldEndVnode = oldCh[--oldEndIdx];
                  newStartVnode = newCh[++newStartIdx];
              }
              else {
                  if (oldKeyToIdx === undefined) {
                      oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                  }
                  idxInOld = oldKeyToIdx[newStartVnode.key];
                  if (isUndef(idxInOld)) {
                      api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                      newStartVnode = newCh[++newStartIdx];
                  }
                  else {
                      elmToMove = oldCh[idxInOld];
                      if (elmToMove.sel !== newStartVnode.sel) {
                          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                      }
                      else {
                          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                          oldCh[idxInOld] = undefined;
                          api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                      }
                      newStartVnode = newCh[++newStartIdx];
                  }
              }
          }
          if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
              if (oldStartIdx > oldEndIdx) {
                  before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                  addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
              }
              else {
                  removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
              }
          }
      }
      function patchVnode(oldVnode, vnode$$1, insertedVnodeQueue) {
          var i, hook;
          if (isDef(i = vnode$$1.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
              i(oldVnode, vnode$$1);
          }
          var elm = vnode$$1.elm = oldVnode.elm;
          var oldCh = oldVnode.children;
          var ch = vnode$$1.children;
          if (oldVnode === vnode$$1)
              { return; }
          if (vnode$$1.data !== undefined) {
              for (i = 0; i < cbs.update.length; ++i)
                  { cbs.update[i](oldVnode, vnode$$1); }
              i = vnode$$1.data.hook;
              if (isDef(i) && isDef(i = i.update))
                  { i(oldVnode, vnode$$1); }
          }
          if (isUndef(vnode$$1.text)) {
              if (isDef(oldCh) && isDef(ch)) {
                  if (oldCh !== ch)
                      { updateChildren(elm, oldCh, ch, insertedVnodeQueue); }
              }
              else if (isDef(ch)) {
                  if (isDef(oldVnode.text))
                      { api.setTextContent(elm, ''); }
                  addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
              }
              else if (isDef(oldCh)) {
                  removeVnodes(elm, oldCh, 0, oldCh.length - 1);
              }
              else if (isDef(oldVnode.text)) {
                  api.setTextContent(elm, '');
              }
          }
          else if (oldVnode.text !== vnode$$1.text) {
              api.setTextContent(elm, vnode$$1.text);
          }
          if (isDef(hook) && isDef(i = hook.postpatch)) {
              i(oldVnode, vnode$$1);
          }
      }
      return function patch(oldVnode, vnode$$1) {
          var i, elm, parent;
          var insertedVnodeQueue = [];
          for (i = 0; i < cbs.pre.length; ++i)
              { cbs.pre[i](); }
          if (!isVnode(oldVnode)) {
              oldVnode = emptyNodeAt(oldVnode);
          }
          if (sameVnode(oldVnode, vnode$$1)) {
              patchVnode(oldVnode, vnode$$1, insertedVnodeQueue);
          }
          else {
              elm = oldVnode.elm;
              parent = api.parentNode(elm);
              createElm(vnode$$1, insertedVnodeQueue);
              if (parent !== null) {
                  api.insertBefore(parent, vnode$$1.elm, api.nextSibling(elm));
                  removeVnodes(parent, [oldVnode], 0, 0);
              }
          }
          for (i = 0; i < insertedVnodeQueue.length; ++i) {
              insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
          }
          for (i = 0; i < cbs.post.length; ++i)
              { cbs.post[i](); }
          return vnode$$1;
      };
  }

  var xlinkNS = 'http://www.w3.org/1999/xlink';
  var xmlNS = 'http://www.w3.org/XML/1998/namespace';
  var colonChar = 58;
  var xChar = 120;
  function updateAttrs(oldVnode, vnode) {
      var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
      if (!oldAttrs && !attrs)
          { return; }
      if (oldAttrs === attrs)
          { return; }
      oldAttrs = oldAttrs || {};
      attrs = attrs || {};
      // update modified attributes, add new attributes
      for (key in attrs) {
          var cur = attrs[key];
          var old = oldAttrs[key];
          if (old !== cur) {
              if (cur === true) {
                  elm.setAttribute(key, "");
              }
              else if (cur === false) {
                  elm.removeAttribute(key);
              }
              else {
                  if (key.charCodeAt(0) !== xChar) {
                      elm.setAttribute(key, cur);
                  }
                  else if (key.charCodeAt(3) === colonChar) {
                      // Assume xml namespace
                      elm.setAttributeNS(xmlNS, key, cur);
                  }
                  else if (key.charCodeAt(5) === colonChar) {
                      // Assume xlink namespace
                      elm.setAttributeNS(xlinkNS, key, cur);
                  }
                  else {
                      elm.setAttribute(key, cur);
                  }
              }
          }
      }
      // remove removed attributes
      // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
      // the other option is to remove all attributes with value == undefined
      for (key in oldAttrs) {
          if (!(key in attrs)) {
              elm.removeAttribute(key);
          }
      }
  }
  var attributesModule = { create: updateAttrs, update: updateAttrs };

  function updateProps(oldVnode, vnode) {
      var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
      if (!oldProps && !props)
          { return; }
      if (oldProps === props)
          { return; }
      oldProps = oldProps || {};
      props = props || {};
      for (key in oldProps) {
          if (!props[key]) {
              delete elm[key];
          }
      }
      for (key in props) {
          cur = props[key];
          old = oldProps[key];
          if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
              elm[key] = cur;
          }
      }
  }
  var propsModule = { create: updateProps, update: updateProps };

  function invokeHandler(handler, event, args) {
    if (typeof handler === 'function') {
      // call function handler
      handler.apply(void 0, [ event ].concat( args ));
    }
  }
  function handleEvent(event, args, vnode) {
    var name = event.type;
    var on = vnode.data.on;
    // call event handler(s) if exists
    if (on && on[name]) {
      invokeHandler(on[name], event, args, vnode);
    }
  }
  function createListener() {
    return function handler(event) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      handleEvent(event, args, handler.vnode);
    };
  }
  function updateEvents(oldVnode, vnode) {
    var oldOn = oldVnode.data.on;
    var oldListener = oldVnode.listener;
    var oldElm = oldVnode.elm;
    var on = vnode && vnode.data.on;
    var elm = (vnode && vnode.elm);
    // optimization for reused immutable handlers
    if (oldOn === on) {
      return;
    }
    // remove existing listeners which no longer used
    if (oldOn && oldListener) {
      // if element changed or deleted we remove all existing listeners unconditionally
      if (!on) {
        Object.keys(oldOn).forEach(function (name) {
          $(oldElm).off(name, oldListener);
        });
      } else {
        Object.keys(oldOn).forEach(function (name) {
          if (!on[name]) {
            $(oldElm).off(name, oldListener);
          }
        });
      }
    }
    // add new listeners which has not already attached
    if (on) {
      // reuse existing listener or create new
      var listener = oldVnode.listener || createListener();
      vnode.listener = listener;
      // update vnode for listener
      listener.vnode = vnode;
      // if element changed or added we add all needed listeners unconditionally
      if (!oldOn) {
        Object.keys(on).forEach(function (name) {
          $(elm).on(name, listener);
        });
      } else {
        Object.keys(on).forEach(function (name) {
          if (!oldOn[name]) {
            $(elm).on(name, listener);
          }
        });
      }
    }
  }

  var eventListenersModule = {
    create: updateEvents,
    update: updateEvents,
    destroy: updateEvents,
  };

  /* eslint import/no-named-as-default: off */

  var patch = init$1([
    attributesModule,
    propsModule,
    eventListenersModule ]);

  var Framework7Component = function Framework7Component(app, options, extendContext) {
    if ( extendContext === void 0 ) extendContext = {};

    var id = Utils.id();
    var self = Utils.merge(
      this,
      extendContext,
      {
        $: $,
        $$: $,
        $dom7: $,
        $app: app,
        $options: Utils.extend({ id: id }, options),
      }
    );
    var $options = self.$options;

    // Root data and methods
    Object.defineProperty(self, '$root', {
      enumerable: true,
      configurable: true,
      get: function get() {
        var root = Utils.merge({}, app.data, app.methods);
        if (win && win.Proxy) {
          root = new win.Proxy(root, {
            set: function set(target, name, val) {
              app.data[name] = val;
            },
            deleteProperty: function deleteProperty(target, name) {
              delete app.data[name];
              delete app.methods[name];
            },
            has: function has(target, name) {
              return (name in app.data || name in app.methods);
            },
          });
        }
        return root;
      },
      set: function set() {},
    });

    // Apply context
    ('beforeCreate created beforeMount mounted beforeDestroy destroyed updated').split(' ').forEach(function (cycleKey) {
      if ($options[cycleKey]) { $options[cycleKey] = $options[cycleKey].bind(self); }
    });

    if ($options.data) {
      $options.data = $options.data.bind(self);
      // Data
      Utils.extend(self, $options.data());
    }
    if ($options.render) { $options.render = $options.render.bind(self); }
    if ($options.methods) {
      Object.keys($options.methods).forEach(function (methodName) {
        self[methodName] = $options.methods[methodName].bind(self);
      });
    }

    // Bind Events
    if ($options.on) {
      Object.keys($options.on).forEach(function (eventName) {
        $options.on[eventName] = $options.on[eventName].bind(self);
      });
    }
    if ($options.once) {
      Object.keys($options.once).forEach(function (eventName) {
        $options.once[eventName] = $options.once[eventName].bind(self);
      });
    }

    // Before create hook
    if ($options.beforeCreate) { $options.beforeCreate(); }

    // Render
    var html = self.$render();

    // Make Dom
    if (html && typeof html === 'string') {
      html = html.trim();
      self.$vnode = vdom(html, self, app, true);
      self.el = doc.createElement('div');
      patch(self.el, self.$vnode);
    } else if (html) {
      self.el = html;
    }
    self.$el = $(self.el);

    // Set styles scope ID
    if ($options.style) {
      self.$styleEl = doc.createElement('style');
      self.$styleEl.innerHTML = $options.style;
      if ($options.styleScoped) {
        self.el.setAttribute(("data-f7-" + ($options.id)), '');
      }
    }

    self.$attachEvents();

    // Created callback
    if ($options.created) { $options.created(); }

    // Store component instance
    self.el.f7Component = self;

    return self;
  };

  Framework7Component.prototype.$attachEvents = function $attachEvents () {
    var self = this;
    var $options = self.$options;
      var $el = self.$el;
    if ($options.on) {
      Object.keys($options.on).forEach(function (eventName) {
        $el.on(Utils.eventNameToColonCase(eventName), $options.on[eventName]);
      });
    }
    if ($options.once) {
      Object.keys($options.once).forEach(function (eventName) {
        $el.once(Utils.eventNameToColonCase(eventName), $options.once[eventName]);
      });
    }
  };

  Framework7Component.prototype.$detachEvents = function $detachEvents () {
    var self = this;
    var $options = self.$options;
      var $el = self.$el;
    if ($options.on) {
      Object.keys($options.on).forEach(function (eventName) {
        $el.off(Utils.eventNameToColonCase(eventName), $options.on[eventName]);
      });
    }
    if ($options.once) {
      Object.keys($options.once).forEach(function (eventName) {
        $el.off(Utils.eventNameToColonCase(eventName), $options.once[eventName]);
      });
    }
  };

  Framework7Component.prototype.$render = function $render () {
    var self = this;
    var $options = self.$options;
    var html = '';
    if ($options.render) {
      html = $options.render();
    } else if ($options.template) {
      if (typeof $options.template === 'string') {
        try {
          html = Template7.compile($options.template)(self);
        } catch (err) {
          throw err;
        }
      } else {
        // Supposed to be function
        html = $options.template(self);
      }
    }
    return html;
  };

  Framework7Component.prototype.$forceUpdate = function $forceUpdate () {
    var self = this;
    var html = self.$render();

    // Make Dom
    if (html && typeof html === 'string') {
      html = html.trim();
      var newVNode = vdom(html, self, self.$app);
      self.$vnode = patch(self.$vnode, newVNode);
    }
  };

  Framework7Component.prototype.$setState = function $setState (mergeState) {
    var self = this;
    Utils.merge(self, mergeState);
    self.$forceUpdate();
  };

  Framework7Component.prototype.$mount = function $mount (mountMethod) {
    var self = this;
    if (self.$options.beforeMount) { self.$options.beforeMount(); }
    if (self.$styleEl) { $('head').append(self.$styleEl); }
    if (mountMethod) { mountMethod(self.el); }
    if (self.$options.mounted) { self.$options.mounted(); }
  };

  Framework7Component.prototype.$destroy = function $destroy () {
    var self = this;
    if (self.$options.beforeDestroy) { self.$options.beforeDestroy(); }
    if (self.$styleEl) { $(self.$styleEl).remove(); }
    self.$detachEvents();
    if (self.$options.destroyed) { self.$options.destroyed(); }
    // Delete component instance
    if (self.el && self.el.f7Component) {
      self.el.f7Component = null;
      delete self.el.f7Component;
    }
    // Patch with empty node
    if (self.$vnode) {
      self.$vnode = patch(self.$vnode, { sel: self.$vnode.sel, data: {} });
    }
    Utils.deleteProps(self);
  };

  function parseComponent(componentString) {
    var id = Utils.id();
    var callbackCreateName = "f7_component_create_callback_" + id;
    var callbackRenderName = "f7_component_render_callback_" + id;

    // Template
    var template;
    var hasTemplate = componentString.match(/<template([ ]?)([a-z0-9-]*)>/);
    var templateType = hasTemplate[2] || 't7';
    if (hasTemplate) {
      template = componentString
        .split(/<template[ ]?[a-z0-9-]*>/)
        .filter(function (item, index) { return index > 0; })
        .join('<template>')
        .split('</template>')
        .filter(function (item, index, arr) { return index < arr.length - 1; })
        .join('</template>')
        .replace(/{{#raw}}([ \n]*)<template/g, '{{#raw}}<template')
        .replace(/\/template>([ \n]*){{\/raw}}/g, '/template>{{/raw}}')
        .replace(/([ \n])<template/g, '$1{{#raw}}<template')
        .replace(/\/template>([ \n])/g, '/template>{{/raw}}$1');
    }

    // Parse Styles
    var style = null;
    var styleScoped = false;

    if (componentString.indexOf('<style>') >= 0) {
      style = componentString.split('<style>')[1].split('</style>')[0];
    } else if (componentString.indexOf('<style scoped>') >= 0) {
      styleScoped = true;
      style = componentString.split('<style scoped>')[1].split('</style>')[0];
      style = style.split('\n').map(function (line) {
        var trimmedLine = line.trim();
        if (trimmedLine.indexOf('@') === 0) { return line; }
        if (line.indexOf('{') >= 0) {
          if (line.indexOf('{{this}}') >= 0) {
            return line.replace('{{this}}', ("[data-f7-" + id + "]"));
          }
          return ("[data-f7-" + id + "] " + (line.trim()));
        }
        return line;
      }).join('\n');
    }

    // Parse Script
    var scriptContent;
    var scriptEl;
    if (componentString.indexOf('<script>') >= 0) {
      var scripts = componentString.split('<script>');
      scriptContent = scripts[scripts.length - 1].split('</script>')[0].trim();
    } else {
      scriptContent = 'return {}';
    }
    scriptContent = "window." + callbackCreateName + " = function () {" + scriptContent + "}";

    // Insert Script El
    scriptEl = doc.createElement('script');
    scriptEl.innerHTML = scriptContent;
    $('head').append(scriptEl);

    var component = win[callbackCreateName]();

    // Remove Script El
    $(scriptEl).remove();
    win[callbackCreateName] = null;
    delete win[callbackCreateName];

    // Assign Template
    if (!component.template && !component.render) {
      component.template = template;
      component.templateType = templateType;
    }
    if (component.template) {
      if (component.templateType === 't7') {
        component.template = Template7.compile(component.template);
      }
      if (component.templateType === 'es') {
        var renderContent = "window." + callbackRenderName + " = function () {\n        return function render() {\n          return `" + (component.template) + "`;\n        }\n      }";
        scriptEl = doc.createElement('script');
        scriptEl.innerHTML = renderContent;
        $('head').append(scriptEl);

        component.render = win[callbackRenderName]();

        // Remove Script El
        $(scriptEl).remove();
        win[callbackRenderName] = null;
        delete win[callbackRenderName];
      }
    }

    // Assign Style
    if (style) {
      component.style = style;
      component.styleScoped = styleScoped;
    }

    // Component ID
    component.id = id;
    return component;
  }

  var ComponentModule = {
    name: 'component',
    create: function create() {
      var app = this;
      app.component = {
        parse: function parse(componentString) {
          return parseComponent(componentString);
        },
        create: function create(options, extendContext) {
          return new Framework7Component(app, options, extendContext);
        },
      };
    },
  };

  var Statusbar = {
    hide: function hide() {
      $('html').removeClass('with-statusbar');
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.hide();
      }
    },
    show: function show() {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.show();
        Utils.nextTick(function () {
          if (Device.needsStatusbarOverlay()) {
            $('html').addClass('with-statusbar');
          }
        });
        return;
      }
      $('html').addClass('with-statusbar');
    },
    onClick: function onClick() {
      var app = this;
      var pageContent;
      if ($('.popup.modal-in').length > 0) {
        // Check for opened popup
        pageContent = $('.popup.modal-in').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.panel.panel-active').length > 0) {
        // Check for opened panel
        pageContent = $('.panel.panel-active').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.views > .view.tab-active').length > 0) {
        // View in tab bar app layout
        pageContent = $('.views > .view.tab-active').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($('.views').length > 0) {
        pageContent = $('.views').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else {
        pageContent = app.root.children('.view').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      }

      if (pageContent && pageContent.length > 0) {
        // Check for tab
        if (pageContent.hasClass('tab')) {
          pageContent = pageContent.parent('.tabs').children('.page-content.tab-active');
        }
        if (pageContent.length > 0) { pageContent.scrollTop(0, 300); }
      }
    },
    setIosTextColor: function setIosTextColor(color) {
      if (Device.cordova && win.StatusBar) {
        if (color === 'white') {
          win.StatusBar.styleLightContent();
        } else {
          win.StatusBar.styleDefault();
        }
      }
    },
    setBackgroundColor: function setBackgroundColor(color) {
      $('.statusbar').css('background-color', color);
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.backgroundColorByHexString(color);
      }
    },
    isVisible: function isVisible() {
      if (Device.cordova && win.StatusBar) {
        return win.StatusBar.isVisible;
      }
      return false;
    },
    iosOverlaysWebView: function iosOverlaysWebView(overlays) {
      if ( overlays === void 0 ) overlays = true;

      if (!Device.ios) { return; }
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.overlaysWebView(overlays);
        if (overlays) {
          $('html').addClass('with-statusbar');
        } else {
          $('html').removeClass('with-statusbar');
        }
      }
    },
    checkOverlay: function checkOverlay() {
      if (Device.needsStatusbarOverlay()) {
        $('html').addClass('with-statusbar');
      } else {
        $('html').removeClass('with-statusbar');
      }
    },
    init: function init() {
      var app = this;
      var params = app.params.statusbar;
      if (!params.enabled) { return; }

      if (params.overlay === 'auto') {
        if (Device.needsStatusbarOverlay()) {
          $('html').addClass('with-statusbar');
        } else {
          $('html').removeClass('with-statusbar');
        }

        if (Device.ios && (Device.cordova || Device.webView)) {
          if (win.orientation === 0) {
            app.once('resize', function () {
              Statusbar.checkOverlay();
            });
          }

          $(doc).on('resume', function () {
            Statusbar.checkOverlay();
          }, false);

          app.on(Device.ios ? 'orientationchange' : 'orientationchange resize', function () {
            Statusbar.checkOverlay();
          });
        }
      } else if (params.overlay === true) {
        $('html').addClass('with-statusbar');
      } else if (params.overlay === false) {
        $('html').removeClass('with-statusbar');
      }

      if (Device.cordova && win.StatusBar) {
        if (params.scrollTopOnClick) {
          $(win).on('statusTap', Statusbar.onClick.bind(app));
        }
        if (params.iosOverlaysWebView) {
          win.StatusBar.overlaysWebView(true);
        } else {
          win.StatusBar.overlaysWebView(false);
        }

        if (params.iosTextColor === 'white') {
          win.StatusBar.styleLightContent();
        } else {
          win.StatusBar.styleDefault();
        }
      }
      if (params.iosBackgroundColor && app.theme === 'ios') {
        Statusbar.setBackgroundColor(params.iosBackgroundColor);
      }
      if (params.materialBackgroundColor && app.theme === 'md') {
        Statusbar.setBackgroundColor(params.materialBackgroundColor);
      }
    },
  };

  var Statusbar$1 = {
    name: 'statusbar',
    params: {
      statusbar: {
        enabled: true,
        overlay: 'auto',
        scrollTopOnClick: true,
        iosOverlaysWebView: true,
        iosTextColor: 'black',
        iosBackgroundColor: null,
        materialBackgroundColor: null,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        statusbar: {
          checkOverlay: Statusbar.checkOverlay,
          hide: Statusbar.hide,
          show: Statusbar.show,
          iosOverlaysWebView: Statusbar.iosOverlaysWebView,
          setIosTextColor: Statusbar.setIosTextColor,
          setBackgroundColor: Statusbar.setBackgroundColor,
          isVisible: Statusbar.isVisible,
          init: Statusbar.init.bind(app),
        },
      });
    },
    on: {
      init: function init() {
        var app = this;
        Statusbar.init.call(app);
      },
    },
    clicks: {
      '.statusbar': function onStatusbarClick() {
        var app = this;
        if (!app.params.statusbar.enabled) { return; }
        if (!app.params.statusbar.scrollTopOnClick) { return; }
        Statusbar.onClick.call(app);
      },
    },
  };

  function getCurrentView(app) {
    var popoverView = $('.popover.modal-in .view');
    var popupView = $('.popup.modal-in .view');
    var panelView = $('.panel.panel-active .view');
    var appViews = $('.views');
    if (appViews.length === 0) { appViews = app.root; }
    // Find active view as tab
    var appView = appViews.children('.view');
    // Propably in tabs or split view
    if (appView.length > 1) {
      if (appView.hasClass('tab')) {
        // Tabs
        appView = appViews.children('.view.tab-active');
      }
    }
    if (popoverView.length > 0 && popoverView[0].f7View) { return popoverView[0].f7View; }
    if (popupView.length > 0 && popupView[0].f7View) { return popupView[0].f7View; }
    if (panelView.length > 0 && panelView[0].f7View) { return panelView[0].f7View; }
    if (appView.length > 0) {
      if (appView.length === 1 && appView[0].f7View) { return appView[0].f7View; }
      if (appView.length > 1) {
        return app.views.main;
      }
    }
    return undefined;
  }

  var View$1 = {
    name: 'view',
    params: {
      view: {
        name: undefined,
        main: false,
        router: true,
        linksView: null,
        stackPages: false,
        xhrCache: true,
        xhrCacheIgnore: [],
        xhrCacheIgnoreGetParameters: false,
        xhrCacheDuration: 1000 * 60 * 10, // Ten minutes
        preloadPreviousPage: true,
        uniqueHistory: false,
        uniqueHistoryIgnoreGetParameters: false,
        allowDuplicateUrls: false,
        reloadPages: false,
        removeElements: true,
        removeElementsWithTimeout: false,
        removeElementsTimeout: 0,
        restoreScrollTopOnBack: true,
        unloadTabContent: true,
        passRouteQueryToRequest: true,
        passRouteParamsToRequest: false,
        // Swipe Back
        iosSwipeBack: true,
        iosSwipeBackAnimateShadow: true,
        iosSwipeBackAnimateOpacity: true,
        iosSwipeBackActiveArea: 30,
        iosSwipeBackThreshold: 0,
        mdSwipeBack: false,
        mdSwipeBackAnimateShadow: true,
        mdSwipeBackAnimateOpacity: false,
        mdSwipeBackActiveArea: 30,
        mdSwipeBackThreshold: 0,
        // Push State
        pushState: false,
        pushStateRoot: undefined,
        pushStateAnimate: true,
        pushStateAnimateOnLoad: false,
        pushStateSeparator: '#!',
        pushStateOnLoad: true,
        // Animate Pages
        animate: true,
        animateWithJS: false,
        // iOS Dynamic Navbar
        iosDynamicNavbar: true,
        iosSeparateDynamicNavbar: true,
        // Animate iOS Navbar Back Icon
        iosAnimateNavbarBackIcon: true,
        // Delays
        iosPageLoadDelay: 0,
        materialPageLoadDelay: 0,
        // Routes hooks
        routesBeforeEnter: null,
        routesBeforeLeave: null,
      },
    },
    static: {
      View: View,
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        views: Utils.extend([], {
          create: function create(el, params) {
            return new View(app, el, params);
          },
          get: function get(viewEl) {
            var $viewEl = $(viewEl);
            if ($viewEl.length && $viewEl[0].f7View) { return $viewEl[0].f7View; }
            return undefined;
          },
        }),
      });
      Object.defineProperty(app.views, 'current', {
        enumerable: true,
        configurable: true,
        get: function get() {
          return getCurrentView(app);
        },
      });
      // Alias
      app.view = app.views;
    },
    on: {
      init: function init() {
        var app = this;
        $('.view-init').each(function (index, viewEl) {
          if (viewEl.f7View) { return; }
          var viewParams = $(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      modalOpen: function modalOpen(modal) {
        var app = this;
        modal.$el.find('.view-init').each(function (index, viewEl) {
          if (viewEl.f7View) { return; }
          var viewParams = $(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      modalBeforeDestroy: function modalBeforeDestroy(modal) {
        if (!modal || !modal.$el) { return; }
        modal.$el.find('.view-init').each(function (index, viewEl) {
          var view = viewEl.f7View;
          if (!view) { return; }
          view.destroy();
        });
      },
    },
  };

  var Navbar = {
    size: function size(el) {
      var app = this;
      if (app.theme !== 'ios') { return; }
      var $el = $(el);
      if ($el.hasClass('navbar')) {
        $el = $el.children('.navbar-inner').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
        return;
      }
      if (
        $el.hasClass('stacked')
        || $el.parents('.stacked').length > 0
        || $el.parents('.tab:not(.tab-active)').length > 0
        || $el.parents('.popup:not(.modal-in)').length > 0
      ) {
        return;
      }
      var $viewEl = $el.parents('.view').eq(0);
      var left = app.rtl ? $el.children('.right') : $el.children('.left');
      var right = app.rtl ? $el.children('.left') : $el.children('.right');
      var title = $el.children('.title');
      var subnavbar = $el.children('.subnavbar');
      var noLeft = left.length === 0;
      var noRight = right.length === 0;
      var leftWidth = noLeft ? 0 : left.outerWidth(true);
      var rightWidth = noRight ? 0 : right.outerWidth(true);
      var titleWidth = title.outerWidth(true);
      var navbarStyles = $el.styles();
      var navbarWidth = $el[0].offsetWidth;
      var navbarInnerWidth = navbarWidth - parseInt(navbarStyles.paddingLeft, 10) - parseInt(navbarStyles.paddingRight, 10);
      var isPrevious = $el.hasClass('navbar-previous');
      var sliding = $el.hasClass('sliding');

      var router;
      var dynamicNavbar;
      var separateNavbar;
      var separateNavbarRightOffset = 0;
      var separateNavbarLeftOffset = 0;

      if ($viewEl.length > 0 && $viewEl[0].f7View) {
        router = $viewEl[0].f7View.router;
        dynamicNavbar = router && router.dynamicNavbar;
        separateNavbar = router && router.separateNavbar;
        if (!separateNavbar) {
          separateNavbarRightOffset = navbarWidth;
          separateNavbarLeftOffset = navbarWidth / 5;
        }
      }

      var currLeft;
      var diff;
      if (noRight) {
        currLeft = navbarInnerWidth - titleWidth;
      }
      if (noLeft) {
        currLeft = 0;
      }
      if (!noLeft && !noRight) {
        currLeft = ((navbarInnerWidth - rightWidth - titleWidth) + leftWidth) / 2;
      }
      var requiredLeft = (navbarInnerWidth - titleWidth) / 2;
      if (navbarInnerWidth - leftWidth - rightWidth > titleWidth) {
        if (requiredLeft < leftWidth) {
          requiredLeft = leftWidth;
        }
        if (requiredLeft + titleWidth > navbarInnerWidth - rightWidth) {
          requiredLeft = navbarInnerWidth - rightWidth - titleWidth;
        }
        diff = requiredLeft - currLeft;
      } else {
        diff = 0;
      }

      // RTL inverter
      var inverter = app.rtl ? -1 : 1;

      if (dynamicNavbar) {
        if (title.hasClass('sliding') || (title.length > 0 && sliding)) {
          var titleLeftOffset = (-(currLeft + diff) * inverter) + separateNavbarLeftOffset;
          var titleRightOffset = ((navbarInnerWidth - currLeft - diff - titleWidth) * inverter) - separateNavbarRightOffset;

          if (isPrevious) {
            if (router && router.params.iosAnimateNavbarBackIcon) {
              var activeNavbarBackLink = $el.parent().find('.navbar-current').children('.left.sliding').find('.back .icon ~ span');
              if (activeNavbarBackLink.length > 0) {
                titleLeftOffset += activeNavbarBackLink[0].offsetLeft;
              }
            }
          }
          title[0].f7NavbarLeftOffset = titleLeftOffset;
          title[0].f7NavbarRightOffset = titleRightOffset;
        }
        if (!noLeft && (left.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            left[0].f7NavbarLeftOffset = (-(navbarInnerWidth - left[0].offsetWidth) / 2) * inverter;
            left[0].f7NavbarRightOffset = leftWidth * inverter;
          } else {
            left[0].f7NavbarLeftOffset = -leftWidth + separateNavbarLeftOffset;
            left[0].f7NavbarRightOffset = ((navbarInnerWidth - left[0].offsetWidth) / 2) - separateNavbarRightOffset;
            if (router && router.params.iosAnimateNavbarBackIcon && left.find('.back .icon').length > 0) {
              left[0].f7NavbarRightOffset -= left.find('.back .icon')[0].offsetWidth;
            }
          }
        }
        if (!noRight && (right.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            right[0].f7NavbarLeftOffset = -rightWidth * inverter;
            right[0].f7NavbarRightOffset = ((navbarInnerWidth - right[0].offsetWidth) / 2) * inverter;
          } else {
            right[0].f7NavbarLeftOffset = (-(navbarInnerWidth - right[0].offsetWidth) / 2) + separateNavbarLeftOffset;
            right[0].f7NavbarRightOffset = rightWidth - separateNavbarRightOffset;
          }
        }
        if (subnavbar.length && (subnavbar.hasClass('sliding') || sliding)) {
          subnavbar[0].f7NavbarLeftOffset = app.rtl ? subnavbar[0].offsetWidth : (-subnavbar[0].offsetWidth + separateNavbarLeftOffset);
          subnavbar[0].f7NavbarRightOffset = (-subnavbar[0].f7NavbarLeftOffset - separateNavbarRightOffset) + separateNavbarLeftOffset;
        }
      }

      // Title left
      if (app.params.navbar.iosCenterTitle) {
        var titleLeft = diff;
        if (app.rtl && noLeft && noRight && title.length > 0) { titleLeft = -titleLeft; }
        title.css({ left: (titleLeft + "px") });
      }
    },
    hide: function hide(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $(el);
      if ($el.hasClass('navbar-inner')) { $el = $el.parents('.navbar'); }
      if (!$el.length) { return; }
      if ($el.hasClass('navbar-hidden')) { return; }
      var className = "navbar-hidden" + (animate ? ' navbar-transitioning' : '');
      $el.transitionEnd(function () {
        $el.removeClass('navbar-transitioning');
      });
      $el.addClass(className);
    },
    show: function show(el, animate) {
      if ( el === void 0 ) el = '.navbar-hidden';
      if ( animate === void 0 ) animate = true;

      var $el = $(el);
      if ($el.hasClass('navbar-inner')) { $el = $el.parents('.navbar'); }
      if (!$el.length) { return; }
      if (!$el.hasClass('navbar-hidden')) { return; }
      if (animate) {
        $el.addClass('navbar-transitioning');
        $el.transitionEnd(function () {
          $el.removeClass('navbar-transitioning');
        });
      }
      $el.removeClass('navbar-hidden');
    },
    getElByPage: function getElByPage(page) {
      var $pageEl;
      var $navbarEl;
      var pageData;
      if (page.$navbarEl || page.$el) {
        pageData = page;
        $pageEl = page.$el;
      } else {
        $pageEl = $(page);
        if ($pageEl.length > 0) { pageData = $pageEl[0].f7Page; }
      }
      if (pageData && pageData.$navbarEl && pageData.$navbarEl.length > 0) {
        $navbarEl = pageData.$navbarEl;
      } else if ($pageEl) {
        $navbarEl = $pageEl.children('.navbar').children('.navbar-inner');
      }
      if (!$navbarEl || ($navbarEl && $navbarEl.length === 0)) { return undefined; }
      return $navbarEl[0];
    },
    getPageByEl: function getPageByEl(navbarInnerEl) {
      var $navbarInnerEl = $(navbarInnerEl);
      if ($navbarInnerEl.hasClass('navbar')) {
        $navbarInnerEl = $navbarInnerEl.find('.navbar-inner');
        if ($navbarInnerEl.length > 1) { return undefined; }
      }
      return $navbarInnerEl[0].f7Page;
    },
    initHideNavbarOnScroll: function initHideNavbarOnScroll(pageEl, navbarInnerEl) {
      var app = this;
      var $pageEl = $(pageEl);
      var $navbarEl = $(navbarInnerEl || app.navbar.getElByPage(pageEl)).closest('.navbar');

      var previousScrollTop;
      var currentScrollTop;

      var scrollHeight;
      var offsetHeight;
      var reachEnd;
      var action;
      var navbarHidden;
      function handleScroll() {
        var scrollContent = this;
        if ($pageEl.hasClass('page-previous')) { return; }
        currentScrollTop = scrollContent.scrollTop;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        navbarHidden = $navbarEl.hasClass('navbar-hidden');

        if (reachEnd) {
          if (app.params.navbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.navbar.showOnPageScrollTop || currentScrollTop <= 44) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > 44) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && navbarHidden) {
          app.navbar.show($navbarEl);
          navbarHidden = false;
        } else if (action === 'hide' && !navbarHidden) {
          app.navbar.hide($navbarEl);
          navbarHidden = true;
        }

        previousScrollTop = currentScrollTop;
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      $pageEl[0].f7ScrollNavbarHandler = handleScroll;
    },
  };
  var Navbar$1 = {
    name: 'navbar',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        navbar: {
          size: Navbar.size.bind(app),
          hide: Navbar.hide.bind(app),
          show: Navbar.show.bind(app),
          getElByPage: Navbar.getElByPage.bind(app),
          initHideNavbarOnScroll: Navbar.initHideNavbarOnScroll.bind(app),
        },
      });
    },
    params: {
      navbar: {
        scrollTopOnTitleClick: true,
        iosCenterTitle: true,
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
      },
    },
    on: {
      'panelBreakpoint resize': function onResize() {
        var app = this;
        if (app.theme !== 'ios') { return; }
        $('.navbar').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        if (page.$el[0].f7ScrollNavbarHandler) {
          page.$el.off('scroll', '.page-content', page.$el[0].f7ScrollNavbarHandler, true);
        }
      },
      pageBeforeIn: function pageBeforeIn(page) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        var $navbarEl;
        var view = page.$el.parents('.view')[0].f7View;
        var navbarInnerEl = app.navbar.getElByPage(page);
        if (!navbarInnerEl) {
          $navbarEl = page.$el.parents('.view').children('.navbar');
        } else {
          $navbarEl = $(navbarInnerEl).parents('.navbar');
        }
        if (page.$el.hasClass('no-navbar') || (view.router.dynamicNavbar && !navbarInnerEl)) {
          var animate = !!(page.pageFrom && page.router.history.length > 0);
          app.navbar.hide($navbarEl, animate);
        } else {
          app.navbar.show($navbarEl);
        }
      },
      pageReinit: function pageReinit(page) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        var $navbarEl = $(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) { return; }
        app.navbar.size($navbarEl);
      },
      pageInit: function pageInit(page) {
        var app = this;
        var $navbarEl = $(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) { return; }
        if (app.theme === 'ios') {
          app.navbar.size($navbarEl);
        }
        if (
          app.params.navbar.hideOnPageScroll
          || page.$el.find('.hide-navbar-on-scroll').length
          || page.$el.hasClass('hide-navbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-navbar-on-scroll').length
            || page.$el.hasClass('keep-navbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            return;
          }
          app.navbar.initHideNavbarOnScroll(page.el, $navbarEl[0]);
        }
      },
      modalOpen: function modalOpen(modal) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        modal.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      panelOpen: function panelOpen(panel) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        panel.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      panelSwipeOpen: function panelSwipeOpen(panel) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        panel.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      tabShow: function tabShow(tabEl) {
        var app = this;
        $(tabEl).find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
    },
    clicks: {
      '.navbar .title': function onTitleClick($clickedEl) {
        var app = this;
        if (!app.params.navbar.scrollTopOnTitleClick) { return; }
        if ($clickedEl.closest('a').length > 0) {
          return;
        }
        var pageContent;
        // Find active page
        var navbar = $clickedEl.parents('.navbar');

        // Static Layout
        pageContent = navbar.parents('.page-content');

        if (pageContent.length === 0) {
          // Fixed Layout
          if (navbar.parents('.page').length > 0) {
            pageContent = navbar.parents('.page').find('.page-content');
          }
          // Through Layout
          if (pageContent.length === 0) {
            if (navbar.nextAll('.page-current:not(.stacked)').length > 0) {
              pageContent = navbar.nextAll('.page-current:not(.stacked)').find('.page-content');
            }
          }
        }
        if (pageContent && pageContent.length > 0) {
          // Check for tab
          if (pageContent.hasClass('tab')) {
            pageContent = pageContent.parent('.tabs').children('.page-content.tab-active');
          }
          if (pageContent.length > 0) { pageContent.scrollTop(0, 300); }
        }
      },
    },
    vnode: {
      'navbar-inner': {
        postpatch: function postpatch(vnode) {
          var app = this;
          if (app.theme !== 'ios') { return; }
          app.navbar.size(vnode.elm);
        },
      },
    },
  };

  var Toolbar = {
    setHighlight: function setHighlight(tabbarEl) {
      var app = this;
      if (app.theme !== 'md') { return; }

      var $tabbarEl = $(tabbarEl);

      if ($tabbarEl.length === 0 || !($tabbarEl.hasClass('tabbar') || $tabbarEl.hasClass('tabbar-labels'))) { return; }

      var $highlightEl = $tabbarEl.find('.tab-link-highlight');
      var tabLinksCount = $tabbarEl.find('.tab-link').length;
      if (tabLinksCount === 0) {
        $highlightEl.remove();
        return;
      }

      if ($highlightEl.length === 0) {
        $tabbarEl.children('.toolbar-inner').append('<span class="tab-link-highlight"></span>');
        $highlightEl = $tabbarEl.find('.tab-link-highlight');
      }

      var $activeLink = $tabbarEl.find('.tab-link-active');
      var highlightWidth;
      var highlightTranslate;

      if ($tabbarEl.hasClass('tabbar-scrollable') && $activeLink && $activeLink[0]) {
        highlightWidth = ($activeLink[0].offsetWidth) + "px";
        highlightTranslate = ($activeLink[0].offsetLeft) + "px";
      } else {
        var activeIndex = $activeLink.index();
        highlightWidth = (100 / tabLinksCount) + "%";
        highlightTranslate = ((app.rtl ? -activeIndex : activeIndex) * 100) + "%";
      }

      $highlightEl
        .css('width', highlightWidth)
        .transform(("translate3d(" + highlightTranslate + ",0,0)"));
    },
    init: function init(tabbarEl) {
      var app = this;
      app.toolbar.setHighlight(tabbarEl);
    },
    hide: function hide(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $(el);
      if ($el.hasClass('toolbar-hidden')) { return; }
      var className = "toolbar-hidden" + (animate ? ' toolbar-transitioning' : '');
      $el.transitionEnd(function () {
        $el.removeClass('toolbar-transitioning');
      });
      $el.addClass(className);
    },
    show: function show(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $(el);
      if (!$el.hasClass('toolbar-hidden')) { return; }
      if (animate) {
        $el.addClass('toolbar-transitioning');
        $el.transitionEnd(function () {
          $el.removeClass('toolbar-transitioning');
        });
      }
      $el.removeClass('toolbar-hidden');
    },
    initHideToolbarOnScroll: function initHideToolbarOnScroll(pageEl) {
      var app = this;
      var $pageEl = $(pageEl);
      var $toolbarEl = $pageEl.parents('.view').children('.toolbar');
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.find('.toolbar');
      }
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.parents('.views').children('.tabbar, .tabbar-labels');
      }
      if ($toolbarEl.length === 0) {
        return;
      }

      var previousScrollTop;
      var currentScrollTop;

      var scrollHeight;
      var offsetHeight;
      var reachEnd;
      var action;
      var toolbarHidden;
      function handleScroll() {
        var scrollContent = this;
        if ($pageEl.hasClass('page-previous')) { return; }
        currentScrollTop = scrollContent.scrollTop;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        toolbarHidden = $toolbarEl.hasClass('toolbar-hidden');

        if (reachEnd) {
          if (app.params.toolbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.toolbar.showOnPageScrollTop || currentScrollTop <= 44) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > 44) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && toolbarHidden) {
          app.toolbar.show($toolbarEl);
          toolbarHidden = false;
        } else if (action === 'hide' && !toolbarHidden) {
          app.toolbar.hide($toolbarEl);
          toolbarHidden = true;
        }

        previousScrollTop = currentScrollTop;
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      $pageEl[0].f7ScrollToolbarHandler = handleScroll;
    },
  };
  var Toolbar$1 = {
    name: 'toolbar',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        toolbar: {
          hide: Toolbar.hide.bind(app),
          show: Toolbar.show.bind(app),
          setHighlight: Toolbar.setHighlight.bind(app),
          initHideToolbarOnScroll: Toolbar.initHideToolbarOnScroll.bind(app),
          init: Toolbar.init.bind(app),
        },
      });
    },
    params: {
      toolbar: {
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
      },
    },
    on: {
      pageBeforeRemove: function pageBeforeRemove(page) {
        if (page.$el[0].f7ScrollToolbarHandler) {
          page.$el.off('scroll', '.page-content', page.$el[0].f7ScrollToolbarHandler, true);
        }
      },
      pageBeforeIn: function pageBeforeIn(page) {
        var app = this;
        var $toolbarEl = page.$el.parents('.view').children('.toolbar');
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.parents('.views').children('.tabbar, .tabbar-labels');
        }
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.find('.toolbar');
        }
        if ($toolbarEl.length === 0) {
          return;
        }
        if (page.$el.hasClass('no-toolbar')) {
          app.toolbar.hide($toolbarEl);
        } else {
          app.toolbar.show($toolbarEl);
        }
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.tabbar, .tabbar-labels').each(function (index, tabbarEl) {
          app.toolbar.init(tabbarEl);
        });
        if (
          app.params.toolbar.hideOnPageScroll
          || page.$el.find('.hide-toolbar-on-scroll').length
          || page.$el.hasClass('hide-toolbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-toolbar-on-scroll').length
            || page.$el.hasClass('keep-toolbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            return;
          }
          app.toolbar.initHideToolbarOnScroll(page.el);
        }
      },
      init: function init() {
        var app = this;
        app.root.find('.tabbar, .tabbar-labels').each(function (index, tabbarEl) {
          app.toolbar.init(tabbarEl);
        });
      },
    },
  };

  var Subnavbar = {
    name: 'subnavbar',
    on: {
      pageInit: function pageInit(page) {
        if (page.$navbarEl && page.$navbarEl.length && page.$navbarEl.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
        if (page.$el.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
      },
    },
  };

  var TouchRipple = function TouchRipple($el, x, y) {
    var ripple = this;
    if (!$el) { return undefined; }
    var box = $el[0].getBoundingClientRect();
    var center = {
      x: x - box.left,
      y: y - box.top,
    };
    var width = box.width;
    var height = box.height;
    var diameter = Math.max((Math.pow( ((Math.pow( height, 2 )) + (Math.pow( width, 2 ))), 0.5 )), 48);

    ripple.$rippleWaveEl = $(("<div class=\"ripple-wave\" style=\"width: " + diameter + "px; height: " + diameter + "px; margin-top:-" + (diameter / 2) + "px; margin-left:-" + (diameter / 2) + "px; left:" + (center.x) + "px; top:" + (center.y) + "px;\"></div>"));

    $el.prepend(ripple.$rippleWaveEl);

    /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
    ripple._clientLeft = ripple.$rippleWaveEl[0].clientLeft;

    ripple.rippleTransform = "translate3d(" + (-center.x + (width / 2)) + "px, " + (-center.y + (height / 2)) + "px, 0) scale(1)";

    ripple.$rippleWaveEl.transform(ripple.rippleTransform);

    return ripple;
  };

  TouchRipple.prototype.onRemove = function onRemove () {
    var ripple = this;
    if (ripple.$rippleWaveEl) {
      ripple.$rippleWaveEl.remove();
    }
    Object.keys(ripple).forEach(function (key) {
      ripple[key] = null;
      delete ripple[key];
    });
    ripple = null;
  };

  TouchRipple.prototype.remove = function remove () {
    var ripple = this;
    if (ripple.removing) { return; }
    var $rippleWaveEl = this.$rippleWaveEl;
    var rippleTransform = this.rippleTransform;
    var removeTimeout = Utils.nextTick(function () {
      ripple.onRemove();
    }, 400);
    ripple.removing = true;
    $rippleWaveEl
      .addClass('ripple-wave-fill')
      .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'))
      .transitionEnd(function () {
        clearTimeout(removeTimeout);
        Utils.nextFrame(function () {
          $rippleWaveEl
            .addClass('ripple-wave-out')
            .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'));

          removeTimeout = Utils.nextTick(function () {
            ripple.onRemove();
          }, 700);

          $rippleWaveEl.transitionEnd(function () {
            clearTimeout(removeTimeout);
            ripple.onRemove();
          });
        });
      });
  };

  var TouchRipple$1 = {
    name: 'touch-ripple',
    static: {
      TouchRipple: TouchRipple,
    },
    create: function create() {
      var app = this;
      app.touchRipple = {
        create: function create() {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          return new (Function.prototype.bind.apply( TouchRipple, [ null ].concat( args) ));
        },
      };
    },
  };

  var openedModals = [];
  var dialogsQueue = [];
  function clearDialogsQueue() {
    if (dialogsQueue.length === 0) { return; }
    var dialog = dialogsQueue.shift();
    dialog.open();
  }
  var Modal = (function (Framework7Class$$1) {
    function Modal(app, params) {
      Framework7Class$$1.call(this, params, [app]);

      var modal = this;

      var defaults = {};

      // Extend defaults with modules params
      modal.useModulesParams(defaults);

      modal.params = Utils.extend(defaults, params);
      modal.opened = false;

      // Install Modules
      modal.useModules();

      return this;
    }

    if ( Framework7Class$$1 ) Modal.__proto__ = Framework7Class$$1;
    Modal.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Modal.prototype.constructor = Modal;

    Modal.prototype.onOpen = function onOpen () {
      var modal = this;
      modal.opened = true;
      openedModals.push(modal);
      $('html').addClass(("with-modal-" + (modal.type.toLowerCase())));
      modal.$el.trigger(("modal:open " + (modal.type.toLowerCase()) + ":open"), modal);
      modal.emit(("local::open modalOpen " + (modal.type) + "Open"), modal);
    };

    Modal.prototype.onOpened = function onOpened () {
      var modal = this;
      modal.$el.trigger(("modal:opened " + (modal.type.toLowerCase()) + ":opened"), modal);
      modal.emit(("local::opened modalOpened " + (modal.type) + "Opened"), modal);
    };

    Modal.prototype.onClose = function onClose () {
      var modal = this;
      modal.opened = false;
      if (!modal.type || !modal.$el) { return; }
      openedModals.splice(openedModals.indexOf(modal), 1);
      $('html').removeClass(("with-modal-" + (modal.type.toLowerCase())));
      modal.$el.trigger(("modal:close " + (modal.type.toLowerCase()) + ":close"), modal);
      modal.emit(("local::close modalClose " + (modal.type) + "Close"), modal);
    };

    Modal.prototype.onClosed = function onClosed () {
      var modal = this;
      if (!modal.type || !modal.$el) { return; }
      modal.$el.removeClass('modal-out');
      modal.$el.hide();
      modal.$el.trigger(("modal:closed " + (modal.type.toLowerCase()) + ":closed"), modal);
      modal.emit(("local::closed modalClosed " + (modal.type) + "Closed"), modal);
    };

    Modal.prototype.open = function open (animateModal) {
      var modal = this;
      var app = modal.app;
      var $el = modal.$el;
      var $backdropEl = modal.$backdropEl;
      var type = modal.type;
      var animate = true;
      if (typeof animateModal !== 'undefined') { animate = animateModal; }
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || $el.hasClass('modal-in')) {
        return modal;
      }

      if (type === 'dialog' && app.params.modal.queueDialogs) {
        var pushToQueue;
        if ($('.dialog.modal-in').length > 0) {
          pushToQueue = true;
        } else if (openedModals.length > 0) {
          openedModals.forEach(function (openedModal) {
            if (openedModal.type === 'dialog') { pushToQueue = true; }
          });
        }
        if (pushToQueue) {
          dialogsQueue.push(modal);
          return modal;
        }
      }

      var $modalParentEl = $el.parent();
      var wasInDom = $el.parents(doc).length > 0;
      if (app.params.modal.moveToRoot && !$modalParentEl.is(app.root)) {
        app.root.append($el);
        modal.once((type + "Closed"), function () {
          if (wasInDom) {
            $modalParentEl.append($el);
          } else {
            $el.remove();
          }
        });
      }
      // Show Modal
      $el.show();

      // Set Dialog offset
      if (type === 'dialog') {
        $el.css({
          marginTop: ((-Math.round($el.outerHeight() / 2)) + "px"),
        });
      }

      // Emit open
      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      modal._clientLeft = $el[0].clientLeft;

      // Backdrop
      if ($backdropEl) {
        $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
        $backdropEl.addClass('backdrop-in');
      }
      // Modal
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        $el
          .animationEnd(function () {
            transitionEnd();
          });
        $el
          .transitionEnd(function () {
            transitionEnd();
          });
        $el
          .removeClass('modal-out not-animated')
          .addClass('modal-in');
        modal.onOpen();
      } else {
        $el.removeClass('modal-out').addClass('modal-in not-animated');
        modal.onOpen();
        modal.onOpened();
      }

      return modal;
    };

    Modal.prototype.close = function close (animateModal) {
      var modal = this;
      var $el = modal.$el;
      var $backdropEl = modal.$backdropEl;

      var animate = true;
      if (typeof animateModal !== 'undefined') { animate = animateModal; }
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || !$el.hasClass('modal-in')) {
        return modal;
      }

      // backdrop
      if ($backdropEl) {
        var needToHideBackdrop = true;
        if (modal.type === 'popup') {
          modal.$el.prevAll('.popup.modal-in').each(function (index, popupEl) {
            var popupInstance = popupEl.f7Modal;
            if (!popupInstance) { return; }
            if (
              popupInstance.params.closeByBackdropClick
              && popupInstance.params.backdrop
              && popupInstance.backdropEl === modal.backdropEl
            ) {
              needToHideBackdrop = false;
            }
          });
        }
        if (needToHideBackdrop) {
          $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
          $backdropEl.removeClass('backdrop-in');
        }
      }

      // Modal
      $el[animate ? 'removeClass' : 'addClass']('not-animated');
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        $el
          .animationEnd(function () {
            transitionEnd();
          });
        $el
          .transitionEnd(function () {
            transitionEnd();
          });
        $el
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
      } else {
        $el
          .addClass('not-animated')
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
        modal.onClosed();
      }

      if (modal.type === 'dialog') {
        clearDialogsQueue();
      }

      return modal;
    };

    Modal.prototype.destroy = function destroy () {
      var modal = this;
      if (modal.destroyed) { return; }
      modal.emit(("local::beforeDestroy modalBeforeDestroy " + (modal.type) + "BeforeDestroy"), modal);
      if (modal.$el) {
        modal.$el.trigger(("modal:beforedestroy " + (modal.type.toLowerCase()) + ":beforedestroy"), modal);
        if (modal.$el.length && modal.$el[0].f7Modal) {
          delete modal.$el[0].f7Modal;
        }
      }
      Utils.deleteProps(modal);
      modal.destroyed = true;
    };

    return Modal;
  }(Framework7Class));

  var CustomModal = (function (Modal$$1) {
    function CustomModal(app, params) {
      var extendedParams = Utils.extend({
        backdrop: true,
        closeByBackdropClick: true,
        on: {},
      }, params);

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var customModal = this;

      customModal.params = extendedParams;

      // Find Element
      var $el;
      if (!customModal.params.el) {
        $el = $(customModal.params.content);
      } else {
        $el = $(customModal.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return customModal.destroy();
      }
      var $backdropEl;
      if (customModal.params.backdrop) {
        $backdropEl = app.root.children('.custom-modal-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="custom-modal-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      function handleClick(e) {
        if (!customModal || customModal.destroyed) { return; }
        if ($backdropEl && e.target === $backdropEl[0]) {
          customModal.close();
        }
      }

      customModal.on('customModalOpened', function () {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.on('click', handleClick);
        }
      });
      customModal.on('customModalClose', function () {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.off('click', handleClick);
        }
      });

      Utils.extend(customModal, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'customModal',
      });

      $el[0].f7Modal = customModal;

      return customModal;
    }

    if ( Modal$$1 ) CustomModal.__proto__ = Modal$$1;
    CustomModal.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    CustomModal.prototype.constructor = CustomModal;

    return CustomModal;
  }(Modal));

  var Modal$1 = {
    name: 'modal',
    static: {
      Modal: Modal,
      CustomModal: CustomModal,
    },
    create: function create() {
      var app = this;
      app.customModal = {
        create: function create(params) {
          return new CustomModal(app, params);
        },
      };
    },
    params: {
      modal: {
        moveToRoot: true,
        queueDialogs: true,
      },
    },
  };

  var Dialog = (function (Modal$$1) {
    function Dialog(app, params) {
      var extendedParams = Utils.extend({
        title: app.params.dialog.title,
        text: undefined,
        content: '',
        buttons: [],
        verticalButtons: false,
        onClick: undefined,
        cssClass: undefined,
        destroyOnClose: false,
        on: {},
      }, params);
      if (typeof extendedParams.closeByBackdropClick === 'undefined') {
        extendedParams.closeByBackdropClick = app.params.dialog.closeByBackdropClick;
      }

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var dialog = this;

      var title = extendedParams.title;
      var text = extendedParams.text;
      var content = extendedParams.content;
      var buttons = extendedParams.buttons;
      var verticalButtons = extendedParams.verticalButtons;
      var cssClass = extendedParams.cssClass;

      dialog.params = extendedParams;

      // Find Element
      var $el;
      if (!dialog.params.el) {
        var dialogClasses = ['dialog'];
        if (buttons.length === 0) { dialogClasses.push('dialog-no-buttons'); }
        if (buttons.length > 0) { dialogClasses.push(("dialog-buttons-" + (buttons.length))); }
        if (verticalButtons) { dialogClasses.push('dialog-buttons-vertical'); }
        if (cssClass) { dialogClasses.push(cssClass); }

        var buttonsHTML = '';
        if (buttons.length > 0) {
          buttonsHTML = "\n          <div class=\"dialog-buttons\">\n            " + (buttons.map(function (button) { return ("\n              <span class=\"dialog-button" + (button.bold ? ' dialog-button-bold' : '') + (button.color ? (" color-" + (button.color)) : '') + (button.cssClass ? (" " + (button.cssClass)) : '') + "\">" + (button.text) + "</span>\n            "); }).join('')) + "\n          </div>\n        ";
        }

        var dialogHtml = "\n        <div class=\"" + (dialogClasses.join(' ')) + "\">\n          <div class=\"dialog-inner\">\n            " + (title ? ("<div class=\"dialog-title\">" + title + "</div>") : '') + "\n            " + (text ? ("<div class=\"dialog-text\">" + text + "</div>") : '') + "\n            " + content + "\n          </div>\n          " + buttonsHTML + "\n        </div>\n      ";
        $el = $(dialogHtml);
      } else {
        $el = $(dialog.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return dialog.destroy();
      }

      var $backdropEl = app.root.children('.dialog-backdrop');
      if ($backdropEl.length === 0) {
        $backdropEl = $('<div class="dialog-backdrop"></div>');
        app.root.append($backdropEl);
      }

      // Assign events
      function buttonOnClick(e) {
        var buttonEl = this;
        var index = $(buttonEl).index();
        var button = buttons[index];
        if (button.onClick) { button.onClick(dialog, e); }
        if (dialog.params.onClick) { dialog.params.onClick(dialog, index); }
        if (button.close !== false) { dialog.close(); }
      }
      var addKeyboardHander;
      function onKeyPress(e) {
        var keyCode = e.keyCode;
        buttons.forEach(function (button, index) {
          if (button.keyCodes && button.keyCodes.indexOf(keyCode) >= 0) {
            if (doc.activeElement) { doc.activeElement.blur(); }
            if (button.onClick) { button.onClick(dialog, e); }
            if (dialog.params.onClick) { dialog.params.onClick(dialog, index); }
            if (button.close !== false) { dialog.close(); }
          }
        });
      }
      if (buttons && buttons.length > 0) {
        dialog.on('open', function () {
          $el.find('.dialog-button').each(function (index, buttonEl) {
            var button = buttons[index];
            if (button.keyCodes) { addKeyboardHander = true; }
            $(buttonEl).on('click', buttonOnClick);
          });
          if (
            addKeyboardHander
            && !app.device.ios
            && !app.device.android
            && !app.device.cordova
          ) {
            $(doc).on('keydown', onKeyPress);
          }
        });
        dialog.on('close', function () {
          $el.find('.dialog-button').each(function (index, buttonEl) {
            $(buttonEl).off('click', buttonOnClick);
          });
          if (
            addKeyboardHander
            && !app.device.ios
            && !app.device.android
            && !app.device.cordova
          ) {
            $(doc).off('keydown', onKeyPress);
          }
          addKeyboardHander = false;
        });
      }
      Utils.extend(dialog, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl[0],
        type: 'dialog',
        setProgress: function setProgress(progress, duration) {
          app.progressbar.set($el.find('.progressbar'), progress, duration);
          return dialog;
        },
        setText: function setText(newText) {
          var $textEl = $el.find('.dialog-text');
          if ($textEl.length === 0) {
            $textEl = $('<div class="dialog-text"></div>');
            if (typeof title !== 'undefined') {
              $textEl.insertAfter($el.find('.dialog-title'));
            } else {
              $el.find('.dialog-inner').prepend($textEl);
            }
          }
          $textEl.html(newText);
          dialog.params.text = newText;
          return dialog;
        },
        setTitle: function setTitle(newTitle) {
          var $titleEl = $el.find('.dialog-title');
          if ($titleEl.length === 0) {
            $titleEl = $('<div class="dialog-title"></div>');
            $el.find('.dialog-inner').prepend($titleEl);
          }
          $titleEl.html(newTitle);
          dialog.params.title = newTitle;
          return dialog;
        },
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $(target);
        if ($target.closest(dialog.el).length === 0) {
          if (
            dialog.params.closeByBackdropClick
            && dialog.backdropEl
            && dialog.backdropEl === target
          ) {
            dialog.close();
          }
        }
      }

      dialog.on('opened', function () {
        if (dialog.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      dialog.on('close', function () {
        if (dialog.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      $el[0].f7Modal = dialog;

      if (dialog.params.destroyOnClose) {
        dialog.once('closed', function () {
          setTimeout(function () {
            dialog.destroy();
          }, 0);
        });
      }

      return dialog;
    }

    if ( Modal$$1 ) Dialog.__proto__ = Modal$$1;
    Dialog.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Dialog.prototype.constructor = Dialog;

    return Dialog;
  }(Modal));

  function ConstructorMethods (parameters) {
    if ( parameters === void 0 ) parameters = {};

    var defaultSelector = parameters.defaultSelector;
    var constructor = parameters.constructor;
    var domProp = parameters.domProp;
    var app = parameters.app;
    var addMethods = parameters.addMethods;
    var methods = {
      create: function create() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        if (app) { return new (Function.prototype.bind.apply( constructor, [ null ].concat( [app], args) )); }
        return new (Function.prototype.bind.apply( constructor, [ null ].concat( args) ));
      },
      get: function get(el) {
        if ( el === void 0 ) el = defaultSelector;

        if (el instanceof constructor) { return el; }
        var $el = $(el);
        if ($el.length === 0) { return undefined; }
        return $el[0][domProp];
      },
      destroy: function destroy(el) {
        var instance = methods.get(el);
        if (instance && instance.destroy) { return instance.destroy(); }
        return undefined;
      },
    };
    if (addMethods && Array.isArray(addMethods)) {
      addMethods.forEach(function (methodName) {
        methods[methodName] = function (el) {
          if ( el === void 0 ) el = defaultSelector;
          var args = [], len = arguments.length - 1;
          while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

          var instance = methods.get(el);
          if (instance && instance[methodName]) { return instance[methodName].apply(instance, args); }
          return undefined;
        };
      });
    }
    return methods;
  }

  function ModalMethods (parameters) {
    if ( parameters === void 0 ) parameters = {};

    var defaultSelector = parameters.defaultSelector;
    var constructor = parameters.constructor;
    var app = parameters.app;
    var methods = Utils.extend(
      ConstructorMethods({
        defaultSelector: defaultSelector,
        constructor: constructor,
        app: app,
        domProp: 'f7Modal',
      }),
      {
        open: function open(el, animate) {
          var $el = $(el);
          var instance = $el[0].f7Modal;
          if (!instance) { instance = new constructor(app, { el: $el }); }
          return instance.open(animate);
        },
        close: function close(el, animate) {
          if ( el === void 0 ) el = defaultSelector;

          var $el = $(el);
          if ($el.length === 0) { return undefined; }
          var instance = $el[0].f7Modal;
          if (!instance) { instance = new constructor(app, { el: $el }); }
          return instance.close(animate);
        },
      }
    );
    return methods;
  }

  var Dialog$1 = {
    name: 'dialog',
    params: {
      dialog: {
        title: undefined,
        buttonOk: 'OK',
        buttonCancel: 'Cancel',
        usernamePlaceholder: 'Username',
        passwordPlaceholder: 'Password',
        preloaderTitle: 'Loading... ',
        progressTitle: 'Loading... ',
        closeByBackdropClick: false,
        destroyPredefinedDialogs: true,
        keyboardActions: true,
      },
    },
    static: {
      Dialog: Dialog,
    },
    create: function create() {
      var app = this;
      function defaultDialogTitle() {
        return app.params.dialog.title || app.name;
      }
      var destroyOnClose = app.params.dialog.destroyPredefinedDialogs;
      var keyboardActions = app.params.dialog.keyboardActions;
      app.dialog = Utils.extend(
        ModalMethods({
          app: app,
          constructor: Dialog,
          defaultSelector: '.dialog.modal-in',
        }),
        {
          // Shortcuts
          alert: function alert() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            if (args.length === 2 && typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], title = assign[2]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle() : title,
              text: text,
              buttons: [{
                text: app.params.dialog.buttonOk,
                bold: true,
                onClick: callbackOk,
                keyCodes: keyboardActions ? [13, 27] : null,
              }],
              destroyOnClose: destroyOnClose,
            }).open();
          },
          prompt: function prompt() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle() : title,
              text: text,
              content: '<div class="dialog-input-field item-input"><div class="item-input-wrap"><input type="text" class="dialog-input"></div></div>',
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var inputValue = dialog.$el.find('.dialog-input').val();
                if (index === 0 && callbackCancel) { callbackCancel(inputValue); }
                if (index === 1 && callbackOk) { callbackOk(inputValue); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          confirm: function confirm() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle() : title,
              text: text,
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  onClick: callbackCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  onClick: callbackOk,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              destroyOnClose: destroyOnClose,
            }).open();
          },
          login: function login() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle() : title,
              text: text,
              content: ("\n              <div class=\"dialog-input-field dialog-input-double item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"text\" name=\"dialog-username\" placeholder=\"" + (app.params.dialog.usernamePlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>\n              <div class=\"dialog-input-field dialog-input-double item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"password\" name=\"dialog-password\" placeholder=\"" + (app.params.dialog.passwordPlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>"),
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var username = dialog.$el.find('[name="dialog-username"]').val();
                var password = dialog.$el.find('[name="dialog-password"]').val();
                if (index === 0 && callbackCancel) { callbackCancel(username, password); }
                if (index === 1 && callbackOk) { callbackOk(username, password); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          password: function password() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle() : title,
              text: text,
              content: ("\n              <div class=\"dialog-input-field item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"password\" name=\"dialog-password\" placeholder=\"" + (app.params.dialog.passwordPlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>"),
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var password = dialog.$el.find('[name="dialog-password"]').val();
                if (index === 0 && callbackCancel) { callbackCancel(password); }
                if (index === 1 && callbackOk) { callbackOk(password); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          preloader: function preloader(title, color) {
            var preloaderInner = app.theme !== 'md' ? '' : Utils.mdPreloaderContent;
            return new Dialog(app, {
              title: typeof title === 'undefined' || title === null ? app.params.dialog.preloaderTitle : title,
              content: ("<div class=\"preloader" + (color ? (" color-" + color) : '') + "\">" + preloaderInner + "</div>"),
              cssClass: 'dialog-preloader',
              destroyOnClose: destroyOnClose,
            }).open();
          },
          progress: function progress() {
            var assign, assign$1, assign$2;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var title = args[0];
            var progress = args[1];
            var color = args[2];
            if (args.length === 2) {
              if (typeof args[0] === 'number') {
                (assign = args, progress = assign[0], color = assign[1], title = assign[2]);
              } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
                (assign$1 = args, title = assign$1[0], color = assign$1[1], progress = assign$1[2]);
              }
            } else if (args.length === 1) {
              if (typeof args[0] === 'number') {
                (assign$2 = args, progress = assign$2[0], title = assign$2[1], color = assign$2[2]);
              }
            }
            var infinite = typeof progress === 'undefined';
            var dialog = new Dialog(app, {
              title: typeof title === 'undefined' ? app.params.dialog.progressTitle : title,
              cssClass: 'dialog-progress',
              content: ("\n              <div class=\"progressbar" + (infinite ? '-infinite' : '') + (color ? (" color-" + color) : '') + "\">\n                " + (!infinite ? '<span></span>' : '') + "\n              </div>\n            "),
              destroyOnClose: destroyOnClose,
            });
            if (!infinite) { dialog.setProgress(progress); }
            return dialog.open();
          },
        }
      );
    },
  };

  var Popup = (function (Modal$$1) {
    function Popup(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.popup,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var popup = this;

      popup.params = extendedParams;

      // Find Element
      var $el;
      if (!popup.params.el) {
        $el = $(popup.params.content);
      } else {
        $el = $(popup.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return popup.destroy();
      }

      var $backdropEl;
      if (popup.params.backdrop) {
        $backdropEl = app.root.children('.popup-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="popup-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      Utils.extend(popup, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'popup',
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $(target);
        if ($target.closest(popup.el).length === 0) {
          if (
            popup.params
            && popup.params.closeByBackdropClick
            && popup.params.backdrop
            && popup.backdropEl
            && popup.backdropEl === target
          ) {
            var needToClose = true;
            popup.$el.nextAll('.popup.modal-in').each(function (index, popupEl) {
              var popupInstance = popupEl.f7Modal;
              if (!popupInstance) { return; }
              if (
                popupInstance.params.closeByBackdropClick
                && popupInstance.params.backdrop
                && popupInstance.backdropEl === popup.backdropEl
              ) {
                needToClose = false;
              }
            });
            if (needToClose) {
              popup.close();
            }
          }
        }
      }

      popup.on('popupOpened', function () {
        if (popup.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      popup.on('popupClose', function () {
        if (popup.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      $el[0].f7Modal = popup;

      return popup;
    }

    if ( Modal$$1 ) Popup.__proto__ = Modal$$1;
    Popup.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Popup.prototype.constructor = Popup;

    return Popup;
  }(Modal));

  var Popup$1 = {
    name: 'popup',
    params: {
      popup: {
        backdrop: true,
        closeByBackdropClick: true,
      },
    },
    static: {
      Popup: Popup,
    },
    create: function create() {
      var app = this;
      app.popup = ModalMethods({
        app: app,
        constructor: Popup,
        defaultSelector: '.popup.modal-in',
      });
    },
    clicks: {
      '.popup-open': function openPopup($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popup.open(data.popup, data.animate);
      },
      '.popup-close': function closePopup($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popup.close(data.popup, data.animate);
      },
    },
  };

  var LoginScreen = (function (Modal$$1) {
    function LoginScreen(app, params) {
      var extendedParams = Utils.extend({
        on: {},
      }, params);

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var loginScreen = this;

      loginScreen.params = extendedParams;

      // Find Element
      var $el;
      if (!loginScreen.params.el) {
        $el = $(loginScreen.params.content);
      } else {
        $el = $(loginScreen.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return loginScreen.destroy();
      }

      Utils.extend(loginScreen, {
        app: app,
        $el: $el,
        el: $el[0],
        type: 'loginScreen',
      });

      $el[0].f7Modal = loginScreen;

      return loginScreen;
    }

    if ( Modal$$1 ) LoginScreen.__proto__ = Modal$$1;
    LoginScreen.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    LoginScreen.prototype.constructor = LoginScreen;

    return LoginScreen;
  }(Modal));

  var LoginScreen$1 = {
    name: 'loginScreen',
    static: {
      LoginScreen: LoginScreen,
    },
    create: function create() {
      var app = this;
      app.loginScreen = ModalMethods({
        app: app,
        constructor: LoginScreen,
        defaultSelector: '.login-screen.modal-in',
      });
    },
    clicks: {
      '.login-screen-open': function openLoginScreen($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.loginScreen.open(data.loginScreen, data.animate);
      },
      '.login-screen-close': function closeLoginScreen($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.loginScreen.close(data.loginScreen, data.animate);
      },
    },
  };

  var Popover = (function (Modal$$1) {
    function Popover(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.popover,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var popover = this;

      popover.params = extendedParams;

      // Find Element
      var $el;
      if (!popover.params.el) {
        $el = $(popover.params.content);
      } else {
        $el = $(popover.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      // Find Target
      var $targetEl = $(popover.params.targetEl).eq(0);

      if ($el.length === 0) {
        return popover.destroy();
      }

      // Backdrop
      var $backdropEl;
      if (popover.params.backdrop) {
        $backdropEl = app.root.children('.popover-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="popover-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      // Find Angle
      var $angleEl;
      if ($el.find('.popover-angle').length === 0) {
        $angleEl = $('<div class="popover-angle"></div>');
        $el.prepend($angleEl);
      } else {
        $angleEl = $el.find('.popover-angle');
      }

      // Open
      var originalOpen = popover.open;

      Utils.extend(popover, {
        app: app,
        $el: $el,
        el: $el[0],
        $targetEl: $targetEl,
        targetEl: $targetEl[0],
        $angleEl: $angleEl,
        angleEl: $angleEl[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'popover',
        open: function open() {
          var assign;

          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];
          var targetEl = args[0];
          var animate = args[1];
          if (typeof args[0] === 'boolean') { (assign = args, animate = assign[0], targetEl = assign[1]); }
          if (targetEl) {
            popover.$targetEl = $(targetEl);
            popover.targetEl = popover.$targetEl[0];
          }
          return originalOpen.call(popover, animate);
        },
      });

      function handleResize() {
        popover.resize();
      }
      popover.on('popoverOpen', function () {
        popover.resize();
        app.on('resize', handleResize);
        popover.on('popoverClose popoverBeforeDestroy', function () {
          app.off('resize', handleResize);
        });
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $(target);
        if ($target.closest(popover.el).length === 0) {
          if (
            popover.params.closeByBackdropClick
            && popover.params.backdrop
            && popover.backdropEl
            && popover.backdropEl === target
          ) {
            popover.close();
          } else if (popover.params.closeByOutsideClick) {
            popover.close();
          }
        }
      }

      popover.on('popoverOpened', function () {
        if (popover.params.closeByOutsideClick || popover.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      popover.on('popoverClose', function () {
        if (popover.params.closeByOutsideClick || popover.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      $el[0].f7Modal = popover;

      return popover;
    }

    if ( Modal$$1 ) Popover.__proto__ = Modal$$1;
    Popover.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Popover.prototype.constructor = Popover;

    Popover.prototype.resize = function resize () {
      var popover = this;
      var app = popover.app;
      var $el = popover.$el;
      var $targetEl = popover.$targetEl;
      var $angleEl = popover.$angleEl;
      var ref = popover.params;
      var targetX = ref.targetX;
      var targetY = ref.targetY;
      $el.css({ left: '', top: '' });
      var ref$1 = [$el.width(), $el.height()];
      var width = ref$1[0];
      var height = ref$1[1];
      var angleSize = 0;
      var angleLeft;
      var angleTop;
      if (app.theme === 'ios') {
        $angleEl.removeClass('on-left on-right on-top on-bottom').css({ left: '', top: '' });
        angleSize = $angleEl.width() / 2;
      } else {
        $el.removeClass('popover-on-left popover-on-right popover-on-top popover-on-bottom').css({ left: '', top: '' });
      }

      var targetWidth;
      var targetHeight;
      var targetOffsetLeft;
      var targetOffsetTop;
      if ($targetEl && $targetEl.length > 0) {
        targetWidth = $targetEl.outerWidth();
        targetHeight = $targetEl.outerHeight();

        var targetOffset = $targetEl.offset();
        targetOffsetLeft = targetOffset.left - app.left;
        targetOffsetTop = targetOffset.top - app.top;

        var targetParentPage = $targetEl.parents('.page');
        if (targetParentPage.length > 0) {
          targetOffsetTop -= targetParentPage[0].scrollTop;
        }
      } else if (typeof targetX !== 'undefined' && targetY !== 'undefined') {
        targetOffsetLeft = targetX;
        targetOffsetTop = targetY;
        targetWidth = popover.params.targetWidth || 0;
        targetHeight = popover.params.targetHeight || 0;
      }

      var ref$2 = [0, 0, 0];
      var left = ref$2[0];
      var top = ref$2[1];
      var diff = ref$2[2];
      // Top Position
      var position = app.theme === 'md' ? 'bottom' : 'top';
      if (app.theme === 'md') {
        if (height < app.height - targetOffsetTop - targetHeight) {
          // On bottom
          position = 'bottom';
          top = targetOffsetTop;
        } else if (height < targetOffsetTop) {
          // On top
          top = (targetOffsetTop - height) + targetHeight;
          position = 'top';
        } else {
          // On middle
          position = 'bottom';
          top = targetOffsetTop;
        }

        if (top <= 0) {
          top = 8;
        } else if (top + height >= app.height) {
          top = app.height - height - 8;
        }

        // Horizontal Position
        left = (targetOffsetLeft + targetWidth) - width - 8;
        if (left + width >= app.width - 8) {
          left = (targetOffsetLeft + targetWidth) - width - 8;
        }
        if (left < 8) {
          left = 8;
        }
        if (position === 'top') {
          $el.addClass('popover-on-top');
        }
        if (position === 'bottom') {
          $el.addClass('popover-on-bottom');
        }
      } else {
        if ((height + angleSize) < targetOffsetTop) {
          // On top
          top = targetOffsetTop - height - angleSize;
        } else if ((height + angleSize) < app.height - targetOffsetTop - targetHeight) {
          // On bottom
          position = 'bottom';
          top = targetOffsetTop + targetHeight + angleSize;
        } else {
          // On middle
          position = 'middle';
          top = ((targetHeight / 2) + targetOffsetTop) - (height / 2);
          diff = top;
          if (top <= 0) {
            top = 5;
          } else if (top + height >= app.height) {
            top = app.height - height - 5;
          }
          diff -= top;
        }

        // Horizontal Position
        if (position === 'top' || position === 'bottom') {
          left = ((targetWidth / 2) + targetOffsetLeft) - (width / 2);
          diff = left;
          if (left < 5) { left = 5; }
          if (left + width > app.width) { left = app.width - width - 5; }
          if (left < 0) { left = 0; }
          if (position === 'top') {
            $angleEl.addClass('on-bottom');
          }
          if (position === 'bottom') {
            $angleEl.addClass('on-top');
          }
          diff -= left;
          angleLeft = ((width / 2) - angleSize) + diff;
          angleLeft = Math.max(Math.min(angleLeft, width - (angleSize * 2) - 13), 13);
          $angleEl.css({ left: (angleLeft + "px") });
        } else if (position === 'middle') {
          left = targetOffsetLeft - width - angleSize;
          $angleEl.addClass('on-right');
          if (left < 5 || (left + width > app.width)) {
            if (left < 5) { left = targetOffsetLeft + targetWidth + angleSize; }
            if (left + width > app.width) { left = app.width - width - 5; }
            $angleEl.removeClass('on-right').addClass('on-left');
          }
          angleTop = ((height / 2) - angleSize) + diff;
          angleTop = Math.max(Math.min(angleTop, height - (angleSize * 2) - 13), 13);
          $angleEl.css({ top: (angleTop + "px") });
        }
      }

      // Apply Styles
      $el.css({ top: (top + "px"), left: (left + "px") });
    };

    return Popover;
  }(Modal));

  var Popover$1 = {
    name: 'popover',
    params: {
      popover: {
        closeByBackdropClick: true,
        closeByOutsideClick: false,
        backdrop: true,
      },
    },
    static: {
      Popover: Popover,
    },
    create: function create() {
      var app = this;
      app.popover = Utils.extend(
        ModalMethods({
          app: app,
          constructor: Popover,
          defaultSelector: '.popover.modal-in',
        }),
        {
          open: function open(popoverEl, targetEl, animate) {
            var $popoverEl = $(popoverEl);
            var popover = $popoverEl[0].f7Modal;
            if (!popover) { popover = new Popover(app, { el: $popoverEl, targetEl: targetEl }); }
            return popover.open(targetEl, animate);
          },
        }
      );
    },
    clicks: {
      '.popover-open': function openPopover($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popover.open(data.popover, $clickedEl, data.animate);
      },
      '.popover-close': function closePopover($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popover.close(data.popover, data.animate);
      },
    },
  };

  /* eslint indent: ["off"] */

  var Actions = (function (Modal$$1) {
    function Actions(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.actions,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var actions = this;

      actions.params = extendedParams;

      // Buttons
      var groups;
      if (actions.params.buttons) {
        groups = actions.params.buttons;
        if (!Array.isArray(groups[0])) { groups = [groups]; }
      }
      actions.groups = groups;

      // Find Element
      var $el;
      if (actions.params.el) {
        $el = $(actions.params.el);
      } else if (actions.params.content) {
        $el = $(actions.params.content);
      } else if (actions.params.buttons) {
        if (actions.params.convertToPopover) {
          actions.popoverHtml = actions.renderPopover();
        }
        actions.actionsHtml = actions.render();
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el && $el.length === 0 && !(actions.actionsHtml || actions.popoverHtml)) {
        return actions.destroy();
      }

      // Backdrop
      var $backdropEl;
      if (actions.params.backdrop) {
        $backdropEl = app.root.children('.actions-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="actions-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      var originalOpen = actions.open;
      var originalClose = actions.close;

      var popover;
      function buttonOnClick(e) {
        var buttonEl = this;
        var buttonIndex;
        var groupIndex;
        if ($(buttonEl).hasClass('item-link')) {
          buttonIndex = $(buttonEl).parents('li').index();
          groupIndex = $(buttonEl).parents('.list').index();
        } else {
          buttonIndex = $(buttonEl).index();
          groupIndex = $(buttonEl).parents('.actions-group').index();
        }
        if (typeof groups !== 'undefined') {
          var button = groups[groupIndex][buttonIndex];
          if (button.onClick) { button.onClick(actions, e); }
          if (actions.params.onClick) { actions.params.onClick(actions, e); }
          if (button.close !== false) { actions.close(); }
        }
      }
      actions.open = function open(animate) {
        var convertToPopover = false;
        var ref = actions.params;
        var targetEl = ref.targetEl;
        var targetX = ref.targetX;
        var targetY = ref.targetY;
        var targetWidth = ref.targetWidth;
        var targetHeight = ref.targetHeight;
        if (actions.params.convertToPopover && (targetEl || (targetX !== undefined && targetY !== undefined))) {
          // Popover
          if (
            actions.params.forceToPopover
            || (app.device.ios && app.device.ipad)
            || app.width >= 768
          ) {
            convertToPopover = true;
          }
        }
        if (convertToPopover && actions.popoverHtml) {
          popover = app.popover.create({
            content: actions.popoverHtml,
            backdrop: actions.params.backdrop,
            targetEl: targetEl,
            targetX: targetX,
            targetY: targetY,
            targetWidth: targetWidth,
            targetHeight: targetHeight,
          });
          popover.open(animate);
          popover.once('popoverOpened', function () {
            popover.$el.find('.item-link').each(function (groupIndex, buttonEl) {
              $(buttonEl).on('click', buttonOnClick);
            });
          });
          popover.once('popoverClosed', function () {
            popover.$el.find('.item-link').each(function (groupIndex, buttonEl) {
              $(buttonEl).off('click', buttonOnClick);
            });
            Utils.nextTick(function () {
              popover.destroy();
              popover = undefined;
            });
          });
        } else {
          actions.$el = actions.actionsHtml ? $(actions.actionsHtml) : actions.$el;
          actions.$el[0].f7Modal = actions;
          if (actions.groups) {
            actions.$el.find('.actions-button').each(function (groupIndex, buttonEl) {
              $(buttonEl).on('click', buttonOnClick);
            });
            actions.once('actionsClosed', function () {
              actions.$el.find('.actions-button').each(function (groupIndex, buttonEl) {
                $(buttonEl).off('click', buttonOnClick);
              });
            });
          }
          actions.el = actions.$el[0];
          originalOpen.call(actions, animate);
        }
        return actions;
      };

      actions.close = function close(animate) {
        if (popover) {
          popover.close(animate);
        } else {
          originalClose.call(actions, animate);
        }
        return actions;
      };

      Utils.extend(actions, {
        app: app,
        $el: $el,
        el: $el ? $el[0] : undefined,
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'actions',
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $(target);
        if ($target.closest(actions.el).length === 0) {
          if (
            actions.params.closeByBackdropClick
            && actions.params.backdrop
            && actions.backdropEl
            && actions.backdropEl === target
          ) {
            actions.close();
          } else if (actions.params.closeByOutsideClick) {
            actions.close();
          }
        }
      }

      actions.on('opened', function () {
        if (actions.params.closeByBackdropClick || actions.params.closeByOutsideClick) {
          app.on('click', handleClick);
        }
      });
      actions.on('close', function () {
        if (actions.params.closeByBackdropClick || actions.params.closeByOutsideClick) {
          app.off('click', handleClick);
        }
      });

      if ($el) {
        $el[0].f7Modal = actions;
      }

      return actions;
    }

    if ( Modal$$1 ) Actions.__proto__ = Modal$$1;
    Actions.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Actions.prototype.constructor = Actions;

    Actions.prototype.render = function render () {
      var actions = this;
      if (actions.params.render) { return actions.params.render.call(actions, actions); }
      var groups = actions.groups;
      return ("\n      <div class=\"actions-modal" + (actions.params.grid ? ' actions-grid' : '') + "\">\n        " + (groups.map(function (group) { return ("<div class=\"actions-group\">\n            " + (group.map(function (button) {
                var buttonClasses = [("actions-" + (button.label ? 'label' : 'button'))];
                var color = button.color;
                var bg = button.bg;
                var bold = button.bold;
                var disabled = button.disabled;
                var label = button.label;
                var text = button.text;
                var icon = button.icon;
                if (color) { buttonClasses.push(("color-" + color)); }
                if (bg) { buttonClasses.push(("bg-color-" + bg)); }
                if (bold) { buttonClasses.push('actions-button-bold'); }
                if (disabled) { buttonClasses.push('disabled'); }
                if (label) {
                  return ("<div class=\"" + (buttonClasses.join(' ')) + "\">" + text + "</div>");
                }
                return ("\n                <div class=\"" + (buttonClasses.join(' ')) + "\">\n                  " + (icon ? ("<div class=\"actions-button-media\">" + icon + "</div>") : '') + "\n                  <div class=\"actions-button-text\">" + text + "</div>\n                </div>").trim();
              }).join('')) + "\n          </div>"); }).join('')) + "\n      </div>\n    ").trim();
    };

    Actions.prototype.renderPopover = function renderPopover () {
      var actions = this;
      if (actions.params.renderPopover) { return actions.params.renderPopover.call(actions, actions); }
      var groups = actions.groups;
      return ("\n      <div class=\"popover popover-from-actions\">\n        <div class=\"popover-inner\">\n          " + (groups.map(function (group) { return ("\n            <div class=\"list\">\n              <ul>\n                " + (group.map(function (button) {
                    var itemClasses = [];
                    var color = button.color;
                    var bg = button.bg;
                    var bold = button.bold;
                    var disabled = button.disabled;
                    var label = button.label;
                    var text = button.text;
                    var icon = button.icon;
                    if (color) { itemClasses.push(("color-" + color)); }
                    if (bg) { itemClasses.push(("bg-color-" + bg)); }
                    if (bold) { itemClasses.push('popover-from-actions-bold'); }
                    if (disabled) { itemClasses.push('disabled'); }
                    if (label) {
                      itemClasses.push('popover-from-actions-label');
                      return ("<li class=\"" + (itemClasses.join(' ')) + "\">" + text + "</li>");
                    }
                    itemClasses.push('item-link');
                    if (icon) {
                      itemClasses.push('item-content');
                      return ("\n                      <li>\n                        <a class=\"" + (itemClasses.join(' ')) + "\">\n                          <div class=\"item-media\">\n                            " + icon + "\n                          </div>\n                          <div class=\"item-inner\">\n                            <div class=\"item-title\">\n                              " + text + "\n                            </div>\n                          </div>\n                        </a>\n                      </li>\n                    ");
                    }
                    itemClasses.push('list-button');
                    return ("\n                    <li>\n                      <a href=\"#\" class=\"list-button " + (itemClasses.join(' ')) + "\">" + text + "</a>\n                    </li>\n                  ");
                  }).join('')) + "\n              </ul>\n            </div>\n          "); }).join('')) + "\n        </div>\n      </div>\n    ").trim();
    };

    return Actions;
  }(Modal));

  var Actions$1 = {
    name: 'actions',
    params: {
      actions: {
        convertToPopover: true,
        forceToPopover: false,
        closeByBackdropClick: true,
        render: null,
        renderPopover: null,
        backdrop: true,
      },
    },
    static: {
      Actions: Actions,
    },
    create: function create() {
      var app = this;
      app.actions = ModalMethods({
        app: app,
        constructor: Actions,
        defaultSelector: '.actions-modal.modal-in',
      });
    },
    clicks: {
      '.actions-open': function openActions($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.actions.open(data.actions, data.animate);
      },
      '.actions-close': function closeActions($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.actions.close(data.actions, data.animate);
      },
    },
  };

  var Sheet = (function (Modal$$1) {
    function Sheet(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.sheet,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var sheet = this;

      sheet.params = extendedParams;

      // Find Element
      var $el;
      if (!sheet.params.el) {
        $el = $(sheet.params.content);
      } else {
        $el = $(sheet.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return sheet.destroy();
      }
      var $backdropEl;
      if (sheet.params.backdrop) {
        $backdropEl = app.root.children('.sheet-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="sheet-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      var $pageContentEl;
      function scrollToOpen() {
        var $scrollEl = $(sheet.params.scrollToEl).eq(0);
        if ($scrollEl.length === 0) { return; }
        $pageContentEl = $scrollEl.parents('.page-content');
        if ($pageContentEl.length === 0) { return; }

        var paddingTop = parseInt($pageContentEl.css('padding-top'), 10);
        var paddingBottom = parseInt($pageContentEl.css('padding-bottom'), 10);
        var pageHeight = $pageContentEl[0].offsetHeight - paddingTop - $el.height();
        var pageScrollHeight = $pageContentEl[0].scrollHeight - paddingTop - $el.height();
        var pageScroll = $pageContentEl.scrollTop();

        var newPaddingBottom;

        var scrollElTop = ($scrollEl.offset().top - paddingTop) + $scrollEl[0].offsetHeight;
        if (scrollElTop > pageHeight) {
          var scrollTop = (pageScroll + scrollElTop) - pageHeight;
          if (scrollTop + pageHeight > pageScrollHeight) {
            newPaddingBottom = ((scrollTop + pageHeight) - pageScrollHeight) + paddingBottom;
            if (pageHeight === pageScrollHeight) {
              newPaddingBottom = $el.height();
            }
            $pageContentEl.css({
              'padding-bottom': (newPaddingBottom + "px"),
            });
          }
          $pageContentEl.scrollTop(scrollTop, 300);
        }
      }

      function scrollToClose() {
        if ($pageContentEl && $pageContentEl.length > 0) {
          $pageContentEl.css({
            'padding-bottom': '',
          });
        }
      }
      function handleClick(e) {
        var target = e.target;
        var $target = $(target);
        if ($target.closest(sheet.el).length === 0) {
          if (
            sheet.params.closeByBackdropClick
            && sheet.params.backdrop
            && sheet.backdropEl
            && sheet.backdropEl === target
          ) {
            sheet.close();
          } else if (sheet.params.closeByOutsideClick) {
            sheet.close();
          }
        }
      }

      sheet.on('sheetOpen', function () {
        if (sheet.params.scrollToEl) {
          scrollToOpen();
        }
      });
      sheet.on('sheetOpened', function () {
        if (sheet.params.closeByOutsideClick || sheet.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      sheet.on('sheetClose', function () {
        if (sheet.params.scrollToEl) {
          scrollToClose();
        }
        if (sheet.params.closeByOutsideClick || sheet.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      Utils.extend(sheet, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'sheet',
      });

      $el[0].f7Modal = sheet;

      return sheet;
    }

    if ( Modal$$1 ) Sheet.__proto__ = Modal$$1;
    Sheet.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Sheet.prototype.constructor = Sheet;

    return Sheet;
  }(Modal));

  var Sheet$1 = {
    name: 'sheet',
    params: {
      sheet: {
        closeByBackdropClick: true,
        closeByOutsideClick: false,
      },
    },
    static: {
      Sheet: Sheet,
    },
    create: function create() {
      var app = this;
      if (!app.passedParams.sheet || app.passedParams.sheet.backdrop === undefined) {
        app.params.sheet.backdrop = app.theme === 'md';
      }
      app.sheet = Utils.extend(
        {},
        ModalMethods({
          app: app,
          constructor: Sheet,
          defaultSelector: '.sheet-modal.modal-in',
        })
      );
    },
    clicks: {
      '.sheet-open': function openSheet($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        if ($('.sheet-modal.modal-in').length > 0 && data.sheet && $(data.sheet)[0] !== $('.sheet-modal.modal-in')[0]) {
          app.sheet.close('.sheet-modal.modal-in');
        }
        app.sheet.open(data.sheet, data.animate);
      },
      '.sheet-close': function closeSheet($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.sheet.close(data.sheet, data.animate);
      },
    },
  };

  var Toast = (function (Modal$$1) {
    function Toast(app, params) {
      var extendedParams = Utils.extend({
        on: {},
      }, app.params.toast, params);

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var toast = this;

      toast.app = app;

      toast.params = extendedParams;

      var ref = toast.params;
      var closeButton = ref.closeButton;
      var closeTimeout = ref.closeTimeout;

      var $el;
      if (!toast.params.el) {
        // Find Element
        var toastHtml = toast.render();

        $el = $(toastHtml);
      } else {
        $el = $(toast.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return toast.destroy();
      }

      Utils.extend(toast, {
        $el: $el,
        el: $el[0],
        type: 'toast',
      });

      $el[0].f7Modal = toast;

      if (closeButton) {
        $el.find('.toast-button').on('click', function () {
          toast.emit('local::closeButtonClick toastCloseButtonClick', toast);
          toast.close();
        });

        toast.on('beforeDestroy', function () {
          $el.find('.toast-button').off('click');
        });
      }

      var timeoutId;
      toast.on('open', function () {
        $('.toast.modal-in').each(function (index, openedEl) {
          var toastInstance = app.toast.get(openedEl);
          if (openedEl !== toast.el && toastInstance) {
            toastInstance.close();
          }
        });
        if (closeTimeout) {
          timeoutId = Utils.nextTick(function () {
            toast.close();
          }, closeTimeout);
        }
      });
      toast.on('close', function () {
        win.clearTimeout(timeoutId);
      });

      if (toast.params.destroyOnClose) {
        toast.once('closed', function () {
          setTimeout(function () {
            toast.destroy();
          }, 0);
        });
      }

      return toast;
    }

    if ( Modal$$1 ) Toast.__proto__ = Modal$$1;
    Toast.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Toast.prototype.constructor = Toast;

    Toast.prototype.render = function render () {
      var toast = this;
      var app = toast.app;
      if (toast.params.render) { return toast.params.render.call(toast, toast); }
      var ref = toast.params;
      var position = ref.position;
      var cssClass = ref.cssClass;
      var icon = ref.icon;
      var text = ref.text;
      var closeButton = ref.closeButton;
      var closeButtonColor = ref.closeButtonColor;
      var closeButtonText = ref.closeButtonText;
      return ("\n      <div class=\"toast toast-" + position + " " + (cssClass || '') + " " + (icon ? 'toast-with-icon' : '') + "\">\n        <div class=\"toast-content\">\n          " + (icon ? ("<div class=\"toast-icon\">" + icon + "</div>") : '') + "\n          <div class=\"toast-text\">" + text + "</div>\n          " + (closeButton && !icon ? ("\n          <a class=\"toast-button " + (app.theme === 'md' ? 'button' : 'link') + " " + (closeButtonColor ? ("color-" + closeButtonColor) : '') + "\">" + closeButtonText + "</a>\n          ").trim() : '') + "\n        </div>\n      </div>\n    ").trim();
    };

    return Toast;
  }(Modal));

  var Toast$1 = {
    name: 'toast',
    static: {
      Toast: Toast,
    },
    create: function create() {
      var app = this;
      app.toast = Utils.extend(
        {},
        ModalMethods({
          app: app,
          constructor: Toast,
          defaultSelector: '.toast.modal-in',
        }),
        {
          // Shortcuts
          show: function show(params) {
            Utils.extend(params, {
              destroyOnClose: true,
            });
            return new Toast(app, params).open();
          },
        }
      );
    },
    params: {
      toast: {
        icon: null,
        text: null,
        position: 'bottom',
        closeButton: false,
        closeButtonColor: null,
        closeButtonText: 'Ok',
        closeTimeout: null,
        cssClass: null,
        render: null,
      },
    },
  };

  var Preloader = {
    init: function init(el) {
      var app = this;
      if (app.theme !== 'md') { return; }
      var $el = $(el);
      if ($el.length === 0 || $el.children('.preloader-inner').length > 0) { return; }
      $el.append(Utils.mdPreloaderContent);
    },
    // Modal
    visible: false,
    show: function show(color) {
      if ( color === void 0 ) color = 'white';

      var app = this;
      if (Preloader.visible) { return; }
      var preloaderInner = app.theme !== 'md' ? '' : Utils.mdPreloaderContent;
      $('html').addClass('with-modal-preloader');
      app.root.append(("\n      <div class=\"preloader-backdrop\"></div>\n      <div class=\"preloader-modal\">\n        <div class=\"preloader color-" + color + "\">" + preloaderInner + "</div>\n      </div>\n    "));
      Preloader.visible = true;
    },
    hide: function hide() {
      var app = this;
      if (!Preloader.visible) { return; }
      $('html').removeClass('with-modal-preloader');
      app.root.find('.preloader-backdrop, .preloader-modal').remove();
      Preloader.visible = false;
    },
  };
  var Preloader$1 = {
    name: 'preloader',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        preloader: {
          init: Preloader.init.bind(app),
          show: Preloader.show.bind(app),
          hide: Preloader.hide.bind(app),
        },
      });
    },
    on: {
      photoBrowserOpen: function photoBrowserOpen(pb) {
        var app = this;
        if (app.theme !== 'md') { return; }
        pb.$el.find('.preloader').each(function (index, preloaderEl) {
          app.preloader.init(preloaderEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        if (app.theme !== 'md') { return; }
        page.$el.find('.preloader').each(function (index, preloaderEl) {
          app.preloader.init(preloaderEl);
        });
      },
    },
    vnode: {
      preloader: {
        insert: function insert(vnode) {
          var app = this;
          var preloaderEl = vnode.elm;
          if (app.theme !== 'md') { return; }
          app.preloader.init(preloaderEl);
        },
      },
    },
  };

  var Tab = {
    show: function show() {
      var assign, assign$1, assign$2;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var app = this;
      var tabEl;
      var tabLinkEl;
      var animate;
      var tabRoute;
      if (args.length === 1 && args[0].constructor === Object) {
        tabEl = args[0].tabEl;
        tabLinkEl = args[0].tabLinkEl;
        animate = args[0].animate;
        tabRoute = args[0].tabRoute;
      } else {
        (assign = args, tabEl = assign[0], tabLinkEl = assign[1], animate = assign[2], tabRoute = assign[3]);
        if (typeof args[1] === 'boolean') {
          (assign$1 = args, tabEl = assign$1[0], animate = assign$1[1], tabLinkEl = assign$1[2], tabRoute = assign$1[3]);
          if (args.length > 2 && tabLinkEl.constructor === Object) {
            (assign$2 = args, tabEl = assign$2[0], animate = assign$2[1], tabRoute = assign$2[2], tabLinkEl = assign$2[3]);
          }
        }
      }
      if (typeof animate === 'undefined') { animate = true; }

      var $newTabEl = $(tabEl);
      if (tabRoute && $newTabEl[0]) {
        $newTabEl[0].f7TabRoute = tabRoute;
      }

      if ($newTabEl.length === 0 || $newTabEl.hasClass('tab-active')) {
        return {
          $newTabEl: $newTabEl,
          newTabEl: $newTabEl[0],
        };
      }

      var $tabLinkEl;
      if (tabLinkEl) { $tabLinkEl = $(tabLinkEl); }

      var $tabsEl = $newTabEl.parent('.tabs');
      if ($tabsEl.length === 0) {
        return {
          $newTabEl: $newTabEl,
          newTabEl: $newTabEl[0],
        };
      }

      // Release swipeouts in hidden tabs
      if (app.swipeout) { app.swipeout.allowOpen = true; }

      // Animated tabs
      var tabsChangedCallbacks = [];

      function onTabsChanged(callback) {
        tabsChangedCallbacks.push(callback);
      }
      function tabsChanged() {
        tabsChangedCallbacks.forEach(function (callback) {
          callback();
        });
      }

      var animated = false;

      if ($tabsEl.parent().hasClass('tabs-animated-wrap')) {
        $tabsEl.parent()[animate ? 'removeClass' : 'addClass']('not-animated');

        var transitionDuration = parseFloat($tabsEl.css('transition-duration').replace(',', '.'));
        if (animate && transitionDuration) {
          $tabsEl.transitionEnd(tabsChanged);
          animated = true;
        }

        var tabsTranslate = (app.rtl ? $newTabEl.index() : -$newTabEl.index()) * 100;
        $tabsEl.transform(("translate3d(" + tabsTranslate + "%,0,0)"));
      }

      // Swipeable tabs
      if ($tabsEl.parent().hasClass('tabs-swipeable-wrap') && app.swiper) {
        var swiper = $tabsEl.parent()[0].swiper;
        if (swiper && swiper.activeIndex !== $newTabEl.index()) {
          animated = true;
          swiper
            .once('slideChangeTransitionEnd', function () {
              tabsChanged();
            })
            .slideTo($newTabEl.index(), animate ? undefined : 0);
        } else if (swiper && swiper.animating) {
          animated = true;
          swiper
            .once('slideChangeTransitionEnd', function () {
              tabsChanged();
            });
        }
      }

      // Remove active class from old tabs
      var $oldTabEl = $tabsEl.children('.tab-active');
      $oldTabEl
        .removeClass('tab-active')
        .trigger('tab:hide');
      app.emit('tabHide', $oldTabEl[0]);

      // Trigger 'show' event on new tab
      $newTabEl
        .addClass('tab-active')
        .trigger('tab:show');
      app.emit('tabShow', $newTabEl[0]);

      // Find related link for new tab
      if (!$tabLinkEl) {
        // Search by id
        if (typeof tabEl === 'string') { $tabLinkEl = $((".tab-link[href=\"" + tabEl + "\"]")); }
        else { $tabLinkEl = $((".tab-link[href=\"#" + ($newTabEl.attr('id')) + "\"]")); }
        // Search by data-tab
        if (!$tabLinkEl || ($tabLinkEl && $tabLinkEl.length === 0)) {
          $('[data-tab]').each(function (index, el) {
            if ($newTabEl.is($(el).attr('data-tab'))) { $tabLinkEl = $(el); }
          });
        }
        if (tabRoute && (!$tabLinkEl || ($tabLinkEl && $tabLinkEl.length === 0))) {
          $tabLinkEl = $(("[data-route-tab-id=\"" + (tabRoute.route.tab.id) + "\"]"));
          if ($tabLinkEl.length === 0) {
            $tabLinkEl = $((".tab-link[href=\"" + (tabRoute.url) + "\"]"));
          }
        }
        if ($tabLinkEl.length > 1 && $newTabEl.parents('.page').length) {
          // eslint-disable-next-line
          $tabLinkEl = $tabLinkEl.filter(function (index, tabLinkElement) {
            return $(tabLinkElement).parents('.page')[0] === $newTabEl.parents('.page')[0];
          });
          if (app.theme === 'ios' && $tabLinkEl.length === 0 && tabRoute) {
            var $pageEl = $newTabEl.parents('.page');
            var $navbarEl = $(app.navbar.getElByPage($pageEl));
            $tabLinkEl = $navbarEl.find(("[data-route-tab-id=\"" + (tabRoute.route.tab.id) + "\"]"));
            if ($tabLinkEl.length === 0) {
              $tabLinkEl = $navbarEl.find((".tab-link[href=\"" + (tabRoute.url) + "\"]"));
            }
          }
        }
      }
      if ($tabLinkEl.length > 0) {
        // Find related link for old tab
        var $oldTabLinkEl;
        if ($oldTabEl && $oldTabEl.length > 0) {
          // Search by id
          var oldTabId = $oldTabEl.attr('id');
          if (oldTabId) {
            $oldTabLinkEl = $((".tab-link[href=\"#" + oldTabId + "\"]"));
            // Search by data-route-tab-id
            if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
              $oldTabLinkEl = $((".tab-link[data-route-tab-id=\"" + oldTabId + "\"]"));
            }
          }
          // Search by data-tab
          if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
            $('[data-tab]').each(function (index, tabLinkElement) {
              if ($oldTabEl.is($(tabLinkElement).attr('data-tab'))) { $oldTabLinkEl = $(tabLinkElement); }
            });
          }
          if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
            $oldTabLinkEl = $tabLinkEl.siblings('.tab-link-active');
          }
        } else if (tabRoute) {
          $oldTabLinkEl = $tabLinkEl.siblings('.tab-link-active');
        }

        if ($oldTabLinkEl && $oldTabLinkEl.length > 1 && $oldTabEl && $oldTabEl.parents('.page').length) {
          // eslint-disable-next-line
          $oldTabLinkEl = $oldTabLinkEl.filter(function (index, tabLinkElement) {
            return $(tabLinkElement).parents('.page')[0] === $oldTabEl.parents('.page')[0];
          });
        }

        if ($oldTabLinkEl && $oldTabLinkEl.length > 0) { $oldTabLinkEl.removeClass('tab-link-active'); }

        // Update links' classes
        if ($tabLinkEl && $tabLinkEl.length > 0) {
          $tabLinkEl.addClass('tab-link-active');
          // Material Highlight
          if (app.theme === 'md' && app.toolbar) {
            var $tabbarEl = $tabLinkEl.parents('.tabbar, .tabbar-labels');
            if ($tabbarEl.length > 0) {
              app.toolbar.setHighlight($tabbarEl);
            }
          }
        }
      }
      return {
        $newTabEl: $newTabEl,
        newTabEl: $newTabEl[0],
        $oldTabEl: $oldTabEl,
        oldTabEl: $oldTabEl[0],
        onTabsChanged: onTabsChanged,
        animated: animated,
      };
    },
  };
  var Tabs = {
    name: 'tabs',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        tab: {
          show: Tab.show.bind(app),
        },
      });
    },
    clicks: {
      '.tab-link': function tabLinkClick($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        if (($clickedEl.attr('href') && $clickedEl.attr('href').indexOf('#') === 0) || $clickedEl.attr('data-tab')) {
          app.tab.show({
            tabEl: data.tab || $clickedEl.attr('href'),
            tabLinkEl: $clickedEl,
            animate: data.animate,
          });
        }
      },
    },
  };

  function swipePanel(panel) {
    var app = panel.app;
    Utils.extend(panel, {
      swipeable: true,
      swipeInitialized: true,
    });
    var params = app.params.panel;
    var $el = panel.$el;
    var $backdropEl = panel.$backdropEl;
    var side = panel.side;
    var effect = panel.effect;
    var otherPanel;

    var isTouched;
    var isMoved;
    var isScrolling;
    var touchesStart = {};
    var touchStartTime;
    var touchesDiff;
    var translate;
    var backdropOpacity;
    var panelWidth;
    var direction;

    var $viewEl;

    var touchMoves = 0;
    function handleTouchStart(e) {
      if (!panel.swipeable) { return; }
      if (!app.panel.allowOpen || (!params.swipe && !params.swipeOnlyClose) || isTouched) { return; }
      if ($('.modal-in, .photo-browser-in').length > 0) { return; }
      otherPanel = app.panel[side === 'left' ? 'right' : 'left'] || {};
      if (!panel.opened && otherPanel.opened) { return; }
      if (!(params.swipeCloseOpposite || params.swipeOnlyClose)) {
        if (otherPanel.opened) { return; }
      }
      if (e.target && e.target.nodeName.toLowerCase() === 'input' && e.target.type === 'range') { return; }
      if ($(e.target).closest('.range-slider, .tabs-swipeable-wrap, .calendar-months, .no-swipe-panel').length > 0) { return; }
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      if (params.swipeOnlyClose && !panel.opened) {
        return;
      }
      if (params.swipe !== 'both' && params.swipeCloseOpposite && params.swipe !== side && !panel.opened) {
        return;
      }
      if (params.swipeActiveArea && !panel.opened) {
        if (side === 'left') {
          if (touchesStart.x > params.swipeActiveArea) { return; }
        }
        if (side === 'right') {
          if (touchesStart.x < app.width - params.swipeActiveArea) { return; }
        }
      }
      if (params.swipeCloseActiveAreaSide && panel.opened) {
        if (side === 'left') {
          if (touchesStart.x < ($el[0].offsetWidth - params.swipeCloseActiveAreaSide)) { return; }
        }
        if (side === 'right') {
          if (touchesStart.x > ((app.width - $el[0].offsetWidth) + params.swipeCloseActiveAreaSide)) { return; }
        }
      }
      touchMoves = 0;
      $viewEl = $(panel.getViewEl());
      isMoved = false;
      isTouched = true;
      isScrolling = undefined;

      touchStartTime = Utils.now();
      direction = undefined;
    }
    function handleTouchMove(e) {
      if (!isTouched) { return; }
      touchMoves += 1;
      if (touchMoves < 2) { return; }
      if (e.f7PreventSwipePanel || app.preventSwipePanelBySwipeBack || app.preventSwipePanel) {
        isTouched = false;
        return;
      }
      var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
      }
      if (isScrolling) {
        isTouched = false;
        return;
      }
      if (!direction) {
        if (pageX > touchesStart.x) {
          direction = 'to-right';
        } else {
          direction = 'to-left';
        }

        if (params.swipe === 'both') {
          if (params.swipeActiveArea > 0 && !panel.opened) {
            if (side === 'left' && touchesStart.x > params.swipeActiveArea) {
              isTouched = false;
              return;
            }
            if (side === 'right' && touchesStart.x < app.width - params.swipeActiveArea) {
              isTouched = false;
              return;
            }
          }
        }
        if ($el.hasClass('panel-visible-by-breakpoint')) {
          isTouched = false;
          return;
        }

        if (
          (side === 'left'
            && (
              direction === 'to-left' && !$el.hasClass('panel-active')
            )
          )
          || (side === 'right'
            && (
              direction === 'to-right' && !$el.hasClass('panel-active')
            )
          )
        ) {
          isTouched = false;
          return;
        }
      }

      if (params.swipeNoFollow) {
        var timeDiff = (new Date()).getTime() - touchStartTime;
        if (timeDiff < 300) {
          if (direction === 'to-left') {
            if (side === 'right') { app.panel.open(side); }
            if (side === 'left' && $el.hasClass('panel-active')) { app.panel.close(); }
          }
          if (direction === 'to-right') {
            if (side === 'left') { app.panel.open(side); }
            if (side === 'right' && $el.hasClass('panel-active')) { app.panel.close(); }
          }
        }
        isTouched = false;
        isMoved = false;
        return;
      }

      if (!isMoved) {
        if (!panel.opened) {
          $el.show();
          $backdropEl.show();
          $el.trigger('panel:swipeopen', panel);
          panel.emit('local::swipeOpen panelSwipeOpen', panel);
        }
        panelWidth = $el[0].offsetWidth;
        $el.transition(0);
      }

      isMoved = true;

      e.preventDefault();
      var threshold = panel.opened ? 0 : -params.swipeThreshold;
      if (side === 'right') { threshold = -threshold; }

      touchesDiff = (pageX - touchesStart.x) + threshold;

      if (side === 'right') {
        if (effect === 'cover') {
          translate = touchesDiff + (panel.opened ? 0 : panelWidth);
          if (translate < 0) { translate = 0; }
          if (translate > panelWidth) {
            translate = panelWidth;
          }
        } else {
          translate = touchesDiff - (panel.opened ? panelWidth : 0);
          if (translate > 0) { translate = 0; }
          if (translate < -panelWidth) {
            translate = -panelWidth;
          }
        }
      } else {
        translate = touchesDiff + (panel.opened ? panelWidth : 0);
        if (translate < 0) { translate = 0; }
        if (translate > panelWidth) {
          translate = panelWidth;
        }
      }
      if (effect === 'reveal') {
        $viewEl.transform(("translate3d(" + translate + "px,0,0)")).transition(0);
        $backdropEl.transform(("translate3d(" + translate + "px,0,0)")).transition(0);

        $el.trigger('panel:swipe', panel, Math.abs(translate / panelWidth));
        panel.emit('local::swipe panelSwipe', panel, Math.abs(translate / panelWidth));
      } else {
        if (side === 'left') { translate -= panelWidth; }
        $el.transform(("translate3d(" + translate + "px,0,0)")).transition(0);

        $backdropEl.transition(0);
        backdropOpacity = 1 - Math.abs(translate / panelWidth);
        $backdropEl.css({ opacity: backdropOpacity });

        $el.trigger('panel:swipe', panel, Math.abs(translate / panelWidth));
        panel.emit('local::swipe panelSwipe', panel, Math.abs(translate / panelWidth));
      }
    }
    function handleTouchEnd() {
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      var timeDiff = (new Date()).getTime() - touchStartTime;
      var action;
      var edge = (translate === 0 || Math.abs(translate) === panelWidth);

      var threshold = params.swipeThreshold || 0;

      if (!panel.opened) {
        if (Math.abs(touchesDiff) < threshold) {
          action = 'reset';
        } else if (effect === 'cover') {
          if (translate === 0) {
            action = 'swap'; // open
          } else if (timeDiff < 300 && Math.abs(translate) > 0) {
            action = 'swap'; // open
          } else if (timeDiff >= 300 && Math.abs(translate) < panelWidth / 2) {
            action = 'swap'; // open
          } else {
            action = 'reset'; // close
          }
        } else if (translate === 0) {
          action = 'reset';
        } else if (
          (timeDiff < 300 && Math.abs(translate) > 0)
          || (timeDiff >= 300 && (Math.abs(translate) >= panelWidth / 2))
        ) {
          action = 'swap';
        } else {
          action = 'reset';
        }
      } else if (effect === 'cover') {
        if (translate === 0) {
          action = 'reset'; // open
        } else if (timeDiff < 300 && Math.abs(translate) > 0) {
          action = 'swap'; // open
        } else if (timeDiff >= 300 && Math.abs(translate) < panelWidth / 2) {
          action = 'reset'; // open
        } else {
          action = 'swap'; // close
        }
      } else if (translate === -panelWidth) {
        action = 'reset';
      } else if (
        (timeDiff < 300 && Math.abs(translate) >= 0)
        || (timeDiff >= 300 && (Math.abs(translate) <= panelWidth / 2))
      ) {
        if (side === 'left' && translate === panelWidth) { action = 'reset'; }
        else { action = 'swap'; }
      } else {
        action = 'reset';
      }
      if (action === 'swap') {
        if (panel.opened) {
          panel.close(!edge);
        } else {
          panel.open(!edge);
        }
      }
      if (action === 'reset') {
        if (!panel.opened) {
          if (edge) {
            $el.css({ display: '' });
          } else {
            var target = effect === 'reveal' ? $viewEl : $el;
            $('html').addClass('with-panel-transitioning');
            target.transitionEnd(function () {
              if ($el.hasClass('panel-active')) { return; }
              $el.css({ display: '' });
              $('html').removeClass('with-panel-transitioning');
            });
          }
        }
      }
      if (effect === 'reveal') {
        Utils.nextFrame(function () {
          $viewEl.transition('');
          $viewEl.transform('');
        });
      }
      $el.transition('').transform('');
      $backdropEl.css({ display: '' }).transform('').transition('').css('opacity', '');
    }

    // Add Events
    app.on('touchstart:passive', handleTouchStart);
    app.on('touchmove:active', handleTouchMove);
    app.on('touchend:passive', handleTouchEnd);
    panel.on('panelDestroy', function () {
      app.off('touchstart:passive', handleTouchStart);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
    });
  }

  var Panel = (function (Framework7Class$$1) {
    function Panel(app, params) {
      var obj;

      if ( params === void 0 ) params = {};
      Framework7Class$$1.call(this, params, [app]);
      var panel = this;

      var el = params.el;

      if (!el && params.content) {
        el = params.content;
      }

      var $el = $(el);
      if ($el.length === 0) { return panel; }
      if ($el[0].f7Panel) { return $el[0].f7Panel; }

      $el[0].f7Panel = panel;

      var opened = params.opened;
      var side = params.side;
      var effect = params.effect;
      if (typeof opened === 'undefined') { opened = $el.hasClass('panel-active'); }
      if (typeof side === 'undefined') { side = $el.hasClass('panel-left') ? 'left' : 'right'; }
      if (typeof effect === 'undefined') { effect = $el.hasClass('panel-cover') ? 'cover' : 'reveal'; }

      if (!app.panel[side]) {
        Utils.extend(app.panel, ( obj = {}, obj[side] = panel, obj ));
      } else {
        throw new Error(("Framework7: Can't create panel; app already has a " + side + " panel!"));
      }

      var $backdropEl = $('.panel-backdrop');
      if ($backdropEl.length === 0) {
        $backdropEl = $('<div class="panel-backdrop"></div>');
        $backdropEl.insertBefore($el);
      }

      Utils.extend(panel, {
        app: app,
        side: side,
        effect: effect,
        $el: $el,
        el: $el[0],
        opened: opened,
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl[0],
      });

      // Install Modules
      panel.useModules();

      // Init
      panel.init();

      return panel;
    }

    if ( Framework7Class$$1 ) Panel.__proto__ = Framework7Class$$1;
    Panel.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Panel.prototype.constructor = Panel;

    Panel.prototype.init = function init () {
      var panel = this;
      var app = panel.app;
      if (app.params.panel[((panel.side) + "Breakpoint")]) {
        panel.initBreakpoints();
      }
      {
        if (
          (app.params.panel.swipe === panel.side)
          || (app.params.panel.swipe === 'both')
          || (app.params.panel.swipe && app.params.panel.swipe !== panel.side && app.params.panel.swipeCloseOpposite)
        ) {
          panel.initSwipePanel();
        }
      }
    };

    Panel.prototype.getViewEl = function getViewEl () {
      var panel = this;
      var app = panel.app;
      var viewEl;
      if (app.root.children('.views').length > 0) {
        viewEl = app.root.children('.views')[0];
      } else {
        viewEl = app.root.children('.view')[0];
      }
      return viewEl;
    };

    Panel.prototype.setBreakpoint = function setBreakpoint () {
      var obj, obj$1;

      var panel = this;
      var app = panel.app;
      var side = panel.side;
      var $el = panel.$el;
      var $viewEl = $(panel.getViewEl());
      var breakpoint = app.params.panel[(side + "Breakpoint")];
      var wasVisible = $el.hasClass('panel-visible-by-breakpoint');

      if (app.width >= breakpoint) {
        if (!wasVisible) {
          $('html').removeClass(("with-panel-" + side + "-reveal with-panel-" + side + "-cover with-panel"));
          $el.css('display', '').addClass('panel-visible-by-breakpoint').removeClass('panel-active');
          panel.onOpen();
          panel.onOpened();
          $viewEl.css(( obj = {}, obj[("margin-" + side)] = (($el.width()) + "px"), obj ));
          app.allowPanelOpen = true;
          app.emit('local::breakpoint panelBreakpoint');
          panel.$el.trigger('panel:breakpoint', panel);
        }
      } else if (wasVisible) {
        $el.css('display', '').removeClass('panel-visible-by-breakpoint panel-active');
        panel.onClose();
        panel.onClosed();
        $viewEl.css(( obj$1 = {}, obj$1[("margin-" + side)] = '', obj$1 ));
        app.emit('local::breakpoint panelBreakpoint');
        panel.$el.trigger('panel:breakpoint', panel);
      }
    };

    Panel.prototype.initBreakpoints = function initBreakpoints () {
      var panel = this;
      var app = panel.app;
      panel.resizeHandler = function resizeHandler() {
        panel.setBreakpoint();
      };
      if (app.params.panel[((panel.side) + "Breakpoint")]) {
        app.on('resize', panel.resizeHandler);
      }
      panel.setBreakpoint();
      return panel;
    };

    Panel.prototype.initSwipePanel = function initSwipePanel () {
      {
        swipePanel(this);
      }
    };

    Panel.prototype.destroy = function destroy () {
      var panel = this;
      var app = panel.app;

      if (!panel.$el) {
        // Panel already destroyed
        return;
      }

      panel.emit('local::beforeDestroy panelBeforeDestroy', panel);
      panel.$el.trigger('panel:beforedestroy', panel);

      if (panel.resizeHandler) {
        app.off('resize', panel.resizeHandler);
      }
      panel.$el.trigger('panel:destroy', panel);
      panel.emit('local::destroy panelDestroy');
      delete app.panel[panel.side];
      if (panel.el) {
        panel.el.f7Panel = null;
        delete panel.el.f7Panel;
      }
      Utils.deleteProps(panel);
      panel = null;
    };

    Panel.prototype.open = function open (animate) {
      if ( animate === void 0 ) animate = true;

      var panel = this;
      var app = panel.app;
      if (!app.panel.allowOpen) { return false; }

      var side = panel.side;
      var effect = panel.effect;
      var $el = panel.$el;
      var $backdropEl = panel.$backdropEl;
      var opened = panel.opened;

      var $panelParentEl = $el.parent();
      var wasInDom = $el.parents(document).length > 0;

      if (!$panelParentEl.is(app.root)) {
        var $insertBeforeEl = app.root.children('.panel, .views, .view').eq(0);
        var $insertAfterEl = app.root.children('.statusbar').eq(0);

        if ($insertBeforeEl.length) {
          $el.insertBefore($insertBeforeEl);
        } else if ($insertAfterEl.length) {
          $el.insertAfter($insertBeforeEl);
        } else {
          app.root.prepend($el);
        }

        panel.once('panelClosed', function () {
          if (wasInDom) {
            $panelParentEl.append($el);
          } else {
            $el.remove();
          }
        });
      }

      // Ignore if opened
      if (opened || $el.hasClass('panel-visible-by-breakpoint') || $el.hasClass('panel-active')) { return false; }

      // Close if some panel is opened
      app.panel.close(side === 'left' ? 'right' : 'left', animate);

      app.panel.allowOpen = false;

      $el[animate ? 'removeClass' : 'addClass']('not-animated');
      $el
        .css({ display: 'block' })
        .addClass('panel-active');

      $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
      $backdropEl.show();

      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      panel._clientLeft = $el[0].clientLeft;

      $('html').addClass(("with-panel with-panel-" + side + "-" + effect));
      panel.onOpen();

      // Transition End;
      var transitionEndTarget = effect === 'reveal' ? $el.nextAll('.view, .views').eq(0) : $el;

      function panelTransitionEnd() {
        transitionEndTarget.transitionEnd(function (e) {
          if ($(e.target).is(transitionEndTarget)) {
            if ($el.hasClass('panel-active')) {
              panel.onOpened();
              $backdropEl.css({ display: '' });
            } else {
              panel.onClosed();
              $backdropEl.css({ display: '' });
            }
          } else { panelTransitionEnd(); }
        });
      }
      if (animate) {
        panelTransitionEnd();
      } else {
        panel.onOpened();
        $backdropEl.css({ display: '' });
      }

      return true;
    };

    Panel.prototype.close = function close (animate) {
      if ( animate === void 0 ) animate = true;

      var panel = this;
      var app = panel.app;

      var side = panel.side;
      var effect = panel.effect;
      var $el = panel.$el;
      var $backdropEl = panel.$backdropEl;
      var opened = panel.opened;

      if (!opened || $el.hasClass('panel-visible-by-breakpoint') || !$el.hasClass('panel-active')) { return false; }

      $el[animate ? 'removeClass' : 'addClass']('not-animated');
      $el.removeClass('panel-active');

      $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');

      var transitionEndTarget = effect === 'reveal' ? $el.nextAll('.view, .views').eq(0) : $el;

      panel.onClose();
      app.panel.allowOpen = false;

      if (animate) {
        transitionEndTarget.transitionEnd(function () {
          if ($el.hasClass('panel-active')) { return; }
          $el.css({ display: '' });
          $('html').removeClass('with-panel-transitioning');
          panel.onClosed();
        });
        $('html')
          .removeClass(("with-panel with-panel-" + side + "-" + effect))
          .addClass('with-panel-transitioning');
      } else {
        $el.css({ display: '' });
        $el.removeClass('not-animated');
        $('html').removeClass(("with-panel with-panel-transitioning with-panel-" + side + "-" + effect));
        panel.onClosed();
      }
      return true;
    };

    Panel.prototype.onOpen = function onOpen () {
      var panel = this;
      panel.opened = true;
      panel.$el.trigger('panel:open', panel);
      panel.emit('local::open panelOpen', panel);
    };

    Panel.prototype.onOpened = function onOpened () {
      var panel = this;
      var app = panel.app;
      app.panel.allowOpen = true;

      panel.$el.trigger('panel:opened', panel);
      panel.emit('local::opened panelOpened', panel);
    };

    Panel.prototype.onClose = function onClose () {
      var panel = this;
      panel.opened = false;
      panel.$el.addClass('panel-closing');
      panel.$el.trigger('panel:close', panel);
      panel.emit('local::close panelClose', panel);
    };

    Panel.prototype.onClosed = function onClosed () {
      var panel = this;
      var app = panel.app;
      app.panel.allowOpen = true;
      panel.$el.removeClass('panel-closing');
      panel.$el.trigger('panel:closed', panel);
      panel.emit('local::closed panelClosed', panel);
    };

    return Panel;
  }(Framework7Class));

  var Panel$1 = {
    name: 'panel',
    params: {
      panel: {
        leftBreakpoint: 0,
        rightBreakpoint: 0,
        swipe: undefined, // or 'left' or 'right' or 'both'
        swipeActiveArea: 0,
        swipeCloseActiveAreaSide: 0,
        swipeCloseOpposite: true,
        swipeOnlyClose: false,
        swipeNoFollow: false,
        swipeThreshold: 0,
        closeByBackdropClick: true,
      },
    },
    static: {
      Panel: Panel,
    },
    instance: {
      panel: {
        allowOpen: true,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app.panel, {
        disableSwipe: function disableSwipe(panel) {
          if ( panel === void 0 ) panel = 'both';

          var side;
          var panels = [];
          if (typeof panel === 'string') {
            if (panel === 'both') {
              side = 'both';
              panels = [app.panel.left, app.panel.right];
            } else {
              side = panel;
              panels.push(app.panel[side]);
            }
          } else {
            panels = [panel];
          }
          panels.forEach(function (panelInstance) {
            if (panelInstance) { Utils.extend(panelInstance, { swipeable: false }); }
          });
        },
        enableSwipe: function enableSwipe(panel) {
          if ( panel === void 0 ) panel = 'both';

          var panels = [];
          var side;
          if (typeof panel === 'string') {
            side = panel;
            if (
              (app.params.panel.swipe === 'left' && side === 'right')
              || (app.params.panel.swipe === 'right' && side === 'left')
              || side === 'both'
            ) {
              side = 'both';
              app.params.panel.swipe = side;
              panels = [app.panel.left, app.panel.right];
            } else {
              app.params.panel.swipe = side;
              panels.push(app.panel[side]);
            }
          } else if (panel) {
            panels.push(panel);
          }
          if (panels.length) {
            panels.forEach(function (panelInstance) {
              if (!panelInstance) { return; }
              if (!panelInstance.swipeInitialized) {
                panelInstance.initSwipePanel();
              } else {
                Utils.extend(panelInstance, { swipeable: true });
              }
            });
          }
        },
        create: function create(params) {
          return new Panel(app, params);
        },
        open: function open(side, animate) {
          var panelSide = side;
          if (!panelSide) {
            if ($('.panel').length > 1) {
              return false;
            }
            panelSide = $('.panel').hasClass('panel-left') ? 'left' : 'right';
          }
          if (!panelSide) { return false; }
          if (app.panel[panelSide]) {
            return app.panel[panelSide].open(animate);
          }
          var $panelEl = $((".panel-" + panelSide));
          if ($panelEl.length > 0) {
            return app.panel.create({ el: $panelEl }).open(animate);
          }
          return false;
        },
        close: function close(side, animate) {
          var $panelEl;
          var panelSide;
          if (panelSide) {
            panelSide = side;
            $panelEl = $((".panel-" + panelSide));
          } else {
            $panelEl = $('.panel.panel-active');
            panelSide = $panelEl.hasClass('panel-left') ? 'left' : 'right';
          }
          if (!panelSide) { return false; }
          if (app.panel[panelSide]) {
            return app.panel[panelSide].close(animate);
          }
          if ($panelEl.length > 0) {
            return app.panel.create({ el: $panelEl }).close(animate);
          }
          return false;
        },
        get: function get(side) {
          var panelSide = side;
          if (!panelSide) {
            if ($('.panel').length > 1) {
              return undefined;
            }
            panelSide = $('.panel').hasClass('panel-left') ? 'left' : 'right';
          }
          if (!panelSide) { return undefined; }
          if (app.panel[panelSide]) {
            return app.panel[panelSide];
          }
          var $panelEl = $((".panel-" + panelSide));
          if ($panelEl.length > 0) {
            return app.panel.create({ el: $panelEl });
          }
          return undefined;
        },
      });
    },
    on: {
      init: function init() {
        var app = this;

        // Create Panels
        $('.panel').each(function (index, panelEl) {
          var side = $(panelEl).hasClass('panel-left') ? 'left' : 'right';
          app.panel[side] = app.panel.create({ el: panelEl, side: side });
        });
      },
    },
    clicks: {
      '.panel-open': function open(clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var side = 'left';
        if (data.panel === 'right' || ($('.panel').length === 1 && $('.panel').hasClass('panel-right'))) {
          side = 'right';
        }
        app.panel.open(side, data.animate);
      },
      '.panel-close': function close(clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var side = data.panel;
        app.panel.close(side, data.animate);
      },
      '.panel-backdrop': function close() {
        var app = this;
        var $panelEl = $('.panel-active');
        var instance = $panelEl[0] && $panelEl[0].f7Panel;
        $panelEl.trigger('panel:backdrop-click');
        if (instance) {
          instance.emit('backdropClick', instance);
        }
        app.emit('panelBackdropClick', instance || $panelEl[0]);
        if (app.params.panel.closeByBackdropClick) { app.panel.close(); }
      },
    },
  };

  var Card = {
    name: 'card',
  };

  var Chip = {
    name: 'chip',
  };

  // Form Data
  var FormData$1 = {
    store: function store(form, data) {
      var app = this;
      var formId = form;

      var $formEl = $(form);
      if ($formEl.length && $formEl.is('form') && $formEl.attr('id')) {
        formId = $formEl.attr('id');
      }
      // Store form data in app.formsData
      app.form.data[("form-" + formId)] = data;

      // Store form data in local storage also
      try {
        win.localStorage[("f7form-" + formId)] = JSON.stringify(data);
      } catch (e) {
        throw e;
      }
    },
    get: function get(form) {
      var app = this;
      var formId = form;

      var $formEl = $(form);
      if ($formEl.length && $formEl.is('form') && $formEl.attr('id')) {
        formId = $formEl.attr('id');
      }

      try {
        if (win.localStorage[("f7form-" + formId)]) {
          return JSON.parse(win.localStorage[("f7form-" + formId)]);
        }
      } catch (e) {
        throw e;
      }
      if (app.form.data[("form-" + formId)]) {
        return app.form.data[("form-" + formId)];
      }
      return undefined;
    },
    remove: function remove(form) {
      var app = this;
      var formId = form;

      var $formEl = $(form);
      if ($formEl.length && $formEl.is('form') && $formEl.attr('id')) {
        formId = $formEl.attr('id');
      }

      // Delete form data from app.formsData
      if (app.form.data[("form-" + formId)]) {
        app.form.data[("form-" + formId)] = '';
        delete app.form.data[("form-" + formId)];
      }

      // Delete form data from local storage also
      try {
        if (win.localStorage[("f7form-" + formId)]) {
          win.localStorage[("f7form-" + formId)] = '';
          win.localStorage.removeItem(("f7form-" + formId));
        }
      } catch (e) {
        throw e;
      }
    },
  };

  // Form Storage
  var FormStorage = {
    init: function init(formEl) {
      var app = this;
      var $formEl = $(formEl);
      var formId = $formEl.attr('id');
      if (!formId) { return; }
      var initialData = app.form.getFormData(formId);
      if (initialData) {
        app.form.fillFromData($formEl, initialData);
      }
      function store() {
        var data = app.form.convertToData($formEl);
        if (!data) { return; }
        app.form.storeFormData(formId, data);
        $formEl.trigger('form:storedata', data);
        app.emit('formStoreData', $formEl[0], data);
      }
      $formEl.on('change submit', store);
    },
    destroy: function destroy(formEl) {
      var $formEl = $(formEl);
      $formEl.off('change submit');
    },
  };

  // Form To/From Data
  function formToData(formEl) {
    var app = this;
    var $formEl = $(formEl).eq(0);
    if ($formEl.length === 0) { return undefined; }

    // Form data
    var data = {};

    // Skip input types
    var skipTypes = ['submit', 'image', 'button', 'file'];
    var skipNames = [];
    $formEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
      var $inputEl = $(inputEl);
      if ($inputEl.hasClass('ignore-store-data') || $inputEl.hasClass('no-store-data')) {
        return;
      }
      var name = $inputEl.attr('name');
      var type = $inputEl.attr('type');
      var tag = inputEl.nodeName.toLowerCase();
      if (skipTypes.indexOf(type) >= 0) { return; }
      if (skipNames.indexOf(name) >= 0 || !name) { return; }
      if (tag === 'select' && $inputEl.prop('multiple')) {
        skipNames.push(name);
        data[name] = [];
        $formEl.find(("select[name=\"" + name + "\"] option")).each(function (index, el) {
          if (el.selected) { data[name].push(el.value); }
        });
      } else {
        switch (type) {
          case 'checkbox':
            skipNames.push(name);
            data[name] = [];
            $formEl.find(("input[name=\"" + name + "\"]")).each(function (index, el) {
              if (el.checked) { data[name].push(el.value); }
            });
            break;
          case 'radio':
            skipNames.push(name);
            $formEl.find(("input[name=\"" + name + "\"]")).each(function (index, el) {
              if (el.checked) { data[name] = el.value; }
            });
            break;
          default:
            data[name] = $inputEl.val();
            break;
        }
      }
    });
    $formEl.trigger('form:todata', data);
    app.emit('formToData', $formEl[0], data);

    return data;
  }
  function formFromData(formEl, formData) {
    var app = this;
    var $formEl = $(formEl).eq(0);
    if (!$formEl.length) { return; }

    var data = formData;
    var formId = $formEl.attr('id');

    if (!data && formId) {
      data = app.form.getFormData(formId);
    }

    if (!data) { return; }

    // Skip input types
    var skipTypes = ['submit', 'image', 'button', 'file'];
    var skipNames = [];

    $formEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
      var $inputEl = $(inputEl);
      if ($inputEl.hasClass('ignore-store-data') || $inputEl.hasClass('no-store-data')) {
        return;
      }
      var name = $inputEl.attr('name');
      var type = $inputEl.attr('type');
      var tag = inputEl.nodeName.toLowerCase();
      if (typeof data[name] === 'undefined' || data[name] === null) { return; }
      if (skipTypes.indexOf(type) >= 0) { return; }
      if (skipNames.indexOf(name) >= 0 || !name) { return; }
      if (tag === 'select' && $inputEl.prop('multiple')) {
        skipNames.push(name);
        $formEl.find(("select[name=\"" + name + "\"] option")).each(function (index, el) {
          var selectEl = el;
          if (data[name].indexOf(el.value) >= 0) { selectEl.selected = true; }
          else { selectEl.selected = false; }
        });
      } else {
        switch (type) {
          case 'checkbox':
            skipNames.push(name);
            $formEl.find(("input[name=\"" + name + "\"]")).each(function (index, el) {
              var checkboxEl = el;
              if (data[name].indexOf(el.value) >= 0) { checkboxEl.checked = true; }
              else { checkboxEl.checked = false; }
            });
            break;
          case 'radio':
            skipNames.push(name);
            $formEl.find(("input[name=\"" + name + "\"]")).each(function (index, el) {
              var radioEl = el;
              if (data[name] === el.value) { radioEl.checked = true; }
              else { radioEl.checked = false; }
            });
            break;
          default:
            $inputEl.val(data[name]);
            break;
        }
      }
      if (tag === 'select' || tag === 'input' || tag === 'textarea') {
        $inputEl.trigger('change', 'fromdata');
      }
    });
    $formEl.trigger('form:fromdata', data);
    app.emit('formFromData', $formEl[0], data);
  }

  function initAjaxForm() {
    var app = this;

    function onSubmitChange(e, fromData) {
      var $formEl = $(this);
      if (e.type === 'change' && !$formEl.hasClass('form-ajax-submit-onchange')) { return; }
      if (e.type === 'submit') { e.preventDefault(); }

      if (e.type === 'change' && fromData === 'fromdata') { return; }

      var method = ($formEl.attr('method') || 'GET').toUpperCase();
      var contentType = $formEl.prop('enctype') || $formEl.attr('enctype');

      var url = $formEl.attr('action');
      if (!url) { return; }

      var data;
      if (method === 'POST') {
        if (contentType === 'application/x-www-form-urlencoded') {
          data = app.form.convertToData($formEl[0]);
        } else {
          data = new win.FormData($formEl[0]);
        }
      } else {
        data = Utils.serializeObject(app.form.convertToData($formEl[0]));
      }

      var xhr = app.request({
        method: method,
        url: url,
        contentType: contentType,
        data: data,
        beforeSend: function beforeSend() {
          $formEl.trigger('formajax:beforesend', data, xhr);
          app.emit('formAjaxBeforeSend', $formEl[0], data, xhr);
        },
        error: function error() {
          $formEl.trigger('formajax:error', data, xhr);
          app.emit('formAjaxError', $formEl[0], data, xhr);
        },
        complete: function complete() {
          $formEl.trigger('formajax:complete', data, xhr);
          app.emit('formAjaxComplete', $formEl[0], data, xhr);
        },
        success: function success() {
          $formEl.trigger('formajax:success', data, xhr);
          app.emit('formAjaxSuccess', $formEl[0], data, xhr);
        },
      });
    }
    $(doc).on('submit change', 'form.form-ajax-submit, form.form-ajax-submit-onchange', onSubmitChange);
  }

  var Form = {
    name: 'form',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        form: {
          data: {},
          storeFormData: FormData$1.store.bind(app),
          getFormData: FormData$1.get.bind(app),
          removeFormData: FormData$1.remove.bind(app),
          convertToData: formToData.bind(app),
          fillFromData: formFromData.bind(app),
          storage: {
            init: FormStorage.init.bind(app),
            destroy: FormStorage.destroy.bind(app),
          },
        },
      });
    },
    on: {
      init: function init() {
        var app = this;
        initAjaxForm.call(app);
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var app = this;
        $(tabEl).find('.form-store-data').each(function (index, formEl) {
          app.form.storage.destroy(formEl);
        });
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.form-store-data').each(function (index, formEl) {
          app.form.storage.init(formEl);
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.form-store-data').each(function (index, formEl) {
          app.form.storage.destroy(formEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.form-store-data').each(function (index, formEl) {
          app.form.storage.init(formEl);
        });
      },
    },
  };

  var Input = {
    ignoreTypes: ['checkbox', 'button', 'submit', 'range', 'radio', 'image'],
    createTextareaResizableShadow: function createTextareaResizableShadow() {
      var $shadowEl = $(doc.createElement('textarea'));
      $shadowEl.addClass('textarea-resizable-shadow');
      $shadowEl.prop({
        disabled: true,
        readonly: true,
      });
      Input.textareaResizableShadow = $shadowEl;
    },
    textareaResizableShadow: undefined,
    resizeTextarea: function resizeTextarea(textareaEl) {
      var app = this;
      var $textareaEl = $(textareaEl);
      if (!Input.textareaResizableShadow) {
        Input.createTextareaResizableShadow();
      }
      var $shadowEl = Input.textareaResizableShadow;
      if (!$textareaEl.length) { return; }
      if (!$textareaEl.hasClass('resizable')) { return; }
      if (Input.textareaResizableShadow.parents().length === 0) {
        app.root.append($shadowEl);
      }

      var styles = win.getComputedStyle($textareaEl[0]);
      ('padding-top padding-bottom padding-left padding-right margin-left margin-right margin-top margin-bottom width font-size font-family font-style font-weight line-height font-variant text-transform letter-spacing border box-sizing display').split(' ').forEach(function (style) {
        var styleValue = styles[style];
        if (('font-size line-height letter-spacing width').split(' ').indexOf(style) >= 0) {
          styleValue = styleValue.replace(',', '.');
        }
        $shadowEl.css(style, styleValue);
      });
      var currentHeight = $textareaEl[0].clientHeight;

      $shadowEl.val('');
      var initialHeight = $shadowEl[0].scrollHeight;

      $shadowEl.val($textareaEl.val());
      $shadowEl.css('height', 0);
      var scrollHeight = $shadowEl[0].scrollHeight;

      if (currentHeight !== scrollHeight) {
        if (scrollHeight > initialHeight) {
          $textareaEl.css('height', (scrollHeight + "px"));
          $textareaEl.trigger('textarea:resize', { initialHeight: initialHeight, currentHeight: currentHeight, scrollHeight: scrollHeight });
        } else if (scrollHeight < currentHeight) {
          $textareaEl.css('height', '');
          $textareaEl.trigger('textarea:resize', { initialHeight: initialHeight, currentHeight: currentHeight, scrollHeight: scrollHeight });
        }
      }
    },
    validate: function validate(inputEl) {
      var $inputEl = $(inputEl);
      if (!$inputEl.length) { return; }
      var $itemInputEl = $inputEl.parents('.item-input');
      var $inputWrapEl = $inputEl.parents('.input');
      var validity = $inputEl[0].validity;
      var validationMessage = $inputEl.dataset().errorMessage || $inputEl[0].validationMessage || '';
      if (!validity) { return; }
      if (!validity.valid) {
        var $errorEl = $inputEl.nextAll('.item-input-error-message, .input-error-message');
        if (validationMessage) {
          if ($errorEl.length === 0) {
            $errorEl = $(("<div class=\"" + ($inputWrapEl.length ? 'input-error-message' : 'item-input-error-message') + "\"></div>"));
            $errorEl.insertAfter($inputEl);
          }
          $errorEl.text(validationMessage);
        }
        if ($errorEl.length > 0) {
          $itemInputEl.addClass('item-input-with-error-message');
          $inputWrapEl.addClass('input-with-eror-message');
        }
        $itemInputEl.addClass('item-input-invalid');
        $inputWrapEl.addClass('input-invalid');
        $inputEl.addClass('input-invalid');
      } else {
        $itemInputEl.removeClass('item-input-invalid item-input-with-error-message');
        $inputWrapEl.removeClass('input-invalid input-with-error-message');
        $inputEl.removeClass('input-invalid');
      }
    },
    validateInputs: function validateInputs(el) {
      var app = this;
      $(el).find('input, textarea, select').each(function (index, inputEl) {
        app.input.validate(inputEl);
      });
    },
    focus: function focus(inputEl) {
      var $inputEl = $(inputEl);
      var type = $inputEl.attr('type');
      if (Input.ignoreTypes.indexOf(type) >= 0) { return; }
      $inputEl.parents('.item-input').addClass('item-input-focused');
      $inputEl.parents('.input').addClass('input-focused');
      $inputEl.addClass('input-focused');
    },
    blur: function blur(inputEl) {
      var $inputEl = $(inputEl);
      $inputEl.parents('.item-input').removeClass('item-input-focused');
      $inputEl.parents('.input').removeClass('input-focused');
      $inputEl.removeClass('input-focused');
    },
    checkEmptyState: function checkEmptyState(inputEl) {
      var $inputEl = $(inputEl);
      var value = $inputEl.val();
      var $itemInputEl = $inputEl.parents('.item-input');
      var $inputWrapEl = $inputEl.parents('.input');
      if ((value && (typeof value === 'string' && value.trim() !== '')) || (Array.isArray(value) && value.length > 0)) {
        $itemInputEl.addClass('item-input-with-value');
        $inputWrapEl.addClass('input-with-value');
        $inputEl.addClass('input-with-value');
        $inputEl.trigger('input:notempty');
      } else {
        $itemInputEl.removeClass('item-input-with-value');
        $inputWrapEl.removeClass('input-with-value');
        $inputEl.removeClass('input-with-value');
        $inputEl.trigger('input:empty');
      }
    },
    scrollIntoView: function scrollIntoView(inputEl, duration, centered, force) {
      if ( duration === void 0 ) duration = 0;

      var $inputEl = $(inputEl);
      var $scrollableEl = $inputEl.parents('.page-content, .panel').eq(0);
      if (!$scrollableEl.length) {
        return false;
      }
      var contentHeight = $scrollableEl[0].offsetHeight;
      var contentScrollTop = $scrollableEl[0].scrollTop;
      var contentPaddingTop = parseInt($scrollableEl.css('padding-top'), 10);
      var contentPaddingBottom = parseInt($scrollableEl.css('padding-bottom'), 10);
      var contentOffsetTop = $scrollableEl.offset().top - contentScrollTop;

      var inputOffsetTop = $inputEl.offset().top - contentOffsetTop;
      var inputHeight = $inputEl[0].offsetHeight;

      var min = (inputOffsetTop + contentScrollTop) - contentPaddingTop;
      var max = ((inputOffsetTop + contentScrollTop) - contentHeight) + contentPaddingBottom + inputHeight;
      var centeredPosition = min + ((max - min) / 2);

      if (contentScrollTop > min) {
        $scrollableEl.scrollTop(centered ? centeredPosition : min, duration);
        return true;
      }
      if (contentScrollTop < max) {
        $scrollableEl.scrollTop(centered ? centeredPosition : max, duration);
        return true;
      }
      if (force) {
        $scrollableEl.scrollTop(centered ? centeredPosition : max, duration);
      }
      return false;
    },
    init: function init() {
      var app = this;
      Input.createTextareaResizableShadow();
      function onFocus() {
        var inputEl = this;
        if (app.params.input.scrollIntoViewOnFocus) {
          if (Device.android) {
            $(win).once('resize', function () {
              if (doc && doc.activeElement === inputEl) {
                app.input.scrollIntoView(inputEl, app.params.input.scrollIntoViewDuration, app.params.input.scrollIntoViewCentered, app.params.input.scrollIntoViewAlways);
              }
            });
          } else {
            app.input.scrollIntoView(inputEl, app.params.input.scrollIntoViewDuration, app.params.input.scrollIntoViewCentered, app.params.input.scrollIntoViewAlways);
          }
        }
        app.input.focus(inputEl);
      }
      function onBlur() {
        var $inputEl = $(this);
        var tag = $inputEl[0].nodeName.toLowerCase();
        app.input.blur($inputEl);
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          app.input.validate($inputEl);
        }
        // Resize textarea
        if (tag === 'textarea' && $inputEl.hasClass('resizable')) {
          if (Input.textareaResizableShadow) { Input.textareaResizableShadow.remove(); }
        }
      }
      function onChange() {
        var $inputEl = $(this);
        var type = $inputEl.attr('type');
        var tag = $inputEl[0].nodeName.toLowerCase();
        if (Input.ignoreTypes.indexOf(type) >= 0) { return; }

        // Check Empty State
        app.input.checkEmptyState($inputEl);

        // Check validation
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          app.input.validate($inputEl);
        }

        // Resize textarea
        if (tag === 'textarea' && $inputEl.hasClass('resizable')) {
          app.input.resizeTextarea($inputEl);
        }
      }
      function onInvalid(e) {
        var $inputEl = $(this);
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          e.preventDefault();
          app.input.validate($inputEl);
        }
      }
      function clearInput() {
        var $clicked = $(this);
        var $inputEl = $clicked.siblings('input, textarea').eq(0);
        var previousValue = $inputEl.val();
        $inputEl
          .val('')
          .trigger('change input')
          .focus()
          .trigger('input:clear', previousValue);
      }
      $(doc).on('click', '.input-clear-button', clearInput);
      $(doc).on('change input', 'input, textarea, select', onChange, true);
      $(doc).on('focus', 'input, textarea, select', onFocus, true);
      $(doc).on('blur', 'input, textarea, select', onBlur, true);
      $(doc).on('invalid', 'input, textarea, select', onInvalid, true);
    },
  };

  var Input$1 = {
    name: 'input',
    params: {
      input: {
        scrollIntoViewOnFocus: Device.android,
        scrollIntoViewCentered: false,
        scrollIntoViewDuration: 0,
        scrollIntoViewAlways: false,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        input: {
          scrollIntoView: Input.scrollIntoView.bind(app),
          focus: Input.focus.bind(app),
          blur: Input.blur.bind(app),
          validate: Input.validate.bind(app),
          validateInputs: Input.validateInputs.bind(app),
          checkEmptyState: Input.checkEmptyState.bind(app),
          resizeTextarea: Input.resizeTextarea.bind(app),
          init: Input.init.bind(app),
        },
      });
    },
    on: {
      init: function init() {
        var app = this;
        app.input.init();
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        var $tabEl = $(tabEl);
        $tabEl.find('.item-input, .input').each(function (itemInputIndex, itemInputEl) {
          var $itemInputEl = $(itemInputEl);
          $itemInputEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
            var $inputEl = $(inputEl);
            if (Input.ignoreTypes.indexOf($inputEl.attr('type')) >= 0) { return; }
            app.input.checkEmptyState($inputEl);
          });
        });
        $tabEl.find('textarea.resizable').each(function (textareaIndex, textareaEl) {
          app.input.resizeTextarea(textareaEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        var $pageEl = page.$el;
        $pageEl.find('.item-input, .input').each(function (itemInputIndex, itemInputEl) {
          var $itemInputEl = $(itemInputEl);
          $itemInputEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
            var $inputEl = $(inputEl);
            if (Input.ignoreTypes.indexOf($inputEl.attr('type')) >= 0) { return; }
            app.input.checkEmptyState($inputEl);
          });
        });
        $pageEl.find('textarea.resizable').each(function (textareaIndex, textareaEl) {
          app.input.resizeTextarea(textareaEl);
        });
      },
    },
  };

  var Checkbox = {
    name: 'checkbox',
  };

  var Radio = {
    name: 'radio',
  };

  var Toggle = (function (Framework7Class$$1) {
    function Toggle(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var toggle = this;

      var defaults = {};

      // Extend defaults with modules params
      toggle.useModulesParams(defaults);

      toggle.params = Utils.extend(defaults, params);

      var el = toggle.params.el;
      if (!el) { return toggle; }

      var $el = $(el);
      if ($el.length === 0) { return toggle; }

      if ($el[0].f7Toggle) { return $el[0].f7Toggle; }

      var $inputEl = $el.children('input[type="checkbox"]');

      Utils.extend(toggle, {
        app: app,
        $el: $el,
        el: $el[0],
        $inputEl: $inputEl,
        inputEl: $inputEl[0],
        disabled: $el.hasClass('disabled') || $inputEl.hasClass('disabled') || $inputEl.attr('disabled') || $inputEl[0].disabled,
      });

      Object.defineProperty(toggle, 'checked', {
        enumerable: true,
        configurable: true,
        set: function set(checked) {
          if (!toggle || typeof toggle.$inputEl === 'undefined') { return; }
          if (toggle.checked === checked) { return; }
          $inputEl[0].checked = checked;
          toggle.$inputEl.trigger('change');
        },
        get: function get() {
          return $inputEl[0].checked;
        },
      });

      $el[0].f7Toggle = toggle;

      var isTouched;
      var touchesStart = {};
      var isScrolling;
      var touchesDiff;
      var toggleWidth;
      var touchStartTime;
      var touchStartChecked;
      function handleTouchStart(e) {
        if (isTouched || toggle.disabled) { return; }
        touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        touchesDiff = 0;

        isTouched = true;
        isScrolling = undefined;
        touchStartTime = Utils.now();
        touchStartChecked = toggle.checked;

        toggleWidth = $el[0].offsetWidth;
        Utils.nextTick(function () {
          if (isTouched) {
            $el.addClass('toggle-active-state');
          }
        });
      }
      function handleTouchMove(e) {
        if (!isTouched || toggle.disabled) { return; }
        var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
        var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
        var inverter = app.rtl ? -1 : 1;

        if (typeof isScrolling === 'undefined') {
          isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }
        if (isScrolling) {
          isTouched = false;
          return;
        }
        e.preventDefault();

        touchesDiff = pageX - touchesStart.x;


        var changed;
        if (touchesDiff * inverter < 0 && Math.abs(touchesDiff) > toggleWidth / 3 && touchStartChecked) {
          changed = true;
        }
        if (touchesDiff * inverter > 0 && Math.abs(touchesDiff) > toggleWidth / 3 && !touchStartChecked) {
          changed = true;
        }
        if (changed) {
          touchesStart.x = pageX;
          toggle.checked = !touchStartChecked;
          touchStartChecked = !touchStartChecked;
        }
      }
      function handleTouchEnd() {
        if (!isTouched || toggle.disabled) {
          if (isScrolling) { $el.removeClass('toggle-active-state'); }
          isTouched = false;
          return;
        }
        var inverter = app.rtl ? -1 : 1;
        isTouched = false;

        $el.removeClass('toggle-active-state');

        var changed;
        if ((Utils.now() - touchStartTime) < 300) {
          if (touchesDiff * inverter < 0 && touchStartChecked) {
            changed = true;
          }
          if (touchesDiff * inverter > 0 && !touchStartChecked) {
            changed = true;
          }
          if (changed) {
            toggle.checked = !touchStartChecked;
          }
        }
      }
      function handleInputChange() {
        toggle.$el.trigger('toggle:change', toggle);
        toggle.emit('local::change toggleChange', toggle);
      }
      toggle.attachEvents = function attachEvents() {
        if (Support.touch) {
          var passive = Support.passiveListener ? { passive: true } : false;
          $el.on(app.touchEvents.start, handleTouchStart, passive);
          app.on('touchmove', handleTouchMove);
          app.on('touchend:passive', handleTouchEnd);
        }
        toggle.$inputEl.on('change', handleInputChange);
      };
      toggle.detachEvents = function detachEvents() {
        if (Support.touch) {
          var passive = Support.passiveListener ? { passive: true } : false;
          $el.off(app.touchEvents.start, handleTouchStart, passive);
          app.off('touchmove', handleTouchMove);
          app.off('touchend:passive', handleTouchEnd);
        }
        toggle.$inputEl.off('change', handleInputChange);
      };

      // Install Modules
      toggle.useModules();

      // Init
      toggle.init();
    }

    if ( Framework7Class$$1 ) Toggle.__proto__ = Framework7Class$$1;
    Toggle.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Toggle.prototype.constructor = Toggle;

    Toggle.prototype.toggle = function toggle () {
      var toggle = this;
      toggle.checked = !toggle.checked;
    };

    Toggle.prototype.init = function init () {
      var toggle = this;
      toggle.attachEvents();
    };

    Toggle.prototype.destroy = function destroy () {
      var toggle = this;
      toggle.$el.trigger('toggle:beforedestroy', toggle);
      toggle.emit('local::beforeDestroy toggleBeforeDestroy', toggle);
      delete toggle.$el[0].f7Toggle;
      toggle.detachEvents();
      Utils.deleteProps(toggle);
      toggle = null;
    };

    return Toggle;
  }(Framework7Class));

  var Toggle$1 = {
    name: 'toggle',
    create: function create() {
      var app = this;
      app.toggle = ConstructorMethods({
        defaultSelector: '.toggle',
        constructor: Toggle,
        app: app,
        domProp: 'f7Toggle',
      });
    },
    static: {
      Toggle: Toggle,
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.toggle-init').each(function (index, toggleEl) { return app.toggle.create({ el: toggleEl }); });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $(tabEl).find('.toggle-init').each(function (index, toggleEl) {
          if (toggleEl.f7Toggle) { toggleEl.f7Toggle.destroy(); }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.toggle-init').each(function (index, toggleEl) { return app.toggle.create({ el: toggleEl }); });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        page.$el.find('.toggle-init').each(function (index, toggleEl) {
          if (toggleEl.f7Toggle) { toggleEl.f7Toggle.destroy(); }
        });
      },
    },
    vnode: {
      'toggle-init': {
        insert: function insert(vnode) {
          var app = this;
          var toggleEl = vnode.elm;
          app.toggle.create({ el: toggleEl });
        },
        destroy: function destroy(vnode) {
          var toggleEl = vnode.elm;
          if (toggleEl.f7Toggle) { toggleEl.f7Toggle.destroy(); }
        },
      },
    },
  };

  var Range = (function (Framework7Class$$1) {
    function Range(app, params) {
      Framework7Class$$1.call(this, params, [app]);

      var range = this;
      var defaults = {
        el: null,
        inputEl: null,
        dual: false,
        step: 1,
        label: false,
        min: 0,
        max: 100,
        value: 0,
        draggableBar: true,
      };

      // Extend defaults with modules params
      range.useModulesParams(defaults);

      range.params = Utils.extend(defaults, params);

      var el = range.params.el;
      if (!el) { return range; }

      var $el = $(el);
      if ($el.length === 0) { return range; }

      if ($el[0].f7Range) { return $el[0].f7Range; }

      var dataset = $el.dataset();

      ('step min max value').split(' ').forEach(function (paramName) {
        if (typeof params[paramName] === 'undefined' && typeof dataset[paramName] !== 'undefined') {
          range.params[paramName] = parseFloat(dataset[paramName]);
        }
      });
      ('dual label').split(' ').forEach(function (paramName) {
        if (typeof params[paramName] === 'undefined' && typeof dataset[paramName] !== 'undefined') {
          range.params[paramName] = dataset[paramName];
        }
      });

      if (!range.params.value) {
        if (typeof dataset.value !== 'undefined') { range.params.value = dataset.value; }
        if (typeof dataset.valueLeft !== 'undefined' && typeof dataset.valueRight !== 'undefined') {
          range.params.value = [parseFloat(dataset.valueLeft), parseFloat(dataset.valueRight)];
        }
      }

      var $inputEl;
      if (!range.params.dual) {
        if (range.params.inputEl) {
          $inputEl = $(range.params.inputEl);
        } else if ($el.find('input[type="range"]').length) {
          $inputEl = $el.find('input[type="range"]').eq(0);
        }
      }

      var ref = range.params;
      var dual = ref.dual;
      var step = ref.step;
      var label = ref.label;
      var min = ref.min;
      var max = ref.max;
      var value = ref.value;
      Utils.extend(range, {
        $el: $el,
        el: $el[0],
        $inputEl: $inputEl,
        inputEl: $inputEl ? $inputEl[0] : undefined,
        dual: dual,
        step: step,
        label: label,
        min: min,
        max: max,
        value: value,
        previousValue: value,
      });

      if ($inputEl) {
        ('step min max').split(' ').forEach(function (paramName) {
          if (!params[paramName] && $inputEl.attr(paramName)) {
            range.params[paramName] = parseFloat($inputEl.attr(paramName));
            range[paramName] = parseFloat($inputEl.attr(paramName));
          }
        });
        if (typeof $inputEl.val() !== 'undefined') {
          range.params.value = parseFloat($inputEl.val());
          range.value = parseFloat($inputEl.val());
        }
      }

      // Dual
      if (range.dual) {
        $el.addClass('range-slider-dual');
      }
      if (range.label) {
        $el.addClass('range-slider-label');
      }

      // Check for layout
      var $barEl = $('<div class="range-bar"></div>');
      var $barActiveEl = $('<div class="range-bar-active"></div>');
      $barEl.append($barActiveEl);

      // Create Knobs
      var knobHTML = "\n      <div class=\"range-knob-wrap\">\n        <div class=\"range-knob\"></div>\n        " + (range.label ? '<div class="range-knob-label"></div>' : '') + "\n      </div>\n    ";
      var knobs = [$(knobHTML)];
      var labels = [];

      if (range.dual) {
        knobs.push($(knobHTML));
      }

      $el.append($barEl);
      knobs.forEach(function ($knobEl) {
        $el.append($knobEl);
      });

      // Labels
      if (range.label) {
        labels.push(knobs[0].find('.range-knob-label'));
        if (range.dual) {
          labels.push(knobs[1].find('.range-knob-label'));
        }
      }

      Utils.extend(range, {
        app: app,
        knobs: knobs,
        labels: labels,
        $barEl: $barEl,
        $barActiveEl: $barActiveEl,
      });

      $el[0].f7Range = range;

      // Touch Events
      var isTouched;
      var touchesStart = {};
      var isScrolling;
      var rangeOffsetLeft;
      var $touchedKnobEl;
      var dualValueIndex;
      var valueChangedByTouch;
      function onTouchChange() {
        valueChangedByTouch = true;
      }
      function handleTouchStart(e) {
        if (isTouched) { return; }
        if (!range.params.draggableBar) {
          if ($(e.target).closest('.range-knob').length === 0) {
            return;
          }
        }
        valueChangedByTouch = false;
        touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;

        isTouched = true;
        isScrolling = undefined;
        rangeOffsetLeft = $el.offset().left;

        var progress;
        if (range.app.rtl) {
          progress = ((rangeOffsetLeft + range.rangeWidth) - touchesStart.x) / range.rangeWidth;
        } else {
          progress = (touchesStart.x - rangeOffsetLeft) / range.rangeWidth;
        }

        var newValue = (progress * (range.max - range.min)) + range.min;
        if (range.dual) {
          if (Math.abs(range.value[0] - newValue) < Math.abs(range.value[1] - newValue)) {
            dualValueIndex = 0;
            $touchedKnobEl = range.knobs[0];
            newValue = [newValue, range.value[1]];
          } else {
            dualValueIndex = 1;
            $touchedKnobEl = range.knobs[1];
            newValue = [range.value[0], newValue];
          }
        } else {
          $touchedKnobEl = range.knobs[0];
          newValue = (progress * (range.max - range.min)) + range.min;
        }
        Utils.nextTick(function () {
          if (isTouched) { $touchedKnobEl.addClass('range-knob-active-state'); }
        }, 70);
        range.on('change', onTouchChange);
        range.setValue(newValue, true);
      }
      function handleTouchMove(e) {
        if (!isTouched) { return; }
        var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
        var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

        if (typeof isScrolling === 'undefined') {
          isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }
        if (isScrolling) {
          isTouched = false;
          return;
        }
        e.preventDefault();

        var progress;
        if (range.app.rtl) {
          progress = ((rangeOffsetLeft + range.rangeWidth) - pageX) / range.rangeWidth;
        } else {
          progress = (pageX - rangeOffsetLeft) / range.rangeWidth;
        }

        var newValue = (progress * (range.max - range.min)) + range.min;
        if (range.dual) {
          var leftValue;
          var rightValue;
          if (dualValueIndex === 0) {
            leftValue = newValue;
            rightValue = range.value[1];
            if (leftValue > rightValue) {
              rightValue = leftValue;
            }
          } else {
            leftValue = range.value[0];
            rightValue = newValue;
            if (rightValue < leftValue) {
              leftValue = rightValue;
            }
          }
          newValue = [leftValue, rightValue];
        }
        range.setValue(newValue, true);
      }
      function handleTouchEnd() {
        if (!isTouched) {
          if (isScrolling) { $touchedKnobEl.removeClass('range-knob-active-state'); }
          isTouched = false;
          return;
        }
        range.off('change', onTouchChange);
        isTouched = false;
        $touchedKnobEl.removeClass('range-knob-active-state');
        if (valueChangedByTouch && range.$inputEl && !range.dual) {
          range.$inputEl.trigger('change');
        }
        valueChangedByTouch = false;
        if (typeof range.previousValue !== 'undefined') {
          if (
            (
              range.dual
              && (
                range.previousValue[0] !== range.value[0]
                || range.previousValue[1] !== range.value[1]
              )
            )
            || (
              !range.dual
              && range.previousValue !== range.value
            )
          ) {
            range.$el.trigger('range:changed', range, range.value);
            range.emit('local::changed rangeChanged', range, range.value);
          }
        }
      }

      function handleResize() {
        range.calcSize();
        range.layout();
      }
      range.attachEvents = function attachEvents() {
        var passive = Support.passiveListener ? { passive: true } : false;
        range.$el.on(app.touchEvents.start, handleTouchStart, passive);
        app.on('touchmove', handleTouchMove);
        app.on('touchend:passive', handleTouchEnd);
        app.on('tabShow', handleResize);
        app.on('resize', handleResize);
        range.$el
          .parents('.sheet-modal, .actions-modal, .popup, .popover, .login-screen, .dialog, .toast')
          .on('modal:open', handleResize);
        range.$el
          .parents('.panel')
          .on('panel:open', handleResize);
      };
      range.detachEvents = function detachEvents() {
        var passive = Support.passiveListener ? { passive: true } : false;
        range.$el.off(app.touchEvents.start, handleTouchStart, passive);
        app.off('touchmove', handleTouchMove);
        app.off('touchend:passive', handleTouchEnd);
        app.off('tabShow', handleResize);
        app.off('resize', handleResize);
        range.$el
          .parents('.sheet-modal, .actions-modal, .popup, .popover, .login-screen, .dialog, .toast')
          .off('modal:open', handleResize);
        range.$el
          .parents('.panel')
          .off('panel:open', handleResize);
      };

      // Install Modules
      range.useModules();

      // Init
      range.init();

      return range;
    }

    if ( Framework7Class$$1 ) Range.__proto__ = Framework7Class$$1;
    Range.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Range.prototype.constructor = Range;

    Range.prototype.calcSize = function calcSize () {
      var range = this;
      var width = range.$el.outerWidth();
      if (width === 0) { return; }
      range.rangeWidth = width;
      range.knobWidth = range.knobs[0].outerWidth();
    };

    Range.prototype.layout = function layout () {
      var obj;

      var range = this;
      var app = range.app;
      var knobWidth = range.knobWidth;
      var rangeWidth = range.rangeWidth;
      var min = range.min;
      var max = range.max;
      var knobs = range.knobs;
      var $barActiveEl = range.$barActiveEl;
      var value = range.value;
      var label = range.label;
      var labels = range.labels;
      var positionProperty = app.rtl ? 'right' : 'left';
      if (range.dual) {
        var progress = [((value[0] - min) / (max - min)), ((value[1] - min) / (max - min))];
        $barActiveEl.css(( obj = {}, obj[positionProperty] = ((progress[0] * 100) + "%"), obj.width = (((progress[1] - progress[0]) * 100) + "%"), obj ));
        knobs.forEach(function ($knobEl, knobIndex) {
          var leftPos = rangeWidth * progress[knobIndex];
          var realLeft = (rangeWidth * progress[knobIndex]) - (knobWidth / 2);
          if (realLeft < 0) { leftPos = knobWidth / 2; }
          if ((realLeft + knobWidth) > rangeWidth) { leftPos = rangeWidth - (knobWidth / 2); }
          $knobEl.css(positionProperty, (leftPos + "px"));
          if (label) { labels[knobIndex].text(value[knobIndex]); }
        });
      } else {
        var progress$1 = ((value - min) / (max - min));
        $barActiveEl.css('width', ((progress$1 * 100) + "%"));

        var leftPos = rangeWidth * progress$1;
        var realLeft = (rangeWidth * progress$1) - (knobWidth / 2);
        if (realLeft < 0) { leftPos = knobWidth / 2; }
        if ((realLeft + knobWidth) > rangeWidth) { leftPos = rangeWidth - (knobWidth / 2); }
        knobs[0].css(positionProperty, (leftPos + "px"));
        if (label) { labels[0].text(value); }
      }
      if ((range.dual && value.indexOf(min) >= 0) || (!range.dual && value === min)) {
        range.$el.addClass('range-slider-min');
      } else {
        range.$el.removeClass('range-slider-min');
      }
      if ((range.dual && value.indexOf(max) >= 0) || (!range.dual && value === max)) {
        range.$el.addClass('range-slider-max');
      } else {
        range.$el.removeClass('range-slider-max');
      }
    };

    Range.prototype.setValue = function setValue (newValue, byTouchMove) {
      var range = this;
      var step = range.step;
      var min = range.min;
      var max = range.max;
      var valueChanged;
      var oldValue;
      if (range.dual) {
        oldValue = [range.value[0], range.value[1]];
        var newValues = newValue;
        if (!Array.isArray(newValues)) { newValues = [newValue, newValue]; }
        if (newValue[0] > newValue[1]) {
          newValues = [newValues[0], newValues[0]];
        }
        newValues = newValues.map(function (value) { return Math.max(Math.min(Math.round(value / step) * step, max), min); });
        if (newValues[0] === range.value[0] && newValues[1] === range.value[1]) {
          return range;
        }
        newValues.forEach(function (value, valueIndex) {
          range.value[valueIndex] = value;
        });
        valueChanged = oldValue[0] !== newValues[0] || oldValue[1] !== newValues[1];
        range.layout();
      } else {
        oldValue = range.value;
        var value = Math.max(Math.min(Math.round(newValue / step) * step, max), min);
        range.value = value;
        range.layout();
        valueChanged = oldValue !== value;
      }

      if (valueChanged) {
        range.previousValue = oldValue;
      }
      // Events
      if (!valueChanged) { return range; }
      range.$el.trigger('range:change', range, range.value);
      if (range.$inputEl && !range.dual) {
        range.$inputEl.val(range.value);
        if (!byTouchMove) {
          range.$inputEl.trigger('input change');
        } else {
          range.$inputEl.trigger('input');
        }
      }
      if (!byTouchMove) {
        range.$el.trigger('range:changed', range, range.value);
        range.emit('local::changed rangeChanged', range, range.value);
      }
      range.emit('local::change rangeChange', range, range.value);
      return range;
    };

    Range.prototype.getValue = function getValue () {
      return this.value;
    };

    Range.prototype.init = function init () {
      var range = this;
      range.calcSize();
      range.layout();
      range.attachEvents();
      return range;
    };

    Range.prototype.destroy = function destroy () {
      var range = this;
      range.$el.trigger('range:beforedestroy', range);
      range.emit('local::beforeDestroy rangeBeforeDestroy', range);
      delete range.$el[0].f7Range;
      range.detachEvents();
      Utils.deleteProps(range);
      range = null;
    };

    return Range;
  }(Framework7Class));

  var Range$1 = {
    name: 'range',
    create: function create() {
      var app = this;
      app.range = Utils.extend(
        ConstructorMethods({
          defaultSelector: '.range-slider',
          constructor: Range,
          app: app,
          domProp: 'f7Range',
        }),
        {
          getValue: function getValue(el) {
            if ( el === void 0 ) el = '.range-slider';

            var range = app.range.get(el);
            if (range) { return range.getValue(); }
            return undefined;
          },
          setValue: function setValue(el, value) {
            if ( el === void 0 ) el = '.range-slider';

            var range = app.range.get(el);
            if (range) { return range.setValue(value); }
            return undefined;
          },
        }
      );
    },
    static: {
      Range: Range,
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.range-slider-init').each(function (index, rangeEl) { return new Range(app, {
          el: rangeEl,
        }); });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $(tabEl).find('.range-slider-init').each(function (index, rangeEl) {
          if (rangeEl.f7Range) { rangeEl.f7Range.destroy(); }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.range-slider-init').each(function (index, rangeEl) { return new Range(app, {
          el: rangeEl,
        }); });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        page.$el.find('.range-slider-init').each(function (index, rangeEl) {
          if (rangeEl.f7Range) { rangeEl.f7Range.destroy(); }
        });
      },
    },
    vnode: {
      'range-slider-init': {
        insert: function insert(vnode) {
          var rangeEl = vnode.elm;
          var app = this;
          app.range.create({ el: rangeEl });
        },
        destroy: function destroy(vnode) {
          var rangeEl = vnode.elm;
          if (rangeEl.f7Range) { rangeEl.f7Range.destroy(); }
        },
      },
    },
  };

  var Stepper = (function (Framework7Class$$1) {
    function Stepper(app, params) {
      Framework7Class$$1.call(this, params, [app]);
      var stepper = this;

      var defaults = {
        el: null,
        inputEl: null,
        valueEl: null,
        value: 0,
        formatValue: null,
        step: 1,
        min: 0,
        max: 100,
        watchInput: true,
        autorepeat: false,
        autorepeatDynamic: false,
        wraps: false,
        manualInputMode: false,
        decimalPoint: 4,
        buttonsEndInputMode: true,
      };

      // Extend defaults with modules params
      stepper.useModulesParams(defaults);

      stepper.params = Utils.extend(defaults, params);
      if (stepper.params.value < stepper.params.min) {
        stepper.params.value = stepper.params.min;
      }
      if (stepper.params.value > stepper.params.max) {
        stepper.params.value = stepper.params.max;
      }

      var el = stepper.params.el;
      if (!el) { return stepper; }

      var $el = $(el);
      if ($el.length === 0) { return stepper; }

      if ($el[0].f7Stepper) { return $el[0].f7Stepper; }

      var $inputEl;
      if (stepper.params.inputEl) {
        $inputEl = $(stepper.params.inputEl);
      } else if ($el.find('.stepper-input-wrap').find('input, textarea').length) {
        $inputEl = $el.find('.stepper-input-wrap').find('input, textarea').eq(0);
      }

      if ($inputEl && $inputEl.length) {
        ('step min max').split(' ').forEach(function (paramName) {
          if (!params[paramName] && $inputEl.attr(paramName)) {
            stepper.params[paramName] = parseFloat($inputEl.attr(paramName));
          }
        });

        var decimalPoint$1 = parseInt(stepper.params.decimalPoint, 10);
        if (Number.isNaN(decimalPoint$1)) {
          stepper.params.decimalPoint = 0;
        } else {
          stepper.params.decimalPoint = decimalPoint$1;
        }

        var inputValue = parseFloat($inputEl.val());
        if (typeof params.value === 'undefined' && !Number.isNaN(inputValue) && (inputValue || inputValue === 0)) {
          stepper.params.value = inputValue;
        }
      }

      var $valueEl;
      if (stepper.params.valueEl) {
        $valueEl = $(stepper.params.valueEl);
      } else if ($el.find('.stepper-value').length) {
        $valueEl = $el.find('.stepper-value').eq(0);
      }

      var $buttonPlusEl = $el.find('.stepper-button-plus');
      var $buttonMinusEl = $el.find('.stepper-button-minus');

      var ref = stepper.params;
      var step = ref.step;
      var min = ref.min;
      var max = ref.max;
      var value = ref.value;
      var decimalPoint = ref.decimalPoint;

      Utils.extend(stepper, {
        app: app,
        $el: $el,
        el: $el[0],
        $buttonPlusEl: $buttonPlusEl,
        buttonPlusEl: $buttonPlusEl[0],
        $buttonMinusEl: $buttonMinusEl,
        buttonMinusEl: $buttonMinusEl[0],
        $inputEl: $inputEl,
        inputEl: $inputEl ? $inputEl[0] : undefined,
        $valueEl: $valueEl,
        valueEl: $valueEl ? $valueEl[0] : undefined,
        step: step,
        min: min,
        max: max,
        value: value,
        decimalPoint: decimalPoint,
        typeModeChanged: false,
      });

      $el[0].f7Stepper = stepper;

      // Handle Events
      var touchesStart = {};
      var isTouched;
      var isScrolling;
      var preventButtonClick;
      var intervalId;
      var timeoutId;
      var autorepeatAction = null;
      var autorepeatInAction = false;
      var manualInput = false;

      function dynamicRepeat(current, progressions, startsIn, progressionStep, repeatEvery, action) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function () {
          if (current === 1) {
            preventButtonClick = true;
            autorepeatInAction = true;
          }
          clearInterval(intervalId);
          action();
          intervalId = setInterval(function () {
            action();
          }, repeatEvery);
          if (current < progressions) {
            dynamicRepeat(current + 1, progressions, startsIn, progressionStep, repeatEvery / 2, action);
          }
        }, current === 1 ? startsIn : progressionStep);
      }

      function onTouchStart(e) {
        if (isTouched) { return; }
        if (manualInput) { return; }
        if ($(e.target).closest($buttonPlusEl).length) {
          autorepeatAction = 'increment';
        } else if ($(e.target).closest($buttonMinusEl).length) {
          autorepeatAction = 'decrement';
        }
        if (!autorepeatAction) { return; }

        touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        isTouched = true;
        isScrolling = undefined;

        var progressions = stepper.params.autorepeatDynamic ? 4 : 1;
        dynamicRepeat(1, progressions, 500, 1000, 300, function () {
          stepper[autorepeatAction]();
        });
      }
      function onTouchMove(e) {
        if (!isTouched) { return; }
        if (manualInput) { return; }
        var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
        var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

        if (typeof isScrolling === 'undefined' && !autorepeatInAction) {
          isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }
        var distance = Math.pow( ((Math.pow( (pageX - touchesStart.x), 2 )) + (Math.pow( (pageY - touchesStart.y), 2 ))), 0.5 );

        if (isScrolling || distance > 20) {
          isTouched = false;
          clearTimeout(timeoutId);
          clearInterval(intervalId);
        }
      }
      function onTouchEnd() {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        autorepeatAction = null;
        autorepeatInAction = false;
        isTouched = false;
      }

      function onMinusClick() {
        if (manualInput) {
          if (stepper.params.buttonsEndInputMode) {
            manualInput = false;
            stepper.endTypeMode(true);
          }
          return;
        }
        if (preventButtonClick) {
          preventButtonClick = false;
          return;
        }
        stepper.decrement(true);
      }
      function onPlusClick() {
        if (manualInput) {
          if (stepper.params.buttonsEndInputMode) {
            manualInput = false;
            stepper.endTypeMode(true);
          }
          return;
        }
        if (preventButtonClick) {
          preventButtonClick = false;
          return;
        }
        stepper.increment(true);
      }
      function onInputClick(e) {
        if (!e.target.readOnly && stepper.params.manualInputMode) {
          manualInput = true;
          if (typeof e.target.selectionStart === 'number') {
            e.target.selectionStart = e.target.value.length;
            e.target.selectionEnd = e.target.value.length;
          }
        }
      }
      function onInputKey(e) {
        if (e.keyCode === 13 || e.which === 13) {
          e.preventDefault();
          manualInput = false;
          stepper.endTypeMode();
        }
      }
      function onInputBlur() {
        manualInput = false;
        stepper.endTypeMode(true);
      }
      function onInput(e) {
        if (manualInput) {
          stepper.typeValue(e.target.value);
          return;
        }
        if (e.detail && e.detail.sentByF7Stepper) { return; }
        stepper.setValue(e.target.value, true);
      }
      stepper.attachEvents = function attachEvents() {
        $buttonMinusEl.on('click', onMinusClick);
        $buttonPlusEl.on('click', onPlusClick);
        if (stepper.params.watchInput && $inputEl && $inputEl.length) {
          $inputEl.on('input', onInput);
          $inputEl.on('click', onInputClick);
          $inputEl.on('blur', onInputBlur);
          $inputEl.on('keyup', onInputKey);
        }
        if (stepper.params.autorepeat) {
          app.on('touchstart:passive', onTouchStart);
          app.on('touchmove:active', onTouchMove);
          app.on('touchend:passive', onTouchEnd);
        }
      };
      stepper.detachEvents = function detachEvents() {
        $buttonMinusEl.off('click', onMinusClick);
        $buttonPlusEl.off('click', onPlusClick);
        if (stepper.params.watchInput && $inputEl && $inputEl.length) {
          $inputEl.off('input', onInput);
          $inputEl.off('click', onInputClick);
          $inputEl.off('blur', onInputBlur);
          $inputEl.off('keyup', onInputKey);
        }
      };

      // Install Modules
      stepper.useModules();

      // Init
      stepper.init();

      return stepper;
    }

    if ( Framework7Class$$1 ) Stepper.__proto__ = Framework7Class$$1;
    Stepper.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Stepper.prototype.constructor = Stepper;

    Stepper.prototype.minus = function minus () {
      return this.decrement();
    };

    Stepper.prototype.plus = function plus () {
      return this.increment();
    };

    Stepper.prototype.decrement = function decrement () {
      var stepper = this;
      return stepper.setValue(stepper.value - stepper.step, false, true);
    };

    Stepper.prototype.increment = function increment () {
      var stepper = this;
      return stepper.setValue(stepper.value + stepper.step, false, true);
    };

    Stepper.prototype.setValue = function setValue (newValue, forceUpdate, withWraps) {
      var stepper = this;
      var step = stepper.step;
      var min = stepper.min;
      var max = stepper.max;

      var oldValue = stepper.value;

      var value = Math.round(newValue / step) * step;
      if (stepper.params.wraps && withWraps) {
        if (value > max) { value = min; }
        if (value < min) { value = max; }
      } else {
        value = Math.max(Math.min(value, max), min);
      }

      if (Number.isNaN(value)) {
        value = oldValue;
      }
      stepper.value = value;

      var valueChanged = oldValue !== value;

      // Events
      if (!valueChanged && !forceUpdate) { return stepper; }

      stepper.$el.trigger('stepper:change', stepper, stepper.value);
      var formattedValue = stepper.formatValue(stepper.value);
      if (stepper.$inputEl && stepper.$inputEl.length) {
        stepper.$inputEl.val(formattedValue);
        stepper.$inputEl.trigger('input change', { sentByF7Stepper: true });
      }
      if (stepper.$valueEl && stepper.$valueEl.length) {
        stepper.$valueEl.html(formattedValue);
      }
      stepper.emit('local::change stepperChange', stepper, stepper.value);
      return stepper;
    };

    Stepper.prototype.endTypeMode = function endTypeMode (noBlur) {
      var stepper = this;
      var min = stepper.min;
      var max = stepper.max;
      var value = parseFloat(stepper.value);

      if (Number.isNaN(value)) { value = 0; }

      value = Math.max(Math.min(value, max), min);

      stepper.value = value;
      if (!stepper.typeModeChanged) {
        if (stepper.$inputEl && stepper.$inputEl.length && !noBlur) {
          stepper.$inputEl.blur();
        }
        return stepper;
      }
      stepper.typeModeChanged = false;

      stepper.$el.trigger('stepper:change', stepper, stepper.value);
      var formattedValue = stepper.formatValue(stepper.value);
      if (stepper.$inputEl && stepper.$inputEl.length) {
        stepper.$inputEl.val(formattedValue);
        stepper.$inputEl.trigger('input change', { sentByF7Stepper: true });
        if (!noBlur) { stepper.$inputEl.blur(); }
      }
      if (stepper.$valueEl && stepper.$valueEl.length) {
        stepper.$valueEl.html(formattedValue);
      }
      stepper.emit('local::change stepperChange', stepper, stepper.value);
      return stepper;
    };

    Stepper.prototype.typeValue = function typeValue (value) {
      var stepper = this;
      stepper.typeModeChanged = true;
      var inputTxt = String(value);
      if (inputTxt.lastIndexOf('.') + 1 === inputTxt.length || inputTxt.lastIndexOf(',') + 1 === inputTxt.length) {
        if (inputTxt.lastIndexOf('.') !== inputTxt.indexOf('.') || inputTxt.lastIndexOf(',') !== inputTxt.indexOf(',')) {
          inputTxt = inputTxt.slice(0, -1);
          stepper.value = inputTxt;
          stepper.$inputEl.val(stepper.value);
          return stepper;
        }
      } else {
        var newValue = parseFloat(inputTxt.replace(',', '.'));
        if (newValue === 0) {
          stepper.value = inputTxt.replace(',', '.');
          stepper.$inputEl.val(stepper.value);
          return stepper;
        }
        if (Number.isNaN(newValue)) {
          stepper.value = 0;
          stepper.$inputEl.val(stepper.value);
          return stepper;
        }
        var powVal = Math.pow( 10, stepper.params.decimalPoint );
        newValue = (Math.round((newValue) * powVal)).toFixed(stepper.params.decimalPoint + 1) / powVal;
        stepper.value = parseFloat(String(newValue).replace(',', '.'));
        stepper.$inputEl.val(stepper.value);
        return stepper;
      }
      stepper.value = inputTxt;
      stepper.$inputEl.val(inputTxt);
      return stepper;
    };

    Stepper.prototype.getValue = function getValue () {
      return this.value;
    };

    Stepper.prototype.formatValue = function formatValue (value) {
      var stepper = this;
      if (!stepper.params.formatValue) { return value; }
      return stepper.params.formatValue.call(stepper, value);
    };

    Stepper.prototype.init = function init () {
      var stepper = this;
      stepper.attachEvents();
      if (stepper.$valueEl && stepper.$valueEl.length) {
        var formattedValue = stepper.formatValue(stepper.value);
        stepper.$valueEl.html(formattedValue);
      }
      return stepper;
    };

    Stepper.prototype.destroy = function destroy () {
      var stepper = this;
      stepper.$el.trigger('stepper:beforedestroy', stepper);
      stepper.emit('local::beforeDestroy stepperBeforeDestroy', stepper);
      delete stepper.$el[0].f7Stepper;
      stepper.detachEvents();
      Utils.deleteProps(stepper);
      stepper = null;
    };

    return Stepper;
  }(Framework7Class));

  var Stepper$1 = {
    name: 'stepper',
    create: function create() {
      var app = this;
      app.stepper = Utils.extend(
        ConstructorMethods({
          defaultSelector: '.stepper',
          constructor: Stepper,
          app: app,
          domProp: 'f7Stepper',
        }),
        {
          getValue: function getValue(el) {
            if ( el === void 0 ) el = '.stepper';

            var stepper = app.stepper.get(el);
            if (stepper) { return stepper.getValue(); }
            return undefined;
          },
          setValue: function setValue(el, value) {
            if ( el === void 0 ) el = '.stepper';

            var stepper = app.stepper.get(el);
            if (stepper) { return stepper.setValue(value); }
            return undefined;
          },
        }
      );
    },
    static: {
      Stepper: Stepper,
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.stepper-init').each(function (index, stepperEl) {
          var dataset = $(stepperEl).dataset();
          app.stepper.create(Utils.extend({ el: stepperEl }, dataset || {}));
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $(tabEl).find('.stepper-init').each(function (index, stepperEl) {
          if (stepperEl.f7Stepper) { stepperEl.f7Stepper.destroy(); }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.stepper-init').each(function (index, stepperEl) {
          var dataset = $(stepperEl).dataset();
          app.stepper.create(Utils.extend({ el: stepperEl }, dataset || {}));
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        page.$el.find('.stepper-init').each(function (index, stepperEl) {
          if (stepperEl.f7Stepper) { stepperEl.f7Stepper.destroy(); }
        });
      },
    },
    vnode: {
      'stepper-init': {
        insert: function insert(vnode) {
          var app = this;
          var stepperEl = vnode.elm;
          var dataset = $(stepperEl).dataset();
          app.stepper.create(Utils.extend({ el: stepperEl }, dataset || {}));
        },
        destroy: function destroy(vnode) {
          var stepperEl = vnode.elm;
          if (stepperEl.f7Stepper) { stepperEl.f7Stepper.destroy(); }
        },
      },
    },
  };

  var SmartSelect = (function (Framework7Class$$1) {
    function SmartSelect(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var ss = this;

      var defaults = Utils.extend({
        on: {},
      }, app.params.smartSelect);

      // Extend defaults with modules params
      ss.useModulesParams(defaults);

      ss.params = Utils.extend({}, defaults, params);

      ss.app = app;

      var $el = $(ss.params.el).eq(0);
      if ($el.length === 0) { return ss; }

      if ($el[0].f7SmartSelect) { return $el[0].f7SmartSelect; }

      var $selectEl = $el.find('select').eq(0);
      if ($selectEl.length === 0) { return ss; }

      var $valueEl = $(ss.params.valueEl);
      if ($valueEl.length === 0) {
        $valueEl = $el.find('.item-after');
      }
      if ($valueEl.length === 0) {
        $valueEl = $('<div class="item-after"></div>');
        $valueEl.insertAfter($el.find('.item-title'));
      }

      // View
      var view;

      // Url
      var url = ss.params.url;
      if (!url) {
        if ($el.attr('href') && $el.attr('href') !== '#') { url = $el.attr('href'); }
        else { url = ($selectEl.attr('name').toLowerCase()) + "-select/"; }
      }
      if (!url) { url = ss.params.url; }

      var multiple = $selectEl[0].multiple;
      var inputType = multiple ? 'checkbox' : 'radio';
      var id = Utils.id();

      Utils.extend(ss, {
        $el: $el,
        el: $el[0],
        $selectEl: $selectEl,
        selectEl: $selectEl[0],
        $valueEl: $valueEl,
        valueEl: $valueEl[0],
        url: url,
        multiple: multiple,
        inputType: inputType,
        id: id,
        view: view,
        inputName: (inputType + "-" + id),
        selectName: $selectEl.attr('name'),
        maxLength: $selectEl.attr('maxlength') || params.maxLength,
      });

      $el[0].f7SmartSelect = ss;

      // Events
      function onClick() {
        ss.open();
      }
      function onChange() {
        var value = ss.$selectEl.val();
        ss.$el.trigger('smartselect:change', ss, value);
        ss.emit('local::change smartSelectChange', ss, value);
        ss.setValue();
      }
      ss.attachEvents = function attachEvents() {
        $el.on('click', onClick);
        $el.on('change', 'select', onChange);
      };
      ss.detachEvents = function detachEvents() {
        $el.off('click', onClick);
        $el.off('change', 'select', onChange);
      };

      function handleInputChange() {
        var optionEl;
        var text;
        var inputEl = this;
        var value = inputEl.value;
        var optionText = [];
        var displayAs;
        if (inputEl.type === 'checkbox') {
          for (var i = 0; i < ss.selectEl.options.length; i += 1) {
            optionEl = ss.selectEl.options[i];
            if (optionEl.value === value) {
              optionEl.selected = inputEl.checked;
            }
            if (optionEl.selected) {
              displayAs = optionEl.dataset ? optionEl.dataset.displayAs : $(optionEl).data('display-value-as');
              text = displayAs && typeof displayAs !== 'undefined' ? displayAs : optionEl.textContent;
              optionText.push(text.trim());
            }
          }
          if (ss.maxLength) {
            ss.checkMaxLength();
          }
        } else {
          optionEl = ss.$selectEl.find(("option[value=\"" + value + "\"]"))[0];
          displayAs = optionEl.dataset ? optionEl.dataset.displayAs : $(optionEl).data('display-as');
          text = displayAs && typeof displayAs !== 'undefined' ? displayAs : optionEl.textContent;
          optionText = [text];
          ss.selectEl.value = value;
        }

        ss.$selectEl.trigger('change');
        ss.$valueEl.text(optionText.join(', '));
        if (ss.params.closeOnSelect && ss.inputType === 'radio') {
          ss.close();
        }
      }

      ss.attachInputsEvents = function attachInputsEvents() {
        ss.$containerEl.on('change', 'input[type="checkbox"], input[type="radio"]', handleInputChange);
      };
      ss.detachInputsEvents = function detachInputsEvents() {
        ss.$containerEl.off('change', 'input[type="checkbox"], input[type="radio"]', handleInputChange);
      };

      // Install Modules
      ss.useModules();

      // Init
      ss.init();

      return ss;
    }

    if ( Framework7Class$$1 ) SmartSelect.__proto__ = Framework7Class$$1;
    SmartSelect.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    SmartSelect.prototype.constructor = SmartSelect;

    SmartSelect.prototype.getView = function getView () {
      var ss = this;
      var view = ss.view || ss.params.view;
      if (!view) {
        view = ss.$el.parents('.view').length && ss.$el.parents('.view')[0].f7View;
      }
      if (!view) {
        throw Error('Smart Select requires initialized View');
      }
      ss.view = view;
      return view;
    };

    SmartSelect.prototype.checkMaxLength = function checkMaxLength () {
      var ss = this;
      var $containerEl = ss.$containerEl;
      if (ss.selectEl.selectedOptions.length >= ss.maxLength) {
        $containerEl.find('input[type="checkbox"]').each(function (index, inputEl) {
          if (!inputEl.checked) {
            $(inputEl).parents('li').addClass('disabled');
          } else {
            $(inputEl).parents('li').removeClass('disabled');
          }
        });
      } else {
        $containerEl.find('.disabled').removeClass('disabled');
      }
    };

    SmartSelect.prototype.setValue = function setValue (value) {
      var ss = this;
      var valueArray = [];
      if (typeof value !== 'undefined') {
        if (Array.isArray(value)) {
          valueArray = value;
        } else {
          valueArray = [value];
        }
      } else {
        ss.$selectEl.find('option').each(function (optionIndex, optionEl) {
          var $optionEl = $(optionEl);
          if (optionEl.selected) {
            var displayAs = optionEl.dataset ? optionEl.dataset.displayAs : $optionEl.data('display-value-as');
            if (displayAs && typeof displayAs !== 'undefined') {
              valueArray.push(displayAs);
            } else {
              valueArray.push(optionEl.textContent.trim());
            }
          }
        });
      }
      ss.$valueEl.text(valueArray.join(', '));
    };

    SmartSelect.prototype.getItemsData = function getItemsData () {
      var ss = this;
      var items = [];
      var previousGroupEl;
      ss.$selectEl.find('option').each(function (index, optionEl) {
        var $optionEl = $(optionEl);
        var optionData = $optionEl.dataset();
        var optionImage = optionData.optionImage || ss.params.optionImage;
        var optionIcon = optionData.optionIcon || ss.params.optionIcon;
        var optionHasMedia = optionImage || optionIcon;
        // if (material) optionHasMedia = optionImage || optionIcon;
        var optionColor = optionData.optionColor;

        var optionClassName = optionData.optionClass || '';
        if ($optionEl[0].disabled) { optionClassName += ' disabled'; }

        var optionGroupEl = $optionEl.parent('optgroup')[0];
        var optionGroupLabel = optionGroupEl && optionGroupEl.label;
        var optionIsLabel = false;
        if (optionGroupEl && optionGroupEl !== previousGroupEl) {
          optionIsLabel = true;
          previousGroupEl = optionGroupEl;
          items.push({
            groupLabel: optionGroupLabel,
            isLabel: optionIsLabel,
          });
        }
        items.push({
          value: $optionEl[0].value,
          text: $optionEl[0].textContent.trim(),
          selected: $optionEl[0].selected,
          groupEl: optionGroupEl,
          groupLabel: optionGroupLabel,
          image: optionImage,
          icon: optionIcon,
          color: optionColor,
          className: optionClassName,
          disabled: $optionEl[0].disabled,
          id: ss.id,
          hasMedia: optionHasMedia,
          checkbox: ss.inputType === 'checkbox',
          radio: ss.inputType === 'radio',
          inputName: ss.inputName,
          inputType: ss.inputType,
        });
      });
      ss.items = items;
      return items;
    };

    SmartSelect.prototype.renderSearchbar = function renderSearchbar () {
      var ss = this;
      if (ss.params.renderSearchbar) { return ss.params.renderSearchbar.call(ss); }
      var searchbarHTML = "\n      <form class=\"searchbar\">\n        <div class=\"searchbar-inner\">\n          <div class=\"searchbar-input-wrap\">\n            <input type=\"search\" placeholder=\"" + (ss.params.searchbarPlaceholder) + "\"/>\n            <i class=\"searchbar-icon\"></i>\n            <span class=\"input-clear-button\"></span>\n          </div>\n          <span class=\"searchbar-disable-button\">" + (ss.params.searchbarDisableText) + "</span>\n        </div>\n      </form>\n    ";
      return searchbarHTML;
    };

    SmartSelect.prototype.renderItem = function renderItem (item, index) {
      var ss = this;
      if (ss.params.renderItem) { return ss.params.renderItem.call(ss, item, index); }
      var itemHtml;
      if (item.isLabel) {
        itemHtml = "<li class=\"item-divider\">" + (item.groupLabel) + "</li>";
      } else {
        itemHtml = "\n        <li class=\"" + (item.className || '') + "\">\n          <label class=\"item-" + (item.inputType) + " item-content\">\n            <input type=\"" + (item.inputType) + "\" name=\"" + (item.inputName) + "\" value=\"" + (item.value) + "\" " + (item.selected ? 'checked' : '') + "/>\n            <i class=\"icon icon-" + (item.inputType) + "\"></i>\n            " + (item.hasMedia ? ("\n              <div class=\"item-media\">\n                " + (item.icon ? ("<i class=\"icon " + (item.icon) + "\"></i>") : '') + "\n                " + (item.image ? ("<img src=\"" + (item.image) + "\">") : '') + "\n              </div>\n            ") : '') + "\n            <div class=\"item-inner\">\n              <div class=\"item-title" + (item.color ? (" color-" + (item.color)) : '') + "\">" + (item.text) + "</div>\n            </div>\n          </label>\n        </li>\n      ";
      }
      return itemHtml;
    };

    SmartSelect.prototype.renderItems = function renderItems () {
      var ss = this;
      if (ss.params.renderItems) { return ss.params.renderItems.call(ss, ss.items); }
      var itemsHtml = "\n      " + (ss.items.map(function (item, index) { return ("" + (ss.renderItem(item, index))); }).join('')) + "\n    ";
      return itemsHtml;
    };

    SmartSelect.prototype.renderPage = function renderPage () {
      var ss = this;
      if (ss.params.renderPage) { return ss.params.renderPage.call(ss, ss.items); }
      var pageTitle = ss.params.pageTitle;
      if (typeof pageTitle === 'undefined') {
        pageTitle = ss.$el.find('.item-title').text().trim();
      }
      var cssClass = ss.params.cssClass;
      var pageHtml = "\n      <div class=\"page smart-select-page " + cssClass + "\" data-name=\"smart-select-page\" data-select-name=\"" + (ss.selectName) + "\">\n        <div class=\"navbar " + (ss.params.navbarColorTheme ? ("color-theme-" + (ss.params.navbarColorTheme)) : '') + "\">\n          <div class=\"navbar-inner sliding " + (ss.params.navbarColorTheme ? ("color-theme-" + (ss.params.navbarColorTheme)) : '') + "\">\n            <div class=\"left\">\n              <a href=\"#\" class=\"link back\">\n                <i class=\"icon icon-back\"></i>\n                <span class=\"ios-only\">" + (ss.params.pageBackLinkText) + "</span>\n              </a>\n            </div>\n            " + (pageTitle ? ("<div class=\"title\">" + pageTitle + "</div>") : '') + "\n            " + (ss.params.searchbar ? ("<div class=\"subnavbar\">" + (ss.renderSearchbar()) + "</div>") : '') + "\n          </div>\n        </div>\n        " + (ss.params.searchbar ? '<div class="searchbar-backdrop"></div>' : '') + "\n        <div class=\"page-content\">\n          <div class=\"list smart-select-list-" + (ss.id) + " " + (ss.params.virtualList ? ' virtual-list' : '') + " " + (ss.params.formColorTheme ? ("color-theme-" + (ss.params.formColorTheme)) : '') + "\">\n            <ul>" + (!ss.params.virtualList && ss.renderItems(ss.items)) + "</ul>\n          </div>\n        </div>\n      </div>\n    ";
      return pageHtml;
    };

    SmartSelect.prototype.renderPopup = function renderPopup () {
      var ss = this;
      if (ss.params.renderPopup) { return ss.params.renderPopup.call(ss, ss.items); }
      var pageTitle = ss.params.pageTitle;
      if (typeof pageTitle === 'undefined') {
        pageTitle = ss.$el.find('.item-title').text().trim();
      }
      var cssClass = ss.params.cssClass;
      var popupHtml = "\n      <div class=\"popup smart-select-popup " + cssClass + "\" data-select-name=\"" + (ss.selectName) + "\">\n        <div class=\"view\">\n          <div class=\"page smart-select-page " + (ss.params.searchbar ? 'page-with-subnavbar' : '') + "\" data-name=\"smart-select-page\">\n            <div class=\"navbar " + (ss.params.navbarColorTheme ? ("color-theme-" + (ss.params.navbarColorTheme)) : '') + "\">\n              <div class=\"navbar-inner sliding\">\n                <div class=\"left\">\n                  <a href=\"#\" class=\"link popup-close\" data-popup=\".smart-select-popup[data-select-name='" + (ss.selectName) + "']\">\n                    <i class=\"icon icon-back\"></i>\n                    <span class=\"ios-only\">" + (ss.params.popupCloseLinkText) + "</span>\n                  </a>\n                </div>\n                " + (pageTitle ? ("<div class=\"title\">" + pageTitle + "</div>") : '') + "\n                " + (ss.params.searchbar ? ("<div class=\"subnavbar\">" + (ss.renderSearchbar()) + "</div>") : '') + "\n              </div>\n            </div>\n            " + (ss.params.searchbar ? '<div class="searchbar-backdrop"></div>' : '') + "\n            <div class=\"page-content\">\n              <div class=\"list smart-select-list-" + (ss.id) + " " + (ss.params.virtualList ? ' virtual-list' : '') + " " + (ss.params.formColorTheme ? ("color-theme-" + (ss.params.formColorTheme)) : '') + "\">\n                <ul>" + (!ss.params.virtualList && ss.renderItems(ss.items)) + "</ul>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ";
      return popupHtml;
    };

    SmartSelect.prototype.renderSheet = function renderSheet () {
      var ss = this;
      if (ss.params.renderSheet) { return ss.params.renderSheet.call(ss, ss.items); }
      var cssClass = ss.params.cssClass;
      var sheetHtml = "\n      <div class=\"sheet-modal smart-select-sheet " + cssClass + "\" data-select-name=\"" + (ss.selectName) + "\">\n        <div class=\"toolbar " + (ss.params.toolbarColorTheme ? ("theme-" + (ss.params.toolbarColorTheme)) : '') + "\">\n          <div class=\"toolbar-inner\">\n            <div class=\"left\"></div>\n            <div class=\"right\">\n              <a class=\"link sheet-close\">" + (ss.params.sheetCloseLinkText) + "</a>\n            </div>\n          </div>\n        </div>\n        <div class=\"sheet-modal-inner\">\n          <div class=\"page-content\">\n            <div class=\"list smart-select-list-" + (ss.id) + " " + (ss.params.virtualList ? ' virtual-list' : '') + " " + (ss.params.formColorTheme ? ("color-theme-" + (ss.params.formColorTheme)) : '') + "\">\n              <ul>" + (!ss.params.virtualList && ss.renderItems(ss.items)) + "</ul>\n            </div>\n          </div>\n        </div>\n      </div>\n    ";
      return sheetHtml;
    };

    SmartSelect.prototype.renderPopover = function renderPopover () {
      var ss = this;
      if (ss.params.renderPopover) { return ss.params.renderPopover.call(ss, ss.items); }
      var cssClass = ss.params.cssClass;
      var popoverHtml = "\n      <div class=\"popover smart-select-popover " + cssClass + "\" data-select-name=\"" + (ss.selectName) + "\">\n        <div class=\"popover-inner\">\n          <div class=\"list smart-select-list-" + (ss.id) + " " + (ss.params.virtualList ? ' virtual-list' : '') + " " + (ss.params.formColorTheme ? ("color-theme-" + (ss.params.formColorTheme)) : '') + "\">\n            <ul>" + (!ss.params.virtualList && ss.renderItems(ss.items)) + "</ul>\n          </div>\n        </div>\n      </div>\n    ";
      return popoverHtml;
    };

    SmartSelect.prototype.onOpen = function onOpen (type, containerEl) {
      var ss = this;
      var app = ss.app;
      var $containerEl = $(containerEl);
      ss.$containerEl = $containerEl;
      ss.openedIn = type;
      ss.opened = true;

      // Init VL
      if (ss.params.virtualList) {
        ss.vl = app.virtualList.create({
          el: $containerEl.find('.virtual-list'),
          items: ss.items,
          renderItem: ss.renderItem.bind(ss),
          height: ss.params.virtualListHeight,
          searchByItem: function searchByItem(query, item) {
            if (item.text && item.text.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0) { return true; }
            return false;
          },
        });
      }

      // Init SB
      if (ss.params.searchbar) {
        var $searchbarEl = $containerEl.find('.searchbar');
        if (type === 'page' && app.theme === 'ios') {
          $searchbarEl = $(app.navbar.getElByPage($containerEl)).find('.searchbar');
        }

        if (ss.params.appendSearchbarNotFound && (type === 'page' || type === 'popup')) {
          var $notFoundEl = null;

          if (typeof ss.params.appendSearchbarNotFound === 'string') {
            $notFoundEl = $(("<div class=\"block searchbar-not-found\">" + (ss.params.appendSearchbarNotFound) + "</div>"));
          } else if (typeof ss.params.appendSearchbarNotFound === 'boolean') {
            $notFoundEl = $('<div class="block searchbar-not-found">Nothing found</div>');
          } else {
            $notFoundEl = ss.params.appendSearchbarNotFound;
          }

          if ($notFoundEl) {
            $containerEl.find('.page-content').append($notFoundEl[0]);
          }
        }

        var searchbarParams = Utils.extend({
          el: $searchbarEl,
          backdropEl: $containerEl.find('.searchbar-backdrop'),
          searchContainer: (".smart-select-list-" + (ss.id)),
          searchIn: '.item-title',
        }, typeof ss.params.searchbar === 'object' ? ss.params.searchbar : {});

        ss.searchbar = app.searchbar.create(searchbarParams);
      }

      // Check for max length
      if (ss.maxLength) {
        ss.checkMaxLength();
      }

      // Close on select
      if (ss.params.closeOnSelect) {
        ss.$containerEl.find(("input[type=\"radio\"][name=\"" + (ss.inputName) + "\"]:checked")).parents('label').once('click', function () {
          ss.close();
        });
      }

      // Attach input events
      ss.attachInputsEvents();

      ss.$el.trigger('smartselect:open', ss);
      ss.emit('local::open smartSelectOpen', ss);
    };

    SmartSelect.prototype.onOpened = function onOpened () {
      var ss = this;

      ss.$el.trigger('smartselect:opened', ss);
      ss.emit('local::opened smartSelectOpened', ss);
    };

    SmartSelect.prototype.onClose = function onClose () {
      var ss = this;
      if (ss.destroyed) { return; }

      // Destroy VL
      if (ss.vl && ss.vl.destroy) {
        ss.vl.destroy();
        ss.vl = null;
        delete ss.vl;
      }

      // Destroy SB
      if (ss.searchbar && ss.searchbar.destroy) {
        ss.searchbar.destroy();
        ss.searchbar = null;
        delete ss.searchbar;
      }
      // Detach events
      ss.detachInputsEvents();

      ss.$el.trigger('smartselect:close', ss);
      ss.emit('local::close smartSelectClose', ss);
    };

    SmartSelect.prototype.onClosed = function onClosed () {
      var ss = this;
      if (ss.destroyed) { return; }
      ss.opened = false;
      ss.$containerEl = null;
      delete ss.$containerEl;

      ss.$el.trigger('smartselect:closed', ss);
      ss.emit('local::closed smartSelectClosed', ss);
    };

    SmartSelect.prototype.openPage = function openPage () {
      var ss = this;
      if (ss.opened) { return ss; }
      ss.getItemsData();
      var pageHtml = ss.renderPage(ss.items);
      var view = ss.getView();

      view.router.navigate({
        url: ss.url,
        route: {
          content: pageHtml,
          path: ss.url,
          on: {
            pageBeforeIn: function pageBeforeIn(e, page) {
              ss.onOpen('page', page.el);
            },
            pageAfterIn: function pageAfterIn(e, page) {
              ss.onOpened('page', page.el);
            },
            pageBeforeOut: function pageBeforeOut(e, page) {
              ss.onClose('page', page.el);
            },
            pageAfterOut: function pageAfterOut(e, page) {
              ss.onClosed('page', page.el);
            },
          },
        },
      });
      return ss;
    };

    SmartSelect.prototype.openPopup = function openPopup () {
      var ss = this;
      if (ss.opened) { return ss; }
      ss.getItemsData();
      var popupHtml = ss.renderPopup(ss.items);

      var popupParams = {
        content: popupHtml,
        on: {
          popupOpen: function popupOpen(popup) {
            ss.onOpen('popup', popup.el);
          },
          popupOpened: function popupOpened(popup) {
            ss.onOpened('popup', popup.el);
          },
          popupClose: function popupClose(popup) {
            ss.onClose('popup', popup.el);
          },
          popupClosed: function popupClosed(popup) {
            ss.onClosed('popup', popup.el);
          },
        },
      };

      if (ss.params.routableModals) {
        var view = ss.getView();
        view.router.navigate({
          url: ss.url,
          route: {
            path: ss.url,
            popup: popupParams,
          },
        });
      } else {
        ss.modal = ss.app.popup.create(popupParams).open();
      }
      return ss;
    };

    SmartSelect.prototype.openSheet = function openSheet () {
      var ss = this;
      if (ss.opened) { return ss; }
      ss.getItemsData();
      var sheetHtml = ss.renderSheet(ss.items);

      var sheetParams = {
        content: sheetHtml,
        backdrop: false,
        scrollToEl: ss.$el,
        closeByOutsideClick: true,
        on: {
          sheetOpen: function sheetOpen(sheet) {
            ss.onOpen('sheet', sheet.el);
          },
          sheetOpened: function sheetOpened(sheet) {
            ss.onOpened('sheet', sheet.el);
          },
          sheetClose: function sheetClose(sheet) {
            ss.onClose('sheet', sheet.el);
          },
          sheetClosed: function sheetClosed(sheet) {
            ss.onClosed('sheet', sheet.el);
          },
        },
      };

      if (ss.params.routableModals) {
        var view = ss.getView();
        view.router.navigate({
          url: ss.url,
          route: {
            path: ss.url,
            sheet: sheetParams,
          },
        });
      } else {
        ss.modal = ss.app.sheet.create(sheetParams).open();
      }
      return ss;
    };

    SmartSelect.prototype.openPopover = function openPopover () {
      var ss = this;
      if (ss.opened) { return ss; }
      ss.getItemsData();
      var popoverHtml = ss.renderPopover(ss.items);
      var popoverParams = {
        content: popoverHtml,
        targetEl: ss.$el,
        on: {
          popoverOpen: function popoverOpen(popover) {
            ss.onOpen('popover', popover.el);
          },
          popoverOpened: function popoverOpened(popover) {
            ss.onOpened('popover', popover.el);
          },
          popoverClose: function popoverClose(popover) {
            ss.onClose('popover', popover.el);
          },
          popoverClosed: function popoverClosed(popover) {
            ss.onClosed('popover', popover.el);
          },
        },
      };
      if (ss.params.routableModals) {
        var view = ss.getView();
        view.router.navigate({
          url: ss.url,
          route: {
            path: ss.url,
            popover: popoverParams,
          },
        });
      } else {
        ss.modal = ss.app.popover.create(popoverParams).open();
      }
      return ss;
    };

    SmartSelect.prototype.open = function open (type) {
      var ss = this;
      if (ss.opened) { return ss; }
      var openIn = type || ss.params.openIn;
      ss[("open" + (openIn.split('').map(function (el, index) {
        if (index === 0) { return el.toUpperCase(); }
        return el;
      }).join('')))]();
      return ss;
    };

    SmartSelect.prototype.close = function close () {
      var ss = this;
      if (!ss.opened) { return ss; }
      if (ss.params.routableModals || ss.openedIn === 'page') {
        var view = ss.getView();
        view.router.back();
      } else {
        ss.modal.once('modalClosed', function () {
          Utils.nextTick(function () {
            ss.modal.destroy();
            delete ss.modal;
          });
        });
        ss.modal.close();
      }
      return ss;
    };

    SmartSelect.prototype.init = function init () {
      var ss = this;
      ss.attachEvents();
      ss.setValue();
    };

    SmartSelect.prototype.destroy = function destroy () {
      var ss = this;
      ss.emit('local::beforeDestroy smartSelectBeforeDestroy', ss);
      ss.$el.trigger('smartselect:beforedestroy', ss);
      ss.detachEvents();
      delete ss.$el[0].f7SmartSelect;
      Utils.deleteProps(ss);
      ss.destroyed = true;
    };

    return SmartSelect;
  }(Framework7Class));

  var SmartSelect$1 = {
    name: 'smartSelect',
    params: {
      smartSelect: {
        el: undefined,
        valueEl: undefined,
        openIn: 'page', // or 'popup' or 'sheet' or 'popover'
        pageTitle: undefined,
        pageBackLinkText: 'Back',
        popupCloseLinkText: 'Close',
        sheetCloseLinkText: 'Done',
        searchbar: false,
        searchbarPlaceholder: 'Search',
        searchbarDisableText: 'Cancel',
        closeOnSelect: false,
        virtualList: false,
        virtualListHeight: undefined,
        formColorTheme: undefined,
        navbarColorTheme: undefined,
        routableModals: true,
        url: 'select/',
        cssClass: '',
        /*
          Custom render functions
        */
        renderPage: undefined,
        renderPopup: undefined,
        renderSheet: undefined,
        renderPopover: undefined,
        renderItems: undefined,
        renderItem: undefined,
        renderSearchbar: undefined,
      },
    },
    static: {
      SmartSelect: SmartSelect,
    },
    create: function create() {
      var app = this;
      app.smartSelect = Utils.extend(
        ConstructorMethods({
          defaultSelector: '.smart-select',
          constructor: SmartSelect,
          app: app,
          domProp: 'f7SmartSelect',
        }),
        {
          open: function open(smartSelectEl) {
            var ss = app.smartSelect.get(smartSelectEl);
            if (ss && ss.open) { return ss.open(); }
            return undefined;
          },
          close: function close(smartSelectEl) {
            var ss = app.smartSelect.get(smartSelectEl);
            if (ss && ss.close) { return ss.close(); }
            return undefined;
          },
        }
      );
    },

    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.smart-select-init').each(function (index, smartSelectEl) {
          app.smartSelect.create(Utils.extend({ el: smartSelectEl }, $(smartSelectEl).dataset()));
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $(tabEl).find('.smart-select-init').each(function (index, smartSelectEl) {
          if (smartSelectEl.f7SmartSelect && smartSelectEl.f7SmartSelect.destroy) {
            smartSelectEl.f7SmartSelect.destroy();
          }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.smart-select-init').each(function (index, smartSelectEl) {
          app.smartSelect.create(Utils.extend({ el: smartSelectEl }, $(smartSelectEl).dataset()));
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        page.$el.find('.smart-select-init').each(function (index, smartSelectEl) {
          if (smartSelectEl.f7SmartSelect && smartSelectEl.f7SmartSelect.destroy) {
            smartSelectEl.f7SmartSelect.destroy();
          }
        });
      },
    },
    clicks: {
      '.smart-select': function open($clickedEl, data) {
        var app = this;
        if (!$clickedEl[0].f7SmartSelect) {
          var ss = app.smartSelect.create(Utils.extend({ el: $clickedEl }, data));
          ss.open();
        }
      },
    },
    vnode: {
      'smart-select-init': {
        insert: function insert(vnode) {
          var app = this;
          var smartSelectEl = vnode.elm;
          app.smartSelect.create(Utils.extend({ el: smartSelectEl }, $(smartSelectEl).dataset()));
        },
        destroy: function destroy(vnode) {
          var smartSelectEl = vnode.elm;
          if (smartSelectEl.f7SmartSelect && smartSelectEl.f7SmartSelect.destroy) {
            smartSelectEl.f7SmartSelect.destroy();
          }
        },
      },
    },
  };

  var Grid = {
    name: 'grid',
  };

  /*
  Converts a Gregorian date to Jalaali.
  */
  function toJalaali (gy, gm, gd) {
    if (Object.prototype.toString.call(gy) === '[object Date]') {
      gd = gy.getDate();
      gm = gy.getMonth() + 1;
      gy = gy.getFullYear();
    }
    return d2j(g2d(gy, gm, gd))
  }

  /*
  Converts a Jalaali date to Gregorian.
  */
  function toGregorian (jy, jm, jd) {
    return d2g(j2d(jy, jm, jd))
  }

  // /*
  // Checks whether a Jalaali date is valid or not.
  // */
  // function isValidJalaaliDate (jy, jm, jd) {
  //   return jy >= -61 && jy <= 3177 &&
  //         jm >= 1 && jm <= 12 &&
  //         jd >= 1 && jd <= monthLength(jy, jm)
  // }

  /*
  Is this a leap year or not?
  */
  function isLeapJalaaliYear (jy) {
    return jalCal(jy).leap === 0
  }

  /*
  Number of days in a given month in a Jalaali year.
  */
  function monthLength (jy, jm) {
    if (jm <= 6) { return 31 }
    if (jm <= 11) { return 30 }
    if (isLeapJalaaliYear(jy)) { return 30 }
    return 29
  }

  /*
  This function determines if the Jalaali (Persian) year is
  leap (366-day long) or is the common year (365 days), and
  finds the day in March (Gregorian calendar) of the first
  day of the Jalaali year (jy).
  @param jy Jalaali calendar year (-61 to 3177)
  @return
    leap: number of years since the last leap year (0 to 4)
    gy: Gregorian year of the beginning of Jalaali year
    march: the March day of Farvardin the 1st (1st day of jy)
  @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
  @see: http://www.fourmilab.ch/documents/calendar/
  */
  function jalCal (jy) {
  // Jalaali years starting the 33-year rule.
    var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    var bl = breaks.length;
    var gy = jy + 621;
    var leapJ = -14;
    var jp = breaks[0];
    var jm;
    var jump;
    var leap;
    var leapG;
    var march;
    var n;
    var i;

    if (jy < jp || jy >= breaks[bl - 1]) { throw new Error('Invalid Jalaali year ' + jy) }

    // Find the limiting years for the Jalaali year jy.
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) { break }
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;

    // Find the number of leap years from AD 621 to the beginning
    // of the current Jalaali year in the Persian calendar.
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) { leapJ += 1; }

    // And the same in the Gregorian calendar (until the year gy).
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;

    // Determine the Gregorian date of Farvardin the 1st.
    march = 20 + leapJ - leapG;

    // Find how many years have passed since the last leap year.
    if (jump - n < 6) { n = n - jump + div(jump + 4, 33) * 33; }
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) {
      leap = 4;
    }

    return { leap: leap,
      gy: gy,
      march: march
    }
  }

  /*
  Converts a date of the Jalaali calendar to the Julian Day number.
  @param jy Jalaali year (1 to 3100)
  @param jm Jalaali month (1 to 12)
  @param jd Jalaali day (1 to 29/31)
  @return Julian Day number
  */
  function j2d (jy, jm, jd) {
    var r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  }

  /*
  Converts the Julian Day number to a date in the Jalaali calendar.
  @param jdn Julian Day number
  @return
    jy: Jalaali year (1 to 3100)
    jm: Jalaali month (1 to 12)
    jd: Jalaali day (1 to 29/31)
  */
  function d2j (jdn) {
    var gy = d2g(jdn).gy; // Calculate Gregorian year (gy).
    var jy = gy - 621;
    var r = jalCal(jy);
    var jdn1f = g2d(gy, 3, r.march);
    var jd;
    var jm;
    var k;

    // Find number of days that passed since 1 Farvardin.
    k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) {
      // The first 6 months.
        jm = 1 + div(k, 31);
        jd = mod(k, 31) + 1;
        return { jy: jy,
          jm: jm,
          jd: jd
        }
      } else {
      // The remaining months.
        k -= 186;
      }
    } else {
    // Previous Jalaali year.
      jy -= 1;
      k += 179;
      if (r.leap === 1) { k += 1; }
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy: jy,
      jm: jm,
      jd: jd
    }
  }

  /*
  Calculates the Julian Day number from Gregorian or Julian
  calendar dates. This integer number corresponds to the noon of
  the date (i.e. 12 hours of Universal Time).
  The procedure was tested to be good since 1 March, -100100 (of both
  calendars) up to a few million years into the future.
  @param gy Calendar year (years BC numbered 0, -1, -2, ...)
  @param gm Calendar month (1 to 12)
  @param gd Calendar day of the month (1 to 28/29/30/31)
  @return Julian Day number
  */
  function g2d (gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
      div(153 * mod(gm + 9, 12) + 2, 5) +
      gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d
  }

  /*
  Calculates Gregorian and Julian calendar dates from the Julian Day number
  (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
  calendars) to some millions years ahead of the present.
  @param jdn Julian Day number
  @return
    gy: Calendar year (years BC numbered 0, -1, -2, ...)
    gm: Calendar month (1 to 12)
    gd: Calendar day of the month M (1 to 28/29/30/31)
  */
  function d2g (jdn) {
    var j,
      i,
      gd,
      gm,
      gy;
    j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = div(mod(j, 1461), 4) * 5 + 308;
    gd = div(mod(i, 153), 5) + 1;
    gm = mod(div(i, 153), 12) + 1;
    gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy,
      gm: gm,
      gd: gd
    }
  }

  /*
  Utility helper functions.
  */

  function div (a, b) {
    return ~~(a / b)
  }

  function mod (a, b) {
    return a - ~~(a / b) * b
  }

  function fixDate (y, m, d) {
    if (m > 11) {
      y += Math.floor(m / 12);
      m = m % 12;
    }
    while (m < 0) {
      y -= 1;
      m += 12;
    }
    while (d > monthLength(y, m + 1)) {
      m = m !== 11 ? m + 1 : 0;
      y = m === 0 ? y + 1 : y;
      d -= monthLength(y, m + 1);
    }
    while (d <= 0) {
      m = m !== 0 ? m - 1 : 11;
      y = m === 11 ? y - 1 : y;
      d += monthLength(y, m + 1);
    }
    return [y, m || 0, d || 1]
  }

  /*
    Copyright nainemom <nainemom@gmail.com>
    https://github.com/nainemom/idate/blob/dev/package.json
  */

  var methods = [
    'getHours',
    'getMilliseconds',
    'getMinutes',
    'getSeconds',
    'getTime',
    'getTimezoneOffset',
    'getUTCDate',
    'getUTCDay',
    'getUTCFullYear',
    'getUTCHours',
    'getUTCMilliseconds',
    'getUTCMinutes',
    'getUTCMonth',
    'getUTCSeconds',
    'now',
    'parse',
    'setHours',
    'setMilliseconds',
    'setMinutes',
    'setSeconds',
    'setTime',
    'setUTCDate',
    'setUTCFullYear',
    'setUTCHours',
    'setUTCMilliseconds',
    'setUTCMinutes',
    'setUTCMonth',
    'setUTCSeconds',
    'toDateString',
    'toISOString',
    'toJSON',
    'toLocaleDateString',
    'toLocaleTimeString',
    'toLocaleString',
    'toTimeString',
    'toUTCString',
    'UTC',
    'valueOf'
  ];

  var DAY_NAMES = ['Shanbe', 'Yekshanbe', 'Doshanbe', 'Seshanbe', 'Chaharshanbe', 'Panjshanbe', 'Jom\'e'];
  var PERSIAN_DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  var MONTH_NAMES = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];
  var PERSIAN_MONTH_NAMES = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  var PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  var IDate = (function (Date) {
    function IDate () {
      Date.call(this);

      var date;
      var args = Array.from(arguments);
      if (args.length === 0) {
        date = Date.now();
      } else if (args.length === 1) {
        date = args[0] instanceof Date ? args[0].getTime() : args[0];
      } else {
        var fixed = fixDate(
          args[0],
          args[1] || 0,
          typeof args[2] === 'undefined' ? 1 : args[2]);
        var converted$1 = toGregorian(fixed[0], fixed[1] + 1, fixed[2]);
        date = [converted$1.gy, converted$1.gm - 1, converted$1.gd].concat([args[3] || 0, args[4] || 0, args[5] || 0, args[6] || 0]);
      }

      if (Array.isArray(date)) {
        this.gdate = new (Function.prototype.bind.apply( Date, [ null ].concat( date) ));
      } else {
        this.gdate = new Date(date);
      }

      var converted = toJalaali(this.gdate.getFullYear(), this.gdate.getMonth() + 1, this.gdate.getDate());
      this.jdate = [converted.jy, converted.jm - 1, converted.jd];

      methods.forEach(function (method) {
        IDate.prototype[method] = function () {
          var ref;

          return (ref = this.gdate)[method].apply(ref, arguments)
        };
      });
    }

    if ( Date ) IDate.__proto__ = Date;
    IDate.prototype = Object.create( Date && Date.prototype );
    IDate.prototype.constructor = IDate;

    IDate.prototype.getFullYear = function getFullYear () {
      return this.jdate[0]
    };

    IDate.prototype.setFullYear = function setFullYear (value) {
      this.jdate = fixDate(value, this.jdate[1], this.jdate[2]);
      this.syncDate();
      return this.gdate.getTime()
    };

    IDate.prototype.getMonth = function getMonth () {
      return this.jdate[1]
    };

    IDate.prototype.setMonth = function setMonth (value) {
      this.jdate = fixDate(this.jdate[0], value, this.jdate[2]);
      this.syncDate();
      return this.gdate.getTime()
    };

    IDate.prototype.getDate = function getDate () {
      return this.jdate[2]
    };

    IDate.prototype.setDate = function setDate (value) {
      this.jdate = fixDate(this.jdate[0], this.jdate[1], value);
      this.syncDate();
      return this.gdate.getTime()
    };

    IDate.prototype.getDay = function getDay () {
      return (this.gdate.getDay() + 1) % 7
    };

    IDate.prototype.syncDate = function syncDate () {
      var converted = toGregorian(this.jdate[0], this.jdate[1] + 1, this.jdate[2]);
      this.gdate.setFullYear(converted.gy);
      this.gdate.setMonth(converted.gm - 1);
      this.gdate.setDate(converted.gd);
    };
    IDate.prototype.toString = function toString (persianString) {
      if ( persianString === void 0 ) persianString = true;

      var replaceNums = function (str) {
        return str.replace(/./g, function (c) { return PERSIAN_NUMBERS[c] || c; })
      };
      var padNumber = function (num) { return num.toString().length === 1 ? ("0" + num) : num.toString(); };
      var time = (padNumber(this.getHours())) + ":" + (padNumber(this.getMinutes())) + ":" + (padNumber(this.getSeconds()));
      if (persianString) {
        return replaceNums(((PERSIAN_DAY_NAMES[this.getDay()]) + " " + (this.getDate()) + " " + (PERSIAN_MONTH_NAMES[this.getMonth()]) + " " + (this.getFullYear()) + " ساعت " + time))
      }
      return ((DAY_NAMES[this.getDay()]) + " " + (this.getDate()) + " " + (MONTH_NAMES[this.getMonth()]) + " " + (this.getFullYear()) + " " + time)
    };

    return IDate;
  }(Date));

  var Calendar = (function (Framework7Class$$1) {
    function Calendar(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var calendar = this;

      calendar.params = Utils.extend({}, app.params.calendar, params);

      if (calendar.params.calendarType === 'jalali') {
        Object.keys(calendar.params.jalali).forEach(function (param) {
          if (!params[param]) {
            calendar.params[param] = calendar.params.jalali[param];
          }
        });
      }

      if (calendar.params.calendarType === 'jalali') {
        calendar.DateHandleClass = IDate;
      } else {
        calendar.DateHandleClass = Date;
      }

      var $containerEl;
      if (calendar.params.containerEl) {
        $containerEl = $(calendar.params.containerEl);
        if ($containerEl.length === 0) { return calendar; }
      }

      var $inputEl;
      if (calendar.params.inputEl) {
        $inputEl = $(calendar.params.inputEl);
      }

      var view;
      if ($inputEl) {
        view = $inputEl.parents('.view').length && $inputEl.parents('.view')[0].f7View;
      }
      if (!view) { view = app.views.main; }

      var isHorizontal = calendar.params.direction === 'horizontal';

      var inverter = 1;
      if (isHorizontal) {
        inverter = app.rtl ? -1 : 1;
      }

      Utils.extend(calendar, {
        app: app,
        $containerEl: $containerEl,
        containerEl: $containerEl && $containerEl[0],
        inline: $containerEl && $containerEl.length > 0,
        $inputEl: $inputEl,
        inputEl: $inputEl && $inputEl[0],
        initialized: false,
        opened: false,
        url: calendar.params.url,
        isHorizontal: isHorizontal,
        inverter: inverter,
        view: view,
        animating: false,
      });

      function onInputClick() {
        calendar.open();
      }
      function onInputFocus(e) {
        e.preventDefault();
      }
      function onHtmlClick(e) {
        var $targetEl = $(e.target);
        if (calendar.isPopover()) { return; }
        if (!calendar.opened || calendar.closing) { return; }
        if ($targetEl.closest('[class*="backdrop"]').length) { return; }
        if ($inputEl && $inputEl.length > 0) {
          if ($targetEl[0] !== $inputEl[0] && $targetEl.closest('.sheet-modal, .calendar-modal').length === 0) {
            calendar.close();
          }
        } else if ($(e.target).closest('.sheet-modal, .calendar-modal').length === 0) {
          calendar.close();
        }
      }

      // Events
      Utils.extend(calendar, {
        attachInputEvents: function attachInputEvents() {
          calendar.$inputEl.on('click', onInputClick);
          if (calendar.params.inputReadOnly) {
            calendar.$inputEl.on('focus mousedown', onInputFocus);
          }
        },
        detachInputEvents: function detachInputEvents() {
          calendar.$inputEl.off('click', onInputClick);
          if (calendar.params.inputReadOnly) {
            calendar.$inputEl.off('focus mousedown', onInputFocus);
          }
        },
        attachHtmlEvents: function attachHtmlEvents() {
          app.on('click', onHtmlClick);
        },
        detachHtmlEvents: function detachHtmlEvents() {
          app.off('click', onHtmlClick);
        },
      });
      calendar.attachCalendarEvents = function attachCalendarEvents() {
        var allowItemClick = true;
        var isTouched;
        var isMoved;
        var touchStartX;
        var touchStartY;
        var touchCurrentX;
        var touchCurrentY;
        var touchStartTime;
        var touchEndTime;
        var currentTranslate;
        var wrapperWidth;
        var wrapperHeight;
        var percentage;
        var touchesDiff;
        var isScrolling;

        var $el = calendar.$el;
        var $wrapperEl = calendar.$wrapperEl;

        function handleTouchStart(e) {
          if (isMoved || isTouched) { return; }
          isTouched = true;
          touchStartX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
          touchCurrentX = touchStartX;
          touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
          touchCurrentY = touchStartY;
          touchStartTime = (new calendar.DateHandleClass()).getTime();
          percentage = 0;
          allowItemClick = true;
          isScrolling = undefined;
          currentTranslate = calendar.monthsTranslate;
        }
        function handleTouchMove(e) {
          if (!isTouched) { return; }
          var isH = calendar.isHorizontal;

          touchCurrentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
          touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
          if (typeof isScrolling === 'undefined') {
            isScrolling = !!(isScrolling || Math.abs(touchCurrentY - touchStartY) > Math.abs(touchCurrentX - touchStartX));
          }
          if (isH && isScrolling) {
            isTouched = false;
            return;
          }
          e.preventDefault();
          if (calendar.animating) {
            isTouched = false;
            return;
          }
          allowItemClick = false;
          if (!isMoved) {
            // First move
            isMoved = true;
            wrapperWidth = $wrapperEl[0].offsetWidth;
            wrapperHeight = $wrapperEl[0].offsetHeight;
            $wrapperEl.transition(0);
          }

          touchesDiff = isH ? touchCurrentX - touchStartX : touchCurrentY - touchStartY;
          percentage = touchesDiff / (isH ? wrapperWidth : wrapperHeight);
          currentTranslate = ((calendar.monthsTranslate * calendar.inverter) + percentage) * 100;

          // Transform wrapper
          $wrapperEl.transform(("translate3d(" + (isH ? currentTranslate : 0) + "%, " + (isH ? 0 : currentTranslate) + "%, 0)"));
        }
        function handleTouchEnd() {
          if (!isTouched || !isMoved) {
            isTouched = false;
            isMoved = false;
            return;
          }
          isTouched = false;
          isMoved = false;

          touchEndTime = new calendar.DateHandleClass().getTime();
          if (touchEndTime - touchStartTime < 300) {
            if (Math.abs(touchesDiff) < 10) {
              calendar.resetMonth();
            } else if (touchesDiff >= 10) {
              if (app.rtl) { calendar.nextMonth(); }
              else { calendar.prevMonth(); }
            } else if (app.rtl) { calendar.prevMonth(); }
            else { calendar.nextMonth(); }
          } else if (percentage <= -0.5) {
            if (app.rtl) { calendar.prevMonth(); }
            else { calendar.nextMonth(); }
          } else if (percentage >= 0.5) {
            if (app.rtl) { calendar.nextMonth(); }
            else { calendar.prevMonth(); }
          } else {
            calendar.resetMonth();
          }

          // Allow click
          setTimeout(function () {
            allowItemClick = true;
          }, 100);
        }

        function handleDayClick(e) {
          if (!allowItemClick) { return; }
          var $dayEl = $(e.target).parents('.calendar-day');
          if ($dayEl.length === 0 && $(e.target).hasClass('calendar-day')) {
            $dayEl = $(e.target);
          }
          if ($dayEl.length === 0) { return; }
          if ($dayEl.hasClass('calendar-day-disabled')) { return; }
          if (!calendar.params.rangePicker) {
            if ($dayEl.hasClass('calendar-day-next')) { calendar.nextMonth(); }
            if ($dayEl.hasClass('calendar-day-prev')) { calendar.prevMonth(); }
          }
          var dateYear = parseInt($dayEl.attr('data-year'), 10);
          var dateMonth = parseInt($dayEl.attr('data-month'), 10);
          var dateDay = parseInt($dayEl.attr('data-day'), 10);
          calendar.emit(
            'local::dayClick calendarDayClick',
            calendar,
            $dayEl[0],
            dateYear,
            dateMonth,
            dateDay
          );
          if (!$dayEl.hasClass('calendar-day-selected') || calendar.params.multiple || calendar.params.rangePicker) {
            calendar.addValue(new calendar.DateHandleClass(dateYear, dateMonth, dateDay, 0, 0, 0));
          }
          if (calendar.params.closeOnSelect) {
            if (
              (calendar.params.rangePicker && calendar.value.length === 2)
              || !calendar.params.rangePicker
            ) {
              calendar.close();
            }
          }
        }

        function onNextMonthClick() {
          calendar.nextMonth();
        }

        function onPrevMonthClick() {
          calendar.prevMonth();
        }

        function onNextYearClick() {
          calendar.nextYear();
        }

        function onPrevYearClick() {
          calendar.prevYear();
        }

        var passiveListener = app.touchEvents.start === 'touchstart' && app.support.passiveListener ? { passive: true, capture: false } : false;
        // Selectors clicks
        $el.find('.calendar-prev-month-button').on('click', onPrevMonthClick);
        $el.find('.calendar-next-month-button').on('click', onNextMonthClick);
        $el.find('.calendar-prev-year-button').on('click', onPrevYearClick);
        $el.find('.calendar-next-year-button').on('click', onNextYearClick);
        // Day clicks
        $wrapperEl.on('click', handleDayClick);
        // Touch events
        {
          if (calendar.params.touchMove) {
            $wrapperEl.on(app.touchEvents.start, handleTouchStart, passiveListener);
            app.on('touchmove:active', handleTouchMove);
            app.on('touchend:passive', handleTouchEnd);
          }
        }

        calendar.detachCalendarEvents = function detachCalendarEvents() {
          $el.find('.calendar-prev-month-button').off('click', onPrevMonthClick);
          $el.find('.calendar-next-month-button').off('click', onNextMonthClick);
          $el.find('.calendar-prev-year-button').off('click', onPrevYearClick);
          $el.find('.calendar-next-year-button').off('click', onNextYearClick);
          $wrapperEl.off('click', handleDayClick);
          {
            if (calendar.params.touchMove) {
              $wrapperEl.off(app.touchEvents.start, handleTouchStart, passiveListener);
              app.off('touchmove:active', handleTouchMove);
              app.off('touchend:passive', handleTouchEnd);
            }
          }
        };
      };

      calendar.init();

      return calendar;
    }

    if ( Framework7Class$$1 ) Calendar.__proto__ = Framework7Class$$1;
    Calendar.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Calendar.prototype.constructor = Calendar;
    // eslint-disable-next-line
    Calendar.prototype.normalizeDate = function normalizeDate (date) {
      var calendar = this;
      var d = new calendar.DateHandleClass(date);
      return new calendar.DateHandleClass(d.getFullYear(), d.getMonth(), d.getDate());
    };

    Calendar.prototype.normalizeValues = function normalizeValues (values) {
      var calendar = this;
      var newValues = [];
      if (values && Array.isArray(values)) {
        newValues = values.map(function (val) { return calendar.normalizeDate(val); });
      }
      return newValues;
    };

    Calendar.prototype.initInput = function initInput () {
      var calendar = this;
      if (!calendar.$inputEl) { return; }
      if (calendar.params.inputReadOnly) { calendar.$inputEl.prop('readOnly', true); }
    };

    Calendar.prototype.isPopover = function isPopover () {
      var calendar = this;
      var app = calendar.app;
      var modal = calendar.modal;
      var params = calendar.params;
      if (params.openIn === 'sheet') { return false; }
      if (modal && modal.type !== 'popover') { return false; }

      if (!calendar.inline && calendar.inputEl) {
        if (params.openIn === 'popover') { return true; }
        if (app.device.ios) {
          return !!app.device.ipad;
        }
        if (app.width >= 768) {
          return true;
        }
      }
      return false;
    };

    Calendar.prototype.formatDate = function formatDate (d) {
      var calendar = this;
      var date = new calendar.DateHandleClass(d);
      var year = date.getFullYear();
      var month = date.getMonth();
      var month1 = month + 1;
      var day = date.getDate();
      var weekDay = date.getDay();
      var ref = calendar.params;
      var dateFormat = ref.dateFormat;
      var monthNames = ref.monthNames;
      var monthNamesShort = ref.monthNamesShort;
      var dayNames = ref.dayNames;
      var dayNamesShort = ref.dayNamesShort;

      return dateFormat
        .replace(/yyyy/g, year)
        .replace(/yy/g, String(year).substring(2))
        .replace(/mm/g, month1 < 10 ? ("0" + month1) : month1)
        .replace(/m(\W+)/g, (month1 + "$1"))
        .replace(/MM/g, monthNames[month])
        .replace(/M(\W+)/g, ((monthNamesShort[month]) + "$1"))
        .replace(/dd/g, day < 10 ? ("0" + day) : day)
        .replace(/d(\W+)/g, (day + "$1"))
        .replace(/DD/g, dayNames[weekDay])
        .replace(/D(\W+)/g, ((dayNamesShort[weekDay]) + "$1"));
    };

    Calendar.prototype.formatValue = function formatValue () {
      var calendar = this;
      var value = calendar.value;
      if (calendar.params.formatValue) {
        return calendar.params.formatValue.call(calendar, value);
      }
      return value
        .map(function (v) { return calendar.formatDate(v); })
        .join(calendar.params.rangePicker ? ' - ' : ', ');
    };

    Calendar.prototype.addValue = function addValue (newValue) {
      var calendar = this;
      var ref = calendar.params;
      var multiple = ref.multiple;
      var rangePicker = ref.rangePicker;
      var rangePickerMinDays = ref.rangePickerMinDays;
      var rangePickerMaxDays = ref.rangePickerMaxDays;
      if (multiple) {
        if (!calendar.value) { calendar.value = []; }
        var inValuesIndex;
        for (var i = 0; i < calendar.value.length; i += 1) {
          if (new calendar.DateHandleClass(newValue).getTime() === new calendar.DateHandleClass(calendar.value[i]).getTime()) {
            inValuesIndex = i;
          }
        }
        if (typeof inValuesIndex === 'undefined') {
          calendar.value.push(newValue);
        } else {
          calendar.value.splice(inValuesIndex, 1);
        }
        calendar.updateValue();
      } else if (rangePicker) {
        if (!calendar.value) { calendar.value = []; }
        if (calendar.value.length === 2 || calendar.value.length === 0) {
          calendar.value = [];
        }

        if ((calendar.value.length === 0
          || ((Math.abs(calendar.value[0].getTime() - newValue.getTime()) >= (rangePickerMinDays - 1) * 60 * 60 * 24 * 1000) && (rangePickerMaxDays === 0 || Math.abs(calendar.value[0].getTime() - newValue.getTime()) <= (rangePickerMaxDays - 1) * 60 * 60 * 24 * 1000)))) { calendar.value.push(newValue); }
        else { calendar.value = []; }

        calendar.value.sort(function (a, b) { return a - b; });
        calendar.updateValue();
      } else {
        calendar.value = [newValue];
        calendar.updateValue();
      }
    };

    Calendar.prototype.setValue = function setValue (values) {
      var calendar = this;
      calendar.value = values;
      calendar.updateValue();
    };

    Calendar.prototype.getValue = function getValue () {
      var calendar = this;
      return calendar.value;
    };

    Calendar.prototype.updateValue = function updateValue (onlyHeader) {
      var calendar = this;
      var $el = calendar.$el;
      var $wrapperEl = calendar.$wrapperEl;
      var $inputEl = calendar.$inputEl;
      var value = calendar.value;
      var params = calendar.params;
      var i;
      if ($el && $el.length > 0) {
        $wrapperEl.find('.calendar-day-selected').removeClass('calendar-day-selected');
        var valueDate;
        if (params.rangePicker && value.length === 2) {
          for (i = new calendar.DateHandleClass(value[0]).getTime(); i <= new calendar.DateHandleClass(value[1]).getTime(); i += 24 * 60 * 60 * 1000) {
            valueDate = new calendar.DateHandleClass(i);
            $wrapperEl.find((".calendar-day[data-date=\"" + (valueDate.getFullYear()) + "-" + (valueDate.getMonth()) + "-" + (valueDate.getDate()) + "\"]")).addClass('calendar-day-selected');
          }
        } else {
          for (i = 0; i < calendar.value.length; i += 1) {
            valueDate = new calendar.DateHandleClass(value[i]);
            $wrapperEl.find((".calendar-day[data-date=\"" + (valueDate.getFullYear()) + "-" + (valueDate.getMonth()) + "-" + (valueDate.getDate()) + "\"]")).addClass('calendar-day-selected');
          }
        }
      }
      if (!onlyHeader) {
        calendar.emit('local::change calendarChange', calendar, value);
      }


      if (($inputEl && $inputEl.length) || params.header) {
        var inputValue = calendar.formatValue(value);
        if (params.header && $el && $el.length) {
          $el.find('.calendar-selected-date').text(inputValue);
        }
        if ($inputEl && $inputEl.length && !onlyHeader) {
          $inputEl.val(inputValue);
          $inputEl.trigger('change');
        }
      }
    };

    Calendar.prototype.updateCurrentMonthYear = function updateCurrentMonthYear (dir) {
      var calendar = this;
      var $months = calendar.$months;
      var $el = calendar.$el;
      var params = calendar.params;
      if (typeof dir === 'undefined') {
        calendar.currentMonth = parseInt($months.eq(1).attr('data-month'), 10);
        calendar.currentYear = parseInt($months.eq(1).attr('data-year'), 10);
      } else {
        calendar.currentMonth = parseInt($months.eq(dir === 'next' ? ($months.length - 1) : 0).attr('data-month'), 10);
        calendar.currentYear = parseInt($months.eq(dir === 'next' ? ($months.length - 1) : 0).attr('data-year'), 10);
      }
      $el.find('.current-month-value').text(params.monthNames[calendar.currentMonth]);
      $el.find('.current-year-value').text(calendar.currentYear);
    };

    Calendar.prototype.update = function update () {
      var calendar = this;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      var $wrapperEl = calendar.$wrapperEl;
      var currentDate = new calendar.DateHandleClass(currentYear, currentMonth);
      var prevMonthHtml = calendar.renderMonth(currentDate, 'prev');
      var currentMonthHtml = calendar.renderMonth(currentDate);
      var nextMonthHtml = calendar.renderMonth(currentDate, 'next');

      $wrapperEl
        .transition(0)
        .html(("" + prevMonthHtml + currentMonthHtml + nextMonthHtml))
        .transform('translate3d(0,0,0)');
      calendar.$months = $wrapperEl.find('.calendar-month');
      calendar.monthsTranslate = 0;
      calendar.setMonthsTranslate();
      calendar.$months.each(function (index, monthEl) {
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          monthEl
        );
      });
    };

    Calendar.prototype.onMonthChangeStart = function onMonthChangeStart (dir) {
      var calendar = this;
      var $months = calendar.$months;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      calendar.updateCurrentMonthYear(dir);
      $months.removeClass('calendar-month-current calendar-month-prev calendar-month-next');
      var currentIndex = dir === 'next' ? $months.length - 1 : 0;

      $months.eq(currentIndex).addClass('calendar-month-current');
      $months.eq(dir === 'next' ? currentIndex - 1 : currentIndex + 1).addClass(dir === 'next' ? 'calendar-month-prev' : 'calendar-month-next');

      calendar.emit(
        'local::monthYearChangeStart calendarMonthYearChangeStart',
        calendar,
        currentYear,
        currentMonth
      );
    };

    Calendar.prototype.onMonthChangeEnd = function onMonthChangeEnd (dir, rebuildBoth) {
      var calendar = this;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      var $wrapperEl = calendar.$wrapperEl;
      var monthsTranslate = calendar.monthsTranslate;
      calendar.animating = false;
      var nextMonthHtml;
      var prevMonthHtml;
      var currentMonthHtml;
      $wrapperEl
        .find('.calendar-month:not(.calendar-month-prev):not(.calendar-month-current):not(.calendar-month-next)')
        .remove();

      if (typeof dir === 'undefined') {
        dir = 'next'; // eslint-disable-line
        rebuildBoth = true; // eslint-disable-line
      }
      if (!rebuildBoth) {
        currentMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), dir);
      } else {
        $wrapperEl.find('.calendar-month-next, .calendar-month-prev').remove();
        prevMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), 'prev');
        nextMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), 'next');
      }
      if (dir === 'next' || rebuildBoth) {
        $wrapperEl.append(currentMonthHtml || nextMonthHtml);
      }
      if (dir === 'prev' || rebuildBoth) {
        $wrapperEl.prepend(currentMonthHtml || prevMonthHtml);
      }
      var $months = $wrapperEl.find('.calendar-month');
      calendar.$months = $months;
      calendar.setMonthsTranslate(monthsTranslate);
      calendar.emit(
        'local::monthAdd calendarMonthAdd',
        calendar,
        dir === 'next' ? $months.eq($months.length - 1)[0] : $months.eq(0)[0]
      );
      calendar.emit(
        'local::monthYearChangeEnd calendarMonthYearChangeEnd',
        calendar,
        currentYear,
        currentMonth
      );
    };

    Calendar.prototype.setMonthsTranslate = function setMonthsTranslate (translate) {
      var calendar = this;
      var $months = calendar.$months;
      var isH = calendar.isHorizontal;
      var inverter = calendar.inverter;
      // eslint-disable-next-line
      translate = translate || calendar.monthsTranslate || 0;
      if (typeof calendar.monthsTranslate === 'undefined') {
        calendar.monthsTranslate = translate;
      }
      $months.removeClass('calendar-month-current calendar-month-prev calendar-month-next');
      var prevMonthTranslate = -(translate + 1) * 100 * inverter;
      var currentMonthTranslate = -translate * 100 * inverter;
      var nextMonthTranslate = -(translate - 1) * 100 * inverter;
      $months.eq(0)
        .transform(("translate3d(" + (isH ? prevMonthTranslate : 0) + "%, " + (isH ? 0 : prevMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-prev');
      $months.eq(1)
        .transform(("translate3d(" + (isH ? currentMonthTranslate : 0) + "%, " + (isH ? 0 : currentMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-current');
      $months.eq(2)
        .transform(("translate3d(" + (isH ? nextMonthTranslate : 0) + "%, " + (isH ? 0 : nextMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-next');
    };

    Calendar.prototype.nextMonth = function nextMonth (transition) {
      var calendar = this;
      var params = calendar.params;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        transition = ''; // eslint-disable-line
        if (!params.animate) { transition = 0; } // eslint-disable-line
      }
      var nextMonth = parseInt(calendar.$months.eq(calendar.$months.length - 1).attr('data-month'), 10);
      var nextYear = parseInt(calendar.$months.eq(calendar.$months.length - 1).attr('data-year'), 10);
      var nextDate = new calendar.DateHandleClass(nextYear, nextMonth);
      var nextDateTime = nextDate.getTime();
      var transitionEndCallback = !calendar.animating;
      if (params.maxDate) {
        if (nextDateTime > new calendar.DateHandleClass(params.maxDate).getTime()) {
          calendar.resetMonth();
          return;
        }
      }
      calendar.monthsTranslate -= 1;
      if (nextMonth === calendar.currentMonth) {
        var nextMonthTranslate = -(calendar.monthsTranslate) * 100 * inverter;
        var nextMonthHtml = $(calendar.renderMonth(nextDateTime, 'next'))
          .transform(("translate3d(" + (isH ? nextMonthTranslate : 0) + "%, " + (isH ? 0 : nextMonthTranslate) + "%, 0)"))
          .addClass('calendar-month-next');
        $wrapperEl.append(nextMonthHtml[0]);
        calendar.$months = $wrapperEl.find('.calendar-month');
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          calendar.$months.eq(calendar.$months.length - 1)[0]
        );
      }
      calendar.animating = true;
      calendar.onMonthChangeStart('next');
      var translate = (calendar.monthsTranslate * 100) * inverter;

      $wrapperEl.transition(transition).transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd('next');
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd('next');
      }
    };

    Calendar.prototype.prevMonth = function prevMonth (transition) {
      var calendar = this;
      var params = calendar.params;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        transition = ''; // eslint-disable-line
        if (!params.animate) { transition = 0; } // eslint-disable-line
      }
      var prevMonth = parseInt(calendar.$months.eq(0).attr('data-month'), 10);
      var prevYear = parseInt(calendar.$months.eq(0).attr('data-year'), 10);
      var prevDate = new calendar.DateHandleClass(prevYear, prevMonth + 1, -1);
      var prevDateTime = prevDate.getTime();
      var transitionEndCallback = !calendar.animating;
      if (params.minDate) {
        var minDate = new calendar.DateHandleClass(params.minDate);
        minDate = new calendar.DateHandleClass(minDate.getFullYear(), minDate.getMonth(), 1);
        if (prevDateTime < minDate.getTime()) {
          calendar.resetMonth();
          return;
        }
      }
      calendar.monthsTranslate += 1;
      if (prevMonth === calendar.currentMonth) {
        var prevMonthTranslate = -(calendar.monthsTranslate) * 100 * inverter;
        var prevMonthHtml = $(calendar.renderMonth(prevDateTime, 'prev'))
          .transform(("translate3d(" + (isH ? prevMonthTranslate : 0) + "%, " + (isH ? 0 : prevMonthTranslate) + "%, 0)"))
          .addClass('calendar-month-prev');
        $wrapperEl.prepend(prevMonthHtml[0]);
        calendar.$months = $wrapperEl.find('.calendar-month');
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          calendar.$months.eq(0)[0]
        );
      }
      calendar.animating = true;
      calendar.onMonthChangeStart('prev');
      var translate = (calendar.monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd('prev');
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd('prev');
      }
    };

    Calendar.prototype.resetMonth = function resetMonth (transition) {
      if ( transition === void 0 ) transition = '';

      var calendar = this;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      var monthsTranslate = calendar.monthsTranslate;
      var translate = (monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
    };
    // eslint-disable-next-line
    Calendar.prototype.setYearMonth = function setYearMonth (year, month, transition) {
      var calendar = this;
      var params = calendar.params;
      var isH = calendar.isHorizontal;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      // eslint-disable-next-line
      if (typeof year === 'undefined') { year = calendar.currentYear; }
      // eslint-disable-next-line
      if (typeof month === 'undefined') { month = calendar.currentMonth; }
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        // eslint-disable-next-line
        transition = '';
        // eslint-disable-next-line
        if (!params.animate) { transition = 0; }
      }
      var targetDate;
      if (year < calendar.currentYear) {
        targetDate = new calendar.DateHandleClass(year, month + 1, -1).getTime();
      } else {
        targetDate = new calendar.DateHandleClass(year, month).getTime();
      }
      if (params.maxDate && targetDate > new calendar.DateHandleClass(params.maxDate).getTime()) {
        return false;
      }
      if (params.minDate) {
        var minDate = new calendar.DateHandleClass(params.minDate);
        minDate = new calendar.DateHandleClass(minDate.getFullYear(), minDate.getMonth(), 1);
        if (targetDate < minDate.getTime()) {
          return false;
        }
      }
      var currentDate = new calendar.DateHandleClass(calendar.currentYear, calendar.currentMonth).getTime();
      var dir = targetDate > currentDate ? 'next' : 'prev';
      var newMonthHTML = calendar.renderMonth(new calendar.DateHandleClass(year, month));
      calendar.monthsTranslate = calendar.monthsTranslate || 0;
      var prevTranslate = calendar.monthsTranslate;
      var monthTranslate;
      var transitionEndCallback = !calendar.animating;
      if (targetDate > currentDate) {
        // To next
        calendar.monthsTranslate -= 1;
        if (!calendar.animating) { calendar.$months.eq(calendar.$months.length - 1).remove(); }
        $wrapperEl.append(newMonthHTML);
        calendar.$months = $wrapperEl.find('.calendar-month');
        monthTranslate = -(prevTranslate - 1) * 100 * inverter;
        calendar.$months
          .eq(calendar.$months.length - 1)
          .transform(("translate3d(" + (isH ? monthTranslate : 0) + "%, " + (isH ? 0 : monthTranslate) + "%, 0)"))
          .addClass('calendar-month-next');
      } else {
        // To prev
        calendar.monthsTranslate += 1;
        if (!calendar.animating) { calendar.$months.eq(0).remove(); }
        $wrapperEl.prepend(newMonthHTML);
        calendar.$months = $wrapperEl.find('.calendar-month');
        monthTranslate = -(prevTranslate + 1) * 100 * inverter;
        calendar.$months
          .eq(0)
          .transform(("translate3d(" + (isH ? monthTranslate : 0) + "%, " + (isH ? 0 : monthTranslate) + "%, 0)"))
          .addClass('calendar-month-prev');
      }
      calendar.emit(
        'local::monthAdd calendarMonthAdd',
        dir === 'next'
          ? calendar.$months.eq(calendar.$months.length - 1)[0]
          : calendar.$months.eq(0)[0]
      );

      calendar.animating = true;
      calendar.onMonthChangeStart(dir);
      var wrapperTranslate = (calendar.monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? wrapperTranslate : 0) + "%, " + (isH ? 0 : wrapperTranslate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd(dir, true);
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd(dir);
      }
    };

    Calendar.prototype.nextYear = function nextYear () {
      var calendar = this;
      calendar.setYearMonth(calendar.currentYear + 1);
    };

    Calendar.prototype.prevYear = function prevYear () {
      var calendar = this;
      calendar.setYearMonth(calendar.currentYear - 1);
    };
    // eslint-disable-next-line
    Calendar.prototype.dateInRange = function dateInRange (dayDate, range) {
      var calendar = this;
      var match = false;
      var i;
      if (!range) { return false; }
      if (Array.isArray(range)) {
        for (i = 0; i < range.length; i += 1) {
          if (range[i].from || range[i].to) {
            if (range[i].from && range[i].to) {
              if ((dayDate <= new calendar.DateHandleClass(range[i].to).getTime()) && (dayDate >= new calendar.DateHandleClass(range[i].from).getTime())) {
                match = true;
              }
            } else if (range[i].from) {
              if (dayDate >= new calendar.DateHandleClass(range[i].from).getTime()) {
                match = true;
              }
            } else if (range[i].to) {
              if (dayDate <= new calendar.DateHandleClass(range[i].to).getTime()) {
                match = true;
              }
            }
          } else if (range[i].date) {
            if (dayDate === new calendar.DateHandleClass(range[i].date).getTime()) {
              match = true;
            }
          } else if (dayDate === new calendar.DateHandleClass(range[i]).getTime()) {
            match = true;
          }
        }
      } else if (range.from || range.to) {
        if (range.from && range.to) {
          if ((dayDate <= new calendar.DateHandleClass(range.to).getTime()) && (dayDate >= new calendar.DateHandleClass(range.from).getTime())) {
            match = true;
          }
        } else if (range.from) {
          if (dayDate >= new calendar.DateHandleClass(range.from).getTime()) {
            match = true;
          }
        } else if (range.to) {
          if (dayDate <= new calendar.DateHandleClass(range.to).getTime()) {
            match = true;
          }
        }
      } else if (range.date) {
        match = dayDate === new calendar.DateHandleClass(range.date).getTime();
      } else if (typeof range === 'function') {
        match = range(new calendar.DateHandleClass(dayDate));
      }
      return match;
    };
    // eslint-disable-next-line
    Calendar.prototype.daysInMonth = function daysInMonth (date) {
      var calendar = this;
      var d = new calendar.DateHandleClass(date);
      return new calendar.DateHandleClass(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    };

    Calendar.prototype.renderMonths = function renderMonths (date) {
      var calendar = this;
      if (calendar.params.renderMonths) {
        return calendar.params.renderMonths.call(calendar, date);
      }
      return ("\n    <div class=\"calendar-months-wrapper\">\n    " + (calendar.renderMonth(date, 'prev')) + "\n    " + (calendar.renderMonth(date)) + "\n    " + (calendar.renderMonth(date, 'next')) + "\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderMonth = function renderMonth (d, offset) {
      var calendar = this;
      var params = calendar.params;
      var value = calendar.value;
      if (params.renderMonth) {
        return params.renderMonth.call(calendar, d, offset);
      }
      var date = new calendar.DateHandleClass(d);
      var year = date.getFullYear();
      var month = date.getMonth();

      if (offset === 'next') {
        if (month === 11) { date = new calendar.DateHandleClass(year + 1, 0); }
        else { date = new calendar.DateHandleClass(year, month + 1, 1); }
      }
      if (offset === 'prev') {
        if (month === 0) { date = new calendar.DateHandleClass(year - 1, 11); }
        else { date = new calendar.DateHandleClass(year, month - 1, 1); }
      }
      if (offset === 'next' || offset === 'prev') {
        month = date.getMonth();
        year = date.getFullYear();
      }

      var currentValues = [];
      var today = new calendar.DateHandleClass().setHours(0, 0, 0, 0);
      var minDate = params.minDate ? new calendar.DateHandleClass(params.minDate).getTime() : null;
      var maxDate = params.maxDate ? new calendar.DateHandleClass(params.maxDate).getTime() : null;
      var rows = 6;
      var cols = 7;
      var daysInPrevMonth = calendar.daysInMonth(new calendar.DateHandleClass(date.getFullYear(), date.getMonth()).getTime() - (10 * 24 * 60 * 60 * 1000));
      var daysInMonth = calendar.daysInMonth(date);
      var minDayNumber = params.firstDay === 6 ? 0 : 1;

      var monthHtml = '';
      var dayIndex = 0 + (params.firstDay - 1);
      var disabled;
      var hasEvents;
      var firstDayOfMonthIndex = new calendar.DateHandleClass(date.getFullYear(), date.getMonth()).getDay();
      if (firstDayOfMonthIndex === 0) { firstDayOfMonthIndex = 7; }

      if (value && value.length) {
        for (var i = 0; i < value.length; i += 1) {
          currentValues.push(new calendar.DateHandleClass(value[i]).setHours(0, 0, 0, 0));
        }
      }

      for (var row = 1; row <= rows; row += 1) {
        var rowHtml = '';
        var loop = function ( col ) {
          dayIndex += 1;
          var dayDate = (void 0);
          var dayNumber = dayIndex - firstDayOfMonthIndex;
          var addClass = '';
          if (row === 1 && col === 1 && dayNumber > minDayNumber && params.firstDay !== 1) {
            dayIndex -= 7;
            dayNumber = dayIndex - firstDayOfMonthIndex;
          }

          var weekDayIndex = ((col - 1) + params.firstDay > 6)
            ? ((col - 1 - 7) + params.firstDay)
            : ((col - 1) + params.firstDay);

          if (dayNumber < 0) {
            dayNumber = daysInPrevMonth + dayNumber + 1;
            addClass += ' calendar-day-prev';
            dayDate = new calendar.DateHandleClass(month - 1 < 0 ? year - 1 : year, month - 1 < 0 ? 11 : month - 1, dayNumber).getTime();
          } else {
            dayNumber += 1;
            if (dayNumber > daysInMonth) {
              dayNumber -= daysInMonth;
              addClass += ' calendar-day-next';
              dayDate = new calendar.DateHandleClass(month + 1 > 11 ? year + 1 : year, month + 1 > 11 ? 0 : month + 1, dayNumber).getTime();
            } else {
              dayDate = new calendar.DateHandleClass(year, month, dayNumber).getTime();
            }
          }
          // Today
          if (dayDate === today) { addClass += ' calendar-day-today'; }

          // Selected
          if (params.rangePicker && currentValues.length === 2) {
            if (dayDate >= currentValues[0] && dayDate <= currentValues[1]) { addClass += ' calendar-day-selected'; }
          } else if (currentValues.indexOf(dayDate) >= 0) { addClass += ' calendar-day-selected'; }
          // Weekend
          if (params.weekendDays.indexOf(weekDayIndex) >= 0) {
            addClass += ' calendar-day-weekend';
          }
          // Events
          var eventsHtml = '';
          hasEvents = false;
          if (params.events) {
            if (calendar.dateInRange(dayDate, params.events)) {
              hasEvents = true;
            }
          }
          if (hasEvents) {
            addClass += ' calendar-day-has-events';
            eventsHtml = "\n            <span class=\"calendar-day-events\">\n              <span class=\"calendar-day-event\"></span>\n            </span>\n          ";
            if (Array.isArray(params.events)) {
              var eventDots = [];
              params.events.forEach(function (ev) {
                var color = ev.color || '';
                if (eventDots.indexOf(color) < 0 && calendar.dateInRange(dayDate, ev)) {
                  eventDots.push(color);
                }
              });
              eventsHtml = "\n              <span class=\"calendar-day-events\">\n                " + (eventDots.map(function (color) { return ("\n                  <span class=\"calendar-day-event\" style=\"" + (color ? ("background-color: " + color) : '') + "\"></span>\n                ").trim(); }).join('')) + "\n              </span>\n            ";
            }
          }
          // Custom Ranges
          if (params.rangesClasses) {
            for (var k = 0; k < params.rangesClasses.length; k += 1) {
              if (calendar.dateInRange(dayDate, params.rangesClasses[k].range)) {
                addClass += " " + (params.rangesClasses[k].cssClass);
              }
            }
          }
          // Disabled
          disabled = false;
          if ((minDate && dayDate < minDate) || (maxDate && dayDate > maxDate)) {
            disabled = true;
          }
          if (params.disabled) {
            if (calendar.dateInRange(dayDate, params.disabled)) {
              disabled = true;
            }
          }
          if (disabled) {
            addClass += ' calendar-day-disabled';
          }

          dayDate = new calendar.DateHandleClass(dayDate);
          var dayYear = dayDate.getFullYear();
          var dayMonth = dayDate.getMonth();
          rowHtml += ("\n          <div data-year=\"" + dayYear + "\" data-month=\"" + dayMonth + "\" data-day=\"" + dayNumber + "\" class=\"calendar-day" + addClass + "\" data-date=\"" + dayYear + "-" + dayMonth + "-" + dayNumber + "\">\n            <span class=\"calendar-day-number\">" + dayNumber + eventsHtml + "</span>\n          </div>").trim();
        };

        for (var col = 1; col <= cols; col += 1) loop( col );
        monthHtml += "<div class=\"calendar-row\">" + rowHtml + "</div>";
      }
      monthHtml = "<div class=\"calendar-month\" data-year=\"" + year + "\" data-month=\"" + month + "\">" + monthHtml + "</div>";
      return monthHtml;
    };

    Calendar.prototype.renderWeekHeader = function renderWeekHeader () {
      var calendar = this;
      if (calendar.params.renderWeekHeader) {
        return calendar.params.renderWeekHeader.call(calendar);
      }
      var params = calendar.params;
      var weekDaysHtml = '';
      for (var i = 0; i < 7; i += 1) {
        var dayIndex = (i + params.firstDay > 6)
          ? ((i - 7) + params.firstDay)
          : (i + params.firstDay);
        var dayName = params.dayNamesShort[dayIndex];
        weekDaysHtml += "<div class=\"calendar-week-day\">" + dayName + "</div>";
      }
      return ("\n    <div class=\"calendar-week-header\">\n    " + weekDaysHtml + "\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderMonthSelector = function renderMonthSelector () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderMonthSelector) {
        return calendar.params.renderMonthSelector.call(calendar);
      }

      var needsBlackIcon;
      if (calendar.inline && calendar.$containerEl.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      } else if (app.root.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      }

      var iconColor = app.theme === 'md' && needsBlackIcon ? 'color-black' : '';
      return ("\n    <div class=\"calendar-month-selector\">\n    <a href=\"#\" class=\"link icon-only calendar-prev-month-button\">\n      <i class=\"icon icon-prev " + iconColor + "\"></i>\n    </a>\n    <span class=\"current-month-value\"></span>\n    <a href=\"#\" class=\"link icon-only calendar-next-month-button\">\n      <i class=\"icon icon-next " + iconColor + "\"></i>\n    </a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderYearSelector = function renderYearSelector () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderYearSelector) {
        return calendar.params.renderYearSelector.call(calendar);
      }

      var needsBlackIcon;
      if (calendar.inline && calendar.$containerEl.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      } else if (app.root.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      }

      var iconColor = app.theme === 'md' && needsBlackIcon ? 'color-black' : '';
      return ("\n    <div class=\"calendar-year-selector\">\n    <a href=\"#\" class=\"link icon-only calendar-prev-year-button\">\n      <i class=\"icon icon-prev " + iconColor + "\"></i>\n    </a>\n    <span class=\"current-year-value\"></span>\n    <a href=\"#\" class=\"link icon-only calendar-next-year-button\">\n      <i class=\"icon icon-next " + iconColor + "\"></i>\n    </a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderHeader = function renderHeader () {
      var calendar = this;
      if (calendar.params.renderHeader) {
        return calendar.params.renderHeader.call(calendar);
      }
      return ("\n    <div class=\"calendar-header\">\n    <div class=\"calendar-selected-date\">" + (calendar.params.headerPlaceholder) + "</div>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderFooter = function renderFooter () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderFooter) {
        return calendar.params.renderFooter.call(calendar);
      }
      return ("\n    <div class=\"calendar-footer\">\n    <a href=\"#\" class=\"" + (app.theme === 'md' ? 'button' : 'link') + " calendar-close sheet-close popover-close\">" + (calendar.params.toolbarCloseText) + "</a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderToolbar = function renderToolbar () {
      var calendar = this;
      if (calendar.params.renderToolbar) {
        return calendar.params.renderToolbar.call(calendar, calendar);
      }
      return ("\n    <div class=\"toolbar no-shadow\">\n    <div class=\"toolbar-inner\">\n      " + (calendar.renderMonthSelector()) + "\n      " + (calendar.renderYearSelector()) + "\n    </div>\n    </div>\n  ").trim();
    };
    // eslint-disable-next-line
    Calendar.prototype.renderInline = function renderInline () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var inlineHtml = ("\n    <div class=\"calendar calendar-inline " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return inlineHtml;
    };

    Calendar.prototype.renderCustomModal = function renderCustomModal () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var sheetHtml = ("\n    <div class=\"calendar calendar-modal " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return sheetHtml;
    };

    Calendar.prototype.renderSheet = function renderSheet () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var sheetHtml = ("\n    <div class=\"sheet-modal calendar calendar-sheet " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"sheet-modal-inner calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return sheetHtml;
    };

    Calendar.prototype.renderPopover = function renderPopover () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var popoverHtml = ("\n    <div class=\"popover calendar-popover\">\n    <div class=\"popover-inner\">\n      <div class=\"calendar " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n      " + (header ? calendar.renderHeader() : '') + "\n      " + (toolbar ? calendar.renderToolbar() : '') + "\n      " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n      <div class=\"calendar-months\">\n        " + (calendar.renderMonths(date)) + "\n      </div>\n      " + (footer ? calendar.renderFooter() : '') + "\n      </div>\n    </div>\n    </div>\n  ").trim();

      return popoverHtml;
    };

    Calendar.prototype.render = function render () {
      var calendar = this;
      var params = calendar.params;
      if (params.render) { return params.render.call(calendar); }
      if (!calendar.inline) {
        var modalType = params.openIn;
        if (modalType === 'auto') { modalType = calendar.isPopover() ? 'popover' : 'sheet'; }

        if (modalType === 'popover') { return calendar.renderPopover(); }
        if (modalType === 'sheet') { return calendar.renderSheet(); }
        return calendar.renderCustomModal();
      }
      return calendar.renderInline();
    };

    Calendar.prototype.onOpen = function onOpen () {
      var calendar = this;
      var initialized = calendar.initialized;
      var $el = calendar.$el;
      var app = calendar.app;
      var $inputEl = calendar.$inputEl;
      var inline = calendar.inline;
      var value = calendar.value;
      var params = calendar.params;
      calendar.closing = false;
      calendar.opened = true;
      calendar.opening = true;

      // Init main events
      calendar.attachCalendarEvents();

      var updateValue = !value && params.value;

      // Set value
      if (!initialized) {
        if (value) { calendar.setValue(value, 0); }
        else if (params.value) {
          calendar.setValue(calendar.normalizeValues(params.value), 0);
        }
      } else if (value) {
        calendar.setValue(value, 0);
      }

      // Update current month and year
      calendar.updateCurrentMonthYear();

      // Set initial translate
      calendar.monthsTranslate = 0;
      calendar.setMonthsTranslate();

      // Update input value
      if (updateValue) { calendar.updateValue(); }
      else if (params.header && value) {
        calendar.updateValue(true);
      }

      // Extra focus
      if (!inline && $inputEl.length && app.theme === 'md') {
        $inputEl.trigger('focus');
      }

      calendar.initialized = true;

      calendar.$months.each(function (index, monthEl) {
        calendar.emit('local::monthAdd calendarMonthAdd', monthEl);
      });

      // Trigger events
      if ($el) {
        $el.trigger('calendar:open', calendar);
      }
      if ($inputEl) {
        $inputEl.trigger('calendar:open', calendar);
      }
      calendar.emit('local::open calendarOpen', calendar);
    };

    Calendar.prototype.onOpened = function onOpened () {
      var calendar = this;
      calendar.opening = false;
      if (calendar.$el) {
        calendar.$el.trigger('calendar:opened', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:opened', calendar);
      }
      calendar.emit('local::opened calendarOpened', calendar);
    };

    Calendar.prototype.onClose = function onClose () {
      var calendar = this;
      var app = calendar.app;
      calendar.opening = false;
      calendar.closing = true;

      if (calendar.$inputEl && app.theme === 'md') {
        calendar.$inputEl.trigger('blur');
      }
      if (calendar.detachCalendarEvents) {
        calendar.detachCalendarEvents();
      }

      if (calendar.$el) {
        calendar.$el.trigger('calendar:close', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:close', calendar);
      }
      calendar.emit('local::close calendarClose', calendar);
    };

    Calendar.prototype.onClosed = function onClosed () {
      var calendar = this;
      calendar.opened = false;
      calendar.closing = false;

      if (!calendar.inline) {
        Utils.nextTick(function () {
          if (calendar.modal && calendar.modal.el && calendar.modal.destroy) {
            if (!calendar.params.routableModals) {
              calendar.modal.destroy();
            }
          }
          delete calendar.modal;
        });
      }
      if (calendar.$el) {
        calendar.$el.trigger('calendar:closed', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:closed', calendar);
      }
      calendar.emit('local::closed calendarClosed', calendar);
    };

    Calendar.prototype.open = function open () {
      var obj;

      var calendar = this;
      var app = calendar.app;
      var opened = calendar.opened;
      var inline = calendar.inline;
      var $inputEl = calendar.$inputEl;
      var params = calendar.params;
      if (opened) { return; }

      if (inline) {
        calendar.$el = $(calendar.render());
        calendar.$el[0].f7Calendar = calendar;
        calendar.$wrapperEl = calendar.$el.find('.calendar-months-wrapper');
        calendar.$months = calendar.$wrapperEl.find('.calendar-month');
        calendar.$containerEl.append(calendar.$el);
        calendar.onOpen();
        calendar.onOpened();
        return;
      }
      var modalType = params.openIn;
      if (modalType === 'auto') {
        modalType = calendar.isPopover() ? 'popover' : 'sheet';
      }
      var modalContent = calendar.render();

      var modalParams = {
        targetEl: $inputEl,
        scrollToEl: calendar.params.scrollToInput ? $inputEl : undefined,
        content: modalContent,
        backdrop: calendar.params.backdrop === true || (modalType === 'popover' && app.params.popover.backdrop !== false && calendar.params.backdrop !== false),
        closeByBackdropClick: calendar.params.closeByBackdropClick,
        on: {
          open: function open() {
            var modal = this;
            calendar.modal = modal;
            calendar.$el = modalType === 'popover' ? modal.$el.find('.calendar') : modal.$el;
            calendar.$wrapperEl = calendar.$el.find('.calendar-months-wrapper');
            calendar.$months = calendar.$wrapperEl.find('.calendar-month');
            calendar.$el[0].f7Calendar = calendar;
            if (modalType === 'customModal') {
              $(calendar.$el).find('.calendar-close').once('click', function () {
                calendar.close();
              });
            }
            calendar.onOpen();
          },
          opened: function opened() { calendar.onOpened(); },
          close: function close() { calendar.onClose(); },
          closed: function closed() { calendar.onClosed(); },
        },
      };
      if (calendar.params.routableModals) {
        calendar.view.router.navigate({
          url: calendar.url,
          route: ( obj = {
            path: calendar.url
          }, obj[modalType] = modalParams, obj ),
        });
      } else {
        calendar.modal = app[modalType].create(modalParams);
        calendar.modal.open();
      }
    };

    Calendar.prototype.close = function close () {
      var calendar = this;
      var opened = calendar.opened;
      var inline = calendar.inline;
      if (!opened) { return; }
      if (inline) {
        calendar.onClose();
        calendar.onClosed();
        return;
      }
      if (calendar.params.routableModals) {
        calendar.view.router.back();
      } else {
        calendar.modal.close();
      }
    };

    Calendar.prototype.init = function init () {
      var calendar = this;

      calendar.initInput();

      if (calendar.inline) {
        calendar.open();
        calendar.emit('local::init calendarInit', calendar);
        return;
      }

      if (!calendar.initialized && calendar.params.value) {
        calendar.setValue(calendar.normalizeValues(calendar.params.value));
      }

      // Attach input Events
      if (calendar.$inputEl) {
        calendar.attachInputEvents();
      }
      if (calendar.params.closeByOutsideClick) {
        calendar.attachHtmlEvents();
      }
      calendar.emit('local::init calendarInit', calendar);
    };

    Calendar.prototype.destroy = function destroy () {
      var calendar = this;
      if (calendar.destroyed) { return; }
      var $el = calendar.$el;
      calendar.emit('local::beforeDestroy calendarBeforeDestroy', calendar);
      if ($el) { $el.trigger('calendar:beforedestroy', calendar); }

      calendar.close();

      // Detach Events
      if (calendar.$inputEl) {
        calendar.detachInputEvents();
      }
      if (calendar.params.closeByOutsideClick) {
        calendar.detachHtmlEvents();
      }

      if ($el && $el.length) { delete calendar.$el[0].f7Calendar; }
      Utils.deleteProps(calendar);
      calendar.destroyed = true;
    };

    return Calendar;
  }(Framework7Class));

  var Calendar$1 = {
    name: 'calendar',
    static: {
      Calendar: Calendar,
    },
    create: function create() {
      var app = this;
      app.calendar = ConstructorMethods({
        defaultSelector: '.calendar',
        constructor: Calendar,
        app: app,
        domProp: 'f7Calendar',
      });
      app.calendar.close = function close(el) {
        if ( el === void 0 ) el = '.calendar';

        var $el = $(el);
        if ($el.length === 0) { return; }
        var calendar = $el[0].f7Calendar;
        if (!calendar || (calendar && !calendar.opened)) { return; }
        calendar.close();
      };
    },
    params: {
      calendar: {
        // Calendar settings
        calendarType: 'gregorian', // or 'jalali'
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        firstDay: 1, // First day of the week, Monday
        weekendDays: [0, 6], // Sunday and Saturday
        jalali: {
          monthNames: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
          monthNamesShort: ['فَر', 'اُر', 'خُر', 'تیر', 'مُر', 'شَه', 'مهر', 'آب', 'آذر', 'دی', 'بَه', 'اِس'],
          dayNames: ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'],
          dayNamesShort: ['1ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج', 'ش'],
          firstDay: 6, // Saturday
          weekendDays: [5], // Friday
        },
        multiple: false,
        rangePicker: false,
        rangePickerMinDays: 1, // when calendar is used as rangePicker
        rangePickerMaxDays: 0, // when calendar is used as rangePicker, 0 means unlimited
        dateFormat: 'yyyy-mm-dd',
        direction: 'horizontal', // or 'vertical'
        minDate: null,
        maxDate: null,
        disabled: null, // dates range of disabled days
        events: null, // dates range of days with events
        rangesClasses: null, // array with custom classes date ranges
        touchMove: true,
        animate: true,
        closeOnSelect: false,
        monthSelector: true,
        yearSelector: true,
        weekHeader: true,
        value: null,
        // Common opener settings
        containerEl: null,
        openIn: 'auto', // or 'popover' or 'sheet' or 'customModal'
        formatValue: null,
        inputEl: null,
        inputReadOnly: true,
        closeByOutsideClick: true,
        scrollToInput: true,
        header: false,
        headerPlaceholder: 'Select date',
        footer: false,
        toolbar: true,
        toolbarCloseText: 'Done',
        cssClass: null,
        routableModals: true,
        view: null,
        url: 'date/',
        backdrop: null,
        closeByBackdropClick: true,
        // Render functions
        renderWeekHeader: null,
        renderMonths: null,
        renderMonth: null,
        renderMonthSelector: null,
        renderYearSelector: null,
        renderHeader: null,
        renderFooter: null,
        renderToolbar: null,
        renderInline: null,
        renderPopover: null,
        renderSheet: null,
        render: null,
      },
    },
  };

  function pickerColumn (colEl, updateItems) {
    var picker = this;
    var app = picker.app;
    var $colEl = $(colEl);
    var colIndex = $colEl.index();
    var col = picker.cols[colIndex];
    if (col.divider) { return; }

    col.$el = $colEl;
    col.el = $colEl[0];
    col.$itemsEl = col.$el.find('.picker-items');
    col.items = col.$itemsEl.find('.picker-item');

    var itemHeight;
    var itemsHeight;
    var minTranslate;
    var maxTranslate;
    var animationFrameId;

    function updateDuringScroll() {
      animationFrameId = Utils.requestAnimationFrame(function () {
        col.updateItems(undefined, undefined, 0);
        updateDuringScroll();
      });
    }

    col.replaceValues = function replaceColValues(values, displayValues) {
      col.detachEvents();
      col.values = values;
      col.displayValues = displayValues;
      col.$itemsEl.html(picker.renderColumn(col, true));
      col.items = col.$itemsEl.find('.picker-item');
      col.calcSize();
      col.setValue(col.values[0], 0, true);
      col.attachEvents();
    };
    col.calcSize = function calcColSize() {
      if (picker.params.rotateEffect) {
        col.$el.removeClass('picker-column-absolute');
        if (!col.width) { col.$el.css({ width: '' }); }
      }
      var colWidth = 0;
      var colHeight = col.$el[0].offsetHeight;
      itemHeight = col.items[0].offsetHeight;
      itemsHeight = itemHeight * col.items.length;
      minTranslate = ((colHeight / 2) - itemsHeight) + (itemHeight / 2);
      maxTranslate = (colHeight / 2) - (itemHeight / 2);
      if (col.width) {
        colWidth = col.width;
        if (parseInt(colWidth, 10) === colWidth) { colWidth += 'px'; }
        col.$el.css({ width: colWidth });
      }
      if (picker.params.rotateEffect) {
        if (!col.width) {
          col.items.each(function (index, itemEl) {
            var item = $(itemEl).children('span');
            colWidth = Math.max(colWidth, item[0].offsetWidth);
          });
          col.$el.css({ width: ((colWidth + 2) + "px") });
        }
        col.$el.addClass('picker-column-absolute');
      }
    };

    col.setValue = function setColValue(newValue, transition, valueCallbacks) {
      if ( transition === void 0 ) transition = '';

      var newActiveIndex = col.$itemsEl.find((".picker-item[data-picker-value=\"" + newValue + "\"]")).index();
      if (typeof newActiveIndex === 'undefined' || newActiveIndex === -1) {
        return;
      }
      var newTranslate = (-newActiveIndex * itemHeight) + maxTranslate;
      // Update wrapper
      col.$itemsEl.transition(transition);
      col.$itemsEl.transform(("translate3d(0," + newTranslate + "px,0)"));

      // Watch items
      if (picker.params.updateValuesOnMomentum && col.activeIndex && col.activeIndex !== newActiveIndex) {
        Utils.cancelAnimationFrame(animationFrameId);
        col.$itemsEl.transitionEnd(function () {
          Utils.cancelAnimationFrame(animationFrameId);
        });
        updateDuringScroll();
      }

      // Update items
      col.updateItems(newActiveIndex, newTranslate, transition, valueCallbacks);
    };

    col.updateItems = function updateColItems(activeIndex, translate, transition, valueCallbacks) {
      if (typeof translate === 'undefined') {
        // eslint-disable-next-line
        translate = Utils.getTranslate(col.$itemsEl[0], 'y');
      }
      // eslint-disable-next-line
      if (typeof activeIndex === 'undefined') { activeIndex = -Math.round((translate - maxTranslate) / itemHeight); }
      // eslint-disable-next-line
      if (activeIndex < 0) { activeIndex = 0; }
      // eslint-disable-next-line
      if (activeIndex >= col.items.length) { activeIndex = col.items.length - 1; }
      var previousActiveIndex = col.activeIndex;
      col.activeIndex = activeIndex;
      col.$itemsEl.find('.picker-item-selected').removeClass('picker-item-selected');

      col.items.transition(transition);

      var selectedItem = col.items.eq(activeIndex).addClass('picker-item-selected').transform('');

      // Set 3D rotate effect
      if (picker.params.rotateEffect) {
        col.items.each(function (index, itemEl) {
          var $itemEl = $(itemEl);
          var itemOffsetTop = $itemEl.index() * itemHeight;
          var translateOffset = maxTranslate - translate;
          var itemOffset = itemOffsetTop - translateOffset;
          var percentage = itemOffset / itemHeight;
          var itemsFit = Math.ceil(col.height / itemHeight / 2) + 1;

          var angle = (-18 * percentage);
          if (angle > 180) { angle = 180; }
          if (angle < -180) { angle = -180; }
          if (Math.abs(percentage) > itemsFit) {
            $itemEl.addClass('picker-item-far');
          } else {
            $itemEl.removeClass('picker-item-far');
          }
          $itemEl.transform(("translate3d(0, " + (-translate + maxTranslate) + "px, " + (picker.needsOriginFix ? -110 : 0) + "px) rotateX(" + angle + "deg)"));
        });
      }

      if (valueCallbacks || typeof valueCallbacks === 'undefined') {
        // Update values
        col.value = selectedItem.attr('data-picker-value');
        col.displayValue = col.displayValues ? col.displayValues[activeIndex] : col.value;
        // On change callback
        if (previousActiveIndex !== activeIndex) {
          if (col.onChange) {
            col.onChange(picker, col.value, col.displayValue);
          }
          picker.updateValue();
        }
      }
    };

    var allowItemClick = true;
    var isTouched;
    var isMoved;
    var touchStartY;
    var touchCurrentY;
    var touchStartTime;
    var touchEndTime;
    var startTranslate;
    var returnTo;
    var currentTranslate;
    var prevTranslate;
    var velocityTranslate;
    function handleTouchStart(e) {
      if (isMoved || isTouched) { return; }
      e.preventDefault();
      isTouched = true;
      touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchCurrentY = touchStartY;
      touchStartTime = (new Date()).getTime();

      allowItemClick = true;
      startTranslate = Utils.getTranslate(col.$itemsEl[0], 'y');
      currentTranslate = startTranslate;
    }
    function handleTouchMove(e) {
      if (!isTouched) { return; }
      e.preventDefault();
      allowItemClick = false;
      touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (!isMoved) {
        // First move
        Utils.cancelAnimationFrame(animationFrameId);
        isMoved = true;
        startTranslate = Utils.getTranslate(col.$itemsEl[0], 'y');
        currentTranslate = startTranslate;
        col.$itemsEl.transition(0);
      }

      var diff = touchCurrentY - touchStartY;
      currentTranslate = startTranslate + diff;
      returnTo = undefined;

      // Normalize translate
      if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate - (Math.pow( (minTranslate - currentTranslate), 0.8 ));
        returnTo = 'min';
      }
      if (currentTranslate > maxTranslate) {
        currentTranslate = maxTranslate + (Math.pow( (currentTranslate - maxTranslate), 0.8 ));
        returnTo = 'max';
      }
      // Transform wrapper
      col.$itemsEl.transform(("translate3d(0," + currentTranslate + "px,0)"));

      // Update items
      col.updateItems(undefined, currentTranslate, 0, picker.params.updateValuesOnTouchmove);

      // Calc velocity
      velocityTranslate = currentTranslate - prevTranslate || currentTranslate;
      prevTranslate = currentTranslate;
    }
    function handleTouchEnd() {
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      col.$itemsEl.transition('');
      if (returnTo) {
        if (returnTo === 'min') {
          col.$itemsEl.transform(("translate3d(0," + minTranslate + "px,0)"));
        } else { col.$itemsEl.transform(("translate3d(0," + maxTranslate + "px,0)")); }
      }
      touchEndTime = new Date().getTime();
      var newTranslate;
      if (touchEndTime - touchStartTime > 300) {
        newTranslate = currentTranslate;
      } else {
        newTranslate = currentTranslate + (velocityTranslate * picker.params.momentumRatio);
      }

      newTranslate = Math.max(Math.min(newTranslate, maxTranslate), minTranslate);

      // Active Index
      var activeIndex = -Math.floor((newTranslate - maxTranslate) / itemHeight);

      // Normalize translate
      if (!picker.params.freeMode) { newTranslate = (-activeIndex * itemHeight) + maxTranslate; }

      // Transform wrapper
      col.$itemsEl.transform(("translate3d(0," + (parseInt(newTranslate, 10)) + "px,0)"));

      // Update items
      col.updateItems(activeIndex, newTranslate, '', true);

      // Watch items
      if (picker.params.updateValuesOnMomentum) {
        updateDuringScroll();
        col.$itemsEl.transitionEnd(function () {
          Utils.cancelAnimationFrame(animationFrameId);
        });
      }

      // Allow click
      setTimeout(function () {
        allowItemClick = true;
      }, 100);
    }

    function handleClick() {
      if (!allowItemClick) { return; }
      Utils.cancelAnimationFrame(animationFrameId);
      var value = $(this).attr('data-picker-value');
      col.setValue(value);
    }

    var activeListener = app.support.passiveListener ? { passive: false, capture: false } : false;
    col.attachEvents = function attachColEvents() {
      col.$el.on(app.touchEvents.start, handleTouchStart, activeListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
      col.items.on('click', handleClick);
    };
    col.detachEvents = function detachColEvents() {
      col.$el.off(app.touchEvents.start, handleTouchStart, activeListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      col.items.off('click', handleClick);
    };

    col.init = function initCol() {
      col.calcSize();
      col.$itemsEl.transform(("translate3d(0," + maxTranslate + "px,0)")).transition(0);
      if (colIndex === 0) { col.$el.addClass('picker-column-first'); }
      if (colIndex === picker.cols.length - 1) { col.$el.addClass('picker-column-last'); }
      // Update items on init
      if (updateItems) { col.updateItems(0, maxTranslate, 0); }

      col.attachEvents();
    };

    col.destroy = function destroyCol() {
      col.detachEvents();
    };

    col.init();
  }

  var Picker = (function (Framework7Class$$1) {
    function Picker(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var picker = this;
      picker.params = Utils.extend({}, app.params.picker, params);

      var $containerEl;
      if (picker.params.containerEl) {
        $containerEl = $(picker.params.containerEl);
        if ($containerEl.length === 0) { return picker; }
      }

      var $inputEl;
      if (picker.params.inputEl) {
        $inputEl = $(picker.params.inputEl);
      }

      var view;
      if ($inputEl) {
        view = $inputEl.parents('.view').length && $inputEl.parents('.view')[0].f7View;
      }
      if (!view) { view = app.views.main; }

      Utils.extend(picker, {
        app: app,
        $containerEl: $containerEl,
        containerEl: $containerEl && $containerEl[0],
        inline: $containerEl && $containerEl.length > 0,
        needsOriginFix: app.device.ios || ((win.navigator.userAgent.toLowerCase().indexOf('safari') >= 0 && win.navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && !app.device.android),
        cols: [],
        $inputEl: $inputEl,
        inputEl: $inputEl && $inputEl[0],
        initialized: false,
        opened: false,
        url: picker.params.url,
        view: view,
      });

      function onResize() {
        picker.resizeCols();
      }
      function onInputClick() {
        picker.open();
      }
      function onInputFocus(e) {
        e.preventDefault();
      }
      function onHtmlClick(e) {
        var $targetEl = $(e.target);
        if (picker.isPopover()) { return; }
        if (!picker.opened) { return; }
        if ($targetEl.closest('[class*="backdrop"]').length) { return; }
        if ($inputEl && $inputEl.length > 0) {
          if ($targetEl[0] !== $inputEl[0] && $targetEl.closest('.sheet-modal').length === 0) {
            picker.close();
          }
        } else if ($(e.target).closest('.sheet-modal').length === 0) {
          picker.close();
        }
      }

      // Events
      Utils.extend(picker, {
        attachResizeEvent: function attachResizeEvent() {
          app.on('resize', onResize);
        },
        detachResizeEvent: function detachResizeEvent() {
          app.off('resize', onResize);
        },
        attachInputEvents: function attachInputEvents() {
          picker.$inputEl.on('click', onInputClick);
          if (picker.params.inputReadOnly) {
            picker.$inputEl.on('focus mousedown', onInputFocus);
          }
        },
        detachInputEvents: function detachInputEvents() {
          picker.$inputEl.off('click', onInputClick);
          if (picker.params.inputReadOnly) {
            picker.$inputEl.off('focus mousedown', onInputFocus);
          }
        },
        attachHtmlEvents: function attachHtmlEvents() {
          app.on('click', onHtmlClick);
        },
        detachHtmlEvents: function detachHtmlEvents() {
          app.off('click', onHtmlClick);
        },
      });

      picker.init();

      return picker;
    }

    if ( Framework7Class$$1 ) Picker.__proto__ = Framework7Class$$1;
    Picker.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Picker.prototype.constructor = Picker;

    Picker.prototype.initInput = function initInput () {
      var picker = this;
      if (!picker.$inputEl) { return; }
      if (picker.params.inputReadOnly) { picker.$inputEl.prop('readOnly', true); }
    };

    Picker.prototype.resizeCols = function resizeCols () {
      var picker = this;
      if (!picker.opened) { return; }
      for (var i = 0; i < picker.cols.length; i += 1) {
        if (!picker.cols[i].divider) {
          picker.cols[i].calcSize();
          picker.cols[i].setValue(picker.cols[i].value, 0, false);
        }
      }
    };

    Picker.prototype.isPopover = function isPopover () {
      var picker = this;
      var app = picker.app;
      var modal = picker.modal;
      var params = picker.params;
      if (params.openIn === 'sheet') { return false; }
      if (modal && modal.type !== 'popover') { return false; }

      if (!picker.inline && picker.inputEl) {
        if (params.openIn === 'popover') { return true; }
        if (app.device.ios) {
          return !!app.device.ipad;
        } if (app.width >= 768) {
          return true;
        }
      }
      return false;
    };

    Picker.prototype.formatValue = function formatValue () {
      var picker = this;
      var value = picker.value;
      var displayValue = picker.displayValue;
      if (picker.params.formatValue) {
        return picker.params.formatValue.call(picker, value, displayValue);
      }
      return value.join(' ');
    };

    Picker.prototype.setValue = function setValue (values, transition) {
      var picker = this;
      var valueIndex = 0;
      if (picker.cols.length === 0) {
        picker.value = values;
        picker.updateValue(values);
        return;
      }
      for (var i = 0; i < picker.cols.length; i += 1) {
        if (picker.cols[i] && !picker.cols[i].divider) {
          picker.cols[i].setValue(values[valueIndex], transition);
          valueIndex += 1;
        }
      }
    };

    Picker.prototype.getValue = function getValue () {
      var picker = this;
      return picker.value;
    };

    Picker.prototype.updateValue = function updateValue (forceValues) {
      var picker = this;
      var newValue = forceValues || [];
      var newDisplayValue = [];
      var column;
      if (picker.cols.length === 0) {
        var noDividerColumns = picker.params.cols.filter(function (c) { return !c.divider; });
        for (var i = 0; i < noDividerColumns.length; i += 1) {
          column = noDividerColumns[i];
          if (column.displayValues !== undefined && column.values !== undefined && column.values.indexOf(newValue[i]) !== -1) {
            newDisplayValue.push(column.displayValues[column.values.indexOf(newValue[i])]);
          } else {
            newDisplayValue.push(newValue[i]);
          }
        }
      } else {
        for (var i$1 = 0; i$1 < picker.cols.length; i$1 += 1) {
          if (!picker.cols[i$1].divider) {
            newValue.push(picker.cols[i$1].value);
            newDisplayValue.push(picker.cols[i$1].displayValue);
          }
        }
      }

      if (newValue.indexOf(undefined) >= 0) {
        return;
      }
      picker.value = newValue;
      picker.displayValue = newDisplayValue;
      picker.emit('local::change pickerChange', picker, picker.value, picker.displayValue);
      if (picker.inputEl) {
        picker.$inputEl.val(picker.formatValue());
        picker.$inputEl.trigger('change');
      }
    };

    Picker.prototype.initColumn = function initColumn (colEl, updateItems) {
      var picker = this;
      pickerColumn.call(picker, colEl, updateItems);
    };
    // eslint-disable-next-line
    Picker.prototype.destroyColumn = function destroyColumn (colEl) {
      var picker = this;
      var $colEl = $(colEl);
      var index = $colEl.index();
      if (picker.cols[index] && picker.cols[index].destroy) {
        picker.cols[index].destroy();
      }
    };

    Picker.prototype.renderToolbar = function renderToolbar () {
      var picker = this;
      if (picker.params.renderToolbar) { return picker.params.renderToolbar.call(picker, picker); }
      return ("\n      <div class=\"toolbar no-shadow\">\n        <div class=\"toolbar-inner\">\n          <div class=\"left\"></div>\n          <div class=\"right\">\n            <a href=\"#\" class=\"link sheet-close popover-close\">" + (picker.params.toolbarCloseText) + "</a>\n          </div>\n        </div>\n      </div>\n    ").trim();
    };
    // eslint-disable-next-line
    Picker.prototype.renderColumn = function renderColumn (col, onlyItems) {
      var colClasses = "picker-column " + (col.textAlign ? ("picker-column-" + (col.textAlign)) : '') + " " + (col.cssClass || '');
      var columnHtml;
      var columnItemsHtml;

      if (col.divider) {
        columnHtml = "\n        <div class=\"" + colClasses + " picker-column-divider\">" + (col.content) + "</div>\n      ";
      } else {
        columnItemsHtml = col.values.map(function (value, index) { return ("\n        <div class=\"picker-item\" data-picker-value=\"" + value + "\">\n          <span>" + (col.displayValues ? col.displayValues[index] : value) + "</span>\n        </div>\n      "); }).join('');
        columnHtml = "\n        <div class=\"" + colClasses + "\">\n          <div class=\"picker-items\">" + columnItemsHtml + "</div>\n        </div>\n      ";
      }

      return onlyItems ? columnItemsHtml.trim() : columnHtml.trim();
    };

    Picker.prototype.renderInline = function renderInline () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var inlineHtml = ("\n      <div class=\"picker picker-inline " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n        " + (toolbar ? picker.renderToolbar() : '') + "\n        <div class=\"picker-columns\">\n          " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n          <div class=\"picker-center-highlight\"></div>\n        </div>\n      </div>\n    ").trim();

      return inlineHtml;
    };

    Picker.prototype.renderSheet = function renderSheet () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var sheetHtml = ("\n      <div class=\"sheet-modal picker picker-sheet " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n        " + (toolbar ? picker.renderToolbar() : '') + "\n        <div class=\"sheet-modal-inner picker-columns\">\n          " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n          <div class=\"picker-center-highlight\"></div>\n        </div>\n      </div>\n    ").trim();

      return sheetHtml;
    };

    Picker.prototype.renderPopover = function renderPopover () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var popoverHtml = ("\n      <div class=\"popover picker-popover\">\n        <div class=\"popover-inner\">\n          <div class=\"picker " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n            " + (toolbar ? picker.renderToolbar() : '') + "\n            <div class=\"picker-columns\">\n              " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n              <div class=\"picker-center-highlight\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ").trim();

      return popoverHtml;
    };

    Picker.prototype.render = function render () {
      var picker = this;
      if (picker.params.render) { return picker.params.render.call(picker); }
      if (!picker.inline) {
        if (picker.isPopover()) { return picker.renderPopover(); }
        return picker.renderSheet();
      }
      return picker.renderInline();
    };

    Picker.prototype.onOpen = function onOpen () {
      var picker = this;
      var initialized = picker.initialized;
      var $el = picker.$el;
      var app = picker.app;
      var $inputEl = picker.$inputEl;
      var inline = picker.inline;
      var value = picker.value;
      var params = picker.params;
      picker.opened = true;

      // Init main events
      picker.attachResizeEvent();

      // Init cols
      $el.find('.picker-column').each(function (index, colEl) {
        var updateItems = true;
        if (
          (!initialized && params.value)
          || (initialized && value)
        ) {
          updateItems = false;
        }
        picker.initColumn(colEl, updateItems);
      });

      // Set value
      if (!initialized) {
        if (value) { picker.setValue(value, 0); }
        else if (params.value) {
          picker.setValue(params.value, 0);
        }
      } else if (value) {
        picker.setValue(value, 0);
      }

      // Extra focus
      if (!inline && $inputEl.length && app.theme === 'md') {
        $inputEl.trigger('focus');
      }

      picker.initialized = true;

      // Trigger events
      if ($el) {
        $el.trigger('picker:open', picker);
      }
      if ($inputEl) {
        $inputEl.trigger('picker:open', picker);
      }
      picker.emit('local::open pickerOpen', picker);
    };

    Picker.prototype.onOpened = function onOpened () {
      var picker = this;

      if (picker.$el) {
        picker.$el.trigger('picker:opened', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:opened', picker);
      }
      picker.emit('local::opened pickerOpened', picker);
    };

    Picker.prototype.onClose = function onClose () {
      var picker = this;
      var app = picker.app;

      // Detach events
      picker.detachResizeEvent();

      picker.cols.forEach(function (col) {
        if (col.destroy) { col.destroy(); }
      });
      if (picker.$inputEl && app.theme === 'md') {
        picker.$inputEl.trigger('blur');
      }

      if (picker.$el) {
        picker.$el.trigger('picker:close', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:close', picker);
      }
      picker.emit('local::close pickerClose', picker);
    };

    Picker.prototype.onClosed = function onClosed () {
      var picker = this;
      picker.opened = false;

      if (!picker.inline) {
        Utils.nextTick(function () {
          if (picker.modal && picker.modal.el && picker.modal.destroy) {
            if (!picker.params.routableModals) {
              picker.modal.destroy();
            }
          }
          delete picker.modal;
        });
      }

      if (picker.$el) {
        picker.$el.trigger('picker:closed', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:closed', picker);
      }
      picker.emit('local::closed pickerClosed', picker);
    };

    Picker.prototype.open = function open () {
      var obj;

      var picker = this;
      var app = picker.app;
      var opened = picker.opened;
      var inline = picker.inline;
      var $inputEl = picker.$inputEl;
      if (opened) { return; }
      if (picker.cols.length === 0 && picker.params.cols.length) {
        picker.params.cols.forEach(function (col) {
          picker.cols.push(col);
        });
      }
      if (inline) {
        picker.$el = $(picker.render());
        picker.$el[0].f7Picker = picker;
        picker.$containerEl.append(picker.$el);
        picker.onOpen();
        picker.onOpened();
        return;
      }
      var isPopover = picker.isPopover();
      var modalType = isPopover ? 'popover' : 'sheet';
      var modalParams = {
        targetEl: $inputEl,
        scrollToEl: picker.params.scrollToInput ? $inputEl : undefined,
        content: picker.render(),
        backdrop: isPopover,
        on: {
          open: function open() {
            var modal = this;
            picker.modal = modal;
            picker.$el = isPopover ? modal.$el.find('.picker') : modal.$el;
            picker.$el[0].f7Picker = picker;
            picker.onOpen();
          },
          opened: function opened() { picker.onOpened(); },
          close: function close() { picker.onClose(); },
          closed: function closed() { picker.onClosed(); },
        },
      };
      if (picker.params.routableModals) {
        picker.view.router.navigate({
          url: picker.url,
          route: ( obj = {
            path: picker.url
          }, obj[modalType] = modalParams, obj ),
        });
      } else {
        picker.modal = app[modalType].create(modalParams);
        picker.modal.open();
      }
    };

    Picker.prototype.close = function close () {
      var picker = this;
      var opened = picker.opened;
      var inline = picker.inline;
      if (!opened) { return; }
      if (inline) {
        picker.onClose();
        picker.onClosed();
        return;
      }
      if (picker.params.routableModals) {
        picker.view.router.back();
      } else {
        picker.modal.close();
      }
    };

    Picker.prototype.init = function init () {
      var picker = this;

      picker.initInput();

      if (picker.inline) {
        picker.open();
        picker.emit('local::init pickerInit', picker);
        return;
      }

      if (!picker.initialized && picker.params.value) {
        picker.setValue(picker.params.value);
      }

      // Attach input Events
      if (picker.$inputEl) {
        picker.attachInputEvents();
      }
      if (picker.params.closeByOutsideClick) {
        picker.attachHtmlEvents();
      }
      picker.emit('local::init pickerInit', picker);
    };

    Picker.prototype.destroy = function destroy () {
      var picker = this;
      if (picker.destroyed) { return; }
      var $el = picker.$el;
      picker.emit('local::beforeDestroy pickerBeforeDestroy', picker);
      if ($el) { $el.trigger('picker:beforedestroy', picker); }

      picker.close();

      // Detach Events
      if (picker.$inputEl) {
        picker.detachInputEvents();
      }
      if (picker.params.closeByOutsideClick) {
        picker.detachHtmlEvents();
      }

      if ($el && $el.length) { delete picker.$el[0].f7Picker; }
      Utils.deleteProps(picker);
      picker.destroyed = true;
    };

    return Picker;
  }(Framework7Class));

  var Picker$1 = {
    name: 'picker',
    static: {
      Picker: Picker,
    },
    create: function create() {
      var app = this;
      app.picker = ConstructorMethods({
        defaultSelector: '.picker',
        constructor: Picker,
        app: app,
        domProp: 'f7Picker',
      });
      app.picker.close = function close(el) {
        if ( el === void 0 ) el = '.picker';

        var $el = $(el);
        if ($el.length === 0) { return; }
        var picker = $el[0].f7Picker;
        if (!picker || (picker && !picker.opened)) { return; }
        picker.close();
      };
    },
    params: {
      picker: {
        // Picker settings
        updateValuesOnMomentum: false,
        updateValuesOnTouchmove: true,
        rotateEffect: false,
        momentumRatio: 7,
        freeMode: false,
        cols: [],
        // Common opener settings
        containerEl: null,
        openIn: 'auto', // or 'popover' or 'sheet'
        formatValue: null,
        inputEl: null,
        inputReadOnly: true,
        closeByOutsideClick: true,
        scrollToInput: true,
        toolbar: true,
        toolbarCloseText: 'Done',
        cssClass: null,
        routableModals: true,
        view: null,
        url: 'select/',
        // Render functions
        renderToolbar: null,
        render: null,
      },
    },
  };

  var Searchbar = (function (FrameworkClass) {
    function Searchbar(app, params) {
      if ( params === void 0 ) params = {};

      FrameworkClass.call(this, params, [app]);

      var sb = this;

      var defaults = {
        el: undefined,
        inputEl: undefined,
        disableButton: true,
        disableButtonEl: undefined,
        backdropEl: undefined,
        searchContainer: undefined, // container to search, HTMLElement or CSS selector
        searchItem: 'li', // single item selector, CSS selector
        searchIn: undefined, // where to search in item, CSS selector
        ignore: '.searchbar-ignore',
        foundEl: '.searchbar-found',
        notFoundEl: '.searchbar-not-found',
        hideOnEnableEl: '.searchbar-hide-on-enable',
        hideOnSearchEl: '.searchbar-hide-on-search',
        backdrop: true,
        removeDiacritics: true,
        customSearch: false,
        hideDividers: true,
        hideGroups: true,
        disableOnBackdropClick: true,
        expandable: false,
      };

      // Extend defaults with modules params
      sb.useModulesParams(defaults);

      sb.params = Utils.extend(defaults, params);

      var $el = $(sb.params.el);
      if ($el.length === 0) { return sb; }

      if ($el[0].f7Searchbar) { return $el[0].f7Searchbar; }

      $el[0].f7Searchbar = sb;

      var $pageEl;
      var $navbarEl;
      if ($el.parents('.page').length > 0) {
        $pageEl = $el.parents('.page');
      } else {
        $navbarEl = $el.parents('.navbar-inner');
        if ($navbarEl.length > 0) {
          if ($navbarEl[0].f7Page) {
            $pageEl = $navbarEl[0].f7Page.$el;
          } else {
            var $currentPageEl = $el.parents('.view').find('.page-current');
            if ($currentPageEl[0] && $currentPageEl[0].f7Page && $currentPageEl[0].f7Page.navbarEl === $navbarEl[0]) {
              $pageEl = $currentPageEl;
            }
          }
        }
      }

      var $foundEl;
      if (params.foundEl) {
        $foundEl = $(params.foundEl);
      } else if (typeof sb.params.foundEl === 'string' && $pageEl) {
        $foundEl = $pageEl.find(sb.params.foundEl);
      }

      var $notFoundEl;
      if (params.notFoundEl) {
        $notFoundEl = $(params.notFoundEl);
      } else if (typeof sb.params.notFoundEl === 'string' && $pageEl) {
        $notFoundEl = $pageEl.find(sb.params.notFoundEl);
      }

      var $hideOnEnableEl;
      if (params.hideOnEnableEl) {
        $hideOnEnableEl = $(params.hideOnEnableEl);
      } else if (typeof sb.params.hideOnEnableEl === 'string' && $pageEl) {
        $hideOnEnableEl = $pageEl.find(sb.params.hideOnEnableEl);
      }

      var $hideOnSearchEl;
      if (params.hideOnSearchEl) {
        $hideOnSearchEl = $(params.hideOnSearchEl);
      } else if (typeof sb.params.hideOnSearchEl === 'string' && $pageEl) {
        $hideOnSearchEl = $pageEl.find(sb.params.hideOnSearchEl);
      }

      var $backdropEl;
      if (sb.params.backdrop) {
        if (sb.params.backdropEl) {
          $backdropEl = $(sb.params.backdropEl);
        } else if ($pageEl && $pageEl.length > 0) {
          $backdropEl = $pageEl.find('.searchbar-backdrop');
        } else {
          $backdropEl = $el.siblings('.searchbar-backdrop');
        }
        if ($backdropEl.length === 0) {
          $backdropEl = $('<div class="searchbar-backdrop"></div>');
          if ($pageEl && $pageEl.length) {
            if ($el.parents($pageEl).length > 0 && $navbarEl && $el.parents($navbarEl).length === 0) {
              $backdropEl.insertBefore($el);
            } else {
              $backdropEl.insertBefore($pageEl.find('.page-content').eq(0));
            }
          } else {
            $backdropEl.insertBefore($el);
          }
        }
      }

      var $searchContainer;
      if (sb.params.searchContainer) {
        $searchContainer = $(sb.params.searchContainer);
      }

      var $inputEl;
      if (sb.params.inputEl) {
        $inputEl = $(sb.params.inputEl);
      } else {
        $inputEl = $el.find('input[type="search"]').eq(0);
      }

      var $disableButtonEl;
      if (sb.params.disableButton) {
        if (sb.params.disableButtonEl) {
          $disableButtonEl = $(sb.params.disableButtonEl);
        } else {
          $disableButtonEl = $el.find('.searchbar-disable-button');
        }
      }

      Utils.extend(sb, {
        app: app,
        view: app.views.get($el.parents('.view')),
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        $searchContainer: $searchContainer,
        searchContainer: $searchContainer && $searchContainer[0],
        $inputEl: $inputEl,
        inputEl: $inputEl[0],
        $disableButtonEl: $disableButtonEl,
        disableButtonEl: $disableButtonEl && $disableButtonEl[0],
        disableButtonHasMargin: false,
        $pageEl: $pageEl,
        pageEl: $pageEl && $pageEl[0],
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl && $navbarEl[0],
        $foundEl: $foundEl,
        foundEl: $foundEl && $foundEl[0],
        $notFoundEl: $notFoundEl,
        notFoundEl: $notFoundEl && $notFoundEl[0],
        $hideOnEnableEl: $hideOnEnableEl,
        hideOnEnableEl: $hideOnEnableEl && $hideOnEnableEl[0],
        $hideOnSearchEl: $hideOnSearchEl,
        hideOnSearchEl: $hideOnSearchEl && $hideOnSearchEl[0],
        previousQuery: '',
        query: '',
        isVirtualList: $searchContainer && $searchContainer.hasClass('virtual-list'),
        virtualList: undefined,
        enabled: false,
        expandable: sb.params.expandable || $el.hasClass('searchbar-expandable'),
      });

      // Events
      function preventSubmit(e) {
        e.preventDefault();
      }
      function onInputFocus(e) {
        sb.enable(e);
        sb.$el.addClass('searchbar-focused');
      }
      function onInputBlur() {
        sb.$el.removeClass('searchbar-focused');
      }
      function onInputChange() {
        var value = sb.$inputEl.val().trim();
        if (
          (
            (sb.$searchContainer && sb.$searchContainer.length > 0)
            && (sb.params.searchIn || sb.isVirtualList || sb.params.searchIn === sb.params.searchItem)
          )
          || sb.params.customSearch
        ) {
          sb.search(value, true);
        }
      }
      function onInputClear(e, previousValue) {
        sb.$el.trigger('searchbar:clear', previousValue);
        sb.emit('local::clear searchbarClear', sb, previousValue);
      }
      function disableOnClick(e) {
        sb.disable(e);
      }
      function onPageBeforeOut() {
        if (!sb || (sb && !sb.$el)) { return; }
        if (sb.enabled) {
          sb.$el.removeClass('searchbar-enabled');
        }
      }
      function onPageBeforeIn() {
        if (!sb || (sb && !sb.$el)) { return; }
        if (sb.enabled) {
          sb.$el.addClass('searchbar-enabled');
        }
      }
      sb.attachEvents = function attachEvents() {
        $el.on('submit', preventSubmit);
        if (sb.params.disableButton) {
          sb.$disableButtonEl.on('click', disableOnClick);
        }
        if (sb.params.disableOnBackdropClick && sb.$backdropEl) {
          sb.$backdropEl.on('click', disableOnClick);
        }
        if (sb.expandable && app.theme === 'ios' && sb.view && $navbarEl && sb.$pageEl) {
          sb.$pageEl.on('page:beforeout', onPageBeforeOut);
          sb.$pageEl.on('page:beforein', onPageBeforeIn);
        }
        sb.$inputEl.on('focus', onInputFocus);
        sb.$inputEl.on('blur', onInputBlur);
        sb.$inputEl.on('change input compositionend', onInputChange);
        sb.$inputEl.on('input:clear', onInputClear);
      };
      sb.detachEvents = function detachEvents() {
        $el.off('submit', preventSubmit);
        if (sb.params.disableButton) {
          sb.$disableButtonEl.off('click', disableOnClick);
        }
        if (sb.params.disableOnBackdropClick && sb.$backdropEl) {
          sb.$backdropEl.off('click', disableOnClick);
        }
        if (sb.expandable && app.theme === 'ios' && sb.view && $navbarEl && sb.$pageEl) {
          sb.$pageEl.off('page:beforeout', onPageBeforeOut);
          sb.$pageEl.off('page:beforein', onPageBeforeIn);
        }
        sb.$inputEl.off('focus', onInputFocus);
        sb.$inputEl.off('blur', onInputBlur);
        sb.$inputEl.off('change input compositionend', onInputChange);
        sb.$inputEl.off('input:clear', onInputClear);
      };

      // Install Modules
      sb.useModules();

      // Init
      sb.init();

      return sb;
    }

    if ( FrameworkClass ) Searchbar.__proto__ = FrameworkClass;
    Searchbar.prototype = Object.create( FrameworkClass && FrameworkClass.prototype );
    Searchbar.prototype.constructor = Searchbar;

    Searchbar.prototype.clear = function clear (e) {
      var sb = this;
      if (!sb.query && e && $(e.target).hasClass('searchbar-clear')) {
        sb.disable();
        return sb;
      }
      var previousQuery = sb.value;
      sb.$inputEl.val('').trigger('change').focus();
      sb.$el.trigger('searchbar:clear', previousQuery);
      sb.emit('local::clear searchbarClear', sb, previousQuery);
      return sb;
    };

    Searchbar.prototype.setDisableButtonMargin = function setDisableButtonMargin () {
      var sb = this;
      if (sb.expandable) { return; }
      var app = sb.app;
      sb.$disableButtonEl.transition(0).show();
      sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), ((-sb.disableButtonEl.offsetWidth) + "px"));
      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      sb._clientLeft = sb.$disableButtonEl[0].clientLeft;
      sb.$disableButtonEl.transition('');
      sb.disableButtonHasMargin = true;
    };

    Searchbar.prototype.enable = function enable (setFocus) {
      var sb = this;
      if (sb.enabled) { return sb; }
      var app = sb.app;
      sb.enabled = true;
      function enable() {
        if (sb.$backdropEl && ((sb.$searchContainer && sb.$searchContainer.length) || sb.params.customSearch) && !sb.$el.hasClass('searchbar-enabled') && !sb.query) {
          sb.backdropShow();
        }
        sb.$el.addClass('searchbar-enabled');
        if (!sb.expandable && sb.$disableButtonEl && sb.$disableButtonEl.length > 0 && app.theme === 'ios') {
          if (!sb.disableButtonHasMargin) {
            sb.setDisableButtonMargin();
          }
          sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), '0px');
        }
        if (sb.$hideOnEnableEl) { sb.$hideOnEnableEl.addClass('hidden-by-searchbar'); }
        sb.$el.trigger('searchbar:enable');
        sb.emit('local::enable searchbarEnable', sb);
      }
      var needsFocus = false;
      if (setFocus === true) {
        if (doc.activeElement !== sb.inputEl) {
          needsFocus = true;
        }
      }
      var isIos = app.device.ios && app.theme === 'ios';
      if (isIos) {
        if (sb.expandable) {
          if (needsFocus) { sb.$inputEl.focus(); }
          enable();
        } else {
          if (needsFocus) { sb.$inputEl.focus(); }
          if (setFocus && (setFocus.type === 'focus' || setFocus === true)) {
            Utils.nextTick(function () {
              enable();
            }, 400);
          } else {
            enable();
          }
        }
      } else {
        if (needsFocus) { sb.$inputEl.focus(); }
        if (app.theme === 'md' && sb.expandable) {
          sb.$el.parents('.page, .view, .navbar-inner').scrollLeft(0);
        }
        enable();
      }
      return sb;
    };

    Searchbar.prototype.disable = function disable () {
      var sb = this;
      if (!sb.enabled) { return sb; }
      var app = sb.app;
      sb.$inputEl.val('').trigger('change');
      sb.$el.removeClass('searchbar-enabled');
      sb.$el.removeClass('searchbar-focused');
      if (!sb.expandable && sb.$disableButtonEl && sb.$disableButtonEl.length > 0 && app.theme === 'ios') {
        sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), ((-sb.disableButtonEl.offsetWidth) + "px"));
      }

      if (sb.$backdropEl && ((sb.$searchContainer && sb.$searchContainer.length) || sb.params.customSearch)) {
        sb.backdropHide();
      }

      sb.enabled = false;

      sb.$inputEl.blur();

      if (sb.$hideOnEnableEl) { sb.$hideOnEnableEl.removeClass('hidden-by-searchbar'); }

      sb.$el.trigger('searchbar:disable');
      sb.emit('local::disable searchbarDisable', sb);
      return sb;
    };

    Searchbar.prototype.toggle = function toggle () {
      var sb = this;
      if (sb.enabled) { sb.disable(); }
      else { sb.enable(true); }
      return sb;
    };

    Searchbar.prototype.backdropShow = function backdropShow () {
      var sb = this;
      if (sb.$backdropEl) {
        sb.$backdropEl.addClass('searchbar-backdrop-in');
      }
      return sb;
    };

    Searchbar.prototype.backdropHide = function backdropHide () {
      var sb = this;
      if (sb.$backdropEl) {
        sb.$backdropEl.removeClass('searchbar-backdrop-in');
      }
      return sb;
    };

    Searchbar.prototype.search = function search (query, internal) {
      var sb = this;
      sb.previousQuery = sb.query || '';
      if (query === sb.previousQuery) { return sb; }

      if (!internal) {
        if (!sb.enabled) {
          sb.enable();
        }
        sb.$inputEl.val(query);
      }
      sb.query = query;
      sb.value = query;

      var $searchContainer = sb.$searchContainer;
      var $el = sb.$el;
      var $foundEl = sb.$foundEl;
      var $notFoundEl = sb.$notFoundEl;
      var $hideOnSearchEl = sb.$hideOnSearchEl;
      var isVirtualList = sb.isVirtualList;

      // Hide on search element
      if (query.length > 0 && $hideOnSearchEl) {
        $hideOnSearchEl.addClass('hidden-by-searchbar');
      } else if ($hideOnSearchEl) {
        $hideOnSearchEl.removeClass('hidden-by-searchbar');
      }
      // Add active/inactive classes on overlay
      if (
        ($searchContainer && $searchContainer.length && $el.hasClass('searchbar-enabled'))
        || (sb.params.customSearch && $el.hasClass('searchbar-enabled'))
      ) {
        if (query.length === 0) {
          sb.backdropShow();
        } else {
          sb.backdropHide();
        }
      }

      if (sb.params.customSearch) {
        $el.trigger('searchbar:search', query, sb.previousQuery);
        sb.emit('local::search searchbarSearch', sb, query, sb.previousQuery);
        return sb;
      }

      var foundItems = [];
      var vlQuery;
      if (isVirtualList) {
        sb.virtualList = $searchContainer[0].f7VirtualList;
        if (query.trim() === '') {
          sb.virtualList.resetFilter();
          if ($notFoundEl) { $notFoundEl.hide(); }
          if ($foundEl) { $foundEl.show(); }
          $el.trigger('searchbar:search', query, sb.previousQuery);
          sb.emit('local::search searchbarSearch', sb, query, sb.previousQuery);
          return sb;
        }
        vlQuery = sb.params.removeDiacritics ? Utils.removeDiacritics(query) : query;
        if (sb.virtualList.params.searchAll) {
          foundItems = sb.virtualList.params.searchAll(vlQuery, sb.virtualList.items) || [];
        } else if (sb.virtualList.params.searchByItem) {
          for (var i = 0; i < sb.virtualList.items.length; i += 1) {
            if (sb.virtualList.params.searchByItem(vlQuery, sb.virtualList.params.items[i], i)) {
              foundItems.push(i);
            }
          }
        }
      } else {
        var values;
        if (sb.params.removeDiacritics) { values = Utils.removeDiacritics(query.trim().toLowerCase()).split(' '); }
        else {
          values = query.trim().toLowerCase().split(' ');
        }
        $searchContainer.find(sb.params.searchItem).removeClass('hidden-by-searchbar').each(function (itemIndex, itemEl) {
          var $itemEl = $(itemEl);
          var compareWithText = [];
          var $searchIn = sb.params.searchIn ? $itemEl.find(sb.params.searchIn) : $itemEl;
          if (sb.params.searchIn === sb.params.searchItem) {
            $searchIn = $itemEl;
          }
          $searchIn.each(function (searchInIndex, searchInEl) {
            var itemText = $(searchInEl).text().trim().toLowerCase();
            if (sb.params.removeDiacritics) { itemText = Utils.removeDiacritics(itemText); }
            compareWithText.push(itemText);
          });
          compareWithText = compareWithText.join(' ');
          var wordsMatch = 0;
          for (var i = 0; i < values.length; i += 1) {
            if (compareWithText.indexOf(values[i]) >= 0) { wordsMatch += 1; }
          }
          if (wordsMatch !== values.length && !(sb.params.ignore && $itemEl.is(sb.params.ignore))) {
            $itemEl.addClass('hidden-by-searchbar');
          } else {
            foundItems.push($itemEl[0]);
          }
        });

        if (sb.params.hideDividers) {
          $searchContainer.find('.item-divider, .list-group-title').each(function (titleIndex, titleEl) {
            var $titleEl = $(titleEl);
            var $nextElements = $titleEl.nextAll('li');
            var hide = true;
            for (var i = 0; i < $nextElements.length; i += 1) {
              var $nextEl = $nextElements.eq(i);
              if ($nextEl.hasClass('list-group-title') || $nextEl.hasClass('item-divider')) { break; }
              if (!$nextEl.hasClass('hidden-by-searchbar')) {
                hide = false;
              }
            }
            var ignore = sb.params.ignore && $titleEl.is(sb.params.ignore);
            if (hide && !ignore) { $titleEl.addClass('hidden-by-searchbar'); }
            else { $titleEl.removeClass('hidden-by-searchbar'); }
          });
        }
        if (sb.params.hideGroups) {
          $searchContainer.find('.list-group').each(function (groupIndex, groupEl) {
            var $groupEl = $(groupEl);
            var ignore = sb.params.ignore && $groupEl.is(sb.params.ignore);
            var notHidden = $groupEl.find('li:not(.hidden-by-searchbar)');
            if (notHidden.length === 0 && !ignore) {
              $groupEl.addClass('hidden-by-searchbar');
            } else {
              $groupEl.removeClass('hidden-by-searchbar');
            }
          });
        }
      }

      if (foundItems.length === 0) {
        if ($notFoundEl) { $notFoundEl.show(); }
        if ($foundEl) { $foundEl.hide(); }
      } else {
        if ($notFoundEl) { $notFoundEl.hide(); }
        if ($foundEl) { $foundEl.show(); }
      }
      if (isVirtualList && sb.virtualList) {
        sb.virtualList.filterItems(foundItems);
      }

      $el.trigger('searchbar:search', query, sb.previousQuery, foundItems);
      sb.emit('local::search searchbarSearch', sb, query, sb.previousQuery, foundItems);

      return sb;
    };

    Searchbar.prototype.init = function init () {
      var sb = this;
      sb.attachEvents();
    };

    Searchbar.prototype.destroy = function destroy () {
      var sb = this;
      sb.emit('local::beforeDestroy searchbarBeforeDestroy', sb);
      sb.$el.trigger('searchbar:beforedestroy', sb);
      sb.detachEvents();
      if (sb.$el[0]) {
        sb.$el[0].f7Searchbar = null;
        delete sb.$el[0].f7Searchbar;
      }
      Utils.deleteProps(sb);
    };

    return Searchbar;
  }(Framework7Class));

  var Searchbar$1 = {
    name: 'searchbar',
    static: {
      Searchbar: Searchbar,
    },
    create: function create() {
      var app = this;
      app.searchbar = ConstructorMethods({
        defaultSelector: '.searchbar',
        constructor: Searchbar,
        app: app,
        domProp: 'f7Searchbar',
        addMethods: 'clear enable disable toggle search'.split(' '),
      });
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.searchbar-init').each(function (index, searchbarEl) {
          var $searchbarEl = $(searchbarEl);
          app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $(tabEl).find('.searchbar-init').each(function (index, searchbarEl) {
          if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
            searchbarEl.f7Searchbar.destroy();
          }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.searchbar-init').each(function (index, searchbarEl) {
          var $searchbarEl = $(searchbarEl);
          app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
        });
        if (app.theme === 'ios' && page.view && page.view.router.separateNavbar && page.$navbarEl && page.$navbarEl.length > 0) {
          page.$navbarEl.find('.searchbar-init').each(function (index, searchbarEl) {
            var $searchbarEl = $(searchbarEl);
            app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
          });
        }
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.searchbar-init').each(function (index, searchbarEl) {
          if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
            searchbarEl.f7Searchbar.destroy();
          }
        });
        if (app.theme === 'ios' && page.view && page.view.router.separateNavbar && page.$navbarEl && page.$navbarEl.length > 0) {
          page.$navbarEl.find('.searchbar-init').each(function (index, searchbarEl) {
            if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
              searchbarEl.f7Searchbar.destroy();
            }
          });
        }
      },
    },
    clicks: {
      '.searchbar-clear': function clear($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.clear(); }
      },
      '.searchbar-enable': function enable($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.enable(true); }
      },
      '.searchbar-disable': function disable($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.disable(); }
      },
      '.searchbar-toggle': function toggle($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.toggle(); }
      },
    },
    vnode: {
      'searchbar-init': {
        insert: function insert(vnode) {
          var app = this;
          var searchbarEl = vnode.elm;
          var $searchbarEl = $(searchbarEl);
          app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
        },
        destroy: function destroy(vnode) {
          var searchbarEl = vnode.elm;
          if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
            searchbarEl.f7Searchbar.destroy();
          }
        },
      },
    },
  };

  var Messages = (function (Framework7Class$$1) {
    function Messages(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);

      var m = this;

      var defaults = {
        autoLayout: true,
        messages: [],
        newMessagesFirst: false,
        scrollMessages: true,
        scrollMessagesOnEdge: true,
        firstMessageRule: undefined,
        lastMessageRule: undefined,
        tailMessageRule: undefined,
        sameNameMessageRule: undefined,
        sameHeaderMessageRule: undefined,
        sameFooterMessageRule: undefined,
        sameAvatarMessageRule: undefined,
        customClassMessageRule: undefined,
        renderMessage: undefined,
      };

      // Extend defaults with modules params
      m.useModulesParams(defaults);

      m.params = Utils.extend(defaults, params);

      var $el = $(params.el).eq(0);
      if ($el.length === 0) { return m; }

      if ($el[0].f7Messages) { return $el[0].f7Messages; }

      $el[0].f7Messages = m;

      var $pageContentEl = $el.closest('.page-content').eq(0);

      Utils.extend(m, {
        messages: m.params.messages,
        $el: $el,
        el: $el[0],
        $pageContentEl: $pageContentEl,
        pageContentEl: $pageContentEl[0],

      });
      // Install Modules
      m.useModules();

      // Init
      m.init();

      return m;
    }

    if ( Framework7Class$$1 ) Messages.__proto__ = Framework7Class$$1;
    Messages.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Messages.prototype.constructor = Messages;
    // eslint-disable-next-line
    Messages.prototype.getMessageData = function getMessageData (messageEl) {
      var $messageEl = $(messageEl);
      var data = {
        name: $messageEl.find('.message-name').html(),
        header: $messageEl.find('.message-header').html(),
        textHeader: $messageEl.find('.message-text-header').html(),
        textFooter: $messageEl.find('.message-text-footer').html(),
        footer: $messageEl.find('.message-footer').html(),
        isTitle: $messageEl.hasClass('messages-title'),
        type: $messageEl.hasClass('message-sent') ? 'sent' : 'received',
        text: $messageEl.find('.message-text').html(),
        image: $messageEl.find('.message-image').html(),
        imageSrc: $messageEl.find('.message-image img').attr('src'),
        typing: $messageEl.hasClass('message-typing'),
      };
      if (data.isTitle) {
        data.text = $messageEl.html();
      }
      if (data.text && data.textHeader) {
        data.text = data.text.replace(("<div class=\"message-text-header\">" + (data.textHeader) + "</div>"), '');
      }
      if (data.text && data.textFooter) {
        data.text = data.text.replace(("<div class=\"message-text-footer\">" + (data.textFooter) + "</div>"), '');
      }
      var avatar = $messageEl.find('.message-avatar').css('background-image');
      if (avatar === 'none' || avatar === '') { avatar = undefined; }
      if (avatar && typeof avatar === 'string') {
        avatar = avatar.replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, '');
      } else {
        avatar = undefined;
      }
      data.avatar = avatar;

      return data;
    };

    Messages.prototype.getMessagesData = function getMessagesData () {
      var m = this;
      var data = [];
      m.$el.find('.message, .messages-title').each(function (index, messageEl) {
        data.push(m.getMessageData(messageEl));
      });
      return data;
    };

    Messages.prototype.renderMessage = function renderMessage (messageToRender) {
      var m = this;
      var message = Utils.extend({
        type: 'sent',
      }, messageToRender);
      if (m.params.renderMessage) {
        return m.params.renderMessage.call(m, message);
      }
      if (message.isTitle) {
        return ("<div class=\"messages-title\">" + (message.text) + "</div>");
      }
      return ("\n      <div class=\"message message-" + (message.type) + " " + (message.isTyping ? 'message-typing' : '') + "\">\n        " + (message.avatar ? ("\n        <div class=\"message-avatar\" style=\"background-image:url(" + (message.avatar) + ")\"></div>\n        ") : '') + "\n        <div class=\"message-content\">\n          " + (message.name ? ("<div class=\"message-name\">" + (message.name) + "</div>") : '') + "\n          " + (message.header ? ("<div class=\"message-header\">" + (message.header) + "</div>") : '') + "\n          <div class=\"message-bubble\">\n            " + (message.textHeader ? ("<div class=\"message-text-header\">" + (message.textHeader) + "</div>") : '') + "\n            " + (message.image ? ("<div class=\"message-image\">" + (message.image) + "</div>") : '') + "\n            " + (message.imageSrc && !message.image ? ("<div class=\"message-image\"><img src=\"" + (message.imageSrc) + "\"></div>") : '') + "\n            " + (message.text || message.isTyping ? ("<div class=\"message-text\">" + (message.text || '') + (message.isTyping ? '<div class="message-typing-indicator"><div></div><div></div><div></div></div>' : '') + "</div>") : '') + "\n            " + (message.textFooter ? ("<div class=\"message-text-footer\">" + (message.textFooter) + "</div>") : '') + "\n          </div>\n          " + (message.footer ? ("<div class=\"message-footer\">" + (message.footer) + "</div>") : '') + "\n        </div>\n      </div>\n    ");
    };

    Messages.prototype.renderMessages = function renderMessages (messagesToRender, method) {
      if ( messagesToRender === void 0 ) messagesToRender = this.messages;
      if ( method === void 0 ) method = this.params.newMessagesFirst ? 'prepend' : 'append';

      var m = this;
      var html = messagesToRender.map(function (message) { return m.renderMessage(message); }).join('');
      m.$el[method](html);
    };

    Messages.prototype.isFirstMessage = function isFirstMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.firstMessageRule) { return (ref = m.params).firstMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isLastMessage = function isLastMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.lastMessageRule) { return (ref = m.params).lastMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isTailMessage = function isTailMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.tailMessageRule) { return (ref = m.params).tailMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isSameNameMessage = function isSameNameMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.sameNameMessageRule) { return (ref = m.params).sameNameMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isSameHeaderMessage = function isSameHeaderMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.sameHeaderMessageRule) { return (ref = m.params).sameHeaderMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isSameFooterMessage = function isSameFooterMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.sameFooterMessageRule) { return (ref = m.params).sameFooterMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isSameAvatarMessage = function isSameAvatarMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.sameAvatarMessageRule) { return (ref = m.params).sameAvatarMessageRule.apply(ref, args); }
      return false;
    };

    Messages.prototype.isCustomClassMessage = function isCustomClassMessage () {
      var ref;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      if (m.params.customClassMessageRule) { return (ref = m.params).customClassMessageRule.apply(ref, args); }
      return undefined;
    };

    Messages.prototype.layout = function layout () {
      var m = this;
      m.$el.find('.message, .messages-title').each(function (index, messageEl) {
        var $messageEl = $(messageEl);
        if (!m.messages) {
          m.messages = m.getMessagesData();
        }
        var classes = [];
        var message = m.messages[index];
        var previousMessage = m.messages[index - 1];
        var nextMessage = m.messages[index + 1];
        if (m.isFirstMessage(message, previousMessage, nextMessage)) {
          classes.push('message-first');
        }
        if (m.isLastMessage(message, previousMessage, nextMessage)) {
          classes.push('message-last');
        }
        if (m.isTailMessage(message, previousMessage, nextMessage)) {
          classes.push('message-tail');
        }
        if (m.isSameNameMessage(message, previousMessage, nextMessage)) {
          classes.push('message-same-name');
        }
        if (m.isSameHeaderMessage(message, previousMessage, nextMessage)) {
          classes.push('message-same-header');
        }
        if (m.isSameFooterMessage(message, previousMessage, nextMessage)) {
          classes.push('message-same-footer');
        }
        if (m.isSameAvatarMessage(message, previousMessage, nextMessage)) {
          classes.push('message-same-avatar');
        }
        var customMessageClasses = m.isCustomClassMessage(message, previousMessage, nextMessage);
        if (customMessageClasses && customMessageClasses.length) {
          if (typeof customMessageClasses === 'string') {
            customMessageClasses = customMessageClasses.split(' ');
          }
          customMessageClasses.forEach(function (customClass) {
            classes.push(customClass);
          });
        }
        $messageEl.removeClass('message-first message-last message-tail message-same-name message-same-header message-same-footer message-same-avatar');
        classes.forEach(function (className) {
          $messageEl.addClass(className);
        });
      });
    };

    Messages.prototype.clear = function clear () {
      var m = this;
      m.messages = [];
      m.$el.html('');
    };

    Messages.prototype.removeMessage = function removeMessage (messageToRemove, layout) {
      if ( layout === void 0 ) layout = true;

      var m = this;
      // Index or El
      var index;
      var $el;
      if (typeof messageToRemove === 'number') {
        index = messageToRemove;
        $el = m.$el.find('.message, .messages-title').eq(index);
      } else if (m.messages && m.messages.indexOf(messageToRemove) >= 0) {
        index = m.messages.indexOf(messageToRemove);
        $el = m.$el.children().eq(index);
      } else {
        $el = $(messageToRemove);
        index = $el.index();
      }
      if ($el.length === 0) {
        return m;
      }
      $el.remove();
      m.messages.splice(index, 1);
      if (m.params.autoLayout && layout) { m.layout(); }
      return m;
    };

    Messages.prototype.removeMessages = function removeMessages (messagesToRemove, layout) {
      if ( layout === void 0 ) layout = true;

      var m = this;
      if (Array.isArray(messagesToRemove)) {
        var messagesToRemoveEls = [];
        messagesToRemove.forEach(function (messageToRemoveIndex) {
          messagesToRemoveEls.push(m.$el.find('.message, .messages-title').eq(messageToRemoveIndex));
        });
        messagesToRemoveEls.forEach(function (messageToRemove) {
          m.removeMessage(messageToRemove, false);
        });
      } else {
        $(messagesToRemove).each(function (index, messageToRemove) {
          m.removeMessage(messageToRemove, false);
        });
      }
      if (m.params.autoLayout && layout) { m.layout(); }
      return m;
    };

    Messages.prototype.addMessage = function addMessage () {
      var assign, assign$1;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      var messageToAdd;
      var animate;
      var method;
      if (typeof args[1] === 'boolean') {
        (assign = args, messageToAdd = assign[0], animate = assign[1], method = assign[2]);
      } else {
        (assign$1 = args, messageToAdd = assign$1[0], method = assign$1[1], animate = assign$1[2]);
      }
      if (typeof animate === 'undefined') {
        animate = true;
      }
      if (typeof method === 'undefined') {
        method = m.params.newMessagesFirst ? 'prepend' : 'append';
      }

      return m.addMessages([messageToAdd], animate, method);
    };

    Messages.prototype.addMessages = function addMessages () {
      var assign, assign$1;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var m = this;
      var messagesToAdd;
      var animate;
      var method;
      if (typeof args[1] === 'boolean') {
        (assign = args, messagesToAdd = assign[0], animate = assign[1], method = assign[2]);
      } else {
        (assign$1 = args, messagesToAdd = assign$1[0], method = assign$1[1], animate = assign$1[2]);
      }
      if (typeof animate === 'undefined') {
        animate = true;
      }
      if (typeof method === 'undefined') {
        method = m.params.newMessagesFirst ? 'prepend' : 'append';
      }

      // Define scroll positions before new messages added
      var scrollHeightBefore = m.pageContentEl.scrollHeight;
      var heightBefore = m.pageContentEl.offsetHeight;
      var scrollBefore = m.pageContentEl.scrollTop;

      // Add message to DOM and data
      var messagesHTML = '';
      var typingMessage = m.messages.filter(function (el) { return el.isTyping; })[0];
      messagesToAdd.forEach(function (messageToAdd) {
        if (typingMessage) {
          if (method === 'append') {
            m.messages.splice(m.messages.indexOf(typingMessage), 0, messageToAdd);
          } else {
            m.messages.splice(m.messages.indexOf(typingMessage) + 1, 0, messageToAdd);
          }
        } else {
          m.messages[method === 'append' ? 'push' : 'unshift'](messageToAdd);
        }
        messagesHTML += m.renderMessage(messageToAdd);
      });
      var $messagesEls = $(messagesHTML);
      if (animate) {
        if (method === 'append' && !m.params.newMessagesFirst) {
          $messagesEls.addClass('message-appear-from-bottom');
        }
        if (method === 'prepend' && m.params.newMessagesFirst) {
          $messagesEls.addClass('message-appear-from-top');
        }
      }
      if (typingMessage) {
        if (method === 'append') {
          $messagesEls.insertBefore(m.$el.find('.message-typing'));
        } else {
          $messagesEls.insertAfter(m.$el.find('.message-typing'));
        }
      } else {
        m.$el[method]($messagesEls);
      }

      // Layout
      if (m.params.autoLayout) { m.layout(); }

      if (method === 'prepend' && !typingMessage) {
        m.pageContentEl.scrollTop = scrollBefore + (m.pageContentEl.scrollHeight - scrollHeightBefore);
      }

      if (m.params.scrollMessages && ((method === 'append' && !m.params.newMessagesFirst) || (method === 'prepend' && m.params.newMessagesFirst && !typingMessage))) {
        if (m.params.scrollMessagesOnEdge) {
          var onEdge = false;
          if (m.params.newMessagesFirst && scrollBefore === 0) {
            onEdge = true;
          }
          if (!m.params.newMessagesFirst && (scrollBefore - (scrollHeightBefore - heightBefore) >= -10)) {
            onEdge = true;
          }
          if (onEdge) { m.scroll(animate ? undefined : 0); }
        } else {
          m.scroll(animate ? undefined : 0);
        }
      }

      return m;
    };

    Messages.prototype.showTyping = function showTyping (message) {
      if ( message === void 0 ) message = {};

      var m = this;
      var typingMessage = m.messages.filter(function (el) { return el.isTyping; })[0];
      if (typingMessage) {
        m.removeMessage(m.messages.indexOf(typingMessage));
      }
      m.addMessage(Utils.extend({
        type: 'received',
        isTyping: true,
      }, message));
      return m;
    };

    Messages.prototype.hideTyping = function hideTyping () {
      var m = this;
      var typingMessageIndex;
      var typingFound;
      m.messages.forEach(function (message, index) {
        if (message.isTyping) { typingMessageIndex = index; }
      });
      if (typeof typingMessageIndex !== 'undefined') {
        if (m.$el.find('.message').eq(typingMessageIndex).hasClass('message-typing')) {
          typingFound = true;
          m.removeMessage(typingMessageIndex);
        }
      }
      if (!typingFound) {
        var $typingMessageEl = m.$el.find('.message-typing');
        if ($typingMessageEl.length) {
          m.removeMessage($typingMessageEl);
        }
      }
      return m;
    };

    Messages.prototype.scroll = function scroll (duration, scrollTop) {
      if ( duration === void 0 ) duration = 300;

      var m = this;
      var currentScroll = m.pageContentEl.scrollTop;
      var newScrollTop;
      if (typeof scrollTop !== 'undefined') { newScrollTop = scrollTop; }
      else {
        newScrollTop = m.params.newMessagesFirst ? 0 : m.pageContentEl.scrollHeight - m.pageContentEl.offsetHeight;
        if (newScrollTop === currentScroll) { return m; }
      }
      m.$pageContentEl.scrollTop(newScrollTop, duration);
      return m;
    };

    Messages.prototype.init = function init () {
      var m = this;
      if (!m.messages || m.messages.length === 0) {
        m.messages = m.getMessagesData();
      }
      if (m.params.messages && m.params.messages.length) {
        m.renderMessages();
      }
      if (m.params.autoLayout) { m.layout(); }
      if (m.params.scrollMessages) { m.scroll(0); }
    };

    Messages.prototype.destroy = function destroy () {
      var m = this;
      m.emit('local::beforeDestroy messagesBeforeDestroy', m);
      m.$el.trigger('messages:beforedestroy', m);
      if (m.$el[0]) {
        m.$el[0].f7Messages = null;
        delete m.$el[0].f7Messages;
      }
      Utils.deleteProps(m);
    };

    return Messages;
  }(Framework7Class));

  var Messages$1 = {
    name: 'messages',
    static: {
      Messages: Messages,
    },
    create: function create() {
      var app = this;
      app.messages = ConstructorMethods({
        defaultSelector: '.messages',
        constructor: Messages,
        app: app,
        domProp: 'f7Messages',
        addMethods: 'renderMessages layout scroll clear removeMessage removeMessages addMessage addMessages'.split(' '),
      });
    },
    on: {
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var app = this;
        $(tabEl).find('.messages-init').each(function (index, messagesEl) {
          app.messages.destroy(messagesEl);
        });
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.messages-init').each(function (index, messagesEl) {
          app.messages.create({ el: messagesEl });
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.messages-init').each(function (index, messagesEl) {
          app.messages.destroy(messagesEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.messages-init').each(function (index, messagesEl) {
          app.messages.create({ el: messagesEl });
        });
      },
    },
    vnode: {
      'messages-init': {
        insert: function insert(vnode) {
          var app = this;
          var messagesEl = vnode.elm;
          app.messages.create({ el: messagesEl });
        },
        destroy: function destroy(vnode) {
          var app = this;
          var messagesEl = vnode.elm;
          app.messages.destroy(messagesEl);
        },
      },
    },
  };

  var Messagebar = (function (Framework7Class$$1) {
    function Messagebar(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);

      var messagebar = this;

      var defaults = {
        top: false,
        topOffset: 0,
        bottomOffset: 0,
        attachments: [],
        renderAttachments: undefined,
        renderAttachment: undefined,
        maxHeight: null,
        resizePage: true,
      };

      // Extend defaults with modules params
      messagebar.useModulesParams(defaults);

      messagebar.params = Utils.extend(defaults, params);

      // El
      var $el = $(messagebar.params.el);
      if ($el.length === 0) { return messagebar; }

      if ($el[0].f7Messagebar) { return $el[0].f7Messagebar; }

      $el[0].f7Messagebar = messagebar;

      // Page and PageContent
      var $pageEl = $el.parents('.page').eq(0);
      var $pageContentEl = $pageEl.find('.page-content').eq(0);

      // Area
      var $areaEl = $el.find('.messagebar-area');

      // Textarea
      var $textareaEl;
      if (messagebar.params.textareaEl) {
        $textareaEl = $(messagebar.params.textareaEl);
      } else {
        $textareaEl = $el.find('textarea');
      }

      // Attachments & Library
      var $attachmentsEl = $el.find('.messagebar-attachments');
      var $sheetEl = $el.find('.messagebar-sheet');

      if (messagebar.params.top) {
        $el.addClass('messagebar-top');
      }

      Utils.extend(messagebar, {
        $el: $el,
        el: $el[0],
        $areaEl: $areaEl,
        areaEl: $areaEl[0],
        $textareaEl: $textareaEl,
        textareaEl: $textareaEl[0],
        $attachmentsEl: $attachmentsEl,
        attachmentsEl: $attachmentsEl[0],
        attachmentsVisible: $attachmentsEl.hasClass('messagebar-attachments-visible'),
        $sheetEl: $sheetEl,
        sheetEl: $sheetEl[0],
        sheetVisible: $sheetEl.hasClass('messagebar-sheet-visible'),
        $pageEl: $pageEl,
        pageEl: $pageEl[0],
        $pageContentEl: $pageContentEl,
        pageContentEl: $pageContentEl,
        top: $el.hasClass('messagebar-top') || messagebar.params.top,
        attachments: [],
      });

      // Events
      function onAppResize() {
        if (messagebar.params.resizePage) {
          messagebar.resizePage();
        }
      }
      function onSubmit(e) {
        e.preventDefault();
      }
      function onAttachmentClick(e) {
        var index = $(this).index();
        if ($(e.target).closest('.messagebar-attachment-delete').length) {
          $(this).trigger('messagebar:attachmentdelete', index);
          messagebar.emit('local::attachmentDelete messagebarAttachmentDelete', messagebar, this, index);
        } else {
          $(this).trigger('messagebar:attachmentclick', index);
          messagebar.emit('local::attachmentClick messagebarAttachmentClick', messagebar, this, index);
        }
      }
      function onTextareaChange() {
        messagebar.checkEmptyState();
        messagebar.$el.trigger('messagebar:change');
        messagebar.emit('local::change messagebarChange', messagebar);
      }
      function onTextareaFocus() {
        messagebar.sheetHide();
        messagebar.$el.addClass('messagebar-focused');
        messagebar.$el.trigger('messagebar:focus');
        messagebar.emit('local::focus messagebarFocus', messagebar);
      }
      function onTextareaBlur() {
        messagebar.$el.removeClass('messagebar-focused');
        messagebar.$el.trigger('messagebar:blur');
        messagebar.emit('local::blur messagebarBlur', messagebar);
      }

      messagebar.attachEvents = function attachEvents() {
        $el.on('textarea:resize', onAppResize);
        $el.on('submit', onSubmit);
        $el.on('click', '.messagebar-attachment', onAttachmentClick);
        $textareaEl.on('change input', onTextareaChange);
        $textareaEl.on('focus', onTextareaFocus);
        $textareaEl.on('blur', onTextareaBlur);
        app.on('resize', onAppResize);
      };
      messagebar.detachEvents = function detachEvents() {
        $el.off('textarea:resize', onAppResize);
        $el.off('submit', onSubmit);
        $el.off('click', '.messagebar-attachment', onAttachmentClick);
        $textareaEl.off('change input', onTextareaChange);
        $textareaEl.off('focus', onTextareaFocus);
        $textareaEl.off('blur', onTextareaBlur);
        app.off('resize', onAppResize);
      };


      // Install Modules
      messagebar.useModules();

      // Init
      messagebar.init();

      return messagebar;
    }

    if ( Framework7Class$$1 ) Messagebar.__proto__ = Framework7Class$$1;
    Messagebar.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Messagebar.prototype.constructor = Messagebar;

    Messagebar.prototype.focus = function focus () {
      var messagebar = this;
      messagebar.$textareaEl.focus();
      return messagebar;
    };

    Messagebar.prototype.blur = function blur () {
      var messagebar = this;
      messagebar.$textareaEl.blur();
      return messagebar;
    };

    Messagebar.prototype.clear = function clear () {
      var messagebar = this;
      messagebar.$textareaEl.val('').trigger('change');
      return messagebar;
    };

    Messagebar.prototype.getValue = function getValue () {
      var messagebar = this;
      return messagebar.$textareaEl.val().trim();
    };

    Messagebar.prototype.setValue = function setValue (value) {
      var messagebar = this;
      messagebar.$textareaEl.val(value).trigger('change');
      return messagebar;
    };

    Messagebar.prototype.setPlaceholder = function setPlaceholder (placeholder) {
      var messagebar = this;
      messagebar.$textareaEl.attr('placeholder', placeholder);
      return messagebar;
    };

    Messagebar.prototype.resizePage = function resizePage () {
      var messagebar = this;
      var params = messagebar.params;
      var $el = messagebar.$el;
      var top = messagebar.top;
      var $pageEl = messagebar.$pageEl;
      var $pageContentEl = messagebar.$pageContentEl;
      var $areaEl = messagebar.$areaEl;
      var $textareaEl = messagebar.$textareaEl;
      var $sheetEl = messagebar.$sheetEl;
      var $attachmentsEl = messagebar.$attachmentsEl;
      var elHeight = $el[0].offsetHeight;
      var maxHeight = params.maxHeight;
      if (top) ; else {
        var currentPaddingBottom = parseInt($pageContentEl.css('padding-bottom'), 10);
        var requiredPaddingBottom = elHeight + params.bottomOffset;
        if (requiredPaddingBottom !== currentPaddingBottom && $pageContentEl.length) {
          var currentPaddingTop = parseInt($pageContentEl.css('padding-top'), 10);
          var pageScrollHeight = $pageContentEl[0].scrollHeight;
          var pageOffsetHeight = $pageContentEl[0].offsetHeight;
          var pageScrollTop = $pageContentEl[0].scrollTop;
          var scrollOnBottom = (pageScrollTop === pageScrollHeight - pageOffsetHeight);
          if (!maxHeight) {
            maxHeight = $pageEl[0].offsetHeight - currentPaddingTop - $sheetEl.outerHeight() - $attachmentsEl.outerHeight() - parseInt($areaEl.css('margin-top'), 10) - parseInt($areaEl.css('margin-bottom'), 10);
          }
          $textareaEl.css('max-height', (maxHeight + "px"));
          $pageContentEl.css('padding-bottom', (requiredPaddingBottom + "px"));
          if (scrollOnBottom) {
            $pageContentEl.scrollTop($pageContentEl[0].scrollHeight - pageOffsetHeight);
          }
          $el.trigger('messagebar:resizepage');
          messagebar.emit('local::resizePage messagebarResizePage', messagebar);
        }
      }
    };

    Messagebar.prototype.checkEmptyState = function checkEmptyState () {
      var messagebar = this;
      var $el = messagebar.$el;
      var $textareaEl = messagebar.$textareaEl;
      var value = $textareaEl.val().trim();
      if (value && value.length) {
        $el.addClass('messagebar-with-value');
      } else {
        $el.removeClass('messagebar-with-value');
      }
    };

    Messagebar.prototype.attachmentsCreate = function attachmentsCreate (innerHTML) {
      if ( innerHTML === void 0 ) innerHTML = '';

      var messagebar = this;
      var $attachmentsEl = $(("<div class=\"messagebar-attachments\">" + innerHTML + "</div>"));
      $attachmentsEl.insertBefore(messagebar.$textareaEl);
      Utils.extend(messagebar, {
        $attachmentsEl: $attachmentsEl,
        attachmentsEl: $attachmentsEl[0],
      });
      return messagebar;
    };

    Messagebar.prototype.attachmentsShow = function attachmentsShow (innerHTML) {
      if ( innerHTML === void 0 ) innerHTML = '';

      var messagebar = this;
      messagebar.$attachmentsEl = messagebar.$el.find('.messagebar-attachments');
      if (messagebar.$attachmentsEl.length === 0) {
        messagebar.attachmentsCreate(innerHTML);
      }
      messagebar.$el.addClass('messagebar-attachments-visible');
      messagebar.attachmentsVisible = true;
      if (messagebar.params.resizePage) {
        messagebar.resizePage();
      }
      return messagebar;
    };

    Messagebar.prototype.attachmentsHide = function attachmentsHide () {
      var messagebar = this;
      messagebar.$el.removeClass('messagebar-attachments-visible');
      messagebar.attachmentsVisible = false;
      if (messagebar.params.resizePage) {
        messagebar.resizePage();
      }
      return messagebar;
    };

    Messagebar.prototype.attachmentsToggle = function attachmentsToggle () {
      var messagebar = this;
      if (messagebar.attachmentsVisible) {
        messagebar.attachmentsHide();
      } else {
        messagebar.attachmentsShow();
      }
      return messagebar;
    };

    Messagebar.prototype.renderAttachment = function renderAttachment (attachment) {
      var messagebar = this;
      if (messagebar.params.renderAttachment) {
        return messagebar.params.renderAttachment.call(messagebar, attachment);
      }
      return ("\n      <div class=\"messagebar-attachment\">\n        <img src=\"" + attachment + "\">\n        <span class=\"messagebar-attachment-delete\"></span>\n      </div>\n    ");
    };

    Messagebar.prototype.renderAttachments = function renderAttachments () {
      var messagebar = this;
      var html;
      if (messagebar.params.renderAttachments) {
        html = messagebar.params.renderAttachments.call(messagebar, messagebar.attachments);
      } else {
        html = "" + (messagebar.attachments.map(function (attachment) { return messagebar.renderAttachment(attachment); }).join(''));
      }
      if (messagebar.$attachmentsEl.length === 0) {
        messagebar.attachmentsCreate(html);
      } else {
        messagebar.$attachmentsEl.html(html);
      }
    };

    Messagebar.prototype.sheetCreate = function sheetCreate (innerHTML) {
      if ( innerHTML === void 0 ) innerHTML = '';

      var messagebar = this;
      var $sheetEl = $(("<div class=\"messagebar-sheet\">" + innerHTML + "</div>"));
      messagebar.$el.append($sheetEl);
      Utils.extend(messagebar, {
        $sheetEl: $sheetEl,
        sheetEl: $sheetEl[0],
      });
      return messagebar;
    };

    Messagebar.prototype.sheetShow = function sheetShow (innerHTML) {
      if ( innerHTML === void 0 ) innerHTML = '';

      var messagebar = this;
      messagebar.$sheetEl = messagebar.$el.find('.messagebar-sheet');
      if (messagebar.$sheetEl.length === 0) {
        messagebar.sheetCreate(innerHTML);
      }
      messagebar.$el.addClass('messagebar-sheet-visible');
      messagebar.sheetVisible = true;
      if (messagebar.params.resizePage) {
        messagebar.resizePage();
      }
      return messagebar;
    };

    Messagebar.prototype.sheetHide = function sheetHide () {
      var messagebar = this;
      messagebar.$el.removeClass('messagebar-sheet-visible');
      messagebar.sheetVisible = false;
      if (messagebar.params.resizePage) {
        messagebar.resizePage();
      }
      return messagebar;
    };

    Messagebar.prototype.sheetToggle = function sheetToggle () {
      var messagebar = this;
      if (messagebar.sheetVisible) {
        messagebar.sheetHide();
      } else {
        messagebar.sheetShow();
      }
      return messagebar;
    };

    Messagebar.prototype.init = function init () {
      var messagebar = this;
      messagebar.attachEvents();
      messagebar.checkEmptyState();
      return messagebar;
    };

    Messagebar.prototype.destroy = function destroy () {
      var messagebar = this;
      messagebar.emit('local::beforeDestroy messagebarBeforeDestroy', messagebar);
      messagebar.$el.trigger('messagebar:beforedestroy', messagebar);
      messagebar.detachEvents();
      if (messagebar.$el[0]) {
        messagebar.$el[0].f7Messagebar = null;
        delete messagebar.$el[0].f7Messagebar;
      }
      Utils.deleteProps(messagebar);
    };

    return Messagebar;
  }(Framework7Class));

  var Messagebar$1 = {
    name: 'messagebar',
    static: {
      Messagebar: Messagebar,
    },
    create: function create() {
      var app = this;
      app.messagebar = ConstructorMethods({
        defaultSelector: '.messagebar',
        constructor: Messagebar,
        app: app,
        domProp: 'f7Messagebar',
        addMethods: 'clear getValue setValue setPlaceholder resizePage focus blur attachmentsCreate attachmentsShow attachmentsHide attachmentsToggle renderAttachments sheetCreate sheetShow sheetHide sheetToggle'.split(' '),
      });
    },
    on: {
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var app = this;
        $(tabEl).find('.messagebar-init').each(function (index, messagebarEl) {
          app.messagebar.destroy(messagebarEl);
        });
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.messagebar-init').each(function (index, messagebarEl) {
          app.messagebar.create(Utils.extend({ el: messagebarEl }, $(messagebarEl).dataset()));
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.messagebar-init').each(function (index, messagebarEl) {
          app.messagebar.destroy(messagebarEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.messagebar-init').each(function (index, messagebarEl) {
          app.messagebar.create(Utils.extend({ el: messagebarEl }, $(messagebarEl).dataset()));
        });
      },
    },
    vnode: {
      'messagebar-init': {
        insert: function insert(vnode) {
          var app = this;
          var messagebarEl = vnode.elm;
          app.messagebar.create(Utils.extend({ el: messagebarEl }, $(messagebarEl).dataset()));
        },
        destroy: function destroy(vnode) {
          var app = this;
          var messagebarEl = vnode.elm;
          app.messagebar.destroy(messagebarEl);
        },
      },
    },
  };

  function updateSize () {
    var swiper = this;
    var width;
    var height;
    var $el = swiper.$el;
    if (typeof swiper.params.width !== 'undefined') {
      width = swiper.params.width;
    } else {
      width = $el[0].clientWidth;
    }
    if (typeof swiper.params.height !== 'undefined') {
      height = swiper.params.height;
    } else {
      height = $el[0].clientHeight;
    }
    if ((width === 0 && swiper.isHorizontal()) || (height === 0 && swiper.isVertical())) {
      return;
    }

    // Subtract paddings
    width = width - parseInt($el.css('padding-left'), 10) - parseInt($el.css('padding-right'), 10);
    height = height - parseInt($el.css('padding-top'), 10) - parseInt($el.css('padding-bottom'), 10);

    Utils.extend(swiper, {
      width: width,
      height: height,
      size: swiper.isHorizontal() ? width : height,
    });
  }

  function updateSlides () {
    var swiper = this;
    var params = swiper.params;

    var $wrapperEl = swiper.$wrapperEl;
    var swiperSize = swiper.size;
    var rtl = swiper.rtlTranslate;
    var wrongRTL = swiper.wrongRTL;
    var isVirtual = swiper.virtual && params.virtual.enabled;
    var previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
    var slides = $wrapperEl.children(("." + (swiper.params.slideClass)));
    var slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
    var snapGrid = [];
    var slidesGrid = [];
    var slidesSizesGrid = [];

    var offsetBefore = params.slidesOffsetBefore;
    if (typeof offsetBefore === 'function') {
      offsetBefore = params.slidesOffsetBefore.call(swiper);
    }

    var offsetAfter = params.slidesOffsetAfter;
    if (typeof offsetAfter === 'function') {
      offsetAfter = params.slidesOffsetAfter.call(swiper);
    }

    var previousSnapGridLength = swiper.snapGrid.length;
    var previousSlidesGridLength = swiper.snapGrid.length;

    var spaceBetween = params.spaceBetween;
    var slidePosition = -offsetBefore;
    var prevSlideSize = 0;
    var index = 0;
    if (typeof swiperSize === 'undefined') {
      return;
    }
    if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
      spaceBetween = (parseFloat(spaceBetween.replace('%', '')) / 100) * swiperSize;
    }

    swiper.virtualSize = -spaceBetween;

    // reset margins
    if (rtl) { slides.css({ marginLeft: '', marginTop: '' }); }
    else { slides.css({ marginRight: '', marginBottom: '' }); }

    var slidesNumberEvenToRows;
    if (params.slidesPerColumn > 1) {
      if (Math.floor(slidesLength / params.slidesPerColumn) === slidesLength / swiper.params.slidesPerColumn) {
        slidesNumberEvenToRows = slidesLength;
      } else {
        slidesNumberEvenToRows = Math.ceil(slidesLength / params.slidesPerColumn) * params.slidesPerColumn;
      }
      if (params.slidesPerView !== 'auto' && params.slidesPerColumnFill === 'row') {
        slidesNumberEvenToRows = Math.max(slidesNumberEvenToRows, params.slidesPerView * params.slidesPerColumn);
      }
    }

    // Calc slides
    var slideSize;
    var slidesPerColumn = params.slidesPerColumn;
    var slidesPerRow = slidesNumberEvenToRows / slidesPerColumn;
    var numFullColumns = slidesPerRow - ((params.slidesPerColumn * slidesPerRow) - slidesLength);
    for (var i = 0; i < slidesLength; i += 1) {
      slideSize = 0;
      var slide = slides.eq(i);
      if (params.slidesPerColumn > 1) {
        // Set slides order
        var newSlideOrderIndex = (void 0);
        var column = (void 0);
        var row = (void 0);
        if (params.slidesPerColumnFill === 'column') {
          column = Math.floor(i / slidesPerColumn);
          row = i - (column * slidesPerColumn);
          if (column > numFullColumns || (column === numFullColumns && row === slidesPerColumn - 1)) {
            row += 1;
            if (row >= slidesPerColumn) {
              row = 0;
              column += 1;
            }
          }
          newSlideOrderIndex = column + ((row * slidesNumberEvenToRows) / slidesPerColumn);
          slide
            .css({
              '-webkit-box-ordinal-group': newSlideOrderIndex,
              '-moz-box-ordinal-group': newSlideOrderIndex,
              '-ms-flex-order': newSlideOrderIndex,
              '-webkit-order': newSlideOrderIndex,
              order: newSlideOrderIndex,
            });
        } else {
          row = Math.floor(i / slidesPerRow);
          column = i - (row * slidesPerRow);
        }
        slide
          .css(
            ("margin-" + (swiper.isHorizontal() ? 'top' : 'left')),
            (row !== 0 && params.spaceBetween) && (((params.spaceBetween) + "px"))
          )
          .attr('data-swiper-column', column)
          .attr('data-swiper-row', row);
      }
      if (slide.css('display') === 'none') { continue; } // eslint-disable-line

      if (params.slidesPerView === 'auto') {
        var slideStyles = win.getComputedStyle(slide[0], null);
        var currentTransform = slide[0].style.transform;
        var currentWebKitTransform = slide[0].style.webkitTransform;
        if (currentTransform) {
          slide[0].style.transform = 'none';
        }
        if (currentWebKitTransform) {
          slide[0].style.webkitTransform = 'none';
        }
        if (swiper.isHorizontal()) {
          slideSize = slide[0].getBoundingClientRect().width
            + parseFloat(slideStyles.getPropertyValue('margin-left'))
            + parseFloat(slideStyles.getPropertyValue('margin-right'));
        } else {
          slideSize = slide[0].getBoundingClientRect().height
            + parseFloat(slideStyles.getPropertyValue('margin-top'))
            + parseFloat(slideStyles.getPropertyValue('margin-bottom'));
        }
        if (currentTransform) {
          slide[0].style.transform = currentTransform;
        }
        if (currentWebKitTransform) {
          slide[0].style.webkitTransform = currentWebKitTransform;
        }
        if (params.roundLengths) { slideSize = Math.floor(slideSize); }
      } else {
        slideSize = (swiperSize - ((params.slidesPerView - 1) * spaceBetween)) / params.slidesPerView;
        if (params.roundLengths) { slideSize = Math.floor(slideSize); }

        if (slides[i]) {
          if (swiper.isHorizontal()) {
            slides[i].style.width = slideSize + "px";
          } else {
            slides[i].style.height = slideSize + "px";
          }
        }
      }
      if (slides[i]) {
        slides[i].swiperSlideSize = slideSize;
      }
      slidesSizesGrid.push(slideSize);


      if (params.centeredSlides) {
        slidePosition = slidePosition + (slideSize / 2) + (prevSlideSize / 2) + spaceBetween;
        if (prevSlideSize === 0 && i !== 0) { slidePosition = slidePosition - (swiperSize / 2) - spaceBetween; }
        if (i === 0) { slidePosition = slidePosition - (swiperSize / 2) - spaceBetween; }
        if (Math.abs(slidePosition) < 1 / 1000) { slidePosition = 0; }
        if (params.roundLengths) { slidePosition = Math.floor(slidePosition); }
        if ((index) % params.slidesPerGroup === 0) { snapGrid.push(slidePosition); }
        slidesGrid.push(slidePosition);
      } else {
        if (params.roundLengths) { slidePosition = Math.floor(slidePosition); }
        if ((index) % params.slidesPerGroup === 0) { snapGrid.push(slidePosition); }
        slidesGrid.push(slidePosition);
        slidePosition = slidePosition + slideSize + spaceBetween;
      }

      swiper.virtualSize += slideSize + spaceBetween;

      prevSlideSize = slideSize;

      index += 1;
    }
    swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
    var newSlidesGrid;

    if (
      rtl && wrongRTL && (params.effect === 'slide' || params.effect === 'coverflow')) {
      $wrapperEl.css({ width: ((swiper.virtualSize + params.spaceBetween) + "px") });
    }
    if (!Support.flexbox || params.setWrapperSize) {
      if (swiper.isHorizontal()) { $wrapperEl.css({ width: ((swiper.virtualSize + params.spaceBetween) + "px") }); }
      else { $wrapperEl.css({ height: ((swiper.virtualSize + params.spaceBetween) + "px") }); }
    }

    if (params.slidesPerColumn > 1) {
      swiper.virtualSize = (slideSize + params.spaceBetween) * slidesNumberEvenToRows;
      swiper.virtualSize = Math.ceil(swiper.virtualSize / params.slidesPerColumn) - params.spaceBetween;
      if (swiper.isHorizontal()) { $wrapperEl.css({ width: ((swiper.virtualSize + params.spaceBetween) + "px") }); }
      else { $wrapperEl.css({ height: ((swiper.virtualSize + params.spaceBetween) + "px") }); }
      if (params.centeredSlides) {
        newSlidesGrid = [];
        for (var i$1 = 0; i$1 < snapGrid.length; i$1 += 1) {
          var slidesGridItem = snapGrid[i$1];
          if (params.roundLengths) { slidesGridItem = Math.floor(slidesGridItem); }
          if (snapGrid[i$1] < swiper.virtualSize + snapGrid[0]) { newSlidesGrid.push(slidesGridItem); }
        }
        snapGrid = newSlidesGrid;
      }
    }

    // Remove last grid elements depending on width
    if (!params.centeredSlides) {
      newSlidesGrid = [];
      for (var i$2 = 0; i$2 < snapGrid.length; i$2 += 1) {
        var slidesGridItem$1 = snapGrid[i$2];
        if (params.roundLengths) { slidesGridItem$1 = Math.floor(slidesGridItem$1); }
        if (snapGrid[i$2] <= swiper.virtualSize - swiperSize) {
          newSlidesGrid.push(slidesGridItem$1);
        }
      }
      snapGrid = newSlidesGrid;
      if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
        snapGrid.push(swiper.virtualSize - swiperSize);
      }
    }
    if (snapGrid.length === 0) { snapGrid = [0]; }

    if (params.spaceBetween !== 0) {
      if (swiper.isHorizontal()) {
        if (rtl) { slides.css({ marginLeft: (spaceBetween + "px") }); }
        else { slides.css({ marginRight: (spaceBetween + "px") }); }
      } else { slides.css({ marginBottom: (spaceBetween + "px") }); }
    }

    Utils.extend(swiper, {
      slides: slides,
      snapGrid: snapGrid,
      slidesGrid: slidesGrid,
      slidesSizesGrid: slidesSizesGrid,
    });

    if (slidesLength !== previousSlidesLength) {
      swiper.emit('slidesLengthChange');
    }
    if (snapGrid.length !== previousSnapGridLength) {
      if (swiper.params.watchOverflow) { swiper.checkOverflow(); }
      swiper.emit('snapGridLengthChange');
    }
    if (slidesGrid.length !== previousSlidesGridLength) {
      swiper.emit('slidesGridLengthChange');
    }

    if (params.watchSlidesProgress || params.watchSlidesVisibility) {
      swiper.updateSlidesOffset();
    }
  }

  function updateAutoHeight (speed) {
    var swiper = this;
    var activeSlides = [];
    var newHeight = 0;
    var i;
    if (typeof speed === 'number') {
      swiper.setTransition(speed);
    } else if (speed === true) {
      swiper.setTransition(swiper.params.speed);
    }
    // Find slides currently in view
    if (swiper.params.slidesPerView !== 'auto' && swiper.params.slidesPerView > 1) {
      for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
        var index = swiper.activeIndex + i;
        if (index > swiper.slides.length) { break; }
        activeSlides.push(swiper.slides.eq(index)[0]);
      }
    } else {
      activeSlides.push(swiper.slides.eq(swiper.activeIndex)[0]);
    }

    // Find new height from highest slide in view
    for (i = 0; i < activeSlides.length; i += 1) {
      if (typeof activeSlides[i] !== 'undefined') {
        var height = activeSlides[i].offsetHeight;
        newHeight = height > newHeight ? height : newHeight;
      }
    }

    // Update Height
    if (newHeight) { swiper.$wrapperEl.css('height', (newHeight + "px")); }
  }

  function updateSlidesOffset () {
    var swiper = this;
    var slides = swiper.slides;
    for (var i = 0; i < slides.length; i += 1) {
      slides[i].swiperSlideOffset = swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop;
    }
  }

  function updateSlidesProgress (translate) {
    if ( translate === void 0 ) translate = (this && this.translate) || 0;

    var swiper = this;
    var params = swiper.params;

    var slides = swiper.slides;
    var rtl = swiper.rtlTranslate;

    if (slides.length === 0) { return; }
    if (typeof slides[0].swiperSlideOffset === 'undefined') { swiper.updateSlidesOffset(); }

    var offsetCenter = -translate;
    if (rtl) { offsetCenter = translate; }

    // Visible Slides
    slides.removeClass(params.slideVisibleClass);

    for (var i = 0; i < slides.length; i += 1) {
      var slide = slides[i];
      var slideProgress = (
        (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0)) - slide.swiperSlideOffset
      ) / (slide.swiperSlideSize + params.spaceBetween);
      if (params.watchSlidesVisibility) {
        var slideBefore = -(offsetCenter - slide.swiperSlideOffset);
        var slideAfter = slideBefore + swiper.slidesSizesGrid[i];
        var isVisible = (slideBefore >= 0 && slideBefore < swiper.size)
                  || (slideAfter > 0 && slideAfter <= swiper.size)
                  || (slideBefore <= 0 && slideAfter >= swiper.size);
        if (isVisible) {
          slides.eq(i).addClass(params.slideVisibleClass);
        }
      }
      slide.progress = rtl ? -slideProgress : slideProgress;
    }
  }

  function updateProgress (translate) {
    if ( translate === void 0 ) translate = (this && this.translate) || 0;

    var swiper = this;
    var params = swiper.params;

    var translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
    var progress = swiper.progress;
    var isBeginning = swiper.isBeginning;
    var isEnd = swiper.isEnd;
    var wasBeginning = isBeginning;
    var wasEnd = isEnd;
    if (translatesDiff === 0) {
      progress = 0;
      isBeginning = true;
      isEnd = true;
    } else {
      progress = (translate - swiper.minTranslate()) / (translatesDiff);
      isBeginning = progress <= 0;
      isEnd = progress >= 1;
    }
    Utils.extend(swiper, {
      progress: progress,
      isBeginning: isBeginning,
      isEnd: isEnd,
    });

    if (params.watchSlidesProgress || params.watchSlidesVisibility) { swiper.updateSlidesProgress(translate); }

    if (isBeginning && !wasBeginning) {
      swiper.emit('reachBeginning toEdge');
    }
    if (isEnd && !wasEnd) {
      swiper.emit('reachEnd toEdge');
    }
    if ((wasBeginning && !isBeginning) || (wasEnd && !isEnd)) {
      swiper.emit('fromEdge');
    }

    swiper.emit('progress', progress);
  }

  function updateSlidesClasses () {
    var swiper = this;

    var slides = swiper.slides;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;
    var activeIndex = swiper.activeIndex;
    var realIndex = swiper.realIndex;
    var isVirtual = swiper.virtual && params.virtual.enabled;

    slides.removeClass(((params.slideActiveClass) + " " + (params.slideNextClass) + " " + (params.slidePrevClass) + " " + (params.slideDuplicateActiveClass) + " " + (params.slideDuplicateNextClass) + " " + (params.slideDuplicatePrevClass)));

    var activeSlide;
    if (isVirtual) {
      activeSlide = swiper.$wrapperEl.find(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + activeIndex + "\"]"));
    } else {
      activeSlide = slides.eq(activeIndex);
    }

    // Active classes
    activeSlide.addClass(params.slideActiveClass);

    if (params.loop) {
      // Duplicate to all looped slides
      if (activeSlide.hasClass(params.slideDuplicateClass)) {
        $wrapperEl
          .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + realIndex + "\"]"))
          .addClass(params.slideDuplicateActiveClass);
      } else {
        $wrapperEl
          .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]"))
          .addClass(params.slideDuplicateActiveClass);
      }
    }
    // Next Slide
    var nextSlide = activeSlide.nextAll(("." + (params.slideClass))).eq(0).addClass(params.slideNextClass);
    if (params.loop && nextSlide.length === 0) {
      nextSlide = slides.eq(0);
      nextSlide.addClass(params.slideNextClass);
    }
    // Prev Slide
    var prevSlide = activeSlide.prevAll(("." + (params.slideClass))).eq(0).addClass(params.slidePrevClass);
    if (params.loop && prevSlide.length === 0) {
      prevSlide = slides.eq(-1);
      prevSlide.addClass(params.slidePrevClass);
    }
    if (params.loop) {
      // Duplicate to all looped slides
      if (nextSlide.hasClass(params.slideDuplicateClass)) {
        $wrapperEl
          .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + (nextSlide.attr('data-swiper-slide-index')) + "\"]"))
          .addClass(params.slideDuplicateNextClass);
      } else {
        $wrapperEl
          .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + (nextSlide.attr('data-swiper-slide-index')) + "\"]"))
          .addClass(params.slideDuplicateNextClass);
      }
      if (prevSlide.hasClass(params.slideDuplicateClass)) {
        $wrapperEl
          .children(("." + (params.slideClass) + ":not(." + (params.slideDuplicateClass) + ")[data-swiper-slide-index=\"" + (prevSlide.attr('data-swiper-slide-index')) + "\"]"))
          .addClass(params.slideDuplicatePrevClass);
      } else {
        $wrapperEl
          .children(("." + (params.slideClass) + "." + (params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + (prevSlide.attr('data-swiper-slide-index')) + "\"]"))
          .addClass(params.slideDuplicatePrevClass);
      }
    }
  }

  function updateActiveIndex (newActiveIndex) {
    var swiper = this;
    var translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
    var slidesGrid = swiper.slidesGrid;
    var snapGrid = swiper.snapGrid;
    var params = swiper.params;
    var previousIndex = swiper.activeIndex;
    var previousRealIndex = swiper.realIndex;
    var previousSnapIndex = swiper.snapIndex;
    var activeIndex = newActiveIndex;
    var snapIndex;
    if (typeof activeIndex === 'undefined') {
      for (var i = 0; i < slidesGrid.length; i += 1) {
        if (typeof slidesGrid[i + 1] !== 'undefined') {
          if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1] - ((slidesGrid[i + 1] - slidesGrid[i]) / 2)) {
            activeIndex = i;
          } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
            activeIndex = i + 1;
          }
        } else if (translate >= slidesGrid[i]) {
          activeIndex = i;
        }
      }
      // Normalize slideIndex
      if (params.normalizeSlideIndex) {
        if (activeIndex < 0 || typeof activeIndex === 'undefined') { activeIndex = 0; }
      }
    }
    if (snapGrid.indexOf(translate) >= 0) {
      snapIndex = snapGrid.indexOf(translate);
    } else {
      snapIndex = Math.floor(activeIndex / params.slidesPerGroup);
    }
    if (snapIndex >= snapGrid.length) { snapIndex = snapGrid.length - 1; }
    if (activeIndex === previousIndex) {
      if (snapIndex !== previousSnapIndex) {
        swiper.snapIndex = snapIndex;
        swiper.emit('snapIndexChange');
      }
      return;
    }

    // Get real index
    var realIndex = parseInt(swiper.slides.eq(activeIndex).attr('data-swiper-slide-index') || activeIndex, 10);

    Utils.extend(swiper, {
      snapIndex: snapIndex,
      realIndex: realIndex,
      previousIndex: previousIndex,
      activeIndex: activeIndex,
    });
    swiper.emit('activeIndexChange');
    swiper.emit('snapIndexChange');
    if (previousRealIndex !== realIndex) {
      swiper.emit('realIndexChange');
    }
    swiper.emit('slideChange');
  }

  function updateClickedSlide (e) {
    var swiper = this;
    var params = swiper.params;
    var slide = $(e.target).closest(("." + (params.slideClass)))[0];
    var slideFound = false;
    if (slide) {
      for (var i = 0; i < swiper.slides.length; i += 1) {
        if (swiper.slides[i] === slide) { slideFound = true; }
      }
    }

    if (slide && slideFound) {
      swiper.clickedSlide = slide;
      if (swiper.virtual && swiper.params.virtual.enabled) {
        swiper.clickedIndex = parseInt($(slide).attr('data-swiper-slide-index'), 10);
      } else {
        swiper.clickedIndex = $(slide).index();
      }
    } else {
      swiper.clickedSlide = undefined;
      swiper.clickedIndex = undefined;
      return;
    }
    if (params.slideToClickedSlide && swiper.clickedIndex !== undefined && swiper.clickedIndex !== swiper.activeIndex) {
      swiper.slideToClickedSlide();
    }
  }

  var update = {
    updateSize: updateSize,
    updateSlides: updateSlides,
    updateAutoHeight: updateAutoHeight,
    updateSlidesOffset: updateSlidesOffset,
    updateSlidesProgress: updateSlidesProgress,
    updateProgress: updateProgress,
    updateSlidesClasses: updateSlidesClasses,
    updateActiveIndex: updateActiveIndex,
    updateClickedSlide: updateClickedSlide,
  };

  function getTranslate (axis) {
    if ( axis === void 0 ) axis = this.isHorizontal() ? 'x' : 'y';

    var swiper = this;

    var params = swiper.params;
    var rtl = swiper.rtlTranslate;
    var translate = swiper.translate;
    var $wrapperEl = swiper.$wrapperEl;

    if (params.virtualTranslate) {
      return rtl ? -translate : translate;
    }

    var currentTranslate = Utils.getTranslate($wrapperEl[0], axis);
    if (rtl) { currentTranslate = -currentTranslate; }

    return currentTranslate || 0;
  }

  function setTranslate (translate, byController) {
    var swiper = this;
    var rtl = swiper.rtlTranslate;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;
    var progress = swiper.progress;
    var x = 0;
    var y = 0;
    var z = 0;

    if (swiper.isHorizontal()) {
      x = rtl ? -translate : translate;
    } else {
      y = translate;
    }

    if (params.roundLengths) {
      x = Math.floor(x);
      y = Math.floor(y);
    }

    if (!params.virtualTranslate) {
      if (Support.transforms3d) { $wrapperEl.transform(("translate3d(" + x + "px, " + y + "px, " + z + "px)")); }
      else { $wrapperEl.transform(("translate(" + x + "px, " + y + "px)")); }
    }
    swiper.previousTranslate = swiper.translate;
    swiper.translate = swiper.isHorizontal() ? x : y;

    // Check if we need to update progress
    var newProgress;
    var translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
    if (translatesDiff === 0) {
      newProgress = 0;
    } else {
      newProgress = (translate - swiper.minTranslate()) / (translatesDiff);
    }
    if (newProgress !== progress) {
      swiper.updateProgress(translate);
    }

    swiper.emit('setTranslate', swiper.translate, byController);
  }

  function minTranslate () {
    return (-this.snapGrid[0]);
  }

  function maxTranslate () {
    return (-this.snapGrid[this.snapGrid.length - 1]);
  }

  var translate = {
    getTranslate: getTranslate,
    setTranslate: setTranslate,
    minTranslate: minTranslate,
    maxTranslate: maxTranslate,
  };

  function setTransition (duration, byController) {
    var swiper = this;

    swiper.$wrapperEl.transition(duration);

    swiper.emit('setTransition', duration, byController);
  }

  function transitionStart (runCallbacks, direction) {
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var activeIndex = swiper.activeIndex;
    var params = swiper.params;
    var previousIndex = swiper.previousIndex;
    if (params.autoHeight) {
      swiper.updateAutoHeight();
    }

    var dir = direction;
    if (!dir) {
      if (activeIndex > previousIndex) { dir = 'next'; }
      else if (activeIndex < previousIndex) { dir = 'prev'; }
      else { dir = 'reset'; }
    }

    swiper.emit('transitionStart');

    if (runCallbacks && activeIndex !== previousIndex) {
      if (dir === 'reset') {
        swiper.emit('slideResetTransitionStart');
        return;
      }
      swiper.emit('slideChangeTransitionStart');
      if (dir === 'next') {
        swiper.emit('slideNextTransitionStart');
      } else {
        swiper.emit('slidePrevTransitionStart');
      }
    }
  }

  function transitionEnd$1 (runCallbacks, direction) {
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var activeIndex = swiper.activeIndex;
    var previousIndex = swiper.previousIndex;
    swiper.animating = false;
    swiper.setTransition(0);

    var dir = direction;
    if (!dir) {
      if (activeIndex > previousIndex) { dir = 'next'; }
      else if (activeIndex < previousIndex) { dir = 'prev'; }
      else { dir = 'reset'; }
    }

    swiper.emit('transitionEnd');

    if (runCallbacks && activeIndex !== previousIndex) {
      if (dir === 'reset') {
        swiper.emit('slideResetTransitionEnd');
        return;
      }
      swiper.emit('slideChangeTransitionEnd');
      if (dir === 'next') {
        swiper.emit('slideNextTransitionEnd');
      } else {
        swiper.emit('slidePrevTransitionEnd');
      }
    }
  }

  var transition$1 = {
    setTransition: setTransition,
    transitionStart: transitionStart,
    transitionEnd: transitionEnd$1,
  };

  function slideTo (index, speed, runCallbacks, internal) {
    if ( index === void 0 ) index = 0;
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var slideIndex = index;
    if (slideIndex < 0) { slideIndex = 0; }

    var params = swiper.params;
    var snapGrid = swiper.snapGrid;
    var slidesGrid = swiper.slidesGrid;
    var previousIndex = swiper.previousIndex;
    var activeIndex = swiper.activeIndex;
    var rtl = swiper.rtlTranslate;
    if (swiper.animating && params.preventInteractionOnTransition) {
      return false;
    }

    var snapIndex = Math.floor(slideIndex / params.slidesPerGroup);
    if (snapIndex >= snapGrid.length) { snapIndex = snapGrid.length - 1; }

    if ((activeIndex || params.initialSlide || 0) === (previousIndex || 0) && runCallbacks) {
      swiper.emit('beforeSlideChangeStart');
    }

    var translate = -snapGrid[snapIndex];

    // Update progress
    swiper.updateProgress(translate);

    // Normalize slideIndex
    if (params.normalizeSlideIndex) {
      for (var i = 0; i < slidesGrid.length; i += 1) {
        if (-Math.floor(translate * 100) >= Math.floor(slidesGrid[i] * 100)) {
          slideIndex = i;
        }
      }
    }
    // Directions locks
    if (swiper.initialized && slideIndex !== activeIndex) {
      if (!swiper.allowSlideNext && translate < swiper.translate && translate < swiper.minTranslate()) {
        return false;
      }
      if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
        if ((activeIndex || 0) !== slideIndex) { return false; }
      }
    }

    var direction;
    if (slideIndex > activeIndex) { direction = 'next'; }
    else if (slideIndex < activeIndex) { direction = 'prev'; }
    else { direction = 'reset'; }


    // Update Index
    if ((rtl && -translate === swiper.translate) || (!rtl && translate === swiper.translate)) {
      swiper.updateActiveIndex(slideIndex);
      // Update Height
      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }
      swiper.updateSlidesClasses();
      if (params.effect !== 'slide') {
        swiper.setTranslate(translate);
      }
      if (direction !== 'reset') {
        swiper.transitionStart(runCallbacks, direction);
        swiper.transitionEnd(runCallbacks, direction);
      }
      return false;
    }

    if (speed === 0 || !Support.transition) {
      swiper.setTransition(0);
      swiper.setTranslate(translate);
      swiper.updateActiveIndex(slideIndex);
      swiper.updateSlidesClasses();
      swiper.emit('beforeTransitionStart', speed, internal);
      swiper.transitionStart(runCallbacks, direction);
      swiper.transitionEnd(runCallbacks, direction);
    } else {
      swiper.setTransition(speed);
      swiper.setTranslate(translate);
      swiper.updateActiveIndex(slideIndex);
      swiper.updateSlidesClasses();
      swiper.emit('beforeTransitionStart', speed, internal);
      swiper.transitionStart(runCallbacks, direction);
      if (!swiper.animating) {
        swiper.animating = true;
        if (!swiper.onSlideToWrapperTransitionEnd) {
          swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
            if (!swiper || swiper.destroyed) { return; }
            if (e.target !== this) { return; }
            swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
            swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
            swiper.onSlideToWrapperTransitionEnd = null;
            delete swiper.onSlideToWrapperTransitionEnd;
            swiper.transitionEnd(runCallbacks, direction);
          };
        }
        swiper.$wrapperEl[0].addEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
        swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.onSlideToWrapperTransitionEnd);
      }
    }

    return true;
  }

  function slideToLoop (index, speed, runCallbacks, internal) {
    if ( index === void 0 ) index = 0;
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var newIndex = index;
    if (swiper.params.loop) {
      newIndex += swiper.loopedSlides;
    }

    return swiper.slideTo(newIndex, speed, runCallbacks, internal);
  }

  /* eslint no-unused-vars: "off" */
  function slideNext (speed, runCallbacks, internal) {
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var params = swiper.params;
    var animating = swiper.animating;
    if (params.loop) {
      if (animating) { return false; }
      swiper.loopFix();
      // eslint-disable-next-line
      swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
      return swiper.slideTo(swiper.activeIndex + params.slidesPerGroup, speed, runCallbacks, internal);
    }
    return swiper.slideTo(swiper.activeIndex + params.slidesPerGroup, speed, runCallbacks, internal);
  }

  /* eslint no-unused-vars: "off" */
  function slidePrev (speed, runCallbacks, internal) {
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var params = swiper.params;
    var animating = swiper.animating;
    var snapGrid = swiper.snapGrid;
    var slidesGrid = swiper.slidesGrid;
    var rtlTranslate = swiper.rtlTranslate;

    if (params.loop) {
      if (animating) { return false; }
      swiper.loopFix();
      // eslint-disable-next-line
      swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
    }
    var translate = rtlTranslate ? swiper.translate : -swiper.translate;
    function normalize(val) {
      if (val < 0) { return -Math.floor(Math.abs(val)); }
      return Math.floor(val);
    }
    var normalizedTranslate = normalize(translate);
    var normalizedSnapGrid = snapGrid.map(function (val) { return normalize(val); });
    var normalizedSlidesGrid = slidesGrid.map(function (val) { return normalize(val); });

    var currentSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate)];
    var prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
    var prevIndex;
    if (typeof prevSnap !== 'undefined') {
      prevIndex = slidesGrid.indexOf(prevSnap);
      if (prevIndex < 0) { prevIndex = swiper.activeIndex - 1; }
    }
    return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
  }

  /* eslint no-unused-vars: "off" */
  function slideReset (speed, runCallbacks, internal) {
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
  }

  /* eslint no-unused-vars: "off" */
  function slideToClosest (speed, runCallbacks, internal) {
    if ( speed === void 0 ) speed = this.params.speed;
    if ( runCallbacks === void 0 ) runCallbacks = true;

    var swiper = this;
    var index = swiper.activeIndex;
    var snapIndex = Math.floor(index / swiper.params.slidesPerGroup);

    if (snapIndex < swiper.snapGrid.length - 1) {
      var translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;

      var currentSnap = swiper.snapGrid[snapIndex];
      var nextSnap = swiper.snapGrid[snapIndex + 1];

      if ((translate - currentSnap) > (nextSnap - currentSnap) / 2) {
        index = swiper.params.slidesPerGroup;
      }
    }

    return swiper.slideTo(index, speed, runCallbacks, internal);
  }

  function slideToClickedSlide () {
    var swiper = this;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;

    var slidesPerView = params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : params.slidesPerView;
    var slideToIndex = swiper.clickedIndex;
    var realIndex;
    if (params.loop) {
      if (swiper.animating) { return; }
      realIndex = parseInt($(swiper.clickedSlide).attr('data-swiper-slide-index'), 10);
      if (params.centeredSlides) {
        if (
          (slideToIndex < swiper.loopedSlides - (slidesPerView / 2))
          || (slideToIndex > (swiper.slides.length - swiper.loopedSlides) + (slidesPerView / 2))
        ) {
          swiper.loopFix();
          slideToIndex = $wrapperEl
            .children(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]:not(." + (params.slideDuplicateClass) + ")"))
            .eq(0)
            .index();

          Utils.nextTick(function () {
            swiper.slideTo(slideToIndex);
          });
        } else {
          swiper.slideTo(slideToIndex);
        }
      } else if (slideToIndex > swiper.slides.length - slidesPerView) {
        swiper.loopFix();
        slideToIndex = $wrapperEl
          .children(("." + (params.slideClass) + "[data-swiper-slide-index=\"" + realIndex + "\"]:not(." + (params.slideDuplicateClass) + ")"))
          .eq(0)
          .index();

        Utils.nextTick(function () {
          swiper.slideTo(slideToIndex);
        });
      } else {
        swiper.slideTo(slideToIndex);
      }
    } else {
      swiper.slideTo(slideToIndex);
    }
  }

  var slide = {
    slideTo: slideTo,
    slideToLoop: slideToLoop,
    slideNext: slideNext,
    slidePrev: slidePrev,
    slideReset: slideReset,
    slideToClosest: slideToClosest,
    slideToClickedSlide: slideToClickedSlide,
  };

  function loopCreate () {
    var swiper = this;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;
    // Remove duplicated slides
    $wrapperEl.children(("." + (params.slideClass) + "." + (params.slideDuplicateClass))).remove();

    var slides = $wrapperEl.children(("." + (params.slideClass)));

    if (params.loopFillGroupWithBlank) {
      var blankSlidesNum = params.slidesPerGroup - (slides.length % params.slidesPerGroup);
      if (blankSlidesNum !== params.slidesPerGroup) {
        for (var i = 0; i < blankSlidesNum; i += 1) {
          var blankNode = $(doc.createElement('div')).addClass(((params.slideClass) + " " + (params.slideBlankClass)));
          $wrapperEl.append(blankNode);
        }
        slides = $wrapperEl.children(("." + (params.slideClass)));
      }
    }

    if (params.slidesPerView === 'auto' && !params.loopedSlides) { params.loopedSlides = slides.length; }

    swiper.loopedSlides = parseInt(params.loopedSlides || params.slidesPerView, 10);
    swiper.loopedSlides += params.loopAdditionalSlides;
    if (swiper.loopedSlides > slides.length) {
      swiper.loopedSlides = slides.length;
    }

    var prependSlides = [];
    var appendSlides = [];
    slides.each(function (index, el) {
      var slide = $(el);
      if (index < swiper.loopedSlides) { appendSlides.push(el); }
      if (index < slides.length && index >= slides.length - swiper.loopedSlides) { prependSlides.push(el); }
      slide.attr('data-swiper-slide-index', index);
    });
    for (var i$1 = 0; i$1 < appendSlides.length; i$1 += 1) {
      $wrapperEl.append($(appendSlides[i$1].cloneNode(true)).addClass(params.slideDuplicateClass));
    }
    for (var i$2 = prependSlides.length - 1; i$2 >= 0; i$2 -= 1) {
      $wrapperEl.prepend($(prependSlides[i$2].cloneNode(true)).addClass(params.slideDuplicateClass));
    }
  }

  function loopFix () {
    var swiper = this;
    var params = swiper.params;
    var activeIndex = swiper.activeIndex;
    var slides = swiper.slides;
    var loopedSlides = swiper.loopedSlides;
    var allowSlidePrev = swiper.allowSlidePrev;
    var allowSlideNext = swiper.allowSlideNext;
    var snapGrid = swiper.snapGrid;
    var rtl = swiper.rtlTranslate;
    var newIndex;
    swiper.allowSlidePrev = true;
    swiper.allowSlideNext = true;

    var snapTranslate = -snapGrid[activeIndex];
    var diff = snapTranslate - swiper.getTranslate();


    // Fix For Negative Oversliding
    if (activeIndex < loopedSlides) {
      newIndex = (slides.length - (loopedSlides * 3)) + activeIndex;
      newIndex += loopedSlides;
      var slideChanged = swiper.slideTo(newIndex, 0, false, true);
      if (slideChanged && diff !== 0) {
        swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
      }
    } else if ((params.slidesPerView === 'auto' && activeIndex >= loopedSlides * 2) || (activeIndex >= slides.length - loopedSlides)) {
      // Fix For Positive Oversliding
      newIndex = -slides.length + activeIndex + loopedSlides;
      newIndex += loopedSlides;
      var slideChanged$1 = swiper.slideTo(newIndex, 0, false, true);
      if (slideChanged$1 && diff !== 0) {
        swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
      }
    }
    swiper.allowSlidePrev = allowSlidePrev;
    swiper.allowSlideNext = allowSlideNext;
  }

  function loopDestroy () {
    var swiper = this;
    var $wrapperEl = swiper.$wrapperEl;
    var params = swiper.params;
    var slides = swiper.slides;
    $wrapperEl.children(("." + (params.slideClass) + "." + (params.slideDuplicateClass))).remove();
    slides.removeAttr('data-swiper-slide-index');
  }

  var loop = {
    loopCreate: loopCreate,
    loopFix: loopFix,
    loopDestroy: loopDestroy,
  };

  function setGrabCursor (moving) {
    var swiper = this;
    if (Support.touch || !swiper.params.simulateTouch || (swiper.params.watchOverflow && swiper.isLocked)) { return; }
    var el = swiper.el;
    el.style.cursor = 'move';
    el.style.cursor = moving ? '-webkit-grabbing' : '-webkit-grab';
    el.style.cursor = moving ? '-moz-grabbin' : '-moz-grab';
    el.style.cursor = moving ? 'grabbing' : 'grab';
  }

  function unsetGrabCursor () {
    var swiper = this;
    if (Support.touch || (swiper.params.watchOverflow && swiper.isLocked)) { return; }
    swiper.el.style.cursor = '';
  }

  var grabCursor = {
    setGrabCursor: setGrabCursor,
    unsetGrabCursor: unsetGrabCursor,
  };

  function appendSlide (slides) {
    var swiper = this;
    var $wrapperEl = swiper.$wrapperEl;
    var params = swiper.params;
    if (params.loop) {
      swiper.loopDestroy();
    }
    if (typeof slides === 'object' && 'length' in slides) {
      for (var i = 0; i < slides.length; i += 1) {
        if (slides[i]) { $wrapperEl.append(slides[i]); }
      }
    } else {
      $wrapperEl.append(slides);
    }
    if (params.loop) {
      swiper.loopCreate();
    }
    if (!(params.observer && Support.observer)) {
      swiper.update();
    }
  }

  function prependSlide (slides) {
    var swiper = this;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;
    var activeIndex = swiper.activeIndex;

    if (params.loop) {
      swiper.loopDestroy();
    }
    var newActiveIndex = activeIndex + 1;
    if (typeof slides === 'object' && 'length' in slides) {
      for (var i = 0; i < slides.length; i += 1) {
        if (slides[i]) { $wrapperEl.prepend(slides[i]); }
      }
      newActiveIndex = activeIndex + slides.length;
    } else {
      $wrapperEl.prepend(slides);
    }
    if (params.loop) {
      swiper.loopCreate();
    }
    if (!(params.observer && Support.observer)) {
      swiper.update();
    }
    swiper.slideTo(newActiveIndex, 0, false);
  }

  function addSlide (index, slides) {
    var swiper = this;
    var $wrapperEl = swiper.$wrapperEl;
    var params = swiper.params;
    var activeIndex = swiper.activeIndex;
    var activeIndexBuffer = activeIndex;
    if (params.loop) {
      activeIndexBuffer -= swiper.loopedSlides;
      swiper.loopDestroy();
      swiper.slides = $wrapperEl.children(("." + (params.slideClass)));
    }
    var baseLength = swiper.slides.length;
    if (index <= 0) {
      swiper.prependSlide(slides);
      return;
    }
    if (index >= baseLength) {
      swiper.appendSlide(slides);
      return;
    }
    var newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + 1 : activeIndexBuffer;

    var slidesBuffer = [];
    for (var i = baseLength - 1; i >= index; i -= 1) {
      var currentSlide = swiper.slides.eq(i);
      currentSlide.remove();
      slidesBuffer.unshift(currentSlide);
    }

    if (typeof slides === 'object' && 'length' in slides) {
      for (var i$1 = 0; i$1 < slides.length; i$1 += 1) {
        if (slides[i$1]) { $wrapperEl.append(slides[i$1]); }
      }
      newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + slides.length : activeIndexBuffer;
    } else {
      $wrapperEl.append(slides);
    }

    for (var i$2 = 0; i$2 < slidesBuffer.length; i$2 += 1) {
      $wrapperEl.append(slidesBuffer[i$2]);
    }

    if (params.loop) {
      swiper.loopCreate();
    }
    if (!(params.observer && Support.observer)) {
      swiper.update();
    }
    if (params.loop) {
      swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
    } else {
      swiper.slideTo(newActiveIndex, 0, false);
    }
  }

  function removeSlide (slidesIndexes) {
    var swiper = this;
    var params = swiper.params;
    var $wrapperEl = swiper.$wrapperEl;
    var activeIndex = swiper.activeIndex;

    var activeIndexBuffer = activeIndex;
    if (params.loop) {
      activeIndexBuffer -= swiper.loopedSlides;
      swiper.loopDestroy();
      swiper.slides = $wrapperEl.children(("." + (params.slideClass)));
    }
    var newActiveIndex = activeIndexBuffer;
    var indexToRemove;

    if (typeof slidesIndexes === 'object' && 'length' in slidesIndexes) {
      for (var i = 0; i < slidesIndexes.length; i += 1) {
        indexToRemove = slidesIndexes[i];
        if (swiper.slides[indexToRemove]) { swiper.slides.eq(indexToRemove).remove(); }
        if (indexToRemove < newActiveIndex) { newActiveIndex -= 1; }
      }
      newActiveIndex = Math.max(newActiveIndex, 0);
    } else {
      indexToRemove = slidesIndexes;
      if (swiper.slides[indexToRemove]) { swiper.slides.eq(indexToRemove).remove(); }
      if (indexToRemove < newActiveIndex) { newActiveIndex -= 1; }
      newActiveIndex = Math.max(newActiveIndex, 0);
    }

    if (params.loop) {
      swiper.loopCreate();
    }

    if (!(params.observer && Support.observer)) {
      swiper.update();
    }
    if (params.loop) {
      swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
    } else {
      swiper.slideTo(newActiveIndex, 0, false);
    }
  }

  function removeAllSlides () {
    var swiper = this;

    var slidesIndexes = [];
    for (var i = 0; i < swiper.slides.length; i += 1) {
      slidesIndexes.push(i);
    }
    swiper.removeSlide(slidesIndexes);
  }

  var manipulation = {
    appendSlide: appendSlide,
    prependSlide: prependSlide,
    addSlide: addSlide,
    removeSlide: removeSlide,
    removeAllSlides: removeAllSlides,
  };

  function onTouchStart (event) {
    var swiper = this;
    var data = swiper.touchEventsData;
    var params = swiper.params;
    var touches = swiper.touches;
    if (swiper.animating && params.preventInteractionOnTransition) {
      return;
    }
    var e = event;
    if (e.originalEvent) { e = e.originalEvent; }
    data.isTouchEvent = e.type === 'touchstart';
    if (!data.isTouchEvent && 'which' in e && e.which === 3) { return; }
    if (data.isTouched && data.isMoved) { return; }
    if (params.noSwiping && $(e.target).closest(params.noSwipingSelector ? params.noSwipingSelector : ("." + (params.noSwipingClass)))[0]) {
      swiper.allowClick = true;
      return;
    }
    if (params.swipeHandler) {
      if (!$(e).closest(params.swipeHandler)[0]) { return; }
    }

    touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
    touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
    var startX = touches.currentX;
    var startY = touches.currentY;

    // Do NOT start if iOS edge swipe is detected. Otherwise iOS app (UIWebView) cannot swipe-to-go-back anymore

    var edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
    var edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;
    if (
      edgeSwipeDetection
      && ((startX <= edgeSwipeThreshold)
      || (startX >= win.screen.width - edgeSwipeThreshold))
    ) {
      return;
    }

    Utils.extend(data, {
      isTouched: true,
      isMoved: false,
      allowTouchCallbacks: true,
      isScrolling: undefined,
      startMoving: undefined,
    });

    touches.startX = startX;
    touches.startY = startY;
    data.touchStartTime = Utils.now();
    swiper.allowClick = true;
    swiper.updateSize();
    swiper.swipeDirection = undefined;
    if (params.threshold > 0) { data.allowThresholdMove = false; }
    if (e.type !== 'touchstart') {
      var preventDefault = true;
      if ($(e.target).is(data.formElements)) { preventDefault = false; }
      if (
        doc.activeElement
        && $(doc.activeElement).is(data.formElements)
        && doc.activeElement !== e.target
      ) {
        doc.activeElement.blur();
      }
      if (preventDefault && swiper.allowTouchMove) {
        e.preventDefault();
      }
    }
    swiper.emit('touchStart', e);
  }

  function onTouchMove (event) {
    var swiper = this;
    var data = swiper.touchEventsData;
    var params = swiper.params;
    var touches = swiper.touches;
    var rtl = swiper.rtlTranslate;
    var e = event;
    if (e.originalEvent) { e = e.originalEvent; }
    if (!data.isTouched) {
      if (data.startMoving && data.isScrolling) {
        swiper.emit('touchMoveOpposite', e);
      }
      return;
    }
    if (data.isTouchEvent && e.type === 'mousemove') { return; }
    var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
    if (e.preventedByNestedSwiper) {
      touches.startX = pageX;
      touches.startY = pageY;
      return;
    }
    if (!swiper.allowTouchMove) {
      // isMoved = true;
      swiper.allowClick = false;
      if (data.isTouched) {
        Utils.extend(touches, {
          startX: pageX,
          startY: pageY,
          currentX: pageX,
          currentY: pageY,
        });
        data.touchStartTime = Utils.now();
      }
      return;
    }
    if (data.isTouchEvent && params.touchReleaseOnEdges && !params.loop) {
      if (swiper.isVertical()) {
        // Vertical
        if (
          (pageY < touches.startY && swiper.translate <= swiper.maxTranslate())
          || (pageY > touches.startY && swiper.translate >= swiper.minTranslate())
        ) {
          data.isTouched = false;
          data.isMoved = false;
          return;
        }
      } else if (
        (pageX < touches.startX && swiper.translate <= swiper.maxTranslate())
        || (pageX > touches.startX && swiper.translate >= swiper.minTranslate())
      ) {
        return;
      }
    }
    if (data.isTouchEvent && doc.activeElement) {
      if (e.target === doc.activeElement && $(e.target).is(data.formElements)) {
        data.isMoved = true;
        swiper.allowClick = false;
        return;
      }
    }
    if (data.allowTouchCallbacks) {
      swiper.emit('touchMove', e);
    }
    if (e.targetTouches && e.targetTouches.length > 1) { return; }

    touches.currentX = pageX;
    touches.currentY = pageY;

    var diffX = touches.currentX - touches.startX;
    var diffY = touches.currentY - touches.startY;
    if (swiper.params.threshold && Math.sqrt((Math.pow( diffX, 2 )) + (Math.pow( diffY, 2 ))) < swiper.params.threshold) { return; }

    if (typeof data.isScrolling === 'undefined') {
      var touchAngle;
      if ((swiper.isHorizontal() && touches.currentY === touches.startY) || (swiper.isVertical() && touches.currentX === touches.startX)) {
        data.isScrolling = false;
      } else {
        // eslint-disable-next-line
        if ((diffX * diffX) + (diffY * diffY) >= 25) {
          touchAngle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI;
          data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : (90 - touchAngle > params.touchAngle);
        }
      }
    }
    if (data.isScrolling) {
      swiper.emit('touchMoveOpposite', e);
    }
    if (typeof data.startMoving === 'undefined') {
      if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
        data.startMoving = true;
      }
    }
    if (data.isScrolling) {
      data.isTouched = false;
      return;
    }
    if (!data.startMoving) {
      return;
    }
    swiper.allowClick = false;
    e.preventDefault();
    if (params.touchMoveStopPropagation && !params.nested) {
      e.stopPropagation();
    }

    if (!data.isMoved) {
      if (params.loop) {
        swiper.loopFix();
      }
      data.startTranslate = swiper.getTranslate();
      swiper.setTransition(0);
      if (swiper.animating) {
        swiper.$wrapperEl.trigger('webkitTransitionEnd transitionend');
      }
      data.allowMomentumBounce = false;
      // Grab Cursor
      if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
        swiper.setGrabCursor(true);
      }
      swiper.emit('sliderFirstMove', e);
    }
    swiper.emit('sliderMove', e);
    data.isMoved = true;

    var diff = swiper.isHorizontal() ? diffX : diffY;
    touches.diff = diff;

    diff *= params.touchRatio;
    if (rtl) { diff = -diff; }

    swiper.swipeDirection = diff > 0 ? 'prev' : 'next';
    data.currentTranslate = diff + data.startTranslate;

    var disableParentSwiper = true;
    var resistanceRatio = params.resistanceRatio;
    if (params.touchReleaseOnEdges) {
      resistanceRatio = 0;
    }
    if ((diff > 0 && data.currentTranslate > swiper.minTranslate())) {
      disableParentSwiper = false;
      if (params.resistance) { data.currentTranslate = (swiper.minTranslate() - 1) + (Math.pow( (-swiper.minTranslate() + data.startTranslate + diff), resistanceRatio )); }
    } else if (diff < 0 && data.currentTranslate < swiper.maxTranslate()) {
      disableParentSwiper = false;
      if (params.resistance) { data.currentTranslate = (swiper.maxTranslate() + 1) - (Math.pow( (swiper.maxTranslate() - data.startTranslate - diff), resistanceRatio )); }
    }

    if (disableParentSwiper) {
      e.preventedByNestedSwiper = true;
    }

    // Directions locks
    if (!swiper.allowSlideNext && swiper.swipeDirection === 'next' && data.currentTranslate < data.startTranslate) {
      data.currentTranslate = data.startTranslate;
    }
    if (!swiper.allowSlidePrev && swiper.swipeDirection === 'prev' && data.currentTranslate > data.startTranslate) {
      data.currentTranslate = data.startTranslate;
    }


    // Threshold
    if (params.threshold > 0) {
      if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
        if (!data.allowThresholdMove) {
          data.allowThresholdMove = true;
          touches.startX = touches.currentX;
          touches.startY = touches.currentY;
          data.currentTranslate = data.startTranslate;
          touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
          return;
        }
      } else {
        data.currentTranslate = data.startTranslate;
        return;
      }
    }

    if (!params.followFinger) { return; }

    // Update active index in free mode
    if (params.freeMode || params.watchSlidesProgress || params.watchSlidesVisibility) {
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    }
    if (params.freeMode) {
      // Velocity
      if (data.velocities.length === 0) {
        data.velocities.push({
          position: touches[swiper.isHorizontal() ? 'startX' : 'startY'],
          time: data.touchStartTime,
        });
      }
      data.velocities.push({
        position: touches[swiper.isHorizontal() ? 'currentX' : 'currentY'],
        time: Utils.now(),
      });
    }
    // Update progress
    swiper.updateProgress(data.currentTranslate);
    // Update translate
    swiper.setTranslate(data.currentTranslate);
  }

  function onTouchEnd (event) {
    var swiper = this;
    var data = swiper.touchEventsData;

    var params = swiper.params;
    var touches = swiper.touches;
    var rtl = swiper.rtlTranslate;
    var $wrapperEl = swiper.$wrapperEl;
    var slidesGrid = swiper.slidesGrid;
    var snapGrid = swiper.snapGrid;
    var e = event;
    if (e.originalEvent) { e = e.originalEvent; }
    if (data.allowTouchCallbacks) {
      swiper.emit('touchEnd', e);
    }
    data.allowTouchCallbacks = false;
    if (!data.isTouched) {
      if (data.isMoved && params.grabCursor) {
        swiper.setGrabCursor(false);
      }
      data.isMoved = false;
      data.startMoving = false;
      return;
    }
    // Return Grab Cursor
    if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
      swiper.setGrabCursor(false);
    }

    // Time diff
    var touchEndTime = Utils.now();
    var timeDiff = touchEndTime - data.touchStartTime;

    // Tap, doubleTap, Click
    if (swiper.allowClick) {
      swiper.updateClickedSlide(e);
      swiper.emit('tap', e);
      if (timeDiff < 300 && (touchEndTime - data.lastClickTime) > 300) {
        if (data.clickTimeout) { clearTimeout(data.clickTimeout); }
        data.clickTimeout = Utils.nextTick(function () {
          if (!swiper || swiper.destroyed) { return; }
          swiper.emit('click', e);
        }, 300);
      }
      if (timeDiff < 300 && (touchEndTime - data.lastClickTime) < 300) {
        if (data.clickTimeout) { clearTimeout(data.clickTimeout); }
        swiper.emit('doubleTap', e);
      }
    }

    data.lastClickTime = Utils.now();
    Utils.nextTick(function () {
      if (!swiper.destroyed) { swiper.allowClick = true; }
    });

    if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 || data.currentTranslate === data.startTranslate) {
      data.isTouched = false;
      data.isMoved = false;
      data.startMoving = false;
      return;
    }
    data.isTouched = false;
    data.isMoved = false;
    data.startMoving = false;

    var currentPos;
    if (params.followFinger) {
      currentPos = rtl ? swiper.translate : -swiper.translate;
    } else {
      currentPos = -data.currentTranslate;
    }

    if (params.freeMode) {
      if (currentPos < -swiper.minTranslate()) {
        swiper.slideTo(swiper.activeIndex);
        return;
      }
      if (currentPos > -swiper.maxTranslate()) {
        if (swiper.slides.length < snapGrid.length) {
          swiper.slideTo(snapGrid.length - 1);
        } else {
          swiper.slideTo(swiper.slides.length - 1);
        }
        return;
      }

      if (params.freeModeMomentum) {
        if (data.velocities.length > 1) {
          var lastMoveEvent = data.velocities.pop();
          var velocityEvent = data.velocities.pop();

          var distance = lastMoveEvent.position - velocityEvent.position;
          var time = lastMoveEvent.time - velocityEvent.time;
          swiper.velocity = distance / time;
          swiper.velocity /= 2;
          if (Math.abs(swiper.velocity) < params.freeModeMinimumVelocity) {
            swiper.velocity = 0;
          }
          // this implies that the user stopped moving a finger then released.
          // There would be no events with distance zero, so the last event is stale.
          if (time > 150 || (Utils.now() - lastMoveEvent.time) > 300) {
            swiper.velocity = 0;
          }
        } else {
          swiper.velocity = 0;
        }
        swiper.velocity *= params.freeModeMomentumVelocityRatio;

        data.velocities.length = 0;
        var momentumDuration = 1000 * params.freeModeMomentumRatio;
        var momentumDistance = swiper.velocity * momentumDuration;

        var newPosition = swiper.translate + momentumDistance;
        if (rtl) { newPosition = -newPosition; }

        var doBounce = false;
        var afterBouncePosition;
        var bounceAmount = Math.abs(swiper.velocity) * 20 * params.freeModeMomentumBounceRatio;
        var needsLoopFix;
        if (newPosition < swiper.maxTranslate()) {
          if (params.freeModeMomentumBounce) {
            if (newPosition + swiper.maxTranslate() < -bounceAmount) {
              newPosition = swiper.maxTranslate() - bounceAmount;
            }
            afterBouncePosition = swiper.maxTranslate();
            doBounce = true;
            data.allowMomentumBounce = true;
          } else {
            newPosition = swiper.maxTranslate();
          }
          if (params.loop && params.centeredSlides) { needsLoopFix = true; }
        } else if (newPosition > swiper.minTranslate()) {
          if (params.freeModeMomentumBounce) {
            if (newPosition - swiper.minTranslate() > bounceAmount) {
              newPosition = swiper.minTranslate() + bounceAmount;
            }
            afterBouncePosition = swiper.minTranslate();
            doBounce = true;
            data.allowMomentumBounce = true;
          } else {
            newPosition = swiper.minTranslate();
          }
          if (params.loop && params.centeredSlides) { needsLoopFix = true; }
        } else if (params.freeModeSticky) {
          var nextSlide;
          for (var j = 0; j < snapGrid.length; j += 1) {
            if (snapGrid[j] > -newPosition) {
              nextSlide = j;
              break;
            }
          }

          if (Math.abs(snapGrid[nextSlide] - newPosition) < Math.abs(snapGrid[nextSlide - 1] - newPosition) || swiper.swipeDirection === 'next') {
            newPosition = snapGrid[nextSlide];
          } else {
            newPosition = snapGrid[nextSlide - 1];
          }
          newPosition = -newPosition;
        }
        if (needsLoopFix) {
          swiper.once('transitionEnd', function () {
            swiper.loopFix();
          });
        }
        // Fix duration
        if (swiper.velocity !== 0) {
          if (rtl) {
            momentumDuration = Math.abs((-newPosition - swiper.translate) / swiper.velocity);
          } else {
            momentumDuration = Math.abs((newPosition - swiper.translate) / swiper.velocity);
          }
        } else if (params.freeModeSticky) {
          swiper.slideToClosest();
          return;
        }

        if (params.freeModeMomentumBounce && doBounce) {
          swiper.updateProgress(afterBouncePosition);
          swiper.setTransition(momentumDuration);
          swiper.setTranslate(newPosition);
          swiper.transitionStart(true, swiper.swipeDirection);
          swiper.animating = true;
          $wrapperEl.transitionEnd(function () {
            if (!swiper || swiper.destroyed || !data.allowMomentumBounce) { return; }
            swiper.emit('momentumBounce');

            swiper.setTransition(params.speed);
            swiper.setTranslate(afterBouncePosition);
            $wrapperEl.transitionEnd(function () {
              if (!swiper || swiper.destroyed) { return; }
              swiper.transitionEnd();
            });
          });
        } else if (swiper.velocity) {
          swiper.updateProgress(newPosition);
          swiper.setTransition(momentumDuration);
          swiper.setTranslate(newPosition);
          swiper.transitionStart(true, swiper.swipeDirection);
          if (!swiper.animating) {
            swiper.animating = true;
            $wrapperEl.transitionEnd(function () {
              if (!swiper || swiper.destroyed) { return; }
              swiper.transitionEnd();
            });
          }
        } else {
          swiper.updateProgress(newPosition);
        }

        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      } else if (params.freeModeSticky) {
        swiper.slideToClosest();
        return;
      }

      if (!params.freeModeMomentum || timeDiff >= params.longSwipesMs) {
        swiper.updateProgress();
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      return;
    }

    // Find current slide
    var stopIndex = 0;
    var groupSize = swiper.slidesSizesGrid[0];
    for (var i = 0; i < slidesGrid.length; i += params.slidesPerGroup) {
      if (typeof slidesGrid[i + params.slidesPerGroup] !== 'undefined') {
        if (currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + params.slidesPerGroup]) {
          stopIndex = i;
          groupSize = slidesGrid[i + params.slidesPerGroup] - slidesGrid[i];
        }
      } else if (currentPos >= slidesGrid[i]) {
        stopIndex = i;
        groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
      }
    }

    // Find current slide size
    var ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;

    if (timeDiff > params.longSwipesMs) {
      // Long touches
      if (!params.longSwipes) {
        swiper.slideTo(swiper.activeIndex);
        return;
      }
      if (swiper.swipeDirection === 'next') {
        if (ratio >= params.longSwipesRatio) { swiper.slideTo(stopIndex + params.slidesPerGroup); }
        else { swiper.slideTo(stopIndex); }
      }
      if (swiper.swipeDirection === 'prev') {
        if (ratio > (1 - params.longSwipesRatio)) { swiper.slideTo(stopIndex + params.slidesPerGroup); }
        else { swiper.slideTo(stopIndex); }
      }
    } else {
      // Short swipes
      if (!params.shortSwipes) {
        swiper.slideTo(swiper.activeIndex);
        return;
      }
      if (swiper.swipeDirection === 'next') {
        swiper.slideTo(stopIndex + params.slidesPerGroup);
      }
      if (swiper.swipeDirection === 'prev') {
        swiper.slideTo(stopIndex);
      }
    }
  }

  function onResize () {
    var swiper = this;

    var params = swiper.params;
    var el = swiper.el;

    if (el && el.offsetWidth === 0) { return; }

    // Breakpoints
    if (params.breakpoints) {
      swiper.setBreakpoint();
    }

    // Save locks
    var allowSlideNext = swiper.allowSlideNext;
    var allowSlidePrev = swiper.allowSlidePrev;
    var snapGrid = swiper.snapGrid;

    // Disable locks on resize
    swiper.allowSlideNext = true;
    swiper.allowSlidePrev = true;

    swiper.updateSize();
    swiper.updateSlides();

    if (params.freeMode) {
      var newTranslate = Math.min(Math.max(swiper.translate, swiper.maxTranslate()), swiper.minTranslate());
      swiper.setTranslate(newTranslate);
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();

      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }
    } else {
      swiper.updateSlidesClasses();
      if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
        swiper.slideTo(swiper.slides.length - 1, 0, false, true);
      } else {
        swiper.slideTo(swiper.activeIndex, 0, false, true);
      }
    }
    // Return locks after resize
    swiper.allowSlidePrev = allowSlidePrev;
    swiper.allowSlideNext = allowSlideNext;

    if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
      swiper.checkOverflow();
    }
  }

  function onClick (e) {
    var swiper = this;
    if (!swiper.allowClick) {
      if (swiper.params.preventClicks) { e.preventDefault(); }
      if (swiper.params.preventClicksPropagation && swiper.animating) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }
  }

  function attachEvents() {
    var swiper = this;
    var params = swiper.params;
    var touchEvents = swiper.touchEvents;
    var el = swiper.el;
    var wrapperEl = swiper.wrapperEl;

    {
      swiper.onTouchStart = onTouchStart.bind(swiper);
      swiper.onTouchMove = onTouchMove.bind(swiper);
      swiper.onTouchEnd = onTouchEnd.bind(swiper);
    }

    swiper.onClick = onClick.bind(swiper);

    var target = params.touchEventsTarget === 'container' ? el : wrapperEl;
    var capture = !!params.nested;

    // Touch Events
    {
      if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
        target.addEventListener(touchEvents.start, swiper.onTouchStart, false);
        doc.addEventListener(touchEvents.move, swiper.onTouchMove, capture);
        doc.addEventListener(touchEvents.end, swiper.onTouchEnd, false);
      } else {
        if (Support.touch) {
          var passiveListener = touchEvents.start === 'touchstart' && Support.passiveListener && params.passiveListeners ? { passive: true, capture: false } : false;
          target.addEventListener(touchEvents.start, swiper.onTouchStart, passiveListener);
          target.addEventListener(touchEvents.move, swiper.onTouchMove, Support.passiveListener ? { passive: false, capture: capture } : capture);
          target.addEventListener(touchEvents.end, swiper.onTouchEnd, passiveListener);
        }
        if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
          target.addEventListener('mousedown', swiper.onTouchStart, false);
          doc.addEventListener('mousemove', swiper.onTouchMove, capture);
          doc.addEventListener('mouseup', swiper.onTouchEnd, false);
        }
      }
      // Prevent Links Clicks
      if (params.preventClicks || params.preventClicksPropagation) {
        target.addEventListener('click', swiper.onClick, true);
      }
    }

    // Resize handler
    swiper.on((Device.ios || Device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate'), onResize, true);
  }

  function detachEvents() {
    var swiper = this;

    var params = swiper.params;
    var touchEvents = swiper.touchEvents;
    var el = swiper.el;
    var wrapperEl = swiper.wrapperEl;

    var target = params.touchEventsTarget === 'container' ? el : wrapperEl;
    var capture = !!params.nested;

    // Touch Events
    {
      if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
        target.removeEventListener(touchEvents.start, swiper.onTouchStart, false);
        doc.removeEventListener(touchEvents.move, swiper.onTouchMove, capture);
        doc.removeEventListener(touchEvents.end, swiper.onTouchEnd, false);
      } else {
        if (Support.touch) {
          var passiveListener = touchEvents.start === 'onTouchStart' && Support.passiveListener && params.passiveListeners ? { passive: true, capture: false } : false;
          target.removeEventListener(touchEvents.start, swiper.onTouchStart, passiveListener);
          target.removeEventListener(touchEvents.move, swiper.onTouchMove, capture);
          target.removeEventListener(touchEvents.end, swiper.onTouchEnd, passiveListener);
        }
        if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
          target.removeEventListener('mousedown', swiper.onTouchStart, false);
          doc.removeEventListener('mousemove', swiper.onTouchMove, capture);
          doc.removeEventListener('mouseup', swiper.onTouchEnd, false);
        }
      }
      // Prevent Links Clicks
      if (params.preventClicks || params.preventClicksPropagation) {
        target.removeEventListener('click', swiper.onClick, true);
      }
    }

    // Resize handler
    swiper.off((Device.ios || Device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate'), onResize);
  }

  var events = {
    attachEvents: attachEvents,
    detachEvents: detachEvents,
  };

  function setBreakpoint () {
    var swiper = this;
    var activeIndex = swiper.activeIndex;
    var initialized = swiper.initialized;
    var loopedSlides = swiper.loopedSlides; if ( loopedSlides === void 0 ) loopedSlides = 0;
    var params = swiper.params;
    var breakpoints = params.breakpoints;
    if (!breakpoints || (breakpoints && Object.keys(breakpoints).length === 0)) { return; }
    // Set breakpoint for window width and update parameters
    var breakpoint = swiper.getBreakpoint(breakpoints);
    if (breakpoint && swiper.currentBreakpoint !== breakpoint) {
      var breakPointsParams = breakpoint in breakpoints ? breakpoints[breakpoint] : swiper.originalParams;
      var needsReLoop = params.loop && (breakPointsParams.slidesPerView !== params.slidesPerView);

      Utils.extend(swiper.params, breakPointsParams);

      Utils.extend(swiper, {
        allowTouchMove: swiper.params.allowTouchMove,
        allowSlideNext: swiper.params.allowSlideNext,
        allowSlidePrev: swiper.params.allowSlidePrev,
      });

      swiper.currentBreakpoint = breakpoint;

      if (needsReLoop && initialized) {
        swiper.loopDestroy();
        swiper.loopCreate();
        swiper.updateSlides();
        swiper.slideTo((activeIndex - loopedSlides) + swiper.loopedSlides, 0, false);
      }
      swiper.emit('breakpoint', breakPointsParams);
    }
  }

  function getBreakpoint (breakpoints) {
    // Get breakpoint for window width
    if (!breakpoints) { return undefined; }
    var breakpoint = false;
    var points = [];
    Object.keys(breakpoints).forEach(function (point) {
      points.push(point);
    });
    points.sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
    for (var i = 0; i < points.length; i += 1) {
      var point = points[i];
      if (point >= win.innerWidth && !breakpoint) {
        breakpoint = point;
      }
    }
    return breakpoint || 'max';
  }

  var breakpoints = { setBreakpoint: setBreakpoint, getBreakpoint: getBreakpoint };

  var Browser = (function Browser() {
    function isSafari() {
      var ua = win.navigator.userAgent.toLowerCase();
      return (ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0);
    }
    return {
      isIE: !!win.navigator.userAgent.match(/Trident/g) || !!win.navigator.userAgent.match(/MSIE/g),
      isSafari: isSafari(),
      isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(win.navigator.userAgent),
    };
  }());

  function addClasses () {
    var swiper = this;
    var classNames = swiper.classNames;
    var params = swiper.params;
    var rtl = swiper.rtl;
    var $el = swiper.$el;
    var suffixes = [];

    suffixes.push(params.direction);

    if (params.freeMode) {
      suffixes.push('free-mode');
    }
    if (!Support.flexbox) {
      suffixes.push('no-flexbox');
    }
    if (params.autoHeight) {
      suffixes.push('autoheight');
    }
    if (rtl) {
      suffixes.push('rtl');
    }
    if (params.slidesPerColumn > 1) {
      suffixes.push('multirow');
    }
    if (Device.android) {
      suffixes.push('android');
    }
    if (Device.ios) {
      suffixes.push('ios');
    }
    // WP8 Touch Events Fix
    if (Browser.isIE && (Support.pointerEvents || Support.prefixedPointerEvents)) {
      suffixes.push(("wp8-" + (params.direction)));
    }

    suffixes.forEach(function (suffix) {
      classNames.push(params.containerModifierClass + suffix);
    });

    $el.addClass(classNames.join(' '));
  }

  function removeClasses () {
    var swiper = this;
    var $el = swiper.$el;
    var classNames = swiper.classNames;

    $el.removeClass(classNames.join(' '));
  }

  var classes = { addClasses: addClasses, removeClasses: removeClasses };

  function loadImage (imageEl, src, srcset, sizes, checkForComplete, callback) {
    var image;
    function onReady() {
      if (callback) { callback(); }
    }
    if (!imageEl.complete || !checkForComplete) {
      if (src) {
        image = new win.Image();
        image.onload = onReady;
        image.onerror = onReady;
        if (sizes) {
          image.sizes = sizes;
        }
        if (srcset) {
          image.srcset = srcset;
        }
        if (src) {
          image.src = src;
        }
      } else {
        onReady();
      }
    } else {
      // image already loaded...
      onReady();
    }
  }

  function preloadImages () {
    var swiper = this;
    swiper.imagesToLoad = swiper.$el.find('img');
    function onReady() {
      if (typeof swiper === 'undefined' || swiper === null || !swiper || swiper.destroyed) { return; }
      if (swiper.imagesLoaded !== undefined) { swiper.imagesLoaded += 1; }
      if (swiper.imagesLoaded === swiper.imagesToLoad.length) {
        if (swiper.params.updateOnImagesReady) { swiper.update(); }
        swiper.emit('imagesReady');
      }
    }
    for (var i = 0; i < swiper.imagesToLoad.length; i += 1) {
      var imageEl = swiper.imagesToLoad[i];
      swiper.loadImage(
        imageEl,
        imageEl.currentSrc || imageEl.getAttribute('src'),
        imageEl.srcset || imageEl.getAttribute('srcset'),
        imageEl.sizes || imageEl.getAttribute('sizes'),
        true,
        onReady
      );
    }
  }

  var images = {
    loadImage: loadImage,
    preloadImages: preloadImages,
  };

  function checkOverflow() {
    var swiper = this;
    var wasLocked = swiper.isLocked;

    swiper.isLocked = swiper.snapGrid.length === 1;
    swiper.allowSlideNext = !swiper.isLocked;
    swiper.allowSlidePrev = !swiper.isLocked;

    // events
    if (wasLocked !== swiper.isLocked) { swiper.emit(swiper.isLocked ? 'lock' : 'unlock'); }

    if (wasLocked && wasLocked !== swiper.isLocked) {
      swiper.isEnd = false;
      swiper.navigation.update();
    }
  }

  var checkOverflow$1 = { checkOverflow: checkOverflow };

  var defaults = {
    init: true,
    direction: 'horizontal',
    touchEventsTarget: 'container',
    initialSlide: 0,
    speed: 300,
    //
    preventInteractionOnTransition: false,

    // To support iOS's swipe-to-go-back gesture (when being used in-app, with UIWebView).
    edgeSwipeDetection: false,
    edgeSwipeThreshold: 20,

    // Free mode
    freeMode: false,
    freeModeMomentum: true,
    freeModeMomentumRatio: 1,
    freeModeMomentumBounce: true,
    freeModeMomentumBounceRatio: 1,
    freeModeMomentumVelocityRatio: 1,
    freeModeSticky: false,
    freeModeMinimumVelocity: 0.02,

    // Autoheight
    autoHeight: false,

    // Set wrapper width
    setWrapperSize: false,

    // Virtual Translate
    virtualTranslate: false,

    // Effects
    effect: 'slide', // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'

    // Breakpoints
    breakpoints: undefined,

    // Slides grid
    spaceBetween: 0,
    slidesPerView: 1,
    slidesPerColumn: 1,
    slidesPerColumnFill: 'column',
    slidesPerGroup: 1,
    centeredSlides: false,
    slidesOffsetBefore: 0, // in px
    slidesOffsetAfter: 0, // in px
    normalizeSlideIndex: true,

    // Disable swiper and hide navigation when container not overflow
    watchOverflow: false,

    // Round length
    roundLengths: false,

    // Touches
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: true,
    shortSwipes: true,
    longSwipes: true,
    longSwipesRatio: 0.5,
    longSwipesMs: 300,
    followFinger: true,
    allowTouchMove: true,
    threshold: 0,
    touchMoveStopPropagation: true,
    touchReleaseOnEdges: false,

    // Unique Navigation Elements
    uniqueNavElements: true,

    // Resistance
    resistance: true,
    resistanceRatio: 0.85,

    // Progress
    watchSlidesProgress: false,
    watchSlidesVisibility: false,

    // Cursor
    grabCursor: false,

    // Clicks
    preventClicks: true,
    preventClicksPropagation: true,
    slideToClickedSlide: false,

    // Images
    preloadImages: true,
    updateOnImagesReady: true,

    // loop
    loop: false,
    loopAdditionalSlides: 0,
    loopedSlides: null,
    loopFillGroupWithBlank: false,

    // Swiping/no swiping
    allowSlidePrev: true,
    allowSlideNext: true,
    swipeHandler: null, // '.swipe-handler',
    noSwiping: true,
    noSwipingClass: 'swiper-no-swiping',
    noSwipingSelector: null,

    // Passive Listeners
    passiveListeners: true,

    // NS
    containerModifierClass: 'swiper-container-', // NEW
    slideClass: 'swiper-slide',
    slideBlankClass: 'swiper-slide-invisible-blank',
    slideActiveClass: 'swiper-slide-active',
    slideDuplicateActiveClass: 'swiper-slide-duplicate-active',
    slideVisibleClass: 'swiper-slide-visible',
    slideDuplicateClass: 'swiper-slide-duplicate',
    slideNextClass: 'swiper-slide-next',
    slideDuplicateNextClass: 'swiper-slide-duplicate-next',
    slidePrevClass: 'swiper-slide-prev',
    slideDuplicatePrevClass: 'swiper-slide-duplicate-prev',
    wrapperClass: 'swiper-wrapper',

    // Callbacks
    runCallbacksOnInit: true,
  };

  var prototypes = {
    update: update,
    translate: translate,
    transition: transition$1,
    slide: slide,
    loop: loop,
    grabCursor: grabCursor,
    manipulation: manipulation,
    events: events,
    breakpoints: breakpoints,
    checkOverflow: checkOverflow$1,
    classes: classes,
    images: images,
  };

  var extendedDefaults = {};

  var Swiper = (function (SwiperClass) {
    function Swiper() {
      var assign;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var el;
      var params;
      if (args.length === 1 && args[0].constructor && args[0].constructor === Object) {
        params = args[0];
      } else {
        (assign = args, el = assign[0], params = assign[1]);
      }
      if (!params) { params = {}; }

      params = Utils.extend({}, params);
      if (el && !params.el) { params.el = el; }

      SwiperClass.call(this, params);

      Object.keys(prototypes).forEach(function (prototypeGroup) {
        Object.keys(prototypes[prototypeGroup]).forEach(function (protoMethod) {
          if (!Swiper.prototype[protoMethod]) {
            Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
          }
        });
      });

      // Swiper Instance
      var swiper = this;
      if (typeof swiper.modules === 'undefined') {
        swiper.modules = {};
      }
      Object.keys(swiper.modules).forEach(function (moduleName) {
        var module = swiper.modules[moduleName];
        if (module.params) {
          var moduleParamName = Object.keys(module.params)[0];
          var moduleParams = module.params[moduleParamName];
          if (typeof moduleParams !== 'object') { return; }
          if (!(moduleParamName in params && 'enabled' in moduleParams)) { return; }
          if (params[moduleParamName] === true) {
            params[moduleParamName] = { enabled: true };
          }
          if (
            typeof params[moduleParamName] === 'object'
            && !('enabled' in params[moduleParamName])
          ) {
            params[moduleParamName].enabled = true;
          }
          if (!params[moduleParamName]) { params[moduleParamName] = { enabled: false }; }
        }
      });

      // Extend defaults with modules params
      var swiperParams = Utils.extend({}, defaults);
      swiper.useModulesParams(swiperParams);

      // Extend defaults with passed params
      swiper.params = Utils.extend({}, swiperParams, extendedDefaults, params);
      swiper.originalParams = Utils.extend({}, swiper.params);
      swiper.passedParams = Utils.extend({}, params);

      // Save Dom lib
      swiper.$ = $;

      // Find el
      var $el = $(swiper.params.el);
      el = $el[0];

      if (!el) {
        return undefined;
      }

      if ($el.length > 1) {
        var swipers = [];
        $el.each(function (index, containerEl) {
          var newParams = Utils.extend({}, params, { el: containerEl });
          swipers.push(new Swiper(newParams));
        });
        return swipers;
      }

      el.swiper = swiper;
      $el.data('swiper', swiper);

      // Find Wrapper
      var $wrapperEl = $el.children(("." + (swiper.params.wrapperClass)));

      // Extend Swiper
      Utils.extend(swiper, {
        $el: $el,
        el: el,
        $wrapperEl: $wrapperEl,
        wrapperEl: $wrapperEl[0],

        // Classes
        classNames: [],

        // Slides
        slides: $(),
        slidesGrid: [],
        snapGrid: [],
        slidesSizesGrid: [],

        // isDirection
        isHorizontal: function isHorizontal() {
          return swiper.params.direction === 'horizontal';
        },
        isVertical: function isVertical() {
          return swiper.params.direction === 'vertical';
        },
        // RTL
        rtl: (el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl'),
        rtlTranslate: swiper.params.direction === 'horizontal' && (el.dir.toLowerCase() === 'rtl' || $el.css('direction') === 'rtl'),
        wrongRTL: $wrapperEl.css('display') === '-webkit-box',

        // Indexes
        activeIndex: 0,
        realIndex: 0,

        //
        isBeginning: true,
        isEnd: false,

        // Props
        translate: 0,
        previousTranslate: 0,
        progress: 0,
        velocity: 0,
        animating: false,

        // Locks
        allowSlideNext: swiper.params.allowSlideNext,
        allowSlidePrev: swiper.params.allowSlidePrev,

        // Touch Events
        touchEvents: (function touchEvents() {
          var touch = ['touchstart', 'touchmove', 'touchend'];
          var desktop = ['mousedown', 'mousemove', 'mouseup'];
          if (Support.pointerEvents) {
            desktop = ['pointerdown', 'pointermove', 'pointerup'];
          } else if (Support.prefixedPointerEvents) {
            desktop = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
          }
          swiper.touchEventsTouch = {
            start: touch[0],
            move: touch[1],
            end: touch[2],
          };
          swiper.touchEventsDesktop = {
            start: desktop[0],
            move: desktop[1],
            end: desktop[2],
          };
          return Support.touch || !swiper.params.simulateTouch ? swiper.touchEventsTouch : swiper.touchEventsDesktop;
        }()),
        touchEventsData: {
          isTouched: undefined,
          isMoved: undefined,
          allowTouchCallbacks: undefined,
          touchStartTime: undefined,
          isScrolling: undefined,
          currentTranslate: undefined,
          startTranslate: undefined,
          allowThresholdMove: undefined,
          // Form elements to match
          formElements: 'input, select, option, textarea, button, video',
          // Last click time
          lastClickTime: Utils.now(),
          clickTimeout: undefined,
          // Velocities
          velocities: [],
          allowMomentumBounce: undefined,
          isTouchEvent: undefined,
          startMoving: undefined,
        },

        // Clicks
        allowClick: true,

        // Touches
        allowTouchMove: swiper.params.allowTouchMove,

        touches: {
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          diff: 0,
        },

        // Images
        imagesToLoad: [],
        imagesLoaded: 0,

      });

      // Install Modules
      swiper.useModules();

      // Init
      if (swiper.params.init) {
        swiper.init();
      }

      // Return app instance
      return swiper;
    }

    if ( SwiperClass ) Swiper.__proto__ = SwiperClass;
    Swiper.prototype = Object.create( SwiperClass && SwiperClass.prototype );
    Swiper.prototype.constructor = Swiper;

    var staticAccessors = { extendedDefaults: { configurable: true },defaults: { configurable: true },Class: { configurable: true },$: { configurable: true } };

    Swiper.prototype.slidesPerViewDynamic = function slidesPerViewDynamic () {
      var swiper = this;
      var params = swiper.params;
      var slides = swiper.slides;
      var slidesGrid = swiper.slidesGrid;
      var swiperSize = swiper.size;
      var activeIndex = swiper.activeIndex;
      var spv = 1;
      if (params.centeredSlides) {
        var slideSize = slides[activeIndex].swiperSlideSize;
        var breakLoop;
        for (var i = activeIndex + 1; i < slides.length; i += 1) {
          if (slides[i] && !breakLoop) {
            slideSize += slides[i].swiperSlideSize;
            spv += 1;
            if (slideSize > swiperSize) { breakLoop = true; }
          }
        }
        for (var i$1 = activeIndex - 1; i$1 >= 0; i$1 -= 1) {
          if (slides[i$1] && !breakLoop) {
            slideSize += slides[i$1].swiperSlideSize;
            spv += 1;
            if (slideSize > swiperSize) { breakLoop = true; }
          }
        }
      } else {
        for (var i$2 = activeIndex + 1; i$2 < slides.length; i$2 += 1) {
          if (slidesGrid[i$2] - slidesGrid[activeIndex] < swiperSize) {
            spv += 1;
          }
        }
      }
      return spv;
    };

    Swiper.prototype.update = function update$$1 () {
      var swiper = this;
      if (!swiper || swiper.destroyed) { return; }
      var snapGrid = swiper.snapGrid;
      var params = swiper.params;
      // Breakpoints
      if (params.breakpoints) {
        swiper.setBreakpoint();
      }
      swiper.updateSize();
      swiper.updateSlides();
      swiper.updateProgress();
      swiper.updateSlidesClasses();

      function setTranslate() {
        var translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
        var newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
        swiper.setTranslate(newTranslate);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      var translated;
      if (swiper.params.freeMode) {
        setTranslate();
        if (swiper.params.autoHeight) {
          swiper.updateAutoHeight();
        }
      } else {
        if ((swiper.params.slidesPerView === 'auto' || swiper.params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
          translated = swiper.slideTo(swiper.slides.length - 1, 0, false, true);
        } else {
          translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
        }
        if (!translated) {
          setTranslate();
        }
      }
      if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
        swiper.checkOverflow();
      }
      swiper.emit('update');
    };

    Swiper.prototype.init = function init () {
      var swiper = this;
      if (swiper.initialized) { return; }

      swiper.emit('beforeInit');

      // Set breakpoint
      if (swiper.params.breakpoints) {
        swiper.setBreakpoint();
      }

      // Add Classes
      swiper.addClasses();

      // Create loop
      if (swiper.params.loop) {
        swiper.loopCreate();
      }

      // Update size
      swiper.updateSize();

      // Update slides
      swiper.updateSlides();

      if (swiper.params.watchOverflow) {
        swiper.checkOverflow();
      }

      // Set Grab Cursor
      if (swiper.params.grabCursor) {
        swiper.setGrabCursor();
      }

      if (swiper.params.preloadImages) {
        swiper.preloadImages();
      }

      // Slide To Initial Slide
      if (swiper.params.loop) {
        swiper.slideTo(swiper.params.initialSlide + swiper.loopedSlides, 0, swiper.params.runCallbacksOnInit);
      } else {
        swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit);
      }

      // Attach events
      swiper.attachEvents();

      // Init Flag
      swiper.initialized = true;

      // Emit
      swiper.emit('init');
    };

    Swiper.prototype.destroy = function destroy (deleteInstance, cleanStyles) {
      if ( deleteInstance === void 0 ) deleteInstance = true;
      if ( cleanStyles === void 0 ) cleanStyles = true;

      var swiper = this;
      var params = swiper.params;
      var $el = swiper.$el;
      var $wrapperEl = swiper.$wrapperEl;
      var slides = swiper.slides;

      if (typeof swiper.params === 'undefined' || swiper.destroyed) {
        return null;
      }

      swiper.emit('beforeDestroy');

      // Init Flag
      swiper.initialized = false;

      // Detach events
      swiper.detachEvents();

      // Destroy loop
      if (params.loop) {
        swiper.loopDestroy();
      }

      // Cleanup styles
      if (cleanStyles) {
        swiper.removeClasses();
        $el.removeAttr('style');
        $wrapperEl.removeAttr('style');
        if (slides && slides.length) {
          slides
            .removeClass([
              params.slideVisibleClass,
              params.slideActiveClass,
              params.slideNextClass,
              params.slidePrevClass ].join(' '))
            .removeAttr('style')
            .removeAttr('data-swiper-slide-index')
            .removeAttr('data-swiper-column')
            .removeAttr('data-swiper-row');
        }
      }

      swiper.emit('destroy');

      // Detach emitter events
      Object.keys(swiper.eventsListeners).forEach(function (eventName) {
        swiper.off(eventName);
      });

      if (deleteInstance !== false) {
        swiper.$el[0].swiper = null;
        swiper.$el.data('swiper', null);
        Utils.deleteProps(swiper);
      }
      swiper.destroyed = true;

      return null;
    };

    Swiper.extendDefaults = function extendDefaults (newDefaults) {
      Utils.extend(extendedDefaults, newDefaults);
    };

    staticAccessors.extendedDefaults.get = function () {
      return extendedDefaults;
    };

    staticAccessors.defaults.get = function () {
      return defaults;
    };

    staticAccessors.Class.get = function () {
      return SwiperClass;
    };

    staticAccessors.$.get = function () {
      return $;
    };

    Object.defineProperties( Swiper, staticAccessors );

    return Swiper;
  }(Framework7Class));

  var Device$1 = {
    name: 'device',
    proto: {
      device: Device,
    },
    static: {
      device: Device,
    },
  };

  var Support$1 = {
    name: 'support',
    proto: {
      support: Support,
    },
    static: {
      support: Support,
    },
  };

  var Browser$1 = {
    name: 'browser',
    proto: {
      browser: Browser,
    },
    static: {
      browser: Browser,
    },
  };

  var Resize = {
    name: 'resize',
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        resize: {
          resizeHandler: function resizeHandler() {
            if (!swiper || swiper.destroyed || !swiper.initialized) { return; }
            swiper.emit('beforeResize');
            swiper.emit('resize');
          },
          orientationChangeHandler: function orientationChangeHandler() {
            if (!swiper || swiper.destroyed || !swiper.initialized) { return; }
            swiper.emit('orientationchange');
          },
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        // Emit resize
        win.addEventListener('resize', swiper.resize.resizeHandler);

        // Emit orientationchange
        win.addEventListener('orientationchange', swiper.resize.orientationChangeHandler);
      },
      destroy: function destroy() {
        var swiper = this;
        win.removeEventListener('resize', swiper.resize.resizeHandler);
        win.removeEventListener('orientationchange', swiper.resize.orientationChangeHandler);
      },
    },
  };

  var Observer = {
    func: win.MutationObserver || win.WebkitMutationObserver,
    attach: function attach(target, options) {
      if ( options === void 0 ) options = {};

      var swiper = this;

      var ObserverFunc = Observer.func;
      var observer = new ObserverFunc(function (mutations) {
        // The observerUpdate event should only be triggered
        // once despite the number of mutations.  Additional
        // triggers are redundant and are very costly
        if (mutations.length === 1) {
          swiper.emit('observerUpdate', mutations[0]);
          return;
        }
        var observerUpdate = function observerUpdate() {
          swiper.emit('observerUpdate', mutations[0]);
        };

        if (win.requestAnimationFrame) {
          win.requestAnimationFrame(observerUpdate);
        } else {
          win.setTimeout(observerUpdate, 0);
        }
      });

      observer.observe(target, {
        attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
        childList: typeof options.childList === 'undefined' ? true : options.childList,
        characterData: typeof options.characterData === 'undefined' ? true : options.characterData,
      });

      swiper.observer.observers.push(observer);
    },
    init: function init() {
      var swiper = this;
      if (!Support.observer || !swiper.params.observer) { return; }
      if (swiper.params.observeParents) {
        var containerParents = swiper.$el.parents();
        for (var i = 0; i < containerParents.length; i += 1) {
          swiper.observer.attach(containerParents[i]);
        }
      }
      // Observe container
      swiper.observer.attach(swiper.$el[0], { childList: false });

      // Observe wrapper
      swiper.observer.attach(swiper.$wrapperEl[0], { attributes: false });
    },
    destroy: function destroy() {
      var swiper = this;
      swiper.observer.observers.forEach(function (observer) {
        observer.disconnect();
      });
      swiper.observer.observers = [];
    },
  };

  var Observer$1 = {
    name: 'observer',
    params: {
      observer: false,
      observeParents: false,
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        observer: {
          init: Observer.init.bind(swiper),
          attach: Observer.attach.bind(swiper),
          destroy: Observer.destroy.bind(swiper),
          observers: [],
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        swiper.observer.init();
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.observer.destroy();
      },
    },
  };

  var Virtual = {
    update: function update(force) {
      var swiper = this;
      var ref = swiper.params;
      var slidesPerView = ref.slidesPerView;
      var slidesPerGroup = ref.slidesPerGroup;
      var centeredSlides = ref.centeredSlides;
      var ref$1 = swiper.virtual;
      var previousFrom = ref$1.from;
      var previousTo = ref$1.to;
      var slides = ref$1.slides;
      var previousSlidesGrid = ref$1.slidesGrid;
      var renderSlide = ref$1.renderSlide;
      var previousOffset = ref$1.offset;
      swiper.updateActiveIndex();
      var activeIndex = swiper.activeIndex || 0;

      var offsetProp;
      if (swiper.rtlTranslate) { offsetProp = 'right'; }
      else { offsetProp = swiper.isHorizontal() ? 'left' : 'top'; }

      var slidesAfter;
      var slidesBefore;
      if (centeredSlides) {
        slidesAfter = Math.floor(slidesPerView / 2) + slidesPerGroup;
        slidesBefore = Math.floor(slidesPerView / 2) + slidesPerGroup;
      } else {
        slidesAfter = slidesPerView + (slidesPerGroup - 1);
        slidesBefore = slidesPerGroup;
      }
      var from = Math.max((activeIndex || 0) - slidesBefore, 0);
      var to = Math.min((activeIndex || 0) + slidesAfter, slides.length - 1);
      var offset = (swiper.slidesGrid[from] || 0) - (swiper.slidesGrid[0] || 0);

      Utils.extend(swiper.virtual, {
        from: from,
        to: to,
        offset: offset,
        slidesGrid: swiper.slidesGrid,
      });

      function onRendered() {
        swiper.updateSlides();
        swiper.updateProgress();
        swiper.updateSlidesClasses();
        if (swiper.lazy && swiper.params.lazy.enabled) {
          swiper.lazy.load();
        }
      }

      if (previousFrom === from && previousTo === to && !force) {
        if (swiper.slidesGrid !== previousSlidesGrid && offset !== previousOffset) {
          swiper.slides.css(offsetProp, (offset + "px"));
        }
        swiper.updateProgress();
        return;
      }
      if (swiper.params.virtual.renderExternal) {
        swiper.params.virtual.renderExternal.call(swiper, {
          offset: offset,
          from: from,
          to: to,
          slides: (function getSlides() {
            var slidesToRender = [];
            for (var i = from; i <= to; i += 1) {
              slidesToRender.push(slides[i]);
            }
            return slidesToRender;
          }()),
        });
        onRendered();
        return;
      }
      var prependIndexes = [];
      var appendIndexes = [];
      if (force) {
        swiper.$wrapperEl.find(("." + (swiper.params.slideClass))).remove();
      } else {
        for (var i = previousFrom; i <= previousTo; i += 1) {
          if (i < from || i > to) {
            swiper.$wrapperEl.find(("." + (swiper.params.slideClass) + "[data-swiper-slide-index=\"" + i + "\"]")).remove();
          }
        }
      }
      for (var i$1 = 0; i$1 < slides.length; i$1 += 1) {
        if (i$1 >= from && i$1 <= to) {
          if (typeof previousTo === 'undefined' || force) {
            appendIndexes.push(i$1);
          } else {
            if (i$1 > previousTo) { appendIndexes.push(i$1); }
            if (i$1 < previousFrom) { prependIndexes.push(i$1); }
          }
        }
      }
      appendIndexes.forEach(function (index) {
        swiper.$wrapperEl.append(renderSlide(slides[index], index));
      });
      prependIndexes.sort(function (a, b) { return a < b; }).forEach(function (index) {
        swiper.$wrapperEl.prepend(renderSlide(slides[index], index));
      });
      swiper.$wrapperEl.children('.swiper-slide').css(offsetProp, (offset + "px"));
      onRendered();
    },
    renderSlide: function renderSlide(slide, index) {
      var swiper = this;
      var params = swiper.params.virtual;
      if (params.cache && swiper.virtual.cache[index]) {
        return swiper.virtual.cache[index];
      }
      var $slideEl = params.renderSlide
        ? $(params.renderSlide.call(swiper, slide, index))
        : $(("<div class=\"" + (swiper.params.slideClass) + "\" data-swiper-slide-index=\"" + index + "\">" + slide + "</div>"));
      if (!$slideEl.attr('data-swiper-slide-index')) { $slideEl.attr('data-swiper-slide-index', index); }
      if (params.cache) { swiper.virtual.cache[index] = $slideEl; }
      return $slideEl;
    },
    appendSlide: function appendSlide(slide) {
      var swiper = this;
      swiper.virtual.slides.push(slide);
      swiper.virtual.update(true);
    },
    prependSlide: function prependSlide(slide) {
      var swiper = this;
      swiper.virtual.slides.unshift(slide);
      if (swiper.params.virtual.cache) {
        var cache = swiper.virtual.cache;
        var newCache = {};
        Object.keys(cache).forEach(function (cachedIndex) {
          newCache[cachedIndex + 1] = cache[cachedIndex];
        });
        swiper.virtual.cache = newCache;
      }
      swiper.virtual.update(true);
      swiper.slideNext(0);
    },
  };

  var Virtual$1 = {
    name: 'virtual',
    params: {
      virtual: {
        enabled: false,
        slides: [],
        cache: true,
        renderSlide: null,
        renderExternal: null,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        virtual: {
          update: Virtual.update.bind(swiper),
          appendSlide: Virtual.appendSlide.bind(swiper),
          prependSlide: Virtual.prependSlide.bind(swiper),
          renderSlide: Virtual.renderSlide.bind(swiper),
          slides: swiper.params.virtual.slides,
          cache: {},
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (!swiper.params.virtual.enabled) { return; }
        swiper.classNames.push(((swiper.params.containerModifierClass) + "virtual"));
        var overwriteParams = {
          watchSlidesProgress: true,
        };
        Utils.extend(swiper.params, overwriteParams);
        Utils.extend(swiper.originalParams, overwriteParams);

        swiper.virtual.update();
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (!swiper.params.virtual.enabled) { return; }
        swiper.virtual.update();
      },
    },
  };

  var Navigation = {
    update: function update() {
      // Update Navigation Buttons
      var swiper = this;
      var params = swiper.params.navigation;

      if (swiper.params.loop) { return; }
      var ref = swiper.navigation;
      var $nextEl = ref.$nextEl;
      var $prevEl = ref.$prevEl;

      if ($prevEl && $prevEl.length > 0) {
        if (swiper.isBeginning) {
          $prevEl.addClass(params.disabledClass);
        } else {
          $prevEl.removeClass(params.disabledClass);
        }
        $prevEl[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
      }
      if ($nextEl && $nextEl.length > 0) {
        if (swiper.isEnd) {
          $nextEl.addClass(params.disabledClass);
        } else {
          $nextEl.removeClass(params.disabledClass);
        }
        $nextEl[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
      }
    },
    init: function init() {
      var swiper = this;
      var params = swiper.params.navigation;
      if (!(params.nextEl || params.prevEl)) { return; }

      var $nextEl;
      var $prevEl;
      if (params.nextEl) {
        $nextEl = $(params.nextEl);
        if (
          swiper.params.uniqueNavElements
          && typeof params.nextEl === 'string'
          && $nextEl.length > 1
          && swiper.$el.find(params.nextEl).length === 1
        ) {
          $nextEl = swiper.$el.find(params.nextEl);
        }
      }
      if (params.prevEl) {
        $prevEl = $(params.prevEl);
        if (
          swiper.params.uniqueNavElements
          && typeof params.prevEl === 'string'
          && $prevEl.length > 1
          && swiper.$el.find(params.prevEl).length === 1
        ) {
          $prevEl = swiper.$el.find(params.prevEl);
        }
      }

      if ($nextEl && $nextEl.length > 0) {
        $nextEl.on('click', function (e) {
          e.preventDefault();
          if (swiper.isEnd && !swiper.params.loop) { return; }
          swiper.slideNext();
        });
      }
      if ($prevEl && $prevEl.length > 0) {
        $prevEl.on('click', function (e) {
          e.preventDefault();
          if (swiper.isBeginning && !swiper.params.loop) { return; }
          swiper.slidePrev();
        });
      }

      Utils.extend(swiper.navigation, {
        $nextEl: $nextEl,
        nextEl: $nextEl && $nextEl[0],
        $prevEl: $prevEl,
        prevEl: $prevEl && $prevEl[0],
      });
    },
    destroy: function destroy() {
      var swiper = this;
      var ref = swiper.navigation;
      var $nextEl = ref.$nextEl;
      var $prevEl = ref.$prevEl;
      if ($nextEl && $nextEl.length) {
        $nextEl.off('click');
        $nextEl.removeClass(swiper.params.navigation.disabledClass);
      }
      if ($prevEl && $prevEl.length) {
        $prevEl.off('click');
        $prevEl.removeClass(swiper.params.navigation.disabledClass);
      }
    },
  };

  var Navigation$1 = {
    name: 'navigation',
    params: {
      navigation: {
        nextEl: null,
        prevEl: null,

        hideOnClick: false,
        disabledClass: 'swiper-button-disabled',
        hiddenClass: 'swiper-button-hidden',
        lockClass: 'swiper-button-lock',
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        navigation: {
          init: Navigation.init.bind(swiper),
          update: Navigation.update.bind(swiper),
          destroy: Navigation.destroy.bind(swiper),
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        swiper.navigation.init();
        swiper.navigation.update();
      },
      toEdge: function toEdge() {
        var swiper = this;
        swiper.navigation.update();
      },
      fromEdge: function fromEdge() {
        var swiper = this;
        swiper.navigation.update();
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.navigation.destroy();
      },
      click: function click(e) {
        var swiper = this;
        var ref = swiper.navigation;
        var $nextEl = ref.$nextEl;
        var $prevEl = ref.$prevEl;
        if (
          swiper.params.navigation.hideOnClick
          && !$(e.target).is($prevEl)
          && !$(e.target).is($nextEl)
        ) {
          if ($nextEl) { $nextEl.toggleClass(swiper.params.navigation.hiddenClass); }
          if ($prevEl) { $prevEl.toggleClass(swiper.params.navigation.hiddenClass); }
        }
      },
    },
  };

  var Pagination = {
    update: function update() {
      // Render || Update Pagination bullets/items
      var swiper = this;
      var rtl = swiper.rtl;
      var params = swiper.params.pagination;
      if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) { return; }
      var slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
      var $el = swiper.pagination.$el;
      // Current/Total
      var current;
      var total = swiper.params.loop ? Math.ceil((slidesLength - (swiper.loopedSlides * 2)) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
      if (swiper.params.loop) {
        current = Math.ceil((swiper.activeIndex - swiper.loopedSlides) / swiper.params.slidesPerGroup);
        if (current > slidesLength - 1 - (swiper.loopedSlides * 2)) {
          current -= (slidesLength - (swiper.loopedSlides * 2));
        }
        if (current > total - 1) { current -= total; }
        if (current < 0 && swiper.params.paginationType !== 'bullets') { current = total + current; }
      } else if (typeof swiper.snapIndex !== 'undefined') {
        current = swiper.snapIndex;
      } else {
        current = swiper.activeIndex || 0;
      }
      // Types
      if (params.type === 'bullets' && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
        var bullets = swiper.pagination.bullets;
        var firstIndex;
        var lastIndex;
        var midIndex;
        if (params.dynamicBullets) {
          swiper.pagination.bulletSize = bullets.eq(0)[swiper.isHorizontal() ? 'outerWidth' : 'outerHeight'](true);
          $el.css(swiper.isHorizontal() ? 'width' : 'height', ((swiper.pagination.bulletSize * (params.dynamicMainBullets + 4)) + "px"));
          if (params.dynamicMainBullets > 1 && swiper.previousIndex !== undefined) {
            swiper.pagination.dynamicBulletIndex += (current - swiper.previousIndex);
            if (swiper.pagination.dynamicBulletIndex > (params.dynamicMainBullets - 1)) {
              swiper.pagination.dynamicBulletIndex = params.dynamicMainBullets - 1;
            } else if (swiper.pagination.dynamicBulletIndex < 0) {
              swiper.pagination.dynamicBulletIndex = 0;
            }
          }
          firstIndex = current - swiper.pagination.dynamicBulletIndex;
          lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
          midIndex = (lastIndex + firstIndex) / 2;
        }
        bullets.removeClass(((params.bulletActiveClass) + " " + (params.bulletActiveClass) + "-next " + (params.bulletActiveClass) + "-next-next " + (params.bulletActiveClass) + "-prev " + (params.bulletActiveClass) + "-prev-prev " + (params.bulletActiveClass) + "-main"));
        if ($el.length > 1) {
          bullets.each(function (index, bullet) {
            var $bullet = $(bullet);
            var bulletIndex = $bullet.index();
            if (bulletIndex === current) {
              $bullet.addClass(params.bulletActiveClass);
            }
            if (params.dynamicBullets) {
              if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
                $bullet.addClass(((params.bulletActiveClass) + "-main"));
              }
              if (bulletIndex === firstIndex) {
                $bullet
                  .prev()
                  .addClass(((params.bulletActiveClass) + "-prev"))
                  .prev()
                  .addClass(((params.bulletActiveClass) + "-prev-prev"));
              }
              if (bulletIndex === lastIndex) {
                $bullet
                  .next()
                  .addClass(((params.bulletActiveClass) + "-next"))
                  .next()
                  .addClass(((params.bulletActiveClass) + "-next-next"));
              }
            }
          });
        } else {
          var $bullet = bullets.eq(current);
          $bullet.addClass(params.bulletActiveClass);
          if (params.dynamicBullets) {
            var $firstDisplayedBullet = bullets.eq(firstIndex);
            var $lastDisplayedBullet = bullets.eq(lastIndex);
            for (var i = firstIndex; i <= lastIndex; i += 1) {
              bullets.eq(i).addClass(((params.bulletActiveClass) + "-main"));
            }
            $firstDisplayedBullet
              .prev()
              .addClass(((params.bulletActiveClass) + "-prev"))
              .prev()
              .addClass(((params.bulletActiveClass) + "-prev-prev"));
            $lastDisplayedBullet
              .next()
              .addClass(((params.bulletActiveClass) + "-next"))
              .next()
              .addClass(((params.bulletActiveClass) + "-next-next"));
          }
        }
        if (params.dynamicBullets) {
          var dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
          var bulletsOffset = (((swiper.pagination.bulletSize * dynamicBulletsLength) - (swiper.pagination.bulletSize)) / 2) - (midIndex * swiper.pagination.bulletSize);
          var offsetProp = rtl ? 'right' : 'left';
          bullets.css(swiper.isHorizontal() ? offsetProp : 'top', (bulletsOffset + "px"));
        }
      }
      if (params.type === 'fraction') {
        $el.find(("." + (params.currentClass))).text(params.formatFractionCurrent(current + 1));
        $el.find(("." + (params.totalClass))).text(params.formatFractionTotal(total));
      }
      if (params.type === 'progressbar') {
        var progressbarDirection;
        if (params.progressbarOpposite) {
          progressbarDirection = swiper.isHorizontal() ? 'vertical' : 'horizontal';
        } else {
          progressbarDirection = swiper.isHorizontal() ? 'horizontal' : 'vertical';
        }
        var scale = (current + 1) / total;
        var scaleX = 1;
        var scaleY = 1;
        if (progressbarDirection === 'horizontal') {
          scaleX = scale;
        } else {
          scaleY = scale;
        }
        $el.find(("." + (params.progressbarFillClass))).transform(("translate3d(0,0,0) scaleX(" + scaleX + ") scaleY(" + scaleY + ")")).transition(swiper.params.speed);
      }
      if (params.type === 'custom' && params.renderCustom) {
        $el.html(params.renderCustom(swiper, current + 1, total));
        swiper.emit('paginationRender', swiper, $el[0]);
      } else {
        swiper.emit('paginationUpdate', swiper, $el[0]);
      }
      $el[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](params.lockClass);
    },
    render: function render() {
      // Render Container
      var swiper = this;
      var params = swiper.params.pagination;
      if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) { return; }
      var slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;

      var $el = swiper.pagination.$el;
      var paginationHTML = '';
      if (params.type === 'bullets') {
        var numberOfBullets = swiper.params.loop ? Math.ceil((slidesLength - (swiper.loopedSlides * 2)) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
        for (var i = 0; i < numberOfBullets; i += 1) {
          if (params.renderBullet) {
            paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
          } else {
            paginationHTML += "<" + (params.bulletElement) + " class=\"" + (params.bulletClass) + "\"></" + (params.bulletElement) + ">";
          }
        }
        $el.html(paginationHTML);
        swiper.pagination.bullets = $el.find(("." + (params.bulletClass)));
      }
      if (params.type === 'fraction') {
        if (params.renderFraction) {
          paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
        } else {
          paginationHTML = "<span class=\"" + (params.currentClass) + "\"></span>"
          + ' / '
          + "<span class=\"" + (params.totalClass) + "\"></span>";
        }
        $el.html(paginationHTML);
      }
      if (params.type === 'progressbar') {
        if (params.renderProgressbar) {
          paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
        } else {
          paginationHTML = "<span class=\"" + (params.progressbarFillClass) + "\"></span>";
        }
        $el.html(paginationHTML);
      }
      if (params.type !== 'custom') {
        swiper.emit('paginationRender', swiper.pagination.$el[0]);
      }
    },
    init: function init() {
      var swiper = this;
      var params = swiper.params.pagination;
      if (!params.el) { return; }

      var $el = $(params.el);
      if ($el.length === 0) { return; }

      if (
        swiper.params.uniqueNavElements
        && typeof params.el === 'string'
        && $el.length > 1
        && swiper.$el.find(params.el).length === 1
      ) {
        $el = swiper.$el.find(params.el);
      }

      if (params.type === 'bullets' && params.clickable) {
        $el.addClass(params.clickableClass);
      }

      $el.addClass(params.modifierClass + params.type);

      if (params.type === 'bullets' && params.dynamicBullets) {
        $el.addClass(("" + (params.modifierClass) + (params.type) + "-dynamic"));
        swiper.pagination.dynamicBulletIndex = 0;
        if (params.dynamicMainBullets < 1) {
          params.dynamicMainBullets = 1;
        }
      }
      if (params.type === 'progressbar' && params.progressbarOpposite) {
        $el.addClass(params.progressbarOppositeClass);
      }

      if (params.clickable) {
        $el.on('click', ("." + (params.bulletClass)), function onClick(e) {
          e.preventDefault();
          var index = $(this).index() * swiper.params.slidesPerGroup;
          if (swiper.params.loop) { index += swiper.loopedSlides; }
          swiper.slideTo(index);
        });
      }

      Utils.extend(swiper.pagination, {
        $el: $el,
        el: $el[0],
      });
    },
    destroy: function destroy() {
      var swiper = this;
      var params = swiper.params.pagination;
      if (!params.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0) { return; }
      var $el = swiper.pagination.$el;

      $el.removeClass(params.hiddenClass);
      $el.removeClass(params.modifierClass + params.type);
      if (swiper.pagination.bullets) { swiper.pagination.bullets.removeClass(params.bulletActiveClass); }
      if (params.clickable) {
        $el.off('click', ("." + (params.bulletClass)));
      }
    },
  };

  var Pagination$1 = {
    name: 'pagination',
    params: {
      pagination: {
        el: null,
        bulletElement: 'span',
        clickable: false,
        hideOnClick: false,
        renderBullet: null,
        renderProgressbar: null,
        renderFraction: null,
        renderCustom: null,
        progressbarOpposite: false,
        type: 'bullets', // 'bullets' or 'progressbar' or 'fraction' or 'custom'
        dynamicBullets: false,
        dynamicMainBullets: 1,
        formatFractionCurrent: function (number) { return number; },
        formatFractionTotal: function (number) { return number; },
        bulletClass: 'swiper-pagination-bullet',
        bulletActiveClass: 'swiper-pagination-bullet-active',
        modifierClass: 'swiper-pagination-', // NEW
        currentClass: 'swiper-pagination-current',
        totalClass: 'swiper-pagination-total',
        hiddenClass: 'swiper-pagination-hidden',
        progressbarFillClass: 'swiper-pagination-progressbar-fill',
        progressbarOppositeClass: 'swiper-pagination-progressbar-opposite',
        clickableClass: 'swiper-pagination-clickable', // NEW
        lockClass: 'swiper-pagination-lock',
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        pagination: {
          init: Pagination.init.bind(swiper),
          render: Pagination.render.bind(swiper),
          update: Pagination.update.bind(swiper),
          destroy: Pagination.destroy.bind(swiper),
          dynamicBulletIndex: 0,
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        swiper.pagination.init();
        swiper.pagination.render();
        swiper.pagination.update();
      },
      activeIndexChange: function activeIndexChange() {
        var swiper = this;
        if (swiper.params.loop) {
          swiper.pagination.update();
        } else if (typeof swiper.snapIndex === 'undefined') {
          swiper.pagination.update();
        }
      },
      snapIndexChange: function snapIndexChange() {
        var swiper = this;
        if (!swiper.params.loop) {
          swiper.pagination.update();
        }
      },
      slidesLengthChange: function slidesLengthChange() {
        var swiper = this;
        if (swiper.params.loop) {
          swiper.pagination.render();
          swiper.pagination.update();
        }
      },
      snapGridLengthChange: function snapGridLengthChange() {
        var swiper = this;
        if (!swiper.params.loop) {
          swiper.pagination.render();
          swiper.pagination.update();
        }
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.pagination.destroy();
      },
      click: function click(e) {
        var swiper = this;
        if (
          swiper.params.pagination.el
          && swiper.params.pagination.hideOnClick
          && swiper.pagination.$el.length > 0
          && !$(e.target).hasClass(swiper.params.pagination.bulletClass)
        ) {
          swiper.pagination.$el.toggleClass(swiper.params.pagination.hiddenClass);
        }
      },
    },
  };

  var Scrollbar = {
    setTranslate: function setTranslate() {
      var swiper = this;
      if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) { return; }
      var scrollbar = swiper.scrollbar;
      var rtl = swiper.rtlTranslate;
      var progress = swiper.progress;
      var dragSize = scrollbar.dragSize;
      var trackSize = scrollbar.trackSize;
      var $dragEl = scrollbar.$dragEl;
      var $el = scrollbar.$el;
      var params = swiper.params.scrollbar;

      var newSize = dragSize;
      var newPos = (trackSize - dragSize) * progress;
      if (rtl) {
        newPos = -newPos;
        if (newPos > 0) {
          newSize = dragSize - newPos;
          newPos = 0;
        } else if (-newPos + dragSize > trackSize) {
          newSize = trackSize + newPos;
        }
      } else if (newPos < 0) {
        newSize = dragSize + newPos;
        newPos = 0;
      } else if (newPos + dragSize > trackSize) {
        newSize = trackSize - newPos;
      }
      if (swiper.isHorizontal()) {
        if (Support.transforms3d) {
          $dragEl.transform(("translate3d(" + newPos + "px, 0, 0)"));
        } else {
          $dragEl.transform(("translateX(" + newPos + "px)"));
        }
        $dragEl[0].style.width = newSize + "px";
      } else {
        if (Support.transforms3d) {
          $dragEl.transform(("translate3d(0px, " + newPos + "px, 0)"));
        } else {
          $dragEl.transform(("translateY(" + newPos + "px)"));
        }
        $dragEl[0].style.height = newSize + "px";
      }
      if (params.hide) {
        clearTimeout(swiper.scrollbar.timeout);
        $el[0].style.opacity = 1;
        swiper.scrollbar.timeout = setTimeout(function () {
          $el[0].style.opacity = 0;
          $el.transition(400);
        }, 1000);
      }
    },
    setTransition: function setTransition(duration) {
      var swiper = this;
      if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) { return; }
      swiper.scrollbar.$dragEl.transition(duration);
    },
    updateSize: function updateSize() {
      var swiper = this;
      if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) { return; }

      var scrollbar = swiper.scrollbar;
      var $dragEl = scrollbar.$dragEl;
      var $el = scrollbar.$el;

      $dragEl[0].style.width = '';
      $dragEl[0].style.height = '';
      var trackSize = swiper.isHorizontal() ? $el[0].offsetWidth : $el[0].offsetHeight;

      var divider = swiper.size / swiper.virtualSize;
      var moveDivider = divider * (trackSize / swiper.size);
      var dragSize;
      if (swiper.params.scrollbar.dragSize === 'auto') {
        dragSize = trackSize * divider;
      } else {
        dragSize = parseInt(swiper.params.scrollbar.dragSize, 10);
      }

      if (swiper.isHorizontal()) {
        $dragEl[0].style.width = dragSize + "px";
      } else {
        $dragEl[0].style.height = dragSize + "px";
      }

      if (divider >= 1) {
        $el[0].style.display = 'none';
      } else {
        $el[0].style.display = '';
      }
      if (swiper.params.scrollbarHide) {
        $el[0].style.opacity = 0;
      }
      Utils.extend(scrollbar, {
        trackSize: trackSize,
        divider: divider,
        moveDivider: moveDivider,
        dragSize: dragSize,
      });
      scrollbar.$el[swiper.params.watchOverflow && swiper.isLocked ? 'addClass' : 'removeClass'](swiper.params.scrollbar.lockClass);
    },
    setDragPosition: function setDragPosition(e) {
      var swiper = this;
      var scrollbar = swiper.scrollbar;
      var rtl = swiper.rtlTranslate;
      var $el = scrollbar.$el;
      var dragSize = scrollbar.dragSize;
      var trackSize = scrollbar.trackSize;

      var pointerPosition;
      if (swiper.isHorizontal()) {
        pointerPosition = ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageX : e.pageX || e.clientX);
      } else {
        pointerPosition = ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageY : e.pageY || e.clientY);
      }
      var positionRatio;
      positionRatio = ((pointerPosition) - $el.offset()[swiper.isHorizontal() ? 'left' : 'top'] - (dragSize / 2)) / (trackSize - dragSize);
      positionRatio = Math.max(Math.min(positionRatio, 1), 0);
      if (rtl) {
        positionRatio = 1 - positionRatio;
      }

      var position = swiper.minTranslate() + ((swiper.maxTranslate() - swiper.minTranslate()) * positionRatio);

      swiper.updateProgress(position);
      swiper.setTranslate(position);
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    },
    onDragStart: function onDragStart(e) {
      var swiper = this;
      var params = swiper.params.scrollbar;
      var scrollbar = swiper.scrollbar;
      var $wrapperEl = swiper.$wrapperEl;
      var $el = scrollbar.$el;
      var $dragEl = scrollbar.$dragEl;
      swiper.scrollbar.isTouched = true;
      e.preventDefault();
      e.stopPropagation();

      $wrapperEl.transition(100);
      $dragEl.transition(100);
      scrollbar.setDragPosition(e);

      clearTimeout(swiper.scrollbar.dragTimeout);

      $el.transition(0);
      if (params.hide) {
        $el.css('opacity', 1);
      }
      swiper.emit('scrollbarDragStart', e);
    },
    onDragMove: function onDragMove(e) {
      var swiper = this;
      var scrollbar = swiper.scrollbar;
      var $wrapperEl = swiper.$wrapperEl;
      var $el = scrollbar.$el;
      var $dragEl = scrollbar.$dragEl;

      if (!swiper.scrollbar.isTouched) { return; }
      if (e.preventDefault) { e.preventDefault(); }
      else { e.returnValue = false; }
      scrollbar.setDragPosition(e);
      $wrapperEl.transition(0);
      $el.transition(0);
      $dragEl.transition(0);
      swiper.emit('scrollbarDragMove', e);
    },
    onDragEnd: function onDragEnd(e) {
      var swiper = this;

      var params = swiper.params.scrollbar;
      var scrollbar = swiper.scrollbar;
      var $el = scrollbar.$el;

      if (!swiper.scrollbar.isTouched) { return; }
      swiper.scrollbar.isTouched = false;
      if (params.hide) {
        clearTimeout(swiper.scrollbar.dragTimeout);
        swiper.scrollbar.dragTimeout = Utils.nextTick(function () {
          $el.css('opacity', 0);
          $el.transition(400);
        }, 1000);
      }
      swiper.emit('scrollbarDragEnd', e);
      if (params.snapOnRelease) {
        swiper.slideToClosest();
      }
    },
    enableDraggable: function enableDraggable() {
      var swiper = this;
      if (!swiper.params.scrollbar.el) { return; }
      var scrollbar = swiper.scrollbar;
      var touchEvents = swiper.touchEvents;
      var touchEventsDesktop = swiper.touchEventsDesktop;
      var params = swiper.params;
      var $el = scrollbar.$el;
      var target = $el[0];
      var activeListener = Support.passiveListener && params.passiveListeners ? { passive: false, capture: false } : false;
      var passiveListener = Support.passiveListener && params.passiveListeners ? { passive: true, capture: false } : false;
      if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
        target.addEventListener(touchEventsDesktop.start, swiper.scrollbar.onDragStart, activeListener);
        doc.addEventListener(touchEventsDesktop.move, swiper.scrollbar.onDragMove, activeListener);
        doc.addEventListener(touchEventsDesktop.end, swiper.scrollbar.onDragEnd, passiveListener);
      } else {
        if (Support.touch) {
          target.addEventListener(touchEvents.start, swiper.scrollbar.onDragStart, activeListener);
          target.addEventListener(touchEvents.move, swiper.scrollbar.onDragMove, activeListener);
          target.addEventListener(touchEvents.end, swiper.scrollbar.onDragEnd, passiveListener);
        }
        if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
          target.addEventListener('mousedown', swiper.scrollbar.onDragStart, activeListener);
          doc.addEventListener('mousemove', swiper.scrollbar.onDragMove, activeListener);
          doc.addEventListener('mouseup', swiper.scrollbar.onDragEnd, passiveListener);
        }
      }
    },
    disableDraggable: function disableDraggable() {
      var swiper = this;
      if (!swiper.params.scrollbar.el) { return; }
      var scrollbar = swiper.scrollbar;
      var touchEvents = swiper.touchEvents;
      var touchEventsDesktop = swiper.touchEventsDesktop;
      var params = swiper.params;
      var $el = scrollbar.$el;
      var target = $el[0];
      var activeListener = Support.passiveListener && params.passiveListeners ? { passive: false, capture: false } : false;
      var passiveListener = Support.passiveListener && params.passiveListeners ? { passive: true, capture: false } : false;
      if (!Support.touch && (Support.pointerEvents || Support.prefixedPointerEvents)) {
        target.removeEventListener(touchEventsDesktop.start, swiper.scrollbar.onDragStart, activeListener);
        doc.removeEventListener(touchEventsDesktop.move, swiper.scrollbar.onDragMove, activeListener);
        doc.removeEventListener(touchEventsDesktop.end, swiper.scrollbar.onDragEnd, passiveListener);
      } else {
        if (Support.touch) {
          target.removeEventListener(touchEvents.start, swiper.scrollbar.onDragStart, activeListener);
          target.removeEventListener(touchEvents.move, swiper.scrollbar.onDragMove, activeListener);
          target.removeEventListener(touchEvents.end, swiper.scrollbar.onDragEnd, passiveListener);
        }
        if ((params.simulateTouch && !Device.ios && !Device.android) || (params.simulateTouch && !Support.touch && Device.ios)) {
          target.removeEventListener('mousedown', swiper.scrollbar.onDragStart, activeListener);
          doc.removeEventListener('mousemove', swiper.scrollbar.onDragMove, activeListener);
          doc.removeEventListener('mouseup', swiper.scrollbar.onDragEnd, passiveListener);
        }
      }
    },
    init: function init() {
      var swiper = this;
      if (!swiper.params.scrollbar.el) { return; }
      var scrollbar = swiper.scrollbar;
      var $swiperEl = swiper.$el;
      var params = swiper.params.scrollbar;

      var $el = $(params.el);
      if (swiper.params.uniqueNavElements && typeof params.el === 'string' && $el.length > 1 && $swiperEl.find(params.el).length === 1) {
        $el = $swiperEl.find(params.el);
      }

      var $dragEl = $el.find(("." + (swiper.params.scrollbar.dragClass)));
      if ($dragEl.length === 0) {
        $dragEl = $(("<div class=\"" + (swiper.params.scrollbar.dragClass) + "\"></div>"));
        $el.append($dragEl);
      }

      Utils.extend(scrollbar, {
        $el: $el,
        el: $el[0],
        $dragEl: $dragEl,
        dragEl: $dragEl[0],
      });

      if (params.draggable) {
        scrollbar.enableDraggable();
      }
    },
    destroy: function destroy() {
      var swiper = this;
      swiper.scrollbar.disableDraggable();
    },
  };

  var Scrollbar$1 = {
    name: 'scrollbar',
    params: {
      scrollbar: {
        el: null,
        dragSize: 'auto',
        hide: false,
        draggable: false,
        snapOnRelease: true,
        lockClass: 'swiper-scrollbar-lock',
        dragClass: 'swiper-scrollbar-drag',
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        scrollbar: {
          init: Scrollbar.init.bind(swiper),
          destroy: Scrollbar.destroy.bind(swiper),
          updateSize: Scrollbar.updateSize.bind(swiper),
          setTranslate: Scrollbar.setTranslate.bind(swiper),
          setTransition: Scrollbar.setTransition.bind(swiper),
          enableDraggable: Scrollbar.enableDraggable.bind(swiper),
          disableDraggable: Scrollbar.disableDraggable.bind(swiper),
          setDragPosition: Scrollbar.setDragPosition.bind(swiper),
          onDragStart: Scrollbar.onDragStart.bind(swiper),
          onDragMove: Scrollbar.onDragMove.bind(swiper),
          onDragEnd: Scrollbar.onDragEnd.bind(swiper),
          isTouched: false,
          timeout: null,
          dragTimeout: null,
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        swiper.scrollbar.init();
        swiper.scrollbar.updateSize();
        swiper.scrollbar.setTranslate();
      },
      update: function update() {
        var swiper = this;
        swiper.scrollbar.updateSize();
      },
      resize: function resize() {
        var swiper = this;
        swiper.scrollbar.updateSize();
      },
      observerUpdate: function observerUpdate() {
        var swiper = this;
        swiper.scrollbar.updateSize();
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        swiper.scrollbar.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        swiper.scrollbar.setTransition(duration);
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.scrollbar.destroy();
      },
    },
  };

  var Parallax = {
    setTransform: function setTransform(el, progress) {
      var swiper = this;
      var rtl = swiper.rtl;

      var $el = $(el);
      var rtlFactor = rtl ? -1 : 1;

      var p = $el.attr('data-swiper-parallax') || '0';
      var x = $el.attr('data-swiper-parallax-x');
      var y = $el.attr('data-swiper-parallax-y');
      var scale = $el.attr('data-swiper-parallax-scale');
      var opacity = $el.attr('data-swiper-parallax-opacity');

      if (x || y) {
        x = x || '0';
        y = y || '0';
      } else if (swiper.isHorizontal()) {
        x = p;
        y = '0';
      } else {
        y = p;
        x = '0';
      }

      if ((x).indexOf('%') >= 0) {
        x = (parseInt(x, 10) * progress * rtlFactor) + "%";
      } else {
        x = (x * progress * rtlFactor) + "px";
      }
      if ((y).indexOf('%') >= 0) {
        y = (parseInt(y, 10) * progress) + "%";
      } else {
        y = (y * progress) + "px";
      }

      if (typeof opacity !== 'undefined' && opacity !== null) {
        var currentOpacity = opacity - ((opacity - 1) * (1 - Math.abs(progress)));
        $el[0].style.opacity = currentOpacity;
      }
      if (typeof scale === 'undefined' || scale === null) {
        $el.transform(("translate3d(" + x + ", " + y + ", 0px)"));
      } else {
        var currentScale = scale - ((scale - 1) * (1 - Math.abs(progress)));
        $el.transform(("translate3d(" + x + ", " + y + ", 0px) scale(" + currentScale + ")"));
      }
    },
    setTranslate: function setTranslate() {
      var swiper = this;
      var $el = swiper.$el;
      var slides = swiper.slides;
      var progress = swiper.progress;
      var snapGrid = swiper.snapGrid;
      $el.children('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
        .each(function (index, el) {
          swiper.parallax.setTransform(el, progress);
        });
      slides.each(function (slideIndex, slideEl) {
        var slideProgress = slideEl.progress;
        if (swiper.params.slidesPerGroup > 1 && swiper.params.slidesPerView !== 'auto') {
          slideProgress += Math.ceil(slideIndex / 2) - (progress * (snapGrid.length - 1));
        }
        slideProgress = Math.min(Math.max(slideProgress, -1), 1);
        $(slideEl).find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
          .each(function (index, el) {
            swiper.parallax.setTransform(el, slideProgress);
          });
      });
    },
    setTransition: function setTransition(duration) {
      if ( duration === void 0 ) duration = this.params.speed;

      var swiper = this;
      var $el = swiper.$el;
      $el.find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]')
        .each(function (index, parallaxEl) {
          var $parallaxEl = $(parallaxEl);
          var parallaxDuration = parseInt($parallaxEl.attr('data-swiper-parallax-duration'), 10) || duration;
          if (duration === 0) { parallaxDuration = 0; }
          $parallaxEl.transition(parallaxDuration);
        });
    },
  };

  var Parallax$1 = {
    name: 'parallax',
    params: {
      parallax: {
        enabled: false,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        parallax: {
          setTransform: Parallax.setTransform.bind(swiper),
          setTranslate: Parallax.setTranslate.bind(swiper),
          setTransition: Parallax.setTransition.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (!swiper.params.parallax.enabled) { return; }
        swiper.params.watchSlidesProgress = true;
      },
      init: function init() {
        var swiper = this;
        if (!swiper.params.parallax) { return; }
        swiper.parallax.setTranslate();
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (!swiper.params.parallax) { return; }
        swiper.parallax.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (!swiper.params.parallax) { return; }
        swiper.parallax.setTransition(duration);
      },
    },
  };

  var Zoom = {
    // Calc Scale From Multi-touches
    getDistanceBetweenTouches: function getDistanceBetweenTouches(e) {
      if (e.targetTouches.length < 2) { return 1; }
      var x1 = e.targetTouches[0].pageX;
      var y1 = e.targetTouches[0].pageY;
      var x2 = e.targetTouches[1].pageX;
      var y2 = e.targetTouches[1].pageY;
      var distance = Math.sqrt((Math.pow( (x2 - x1), 2 )) + (Math.pow( (y2 - y1), 2 )));
      return distance;
    },
    // Events
    onGestureStart: function onGestureStart(e) {
      var swiper = this;
      var params = swiper.params.zoom;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      zoom.fakeGestureTouched = false;
      zoom.fakeGestureMoved = false;
      if (!Support.gestures) {
        if (e.type !== 'touchstart' || (e.type === 'touchstart' && e.targetTouches.length < 2)) {
          return;
        }
        zoom.fakeGestureTouched = true;
        gesture.scaleStart = Zoom.getDistanceBetweenTouches(e);
      }
      if (!gesture.$slideEl || !gesture.$slideEl.length) {
        gesture.$slideEl = $(e.target).closest('.swiper-slide');
        if (gesture.$slideEl.length === 0) { gesture.$slideEl = swiper.slides.eq(swiper.activeIndex); }
        gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
        gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
        gesture.maxRatio = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
        if (gesture.$imageWrapEl.length === 0) {
          gesture.$imageEl = undefined;
          return;
        }
      }
      gesture.$imageEl.transition(0);
      swiper.zoom.isScaling = true;
    },
    onGestureChange: function onGestureChange(e) {
      var swiper = this;
      var params = swiper.params.zoom;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      if (!Support.gestures) {
        if (e.type !== 'touchmove' || (e.type === 'touchmove' && e.targetTouches.length < 2)) {
          return;
        }
        zoom.fakeGestureMoved = true;
        gesture.scaleMove = Zoom.getDistanceBetweenTouches(e);
      }
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }
      if (Support.gestures) {
        swiper.zoom.scale = e.scale * zoom.currentScale;
      } else {
        zoom.scale = (gesture.scaleMove / gesture.scaleStart) * zoom.currentScale;
      }
      if (zoom.scale > gesture.maxRatio) {
        zoom.scale = (gesture.maxRatio - 1) + (Math.pow( ((zoom.scale - gesture.maxRatio) + 1), 0.5 ));
      }
      if (zoom.scale < params.minRatio) {
        zoom.scale = (params.minRatio + 1) - (Math.pow( ((params.minRatio - zoom.scale) + 1), 0.5 ));
      }
      gesture.$imageEl.transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
    },
    onGestureEnd: function onGestureEnd(e) {
      var swiper = this;
      var params = swiper.params.zoom;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      if (!Support.gestures) {
        if (!zoom.fakeGestureTouched || !zoom.fakeGestureMoved) {
          return;
        }
        if (e.type !== 'touchend' || (e.type === 'touchend' && e.changedTouches.length < 2 && !Device.android)) {
          return;
        }
        zoom.fakeGestureTouched = false;
        zoom.fakeGestureMoved = false;
      }
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }
      zoom.scale = Math.max(Math.min(zoom.scale, gesture.maxRatio), params.minRatio);
      gesture.$imageEl.transition(swiper.params.speed).transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
      zoom.currentScale = zoom.scale;
      zoom.isScaling = false;
      if (zoom.scale === 1) { gesture.$slideEl = undefined; }
    },
    onTouchStart: function onTouchStart(e) {
      var swiper = this;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      var image = zoom.image;
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }
      if (image.isTouched) { return; }
      if (Device.android) { e.preventDefault(); }
      image.isTouched = true;
      image.touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      image.touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
    },
    onTouchMove: function onTouchMove(e) {
      var swiper = this;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      var image = zoom.image;
      var velocity = zoom.velocity;
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }
      swiper.allowClick = false;
      if (!image.isTouched || !gesture.$slideEl) { return; }

      if (!image.isMoved) {
        image.width = gesture.$imageEl[0].offsetWidth;
        image.height = gesture.$imageEl[0].offsetHeight;
        image.startX = Utils.getTranslate(gesture.$imageWrapEl[0], 'x') || 0;
        image.startY = Utils.getTranslate(gesture.$imageWrapEl[0], 'y') || 0;
        gesture.slideWidth = gesture.$slideEl[0].offsetWidth;
        gesture.slideHeight = gesture.$slideEl[0].offsetHeight;
        gesture.$imageWrapEl.transition(0);
        if (swiper.rtl) {
          image.startX = -image.startX;
          image.startY = -image.startY;
        }
      }
      // Define if we need image drag
      var scaledWidth = image.width * zoom.scale;
      var scaledHeight = image.height * zoom.scale;

      if (scaledWidth < gesture.slideWidth && scaledHeight < gesture.slideHeight) { return; }

      image.minX = Math.min(((gesture.slideWidth / 2) - (scaledWidth / 2)), 0);
      image.maxX = -image.minX;
      image.minY = Math.min(((gesture.slideHeight / 2) - (scaledHeight / 2)), 0);
      image.maxY = -image.minY;

      image.touchesCurrent.x = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      image.touchesCurrent.y = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

      if (!image.isMoved && !zoom.isScaling) {
        if (
          swiper.isHorizontal()
          && (
            (Math.floor(image.minX) === Math.floor(image.startX) && image.touchesCurrent.x < image.touchesStart.x)
            || (Math.floor(image.maxX) === Math.floor(image.startX) && image.touchesCurrent.x > image.touchesStart.x)
          )
        ) {
          image.isTouched = false;
          return;
        } if (
          !swiper.isHorizontal()
          && (
            (Math.floor(image.minY) === Math.floor(image.startY) && image.touchesCurrent.y < image.touchesStart.y)
            || (Math.floor(image.maxY) === Math.floor(image.startY) && image.touchesCurrent.y > image.touchesStart.y)
          )
        ) {
          image.isTouched = false;
          return;
        }
      }
      e.preventDefault();
      e.stopPropagation();

      image.isMoved = true;
      image.currentX = (image.touchesCurrent.x - image.touchesStart.x) + image.startX;
      image.currentY = (image.touchesCurrent.y - image.touchesStart.y) + image.startY;

      if (image.currentX < image.minX) {
        image.currentX = (image.minX + 1) - (Math.pow( ((image.minX - image.currentX) + 1), 0.8 ));
      }
      if (image.currentX > image.maxX) {
        image.currentX = (image.maxX - 1) + (Math.pow( ((image.currentX - image.maxX) + 1), 0.8 ));
      }

      if (image.currentY < image.minY) {
        image.currentY = (image.minY + 1) - (Math.pow( ((image.minY - image.currentY) + 1), 0.8 ));
      }
      if (image.currentY > image.maxY) {
        image.currentY = (image.maxY - 1) + (Math.pow( ((image.currentY - image.maxY) + 1), 0.8 ));
      }

      // Velocity
      if (!velocity.prevPositionX) { velocity.prevPositionX = image.touchesCurrent.x; }
      if (!velocity.prevPositionY) { velocity.prevPositionY = image.touchesCurrent.y; }
      if (!velocity.prevTime) { velocity.prevTime = Date.now(); }
      velocity.x = (image.touchesCurrent.x - velocity.prevPositionX) / (Date.now() - velocity.prevTime) / 2;
      velocity.y = (image.touchesCurrent.y - velocity.prevPositionY) / (Date.now() - velocity.prevTime) / 2;
      if (Math.abs(image.touchesCurrent.x - velocity.prevPositionX) < 2) { velocity.x = 0; }
      if (Math.abs(image.touchesCurrent.y - velocity.prevPositionY) < 2) { velocity.y = 0; }
      velocity.prevPositionX = image.touchesCurrent.x;
      velocity.prevPositionY = image.touchesCurrent.y;
      velocity.prevTime = Date.now();

      gesture.$imageWrapEl.transform(("translate3d(" + (image.currentX) + "px, " + (image.currentY) + "px,0)"));
    },
    onTouchEnd: function onTouchEnd() {
      var swiper = this;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      var image = zoom.image;
      var velocity = zoom.velocity;
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }
      if (!image.isTouched || !image.isMoved) {
        image.isTouched = false;
        image.isMoved = false;
        return;
      }
      image.isTouched = false;
      image.isMoved = false;
      var momentumDurationX = 300;
      var momentumDurationY = 300;
      var momentumDistanceX = velocity.x * momentumDurationX;
      var newPositionX = image.currentX + momentumDistanceX;
      var momentumDistanceY = velocity.y * momentumDurationY;
      var newPositionY = image.currentY + momentumDistanceY;

      // Fix duration
      if (velocity.x !== 0) { momentumDurationX = Math.abs((newPositionX - image.currentX) / velocity.x); }
      if (velocity.y !== 0) { momentumDurationY = Math.abs((newPositionY - image.currentY) / velocity.y); }
      var momentumDuration = Math.max(momentumDurationX, momentumDurationY);

      image.currentX = newPositionX;
      image.currentY = newPositionY;

      // Define if we need image drag
      var scaledWidth = image.width * zoom.scale;
      var scaledHeight = image.height * zoom.scale;
      image.minX = Math.min(((gesture.slideWidth / 2) - (scaledWidth / 2)), 0);
      image.maxX = -image.minX;
      image.minY = Math.min(((gesture.slideHeight / 2) - (scaledHeight / 2)), 0);
      image.maxY = -image.minY;
      image.currentX = Math.max(Math.min(image.currentX, image.maxX), image.minX);
      image.currentY = Math.max(Math.min(image.currentY, image.maxY), image.minY);

      gesture.$imageWrapEl.transition(momentumDuration).transform(("translate3d(" + (image.currentX) + "px, " + (image.currentY) + "px,0)"));
    },
    onTransitionEnd: function onTransitionEnd() {
      var swiper = this;
      var zoom = swiper.zoom;
      var gesture = zoom.gesture;
      if (gesture.$slideEl && swiper.previousIndex !== swiper.activeIndex) {
        gesture.$imageEl.transform('translate3d(0,0,0) scale(1)');
        gesture.$imageWrapEl.transform('translate3d(0,0,0)');
        gesture.$slideEl = undefined;
        gesture.$imageEl = undefined;
        gesture.$imageWrapEl = undefined;

        zoom.scale = 1;
        zoom.currentScale = 1;
      }
    },
    // Toggle Zoom
    toggle: function toggle(e) {
      var swiper = this;
      var zoom = swiper.zoom;

      if (zoom.scale && zoom.scale !== 1) {
        // Zoom Out
        zoom.out();
      } else {
        // Zoom In
        zoom.in(e);
      }
    },
    in: function in$1(e) {
      var swiper = this;

      var zoom = swiper.zoom;
      var params = swiper.params.zoom;
      var gesture = zoom.gesture;
      var image = zoom.image;

      if (!gesture.$slideEl) {
        gesture.$slideEl = swiper.clickedSlide ? $(swiper.clickedSlide) : swiper.slides.eq(swiper.activeIndex);
        gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
        gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
      }
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }

      gesture.$slideEl.addClass(("" + (params.zoomedSlideClass)));

      var touchX;
      var touchY;
      var offsetX;
      var offsetY;
      var diffX;
      var diffY;
      var translateX;
      var translateY;
      var imageWidth;
      var imageHeight;
      var scaledWidth;
      var scaledHeight;
      var translateMinX;
      var translateMinY;
      var translateMaxX;
      var translateMaxY;
      var slideWidth;
      var slideHeight;

      if (typeof image.touchesStart.x === 'undefined' && e) {
        touchX = e.type === 'touchend' ? e.changedTouches[0].pageX : e.pageX;
        touchY = e.type === 'touchend' ? e.changedTouches[0].pageY : e.pageY;
      } else {
        touchX = image.touchesStart.x;
        touchY = image.touchesStart.y;
      }

      zoom.scale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
      zoom.currentScale = gesture.$imageWrapEl.attr('data-swiper-zoom') || params.maxRatio;
      if (e) {
        slideWidth = gesture.$slideEl[0].offsetWidth;
        slideHeight = gesture.$slideEl[0].offsetHeight;
        offsetX = gesture.$slideEl.offset().left;
        offsetY = gesture.$slideEl.offset().top;
        diffX = (offsetX + (slideWidth / 2)) - touchX;
        diffY = (offsetY + (slideHeight / 2)) - touchY;

        imageWidth = gesture.$imageEl[0].offsetWidth;
        imageHeight = gesture.$imageEl[0].offsetHeight;
        scaledWidth = imageWidth * zoom.scale;
        scaledHeight = imageHeight * zoom.scale;

        translateMinX = Math.min(((slideWidth / 2) - (scaledWidth / 2)), 0);
        translateMinY = Math.min(((slideHeight / 2) - (scaledHeight / 2)), 0);
        translateMaxX = -translateMinX;
        translateMaxY = -translateMinY;

        translateX = diffX * zoom.scale;
        translateY = diffY * zoom.scale;

        if (translateX < translateMinX) {
          translateX = translateMinX;
        }
        if (translateX > translateMaxX) {
          translateX = translateMaxX;
        }

        if (translateY < translateMinY) {
          translateY = translateMinY;
        }
        if (translateY > translateMaxY) {
          translateY = translateMaxY;
        }
      } else {
        translateX = 0;
        translateY = 0;
      }
      gesture.$imageWrapEl.transition(300).transform(("translate3d(" + translateX + "px, " + translateY + "px,0)"));
      gesture.$imageEl.transition(300).transform(("translate3d(0,0,0) scale(" + (zoom.scale) + ")"));
    },
    out: function out() {
      var swiper = this;

      var zoom = swiper.zoom;
      var params = swiper.params.zoom;
      var gesture = zoom.gesture;

      if (!gesture.$slideEl) {
        gesture.$slideEl = swiper.clickedSlide ? $(swiper.clickedSlide) : swiper.slides.eq(swiper.activeIndex);
        gesture.$imageEl = gesture.$slideEl.find('img, svg, canvas');
        gesture.$imageWrapEl = gesture.$imageEl.parent(("." + (params.containerClass)));
      }
      if (!gesture.$imageEl || gesture.$imageEl.length === 0) { return; }

      zoom.scale = 1;
      zoom.currentScale = 1;
      gesture.$imageWrapEl.transition(300).transform('translate3d(0,0,0)');
      gesture.$imageEl.transition(300).transform('translate3d(0,0,0) scale(1)');
      gesture.$slideEl.removeClass(("" + (params.zoomedSlideClass)));
      gesture.$slideEl = undefined;
    },
    // Attach/Detach Events
    enable: function enable() {
      var swiper = this;
      var zoom = swiper.zoom;
      if (zoom.enabled) { return; }
      zoom.enabled = true;

      var passiveListener = swiper.touchEvents.start === 'touchstart' && Support.passiveListener && swiper.params.passiveListeners ? { passive: true, capture: false } : false;

      // Scale image
      if (Support.gestures) {
        swiper.$wrapperEl.on('gesturestart', '.swiper-slide', zoom.onGestureStart, passiveListener);
        swiper.$wrapperEl.on('gesturechange', '.swiper-slide', zoom.onGestureChange, passiveListener);
        swiper.$wrapperEl.on('gestureend', '.swiper-slide', zoom.onGestureEnd, passiveListener);
      } else if (swiper.touchEvents.start === 'touchstart') {
        swiper.$wrapperEl.on(swiper.touchEvents.start, '.swiper-slide', zoom.onGestureStart, passiveListener);
        swiper.$wrapperEl.on(swiper.touchEvents.move, '.swiper-slide', zoom.onGestureChange, passiveListener);
        swiper.$wrapperEl.on(swiper.touchEvents.end, '.swiper-slide', zoom.onGestureEnd, passiveListener);
      }

      // Move image
      swiper.$wrapperEl.on(swiper.touchEvents.move, ("." + (swiper.params.zoom.containerClass)), zoom.onTouchMove);
    },
    disable: function disable() {
      var swiper = this;
      var zoom = swiper.zoom;
      if (!zoom.enabled) { return; }

      swiper.zoom.enabled = false;

      var passiveListener = swiper.touchEvents.start === 'touchstart' && Support.passiveListener && swiper.params.passiveListeners ? { passive: true, capture: false } : false;

      // Scale image
      if (Support.gestures) {
        swiper.$wrapperEl.off('gesturestart', '.swiper-slide', zoom.onGestureStart, passiveListener);
        swiper.$wrapperEl.off('gesturechange', '.swiper-slide', zoom.onGestureChange, passiveListener);
        swiper.$wrapperEl.off('gestureend', '.swiper-slide', zoom.onGestureEnd, passiveListener);
      } else if (swiper.touchEvents.start === 'touchstart') {
        swiper.$wrapperEl.off(swiper.touchEvents.start, '.swiper-slide', zoom.onGestureStart, passiveListener);
        swiper.$wrapperEl.off(swiper.touchEvents.move, '.swiper-slide', zoom.onGestureChange, passiveListener);
        swiper.$wrapperEl.off(swiper.touchEvents.end, '.swiper-slide', zoom.onGestureEnd, passiveListener);
      }

      // Move image
      swiper.$wrapperEl.off(swiper.touchEvents.move, ("." + (swiper.params.zoom.containerClass)), zoom.onTouchMove);
    },
  };

  var Zoom$1 = {
    name: 'zoom',
    params: {
      zoom: {
        enabled: false,
        maxRatio: 3,
        minRatio: 1,
        toggle: true,
        containerClass: 'swiper-zoom-container',
        zoomedSlideClass: 'swiper-slide-zoomed',
      },
    },
    create: function create() {
      var swiper = this;
      var zoom = {
        enabled: false,
        scale: 1,
        currentScale: 1,
        isScaling: false,
        gesture: {
          $slideEl: undefined,
          slideWidth: undefined,
          slideHeight: undefined,
          $imageEl: undefined,
          $imageWrapEl: undefined,
          maxRatio: 3,
        },
        image: {
          isTouched: undefined,
          isMoved: undefined,
          currentX: undefined,
          currentY: undefined,
          minX: undefined,
          minY: undefined,
          maxX: undefined,
          maxY: undefined,
          width: undefined,
          height: undefined,
          startX: undefined,
          startY: undefined,
          touchesStart: {},
          touchesCurrent: {},
        },
        velocity: {
          x: undefined,
          y: undefined,
          prevPositionX: undefined,
          prevPositionY: undefined,
          prevTime: undefined,
        },
      };
      ('onGestureStart onGestureChange onGestureEnd onTouchStart onTouchMove onTouchEnd onTransitionEnd toggle enable disable in out').split(' ').forEach(function (methodName) {
        zoom[methodName] = Zoom[methodName].bind(swiper);
      });
      Utils.extend(swiper, {
        zoom: zoom,
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        if (swiper.params.zoom.enabled) {
          swiper.zoom.enable();
        }
      },
      destroy: function destroy() {
        var swiper = this;
        swiper.zoom.disable();
      },
      touchStart: function touchStart(e) {
        var swiper = this;
        if (!swiper.zoom.enabled) { return; }
        swiper.zoom.onTouchStart(e);
      },
      touchEnd: function touchEnd(e) {
        var swiper = this;
        if (!swiper.zoom.enabled) { return; }
        swiper.zoom.onTouchEnd(e);
      },
      doubleTap: function doubleTap(e) {
        var swiper = this;
        if (swiper.params.zoom.enabled && swiper.zoom.enabled && swiper.params.zoom.toggle) {
          swiper.zoom.toggle(e);
        }
      },
      transitionEnd: function transitionEnd() {
        var swiper = this;
        if (swiper.zoom.enabled && swiper.params.zoom.enabled) {
          swiper.zoom.onTransitionEnd();
        }
      },
    },
  };

  var Lazy = {
    loadInSlide: function loadInSlide(index, loadInDuplicate) {
      if ( loadInDuplicate === void 0 ) loadInDuplicate = true;

      var swiper = this;
      var params = swiper.params.lazy;
      if (typeof index === 'undefined') { return; }
      if (swiper.slides.length === 0) { return; }
      var isVirtual = swiper.virtual && swiper.params.virtual.enabled;

      var $slideEl = isVirtual
        ? swiper.$wrapperEl.children(("." + (swiper.params.slideClass) + "[data-swiper-slide-index=\"" + index + "\"]"))
        : swiper.slides.eq(index);

      var $images = $slideEl.find(("." + (params.elementClass) + ":not(." + (params.loadedClass) + "):not(." + (params.loadingClass) + ")"));
      if ($slideEl.hasClass(params.elementClass) && !$slideEl.hasClass(params.loadedClass) && !$slideEl.hasClass(params.loadingClass)) {
        $images = $images.add($slideEl[0]);
      }
      if ($images.length === 0) { return; }

      $images.each(function (imageIndex, imageEl) {
        var $imageEl = $(imageEl);
        $imageEl.addClass(params.loadingClass);

        var background = $imageEl.attr('data-background');
        var src = $imageEl.attr('data-src');
        var srcset = $imageEl.attr('data-srcset');
        var sizes = $imageEl.attr('data-sizes');

        swiper.loadImage($imageEl[0], (src || background), srcset, sizes, false, function () {
          if (typeof swiper === 'undefined' || swiper === null || !swiper || (swiper && !swiper.params) || swiper.destroyed) { return; }
          if (background) {
            $imageEl.css('background-image', ("url(\"" + background + "\")"));
            $imageEl.removeAttr('data-background');
          } else {
            if (srcset) {
              $imageEl.attr('srcset', srcset);
              $imageEl.removeAttr('data-srcset');
            }
            if (sizes) {
              $imageEl.attr('sizes', sizes);
              $imageEl.removeAttr('data-sizes');
            }
            if (src) {
              $imageEl.attr('src', src);
              $imageEl.removeAttr('data-src');
            }
          }

          $imageEl.addClass(params.loadedClass).removeClass(params.loadingClass);
          $slideEl.find(("." + (params.preloaderClass))).remove();
          if (swiper.params.loop && loadInDuplicate) {
            var slideOriginalIndex = $slideEl.attr('data-swiper-slide-index');
            if ($slideEl.hasClass(swiper.params.slideDuplicateClass)) {
              var originalSlide = swiper.$wrapperEl.children(("[data-swiper-slide-index=\"" + slideOriginalIndex + "\"]:not(." + (swiper.params.slideDuplicateClass) + ")"));
              swiper.lazy.loadInSlide(originalSlide.index(), false);
            } else {
              var duplicatedSlide = swiper.$wrapperEl.children(("." + (swiper.params.slideDuplicateClass) + "[data-swiper-slide-index=\"" + slideOriginalIndex + "\"]"));
              swiper.lazy.loadInSlide(duplicatedSlide.index(), false);
            }
          }
          swiper.emit('lazyImageReady', $slideEl[0], $imageEl[0]);
        });

        swiper.emit('lazyImageLoad', $slideEl[0], $imageEl[0]);
      });
    },
    load: function load() {
      var swiper = this;
      var $wrapperEl = swiper.$wrapperEl;
      var swiperParams = swiper.params;
      var slides = swiper.slides;
      var activeIndex = swiper.activeIndex;
      var isVirtual = swiper.virtual && swiperParams.virtual.enabled;
      var params = swiperParams.lazy;

      var slidesPerView = swiperParams.slidesPerView;
      if (slidesPerView === 'auto') {
        slidesPerView = 0;
      }

      function slideExist(index) {
        if (isVirtual) {
          if ($wrapperEl.children(("." + (swiperParams.slideClass) + "[data-swiper-slide-index=\"" + index + "\"]")).length) {
            return true;
          }
        } else if (slides[index]) { return true; }
        return false;
      }
      function slideIndex(slideEl) {
        if (isVirtual) {
          return $(slideEl).attr('data-swiper-slide-index');
        }
        return $(slideEl).index();
      }

      if (!swiper.lazy.initialImageLoaded) { swiper.lazy.initialImageLoaded = true; }
      if (swiper.params.watchSlidesVisibility) {
        $wrapperEl.children(("." + (swiperParams.slideVisibleClass))).each(function (elIndex, slideEl) {
          var index = isVirtual ? $(slideEl).attr('data-swiper-slide-index') : $(slideEl).index();
          swiper.lazy.loadInSlide(index);
        });
      } else if (slidesPerView > 1) {
        for (var i = activeIndex; i < activeIndex + slidesPerView; i += 1) {
          if (slideExist(i)) { swiper.lazy.loadInSlide(i); }
        }
      } else {
        swiper.lazy.loadInSlide(activeIndex);
      }
      if (params.loadPrevNext) {
        if (slidesPerView > 1 || (params.loadPrevNextAmount && params.loadPrevNextAmount > 1)) {
          var amount = params.loadPrevNextAmount;
          var spv = slidesPerView;
          var maxIndex = Math.min(activeIndex + spv + Math.max(amount, spv), slides.length);
          var minIndex = Math.max(activeIndex - Math.max(spv, amount), 0);
          // Next Slides
          for (var i$1 = activeIndex + slidesPerView; i$1 < maxIndex; i$1 += 1) {
            if (slideExist(i$1)) { swiper.lazy.loadInSlide(i$1); }
          }
          // Prev Slides
          for (var i$2 = minIndex; i$2 < activeIndex; i$2 += 1) {
            if (slideExist(i$2)) { swiper.lazy.loadInSlide(i$2); }
          }
        } else {
          var nextSlide = $wrapperEl.children(("." + (swiperParams.slideNextClass)));
          if (nextSlide.length > 0) { swiper.lazy.loadInSlide(slideIndex(nextSlide)); }

          var prevSlide = $wrapperEl.children(("." + (swiperParams.slidePrevClass)));
          if (prevSlide.length > 0) { swiper.lazy.loadInSlide(slideIndex(prevSlide)); }
        }
      }
    },
  };

  var Lazy$1 = {
    name: 'lazy',
    params: {
      lazy: {
        enabled: false,
        loadPrevNext: false,
        loadPrevNextAmount: 1,
        loadOnTransitionStart: false,

        elementClass: 'swiper-lazy',
        loadingClass: 'swiper-lazy-loading',
        loadedClass: 'swiper-lazy-loaded',
        preloaderClass: 'swiper-lazy-preloader',
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        lazy: {
          initialImageLoaded: false,
          load: Lazy.load.bind(swiper),
          loadInSlide: Lazy.loadInSlide.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (swiper.params.lazy.enabled && swiper.params.preloadImages) {
          swiper.params.preloadImages = false;
        }
      },
      init: function init() {
        var swiper = this;
        if (swiper.params.lazy.enabled && !swiper.params.loop && swiper.params.initialSlide === 0) {
          swiper.lazy.load();
        }
      },
      scroll: function scroll() {
        var swiper = this;
        if (swiper.params.freeMode && !swiper.params.freeModeSticky) {
          swiper.lazy.load();
        }
      },
      resize: function resize() {
        var swiper = this;
        if (swiper.params.lazy.enabled) {
          swiper.lazy.load();
        }
      },
      scrollbarDragMove: function scrollbarDragMove() {
        var swiper = this;
        if (swiper.params.lazy.enabled) {
          swiper.lazy.load();
        }
      },
      transitionStart: function transitionStart() {
        var swiper = this;
        if (swiper.params.lazy.enabled) {
          if (swiper.params.lazy.loadOnTransitionStart || (!swiper.params.lazy.loadOnTransitionStart && !swiper.lazy.initialImageLoaded)) {
            swiper.lazy.load();
          }
        }
      },
      transitionEnd: function transitionEnd() {
        var swiper = this;
        if (swiper.params.lazy.enabled && !swiper.params.lazy.loadOnTransitionStart) {
          swiper.lazy.load();
        }
      },
    },
  };

  /* eslint no-bitwise: ["error", { "allow": [">>"] }] */

  var Controller = {
    LinearSpline: function LinearSpline(x, y) {
      var binarySearch = (function search() {
        var maxIndex;
        var minIndex;
        var guess;
        return function (array, val) {
          minIndex = -1;
          maxIndex = array.length;
          while (maxIndex - minIndex > 1) {
            guess = maxIndex + minIndex >> 1;
            if (array[guess] <= val) {
              minIndex = guess;
            } else {
              maxIndex = guess;
            }
          }
          return maxIndex;
        };
      }());
      this.x = x;
      this.y = y;
      this.lastIndex = x.length - 1;
      // Given an x value (x2), return the expected y2 value:
      // (x1,y1) is the known point before given value,
      // (x3,y3) is the known point after given value.
      var i1;
      var i3;

      this.interpolate = function interpolate(x2) {
        if (!x2) { return 0; }

        // Get the indexes of x1 and x3 (the array indexes before and after given x2):
        i3 = binarySearch(this.x, x2);
        i1 = i3 - 1;

        // We have our indexes i1 & i3, so we can calculate already:
        // y2 := ((x2−x1) × (y3−y1)) ÷ (x3−x1) + y1
        return (((x2 - this.x[i1]) * (this.y[i3] - this.y[i1])) / (this.x[i3] - this.x[i1])) + this.y[i1];
      };
      return this;
    },
    // xxx: for now i will just save one spline function to to
    getInterpolateFunction: function getInterpolateFunction(c) {
      var swiper = this;
      if (!swiper.controller.spline) {
        swiper.controller.spline = swiper.params.loop
          ? new Controller.LinearSpline(swiper.slidesGrid, c.slidesGrid)
          : new Controller.LinearSpline(swiper.snapGrid, c.snapGrid);
      }
    },
    setTranslate: function setTranslate(setTranslate$1, byController) {
      var swiper = this;
      var controlled = swiper.controller.control;
      var multiplier;
      var controlledTranslate;
      function setControlledTranslate(c) {
        // this will create an Interpolate function based on the snapGrids
        // x is the Grid of the scrolled scroller and y will be the controlled scroller
        // it makes sense to create this only once and recall it for the interpolation
        // the function does a lot of value caching for performance
        var translate = swiper.rtlTranslate ? -swiper.translate : swiper.translate;
        if (swiper.params.controller.by === 'slide') {
          swiper.controller.getInterpolateFunction(c);
          // i am not sure why the values have to be multiplicated this way, tried to invert the snapGrid
          // but it did not work out
          controlledTranslate = -swiper.controller.spline.interpolate(-translate);
        }

        if (!controlledTranslate || swiper.params.controller.by === 'container') {
          multiplier = (c.maxTranslate() - c.minTranslate()) / (swiper.maxTranslate() - swiper.minTranslate());
          controlledTranslate = ((translate - swiper.minTranslate()) * multiplier) + c.minTranslate();
        }

        if (swiper.params.controller.inverse) {
          controlledTranslate = c.maxTranslate() - controlledTranslate;
        }
        c.updateProgress(controlledTranslate);
        c.setTranslate(controlledTranslate, swiper);
        c.updateActiveIndex();
        c.updateSlidesClasses();
      }
      if (Array.isArray(controlled)) {
        for (var i = 0; i < controlled.length; i += 1) {
          if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
            setControlledTranslate(controlled[i]);
          }
        }
      } else if (controlled instanceof Swiper && byController !== controlled) {
        setControlledTranslate(controlled);
      }
    },
    setTransition: function setTransition(duration, byController) {
      var swiper = this;
      var controlled = swiper.controller.control;
      var i;
      function setControlledTransition(c) {
        c.setTransition(duration, swiper);
        if (duration !== 0) {
          c.transitionStart();
          if (c.params.autoHeight) {
            Utils.nextTick(function () {
              c.updateAutoHeight();
            });
          }
          c.$wrapperEl.transitionEnd(function () {
            if (!controlled) { return; }
            if (c.params.loop && swiper.params.controller.by === 'slide') {
              c.loopFix();
            }
            c.transitionEnd();
          });
        }
      }
      if (Array.isArray(controlled)) {
        for (i = 0; i < controlled.length; i += 1) {
          if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
            setControlledTransition(controlled[i]);
          }
        }
      } else if (controlled instanceof Swiper && byController !== controlled) {
        setControlledTransition(controlled);
      }
    },
  };
  var Controller$1 = {
    name: 'controller',
    params: {
      controller: {
        control: undefined,
        inverse: false,
        by: 'slide', // or 'container'
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        controller: {
          control: swiper.params.controller.control,
          getInterpolateFunction: Controller.getInterpolateFunction.bind(swiper),
          setTranslate: Controller.setTranslate.bind(swiper),
          setTransition: Controller.setTransition.bind(swiper),
        },
      });
    },
    on: {
      update: function update() {
        var swiper = this;
        if (!swiper.controller.control) { return; }
        if (swiper.controller.spline) {
          swiper.controller.spline = undefined;
          delete swiper.controller.spline;
        }
      },
      resize: function resize() {
        var swiper = this;
        if (!swiper.controller.control) { return; }
        if (swiper.controller.spline) {
          swiper.controller.spline = undefined;
          delete swiper.controller.spline;
        }
      },
      observerUpdate: function observerUpdate() {
        var swiper = this;
        if (!swiper.controller.control) { return; }
        if (swiper.controller.spline) {
          swiper.controller.spline = undefined;
          delete swiper.controller.spline;
        }
      },
      setTranslate: function setTranslate(translate, byController) {
        var swiper = this;
        if (!swiper.controller.control) { return; }
        swiper.controller.setTranslate(translate, byController);
      },
      setTransition: function setTransition(duration, byController) {
        var swiper = this;
        if (!swiper.controller.control) { return; }
        swiper.controller.setTransition(duration, byController);
      },
    },
  };

  var a11y = {
    makeElFocusable: function makeElFocusable($el) {
      $el.attr('tabIndex', '0');
      return $el;
    },
    addElRole: function addElRole($el, role) {
      $el.attr('role', role);
      return $el;
    },
    addElLabel: function addElLabel($el, label) {
      $el.attr('aria-label', label);
      return $el;
    },
    disableEl: function disableEl($el) {
      $el.attr('aria-disabled', true);
      return $el;
    },
    enableEl: function enableEl($el) {
      $el.attr('aria-disabled', false);
      return $el;
    },
    onEnterKey: function onEnterKey(e) {
      var swiper = this;
      var params = swiper.params.a11y;
      if (e.keyCode !== 13) { return; }
      var $targetEl = $(e.target);
      if (swiper.navigation && swiper.navigation.$nextEl && $targetEl.is(swiper.navigation.$nextEl)) {
        if (!(swiper.isEnd && !swiper.params.loop)) {
          swiper.slideNext();
        }
        if (swiper.isEnd) {
          swiper.a11y.notify(params.lastSlideMessage);
        } else {
          swiper.a11y.notify(params.nextSlideMessage);
        }
      }
      if (swiper.navigation && swiper.navigation.$prevEl && $targetEl.is(swiper.navigation.$prevEl)) {
        if (!(swiper.isBeginning && !swiper.params.loop)) {
          swiper.slidePrev();
        }
        if (swiper.isBeginning) {
          swiper.a11y.notify(params.firstSlideMessage);
        } else {
          swiper.a11y.notify(params.prevSlideMessage);
        }
      }
      if (swiper.pagination && $targetEl.is(("." + (swiper.params.pagination.bulletClass)))) {
        $targetEl[0].click();
      }
    },
    notify: function notify(message) {
      var swiper = this;
      var notification = swiper.a11y.liveRegion;
      if (notification.length === 0) { return; }
      notification.html('');
      notification.html(message);
    },
    updateNavigation: function updateNavigation() {
      var swiper = this;

      if (swiper.params.loop) { return; }
      var ref = swiper.navigation;
      var $nextEl = ref.$nextEl;
      var $prevEl = ref.$prevEl;

      if ($prevEl && $prevEl.length > 0) {
        if (swiper.isBeginning) {
          swiper.a11y.disableEl($prevEl);
        } else {
          swiper.a11y.enableEl($prevEl);
        }
      }
      if ($nextEl && $nextEl.length > 0) {
        if (swiper.isEnd) {
          swiper.a11y.disableEl($nextEl);
        } else {
          swiper.a11y.enableEl($nextEl);
        }
      }
    },
    updatePagination: function updatePagination() {
      var swiper = this;
      var params = swiper.params.a11y;
      if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
        swiper.pagination.bullets.each(function (bulletIndex, bulletEl) {
          var $bulletEl = $(bulletEl);
          swiper.a11y.makeElFocusable($bulletEl);
          swiper.a11y.addElRole($bulletEl, 'button');
          swiper.a11y.addElLabel($bulletEl, params.paginationBulletMessage.replace(/{{index}}/, $bulletEl.index() + 1));
        });
      }
    },
    init: function init() {
      var swiper = this;

      swiper.$el.append(swiper.a11y.liveRegion);

      // Navigation
      var params = swiper.params.a11y;
      var $nextEl;
      var $prevEl;
      if (swiper.navigation && swiper.navigation.$nextEl) {
        $nextEl = swiper.navigation.$nextEl;
      }
      if (swiper.navigation && swiper.navigation.$prevEl) {
        $prevEl = swiper.navigation.$prevEl;
      }
      if ($nextEl) {
        swiper.a11y.makeElFocusable($nextEl);
        swiper.a11y.addElRole($nextEl, 'button');
        swiper.a11y.addElLabel($nextEl, params.nextSlideMessage);
        $nextEl.on('keydown', swiper.a11y.onEnterKey);
      }
      if ($prevEl) {
        swiper.a11y.makeElFocusable($prevEl);
        swiper.a11y.addElRole($prevEl, 'button');
        swiper.a11y.addElLabel($prevEl, params.prevSlideMessage);
        $prevEl.on('keydown', swiper.a11y.onEnterKey);
      }

      // Pagination
      if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
        swiper.pagination.$el.on('keydown', ("." + (swiper.params.pagination.bulletClass)), swiper.a11y.onEnterKey);
      }
    },
    destroy: function destroy() {
      var swiper = this;
      if (swiper.a11y.liveRegion && swiper.a11y.liveRegion.length > 0) { swiper.a11y.liveRegion.remove(); }

      var $nextEl;
      var $prevEl;
      if (swiper.navigation && swiper.navigation.$nextEl) {
        $nextEl = swiper.navigation.$nextEl;
      }
      if (swiper.navigation && swiper.navigation.$prevEl) {
        $prevEl = swiper.navigation.$prevEl;
      }
      if ($nextEl) {
        $nextEl.off('keydown', swiper.a11y.onEnterKey);
      }
      if ($prevEl) {
        $prevEl.off('keydown', swiper.a11y.onEnterKey);
      }

      // Pagination
      if (swiper.pagination && swiper.params.pagination.clickable && swiper.pagination.bullets && swiper.pagination.bullets.length) {
        swiper.pagination.$el.off('keydown', ("." + (swiper.params.pagination.bulletClass)), swiper.a11y.onEnterKey);
      }
    },
  };
  var A11y = {
    name: 'a11y',
    params: {
      a11y: {
        enabled: true,
        notificationClass: 'swiper-notification',
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide',
        paginationBulletMessage: 'Go to slide {{index}}',
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        a11y: {
          liveRegion: $(("<span class=\"" + (swiper.params.a11y.notificationClass) + "\" aria-live=\"assertive\" aria-atomic=\"true\"></span>")),
        },
      });
      Object.keys(a11y).forEach(function (methodName) {
        swiper.a11y[methodName] = a11y[methodName].bind(swiper);
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        if (!swiper.params.a11y.enabled) { return; }
        swiper.a11y.init();
        swiper.a11y.updateNavigation();
      },
      toEdge: function toEdge() {
        var swiper = this;
        if (!swiper.params.a11y.enabled) { return; }
        swiper.a11y.updateNavigation();
      },
      fromEdge: function fromEdge() {
        var swiper = this;
        if (!swiper.params.a11y.enabled) { return; }
        swiper.a11y.updateNavigation();
      },
      paginationUpdate: function paginationUpdate() {
        var swiper = this;
        if (!swiper.params.a11y.enabled) { return; }
        swiper.a11y.updatePagination();
      },
      destroy: function destroy() {
        var swiper = this;
        if (!swiper.params.a11y.enabled) { return; }
        swiper.a11y.destroy();
      },
    },
  };

  /* eslint no-underscore-dangle: "off" */

  var Autoplay = {
    run: function run() {
      var swiper = this;
      var $activeSlideEl = swiper.slides.eq(swiper.activeIndex);
      var delay = swiper.params.autoplay.delay;
      if ($activeSlideEl.attr('data-swiper-autoplay')) {
        delay = $activeSlideEl.attr('data-swiper-autoplay') || swiper.params.autoplay.delay;
      }
      swiper.autoplay.timeout = Utils.nextTick(function () {
        if (swiper.params.autoplay.reverseDirection) {
          if (swiper.params.loop) {
            swiper.loopFix();
            swiper.slidePrev(swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else if (!swiper.isBeginning) {
            swiper.slidePrev(swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else if (!swiper.params.autoplay.stopOnLastSlide) {
            swiper.slideTo(swiper.slides.length - 1, swiper.params.speed, true, true);
            swiper.emit('autoplay');
          } else {
            swiper.autoplay.stop();
          }
        } else if (swiper.params.loop) {
          swiper.loopFix();
          swiper.slideNext(swiper.params.speed, true, true);
          swiper.emit('autoplay');
        } else if (!swiper.isEnd) {
          swiper.slideNext(swiper.params.speed, true, true);
          swiper.emit('autoplay');
        } else if (!swiper.params.autoplay.stopOnLastSlide) {
          swiper.slideTo(0, swiper.params.speed, true, true);
          swiper.emit('autoplay');
        } else {
          swiper.autoplay.stop();
        }
      }, delay);
    },
    start: function start() {
      var swiper = this;
      if (typeof swiper.autoplay.timeout !== 'undefined') { return false; }
      if (swiper.autoplay.running) { return false; }
      swiper.autoplay.running = true;
      swiper.emit('autoplayStart');
      swiper.autoplay.run();
      return true;
    },
    stop: function stop() {
      var swiper = this;
      if (!swiper.autoplay.running) { return false; }
      if (typeof swiper.autoplay.timeout === 'undefined') { return false; }

      if (swiper.autoplay.timeout) {
        clearTimeout(swiper.autoplay.timeout);
        swiper.autoplay.timeout = undefined;
      }
      swiper.autoplay.running = false;
      swiper.emit('autoplayStop');
      return true;
    },
    pause: function pause(speed) {
      var swiper = this;
      if (!swiper.autoplay.running) { return; }
      if (swiper.autoplay.paused) { return; }
      if (swiper.autoplay.timeout) { clearTimeout(swiper.autoplay.timeout); }
      swiper.autoplay.paused = true;
      if (speed === 0 || !swiper.params.autoplay.waitForTransition) {
        swiper.autoplay.paused = false;
        swiper.autoplay.run();
      } else {
        swiper.$wrapperEl[0].addEventListener('transitionend', swiper.autoplay.onTransitionEnd);
        swiper.$wrapperEl[0].addEventListener('webkitTransitionEnd', swiper.autoplay.onTransitionEnd);
      }
    },
  };

  var Autoplay$1 = {
    name: 'autoplay',
    params: {
      autoplay: {
        enabled: false,
        delay: 3000,
        waitForTransition: true,
        disableOnInteraction: true,
        stopOnLastSlide: false,
        reverseDirection: false,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        autoplay: {
          running: false,
          paused: false,
          run: Autoplay.run.bind(swiper),
          start: Autoplay.start.bind(swiper),
          stop: Autoplay.stop.bind(swiper),
          pause: Autoplay.pause.bind(swiper),
          onTransitionEnd: function onTransitionEnd(e) {
            if (!swiper || swiper.destroyed || !swiper.$wrapperEl) { return; }
            if (e.target !== this) { return; }
            swiper.$wrapperEl[0].removeEventListener('transitionend', swiper.autoplay.onTransitionEnd);
            swiper.$wrapperEl[0].removeEventListener('webkitTransitionEnd', swiper.autoplay.onTransitionEnd);
            swiper.autoplay.paused = false;
            if (!swiper.autoplay.running) {
              swiper.autoplay.stop();
            } else {
              swiper.autoplay.run();
            }
          },
        },
      });
    },
    on: {
      init: function init() {
        var swiper = this;
        if (swiper.params.autoplay.enabled) {
          swiper.autoplay.start();
        }
      },
      beforeTransitionStart: function beforeTransitionStart(speed, internal) {
        var swiper = this;
        if (swiper.autoplay.running) {
          if (internal || !swiper.params.autoplay.disableOnInteraction) {
            swiper.autoplay.pause(speed);
          } else {
            swiper.autoplay.stop();
          }
        }
      },
      sliderFirstMove: function sliderFirstMove() {
        var swiper = this;
        if (swiper.autoplay.running) {
          if (swiper.params.autoplay.disableOnInteraction) {
            swiper.autoplay.stop();
          } else {
            swiper.autoplay.pause();
          }
        }
      },
      destroy: function destroy() {
        var swiper = this;
        if (swiper.autoplay.running) {
          swiper.autoplay.stop();
        }
      },
    },
  };

  var Fade = {
    setTranslate: function setTranslate() {
      var swiper = this;
      var slides = swiper.slides;
      for (var i = 0; i < slides.length; i += 1) {
        var $slideEl = swiper.slides.eq(i);
        var offset = $slideEl[0].swiperSlideOffset;
        var tx = -offset;
        if (!swiper.params.virtualTranslate) { tx -= swiper.translate; }
        var ty = 0;
        if (!swiper.isHorizontal()) {
          ty = tx;
          tx = 0;
        }
        var slideOpacity = swiper.params.fadeEffect.crossFade
          ? Math.max(1 - Math.abs($slideEl[0].progress), 0)
          : 1 + Math.min(Math.max($slideEl[0].progress, -1), 0);
        $slideEl
          .css({
            opacity: slideOpacity,
          })
          .transform(("translate3d(" + tx + "px, " + ty + "px, 0px)"));
      }
    },
    setTransition: function setTransition(duration) {
      var swiper = this;
      var slides = swiper.slides;
      var $wrapperEl = swiper.$wrapperEl;
      slides.transition(duration);
      if (swiper.params.virtualTranslate && duration !== 0) {
        var eventTriggered = false;
        slides.transitionEnd(function () {
          if (eventTriggered) { return; }
          if (!swiper || swiper.destroyed) { return; }
          eventTriggered = true;
          swiper.animating = false;
          var triggerEvents = ['webkitTransitionEnd', 'transitionend'];
          for (var i = 0; i < triggerEvents.length; i += 1) {
            $wrapperEl.trigger(triggerEvents[i]);
          }
        });
      }
    },
  };

  var EffectFade = {
    name: 'effect-fade',
    params: {
      fadeEffect: {
        crossFade: false,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        fadeEffect: {
          setTranslate: Fade.setTranslate.bind(swiper),
          setTransition: Fade.setTransition.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (swiper.params.effect !== 'fade') { return; }
        swiper.classNames.push(((swiper.params.containerModifierClass) + "fade"));
        var overwriteParams = {
          slidesPerView: 1,
          slidesPerColumn: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          spaceBetween: 0,
          virtualTranslate: true,
        };
        Utils.extend(swiper.params, overwriteParams);
        Utils.extend(swiper.originalParams, overwriteParams);
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (swiper.params.effect !== 'fade') { return; }
        swiper.fadeEffect.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (swiper.params.effect !== 'fade') { return; }
        swiper.fadeEffect.setTransition(duration);
      },
    },
  };

  var Cube = {
    setTranslate: function setTranslate() {
      var swiper = this;
      var $el = swiper.$el;
      var $wrapperEl = swiper.$wrapperEl;
      var slides = swiper.slides;
      var swiperWidth = swiper.width;
      var swiperHeight = swiper.height;
      var rtl = swiper.rtlTranslate;
      var swiperSize = swiper.size;
      var params = swiper.params.cubeEffect;
      var isHorizontal = swiper.isHorizontal();
      var isVirtual = swiper.virtual && swiper.params.virtual.enabled;
      var wrapperRotate = 0;
      var $cubeShadowEl;
      if (params.shadow) {
        if (isHorizontal) {
          $cubeShadowEl = $wrapperEl.find('.swiper-cube-shadow');
          if ($cubeShadowEl.length === 0) {
            $cubeShadowEl = $('<div class="swiper-cube-shadow"></div>');
            $wrapperEl.append($cubeShadowEl);
          }
          $cubeShadowEl.css({ height: (swiperWidth + "px") });
        } else {
          $cubeShadowEl = $el.find('.swiper-cube-shadow');
          if ($cubeShadowEl.length === 0) {
            $cubeShadowEl = $('<div class="swiper-cube-shadow"></div>');
            $el.append($cubeShadowEl);
          }
        }
      }
      for (var i = 0; i < slides.length; i += 1) {
        var $slideEl = slides.eq(i);
        var slideIndex = i;
        if (isVirtual) {
          slideIndex = parseInt($slideEl.attr('data-swiper-slide-index'), 10);
        }
        var slideAngle = slideIndex * 90;
        var round = Math.floor(slideAngle / 360);
        if (rtl) {
          slideAngle = -slideAngle;
          round = Math.floor(-slideAngle / 360);
        }
        var progress = Math.max(Math.min($slideEl[0].progress, 1), -1);
        var tx = 0;
        var ty = 0;
        var tz = 0;
        if (slideIndex % 4 === 0) {
          tx = -round * 4 * swiperSize;
          tz = 0;
        } else if ((slideIndex - 1) % 4 === 0) {
          tx = 0;
          tz = -round * 4 * swiperSize;
        } else if ((slideIndex - 2) % 4 === 0) {
          tx = swiperSize + (round * 4 * swiperSize);
          tz = swiperSize;
        } else if ((slideIndex - 3) % 4 === 0) {
          tx = -swiperSize;
          tz = (3 * swiperSize) + (swiperSize * 4 * round);
        }
        if (rtl) {
          tx = -tx;
        }

        if (!isHorizontal) {
          ty = tx;
          tx = 0;
        }

        var transform = "rotateX(" + (isHorizontal ? 0 : -slideAngle) + "deg) rotateY(" + (isHorizontal ? slideAngle : 0) + "deg) translate3d(" + tx + "px, " + ty + "px, " + tz + "px)";
        if (progress <= 1 && progress > -1) {
          wrapperRotate = (slideIndex * 90) + (progress * 90);
          if (rtl) { wrapperRotate = (-slideIndex * 90) - (progress * 90); }
        }
        $slideEl.transform(transform);
        if (params.slideShadows) {
          // Set shadows
          var shadowBefore = isHorizontal ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
          var shadowAfter = isHorizontal ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
          if (shadowBefore.length === 0) {
            shadowBefore = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'left' : 'top') + "\"></div>"));
            $slideEl.append(shadowBefore);
          }
          if (shadowAfter.length === 0) {
            shadowAfter = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'right' : 'bottom') + "\"></div>"));
            $slideEl.append(shadowAfter);
          }
          if (shadowBefore.length) { shadowBefore[0].style.opacity = Math.max(-progress, 0); }
          if (shadowAfter.length) { shadowAfter[0].style.opacity = Math.max(progress, 0); }
        }
      }
      $wrapperEl.css({
        '-webkit-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
        '-moz-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
        '-ms-transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
        'transform-origin': ("50% 50% -" + (swiperSize / 2) + "px"),
      });

      if (params.shadow) {
        if (isHorizontal) {
          $cubeShadowEl.transform(("translate3d(0px, " + ((swiperWidth / 2) + params.shadowOffset) + "px, " + (-swiperWidth / 2) + "px) rotateX(90deg) rotateZ(0deg) scale(" + (params.shadowScale) + ")"));
        } else {
          var shadowAngle = Math.abs(wrapperRotate) - (Math.floor(Math.abs(wrapperRotate) / 90) * 90);
          var multiplier = 1.5 - (
            (Math.sin((shadowAngle * 2 * Math.PI) / 360) / 2)
            + (Math.cos((shadowAngle * 2 * Math.PI) / 360) / 2)
          );
          var scale1 = params.shadowScale;
          var scale2 = params.shadowScale / multiplier;
          var offset = params.shadowOffset;
          $cubeShadowEl.transform(("scale3d(" + scale1 + ", 1, " + scale2 + ") translate3d(0px, " + ((swiperHeight / 2) + offset) + "px, " + (-swiperHeight / 2 / scale2) + "px) rotateX(-90deg)"));
        }
      }
      var zFactor = (Browser.isSafari || Browser.isUiWebView) ? (-swiperSize / 2) : 0;
      $wrapperEl
        .transform(("translate3d(0px,0," + zFactor + "px) rotateX(" + (swiper.isHorizontal() ? 0 : wrapperRotate) + "deg) rotateY(" + (swiper.isHorizontal() ? -wrapperRotate : 0) + "deg)"));
    },
    setTransition: function setTransition(duration) {
      var swiper = this;
      var $el = swiper.$el;
      var slides = swiper.slides;
      slides
        .transition(duration)
        .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
        .transition(duration);
      if (swiper.params.cubeEffect.shadow && !swiper.isHorizontal()) {
        $el.find('.swiper-cube-shadow').transition(duration);
      }
    },
  };

  var EffectCube = {
    name: 'effect-cube',
    params: {
      cubeEffect: {
        slideShadows: true,
        shadow: true,
        shadowOffset: 20,
        shadowScale: 0.94,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        cubeEffect: {
          setTranslate: Cube.setTranslate.bind(swiper),
          setTransition: Cube.setTransition.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (swiper.params.effect !== 'cube') { return; }
        swiper.classNames.push(((swiper.params.containerModifierClass) + "cube"));
        swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));
        var overwriteParams = {
          slidesPerView: 1,
          slidesPerColumn: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          resistanceRatio: 0,
          spaceBetween: 0,
          centeredSlides: false,
          virtualTranslate: true,
        };
        Utils.extend(swiper.params, overwriteParams);
        Utils.extend(swiper.originalParams, overwriteParams);
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (swiper.params.effect !== 'cube') { return; }
        swiper.cubeEffect.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (swiper.params.effect !== 'cube') { return; }
        swiper.cubeEffect.setTransition(duration);
      },
    },
  };

  var Flip = {
    setTranslate: function setTranslate() {
      var swiper = this;
      var slides = swiper.slides;
      var rtl = swiper.rtlTranslate;
      for (var i = 0; i < slides.length; i += 1) {
        var $slideEl = slides.eq(i);
        var progress = $slideEl[0].progress;
        if (swiper.params.flipEffect.limitRotation) {
          progress = Math.max(Math.min($slideEl[0].progress, 1), -1);
        }
        var offset = $slideEl[0].swiperSlideOffset;
        var rotate = -180 * progress;
        var rotateY = rotate;
        var rotateX = 0;
        var tx = -offset;
        var ty = 0;
        if (!swiper.isHorizontal()) {
          ty = tx;
          tx = 0;
          rotateX = -rotateY;
          rotateY = 0;
        } else if (rtl) {
          rotateY = -rotateY;
        }

        $slideEl[0].style.zIndex = -Math.abs(Math.round(progress)) + slides.length;

        if (swiper.params.flipEffect.slideShadows) {
          // Set shadows
          var shadowBefore = swiper.isHorizontal() ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
          var shadowAfter = swiper.isHorizontal() ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
          if (shadowBefore.length === 0) {
            shadowBefore = $(("<div class=\"swiper-slide-shadow-" + (swiper.isHorizontal() ? 'left' : 'top') + "\"></div>"));
            $slideEl.append(shadowBefore);
          }
          if (shadowAfter.length === 0) {
            shadowAfter = $(("<div class=\"swiper-slide-shadow-" + (swiper.isHorizontal() ? 'right' : 'bottom') + "\"></div>"));
            $slideEl.append(shadowAfter);
          }
          if (shadowBefore.length) { shadowBefore[0].style.opacity = Math.max(-progress, 0); }
          if (shadowAfter.length) { shadowAfter[0].style.opacity = Math.max(progress, 0); }
        }
        $slideEl
          .transform(("translate3d(" + tx + "px, " + ty + "px, 0px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)"));
      }
    },
    setTransition: function setTransition(duration) {
      var swiper = this;
      var slides = swiper.slides;
      var activeIndex = swiper.activeIndex;
      var $wrapperEl = swiper.$wrapperEl;
      slides
        .transition(duration)
        .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
        .transition(duration);
      if (swiper.params.virtualTranslate && duration !== 0) {
        var eventTriggered = false;
        // eslint-disable-next-line
        slides.eq(activeIndex).transitionEnd(function onTransitionEnd() {
          if (eventTriggered) { return; }
          if (!swiper || swiper.destroyed) { return; }
          // if (!$(this).hasClass(swiper.params.slideActiveClass)) return;
          eventTriggered = true;
          swiper.animating = false;
          var triggerEvents = ['webkitTransitionEnd', 'transitionend'];
          for (var i = 0; i < triggerEvents.length; i += 1) {
            $wrapperEl.trigger(triggerEvents[i]);
          }
        });
      }
    },
  };

  var EffectFlip = {
    name: 'effect-flip',
    params: {
      flipEffect: {
        slideShadows: true,
        limitRotation: true,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        flipEffect: {
          setTranslate: Flip.setTranslate.bind(swiper),
          setTransition: Flip.setTransition.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (swiper.params.effect !== 'flip') { return; }
        swiper.classNames.push(((swiper.params.containerModifierClass) + "flip"));
        swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));
        var overwriteParams = {
          slidesPerView: 1,
          slidesPerColumn: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          spaceBetween: 0,
          virtualTranslate: true,
        };
        Utils.extend(swiper.params, overwriteParams);
        Utils.extend(swiper.originalParams, overwriteParams);
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (swiper.params.effect !== 'flip') { return; }
        swiper.flipEffect.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (swiper.params.effect !== 'flip') { return; }
        swiper.flipEffect.setTransition(duration);
      },
    },
  };

  var Coverflow = {
    setTranslate: function setTranslate() {
      var swiper = this;
      var swiperWidth = swiper.width;
      var swiperHeight = swiper.height;
      var slides = swiper.slides;
      var $wrapperEl = swiper.$wrapperEl;
      var slidesSizesGrid = swiper.slidesSizesGrid;
      var params = swiper.params.coverflowEffect;
      var isHorizontal = swiper.isHorizontal();
      var transform = swiper.translate;
      var center = isHorizontal ? -transform + (swiperWidth / 2) : -transform + (swiperHeight / 2);
      var rotate = isHorizontal ? params.rotate : -params.rotate;
      var translate = params.depth;
      // Each slide offset from center
      for (var i = 0, length = slides.length; i < length; i += 1) {
        var $slideEl = slides.eq(i);
        var slideSize = slidesSizesGrid[i];
        var slideOffset = $slideEl[0].swiperSlideOffset;
        var offsetMultiplier = ((center - slideOffset - (slideSize / 2)) / slideSize) * params.modifier;

        var rotateY = isHorizontal ? rotate * offsetMultiplier : 0;
        var rotateX = isHorizontal ? 0 : rotate * offsetMultiplier;
        // var rotateZ = 0
        var translateZ = -translate * Math.abs(offsetMultiplier);

        var translateY = isHorizontal ? 0 : params.stretch * (offsetMultiplier);
        var translateX = isHorizontal ? params.stretch * (offsetMultiplier) : 0;

        // Fix for ultra small values
        if (Math.abs(translateX) < 0.001) { translateX = 0; }
        if (Math.abs(translateY) < 0.001) { translateY = 0; }
        if (Math.abs(translateZ) < 0.001) { translateZ = 0; }
        if (Math.abs(rotateY) < 0.001) { rotateY = 0; }
        if (Math.abs(rotateX) < 0.001) { rotateX = 0; }

        var slideTransform = "translate3d(" + translateX + "px," + translateY + "px," + translateZ + "px)  rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";

        $slideEl.transform(slideTransform);
        $slideEl[0].style.zIndex = -Math.abs(Math.round(offsetMultiplier)) + 1;
        if (params.slideShadows) {
          // Set shadows
          var $shadowBeforeEl = isHorizontal ? $slideEl.find('.swiper-slide-shadow-left') : $slideEl.find('.swiper-slide-shadow-top');
          var $shadowAfterEl = isHorizontal ? $slideEl.find('.swiper-slide-shadow-right') : $slideEl.find('.swiper-slide-shadow-bottom');
          if ($shadowBeforeEl.length === 0) {
            $shadowBeforeEl = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'left' : 'top') + "\"></div>"));
            $slideEl.append($shadowBeforeEl);
          }
          if ($shadowAfterEl.length === 0) {
            $shadowAfterEl = $(("<div class=\"swiper-slide-shadow-" + (isHorizontal ? 'right' : 'bottom') + "\"></div>"));
            $slideEl.append($shadowAfterEl);
          }
          if ($shadowBeforeEl.length) { $shadowBeforeEl[0].style.opacity = offsetMultiplier > 0 ? offsetMultiplier : 0; }
          if ($shadowAfterEl.length) { $shadowAfterEl[0].style.opacity = (-offsetMultiplier) > 0 ? -offsetMultiplier : 0; }
        }
      }

      // Set correct perspective for IE10
      if (Support.pointerEvents || Support.prefixedPointerEvents) {
        var ws = $wrapperEl[0].style;
        ws.perspectiveOrigin = center + "px 50%";
      }
    },
    setTransition: function setTransition(duration) {
      var swiper = this;
      swiper.slides
        .transition(duration)
        .find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left')
        .transition(duration);
    },
  };

  var EffectCoverflow = {
    name: 'effect-coverflow',
    params: {
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      },
    },
    create: function create() {
      var swiper = this;
      Utils.extend(swiper, {
        coverflowEffect: {
          setTranslate: Coverflow.setTranslate.bind(swiper),
          setTransition: Coverflow.setTransition.bind(swiper),
        },
      });
    },
    on: {
      beforeInit: function beforeInit() {
        var swiper = this;
        if (swiper.params.effect !== 'coverflow') { return; }

        swiper.classNames.push(((swiper.params.containerModifierClass) + "coverflow"));
        swiper.classNames.push(((swiper.params.containerModifierClass) + "3d"));

        swiper.params.watchSlidesProgress = true;
        swiper.originalParams.watchSlidesProgress = true;
      },
      setTranslate: function setTranslate() {
        var swiper = this;
        if (swiper.params.effect !== 'coverflow') { return; }
        swiper.coverflowEffect.setTranslate();
      },
      setTransition: function setTransition(duration) {
        var swiper = this;
        if (swiper.params.effect !== 'coverflow') { return; }
        swiper.coverflowEffect.setTransition(duration);
      },
    },
  };

  // Swiper Class

  Swiper.use([
    Device$1,
    Browser$1,
    Support$1,
    Resize,
    Observer$1,
    Virtual$1,
    Navigation$1,
    Pagination$1,
    Scrollbar$1,
    Parallax$1,
    Zoom$1,
    Lazy$1,
    Controller$1,
    A11y,
    Autoplay$1,
    EffectFade,
    EffectCube,
    EffectFlip,
    EffectCoverflow ]);

  {
    if (!window.Swiper) {
      window.Swiper = Swiper;
    }
  }

  function initSwiper(swiperEl) {
    var app = this;
    var $swiperEl = $(swiperEl);
    if ($swiperEl.length === 0) { return; }
    if ($swiperEl[0].swiper) { return; }
    var initialSlide;
    var params = {};
    var isTabs;
    var isRoutableTabs;
    if ($swiperEl.hasClass('tabs-swipeable-wrap')) {
      $swiperEl
        .addClass('swiper-container')
        .children('.tabs')
        .addClass('swiper-wrapper')
        .children('.tab')
        .addClass('swiper-slide');
      initialSlide = $swiperEl.children('.tabs').children('.tab-active').index();
      isTabs = true;
      isRoutableTabs = $swiperEl.find('.tabs-routable').length > 0;
    }
    if ($swiperEl.attr('data-swiper')) {
      params = JSON.parse($swiperEl.attr('data-swiper'));
    } else {
      params = $swiperEl.dataset();
      Object.keys(params).forEach(function (key) {
        var value = params[key];
        if (typeof value === 'string' && value.indexOf('{') === 0 && value.indexOf('}') > 0) {
          try {
            params[key] = JSON.parse(value);
          } catch (e) {
            // not JSON
          }
        }
      });
    }
    if (typeof params.initialSlide === 'undefined' && typeof initialSlide !== 'undefined') {
      params.initialSlide = initialSlide;
    }

    var swiper = app.swiper.create($swiperEl[0], params);
    if (isTabs) {
      swiper.on('slideChange', function () {
        if (isRoutableTabs) {
          var view = app.views.get($swiperEl.parents('.view'));
          if (!view) { view = app.views.main; }
          var router = view.router;
          var tabRoute = router.findTabRoute(swiper.slides.eq(swiper.activeIndex)[0]);
          if (tabRoute) {
            setTimeout(function () {
              router.navigate(tabRoute.path);
            }, 0);
          }
        } else {
          app.tab.show({
            tabEl: swiper.slides.eq(swiper.activeIndex),
          });
        }
      });
    }
  }

  var Swiper$1 = {
    name: 'swiper',
    static: {
      Swiper: Swiper,
    },
    create: function create() {
      var app = this;
      app.swiper = ConstructorMethods({
        defaultSelector: '.swiper-container',
        constructor: Swiper,
        domProp: 'swiper',
      });
    },
    on: {
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          app.swiper.destroy(swiperEl);
        });
      },
      pageMounted: function pageMounted(page) {
        var app = this;
        page.$el.find('.tabs-swipeable-wrap').each(function (index, swiperEl) {
          initSwiper.call(app, swiperEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          initSwiper.call(app, swiperEl);
        });
      },
      pageReinit: function pageReinit(page) {
        var app = this;
        page.$el.find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          var swiper = app.swiper.get(swiperEl);
          if (swiper && swiper.update) { swiper.update(); }
        });
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $(tabEl).find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          initSwiper.call(app, swiperEl);
        });
      },
      tabShow: function tabShow(tabEl) {
        var app = this;
        $(tabEl).find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          var swiper = app.swiper.get(swiperEl);
          if (swiper && swiper.update) { swiper.update(); }
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var app = this;
        $(tabEl).find('.swiper-init, .tabs-swipeable-wrap').each(function (index, swiperEl) {
          app.swiper.destroy(swiperEl);
        });
      },
    },
    vnode: {
      'swiper-init': {
        insert: function insert(vnode) {
          var app = this;
          var swiperEl = vnode.elm;
          initSwiper.call(app, swiperEl);
        },
        destroy: function destroy(vnode) {
          var app = this;
          var swiperEl = vnode.elm;
          app.swiper.destroy(swiperEl);
        },
      },
      'tabs-swipeable-wrap': {
        insert: function insert(vnode) {
          var app = this;
          var swiperEl = vnode.elm;
          initSwiper.call(app, swiperEl);
        },
        destroy: function destroy(vnode) {
          var app = this;
          var swiperEl = vnode.elm;
          app.swiper.destroy(swiperEl);
        },
      },
    },
  };

  /* eslint indent: ["off"] */

  var PhotoBrowser = (function (Framework7Class$$1) {
    function PhotoBrowser(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);

      var pb = this;
      pb.app = app;

      var defaults = Utils.extend({
        on: {},
      }, app.params.photoBrowser);

      // Extend defaults with modules params
      pb.useModulesParams(defaults);

      pb.params = Utils.extend(defaults, params);

      Utils.extend(pb, {
        exposed: false,
        opened: false,
        activeIndex: pb.params.swiper.initialSlide,
        url: pb.params.url,
        view: pb.params.view || app.views.main,
        swipeToClose: {
          allow: true,
          isTouched: false,
          diff: undefined,
          start: undefined,
          current: undefined,
          started: false,
          activeSlide: undefined,
          timeStart: undefined,
        },
      });

      // Install Modules
      pb.useModules();

      // Init
      pb.init();
    }

    if ( Framework7Class$$1 ) PhotoBrowser.__proto__ = Framework7Class$$1;
    PhotoBrowser.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    PhotoBrowser.prototype.constructor = PhotoBrowser;

    PhotoBrowser.prototype.onSlideChange = function onSlideChange (swiper) {
      var pb = this;
      pb.activeIndex = swiper.activeIndex;

      var current = swiper.activeIndex + 1;
      var total = pb.params.virtualSlides ? pb.params.photos.length : swiper.slides.length;
      if (swiper.params.loop) {
        total -= 2;
        current -= swiper.loopedSlides;
        if (current < 1) { current = total + current; }
        if (current > total) { current -= total; }
      }

      var $activeSlideEl = pb.params.virtualSlides
        ? swiper.$wrapperEl.find((".swiper-slide[data-swiper-slide-index=\"" + (swiper.activeIndex) + "\"]"))
        : swiper.slides.eq(swiper.activeIndex);
      var $previousSlideEl = pb.params.virtualSlides
        ? swiper.$wrapperEl.find((".swiper-slide[data-swiper-slide-index=\"" + (swiper.previousIndex) + "\"]"))
        : swiper.slides.eq(swiper.previousIndex);

      var $currentEl = pb.$el.find('.photo-browser-current');
      var $totalEl = pb.$el.find('.photo-browser-total');
      if (pb.params.type === 'page' && pb.params.navbar && $currentEl.length === 0 && pb.app.theme === 'ios') {
        var navbarEl = pb.app.navbar.getElByPage(pb.$el);
        if (navbarEl) {
          $currentEl = $(navbarEl).find('.photo-browser-current');
          $totalEl = $(navbarEl).find('.photo-browser-total');
        }
      }
      $currentEl.text(current);
      $totalEl.text(total);

      // Update captions
      if (pb.captions.length > 0) {
        var captionIndex = swiper.params.loop ? $activeSlideEl.attr('data-swiper-slide-index') : pb.activeIndex;
        pb.$captionsContainerEl.find('.photo-browser-caption-active').removeClass('photo-browser-caption-active');
        pb.$captionsContainerEl.find(("[data-caption-index=\"" + captionIndex + "\"]")).addClass('photo-browser-caption-active');
      }

      // Stop Video
      var previousSlideVideo = $previousSlideEl.find('video');
      if (previousSlideVideo.length > 0) {
        if ('pause' in previousSlideVideo[0]) { previousSlideVideo[0].pause(); }
      }
    };

    PhotoBrowser.prototype.onTouchStart = function onTouchStart () {
      var pb = this;
      var swipeToClose = pb.swipeToClose;
      if (!swipeToClose.allow) { return; }
      swipeToClose.isTouched = true;
    };

    PhotoBrowser.prototype.onTouchMove = function onTouchMove (e) {
      var pb = this;
      var swipeToClose = pb.swipeToClose;

      if (!swipeToClose.isTouched) { return; }
      if (!swipeToClose.started) {
        swipeToClose.started = true;
        swipeToClose.start = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
        if (pb.params.virtualSlides) {
          swipeToClose.activeSlide = pb.swiper.$wrapperEl.children('.swiper-slide-active');
        } else {
          swipeToClose.activeSlide = pb.swiper.slides.eq(pb.swiper.activeIndex);
        }
        swipeToClose.timeStart = Utils.now();
      }
      e.preventDefault();
      swipeToClose.current = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      swipeToClose.diff = swipeToClose.start - swipeToClose.current;
      var opacity = 1 - (Math.abs(swipeToClose.diff) / 300);
      var color = pb.exposed || pb.params.theme === 'dark' ? 0 : 255;
      swipeToClose.activeSlide.transform(("translate3d(0," + (-swipeToClose.diff) + "px,0)"));
      pb.swiper.$el.css('background-color', ("rgba(" + color + ", " + color + ", " + color + ", " + opacity + ")")).transition(0);
    };

    PhotoBrowser.prototype.onTouchEnd = function onTouchEnd () {
      var pb = this;
      var swipeToClose = pb.swipeToClose;
      swipeToClose.isTouched = false;
      if (!swipeToClose.started) {
        swipeToClose.started = false;
        return;
      }
      swipeToClose.started = false;
      swipeToClose.allow = false;
      var diff = Math.abs(swipeToClose.diff);
      var timeDiff = (new Date()).getTime() - swipeToClose.timeStart;
      if ((timeDiff < 300 && diff > 20) || (timeDiff >= 300 && diff > 100)) {
        Utils.nextTick(function () {
          if (pb.$el) {
            if (swipeToClose.diff < 0) { pb.$el.addClass('swipe-close-to-bottom'); }
            else { pb.$el.addClass('swipe-close-to-top'); }
          }
          pb.emit('local::swipeToClose', pb);
          pb.close();
          swipeToClose.allow = true;
        });
        return;
      }
      if (diff !== 0) {
        swipeToClose.activeSlide.addClass('photo-browser-transitioning').transitionEnd(function () {
          swipeToClose.allow = true;
          swipeToClose.activeSlide.removeClass('photo-browser-transitioning');
        });
      } else {
        swipeToClose.allow = true;
      }
      pb.swiper.$el.transition('').css('background-color', '');
      swipeToClose.activeSlide.transform('');
    };

    // Render Functions
    PhotoBrowser.prototype.renderNavbar = function renderNavbar () {
      var pb = this;
      if (pb.params.renderNavbar) { return pb.params.renderNavbar.call(pb); }

      var iconsColor = pb.params.iconsColor;
      if (!pb.params.iconsColor && pb.params.theme === 'dark') { iconsColor = 'white'; }

      var backLinkText = pb.app.theme === 'ios' && pb.params.backLinkText ? pb.params.backLinkText : '';

      var isPopup = pb.params.type !== 'page';
      var navbarHtml = ("\n      <div class=\"navbar\">\n        <div class=\"navbar-inner sliding\">\n          <div class=\"left\">\n            <a href=\"#\" class=\"link " + (isPopup ? 'popup-close' : '') + " " + (!backLinkText ? 'icon-only' : '') + " " + (!isPopup ? 'back' : '') + "\" " + (isPopup ? 'data-popup=".photo-browser-popup"' : '') + ">\n              <i class=\"icon icon-back " + (iconsColor ? ("color-" + iconsColor) : '') + "\"></i>\n              " + (backLinkText ? ("<span>" + backLinkText + "</span>") : '') + "\n            </a>\n          </div>\n          <div class=\"title\">\n            <span class=\"photo-browser-current\"></span>\n            <span class=\"photo-browser-of\">" + (pb.params.navbarOfText) + "</span>\n            <span class=\"photo-browser-total\"></span>\n          </div>\n          <div class=\"right\"></div>\n        </div>\n      </div>\n    ").trim();
      return navbarHtml;
    };

    PhotoBrowser.prototype.renderToolbar = function renderToolbar () {
      var pb = this;
      if (pb.params.renderToolbar) { return pb.params.renderToolbar.call(pb); }

      var iconsColor = pb.params.iconsColor;
      if (!pb.params.iconsColor && pb.params.theme === 'dark') { iconsColor = 'white'; }

      var toolbarHtml = ("\n      <div class=\"toolbar tabbar toolbar-bottom-md\">\n        <div class=\"toolbar-inner\">\n          <a href=\"#\" class=\"link photo-browser-prev\">\n            <i class=\"icon icon-back " + (iconsColor ? ("color-" + iconsColor) : '') + "\"></i>\n          </a>\n          <a href=\"#\" class=\"link photo-browser-next\">\n            <i class=\"icon icon-forward " + (iconsColor ? ("color-" + iconsColor) : '') + "\"></i>\n          </a>\n        </div>\n      </div>\n    ").trim();
      return toolbarHtml;
    };

    PhotoBrowser.prototype.renderCaption = function renderCaption (caption, index) {
      var pb = this;
      if (pb.params.renderCaption) { return pb.params.renderCaption.call(pb, caption, index); }
      var captionHtml = ("\n      <div class=\"photo-browser-caption\" data-caption-index=\"" + index + "\">\n        " + caption + "\n      </div>\n    ").trim();
      return captionHtml;
    };

    PhotoBrowser.prototype.renderObject = function renderObject (photo, index) {
      var pb = this;
      if (pb.params.renderObject) { return pb.params.renderObject.call(pb, photo, index); }
      var objHtml = "\n      <div class=\"photo-browser-slide photo-browser-object-slide swiper-slide\" data-swiper-slide-index=\"" + index + "\">" + (photo.html ? photo.html : photo) + "</div>\n    ";
      return objHtml;
    };

    PhotoBrowser.prototype.renderLazyPhoto = function renderLazyPhoto (photo, index) {
      var pb = this;
      if (pb.params.renderLazyPhoto) { return pb.params.renderLazyPhoto.call(pb, photo, index); }
      var photoHtml = ("\n      <div class=\"photo-browser-slide photo-browser-slide-lazy swiper-slide\" data-swiper-slide-index=\"" + index + "\">\n          <div class=\"preloader swiper-lazy-preloader " + (pb.params.theme === 'dark' ? 'color-white' : '') + "\">" + (pb.app.theme === 'md' ? Utils.mdPreloaderContent : '') + "</div>\n          <span class=\"swiper-zoom-container\">\n              <img data-src=\"" + (photo.url ? photo.url : photo) + "\" class=\"swiper-lazy\">\n          </span>\n      </div>\n    ").trim();
      return photoHtml;
    };

    PhotoBrowser.prototype.renderPhoto = function renderPhoto (photo, index) {
      var pb = this;
      if (pb.params.renderPhoto) { return pb.params.renderPhoto.call(pb, photo, index); }
      var photoHtml = ("\n      <div class=\"photo-browser-slide swiper-slide\" data-swiper-slide-index=\"" + index + "\">\n        <span class=\"swiper-zoom-container\">\n          <img src=\"" + (photo.url ? photo.url : photo) + "\">\n        </span>\n      </div>\n    ").trim();
      return photoHtml;
    };

    PhotoBrowser.prototype.render = function render () {
      var pb = this;
      if (pb.params.render) { return pb.params.render.call(pb, pb.params); }
      var html = ("\n      <div class=\"photo-browser photo-browser-" + (pb.params.theme) + "\">\n        <div class=\"view\">\n          <div class=\"page photo-browser-page photo-browser-page-" + (pb.params.theme) + " no-toolbar " + (!pb.params.navbar ? 'no-navbar' : '') + "\" data-name=\"photo-browser-page\">\n            " + (pb.params.navbar ? pb.renderNavbar() : '') + "\n            " + (pb.params.toolbar ? pb.renderToolbar() : '') + "\n            <div class=\"photo-browser-captions photo-browser-captions-" + (pb.params.captionsTheme || pb.params.theme) + "\">\n              " + (pb.params.photos.map(function (photo, index) {
                  if (photo.caption) { return pb.renderCaption(photo.caption, index); }
                  return '';
                }).join(' ')) + "\n            </div>\n            <div class=\"photo-browser-swiper-container swiper-container\">\n              <div class=\"photo-browser-swiper-wrapper swiper-wrapper\">\n                " + (pb.params.virtualSlides ? '' : pb.params.photos.map(function (photo, index) {
                    if (photo.html || ((typeof photo === 'string' || photo instanceof String) && photo.indexOf('<') >= 0 && photo.indexOf('>') >= 0)) {
                      return pb.renderObject(photo, index);
                    }
                    if (pb.params.swiper.lazy === true || (pb.params.swiper.lazy && pb.params.swiper.lazy.enabled)) {
                      return pb.renderLazyPhoto(photo, index);
                    }
                    return pb.renderPhoto(photo, index);
                  }).join(' ')) + "\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ").trim();
      return html;
    };

    PhotoBrowser.prototype.renderStandalone = function renderStandalone () {
      var pb = this;
      if (pb.params.renderStandalone) { return pb.params.renderStandalone.call(pb); }
      var standaloneHtml = "<div class=\"popup photo-browser-popup photo-browser-standalone popup-tablet-fullscreen\">" + (pb.render()) + "</div>";
      return standaloneHtml;
    };

    PhotoBrowser.prototype.renderPage = function renderPage () {
      var pb = this;
      if (pb.params.renderPage) { return pb.params.renderPage.call(pb); }
      var pageHtml = pb.render();

      return pageHtml;
    };

    PhotoBrowser.prototype.renderPopup = function renderPopup () {
      var pb = this;
      if (pb.params.renderPopup) { return pb.params.renderPopup.call(pb); }
      var popupHtml = "<div class=\"popup photo-browser-popup\">" + (pb.render()) + "</div>";

      return popupHtml;
    };

    // Callbacks
    PhotoBrowser.prototype.onOpen = function onOpen (type, el) {
      var pb = this;
      var app = pb.app;
      var $el = $(el);

      $el[0].f7PhotoBrowser = pb;

      pb.$el = $el;
      pb.el = $el[0];
      pb.openedIn = type;
      pb.opened = true;

      pb.$swiperContainerEl = pb.$el.find('.photo-browser-swiper-container');
      pb.$swiperWrapperEl = pb.$el.find('.photo-browser-swiper-wrapper');
      pb.slides = pb.$el.find('.photo-browser-slide');
      pb.$captionsContainerEl = pb.$el.find('.photo-browser-captions');
      pb.captions = pb.$el.find('.photo-browser-caption');

      // Init Swiper
      var swiperParams = Utils.extend({}, pb.params.swiper, {
        initialSlide: pb.activeIndex,
        on: {
          tap: function tap(e) {
            pb.emit('local::tap', e);
          },
          click: function click(e) {
            if (pb.params.exposition) {
              pb.expositionToggle();
            }
            pb.emit('local::click', e);
          },
          doubleTap: function doubleTap(e) {
            pb.emit('local::doubleTap', e);
          },
          slideChange: function slideChange() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var swiper = this;
            pb.onSlideChange(swiper);
            pb.emit.apply(pb, [ 'local::slideChange' ].concat( args ));
          },
          transitionStart: function transitionStart() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            pb.emit.apply(pb, [ 'local::transitionStart' ].concat( args ));
          },
          transitionEnd: function transitionEnd() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            pb.emit.apply(pb, [ 'local::transitionEnd' ].concat( args ));
          },
          slideChangeTransitionStart: function slideChangeTransitionStart() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            pb.emit.apply(pb, [ 'local::slideChangeTransitionStart' ].concat( args ));
          },
          slideChangeTransitionEnd: function slideChangeTransitionEnd() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            pb.emit.apply(pb, [ 'local::slideChangeTransitionEnd' ].concat( args ));
          },
          lazyImageLoad: function lazyImageLoad() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            pb.emit.apply(pb, [ 'local::lazyImageLoad' ].concat( args ));
          },
          lazyImageReady: function lazyImageReady() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var slideEl = args[0];
            $(slideEl).removeClass('photo-browser-slide-lazy');
            pb.emit.apply(pb, [ 'local::lazyImageReady' ].concat( args ));
          },
        },
      });
      if (pb.params.swipeToClose && pb.params.type !== 'page') {
        Utils.extend(swiperParams.on, {
          touchStart: function touchStart(e) {
            pb.onTouchStart(e);
            pb.emit('local::touchStart', e);
          },
          touchMoveOpposite: function touchMoveOpposite(e) {
            pb.onTouchMove(e);
            pb.emit('local::touchMoveOpposite', e);
          },
          touchEnd: function touchEnd(e) {
            pb.onTouchEnd(e);
            pb.emit('local::touchEnd', e);
          },
        });
      }
      if (pb.params.virtualSlides) {
        Utils.extend(swiperParams, {
          virtual: {
            slides: pb.params.photos,
            renderSlide: function renderSlide(photo, index) {
              if (photo.html || ((typeof photo === 'string' || photo instanceof String) && photo.indexOf('<') >= 0 && photo.indexOf('>') >= 0)) {
                return pb.renderObject(photo, index);
              }
              if (pb.params.swiper.lazy === true || (pb.params.swiper.lazy && pb.params.swiper.lazy.enabled)) {
                return pb.renderLazyPhoto(photo, index);
              }
              return pb.renderPhoto(photo, index);
            },
          },
        });
      }

      pb.swiper = app.swiper.create(pb.$swiperContainerEl, swiperParams);

      if (pb.activeIndex === 0) {
        pb.onSlideChange(pb.swiper);
      }
      if (pb.$el) {
        pb.$el.trigger('photobrowser:open');
      }
      pb.emit('local::open photoBrowserOpen', pb);
    };

    PhotoBrowser.prototype.onOpened = function onOpened () {
      var pb = this;

      if (pb.$el) {
        pb.$el.trigger('photobrowser:opened');
      }
      pb.emit('local::opened photoBrowserOpened', pb);
    };

    PhotoBrowser.prototype.onClose = function onClose () {
      var pb = this;
      if (pb.destroyed) { return; }

      // Destroy Swiper
      if (pb.swiper && pb.swiper.destroy) {
        pb.swiper.destroy(true, false);
        pb.swiper = null;
        delete pb.swiper;
      }
      if (pb.$el) {
        pb.$el.trigger('photobrowser:close');
      }
      pb.emit('local::close photoBrowserClose', pb);
    };

    PhotoBrowser.prototype.onClosed = function onClosed () {
      var pb = this;
      if (pb.destroyed) { return; }
      pb.opened = false;
      pb.$el = null;
      pb.el = null;
      delete pb.$el;
      delete pb.el;
      if (pb.$el) {
        pb.$el.trigger('photobrowser:closed');
      }
      pb.emit('local::closed photoBrowserClosed', pb);
    };

    // Open
    PhotoBrowser.prototype.openPage = function openPage () {
      var pb = this;
      if (pb.opened) { return pb; }

      var pageHtml = pb.renderPage();

      pb.view.router.navigate({
        url: pb.url,
        route: {
          content: pageHtml,
          path: pb.url,
          on: {
            pageBeforeIn: function pageBeforeIn(e, page) {
              pb.view.$el.addClass(("with-photo-browser-page with-photo-browser-page-" + (pb.params.theme)));
              pb.onOpen('page', page.el);
            },
            pageAfterIn: function pageAfterIn(e, page) {
              pb.onOpened('page', page.el);
            },
            pageBeforeOut: function pageBeforeOut(e, page) {
              pb.view.$el.removeClass(("with-photo-browser-page with-photo-browser-page-exposed with-photo-browser-page-" + (pb.params.theme)));
              pb.onClose('page', page.el);
            },
            pageAfterOut: function pageAfterOut(e, page) {
              pb.onClosed('page', page.el);
            },
          },
        },
      });
      return pb;
    };

    PhotoBrowser.prototype.openStandalone = function openStandalone () {
      var pb = this;
      if (pb.opened) { return pb; }

      var standaloneHtml = pb.renderStandalone();

      var popupParams = {
        backdrop: false,
        content: standaloneHtml,
        on: {
          popupOpen: function popupOpen(popup) {
            pb.onOpen('popup', popup.el);
          },
          popupOpened: function popupOpened(popup) {
            pb.onOpened('popup', popup.el);
          },
          popupClose: function popupClose(popup) {
            pb.onClose('popup', popup.el);
          },
          popupClosed: function popupClosed(popup) {
            pb.onClosed('popup', popup.el);
          },
        },
      };

      if (pb.params.routableModals) {
        pb.view.router.navigate({
          url: pb.url,
          route: {
            path: pb.url,
            popup: popupParams,
          },
        });
      } else {
        pb.modal = pb.app.popup.create(popupParams).open();
      }
      return pb;
    };

    PhotoBrowser.prototype.openPopup = function openPopup () {
      var pb = this;
      if (pb.opened) { return pb; }

      var popupHtml = pb.renderPopup();

      var popupParams = {
        content: popupHtml,
        on: {
          popupOpen: function popupOpen(popup) {
            pb.onOpen('popup', popup.el);
          },
          popupOpened: function popupOpened(popup) {
            pb.onOpened('popup', popup.el);
          },
          popupClose: function popupClose(popup) {
            pb.onClose('popup', popup.el);
          },
          popupClosed: function popupClosed(popup) {
            pb.onClosed('popup', popup.el);
          },
        },
      };

      if (pb.params.routableModals) {
        pb.view.router.navigate({
          url: pb.url,
          route: {
            path: pb.url,
            popup: popupParams,
          },
        });
      } else {
        pb.modal = pb.app.popup.create(popupParams).open();
      }
      return pb;
    };

    // Exposition
    PhotoBrowser.prototype.expositionEnable = function expositionEnable () {
      var pb = this;
      if (pb.params.type === 'page') {
        pb.view.$el.addClass('with-photo-browser-page-exposed');
      }
      if (pb.$el) { pb.$el.addClass('photo-browser-exposed'); }
      if (pb.params.expositionHideCaptions) { pb.$captionsContainerEl.addClass('photo-browser-captions-exposed'); }
      pb.exposed = true;
      return pb;
    };

    PhotoBrowser.prototype.expositionDisable = function expositionDisable () {
      var pb = this;
      if (pb.params.type === 'page') {
        pb.view.$el.removeClass('with-photo-browser-page-exposed');
      }
      if (pb.$el) { pb.$el.removeClass('photo-browser-exposed'); }
      if (pb.params.expositionHideCaptions) { pb.$captionsContainerEl.removeClass('photo-browser-captions-exposed'); }
      pb.exposed = false;
      return pb;
    };

    PhotoBrowser.prototype.expositionToggle = function expositionToggle () {
      var pb = this;
      if (pb.params.type === 'page') {
        pb.view.$el.toggleClass('with-photo-browser-page-exposed');
      }
      if (pb.$el) { pb.$el.toggleClass('photo-browser-exposed'); }
      if (pb.params.expositionHideCaptions) { pb.$captionsContainerEl.toggleClass('photo-browser-captions-exposed'); }
      pb.exposed = !pb.exposed;
      return pb;
    };

    PhotoBrowser.prototype.open = function open (index) {
      var pb = this;
      var type = pb.params.type;
      if (pb.opened) {
        if (pb.swiper && typeof index !== 'undefined') {
          pb.swiper.slideTo(parseInt(index, 10));
        }
        return pb;
      }
      if (typeof index !== 'undefined') {
        pb.activeIndex = index;
      }
      if (type === 'standalone') {
        pb.openStandalone();
      }
      if (type === 'page') {
        pb.openPage();
      }
      if (type === 'popup') {
        pb.openPopup();
      }
      return pb;
    };

    PhotoBrowser.prototype.close = function close () {
      var pb = this;
      if (!pb.opened) { return pb; }
      if (pb.params.routableModals || pb.openedIn === 'page') {
        if (pb.view) { pb.view.router.back(); }
      } else {
        pb.modal.once('modalClosed', function () {
          Utils.nextTick(function () {
            pb.modal.destroy();
            delete pb.modal;
          });
        });
        pb.modal.close();
      }
      return pb;
    };
    // eslint-disable-next-line
    PhotoBrowser.prototype.init = function init () {};

    PhotoBrowser.prototype.destroy = function destroy () {
      var pb = this;
      pb.emit('local::beforeDestroy photoBrowserBeforeDestroy', pb);
      if (pb.$el) {
        pb.$el.trigger('photobrowser:beforedestroy');
        pb.$el[0].f7PhotoBrowser = null;
        delete pb.$el[0].f7PhotoBrowser;
      }
      Utils.deleteProps(pb);
      pb = null;
    };

    return PhotoBrowser;
  }(Framework7Class));

  var PhotoBrowser$1 = {
    name: 'photoBrowser',
    params: {
      photoBrowser: {
        photos: [],
        exposition: true,
        expositionHideCaptions: false,
        type: 'standalone',
        navbar: true,
        toolbar: true,
        theme: 'light',
        captionsTheme: undefined,
        iconsColor: undefined,
        swipeToClose: true,
        backLinkText: 'Close',
        navbarOfText: 'of',
        view: undefined,
        url: 'photos/',
        routableModals: true,
        virtualSlides: true,

        renderNavbar: undefined,
        renderToolbar: undefined,
        renderCaption: undefined,
        renderObject: undefined,
        renderLazyPhoto: undefined,
        renderPhoto: undefined,
        renderPage: undefined,
        renderPopup: undefined,
        renderStandalone: undefined,

        swiper: {
          initialSlide: 0,
          spaceBetween: 20,
          speed: 300,
          loop: false,
          preloadImages: true,
          navigation: {
            nextEl: '.photo-browser-next',
            prevEl: '.photo-browser-prev',
          },
          zoom: {
            enabled: true,
            maxRatio: 3,
            minRatio: 1,
          },
          lazy: {
            enabled: true,
          },
        },
      },
    },
    create: function create() {
      var app = this;
      app.photoBrowser = ConstructorMethods({
        defaultSelector: '.photo-browser',
        constructor: PhotoBrowser,
        app: app,
        domProp: 'f7PhotoBrowser',
      });
    },
    static: {
      PhotoBrowser: PhotoBrowser,
    },
  };

  var Typography = {
    name: 'typography',
  };

  {
    if (typeof window !== 'undefined') {
      // Template7
      if (!window.Template7) { window.Template7 = Template7; }

      // Dom7
      if (!window.Dom7) { window.Dom7 = $; }
    }
  }

  // Install Core Modules & Components
  Framework7.use([
    DeviceModule,
    SupportModule,
    UtilsModule,
    ResizeModule,
    RequestModule,
    TouchModule,
    ClicksModule,
    Router$1,
    HistoryModule,
    StorageModule,
    ComponentModule,
    Statusbar$1,
    View$1,
    Navbar$1,
    Toolbar$1,
    Subnavbar,
    TouchRipple$1,
    Modal$1,
    Dialog$1,
    Popup$1,
    LoginScreen$1,
    Popover$1,
    Actions$1,
    Sheet$1,
    Toast$1,
    Preloader$1,
    Tabs,
    Panel$1,
    Card,
    Chip,
    Form,
    Input$1,
    Checkbox,
    Radio,
    Toggle$1,
    Range$1,
    Stepper$1,
    SmartSelect$1,
    Grid,
    Calendar$1,
    Picker$1,
    Searchbar$1,
    Messages$1,
    Messagebar$1,
    Swiper$1,
    PhotoBrowser$1,
    Typography
  ]);

  return Framework7;

})));
