// parseString = Meteor.npmRequire('xml2js').parseString;
Meteor.publish('articleFullText', function(mongoId) {
    console.log('... mongo id = ' + mongoId);
    var articleFullTextLink,
        articleFullText = [],
        articleFullTextXml,
        pii,
        pmid,
        articleInfo,
        configSettings,
        assetsLink,
        resLinks,
        resXml,
        xml;
    articleInfo = articles.findOne({'_id' : mongoId});
    pmid = articleInfo.ids.pmid;
    pii = articleInfo.ids.pii;
    configSettings = journalConfig.findOne({});
    assetsLink = configSettings.api.assets;

    // get asset links
    resLinks = Meteor.http.get(assetsLink + pii);
    if(resLinks){
      resLinks = resLinks.content;
      resLinks = JSON.parse(resLinks);
      resLinks = resLinks[0];
      // console.log(resLinks);
      articleFullTextLink = resLinks.full_xml_url;
    }

    // get XML
    if(articleFullTextLink){
      resXml = Meteor.http.get(articleFullTextLink);
      if(resXml){
        // XML to JSON
        xml = resXml.content;
        // console.log(xml);
      }
    }

    if(xml){
      Meteor.call('fullTextToJson',xml);
    }

    // get Figures

    return articleFullText;
});