sitemaps.add('/sitemap.xml', function() {
    if(sitemapJson && sitemapJson.urlset && sitemapJson.urlset.url)
    return sitemapJson.urlset.url;
});
