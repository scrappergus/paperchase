(function() {
    window._altmetric || (window._altmetric = {}), window._altmetric["export"] = function(e, t) {
        return window._altmetric[e] = t
    }, window._altmetric.exports = function(e) {
        var t, n, i;
        n = [];
        for (t in e) i = e[t], n.push(window._altmetric[t] = i);
        return n
    }
}).call(this), window._altmetric.api_uri = "https://api.altmetric.com", window._altmetric.api_key = "3c130976ca2b8f2e88f8377633751ba1", window._altmetric.api_version = "v1", window._altmetric.details_uri = "https://www.altmetric.com",
    function() {
        var e;
        e = function(e) {
            var t, n;
            return t = document.createElement("div"), n = document.createTextNode(e), t.appendChild(n), t.innerHTML
        }, _altmetric.exports({
            encodeHTML: e
        })
    }.call(this),
    function(e) {
        "function" == typeof e.define && (e._altmetric_define = e.define, e.define = void 0), "object" == typeof e.exports && (e._altmetric_exports = e.exports, e.exports = void 0)
    }(window),
    function(e, t) {
        "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.Handlebars = t() : e.Handlebars = t()
    }(this, function() {
        return function(e) {
            function t(i) {
                if (n[i]) return n[i].exports;
                var r = n[i] = {
                    exports: {},
                    id: i,
                    loaded: !1
                };
                return e[i].call(r.exports, r, r.exports, t), r.loaded = !0, r.exports
            }
            var n = {};
            return t.m = e, t.c = n, t.p = "", t(0)
        }([function(e, t, n) {
            "use strict";

            function i() {
                var e = new l.HandlebarsEnvironment;
                return h.extend(e, l), e.SafeString = u["default"], e.Exception = d["default"], e.Utils = h, e.escapeExpression = h.escapeExpression, e.VM = m, e.template = function(t) {
                    return m.template(t, e)
                }, e
            }
            var r = n(1)["default"],
                o = n(2)["default"];
            t.__esModule = !0;
            var a = n(3),
                l = r(a),
                s = n(17),
                u = o(s),
                c = n(5),
                d = o(c),
                p = n(4),
                h = r(p),
                f = n(18),
                m = r(f),
                g = n(19),
                _ = o(g),
                v = i();
            v.create = i, _["default"](v), v["default"] = v, t["default"] = v, e.exports = t["default"]
        }, function(e, t) {
            "use strict";
            t["default"] = function(e) {
                if (e && e.__esModule) return e;
                var t = {};
                if (null != e)
                    for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                return t["default"] = e, t
            }, t.__esModule = !0
        }, function(e, t) {
            "use strict";
            t["default"] = function(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }, t.__esModule = !0
        }, function(e, t, n) {
            "use strict";

            function i(e, t, n) {
                this.helpers = e || {}, this.partials = t || {}, this.decorators = n || {}, s.registerDefaultHelpers(this), u.registerDefaultDecorators(this)
            }
            var r = n(2)["default"];
            t.__esModule = !0, t.HandlebarsEnvironment = i;
            var o = n(4),
                a = n(5),
                l = r(a),
                s = n(6),
                u = n(14),
                c = n(16),
                d = r(c),
                p = "4.0.5";
            t.VERSION = p;
            var h = 7;
            t.COMPILER_REVISION = h;
            var f = {
                1: "<= 1.0.rc.2",
                2: "== 1.0.0-rc.3",
                3: "== 1.0.0-rc.4",
                4: "== 1.x.x",
                5: "== 2.0.0-alpha.x",
                6: ">= 2.0.0-beta.1",
                7: ">= 4.0.0"
            };
            t.REVISION_CHANGES = f;
            var m = "[object Object]";
            i.prototype = {
                constructor: i,
                logger: d["default"],
                log: d["default"].log,
                registerHelper: function(e, t) {
                    if (o.toString.call(e) === m) {
                        if (t) throw new l["default"]("Arg not supported with multiple helpers");
                        o.extend(this.helpers, e)
                    } else this.helpers[e] = t
                },
                unregisterHelper: function(e) {
                    delete this.helpers[e]
                },
                registerPartial: function(e, t) {
                    if (o.toString.call(e) === m) o.extend(this.partials, e);
                    else {
                        if ("undefined" == typeof t) throw new l["default"]('Attempting to register a partial called "' + e + '" as undefined');
                        this.partials[e] = t
                    }
                },
                unregisterPartial: function(e) {
                    delete this.partials[e]
                },
                registerDecorator: function(e, t) {
                    if (o.toString.call(e) === m) {
                        if (t) throw new l["default"]("Arg not supported with multiple decorators");
                        o.extend(this.decorators, e)
                    } else this.decorators[e] = t
                },
                unregisterDecorator: function(e) {
                    delete this.decorators[e]
                }
            };
            var g = d["default"].log;
            t.log = g, t.createFrame = o.createFrame, t.logger = d["default"]
        }, function(e, t) {
            "use strict";

            function n(e) {
                return c[e]
            }

            function i(e) {
                for (var t = 1; t < arguments.length; t++)
                    for (var n in arguments[t]) Object.prototype.hasOwnProperty.call(arguments[t], n) && (e[n] = arguments[t][n]);
                return e
            }

            function r(e, t) {
                for (var n = 0, i = e.length; i > n; n++)
                    if (e[n] === t) return n;
                return -1
            }

            function o(e) {
                if ("string" != typeof e) {
                    if (e && e.toHTML) return e.toHTML();
                    if (null == e) return "";
                    if (!e) return e + "";
                    e = "" + e
                }
                return p.test(e) ? e.replace(d, n) : e
            }

            function a(e) {
                return e || 0 === e ? m(e) && 0 === e.length ? !0 : !1 : !0
            }

            function l(e) {
                var t = i({}, e);
                return t._parent = e, t
            }

            function s(e, t) {
                return e.path = t, e
            }

            function u(e, t) {
                return (e ? e + "." : "") + t
            }
            t.__esModule = !0, t.extend = i, t.indexOf = r, t.escapeExpression = o, t.isEmpty = a, t.createFrame = l, t.blockParams = s, t.appendContextPath = u;
            var c = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;",
                    "=": "&#x3D;"
                },
                d = /[&<>"'`=]/g,
                p = /[&<>"'`=]/,
                h = Object.prototype.toString;
            t.toString = h;
            var f = function(e) {
                return "function" == typeof e
            };
            f(/x/) && (t.isFunction = f = function(e) {
                return "function" == typeof e && "[object Function]" === h.call(e)
            }), t.isFunction = f;
            var m = Array.isArray || function(e) {
                return e && "object" == typeof e ? "[object Array]" === h.call(e) : !1
            };
            t.isArray = m
        }, function(e, t) {
            "use strict";

            function n(e, t) {
                var r = t && t.loc,
                    o = void 0,
                    a = void 0;
                r && (o = r.start.line, a = r.start.column, e += " - " + o + ":" + a);
                for (var l = Error.prototype.constructor.call(this, e), s = 0; s < i.length; s++) this[i[s]] = l[i[s]];
                Error.captureStackTrace && Error.captureStackTrace(this, n), r && (this.lineNumber = o, this.column = a)
            }
            t.__esModule = !0;
            var i = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
            n.prototype = new Error, t["default"] = n, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";

            function i(e) {
                a["default"](e), s["default"](e), c["default"](e), p["default"](e), f["default"](e), g["default"](e), v["default"](e)
            }
            var r = n(2)["default"];
            t.__esModule = !0, t.registerDefaultHelpers = i;
            var o = n(7),
                a = r(o),
                l = n(8),
                s = r(l),
                u = n(9),
                c = r(u),
                d = n(10),
                p = r(d),
                h = n(11),
                f = r(h),
                m = n(12),
                g = r(m),
                _ = n(13),
                v = r(_)
        }, function(e, t, n) {
            "use strict";
            t.__esModule = !0;
            var i = n(4);
            t["default"] = function(e) {
                e.registerHelper("blockHelperMissing", function(t, n) {
                    var r = n.inverse,
                        o = n.fn;
                    if (t === !0) return o(this);
                    if (t === !1 || null == t) return r(this);
                    if (i.isArray(t)) return t.length > 0 ? (n.ids && (n.ids = [n.name]), e.helpers.each(t, n)) : r(this);
                    if (n.data && n.ids) {
                        var a = i.createFrame(n.data);
                        a.contextPath = i.appendContextPath(n.data.contextPath, n.name), n = {
                            data: a
                        }
                    }
                    return o(t, n)
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";
            var i = n(2)["default"];
            t.__esModule = !0;
            var r = n(4),
                o = n(5),
                a = i(o);
            t["default"] = function(e) {
                e.registerHelper("each", function(e, t) {
                    function n(t, n, o) {
                        u && (u.key = t, u.index = n, u.first = 0 === n, u.last = !!o, c && (u.contextPath = c + t)), s += i(e[t], {
                            data: u,
                            blockParams: r.blockParams([e[t], t], [c + t, null])
                        })
                    }
                    if (!t) throw new a["default"]("Must pass iterator to #each");
                    var i = t.fn,
                        o = t.inverse,
                        l = 0,
                        s = "",
                        u = void 0,
                        c = void 0;
                    if (t.data && t.ids && (c = r.appendContextPath(t.data.contextPath, t.ids[0]) + "."), r.isFunction(e) && (e = e.call(this)), t.data && (u = r.createFrame(t.data)), e && "object" == typeof e)
                        if (r.isArray(e))
                            for (var d = e.length; d > l; l++) l in e && n(l, l, l === e.length - 1);
                        else {
                            var p = void 0;
                            for (var h in e) e.hasOwnProperty(h) && (void 0 !== p && n(p, l - 1), p = h, l++);
                            void 0 !== p && n(p, l - 1, !0)
                        }
                    return 0 === l && (s = o(this)), s
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";
            var i = n(2)["default"];
            t.__esModule = !0;
            var r = n(5),
                o = i(r);
            t["default"] = function(e) {
                e.registerHelper("helperMissing", function() {
                    if (1 === arguments.length) return void 0;
                    throw new o["default"]('Missing helper: "' + arguments[arguments.length - 1].name + '"')
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";
            t.__esModule = !0;
            var i = n(4);
            t["default"] = function(e) {
                e.registerHelper("if", function(e, t) {
                    return i.isFunction(e) && (e = e.call(this)), !t.hash.includeZero && !e || i.isEmpty(e) ? t.inverse(this) : t.fn(this)
                }), e.registerHelper("unless", function(t, n) {
                    return e.helpers["if"].call(this, t, {
                        fn: n.inverse,
                        inverse: n.fn,
                        hash: n.hash
                    })
                })
            }, e.exports = t["default"]
        }, function(e, t) {
            "use strict";
            t.__esModule = !0, t["default"] = function(e) {
                e.registerHelper("log", function() {
                    for (var t = [void 0], n = arguments[arguments.length - 1], i = 0; i < arguments.length - 1; i++) t.push(arguments[i]);
                    var r = 1;
                    null != n.hash.level ? r = n.hash.level : n.data && null != n.data.level && (r = n.data.level), t[0] = r, e.log.apply(e, t)
                })
            }, e.exports = t["default"]
        }, function(e, t) {
            "use strict";
            t.__esModule = !0, t["default"] = function(e) {
                e.registerHelper("lookup", function(e, t) {
                    return e && e[t]
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";
            t.__esModule = !0;
            var i = n(4);
            t["default"] = function(e) {
                e.registerHelper("with", function(e, t) {
                    i.isFunction(e) && (e = e.call(this));
                    var n = t.fn;
                    if (i.isEmpty(e)) return t.inverse(this);
                    var r = t.data;
                    return t.data && t.ids && (r = i.createFrame(t.data), r.contextPath = i.appendContextPath(t.data.contextPath, t.ids[0])), n(e, {
                        data: r,
                        blockParams: i.blockParams([e], [r && r.contextPath])
                    })
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";

            function i(e) {
                a["default"](e)
            }
            var r = n(2)["default"];
            t.__esModule = !0, t.registerDefaultDecorators = i;
            var o = n(15),
                a = r(o)
        }, function(e, t, n) {
            "use strict";
            t.__esModule = !0;
            var i = n(4);
            t["default"] = function(e) {
                e.registerDecorator("inline", function(e, t, n, r) {
                    var o = e;
                    return t.partials || (t.partials = {}, o = function(r, o) {
                        var a = n.partials;
                        n.partials = i.extend({}, a, t.partials);
                        var l = e(r, o);
                        return n.partials = a, l
                    }), t.partials[r.args[0]] = r.fn, o
                })
            }, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";
            t.__esModule = !0;
            var i = n(4),
                r = {
                    methodMap: ["debug", "info", "warn", "error"],
                    level: "info",
                    lookupLevel: function(e) {
                        if ("string" == typeof e) {
                            var t = i.indexOf(r.methodMap, e.toLowerCase());
                            e = t >= 0 ? t : parseInt(e, 10)
                        }
                        return e
                    },
                    log: function(e) {
                        if (e = r.lookupLevel(e), "undefined" != typeof console && r.lookupLevel(r.level) <= e) {
                            var t = r.methodMap[e];
                            console[t] || (t = "log");
                            for (var n = arguments.length, i = Array(n > 1 ? n - 1 : 0), o = 1; n > o; o++) i[o - 1] = arguments[o];
                            console[t].apply(console, i)
                        }
                    }
                };
            t["default"] = r, e.exports = t["default"]
        }, function(e, t) {
            "use strict";

            function n(e) {
                this.string = e
            }
            t.__esModule = !0, n.prototype.toString = n.prototype.toHTML = function() {
                return "" + this.string
            }, t["default"] = n, e.exports = t["default"]
        }, function(e, t, n) {
            "use strict";

            function i(e) {
                var t = e && e[0] || 1,
                    n = _.COMPILER_REVISION;
                if (t !== n) {
                    if (n > t) {
                        var i = _.REVISION_CHANGES[n],
                            r = _.REVISION_CHANGES[t];
                        throw new g["default"]("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + i + ") or downgrade your runtime to an older version (" + r + ").")
                    }
                    throw new g["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + e[1] + ").")
                }
            }

            function r(e, t) {
                function n(n, i, r) {
                    r.hash && (i = f.extend({}, i, r.hash), r.ids && (r.ids[0] = !0)), n = t.VM.resolvePartial.call(this, n, i, r);
                    var o = t.VM.invokePartial.call(this, n, i, r);
                    if (null == o && t.compile && (r.partials[r.name] = t.compile(n, e.compilerOptions, t), o = r.partials[r.name](i, r)), null != o) {
                        if (r.indent) {
                            for (var a = o.split("\n"), l = 0, s = a.length; s > l && (a[l] || l + 1 !== s); l++) a[l] = r.indent + a[l];
                            o = a.join("\n")
                        }
                        return o
                    }
                    throw new g["default"]("The partial " + r.name + " could not be compiled when running in runtime-only mode")
                }

                function i(t) {
                    function n(t) {
                        return "" + e.main(r, t, r.helpers, r.partials, a, s, l)
                    }
                    var o = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                        a = o.data;
                    i._setup(o), !o.partial && e.useData && (a = u(t, a));
                    var l = void 0,
                        s = e.useBlockParams ? [] : void 0;
                    return e.useDepths && (l = o.depths ? t !== o.depths[0] ? [t].concat(o.depths) : o.depths : [t]), (n = c(e.main, n, r, o.depths || [], a, s))(t, o)
                }
                if (!t) throw new g["default"]("No environment passed to template");
                if (!e || !e.main) throw new g["default"]("Unknown template object: " + typeof e);
                e.main.decorator = e.main_d, t.VM.checkRevision(e.compiler);
                var r = {
                    strict: function(e, t) {
                        if (!(t in e)) throw new g["default"]('"' + t + '" not defined in ' + e);
                        return e[t]
                    },
                    lookup: function(e, t) {
                        for (var n = e.length, i = 0; n > i; i++)
                            if (e[i] && null != e[i][t]) return e[i][t]
                    },
                    lambda: function(e, t) {
                        return "function" == typeof e ? e.call(t) : e
                    },
                    escapeExpression: f.escapeExpression,
                    invokePartial: n,
                    fn: function(t) {
                        var n = e[t];
                        return n.decorator = e[t + "_d"], n
                    },
                    programs: [],
                    program: function(e, t, n, i, r) {
                        var a = this.programs[e],
                            l = this.fn(e);
                        return t || r || i || n ? a = o(this, e, l, t, n, i, r) : a || (a = this.programs[e] = o(this, e, l)), a
                    },
                    data: function(e, t) {
                        for (; e && t--;) e = e._parent;
                        return e
                    },
                    merge: function(e, t) {
                        var n = e || t;
                        return e && t && e !== t && (n = f.extend({}, t, e)), n
                    },
                    noop: t.VM.noop,
                    compilerInfo: e.compiler
                };
                return i.isTop = !0, i._setup = function(n) {
                    n.partial ? (r.helpers = n.helpers, r.partials = n.partials, r.decorators = n.decorators) : (r.helpers = r.merge(n.helpers, t.helpers), e.usePartial && (r.partials = r.merge(n.partials, t.partials)), (e.usePartial || e.useDecorators) && (r.decorators = r.merge(n.decorators, t.decorators)))
                }, i._child = function(t, n, i, a) {
                    if (e.useBlockParams && !i) throw new g["default"]("must pass block params");
                    if (e.useDepths && !a) throw new g["default"]("must pass parent depths");
                    return o(r, t, e[t], n, 0, i, a)
                }, i
            }

            function o(e, t, n, i, r, o, a) {
                function l(t) {
                    var r = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                        l = a;
                    return a && t !== a[0] && (l = [t].concat(a)), n(e, t, e.helpers, e.partials, r.data || i, o && [r.blockParams].concat(o), l)
                }
                return l = c(n, l, e, a, i, o), l.program = t, l.depth = a ? a.length : 0, l.blockParams = r || 0, l
            }

            function a(e, t, n) {
                return e ? e.call || n.name || (n.name = e, e = n.partials[e]) : e = "@partial-block" === n.name ? n.data["partial-block"] : n.partials[n.name], e
            }

            function l(e, t, n) {
                n.partial = !0, n.ids && (n.data.contextPath = n.ids[0] || n.data.contextPath);
                var i = void 0;
                if (n.fn && n.fn !== s && (n.data = _.createFrame(n.data), i = n.data["partial-block"] = n.fn, i.partials && (n.partials = f.extend({}, n.partials, i.partials))), void 0 === e && i && (e = i), void 0 === e) throw new g["default"]("The partial " + n.name + " could not be found");
                return e instanceof Function ? e(t, n) : void 0
            }

            function s() {
                return ""
            }

            function u(e, t) {
                return t && "root" in t || (t = t ? _.createFrame(t) : {}, t.root = e), t
            }

            function c(e, t, n, i, r, o) {
                if (e.decorator) {
                    var a = {};
                    t = e.decorator(t, a, n, i && i[0], r, o, i), f.extend(t, a)
                }
                return t
            }
            var d = n(1)["default"],
                p = n(2)["default"];
            t.__esModule = !0, t.checkRevision = i, t.template = r, t.wrapProgram = o, t.resolvePartial = a, t.invokePartial = l, t.noop = s;
            var h = n(4),
                f = d(h),
                m = n(5),
                g = p(m),
                _ = n(3)
        }, function(e, t) {
            (function(n) {
                "use strict";
                t.__esModule = !0, t["default"] = function(e) {
                    var t = "undefined" != typeof n ? n : window,
                        i = t.Handlebars;
                    e.noConflict = function() {
                        return t.Handlebars === e && (t.Handlebars = i), e
                    }
                }, e.exports = t["default"]
            }).call(t, function() {
                return this
            }())
        }])
    }),
    function(e) {
        "function" == typeof e._altmetric_define && (e.define = e._altmetric_define, e._altmetric_define = void 0), "object" == typeof e._altmetric_exports && (e.exports = e._altmetric_exports, e._altmetric_exports = void 0)
    }(window),
    function(e, t, n) {
        "undefined" != typeof module && module.exports ? module.exports = n() : t[e] = n()
    }("qwery", _altmetric, function() {
        function e() {
            this.c = {}
        }

        function t(e) {
            return X.g(e) || X.s(e, "(^|\\s+)" + e + "(\\s+|$)", 1)
        }

        function n(e, t) {
            for (var n = 0, i = e.length; i > n; n++) t(e[n])
        }

        function i(e) {
            for (var t = [], n = 0, i = e.length; i > n; ++n) m(e[n]) ? t = t.concat(e[n]) : t[t.length] = e[n];
            return t
        }

        function r(e) {
            for (var t = 0, n = e.length, i = []; n > t; t++) i[t] = e[t];
            return i
        }

        function o(e) {
            for (;
                (e = e.previousSibling) && 1 != e[S];);
            return e
        }

        function a(e) {
            return e.match(q)
        }

        function l(e, n, i, r, o, a, l, s, c, d, p) {
            var h, f, m, g, _;
            if (1 !== this[S]) return !1;
            if (n && "*" !== n && this[C] && this[C].toLowerCase() !== n) return !1;
            if (i && (f = i.match(A)) && f[1] !== this.id) return !1;
            if (i && (_ = i.match(M)))
                for (h = _.length; h--;)
                    if (!t(_[h].slice(1)).test(this.className)) return !1;
            if (c && v.pseudos[c] && !v.pseudos[c](this, p)) return !1;
            if (r && !l) {
                g = this.attributes;
                for (m in g)
                    if (Object.prototype.hasOwnProperty.call(g, m) && (g[m].name || m) == o) return this
            }
            return r && !u(a, J(this, o) || "", l) ? !1 : this
        }

        function s(e) {
            return Y.g(e) || Y.s(e, e.replace(U, "\\$1"))
        }

        function u(e, t, n) {
            switch (e) {
                case "=":
                    return t == n;
                case "^=":
                    return t.match(Q.g("^=" + n) || Q.s("^=" + n, "^" + s(n), 1));
                case "$=":
                    return t.match(Q.g("$=" + n) || Q.s("$=" + n, s(n) + "$", 1));
                case "*=":
                    return t.match(Q.g(n) || Q.s(n, s(n), 1));
                case "~=":
                    return t.match(Q.g("~=" + n) || Q.s("~=" + n, "(?:^|\\s+)" + s(n) + "(?:\\s+|$)", 1));
                case "|=":
                    return t.match(Q.g("|=" + n) || Q.s("|=" + n, "^" + s(n) + "(-|$)", 1))
            }
            return 0
        }

        function c(e, t) {
            var i, r, o, s, u, c, d, h = [],
                f = [],
                m = t,
                g = K.g(e) || K.s(e, e.split(V)),
                v = e.match(W);
            if (!g.length) return h;
            if (s = (g = g.slice(0)).pop(), g.length && (o = g[g.length - 1].match(N)) && (m = _(t, o[1])), !m) return h;
            for (c = a(s), u = m !== t && 9 !== m[S] && v && /^[+~]$/.test(v[v.length - 1]) ? function(e) {
                    for (; m = m.nextSibling;) 1 == m[S] && (c[1] ? c[1] == m[C].toLowerCase() : 1) && (e[e.length] = m);
                    return e
                }([]) : m[T](c[1] || "*"), i = 0, r = u.length; r > i; i++)(d = l.apply(u[i], c)) && (h[h.length] = d);
            return g.length ? (n(h, function(e) {
                p(e, g, v) && (f[f.length] = e)
            }), f) : h
        }

        function d(e, t, n) {
            if (h(t)) return e == t;
            if (m(t)) return !!~i(t).indexOf(e);
            for (var r, o, s = t.split(","); t = s.pop();)
                if (r = K.g(t) || K.s(t, t.split(V)), o = t.match(W), r = r.slice(0), l.apply(e, a(r.pop())) && (!r.length || p(e, r, o, n))) return !0;
            return !1
        }

        function p(e, t, n, i) {
            function r(e, i, s) {
                for (; s = G[n[i]](s, e);)
                    if (h(s) && l.apply(s, a(t[i]))) {
                        if (!i) return s;
                        if (o = r(s, i - 1, s)) return o
                    }
            }
            var o;
            return (o = r(e, t.length - 1, e)) && (!i || Z(o, i))
        }

        function h(e, t) {
            return e && "object" == typeof e && (t = e[S]) && (1 == t || 9 == t)
        }

        function f(e) {
            var t, n, i = [];
            e: for (t = 0; t < e.length; ++t) {
                for (n = 0; n < i.length; ++n)
                    if (i[n] == e[t]) continue e;
                i[i.length] = e[t]
            }
            return i
        }

        function m(e) {
            return "object" == typeof e && isFinite(e.length)
        }

        function g(e) {
            return e ? "string" == typeof e ? v(e)[0] : !e[S] && m(e) ? e[0] : e : w
        }

        function _(e, t, n) {
            return 9 === e[S] ? e.getElementById(t) : e.ownerDocument && ((n = e.ownerDocument.getElementById(t)) && Z(n, e) && n || !Z(e, e.ownerDocument) && b('[id="' + t + '"]', e)[0])
        }

        function v(e, t) {
            var n, o, a = g(t);
            if (!a || !e) return [];
            if (e === window || h(e)) return !t || e !== window && h(a) && Z(e, a) ? [e] : [];
            if (e && m(e)) return i(e);
            if (n = e.match(j)) {
                if (n[1]) return (o = _(a, n[1])) ? [o] : [];
                if (n[2]) return r(a[T](n[2]))
            }
            return b(e, a)
        }

        function y(e, t) {
            return function(n) {
                var i, r;
                return H.test(n) ? void(9 !== e[S] && ((r = i = e.getAttribute("id")) || e.setAttribute("id", r = "__qwerymeupscotty"), n = '[id="' + r + '"]' + n, t(e.parentNode || e, n, !0), i || e.removeAttribute("id"))) : void(n.length && t(e, n, !1))
            }
        }
        var b, w = document,
            x = w.documentElement,
            k = "getElementsByClassName",
            T = "getElementsByTagName",
            E = "querySelectorAll",
            P = "useNativeQSA",
            C = "tagName",
            S = "nodeType",
            A = /#([\w\-]+)/,
            M = /\.[\w\-]+/g,
            N = /^#([\w\-]+)$/,
            I = /^\.([\w\-]+)$/,
            D = /^([\w\-]+)$/,
            L = /^([\w]+)?\.([\w\-]+)$/,
            H = /(^|,)\s*[>~+]/,
            B = /^\s+|\s*([,\s\+\~>]|$)\s*/g,
            O = /[\s\>\+\~]/,
            R = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/,
            U = /([.*+?\^=!:${}()|\[\]\/\\])/g,
            F = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/,
            $ = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/,
            z = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/,
            j = new RegExp(N.source + "|" + D.source + "|" + I.source),
            W = new RegExp("(" + O.source + ")" + R.source, "g"),
            V = new RegExp(O.source + R.source),
            q = new RegExp(F.source + "(" + $.source + ")?(" + z.source + ")?"),
            G = {
                " ": function(e) {
                    return e && e !== x && e.parentNode
                },
                ">": function(e, t) {
                    return e && e.parentNode == t.parentNode && e.parentNode
                },
                "~": function(e) {
                    return e && e.previousSibling
                },
                "+": function(e, t, n, i) {
                    return e ? (n = o(e)) && (i = o(t)) && n == i && n : !1
                }
            };
        e.prototype = {
            g: function(e) {
                return this.c[e] || void 0
            },
            s: function(e, t, n) {
                return t = n ? new RegExp(t) : t, this.c[e] = t
            }
        };
        var X = new e,
            Y = new e,
            Q = new e,
            K = new e,
            Z = "compareDocumentPosition" in x ? function(e, t) {
                return 16 == (16 & t.compareDocumentPosition(e))
            } : "contains" in x ? function(e, t) {
                return t = 9 === t[S] || t == window ? x : t, t !== e && t.contains(e)
            } : function(e, t) {
                for (; e = e.parentNode;)
                    if (e === t) return 1;
                return 0
            },
            J = function() {
                var e = w.createElement("p");
                return (e.innerHTML = '<a href="#x">x</a>') && "#x" != e.firstChild.getAttribute("href") ? function(e, t) {
                    return "class" === t ? e.className : "href" === t || "src" === t ? e.getAttribute(t, 2) : e.getAttribute(t)
                } : function(e, t) {
                    return e.getAttribute(t)
                }
            }(),
            et = (!!w[k], w.querySelector && w[E]),
            tt = function(e, t) {
                var i, o, a = [];
                try {
                    return 9 !== t[S] && H.test(e) ? (n(i = e.split(","), y(t, function(e, t) {
                        o = e[E](t), 1 == o.length ? a[a.length] = o.item(0) : o.length && (a = a.concat(r(o)))
                    })), i.length > 1 && a.length > 1 ? f(a) : a) : r(t[E](e))
                } catch (l) {}
                return nt(e, t)
            },
            nt = function(e, i) {
                var r, o, a, l, s, u, d = [];
                if (e = e.replace(B, "$1"), o = e.match(L)) {
                    for (s = t(o[2]), r = i[T](o[1] || "*"), a = 0, l = r.length; l > a; a++) s.test(r[a].className) && (d[d.length] = r[a]);
                    return d
                }
                return n(u = e.split(","), y(i, function(e, t, n) {
                    for (s = c(t, e), a = 0, l = s.length; l > a; a++)(9 === e[S] || n || Z(s[a], i)) && (d[d.length] = s[a])
                })), u.length > 1 && d.length > 1 ? f(d) : d
            },
            it = function(e) {
                "undefined" != typeof e[P] && (b = e[P] && et ? tt : nt)
            };
        return it({
            useNativeQSA: !0
        }), v.configure = it, v.uniq = f, v.is = d, v.pseudos = {}, v
    }),
    function(e, t, n) {
        "undefined" != typeof module && module.exports ? module.exports = n() : t[e] = n()
    }("bean", _altmetric, function(e, t) {
        e = e || "bean", t = t || this;
        var n, i = window,
            r = t[e],
            o = /[^\.]*(?=\..*)\.|.*/,
            a = /\..*/,
            l = "addEventListener",
            s = "removeEventListener",
            u = document || {},
            c = u.documentElement || {},
            d = c[l],
            p = d ? l : "attachEvent",
            h = {},
            f = Array.prototype.slice,
            m = function(e, t) {
                return e.split(t || " ")
            },
            g = function(e) {
                return "string" == typeof e
            },
            _ = function(e) {
                return "function" == typeof e
            },
            v = "click dblclick mouseup mousedown contextmenu mousewheel mousemultiwheel DOMMouseScroll mouseover mouseout mousemove selectstart selectend keydown keypress keyup orientationchange focus blur change reset select submit load unload beforeunload resize move DOMContentLoaded readystatechange message error abort scroll ",
            y = "show input invalid touchstart touchmove touchend touchcancel gesturestart gesturechange gestureend textinputreadystatechange pageshow pagehide popstate hashchange offline online afterprint beforeprint dragstart dragenter dragover dragleave drag drop dragend loadstart progress suspend emptied stalled loadmetadata loadeddata canplay canplaythrough playing waiting seeking seeked ended durationchange timeupdate play pause ratechange volumechange cuechange checking noupdate downloading cached updateready obsolete ",
            b = function(e, t, n) {
                for (n = 0; n < t.length; n++) t[n] && (e[t[n]] = 1);
                return e
            }({}, m(v + (d ? y : ""))),
            w = function() {
                var e = "compareDocumentPosition" in c ? function(e, t) {
                        return t.compareDocumentPosition && 16 === (16 & t.compareDocumentPosition(e))
                    } : "contains" in c ? function(e, t) {
                        return t = 9 === t.nodeType || t === window ? c : t, t !== e && t.contains(e)
                    } : function(e, t) {
                        for (; e = e.parentNode;)
                            if (e === t) return 1;
                        return 0
                    },
                    t = function(t) {
                        var n = t.relatedTarget;
                        return n ? n !== this && "xul" !== n.prefix && !/document/.test(this.toString()) && !e(n, this) : null == n
                    };
                return {
                    mouseenter: {
                        base: "mouseover",
                        condition: t
                    },
                    mouseleave: {
                        base: "mouseout",
                        condition: t
                    },
                    mousewheel: {
                        base: /Firefox/.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel"
                    }
                }
            }(),
            x = function() {
                var e = m("altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which propertyName"),
                    t = e.concat(m("button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement")),
                    n = t.concat(m("wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis")),
                    r = e.concat(m("char charCode key keyCode keyIdentifier keyLocation location")),
                    o = e.concat(m("data")),
                    a = e.concat(m("touches targetTouches changedTouches scale rotation")),
                    l = e.concat(m("data origin source")),
                    s = e.concat(m("state")),
                    d = /over|out/,
                    p = [{
                        reg: /key/i,
                        fix: function(e, t) {
                            return t.keyCode = e.keyCode || e.which, r
                        }
                    }, {
                        reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i,
                        fix: function(e, n, i) {
                            return n.rightClick = 3 === e.which || 2 === e.button, n.pos = {
                                x: 0,
                                y: 0
                            }, e.pageX || e.pageY ? (n.clientX = e.pageX, n.clientY = e.pageY) : (e.clientX || e.clientY) && (n.clientX = e.clientX + u.body.scrollLeft + c.scrollLeft, n.clientY = e.clientY + u.body.scrollTop + c.scrollTop), d.test(i) && (n.relatedTarget = e.relatedTarget || e[("mouseover" == i ? "from" : "to") + "Element"]), t
                        }
                    }, {
                        reg: /mouse.*(wheel|scroll)/i,
                        fix: function() {
                            return n
                        }
                    }, {
                        reg: /^text/i,
                        fix: function() {
                            return o
                        }
                    }, {
                        reg: /^touch|^gesture/i,
                        fix: function() {
                            return a
                        }
                    }, {
                        reg: /^message$/i,
                        fix: function() {
                            return l
                        }
                    }, {
                        reg: /^popstate$/i,
                        fix: function() {
                            return s
                        }
                    }, {
                        reg: /.*/,
                        fix: function() {
                            return e
                        }
                    }],
                    h = {},
                    f = function(e, t, n) {
                        if (arguments.length && (e = e || ((t.ownerDocument || t.document || t).parentWindow || i).event, this.originalEvent = e, this.isNative = n, this.isBean = !0, e)) {
                            var r, o, a, l, s, u = e.type,
                                c = e.target || e.srcElement;
                            if (this.target = c && 3 === c.nodeType ? c.parentNode : c, n) {
                                if (s = h[u], !s)
                                    for (r = 0, o = p.length; o > r; r++)
                                        if (p[r].reg.test(u)) {
                                            h[u] = s = p[r].fix;
                                            break
                                        }
                                for (l = s(e, this, u), r = l.length; r--;) !((a = l[r]) in this) && a in e && (this[a] = e[a])
                            }
                        }
                    };
                return f.prototype.preventDefault = function() {
                    this.originalEvent.preventDefault ? this.originalEvent.preventDefault() : this.originalEvent.returnValue = !1
                }, f.prototype.stopPropagation = function() {
                    this.originalEvent.stopPropagation ? this.originalEvent.stopPropagation() : this.originalEvent.cancelBubble = !0
                }, f.prototype.stop = function() {
                    this.preventDefault(), this.stopPropagation(), this.stopped = !0
                }, f.prototype.stopImmediatePropagation = function() {
                    this.originalEvent.stopImmediatePropagation && this.originalEvent.stopImmediatePropagation(), this.isImmediatePropagationStopped = function() {
                        return !0
                    }
                }, f.prototype.isImmediatePropagationStopped = function() {
                    return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
                }, f.prototype.clone = function(e) {
                    var t = new f(this, this.element, this.isNative);
                    return t.currentTarget = e, t
                }, f
            }(),
            k = function(e, t) {
                return d || t || e !== u && e !== i ? e : c
            },
            T = function() {
                var e = function(e, t, n, i) {
                        var r = function(n, r) {
                                return t.apply(e, i ? f.call(r, n ? 0 : 1).concat(i) : r)
                            },
                            o = function(n, i) {
                                return t.__beanDel ? t.__beanDel.ft(n.target, e) : i
                            },
                            a = n ? function(e) {
                                var t = o(e, this);
                                return n.apply(t, arguments) ? (e && (e.currentTarget = t), r(e, arguments)) : void 0
                            } : function(e) {
                                return t.__beanDel && (e = e.clone(o(e))), r(e, arguments)
                            };
                        return a.__beanDel = t.__beanDel, a
                    },
                    t = function(t, n, i, r, o, a, l) {
                        var s, u = w[n];
                        "unload" == n && (i = A(M, t, n, i, r)), u && (u.condition && (i = e(t, i, u.condition, a)), n = u.base || n), this.isNative = s = b[n] && !!t[p], this.customType = !d && !s && n, this.element = t, this.type = n, this.original = r, this.namespaces = o, this.eventType = d || s ? n : "propertychange", this.target = k(t, s), this[p] = !!this.target[p], this.root = l, this.handler = e(t, i, null, a)
                    };
                return t.prototype.inNamespaces = function(e) {
                    var t, n, i = 0;
                    if (!e) return !0;
                    if (!this.namespaces) return !1;
                    for (t = e.length; t--;)
                        for (n = this.namespaces.length; n--;) e[t] == this.namespaces[n] && i++;
                    return e.length === i
                }, t.prototype.matches = function(e, t, n) {
                    return !(this.element !== e || t && this.original !== t || n && this.handler !== n)
                }, t
            }(),
            E = function() {
                var e = {},
                    t = function(n, i, r, o, a, l) {
                        var s = a ? "r" : "$";
                        if (i && "*" != i) {
                            var u, c = 0,
                                d = e[s + i],
                                p = "*" == n;
                            if (!d) return;
                            for (u = d.length; u > c; c++)
                                if ((p || d[c].matches(n, r, o)) && !l(d[c], d, c, i)) return
                        } else
                            for (var h in e) h.charAt(0) == s && t(n, h.substr(1), r, o, a, l)
                    },
                    n = function(t, n, i, r) {
                        var o, a = e[(r ? "r" : "$") + n];
                        if (a)
                            for (o = a.length; o--;)
                                if (!a[o].root && a[o].matches(t, i, null)) return !0;
                        return !1
                    },
                    i = function(e, n, i, r) {
                        var o = [];
                        return t(e, n, i, null, r, function(e) {
                            return o.push(e)
                        }), o
                    },
                    r = function(t) {
                        var n = !t.root && !this.has(t.element, t.type, null, !1),
                            i = (t.root ? "r" : "$") + t.type;
                        return (e[i] || (e[i] = [])).push(t), n
                    },
                    o = function(n) {
                        t(n.element, n.type, null, n.handler, n.root, function(t, n, i) {
                            return n.splice(i, 1), t.removed = !0, 0 === n.length && delete e[(t.root ? "r" : "$") + t.type], !1
                        })
                    },
                    a = function() {
                        var t, n = [];
                        for (t in e) "$" == t.charAt(0) && (n = n.concat(e[t]));
                        return n
                    };
                return {
                    has: n,
                    get: i,
                    put: r,
                    del: o,
                    entries: a
                }
            }(),
            P = function(e) {
                n = arguments.length ? e : u.querySelectorAll ? function(e, t) {
                    return t.querySelectorAll(e)
                } : function() {
                    throw new Error("Bean: No selector engine installed")
                }
            },
            C = function(e, t) {
                if (d || !t || !e || e.propertyName == "_on" + t) {
                    var n = E.get(this, t || e.type, null, !1),
                        i = n.length,
                        r = 0;
                    for (e = new x(e, this, !0), t && (e.type = t); i > r && !e.isImmediatePropagationStopped(); r++) n[r].removed || n[r].handler.call(this, e)
                }
            },
            S = d ? function(e, t, n) {
                e[n ? l : s](t, C, !1)
            } : function(e, t, n, i) {
                var r;
                n ? (E.put(r = new T(e, i || t, function(t) {
                    C.call(e, t, i)
                }, C, null, null, !0)), i && null == e["_on" + i] && (e["_on" + i] = 0), r.target.attachEvent("on" + r.eventType, r.handler)) : (r = E.get(e, i || t, C, !0)[0], r && (r.target.detachEvent("on" + r.eventType, r.handler), E.del(r)))
            },
            A = function(e, t, n, i, r) {
                return function() {
                    i.apply(this, arguments), e(t, n, r)
                }
            },
            M = function(e, t, n, i) {
                var r, o, l = t && t.replace(a, ""),
                    s = E.get(e, l, null, !1),
                    u = {};
                for (r = 0, o = s.length; o > r; r++) n && s[r].original !== n || !s[r].inNamespaces(i) || (E.del(s[r]), !u[s[r].eventType] && s[r][p] && (u[s[r].eventType] = {
                    t: s[r].eventType,
                    c: s[r].type
                }));
                for (r in u) E.has(e, u[r].t, null, !1) || S(e, u[r].t, !1, u[r].c)
            },
            N = function(e, t) {
                var i = function(t, i) {
                        for (var r, o = g(e) ? n(e, i) : e; t && t !== i; t = t.parentNode)
                            for (r = o.length; r--;)
                                if (o[r] === t) return t
                    },
                    r = function(e) {
                        var n = i(e.target, this);
                        n && t.apply(n, arguments)
                    };
                return r.__beanDel = {
                    ft: i,
                    selector: e
                }, r
            },
            I = d ? function(e, t, n) {
                var r = u.createEvent(e ? "HTMLEvents" : "UIEvents");
                r[e ? "initEvent" : "initUIEvent"](t, !0, !0, i, 1), n.dispatchEvent(r)
            } : function(e, t, n) {
                n = k(n, e), e ? n.fireEvent("on" + t, u.createEventObject()) : n["_on" + t]++
            },
            D = function(e, t, n) {
                var i, r, l, s, u = g(t);
                if (u && t.indexOf(" ") > 0) {
                    for (t = m(t), s = t.length; s--;) D(e, t[s], n);
                    return e
                }
                if (r = u && t.replace(a, ""), r && w[r] && (r = w[r].base), !t || u)(l = u && t.replace(o, "")) && (l = m(l, ".")), M(e, r, n, l);
                else if (_(t)) M(e, null, t);
                else
                    for (i in t) t.hasOwnProperty(i) && D(e, i, t[i]);
                return e
            },
            L = function(e, t, i, r) {
                var l, s, u, c, d, g, v; {
                    if (void 0 !== i || "object" != typeof t) {
                        for (_(i) ? (d = f.call(arguments, 3), r = l = i) : (l = r, d = f.call(arguments, 4), r = N(i, l, n)), u = m(t), this === h && (r = A(D, e, t, r, l)), c = u.length; c--;) v = E.put(g = new T(e, u[c].replace(a, ""), r, l, m(u[c].replace(o, ""), "."), d, !1)), g[p] && v && S(e, g.eventType, !0, g.customType);
                        return e
                    }
                    for (s in t) t.hasOwnProperty(s) && L.call(this, e, s, t[s])
                }
            },
            H = function(e, t, n, i) {
                return L.apply(null, g(n) ? [e, n, t, i].concat(arguments.length > 3 ? f.call(arguments, 5) : []) : f.call(arguments))
            },
            B = function() {
                return L.apply(h, arguments)
            },
            O = function(e, t, n) {
                var i, r, l, s, u, c = m(t);
                for (i = c.length; i--;)
                    if (t = c[i].replace(a, ""), (s = c[i].replace(o, "")) && (s = m(s, ".")), s || n || !e[p])
                        for (u = E.get(e, t, null, !1), n = [!1].concat(n), r = 0, l = u.length; l > r; r++) u[r].inNamespaces(s) && u[r].handler.apply(e, n);
                    else I(b[t], t, e);
                return e
            },
            R = function(e, t, n) {
                for (var i, r, o = E.get(t, n, null, !1), a = o.length, l = 0; a > l; l++) o[l].original && (i = [e, o[l].type], (r = o[l].handler.__beanDel) && i.push(r.selector), i.push(o[l].original), L.apply(null, i));
                return e
            },
            U = {
                on: L,
                add: H,
                one: B,
                off: D,
                remove: D,
                clone: R,
                fire: O,
                Event: x,
                setSelectorEngine: P,
                noConflict: function() {
                    return t[e] = r, this
                }
            };
        if (i.attachEvent) {
            var F = function() {
                var e, t = E.entries();
                for (e in t) t[e].type && "unload" !== t[e].type && D(t[e].element, t[e].type);
                i.detachEvent("onunload", F), i.CollectGarbage && i.CollectGarbage()
            };
            i.attachEvent("onunload", F)
        }
        return P(), U
    }),
    function(e, t, n) {
        "undefined" != typeof module && module.exports ? module.exports = n() : t[e] = n()
    }("bonzo", _altmetric, function() {
        function e(e) {
            return e && e.nodeName && (1 == e.nodeType || 11 == e.nodeType)
        }

        function t(t, n, i) {
            var r, o, a;
            if ("string" == typeof t) return w.create(t);
            if (e(t) && (t = [t]), i) {
                for (a = [], r = 0, o = t.length; o > r; r++) a[r] = _(n, t[r]);
                return a
            }
            return t
        }

        function n(e) {
            return new RegExp("(^|\\s+)" + e + "(\\s+|$)")
        }

        function i(e, t, n, i) {
            for (var r, o = 0, a = e.length; a > o; o++) r = i ? e.length - o - 1 : o, t.call(n || e[r], e[r], r, e);
            return e
        }

        function r(t, n, i) {
            for (var o = 0, a = t.length; a > o; o++) e(t[o]) && (r(t[o].childNodes, n, i), n.call(i || t[o], t[o], o, t));
            return t
        }

        function o(e) {
            return e.replace(/-(.)/g, function(e, t) {
                return t.toUpperCase()
            })
        }

        function a(e) {
            return e ? e.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : e
        }

        function l(e) {
            e[V]("data-node-uid") || e[W]("data-node-uid", ++F);
            var t = e[V]("data-node-uid");
            return U[t] || (U[t] = {})
        }

        function s(e) {
            var t = e[V]("data-node-uid");
            t && delete U[t]
        }

        function u(e) {
            var t;
            try {
                return null === e || void 0 === e ? void 0 : "true" === e ? !0 : "false" === e ? !1 : "null" === e ? null : (t = parseFloat(e)) == e ? t : e
            } catch (n) {}
            return void 0
        }

        function c(e, t, n) {
            for (var i = 0, r = e.length; r > i; ++i)
                if (t.call(n || null, e[i], i, e)) return !0;
            return !1
        }

        function d(e) {
            return "transform" == e && (e = G.transform) || /^transform-?[Oo]rigin$/.test(e) && (e = G.transform + "Origin") || "float" == e && (e = G.cssFloat), e ? o(e) : null
        }

        function p(e, n, r, o) {
            var a = 0,
                l = n || this,
                s = [],
                u = Z && "string" == typeof e && "<" != e.charAt(0) ? Z(e) : e;
            return i(t(u), function(e, t) {
                i(l, function(n) {
                    r(e, s[a++] = t > 0 ? _(l, n) : n)
                }, null, o)
            }, this, o), l.length = a, i(s, function(e) {
                l[--a] = e
            }, null, !o), l
        }

        function h(e, t, n) {
            var i = w(e),
                r = i.css("position"),
                o = i.offset(),
                a = "relative",
                l = r == a,
                s = [parseInt(i.css("left"), 10), parseInt(i.css("top"), 10)];
            "static" == r && (i.css("position", a), r = a), isNaN(s[0]) && (s[0] = l ? 0 : e.offsetLeft), isNaN(s[1]) && (s[1] = l ? 0 : e.offsetTop), null != t && (e.style.left = t - o.left + s[0] + j), null != n && (e.style.top = n - o.top + s[1] + j)
        }

        function f(e, t) {
            return "function" == typeof t ? t(e) : t
        }

        function m(e, t, n) {
            var i = this[0];
            return i ? null == e && null == t ? (v(i) ? y() : {
                x: i.scrollLeft,
                y: i.scrollTop
            })[n] : (v(i) ? E.scrollTo(e, t) : (null != e && (i.scrollLeft = e), null != t && (i.scrollTop = t)), this) : this
        }

        function g(e) {
            if (this.length = 0, e) {
                e = "string" == typeof e || e.nodeType || "undefined" == typeof e.length ? [e] : e, this.length = e.length;
                for (var t = 0; t < e.length; t++) this[t] = e[t]
            }
        }

        function _(e, t) {
            var n, i, r, o = t.cloneNode(!0);
            if (e.$ && "function" == typeof e.cloneEvents)
                for (e.$(o).cloneEvents(t), n = e.$(o).find("*"), i = e.$(t).find("*"), r = 0; r < i.length; r++) e.$(n[r]).cloneEvents(i[r]);
            return o
        }

        function v(e) {
            return e === E || /^(?:body|html)$/i.test(e.tagName)
        }

        function y() {
            return {
                x: E.pageXOffset || C.scrollLeft,
                y: E.pageYOffset || C.scrollTop
            }
        }

        function b(e) {
            var t = document.createElement("script"),
                n = e.match(N);
            return t.src = n[1], t
        }

        function w(e) {
            return new g(e)
        }
        var x, k, T, E = window,
            P = E.document,
            C = P.documentElement,
            S = "parentNode",
            A = /^(checked|value|selected|disabled)$/i,
            M = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i,
            N = /\s*<script +src=['"]([^'"]+)['"]>/,
            I = ["<table>", "</table>", 1],
            D = ["<table><tbody><tr>", "</tr></tbody></table>", 3],
            L = ["<select>", "</select>", 1],
            H = ["_", "", 0, 1],
            B = {
                thead: I,
                tbody: I,
                tfoot: I,
                colgroup: I,
                caption: I,
                tr: ["<table><tbody>", "</tbody></table>", 2],
                th: D,
                td: D,
                col: ["<table><colgroup>", "</colgroup></table>", 2],
                fieldset: ["<form>", "</form>", 1],
                legend: ["<form><fieldset>", "</fieldset></form>", 2],
                option: L,
                optgroup: L,
                script: H,
                style: H,
                link: H,
                param: H,
                base: H
            },
            O = /^(checked|selected|disabled)$/,
            R = /msie/i.test(navigator.userAgent),
            U = {},
            F = 0,
            $ = /^-?[\d\.]+$/,
            z = /^data-(.+)$/,
            j = "px",
            W = "setAttribute",
            V = "getAttribute",
            q = "getElementsByTagName",
            G = function() {
                var e = P.createElement("p");
                return e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>', {
                    hrefExtended: "#x" != e[q]("a")[0][V]("href"),
                    autoTbody: 0 !== e[q]("tbody").length,
                    computedStyle: P.defaultView && P.defaultView.getComputedStyle,
                    cssFloat: e[q]("table")[0].style.styleFloat ? "styleFloat" : "cssFloat",
                    transform: function() {
                        var t, n = ["transform", "webkitTransform", "MozTransform", "OTransform", "msTransform"];
                        for (t = 0; t < n.length; t++)
                            if (n[t] in e.style) return n[t]
                    }(),
                    classList: "classList" in e,
                    opasity: function() {
                        return "undefined" != typeof P.createElement("a").style.opacity
                    }()
                }
            }(),
            X = /(^\s*|\s*$)/g,
            Y = /\s+/,
            Q = String.prototype.toString,
            K = {
                lineHeight: 1,
                zoom: 1,
                zIndex: 1,
                opacity: 1,
                boxFlex: 1,
                WebkitBoxFlex: 1,
                MozBoxFlex: 1
            },
            Z = P.querySelectorAll && function(e) {
                return P.querySelectorAll(e)
            },
            J = String.prototype.trim ? function(e) {
                return e.trim()
            } : function(e) {
                return e.replace(X, "")
            },
            et = G.computedStyle ? function(e, t) {
                var n = null,
                    i = P.defaultView.getComputedStyle(e, "");
                return i && (n = i[t]), e.style[t] || n
            } : R && C.currentStyle ? function(e, t) {
                var n, i;
                if ("opacity" == t && !G.opasity) {
                    n = 100;
                    try {
                        n = e.filters["DXImageTransform.Microsoft.Alpha"].opacity
                    } catch (r) {
                        try {
                            n = e.filters("alpha").opacity
                        } catch (o) {}
                    }
                    return n / 100
                }
                return i = e.currentStyle ? e.currentStyle[t] : null, e.style[t] || i
            } : function(e, t) {
                return e.style[t]
            };
        return G.classList ? (x = function(e, t) {
            return e.classList.contains(t)
        }, k = function(e, t) {
            e.classList.add(t)
        }, T = function(e, t) {
            e.classList.remove(t)
        }) : (x = function(e, t) {
            return n(t).test(e.className)
        }, k = function(e, t) {
            e.className = J(e.className + " " + t)
        }, T = function(e, t) {
            e.className = J(e.className.replace(n(t), " "))
        }), g.prototype = {
            get: function(e) {
                return this[e] || null
            },
            each: function(e, t) {
                return i(this, e, t)
            },
            deepEach: function(e, t) {
                return r(this, e, t)
            },
            map: function(e, t) {
                var n, i, r = [];
                for (i = 0; i < this.length; i++) n = e.call(this, this[i], i), t ? t(n) && r.push(n) : r.push(n);
                return r
            },
            html: function(e, n) {
                var r = n ? void 0 === C.textContent ? "innerText" : "textContent" : "innerHTML",
                    o = this,
                    a = function(n, r) {
                        i(t(e, o, r), function(e) {
                            n.appendChild(e)
                        })
                    },
                    l = function(t, i) {
                        try {
                            if (n || "string" == typeof e && !M.test(t.tagName)) return t[r] = e
                        } catch (o) {}
                        a(t, i)
                    };
                return "undefined" != typeof e ? this.empty().each(l) : this[0] ? this[0][r] : ""
            },
            text: function(e) {
                return this.html(e, !0)
            },
            append: function(e) {
                var n = this;
                return this.each(function(r, o) {
                    i(t(e, n, o), function(e) {
                        r.appendChild(e)
                    })
                })
            },
            prepend: function(e) {
                var n = this;
                return this.each(function(r, o) {
                    var a = r.firstChild;
                    i(t(e, n, o), function(e) {
                        r.insertBefore(e, a)
                    })
                })
            },
            appendTo: function(e, t) {
                return p.call(this, e, t, function(e, t) {
                    e.appendChild(t)
                })
            },
            prependTo: function(e, t) {
                return p.call(this, e, t, function(e, t) {
                    e.insertBefore(t, e.firstChild)
                }, 1)
            },
            before: function(e) {
                var n = this;
                return this.each(function(r, o) {
                    i(t(e, n, o), function(e) {
                        r[S].insertBefore(e, r)
                    })
                })
            },
            after: function(e) {
                var n = this;
                return this.each(function(r, o) {
                    i(t(e, n, o), function(e) {
                        r[S].insertBefore(e, r.nextSibling)
                    }, null, 1)
                })
            },
            insertBefore: function(e, t) {
                return p.call(this, e, t, function(e, t) {
                    e[S].insertBefore(t, e)
                })
            },
            insertAfter: function(e, t) {
                return p.call(this, e, t, function(e, t) {
                    var n = e.nextSibling;
                    n ? e[S].insertBefore(t, n) : e[S].appendChild(t)
                }, 1)
            },
            replaceWith: function(e) {
                return w(t(e)).insertAfter(this), this.remove()
            },
            clone: function(e) {
                var t, n, i = [];
                for (n = 0, t = this.length; t > n; n++) i[n] = _(e || this, this[n]);
                return w(i)
            },
            addClass: function(e) {
                return e = Q.call(e).split(Y), this.each(function(t) {
                    i(e, function(e) {
                        e && !x(t, f(t, e)) && k(t, f(t, e))
                    })
                })
            },
            removeClass: function(e) {
                return e = Q.call(e).split(Y), this.each(function(t) {
                    i(e, function(e) {
                        e && x(t, f(t, e)) && T(t, f(t, e))
                    })
                })
            },
            hasClass: function(e) {
                return e = Q.call(e).split(Y), c(this, function(t) {
                    return c(e, function(e) {
                        return e && x(t, e)
                    })
                })
            },
            toggleClass: function(e, t) {
                return e = Q.call(e).split(Y), this.each(function(n) {
                    i(e, function(e) {
                        e && ("undefined" != typeof t ? t ? !x(n, e) && k(n, e) : T(n, e) : x(n, e) ? T(n, e) : k(n, e))
                    })
                })
            },
            show: function(e) {
                return e = "string" == typeof e ? e : "", this.each(function(t) {
                    t.style.display = e
                })
            },
            hide: function() {
                return this.each(function(e) {
                    e.style.display = "none"
                })
            },
            toggle: function(e, t) {
                return t = "string" == typeof t ? t : "", "function" != typeof e && (e = null), this.each(function(n) {
                    n.style.display = n.offsetWidth || n.offsetHeight ? "none" : t, e && e.call(n)
                })
            },
            first: function() {
                return w(this.length ? this[0] : [])
            },
            last: function() {
                return w(this.length ? this[this.length - 1] : [])
            },
            next: function() {
                return this.related("nextSibling")
            },
            previous: function() {
                return this.related("previousSibling")
            },
            parent: function() {
                return this.related(S)
            },
            related: function(e) {
                return w(this.map(function(t) {
                    for (t = t[e]; t && 1 !== t.nodeType;) t = t[e];
                    return t || 0
                }, function(e) {
                    return e
                }))
            },
            focus: function() {
                return this.length && this[0].focus(), this
            },
            blur: function() {
                return this.length && this[0].blur(), this
            },
            css: function(e, t) {
                function n(e, t, n) {
                    for (var i in r)
                        if (r.hasOwnProperty(i)) {
                            n = r[i], (t = d(i)) && $.test(n) && !(t in K) && (n += j);
                            try {
                                e.style[t] = f(e, n)
                            } catch (o) {}
                        }
                }
                var i, r = e;
                return void 0 === t && "string" == typeof e ? (t = this[0], t ? t === P || t === E ? (i = t === P ? w.doc() : w.viewport(), "width" == e ? i.width : "height" == e ? i.height : "") : (e = d(e)) ? et(t, e) : null : null) : ("string" == typeof e && (r = {}, r[e] = t), R && r.opacity && (r.filter = "alpha(opacity=" + 100 * r.opacity + ")", r.zoom = e.zoom || 1, delete r.opacity), this.each(n))
            },
            offset: function(e, t) {
                if (e && "object" == typeof e && ("number" == typeof e.top || "number" == typeof e.left)) return this.each(function(t) {
                    h(t, e.left, e.top)
                });
                if ("number" == typeof e || "number" == typeof t) return this.each(function(n) {
                    h(n, e, t)
                });
                if (!this[0]) return {
                    top: 0,
                    left: 0,
                    height: 0,
                    width: 0
                };
                var n = this[0],
                    i = n.ownerDocument.documentElement,
                    r = n.getBoundingClientRect(),
                    o = y(),
                    a = n.offsetWidth,
                    l = n.offsetHeight,
                    s = r.top + o.y - Math.max(0, i && i.clientTop, P.body.clientTop),
                    u = r.left + o.x - Math.max(0, i && i.clientLeft, P.body.clientLeft);
                return {
                    top: s,
                    left: u,
                    height: l,
                    width: a
                }
            },
            dim: function() {
                if (!this.length) return {
                    height: 0,
                    width: 0
                };
                var e = this[0],
                    t = 9 == e.nodeType && e.documentElement,
                    n = t || !e.style || e.offsetWidth || e.offsetHeight ? null : function(t) {
                        var n = {
                            position: e.style.position || "",
                            visibility: e.style.visibility || "",
                            display: e.style.display || ""
                        };
                        return t.first().css({
                            position: "absolute",
                            visibility: "hidden",
                            display: "block"
                        }), n
                    }(this),
                    i = t ? Math.max(e.body.scrollWidth, e.body.offsetWidth, t.scrollWidth, t.offsetWidth, t.clientWidth) : e.offsetWidth,
                    r = t ? Math.max(e.body.scrollHeight, e.body.offsetHeight, t.scrollHeight, t.offsetHeight, t.clientHeight) : e.offsetHeight;
                return n && this.first().css(n), {
                    height: r,
                    width: i
                }
            },
            attr: function(e, t) {
                var n, i = this[0];
                if ("string" != typeof e && !(e instanceof String)) {
                    for (n in e) e.hasOwnProperty(n) && this.attr(n, e[n]);
                    return this
                }
                return "undefined" == typeof t ? i ? A.test(e) ? O.test(e) && "string" == typeof i[e] ? !0 : i[e] : "href" != e && "src" != e || !G.hrefExtended ? i[V](e) : i[V](e, 2) : null : this.each(function(n) {
                    A.test(e) ? n[e] = f(n, t) : n[W](e, f(n, t))
                })
            },
            removeAttr: function(e) {
                return this.each(function(t) {
                    O.test(e) ? t[e] = !1 : t.removeAttribute(e)
                })
            },
            val: function(e) {
                return "string" == typeof e ? this.attr("value", e) : this.length ? this[0].value : null
            },
            data: function(e, t) {
                var n, r, s = this[0];
                return "undefined" == typeof t ? s ? (n = l(s), "undefined" == typeof e ? (i(s.attributes, function(e) {
                    (r = ("" + e.name).match(z)) && (n[o(r[1])] = u(e.value))
                }), n) : ("undefined" == typeof n[e] && (n[e] = u(this.attr("data-" + a(e)))), n[e])) : null : this.each(function(n) {
                    l(n)[e] = t
                })
            },
            remove: function() {
                return this.deepEach(s), this.detach()
            },
            empty: function() {
                return this.each(function(e) {
                    for (r(e.childNodes, s); e.firstChild;) e.removeChild(e.firstChild)
                })
            },
            detach: function() {
                return this.each(function(e) {
                    e[S] && e[S].removeChild(e)
                })
            },
            scrollTop: function(e) {
                return m.call(this, null, e, "y")
            },
            scrollLeft: function(e) {
                return m.call(this, e, null, "x")
            }
        }, w.setQueryEngine = function(e) {
            Z = e, delete w.setQueryEngine
        }, w.aug = function(e, t) {
            for (var n in e) e.hasOwnProperty(n) && ((t || g.prototype)[n] = e[n])
        }, w.create = function(t) {
            return "string" == typeof t && "" !== t ? function() {
                if (N.test(t)) return [b(t)];
                var e = t.match(/^\s*<([^\s>]+)/),
                    n = P.createElement("div"),
                    r = [],
                    o = e ? B[e[1].toLowerCase()] : null,
                    a = o ? o[2] + 1 : 1,
                    l = o && o[3],
                    s = S,
                    u = G.autoTbody && o && "<table>" == o[0] && !/<tbody/i.test(t);
                for (n.innerHTML = o ? o[0] + t + o[1] : t; a--;) n = n.firstChild;
                l && n && 1 !== n.nodeType && (n = n.nextSibling);
                do e && 1 != n.nodeType || u && (!n.tagName || "TBODY" == n.tagName) || r.push(n); while (n = n.nextSibling);
                return i(r, function(e) {
                    e[s] && e[s].removeChild(e)
                }), r
            }() : e(t) ? [t.cloneNode(!0)] : []
        }, w.doc = function() {
            var e = w.viewport();
            return {
                width: Math.max(P.body.scrollWidth, C.scrollWidth, e.width),
                height: Math.max(P.body.scrollHeight, C.scrollHeight, e.height)
            }
        }, w.firstChild = function(e) {
            for (var t, n = e.childNodes, i = 0, r = n && n.length || 0; r > i; i++) 1 === n[i].nodeType && (t = n[r = i]);
            return t
        }, w.viewport = function() {
            return {
                width: R ? C.clientWidth : self.innerWidth,
                height: R ? C.clientHeight : self.innerHeight
            }
        }, w.isAncestor = "compareDocumentPosition" in C ? function(e, t) {
            return 16 == (16 & e.compareDocumentPosition(t))
        } : "contains" in C ? function(e, t) {
            return e !== t && e.contains(t)
        } : function(e, t) {
            for (; t = t[S];)
                if (t === e) return !0;
            return !1
        }, w
    }), ! function(e, t) {
        "undefined" != typeof module && module.exports ? module.exports.browser = t() : _altmetric[e] = t()
    }("bowser", function() {
        function e() {
            return r ? {
                name: "Internet Explorer",
                msie: i,
                version: n.match(/(msie |rv:)(\d+(\.\d+)?)/i)[2]
            } : p ? {
                name: "Opera",
                opera: i,
                version: n.match(g) ? n.match(g)[1] : n.match(/opr\/(\d+(\.\d+)?)/i)[1]
            } : o ? {
                name: "Chrome",
                webkit: i,
                chrome: i,
                version: n.match(/chrome\/(\d+(\.\d+)?)/i)[1]
            } : a ? {
                name: "PhantomJS",
                webkit: i,
                phantom: i,
                version: n.match(/phantomjs\/(\d+(\.\d+)+)/i)[1]
            } : c ? {
                name: "TouchPad",
                webkit: i,
                touchpad: i,
                version: n.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
            } : s || u ? (t = {
                name: s ? "iPhone" : "iPad",
                webkit: i,
                mobile: i,
                ios: i,
                iphone: s,
                ipad: u
            }, g.test(n) && (t.version = n.match(g)[1]), t) : d ? {
                name: "Android",
                webkit: i,
                android: i,
                mobile: i,
                version: (n.match(g) || n.match(_))[1]
            } : l ? {
                name: "Safari",
                webkit: i,
                safari: i,
                version: n.match(g)[1]
            } : f ? (t = {
                name: "Gecko",
                gecko: i,
                mozilla: i,
                version: n.match(_)[1]
            }, h && (t.name = "Firefox", t.firefox = i), t) : m ? {
                name: "SeaMonkey",
                seamonkey: i,
                version: n.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
            } : {}
        }
        var t, n = navigator.userAgent,
            i = !0,
            r = /(msie|trident)/i.test(n),
            o = /chrome/i.test(n),
            a = /phantom/i.test(n),
            l = /safari/i.test(n) && !o && !a,
            s = /iphone/i.test(n),
            u = /ipad/i.test(n),
            c = /touchpad/i.test(n),
            d = /android/i.test(n),
            p = /opera/i.test(n) || /opr/i.test(n),
            h = /firefox/i.test(n),
            f = /gecko\//i.test(n),
            m = /seamonkey\//i.test(n),
            g = /version\/(\d+(\.\d+)?)/i,
            _ = /firefox\/(\d+(\.\d+)?)/i,
            v = e();
        return v.msie && v.version >= 8 || v.chrome && v.version >= 10 || v.firefox && v.version >= 4 || v.safari && v.version >= 5 || v.opera && v.version >= 10 ? v.a = i : v.msie && v.version < 8 || v.chrome && v.version < 10 || v.firefox && v.version < 4 || v.safari && v.version < 5 || v.opera && v.version < 10 ? v.c = i : v.x = i, v
    }),
    function() {
        var e, t, n, i = [].slice;
        t = function() {
            var e, t;
            if (e = 1 <= arguments.length ? i.call(arguments, 0) : [], "undefined" != typeof console && null !== console && null != console.error) try {
                return console.error.apply(console, e)
            } catch (n) {
                return t = n, console.error(Array.prototype.slice.call(arguments))
            }
        }, n = function() {
            var e;
            e = 1 <= arguments.length ? i.call(arguments, 0) : []
        }, e = function() {
            var e;
            e = 1 <= arguments.length ? i.call(arguments, 0) : []
        }, _altmetric.exports({
            log: n,
            errorLog: t,
            assert: e
        })
    }.call(this),
    function() {
        var e, t, n, i, r;
        n = function(e, t, n) {
            var i, r, o;
            if (null === e || void 0 === e) throw new TypeError("Object is null or undefined");
            if (r = 0, o = e.length >> 0, i = void 0, "function" != typeof t) throw new TypeError("First argument is not callable");
            if (arguments.length < 3) {
                if (0 === o) throw new TypeError("Array length is 0 and no second argument");
                i = e[0], r = 1
            } else i = n;
            for (; o > r;) r in e && (i = t.call(void 0, i, e[r], r, e), ++r);
            return i
        }, i = function(e) {
            return n(e, function(e, t) {
                return e[t[0]] = t[1], e
            }, {})
        }, t = function(e) {
            return null != Array.prototype.first ? e.first() : e.length > 0 ? e[0] : void 0
        }, r = function(e) {
            var t, n, i, r, o, a;
            if (null != Array.prototype.unique) return e.unique();
            for (i = {}, n = t = 0, r = e.length; r >= 0 ? r >= t : t >= r; n = r >= 0 ? ++t : --t) i[e[n]] = e[n];
            o = [];
            for (n in i) a = i[n], "undefined" !== n && o.push(a);
            return o
        }, e = function(e, t) {
            var n, i, r, o;
            if (null != Array.prototype.filter) return e.filter(t);
            for (r = [], n = 0, i = e.length; i > n; n++) o = e[n], t(o) && r.push(o);
            return r
        }, _altmetric.exports({
            array_reduce: n,
            array_filter: e,
            array_to_dict: i,
            array_first: t,
            array_unique: r
        })
    }.call(this), String.prototype.trim || (String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "")
    }),
    function() {
        var e, t, n, i, r = [].indexOf || function(e) {
            for (var t = 0, n = this.length; n > t; t++)
                if (t in this && this[t] === e) return t;
            return -1
        };
        n = _altmetric.log, e = function(e) {
            var t, n;
            return null != e && null != (t = e.match(/(10\.\d{4,}\/[\S]+[^\.\s])/g)) && null != (n = t[0]) ? n.trim() : void 0
        }, i = function(t) {
            var n, i, o, a;
            return a = ["citation_doi", "dc.identifier", "rft_id", "dc.identifier.doi", "dc.doi", "prism.doi", "eprints.official_url", "dcterms.identifier", "citation_handle_id"], n = function() {
                var e, n, o, l;
                for (l = [], e = 0, n = t.length; n > e; e++) i = t[e], null !== i.name && (o = i.name.toLowerCase(), r.call(a, o) >= 0) && l.push(i);
                return l
            }(), o = function() {
                var t, r, o;
                for (o = [], t = 0, r = n.length; r > t; t++) i = n[t], e(i.value) && o.push(e(i.value));
                return o
            }(), o[0]
        }, t = function(e) {
            var t, n, r;
            return r = document.getElementsByTagName("meta"), n = function() {
                var e, n, i;
                for (i = [], e = 0, n = r.length; n > e; e++) t = r[e], i.push({
                    name: t.getAttribute("name"),
                    value: t.getAttribute("content")
                });
                return i
            }(), i(n) || e
        }, _altmetric.exports({
            findDOI: t,
            extractDOI: e,
            selectDOI: i
        })
    }.call(this),
    function() {
        var e, t, n, i;
        n = _altmetric.log, i = function(t) {
            var n;
            return (n = null != t ? t.toUpperCase().replace(/-|\s/g, "") : void 0) && /^(97(8|9))?\d{9}(\d|X)$/.test(n) ? 10 === n.length ? e(n) : n : void 0
        }, e = function(e) {
            var n, i;
            return "string" != typeof e || 10 !== e.length ? void 0 : (i = 38 + 3 * (t(e[0]) + t(e[2]) + t(e[4]) + t(e[6]) + t(e[8])) + t(e[1]) + t(e[3]) + t(e[5]) + t(e[7]), n = (10 - i % 10) % 10, "978" + e.substring(0, 9) + n)
        }, t = function(e) {
            return parseInt(e, 10)
        }, _altmetric.exports({
            normalizeISBN: i
        })
    }.call(this), _altmetric.exports({
        sources: [{
            id: 5,
            light_colour: "#FF0000",
            dark_colour: "#B60000",
            name: "News",
            code: "m",
            fetch_api_key: "news",
            tab_label: "News",
            tab_id: "msm",
            user_label_plural: "news outlets",
            user_label: "news outlet",
            post_types: ["msm"],
            position: 0,
            basic_api_key: "msm",
            legend_text: "Picked up by **COUNT** news outlet(s)",
            cited_counts: ["cited_by_msm_count"],
            name_plural: "news stories",
            filter: null
        }, {
            id: 18,
            light_colour: "#5fb441",
            dark_colour: "#33741c",
            name: "Book reviews",
            code: "k",
            fetch_api_key: "book_reviews",
            tab_label: "Book reviews",
            tab_id: "book_reviews",
            user_label_plural: "book reviewers",
            user_label: "book reviewer",
            post_types: ["book_review"],
            position: 2,
            basic_api_key: "book_reviews",
            legend_text: "Reviewed in **COUNT** outlet(s)",
            cited_counts: ["cited_by_book_reviews_count"],
            name_plural: "book reviews",
            filter: ""
        }, {
            id: 2,
            light_colour: "#ffd140",
            dark_colour: "#e89500",
            name: "Blogs",
            code: "b",
            fetch_api_key: "blogs",
            tab_label: "Blogs",
            tab_id: "blogs",
            user_label_plural: "blogs",
            user_label: "blog",
            post_types: ["blog"],
            position: 3,
            basic_api_key: "feeds",
            legend_text: "Blogged by **COUNT**",
            cited_counts: ["cited_by_feeds_count"],
            name_plural: "blog posts",
            filter: ""
        }, {
            id: 16,
            light_colour: "#9f79f2",
            dark_colour: "#270a63",
            name: "Policy documents",
            code: "d",
            fetch_api_key: "policy",
            tab_label: "Policy documents",
            tab_id: "policy",
            user_label_plural: "policy sources",
            user_label: "policy source",
            post_types: ["policy"],
            position: 4,
            basic_api_key: "policies",
            legend_text: "Referenced in **COUNT** policy source(s)",
            cited_counts: ["cited_by_policies_count"],
            name_plural: "policy documents",
            filter: ""
        }, {
            id: 1,
            light_colour: "#74CFED",
            dark_colour: "#2F90B9",
            name: "Twitter",
            code: "t",
            fetch_api_key: "twitter",
            tab_label: "Twitter",
            tab_id: "twitter",
            user_label_plural: "tweeters",
            user_label: "tweeter",
            post_types: ["tweet"],
            position: 5,
            basic_api_key: "tweeters",
            legend_text: "Tweeted by **COUNT**",
            cited_counts: ["cited_by_tweeters_count"],
            name_plural: "tweets",
            filter: null
        }, {
            id: 19,
            light_colour: "#a6e8bc",
            dark_colour: "#7cad8d",
            name: "Syllabi",
            code: "y",
            fetch_api_key: "syllabi",
            tab_label: "Syllabi",
            tab_id: "syllabi",
            user_label_plural: "institutions with syllabi",
            user_label: "institution with syllabi",
            post_types: ["syllabus"],
            position: 6,
            basic_api_key: "syllabi",
            legend_text: "Referenced in **COUNT** syllabi",
            cited_counts: ["cited_by_syllabi_count"],
            name_plural: "syllabi",
            filter: ""
        }, {
            id: 14,
            light_colour: "#efefef",
            dark_colour: "#bdbdbd",
            name: "Peer reviews",
            code: "e",
            fetch_api_key: "peer_reviews",
            tab_label: "Peer reviews",
            tab_id: "peer_reviews",
            user_label_plural: "peer review sites",
            user_label: "peer review site",
            post_types: ["peer_review"],
            position: 7,
            basic_api_key: "peer_review_sites",
            legend_text: "Mentioned by **COUNT** peer review site(s)",
            cited_counts: ["cited_by_peer_review_sites_count"],
            name_plural: "peer reviews",
            filter: null
        }, {
            id: 15,
            light_colour: "#ffb33b",
            dark_colour: "#df931b",
            name: "Weibo",
            code: "s",
            fetch_api_key: "weibo",
            tab_label: "Weibo",
            tab_id: "weibo",
            user_label_plural: "weibo users",
            user_label: "weibo user",
            post_types: ["weibo"],
            position: 8,
            basic_api_key: "weibo",
            legend_text: "Mentioned by **COUNT** weibo user(s)",
            cited_counts: ["cited_by_weibo_count"],
            name_plural: "weibo posts",
            filter: null
        }, {
            id: 3,
            light_colour: "#2445BD",
            dark_colour: "#071D70",
            name: "Facebook",
            code: "f",
            fetch_api_key: "facebook",
            tab_label: "Facebook",
            tab_id: "facebook",
            user_label_plural: "Facebook pages",
            user_label: "Facebook page",
            post_types: ["fbwall"],
            position: 9,
            basic_api_key: "fbwalls",
            legend_text: "On **COUNT** Facebook page(s)",
            cited_counts: ["cited_by_fbwalls_count"],
            name_plural: "Facebook posts",
            filter: ""
        }, {
            id: 13,
            light_colour: "#958899",
            dark_colour: "#3b2a3d",
            name: "Wikipedia",
            code: "w",
            fetch_api_key: "wikipedia",
            tab_label: "Wikipedia",
            tab_id: "wikipedia",
            user_label_plural: "Wikipedia pages",
            user_label: "Wikipedia page",
            post_types: ["wikipedia"],
            position: 10,
            basic_api_key: "wikipedia",
            legend_text: "Referenced in **COUNT** Wikipedia pages",
            cited_counts: ["cited_by_wikipedia_count"],
            name_plural: "Wikipedia pages",
            filter: ""
        }, {
            id: 4,
            light_colour: "#E065BB",
            dark_colour: "#912470",
            name: "Google+",
            code: "g",
            fetch_api_key: "googleplus",
            tab_label: "Google+",
            tab_id: "gplus",
            user_label_plural: "Google+ users",
            user_label: "Google+ user",
            post_types: ["gplus"],
            position: 11,
            basic_api_key: "gplus",
            legend_text: "Mentioned in **COUNT** Google+ post(s)",
            cited_counts: ["cited_by_gplus_count"],
            name_plural: "Google+ posts",
            filter: null
        }, {
            id: 6,
            light_colour: "#1E90FF",
            dark_colour: "#00BFFF",
            name: "LinkedIn",
            code: "l",
            fetch_api_key: "linkedin",
            tab_label: "LinkedIn",
            tab_id: "linkedin",
            user_label_plural: "LinkedIn users",
            user_label: "LinkedIn user",
            post_types: ["linkedin"],
            position: 12,
            basic_api_key: "linkedin",
            legend_text: "Mentioned in **COUNT** LinkedIn forum(s)",
            cited_counts: ["cited_by_linkedin_count"],
            name_plural: "LinkedIn posts",
            filter: null
        }, {
            id: 7,
            light_colour: "#D5E8F0",
            dark_colour: "#B9DDEB",
            name: "Reddit",
            code: "r",
            fetch_api_key: "reddit",
            tab_label: "Reddit",
            tab_id: "reddit",
            user_label_plural: "Redditors",
            user_label: "Redditor",
            post_types: ["rdt"],
            position: 13,
            basic_api_key: "rdts",
            legend_text: "Reddited by **COUNT**",
            cited_counts: ["cited_by_rdts_count"],
            name_plural: "Reddit posts",
            filter: null
        }, {
            id: 9,
            light_colour: "#CC6600",
            dark_colour: "#CC3300",
            name: "Pinterest",
            code: "p",
            fetch_api_key: "pinterest",
            tab_label: "Pinterest",
            tab_id: "pinterest",
            user_label_plural: "Pinners",
            user_label: "Pinner",
            post_types: ["pinterest"],
            position: 14,
            basic_api_key: "pinners",
            legend_text: "Pinned by **COUNT** on Pinterest",
            cited_counts: ["cited_by_pinners_count"],
            name_plural: "pins",
            filter: null
        }, {
            id: 8,
            light_colour: "#F4006E",
            dark_colour: "#CB2D2D",
            name: "F1000",
            code: "1",
            fetch_api_key: "f1000",
            tab_label: "Research highlights",
            tab_id: "highlights",
            user_label_plural: "research highlight platforms",
            user_label: "research highlight platform",
            post_types: ["f1000", "rh"],
            position: 15,
            basic_api_key: "rh",
            legend_text: "Highlighted by **COUNT** platform(s)",
            cited_counts: ["cited_by_f1000_count", "cited_by_rh_count"],
            name_plural: "Research highlight platforms",
            filter: ""
        }, {
            id: 10,
            light_colour: "#DEDEDE",
            dark_colour: "#EFEFEF",
            name: "QnA",
            code: "q",
            fetch_api_key: "q&a",
            tab_label: "Q&A",
            tab_id: "qna",
            user_label_plural: "Q&A threads",
            user_label: "Q&A thread",
            post_types: ["qna"],
            position: 16,
            basic_api_key: "qna",
            legend_text: "Mentioned in **COUNT** Q&A thread(s)",
            cited_counts: ["cited_by_forums_count", "cited_by_qna_count", "cited_by_qs_count"],
            name_plural: "Q&A threads",
            filter: null
        }, {
            id: 11,
            light_colour: "#94DB5E",
            dark_colour: "#98C973",
            name: "Video",
            code: "v",
            fetch_api_key: "video",
            tab_label: "Video",
            tab_id: "videos",
            user_label_plural: "video uploaders",
            user_label: "video uploader",
            post_types: ["video"],
            position: 17,
            basic_api_key: "videos",
            legend_text: "On **COUNT** video(s)",
            cited_counts: ["cited_by_videos_count"],
            name_plural: "videos",
            filter: null
        }, {
            id: 12,
            light_colour: "#DEDEDE",
            dark_colour: "#EFEFEF",
            name: "Unknown",
            code: "?",
            fetch_api_key: null,
            tab_label: "Misc.",
            tab_id: "misc",
            user_label_plural: "misc. posts",
            user_label: "misc. post",
            post_types: ["unknown", "other"],
            position: 18,
            basic_api_key: null,
            legend_text: "Mentioned in **COUNT** misc. posts",
            cited_counts: ["cited_by_unknown_count"],
            name_plural: "misc. posts",
            filter: null
        }]
    }),
    function() {
        return this.AltmetricTemplates || (this.AltmetricTemplates = {}), this.AltmetricTemplates.image_or_text = Handlebars.template({
            1: function(e, t, n, i, r) {
                var o;
                return '    <img alt="' + e.escapeExpression((o = null != (o = n.alt_text || (null != t ? t.alt_text : t)) ? o : n.helperMissing, "function" == typeof o ? o.call(null != t ? t : {}, {
                    name: "alt_text",
                    hash: {},
                    data: r
                }) : o)) + '" src="' + e.escapeExpression((o = null != (o = n.img_src || (null != t ? t.img_src : t)) ? o : n.helperMissing, "function" == typeof o ? o.call(null != t ? t : {}, {
                    name: "img_src",
                    hash: {},
                    data: r
                }) : o)) + '" width="' + e.escapeExpression((o = null != (o = n.img_width || (null != t ? t.img_width : t)) ? o : n.helperMissing, "function" == typeof o ? o.call(null != t ? t : {}, {
                    name: "img_width",
                    hash: {},
                    data: r
                }) : o)) + '" height="' + e.escapeExpression((o = null != (o = n.img_height || (null != t ? t.img_height : t)) ? o : n.helperMissing, "function" == typeof o ? o.call(null != t ? t : {}, {
                    name: "img_height",
                    hash: {},
                    data: r
                }) : o)) + '" style="border:0; margin:0; max-width: none;">\n'
            },
            3: function(e, t, n, i, r) {
                var o;
                return '    <span class="_altmetric_score">' + e.escapeExpression((o = null != (o = n.score || (null != t ? t.score : t)) ? o : n.helperMissing, "function" == typeof o ? o.call(null != t ? t : {}, {
                    name: "score",
                    hash: {},
                    data: r
                }) : o)) + "</span>\n"
            },
            compiler: [7, ">= 4.0.0"],
            main: function(e, t, n, i, r) {
                var o;
                return null != (o = n["if"].call(null != t ? t : {}, null != t ? t.show_img : t, {
                    name: "if",
                    hash: {},
                    fn: e.program(1, r, 0),
                    inverse: e.program(3, r, 0),
                    data: r
                })) ? o : ""
            },
            useData: !0
        }), this.AltmetricTemplates.image_or_text
    }.call(this),
    function() {
        return this.AltmetricTemplates || (this.AltmetricTemplates = {}), this.AltmetricTemplates.badge = Handlebars.template({
            compiler: [7, ">= 4.0.0"],
            main: function(e, t, n, i, r) {
                var o, a;
                return '<a target="' + e.escapeExpression((a = null != (a = n.linkTarget || (null != t ? t.linkTarget : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "linkTarget",
                    hash: {},
                    data: r
                }) : a)) + '" href="' + e.escapeExpression((a = null != (a = n.link || (null != t ? t.link : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "link",
                    hash: {},
                    data: r
                }) : a)) + '" style="display:inline-block;">\n' + (null != (o = e.invokePartial(i.image_or_text, t, {
                    name: "image_or_text",
                    data: r,
                    indent: "    ",
                    helpers: n,
                    partials: i,
                    decorators: e.decorators
                })) ? o : "") + "</a>"
            },
            usePartial: !0,
            useData: !0
        }), this.AltmetricTemplates.badge
    }.call(this),
    function() {
        return this.AltmetricTemplates || (this.AltmetricTemplates = {}), this.AltmetricTemplates.badge_with_details = Handlebars.template({
            compiler: [7, ">= 4.0.0"],
            main: function(e, t, n, i, r) {
                var o, a;
                return '<div style="overflow:hidden;">\n    <div class=\'' + e.escapeExpression((a = null != (a = n.legendStyle || (null != t ? t.legendStyle : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "legendStyle",
                    hash: {},
                    data: r
                }) : a)) + "'>\n        <a target=\"" + e.escapeExpression((a = null != (a = n.linkTarget || (null != t ? t.linkTarget : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "linkTarget",
                    hash: {},
                    data: r
                }) : a)) + '" href="' + e.escapeExpression((a = null != (a = n.link || (null != t ? t.link : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "link",
                    hash: {},
                    data: r
                }) : a)) + '" style="display:inline-block;">\n' + (null != (o = e.invokePartial(i.image_or_text, t, {
                    name: "image_or_text",
                    data: r,
                    indent: "            ",
                    helpers: n,
                    partials: i,
                    decorators: e.decorators
                })) ? o : "") + '        </a>\n        <p class=\'altmetric-see-more-details\' style="padding-top: 10px; text-align: center;"><a target="' + e.escapeExpression((a = null != (a = n.linkTarget || (null != t ? t.linkTarget : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "linkTarget",
                    hash: {},
                    data: r
                }) : a)) + '" href="' + e.escapeExpression((a = null != (a = n.link || (null != t ? t.link : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "link",
                    hash: {},
                    data: r
                }) : a)) + '">See more details</a></p>\n    </div>\n    <div id="_altmetric_popover_el" class="altmetric-embed right" style="margin:0; padding:0; display:inline-block; float:left; position:relative;">\n        <div class="altmetric_container" id="_altmetric_container">\n            <div class="altmetric-embed altmetric-popover-inner right" id="_altmetric_popover_inner">\n                <div style="padding:0; margin: 0;" class="altmetric-embed altmetric-popover-content">\n                    ' + (null != (a = null != (a = n.contents || (null != t ? t.contents : t)) ? a : n.helperMissing, o = "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "contents",
                    hash: {},
                    data: r
                }) : a) ? o : "") + "\n                </div>\n            </div>\n        </div>\n    </div>\n</div>"
            },
            usePartial: !0,
            useData: !0
        }), this.AltmetricTemplates.badge_with_details
    }.call(this),
    function() {
        return this.AltmetricTemplates || (this.AltmetricTemplates = {}), this.AltmetricTemplates.badge_with_popover = Handlebars.template({
            compiler: [7, ">= 4.0.0"],
            main: function(e, t, n, i, r) {
                var o, a;
                // Edits begin
                // ------------
                var reportLink = t.link;
                var altmetricId = Meteor.altmetric.idFromUrl(t.link);
                if (altmetricId) {
                    reportLink = Meteor.settings.public.journal.altmetric.reportLink + altmetricId;
                }
                return '<a test="test2" target="_BLANK" href="' + reportLink + '" rel="popover" data-content="<div>' + (null != (a = null != (a = n.contents || (null != t ? t.contents : t)) ? a : n.helperMissing, o = "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "contents",
                    hash: {},
                    data: r
                }) : a) ? o : "") + '</div>" style="display:inline-block;" data-badge-popover="' + e.escapeExpression((a = null != (a = n.position || (null != t ? t.position : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "position",
                    hash: {},
                    data: r
                }) : a)) + '">\n' + (null != (o = e.invokePartial(i.image_or_text, t, {
                    name: "image_or_text",
                    data: r,
                    indent: "    ",
                    helpers: n,
                    partials: i,
                    decorators: e.decorators
                })) ? o : "") + "</a>"
                // end edits
            },
            usePartial: !0,
            useData: !0
        }), this.AltmetricTemplates.badge_with_popover
    }.call(this),
    function() {
        return this.AltmetricTemplates || (this.AltmetricTemplates = {}), this.AltmetricTemplates.legend = Handlebars.template({
            1: function(e, t, n, i, r) {
                var o, a;
                return "    <div style='padding-left: 10px; line-height:18px; border-left: 16px solid " + e.escapeExpression(e.lambda((o = r && r.source) && o.light_colour, t)) + ";'>\n      <a class='link-to-altmetric-details-tab' target='" + e.escapeExpression((a = null != (a = n.linkTarget || (null != t ? t.linkTarget : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "linkTarget",
                    hash: {},
                    data: r
                }) : a)) + "' href='" + e.escapeExpression((a = null != (a = n.link || (null != t ? t.link : t)) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "link",
                    hash: {},
                    data: r
                }) : a)) + "&tab=" + e.escapeExpression((n.tabLabelToRequestId || t && t.tabLabelToRequestId || n.helperMissing).call(null != t ? t : {}, (o = r && r.source) && o.tab_label, {
                    name: "tabLabelToRequestId",
                    hash: {},
                    data: r
                })) + "'>\n" + (null != (o = n["if"].call(null != t ? t : {}, null != t ? t.condensedLegend : t, {
                    name: "if",
                    hash: {},
                    fn: e.program(2, r, 0),
                    inverse: e.program(4, r, 0),
                    data: r
                })) ? o : "") + "      </a>\n    </div>\n"
            },
            2: function(e, t, n, i, r) {
                var o, a;
                return "          " + e.escapeExpression(e.lambda((o = r && r.source) && o.name, t)) + " (" + e.escapeExpression((a = null != (a = n.count || r && r.count) ? a : n.helperMissing, "function" == typeof a ? a.call(null != t ? t : {}, {
                    name: "count",
                    hash: {},
                    data: r
                }) : a)) + ")\n"
            },
            4: function(e, t, n, i, r) {
                var o;
                return "          " + (null != (o = (n.legendText || t && t.legendText || n.helperMissing).call(null != t ? t : {}, (o = r && r.source) && o.legend_text, r && r.count, {
                    name: "legendText",
                    hash: {},
                    data: r
                })) ? o : "") + "\n"
            },
            6: function(e, t, n, i, r) {
                var o;
                return "    <div class='altmetric-embed readers' style='margin-top: 10px;'>\n" + (null != (o = n["if"].call(null != t ? t : {}, null != (o = null != t ? t.readerVisibility : t) ? o.mendeley : o, {
                    name: "if",
                    hash: {},
                    fn: e.program(7, r, 0),
                    inverse: e.noop,
                    data: r
                })) ? o : "") + (null != (o = n["if"].call(null != t ? t : {}, null != (o = null != t ? t.readerVisibility : t) ? o.citeulike : o, {
                    name: "if",
                    hash: {},
                    fn: e.program(12, r, 0),
                    inverse: e.noop,
                    data: r
                })) ? o : "") + "    </div>\n"
            },
            7: function(e, t, n, i, r) {
                var o;
                return "          <div class='altmetric-embed tip_mendeley'\n               style='padding-left: 10px; line-height:18px; border-left: 16px solid #A60000;'>\n" + (null != (o = n["if"].call(null != t ? t : {}, null != t ? t.condensedLegend : t, {
                    name: "if",
                    hash: {},
                    fn: e.program(8, r, 0),
                    inverse: e.program(10, r, 0),
                    data: r
                })) ? o : "") + "          </div>\n"
            },
            8: function(e, t) {
                var n;
                return "              Mendeley (" + e.escapeExpression(e.lambda(null != (n = null != t ? t.readers : t) ? n.mendeley : n, t)) + ")\n"
            },
            10: function(e, t, n, i, r) {
                var o;
                return "              <b>" + e.escapeExpression(e.lambda(null != (o = null != t ? t.readers : t) ? o.mendeley : o, t)) + "</b> " + e.escapeExpression((n.pluralize || t && t.pluralize || n.helperMissing).call(null != t ? t : {}, null != (o = null != t ? t.readers : t) ? o.mendeley : o, "reader", {
                    name: "pluralize",
                    hash: {},
                    data: r
                })) + " on Mendeley            \n"
            },
            12: function(e, t, n, i, r) {
                var o;
                return "          <div class='altmetric-embed tip_citeulike'\n               style='padding-left: 10px; line-height:18px; border-left: 16px solid #BCD2EF;'>\n" + (null != (o = n["if"].call(null != t ? t : {}, null != t ? t.condensedLegend : t, {
                    name: "if",
                    hash: {},
                    fn: e.program(13, r, 0),
                    inverse: e.program(15, r, 0),
                    data: r
                })) ? o : "") + "          </div>\n"
            },
            13: function(e, t) {
                var n;
                return "              CiteULike (" + e.escapeExpression(e.lambda(null != (n = null != t ? t.readers : t) ? n.citeulike : n, t)) + ")\n"
            },
            15: function(e, t, n, i, r) {
                var o;
                return "              <b>" + e.escapeExpression(e.lambda(null != (o = null != t ? t.readers : t) ? o.citeulike : o, t)) + "</b> " + e.escapeExpression((n.pluralize || t && t.pluralize || n.helperMissing).call(null != t ? t : {}, null != (o = null != t ? t.readers : t) ? o.citeulike : o, "reader", {
                    name: "pluralize",
                    hash: {},
                    data: r
                })) + " on CiteULike\n"
            },
            17: function(e, t, n, i, r) {
                // Edits begin
                // ------------
                var reportLink = t.link;
                var altmetricId = Meteor.altmetric.idFromUrl(t.link);
                if (altmetricId) {
                    reportLink = Meteor.settings.public.journal.altmetric.reportLink + altmetricId;
                }
                var o;
                return "    <div style='margin-top: 10px; text-align: center;'>\n        <a class='altmetric_details' target='_BLANK' href='" + reportLink + "'>\n            See more details\n        </a>\n        |\n        <a href='javascript:void(0)' class='close-popover'>\n            Close this\n        </a>\n    </div>\n\n    <a class='altmetric_embed close-popover'\n       style='display: block; position: absolute; top: 10px; right: 15px; font-size: 1.2em; font-weight: bold; text-decoration: none; color: black; padding-bottom: 2em; padding-left: 2em;'\n       href='javascript:void(0)'>\n        &times;\n    </a>\n"
                // Edits end
            },
            compiler: [7, ">= 4.0.0"],
            main: function(e, t, n, i, r) {
                var o, a, l, s = "";
                return a = null != (a = n.eachSourceWithCount || (null != t ? t.eachSourceWithCount : t)) ? a : n.helperMissing, l = {
                    name: "eachSourceWithCount",
                    hash: {},
                    fn: e.program(1, r, 0),
                    inverse: e.noop,
                    data: r
                }, o = "function" == typeof a ? a.call(null != t ? t : {}, l) : a, n.eachSourceWithCount || (o = n.blockHelperMissing.call(t, o, l)), null != o && (s += o), s + "\n" + (null != (o = n["if"].call(null != t ? t : {}, null != (o = null != t ? t.readerVisibility : t) ? o.visible : o, {
                    name: "if",
                    hash: {},
                    fn: e.program(6, r, 0),
                    inverse: e.noop,
                    data: r
                })) ? o : "") + (null != (o = n["if"].call(null != t ? t : {}, null != t ? t.popover : t, {
                    name: "if",
                    hash: {},
                    fn: e.program(17, r, 0),
                    inverse: e.noop,
                    data: r
                })) ? o : "")
            },
            useData: !0
        }), this.AltmetricTemplates.legend
    }.call(this),
    function() {
        var e, t, n, i, r = [].slice;
        e = Handlebars.noConflict(), t = _altmetric.assert, i = _altmetric.log, n = _altmetric.encodeHTML, e.registerHelper("pluralize", function(e, t, n) {
            return 1 === e ? t : t + "s"
        }), e.registerHelper("tabLabelToRequestId", function(e) {
            return e.toLowerCase().replace(/[^a-zA-Z\s]/, "").replace(/\s+/, "-")
        }), e.registerHelper("eachSourceWithCount", function(t) {
            var n, i, r, o;
            return r = function() {
                var r, a, l, s;
                for (l = _altmetric.sources, s = [], r = 0, a = l.length; a > r; r++) o = l[r], n = "cited_by_" + o.basic_api_key + "_count", n in this ? (i = e.createFrame(t.data || {}), i.source = o, i.count = this[n], s.push(t.fn(this, {
                    data: i
                }))) : s.push(void 0);
                return s
            }.call(this), r.join("")
        }), e.registerHelper("legendText", function(e, i) {
            var r, o;
            return t(void 0 !== e, "LegendText should not be undefined"), t(void 0 !== i, "Count should never be undefined"), o = n(e).replace(/\*\*(\w+)\*\*/, "<b>$1</b>"), o = o.replace(/COUNT/, i), r = i > 0, o.replace(/(\w+)\(s\)/, r ? "$1s" : "$1")
        }), e.registerHelper("donutImgUrl", function(t) {
            var n;
            return n = t.hash.size, new e.SafeString("<img src='" + e.Utils.escapeExpression(this.donutImageUrl(2 * n)) + "' width='" + n + "' height='" + n + "'/>")
        }), e.registerPartial("image_or_text", AltmetricTemplates.image_or_text), e.registerHelper("log", function() {
            var e;
            return e = 1 <= arguments.length ? r.call(arguments, 0) : [], i.apply(null, e)
        })
    }.call(this),
    function() {
        var e, t, n, i, r, o, a = function(e, t) {
            return function() {
                return e.apply(t, arguments)
            }
        };
        r = _altmetric.log, o = _altmetric.qwery, t = _altmetric.bean, n = _altmetric.bonzo, i = _altmetric.array_first, e = function() {
            function e(e, t) {
                this.badge_element = e, this.hidden = null != t ? t : !0, this.hide = a(this.hide, this), this.pauseHide = a(this.pauseHide, this), this.cancelHide = a(this.cancelHide, this), this.show = a(this.show, this), this.pauseShow = a(this.pauseShow, this), this.tapElement = a(this.tapElement, this), this.element = i(o("a[rel=popover]", this.badge_element)), this.element || (this.element = this.badge_element.firstChild), this.contents = this.element.getAttribute("data-content"), this.position = this.element.getAttribute("data-badge-popover"), this.uuid = this.badge_element.getAttribute("data-uuid")
            }
            return e.prototype.build = function() {
                return this.buildPopover(), this.attachEvents()
            }, e.prototype.cssPath = function() {
                var e;
                return e = "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed-2c47105b6381604898bbf8ae8a680350.css", r("css_url", e), e
            }, e.prototype.insertCSS = function() {
                var e, t;
                return 0 === o("#altmetric-embed-css").length ? (e = this.cssPath(), r("injecting CSS: " + e), t = document.createElement("link"), t.setAttribute("id", "altmetric-embed-css"), t.setAttribute("rel", "stylesheet"), t.setAttribute("type", "text/css"), n(o("head")).append(t), t.setAttribute("href", e)) : void 0
            }, e.prototype.buildPopover = function() {
                var e, t, i, a, l;
                return a = o("div.altmetric-popover[data-uuid=" + this.uuid + "]"), l = o("div.altmetric-popover-inner[data-uuid=" + this.uuid + "]"), a.length > 0 && l.length > 0 ? (this.el = a[0], this.inner = l[0]) : (r("creating popover for " + this.uuid), t = document.createElement("div"), t.setAttribute("class", "altmetric_container"), t.setAttribute("id", "_altmetric_container"), e = document.createElement("div"), e.setAttribute("class", "altmetric_arrow altmetric-" + this.position), t.appendChild(e), this.inner = document.createElement("div"), t.appendChild(this.inner), this.el = document.createElement("div"), this.el.appendChild(t), document.body.appendChild(this.el)), this.el.setAttribute("class", "altmetric-embed altmetric-popover altmetric-" + this.position), this.el.setAttribute("data-uuid", this.uuid), this.el.setAttribute("id", "_altmetric_popover_el"), this.el.style.margin = "0px", this.inner.setAttribute("id", "_altmetric_popover_inner"), this.inner.setAttribute("class", "altmetric-embed altmetric-popover-inner altmetric-floating altmetric-" + this.position), this.inner.setAttribute("data-uuid", this.uuid), i = document.createElement("div"), i.setAttribute("class", "altmetric-embed altmetric-popover-content altmetric-floating"), i.innerHTML = this.contents, n(this.inner).html(i), n(this.el).show("block").hide()
            }, e.prototype.attachEvents = function() {
                return t.add(this.element, "mouseover", this.pauseShow), t.add(this.element, "touchstart", this.tapElement), t.add(this.el, "mouseover", this.cancelHide), t.add(this.el, "mouseleave.pause", this.pauseHide), t.add(this.el, "a.close-popover", "click", function(e) {
                    return function(t) {
                        return t.stop(), e.hide_popover = !0, e.hide()
                    }
                }(this))
            }, e.prototype.tapElement = function(e) {
                return this.hidden ? (e.stop(), this.pauseShow()) : void 0
            }, e.prototype.pauseShow = function() {
                return this.hidden = !1, t.add(this.element, "mouseleave.pause", this.pauseHide), setTimeout(function(e) {
                    return function() {
                        return e.show()
                    }
                }(this), 300)
            }, e.prototype.show = function() {
                var e, t, i, r, o, a, l;
                if (!this.hidden) switch (i = n(this.element).offset(), n(this.el).show("block"), t = this.el.offsetWidth, e = this.el.offsetHeight, a = i.top, o = i.left, l = i.width, r = i.height, this.position) {
                    case "right":
                        return this.el.style.top = a + r / 2 - e / 2 + "px", this.el.style.left = o + l + "px";
                    case "left":
                        return this.el.style.top = a + r / 2 - e / 2 + "px", this.el.style.left = o - t + "px";
                    case "top":
                        return this.el.style.top = a - e + "px", this.el.style.left = o + l / 2 - t / 2 + "px";
                    case "bottom":
                        return this.el.style.top = a + r + "px", this.el.style.left = o + l / 2 - t / 2 + "px"
                }
            }, e.prototype.cancelHide = function() {
                return this.hide_popover = !1
            }, e.prototype.pauseHide = function() {
                return this.hide_popover = !0, setTimeout(function(e) {
                    return function() {
                        return e.hide()
                    }
                }(this), 300)
            }, e.prototype.hide = function() {
                return this.hide_popover ? (n(this.el).hide(), this.hidden = !0) : void 0
            }, e
        }(), _altmetric.exports({
            Popover: e
        })
    }.call(this),
    function() {
        var e, t, n;
        n = _altmetric.log, t = function(e, t) {
            var n;
            return n = e.images.small, t = Math.min(t, 320), n = n.replace(/size=\d+/, "size=" + t)
        }, e = function(e, t) {
            var n;
            return n = e.images.medium, t = Math.min(t, 320), n = n.replace(/size=(\d+)/, "size=" + t), /style=(\w+)/.test(n) ? n = n.replace(/style=(\w+)/, "style=bar") : n += "&style=bar"
        }, _altmetric.exports({
            donut_url: t,
            bar_url: e
        })
    }.call(this),
    function() {
        var e, t, n, i, r, o, a, l, s, u, c, d, p, h, f, m, g, _, v, y, b, w = {}.hasOwnProperty;
        g = _altmetric.log, c = _altmetric.errorLog, y = _altmetric.qwery, a = _altmetric.bowser, r = _altmetric.bean, o = _altmetric.bonzo, n = _altmetric.api_uri, i = _altmetric.api_version, t = _altmetric.api_key, l = _altmetric.details_uri, e = function() {
            function e(e) {
                var t, n, i;
                this.element = e, this.setUUID(), this.classes = this.element.className.split(" "), this.altmetric_id = this.getAltmetricId(), this.doi = this.getDoi(), this.arxiv_id = this.getArxivId(), this.pubmed_id = this.getPubmedId(), this.handle_id = this.getHandle(), this.uri = this.getURI(), this.urn = this.getURN(), this.nct_id = this.getNCTID(), this.isbn = this.getISBN(), this.dataBadgeType = this.getProperty("badge-type"), this.detailsTemplate = this.getProperty("template"), this.popoverPosition = this.getProperty("badge-popover"), this.detailsPosition = this.getProperty("badge-details"), this.condensed = "true" === (null != (n = this.getProperty("condensed")) ? n.toLowerCase() : void 0), this.linkTarget = this.getProperty("link-target") || "_self", this.badge_cdn = "https://d1uo4w7k31k5mn.cloudfront.net", this.hasScore = null == this.getProperty("no-score"), this.cache_breaker = this._getCacheBreaker(), this.badgeSizes = this._getBadgeSizes(), this.getProperty("hide-less-than") && (this.hideLessThanScore = parseInt(this.getProperty("hide-less-than"), 10)), t = "true" === (null != (i = this.getProperty("hide-no-mentions")) ? i.toLowerCase() : void 0), t && !this.hideLessThanScore && (this.hideLessThanScore = 1)
            }
            return e.prototype.getClassProperty = function(e) {
                var t, n, i, r;
                return t = "altmetric-" + e, r = function() {
                    var e, i, r, o;
                    for (r = this.classes, o = [], e = 0, i = r.length; i > e; e++) n = r[e], 0 === n.indexOf(t) && o.push(n.replace(/\s+/g, ""));
                    return o
                }.call(this), i = _altmetric.array_first(r), i ? i.substring(t.length + 1) : void 0
            }, e.prototype.getProperty = function(e) {
                return this.element.getAttribute("data-" + e) || this.getClassProperty(e)
            }, e.prototype.badgeType = function() {
                return null != this.dataBadgeType ? this.dataBadgeType.match(/\d+/) ? "v" + this.dataBadgeType : this.dataBadgeType.match(/(donut|bar|text)/) ? this.dataBadgeType.replace("-", "_") : "v2" : "v2"
            }, e.prototype.badgePath = function() {
                return this.badgeType().match(/donut/) ? "donut" : this.badgeType().match(/bar/) ? "bar" : this.badgeType()
            }, e.prototype.setUUID = function() {
                var e;
                return e = function() {
                    return (65536 * (1 + Math.random()) | 0).toString(16).substring(1)
                }, this.uuid = this.element.getAttribute("data-uuid") || e() + e() + "-" + e() + "-" + e() + "-" + e() + "-" + e() + e() + e(), this.element.setAttribute("data-uuid", this.uuid)
            }, e.prototype.getDoi = function() {
                var e;
                return _altmetric.extractDOI(null != (e = this.getProperty("doi")) ? e.toLowerCase() : void 0) || this.getProperty("doi")
            }, e.prototype.getArxivId = function() {
                var e, t;
                return null != (e = this.getProperty("arxiv-id")) && null != (t = e.match(/([^\:]*)$/g)) ? t[0] : void 0
            }, e.prototype.getAltmetricId = function() {
                return this.getProperty("altmetric-id")
            }, e.prototype.getPubmedId = function() {
                return this.getProperty("pmid")
            }, e.prototype.getHandle = function() {
                var e;
                return null != (e = this.getProperty("handle")) ? e.toLowerCase() : void 0
            }, e.prototype.getURI = function() {
                return this.getProperty("uri")
            }, e.prototype.getURN = function() {
                return this.getProperty("urn")
            }, e.prototype.getISBN = function() {
                var e;
                return (e = _altmetric.normalizeISBN(this.getProperty("isbn"))) ? e : this.getProperty("isbn")
            }, e.prototype.getNCTID = function() {
                return this.getProperty("nct-id")
            }, e.prototype.badgeId = function() {
                var e;
                return e = this.altmetric_id || this.doi || this.arxiv_id || this.pubmed_id || this.handle_id || this.uri || this.urn || this.isbn || this.nct_id, e ? e : this.doi = _altmetric.findDOI(void 0)
            }, e.prototype.insertPlaceholder = function() {
                var e, t, n, i, r, o;
                return i = document.createElement("a"), o = this.getBadgeWidth(), n = this.getBadgeHeight(), e = this.badgePath(), this.shouldShowPlaceholder() && (i.style.cursor = "pointer", i.style.display = "inline-block", "text" === this.badgeType() ? i.innerHTML = "?" : (i.style.backgroundImage = this.getBackgroundImage(o, e), i.style.width = o + "px", i.style.height = n + "px")), t = l + "/details.php?domain=" + document.domain + "&" + this.placeholderDetailsParam(), this.detailsTemplate && (t += "&template=" + this.detailsTemplate), i.setAttribute("href", t), i.setAttribute("target", this.linkTarget), i.appendChild(document.createTextNode(" ")), r = document.createElement("div"), r.appendChild(i), this.element.innerHTML = r.innerHTML
            }, e.prototype.prepareBadge = function() {
                return this.shouldShowPlaceholder() && this.insertPlaceholder(), this.fetchData()
            }, e.prototype.shouldShowPlaceholder = function() {
                return !this.hideLessThanScore
            }, e.prototype.placeholderDetailsParam = function() {
                return this.altmetric_id ? "citation_id=" + encodeURIComponent(this.altmetric_id) : this.doi ? "doi=" + encodeURIComponent(this.doi) : this.arxiv_id ? "arxiv_id=" + encodeURIComponent(this.arxiv_id) : this.pubmed_id ? "pmid=" + encodeURIComponent(this.pubmed_id) : this.handle_id ? "handle=" + encodeURIComponent(this.handle_id) : this.uri ? "uri=" + encodeURIComponent(this.uri) : this.urn ? "urn=" + encodeURIComponent(this.urn) : this.isbn ? "isbn=" + encodeURIComponent(this.isbn) : this.nct_id ? "nct_id=" + encodeURIComponent(this.nct_id) : void 0
            }, e.prototype.apiCall = function() {
                return this.altmetric_id ? "id/" + this.altmetric_id : this.doi ? "doi/" + this.doi : this.arxiv_id ? "arxiv/" + this.arxiv_id : this.pubmed_id ? "pmid/" + this.pubmed_id : this.handle_id ? "handle/" + this.handle_id : this.uri ? "uri/" + encodeURIComponent(this.uri) : this.urn ? "urn/" + this.urn : this.isbn ? "isbn/" + this.isbn : this.nct_id ? "nct_id/" + this.nct_id : void 0
            }, e.prototype.fetchData = function() {
                var e, r;
                return r = n + "/" + i + "/" + this.apiCall() + "?callback=_altmetric.embed_callback&domain=" + document.domain + "&key=" + t + "&" + this.cache_breaker, e = document.createElement("script"), e.setAttribute("type", "text/javascript"), e.onerror = function(e) {
                    return function(t) {
                        return g("Error fetching JSONP details for " + e.badgeId()), g(t), e.clear()
                    }
                }(this), document.body.appendChild(e), e.setAttribute("src", r)
            }, e.prototype.clear = function() {
                return this.shouldShowPlaceholder() ? this.insertPlaceholder() : this.hide()
            }, e.prototype.hide = function() {
                return o(this.element).addClass("altmetric-hidden"), r.fire(this.element, "altmetric:hide"), this.element.innerHTML = ""
            }, e.prototype.renderBadge = function(e) {
                var t, n, i;
                return this.altmetric_info = e, this.score = Math.ceil(this.altmetric_info.score), this.altmetric_id = this.altmetric_info.altmetric_id, this.altmetric_link = l + "/details.php?domain=" + document.domain + "&citation_id=" + this.altmetric_id, this.hasScore || (this.altmetric_link += "&no_score=true"), this.detailsTemplate && (this.altmetric_link += "&template=" + this.detailsTemplate), i = "badge", n = this.getBadgeInfo(), this.popoverPosition ? (n.contents = this.prepareViewContent(!0), n.position = this.popoverPosition, i = "badge_with_popover") : this.detailsPosition && (n.contents = this.prepareViewContent(!1), n.position = this.detailsPosition, i = "badge_with_details"), t = AltmetricTemplates[i](n), this.scoreGreaterThanThreshold() ? (this.show(t), this.renderPopover()) : this.clear()
            }, e.prototype.scoreGreaterThanThreshold = function() {
                return this.hideLessThanScore ? this.score >= this.hideLessThanScore : !0
            }, e.prototype.show = function(e) {
                return this.element.innerHTML = e, o(this.element).removeClass("altmetric-hidden"), r.fire(this.element, "altmetric:show")
            }, e.prototype.getBadgeInfo = function() {
                return {
                    link: this.altmetric_link,
                    show_img: "text" !== this.badgeType(),
                    img_width: this.getBadgeWidth() + "px",
                    img_height: this.getBadgeHeight() + "px",
                    img_src: this.imageURL(),
                    score: this.score,
                    alt_text: "Article has an altmetric score of " + this.score,
                    linkTarget: this.linkTarget,
                    legendStyle: this.getLegendStyle()
                }
            }, e.prototype.getLegendStyle = function() {
                return this.condensed ? "altmetric-condensed-legend" : "altmetric-normal-legend"
            }, e.prototype.getBadgeWidth = function() {
                return this.badgeSizes[this.badgeType()].width
            }, e.prototype.getBadgeHeight = function() {
                return this.badgeSizes[this.badgeType()].height
            }, e.prototype.getBackgroundImage = function(e, t) {
                return this.hasCustomisableImage(t) ? "url(https://altmetric-badges.a.ssl.fastly.net/?size=" + e + "&score=?&types=????????&style=" + t + ")" : "url(" + this.badge_cdn + "/" + t + "/0.png)"
            }, e.prototype.hasCustomisableImage = function(e) {
                return "donut" === e || "bar" === e
            }, e.prototype.renderPopover = function() {
                return this.popover = new _altmetric.Popover(this.element), this.popover.insertCSS(), this.popoverPosition && this.shouldRenderPopover() ? this.popover.build() : void 0
            }, e.prototype.shouldRenderPopover = function() {
                return !a.msie || a.msie && a.version > 7
            }, e.prototype.prepareViewContent = function(e) {
                return this.altmetric_info.link = this.altmetric_link, this.altmetric_info.popover = e, this.altmetric_info.linkTarget = this.linkTarget, this.altmetric_info.condensedLegend = this.condensed, this.altmetric_info.readerVisibility = {
                    visible: !0
                }, this._setReadersCountersVisibility(this.altmetric_info), AltmetricTemplates.legend(this.altmetric_info)
            }, e.prototype._setReadersCountersVisibility = function(e) {
                var t, n, i, r;
                if (0 === e.readers_count) return e.readerVisibility.visible = !1;
                n = e.readers, i = [];
                for (t in n) r = n[t], i.push(e.readerVisibility[t] = r > 0);
                return i
            }, e.prototype._getCacheBreaker = function() {
                var e;
                return e = new Date, "cache_until=" + e.getHours() + "-" + e.getDate()
            }, e.prototype._getBadgeSizes = function() {
                return {
                    v1: {
                        width: "110",
                        height: "20"
                    },
                    v2: {
                        width: "88",
                        height: "18"
                    },
                    v3: {
                        width: "99",
                        height: "18"
                    },
                    v4: {
                        width: "85",
                        height: "15"
                    },
                    donut: {
                        width: "64",
                        height: "64"
                    },
                    medium_donut: {
                        width: "120",
                        height: "120"
                    },
                    large_donut: {
                        width: "180",
                        height: "180"
                    },
                    bar: {
                        width: "100",
                        height: "15"
                    },
                    medium_bar: {
                        width: "120",
                        height: "18"
                    },
                    large_bar: {
                        width: "180",
                        height: "27"
                    },
                    text: {
                        width: "110",
                        height: "20"
                    }
                }
            }, e.prototype.imageURL = function() {
                var e;
                return e = "donut" === this.badgePath() ? _altmetric.donut_url(this.altmetric_info, 2 * this.badgeSizes[this.badgeType()].width) : "bar" === this.badgePath() ? _altmetric.bar_url(this.altmetric_info, 2 * this.badgeSizes[this.badgeType()].width) : this.badge_cdn + "/" + this.badgePath() + "/" + this.score + ".png", this.hasScore || (e = e.replace(/score=[0-9\?]+/, "score=")), e
            }, e
        }(), s = function(e) {
            var t;
            try {
                return b(e)
            } catch (n) {
                return t = n, _(t)
            }
        }, u = function() {
            var e;
            try {
                return v()
            } catch (t) {
                return e = t, _(e)
            }
        }, _ = function(e) {
            return c(e.message || e.description), _altmetric.bugsnag.notifyException(e)
        }, f = function(e) {
            var t, n;
            return [e.altmetric_id, e.pmid, e.arxiv_id, e.uri, e.urn, null != (t = e.handle) ? t.toLowerCase() : void 0, null != (n = e.doi) ? n.toLowerCase() : void 0, e.nct_id].concat(e.isbns)
        }, m = function(e) {
            var t, n, i, r, o, a, l, s;
            for (r = f(e), a = [], n = 0, o = r.length; o > n; n++)
                if (i = r[n], i && _altmetric.badges.hasOwnProperty(i)) {
                    l = _altmetric.badges[i];
                    for (s in l) w.call(l, s) && (t = l[s], a.push(t))
                }
            return 0 === a.length && g("No matching badges for " + r), a
        }, b = function(e) {
            var t, n, i, r, o;
            for (r = m(e), o = [], n = 0, i = r.length; i > n; n++) t = r[n], o.push(t.renderBadge(e));
            return o
        }, h = function() {
            return y(".altmetric-embed:not(.altmetric-popover):not(.altmetric-popover-inner):not(.altmetric-popover-content)")
        }, d = function() {
            var t, n, i, r, o;
            for (r = h(), o = [], n = 0, i = r.length; i > n; n++) t = r[n], o.push(new e(t));
            return o
        }, p = function() {
            var e, t, n, i, r;
            for (i = d(), r = [], t = 0, n = i.length; n > t; t++) e = i[t], null != e.badgeId() && r.push(e);
            return r
        }, v = function() {
            var e, t, n, i, r, o, a, l, s;
            for (t = p(), i = 0, o = t.length; o > i; i++) e = t[i], (n = _altmetric.badges)[l = e.badgeId()] || (n[l] = {}), _altmetric.badges[e.badgeId()][e.uuid] = e;
            for (s = [], r = 0, a = t.length; a > r; r++) e = t[r], s.push(e.prepareBadge());
            return s
        }, _altmetric.exports({
            Badge: e,
            embed_init: u,
            badges: {},
            embed_callback: s
        })
    }.call(this), ! function(e, t) {
        "undefined" != typeof module ? module.exports = t() : _altmetric[e] = t()
    }("domready", function(e) {
        function t(e) {
            for (h = 1; e = i.shift();) e()
        }
        var n, i = [],
            r = !1,
            o = document,
            a = o.documentElement,
            l = a.doScroll,
            s = "DOMContentLoaded",
            u = "addEventListener",
            c = "onreadystatechange",
            d = "readyState",
            p = l ? /^loaded|^c/ : /^loaded|c/,
            h = p.test(o[d]);
        return o[u] && o[u](s, n = function() {
            o.removeEventListener(s, n, r), t()
        }, r), l && o.attachEvent(c, n = function() {
            /^c/.test(o[d]) && (o.detachEvent(c, n), t())
        }), e = l ? function(t) {
            self != top ? h ? t() : i.push(t) : function() {
                try {
                    a.doScroll("left")
                } catch (n) {
                    return setTimeout(function() {
                        e(t)
                    }, 50)
                }
                t()
            }()
        } : function(e) {
            h ? e() : i.push(e)
        }
    }),
    function(e) {
        var t = window.Bugsnag;
        window.Bugsnag = e(window, document, navigator, t)
    }(function(e, t, n, i) {
        function r(t) {
            var n = e.console;
            void 0 !== n && void 0 !== n.log && n.log("[Bugsnag] " + t)
        }

        function o(e, t) {
            var n = [];
            for (var i in e)
                if (e.hasOwnProperty(i) && null != i && null != e[i]) {
                    var r = t ? t + "[" + i + "]" : i,
                        a = e[i];
                    n.push("object" == typeof a ? o(a, r) : encodeURIComponent(r) + "=" + encodeURIComponent(a))
                }
            return n.join("&")
        }

        function a(e, t) {
            if (null == t) return e;
            e = e || {};
            for (var n in t)
                if (t.hasOwnProperty(n)) try {
                    e[n] = t[n].constructor === Object ? a(e[n], t[n]) : t[n]
                } catch (i) {
                    e[n] = t[n]
                }
                return e
        }

        function l(e, t) {
            if (y.testRequest) y.testRequest(e, t);
            else {
                var n = new Image;
                n.src = e + "?" + o(t) + "&ct=img&cb=" + (new Date).getTime()
            }
        }

        function s(e) {
            for (var t = {}, n = /^data\-([\w\-]+)$/, i = e.attributes, r = 0; r < i.length; r++) {
                var o = i[r];
                if (n.test(o.nodeName)) {
                    var a = o.nodeName.match(n)[1];
                    t[a] = o.nodeValue
                }
            }
            return t
        }

        function u(e, t) {
            b = b || s(S);
            var n = void 0 !== y[e] ? y[e] : b[e.toLowerCase()];
            return "false" === n && (n = !1), void 0 !== n ? n : t
        }

        function c(e) {
            return null != e && e.match(w) ? !0 : (r("Invalid API key '" + e + "'"), !1)
        }

        function d(t, i) {
            var r = u("apiKey");
            if (c(r)) {
                var o = u("releaseStage"),
                    s = u("notifyReleaseStages");
                if (s) {
                    for (var d = !1, p = 0; p < s.length; p++)
                        if (o === s[p]) {
                            d = !0;
                            break
                        }
                    if (!d) return
                }
                var h = a(u("metaData"), i),
                    f = y.beforeNotify;
                if ("function" == typeof f) {
                    var m = f(t, h);
                    if (m === !1) return
                }
                var g = e.location;
                l(u("endpoint") || T, {
                    notifierVersion: P,
                    apiKey: r,
                    projectRoot: u("projectRoot") || g.protocol + "//" + g.host,
                    context: u("context") || g.pathname,
                    userId: u("userId"),
                    metaData: h,
                    releaseStage: o,
                    url: e.location.href,
                    userAgent: n.userAgent,
                    language: n.language || n.userLanguage,
                    name: t.name,
                    message: t.message,
                    stacktrace: t.stacktrace,
                    file: t.file,
                    lineNumber: t.lineNumber,
                    columnNumber: t.columnNumber
                })
            }
        }

        function p() {
            var e, t = 10,
                n = "[anonymous]";
            try {
                throw new Error("")
            } catch (i) {
                e = h(i)
            }
            if (!e) {
                for (var r = [], o = arguments.callee.caller.caller; o && r.length < t;) {
                    var a = x.test(o.toString()) ? RegExp.$1 || n : n;
                    r.push(a), o = o.caller
                }
                e = r.join("\n")
            }
            return e
        }

        function h(e) {
            return e.stack || e.backtrace || e.stacktrace
        }

        function f() {
            var e = u("metrics"),
                t = u("apiKey");
            if ((e === !0 || "true" === e) && c(t)) {
                var n = "bugsnag_" + t,
                    i = v(n);
                null == i && (i = g(), _(n, i, 1e3, !0)), l(u("metricsEndpoint") || E, {
                    userId: i,
                    apiKey: t
                })
            }
        }

        function m() {
            return Math.floor(65536 * (1 + Math.random())).toString(16).substring(1)
        }

        function g() {
            return m() + m() + "-" + m() + "-" + m() + "-" + m() + "-" + m() + m() + m()
        }

        function _(n, i, r, o) {
            var a = "",
                l = "";
            if (r) {
                var s = new Date;
                s.setTime(s.getTime() + 24 * r * 60 * 60 * 1e3), l = "; expires=" + s.toGMTString()
            }
            if (o) {
                var u = e.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
                    c = u ? u[0] : "";
                a = c ? "; domain=." + c : ""
            }
            t.cookie = n + "=" + encodeURIComponent(i) + l + "; path=/" + a
        }

        function v(e) {
            var n = t.cookie.match(e + "=([^$;]+)");
            return n ? decodeURIComponent(n[1]) : null
        }
        var y = {};
        y.noConflict = function() {
            return e.Bugsnag = i, y
        }, y.notifyException = function(e, t, n) {
            "string" != typeof t && (n = t), d({
                name: t || e.name,
                message: e.message || e.description,
                stacktrace: h(e) || p(),
                file: e.fileName || e.sourceURL,
                lineNumber: e.lineNumber || e.line
            }, n)
        }, y.notify = function(e, t, n) {
            d({
                name: e,
                message: t,
                stacktrace: p()
            }, n)
        }, y._onerror = e.onerror, e.onerror = function(e, t, n, i, o) {
            var a = u("autoNotify", !0);
            a && "Script error." === e && "" === t && 0 === n && (r("Error on cross-domain script, couldn't notify Bugsnag."), a = !1), a && d({
                name: "window.onerror",
                message: e,
                file: t,
                lineNumber: n,
                columnNumber: i,
                stacktrace: o && h(o)
            }), y._onerror && y._onerror(e, t, n)
        };
        var b, w = /^[0-9a-f]{32}$/i,
            x = /function\s*([\w\-$]+)?\s*\(/i,
            k = "https://notify.bugsnag.com/",
            T = k + "js",
            E = k + "metrics",
            P = "1.0.10",
            C = t.getElementsByTagName("script"),
            S = C[C.length - 1];
        return f(), y
    }), _altmetric.bugsnag = Bugsnag.noConflict(), _altmetric.bugsnag.autoNotify = !1, _altmetric.bugsnag.releaseStage = "production", _altmetric.bugsnag.notifyReleaseStages = ["production", "staging"], _altmetric.bugsnag.apiKey = "daca05de9b5d741310b8b3308bdda3df", _altmetric_embed_init = _altmetric.embed_init, _altmetric.domready(function() {
        _altmetric.embed_init()
    });
