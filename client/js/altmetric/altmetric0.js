! function(e, t, n) {
    var d = "createElement",
        c = "getElementsByTagName",
        m = "setAttribute",
        n = document.getElementById(e);
    return n && n.parentNode && n.parentNode.removeChild(n), n = document[d + "NS"] && document.documentElement.namespaceURI, n = n ? document[d + "NS"](n, "script") : document[d]("script"), n[m]("id", e), n[m]("src", t), (document[c]("head")[0] || document[c]("body")[0]).appendChild(n), n = new Image, void n[m]("src", "https://d1uo4w7k31k5mn.cloudfront.net/donut/0.png")
}("altmetric-embed-js", "altmetric.js");
