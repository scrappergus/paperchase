sitemaps.add('/sitemap.xml', function() {
    var sitemapArray = [];
    var siteUrl = Meteor.settings.public.journal.siteUrl;
    if(sitemapJson && sitemapJson.urlset && sitemapJson.urlset.url){
        sitemapArray = sitemapJson.urlset.url;
    }

    var today = new Date();

    // Articles
    var allArticles = articles.find({ display: true }).fetch();
    if (allArticles) {
        allArticles.forEach(function(article){
            article = Meteor.impact.hideFullText(article);
            // figures, abstract, full text URLs
            var lastmod = today;
            lastmod = lastmod.toLocaleDateString().replace(/\//g,'-');
            var changefreq =  article.issue_id ? 'monthly' : 'daily';

            if (article.last_update) {
                lastmod = article.last_update.toLocaleDateString().replace(/\//g,'-');
            } else if(article.dates && article.dates.epub){
                lastmod = article.dates.epub.toLocaleDateString().replace(/\//g,'-');
            }

            // Article abstract page
            sitemapArray.push({
                page: siteUrl + '/article/' + article._id,
                lastmod: lastmod,
                changefreq: changefreq,
                priority: 1
            });

            // full text
            if (article.files && article.files.xml && article.files.xml.display){
                sitemapArray.push({
                    page: siteUrl + '/article/' + article._id + '/text',
                    lastmod: lastmod,
                    changefreq: changefreq,
                    priority: 1
                });
            }

            // figures
            if (article.files && article.files.xml && article.files.figures){
                article.files.figures.forEach(function(fig){
                    sitemapArray.push({
                        page: siteUrl + '/figure/' + article._id + '/' + fig.id,
                        lastmod: lastmod,
                        changefreq: changefreq,
                        priority: 1
                    });
                });
            }
        });
    }

    // Issues
    var allIssues = issues.find({ display: true }).fetch();
    if (allIssues) {
        allIssues.forEach(function(iss){
            var issLastmod = iss.pub_date ? iss.pub_date : today;
            if (iss.last_update) {
                issLastmod = iss.last_update;
            }

            issLastmod = issLastmod.toLocaleDateString().replace(/\//g,'-');

            var issUrl = siteUrl + '/issue/' + Meteor.issue.createIssueParam(iss.volume, iss.issue);

            sitemapArray.push({
                page: issUrl,
                lastmod: issLastmod,
                changefreq: 'monthly',
                priority: 1
            });
        });
    }

    // Advance
    sitemapArray.push({
        page: siteUrl + '/advance',
        lastmod: today.toLocaleDateString().replace(/\//g,'-'),
        changefreq: 'daily',
        priority: 1
    });

    return sitemapArray;
});
