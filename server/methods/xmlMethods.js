// Shared methods for all DTD types
// -------------
Meteor.methods({
    getXml: function(url){
        // console.log('getXml',url);
        var fut = new future();
        Meteor.http.get(url,function(getXmlError, xmlRes){
            if(getXmlError){
                console.error('getXmlError',getXmlError);
                fut.throw(getXmlError);
            }else if(xmlRes){
                xml = xmlRes.content;
                fut.return(xml);
                // console.log('xml',xml);
            }
        });
        return fut.wait();
    },
    xmlDtd: function(xmlString){
        // console.log('xmlDtd',xmlString);
        // TODO: use regex for dtd
        var aopSearchPattern = '<!DOCTYPE ArticleSet PUBLIC "-\/\/NLM\/\/DTD PubMed 2.0\/\/EN" "http:\/\/www.ncbi.nlm.nih.gov:80\/entrez\/query\/static\/PubMed.dtd">';
        var pmcSearchPattern = '<!DOCTYPE pmc-articleset PUBLIC "-\/\/NLM\/\/DTD ARTICLE SET 2.0\/\/EN" "http:\/\/dtd.nlm.nih.gov\/ncbi\/pmc\/articleset\/nlm-articleset-2.0.dtd">'
        var aopRes = xmlString.search(aopSearchPattern);
        var pmcRes = xmlString.search(pmcSearchPattern);
        if(aopRes != -1){
            return 'AOP';
        }else if(pmcRes != -1){
            return 'PMC';
        }else{
            return false;
        }
    },
    processXmlString: function(xml){
        // console.log('..processXmlString');
        var fut = new future();
        Meteor.call('xmlDtd',xml, function(error,dtd){
            if(error){
                console.error('DTD',error);
            }else if(dtd && dtd === 'PMC'){
                Meteor.call('processPmcXml',xml, function(error,result){
                    if(error){
                        console.error('processPmcXml',error);
                    }else if(result){
                        fut.return(result);
                    }
                });
            }else if(dtd && dtd === 'AOP'){
                Meteor.call('processAopXml',xml, function(error,result){
                    if(error){
                        console.error('processAopXml',error);
                    }else if(result){
                        fut.return(result);
                    }
                });
            }else{
                fut.throw('Could not process XML.');
            }
        });

        return fut.wait();
    },
    parseXmltoJson: function(xml){
        // console.log('..parseXmltoJson');
        var fut = new future();
        parseString(xml, function (error, articleJson) {
            if(error){
                console.error('ERROR');
                console.error(error);
                return 'ERROR';
            }else{
                fut.return(articleJson);
            }
        });
        return fut.wait();
    }
});

// AOP XML
// -------------
Meteor.methods({
    processAopXml: function(xmlString){
        // this is XML sent to PubMed for citation before print
        var fut = new future();
        Meteor.call('parseXmltoJson',xmlString, function(error,articleJson){
            if(error){
                console.error('parseXmltoJson',error);
                fut.return(error);
            }else if(articleJson){
                articleJson = articleJson.ArticleSet.Article;
                articleJson = articleJson[0];
                Meteor.call('aopArticleToSchema', xmlString, articleJson,function(e,r){ // pass XML string (for title) AND JSON
                    if(e){
                        console.error(e);
                        fut.throw(e);
                    }else if(r){
                        fut.return(r);
                    }
                });
            }
        });
        return fut.wait();
    },
    aopArticleToSchema: function(xml,article){
        // console.log('..aopArticleToSchema');
        // XML is a string, used for title. article is JSON parsed from xml.

        // console.log('article',article);
        var articleProcessed = {};
        articleProcessed.aop = true; // need this to prevent uploading XML to S3

        // PUBLISHER
        // -----------
        if(article.Journal && article.Journal[0].PublisherName){
            articleProcessed.publisher = article.Journal[0].PublisherName[0];
        }

        // TITLE
        // -----------
        if(article.ArticleTitle){
            // use XML string instead of JSON
            // When parseing XML to JSON, cannot tell the order of text, if there are style tags (keywords have same problem)
            var articleTitle = xml.substring(xml.lastIndexOf('<ArticleTitle>')+14,xml.lastIndexOf('</ArticleTitle>'));
            if(articleTitle.length > 0){
                articleProcessed.title = articleTitle;
            }
        }

        // META
        // -----------
        if(article.Journal && article.Journal[0].Volume){
            var isVEmpty = Meteor.general.isStringEmpty(article.Journal[0].Volume[0]);
            if(!isVEmpty){
                articleProcessed.volume = parseInt(article.Journal[0].Volume[0]);
            }
        }
        if(article.Journal && article.Journal[0].Issue){
            var isIEmpty = Meteor.general.isStringEmpty(article.Journal[0].Issue[0]);
            if(!isIEmpty){
                articleProcessed.issue = Meteor.general.cleanString(article.Journal[0].Issue[0]);
            }
        }
        // check if issue has changed
        if(articleProcessed.volume && articleProcessed.issue){
            // console.log(articleProcessed.volume + ' ' + articleProcessed.issue);
            var articleVol = parseInt(articleProcessed.volume);
            var articleIss = articleProcessed.issue.toString();
            var articleIssueInfo = issues.findOne({volume : articleVol, issue : articleIss});
            // console.log('articleIssueInfo',articleIssueInfo);
            if(!articleIssueInfo){
                Meteor.call('addIssue',{volume: articleVol, issue: articleIss},function(error,issueId){
                    if(error){
                        console.error('add issue',error);
                    }else if(issueId){
                        articleProcessed.issue_id = issueId;
                    }
                });
                // articleProcessed.notifyIssueDbMissing = true;
            }else{
                articleProcessed.issue_id = articleIssueInfo._id;
            }
        }
        if(article.FirstPage){
            var isFpEmpty = Meteor.general.isStringEmpty(article.FirstPage[0]);
            if(!isFpEmpty){
                articleProcessed.page_start = parseInt(article.FirstPage[0]);
            }
        }
        if(article.LastPage){
            var isLpEmpty = Meteor.general.isStringEmpty(article.LastPage[0]);
            if(!isLpEmpty){
                articleProcessed.page_end = parseInt(article.LastPage[0]);
            }
        }

        // KEYWORDS
        // -----------
        // TODO: Better handling when keyword has style. When parseing XML to JSON, cannot tell the order of text,
        // for ex: <italic>test</italic> testing
        // will return [ { _: ' testing', '$': { Name: 'value' }, italic: [ 'test' ] } ]
        if(article.ObjectList){
            articleProcessed.keywords = [];
            var keywords = article.ObjectList[0]['Object'];
            for(var kw=0 ; kw<keywords.length ; kw++){
                if(keywords[kw].$.Type === 'keyword'){
                    // Check for styling within keywords
                    var kwNodeCount = 0;
                    for(var node in keywords[kw]['Param'][0]){
                        kwNodeCount++;
                    }
                    if(kwNodeCount > 2){
                        var keyword = '';
                        if(keywords[kw]['Param'][0]._){
                            keyword = keywords[kw]['Param'][0]._;
                        }
                        // there are style tags
                        // TODO: Better handling when keyword has style
                        for(var node in keywords[kw]['Param'][0]){
                            if(node != '_' && node != '$'){
                                keyword += '<' + node + '>' + keywords[kw]['Param'][0][node] + '</' + node + '>';
                                keyword = Meteor.fullText.fixTags(keyword);
                            }
                        }
                        articleProcessed.keywords.push(keyword);
                    }else{
                        articleProcessed.keywords.push(keywords[kw]['Param'][0]._);
                    }
                }
            }
        }

        // ABSTRACT
        // -----------
        if(article.Abstract){
            articleProcessed.abstract = Meteor.processXml.cleanAbstract(article.Abstract[0]);
        }

        // ARTICLE TYPE
        // -----------
        if(article.PublicationType){
            var typeXml = Meteor.general.cleanString(article.PublicationType[0]);
            var articleType = articleTypes.findOne({'name' : typeXml});
            if(!articleType){
                articleProcessed.notifyArticleTypeDbMissing = typeXml;
            }else{
                articleProcessed.article_type = {};
                articleProcessed.article_type.name = articleType.name;
                articleProcessed.article_type.short_name = articleType.short_name;
            }
        }

        // IDS
        // -----------
        if(article.ArticleIdList){
            articleProcessed.ids = {};
            for(var idIdx=0 ; idIdx < article.ArticleIdList[0].ArticleId.length ; idIdx++){
                var idType;
                var idValue;

                idType = article.ArticleIdList[0].ArticleId[idIdx].$.IdType;
                idValue = article.ArticleIdList[0].ArticleId[idIdx]._;

                if(idType && idValue){
                    articleProcessed.ids[idType] = idValue;
                }
            }
        }


        // ALL AFFILIATIONS
        // -----------
        // Get affiliations before authors because AOP XML does not have affiliation IDs (PMC XML does)
        if(article.AuthorList){
            var authorsList = article.AuthorList[0].Author;
            for(var authorIdx = 0 ; authorIdx < authorsList.length ; authorIdx++){
                // Author Affiliations - Get all affiliations, for all authors, so we can get ID
                if(authorsList[authorIdx].AffiliationInfo && !articleProcessed.affiliations){
                    articleProcessed.affiliations = [];
                }
                if(authorsList[authorIdx].AffiliationInfo){
                    var authorAffiliations = authorsList[authorIdx].AffiliationInfo[0].Affiliation;
                    for(var aff=0 ; aff < authorAffiliations.length ; aff++){
                        var affil = Meteor.general.cleanString(authorAffiliations[aff]);
                        // console.log(articleProcessed.affiliations.indexOf(authorAffiliations[aff]));
                        if(articleProcessed.affiliations.indexOf(affil) == -1){
                            articleProcessed.affiliations.push(affil);
                            // console.log(authorAffiliations[aff]);
                        }
                    }
                }
            }
        }

        // AUTHORS
        // -----------
        if(article.AuthorList){
            articleProcessed.authors = [];
            var authorsList = article.AuthorList[0].Author;
            for(var authorIdx = 0 ; authorIdx < authorsList.length ; authorIdx++){
                var author = {};
                author.name_first = '';
                author.name_middle = '';
                author.name_last = '';
                author.name_suffix = '';
                author.affiliations_numbers = [];
                // Author Name
                if(authorsList[authorIdx].FirstName){
                    if(typeof authorsList[authorIdx].FirstName[0] == 'object'){
                        author.name_first = Meteor.general.cleanString(authorsList[authorIdx].FirstName[0]._);
                    }else if(typeof authorsList[authorIdx].FirstName[0] == 'string'){
                        author.name_first = Meteor.general.cleanString(authorsList[authorIdx].FirstName[0]);
                    }
                }
                if(authorsList[authorIdx].MiddleName){
                    if(typeof authorsList[authorIdx].MiddleName[0] == 'object'){
                        author.name_middle = Meteor.general.cleanString(authorsList[authorIdx].MiddleName[0]._);
                    }else if(typeof authorsList[authorIdx].MiddleName[0] == 'string'){
                        author.name_middle = Meteor.general.cleanString(authorsList[authorIdx].MiddleName[0]);
                    }
                }
                if(authorsList[authorIdx].LastName){
                    if(typeof authorsList[authorIdx].LastName[0] == 'object'){
                        author.name_last = Meteor.general.cleanString(authorsList[authorIdx].LastName[0]._);
                    }else if(typeof authorsList[authorIdx].LastName[0] == 'string'){
                        author.name_last = Meteor.general.cleanString(authorsList[authorIdx].LastName[0]);
                    }
                }
                if(authorsList[authorIdx].Suffix){
                    if(typeof authorsList[authorIdx].Suffix[0] == 'object'){
                        author.name_suffix = Meteor.general.cleanString(authorsList[authorIdx].Suffix[0]._);
                    }else if(typeof authorsList[authorIdx].Suffix[0] == 'string'){
                        author.name_suffix = Meteor.general.cleanString(authorsList[authorIdx].Suffix[0]);
                    }
                }
                // Author Affiliations - Affiliation ID for author
                if(authorsList[authorIdx].AffiliationInfo){
                    var authorAffiliations = authorsList[authorIdx].AffiliationInfo[0].Affiliation;
                    for(var aff=0 ; aff < authorAffiliations.length ; aff++){
                        author.affiliations_numbers.push(articleProcessed.affiliations.indexOf(authorAffiliations[aff]));
                    }
                }
                articleProcessed.authors.push(author);
            }
        }

        // PUB DATES
        // -----------
        // only aheadofprint provided in AOP sample files, this is not stored in the DB
        // PPUB sample files do have dates, however they only have month/year

        // HISTORY DATES
        // -----------
        // None provided in AOP sample file. Does contain aheadofprint but we do not store this
        // console.log(articleProcessed.issue_id);
        return articleProcessed;
    }
});

// PMC XML
// -------------
Meteor.methods({
    processPmcXml: function(xmlString){
        // this is full text XML for PMC
        var fut = new future();
        Meteor.call('parseXmltoJson',xmlString, function(error,articleJson){
            if(error){
                console.error('parseXmltoJson',error);
            }else if(articleJson){
                articleJson = articleJson['pmc-articleset']['article'];
                Meteor.call('pmcArticleToSchema', xmlString, articleJson,function(e,r){ // pass XML string (for title) AND JSON
                    if(e){
                        console.error(e);
                        fut.throw(e);
                    }else if(r){
                        fut.return(r);
                    }
                });
            }
        });
        return fut.wait();
    },
    pmcArticleToSchema: function(xml,articleJson){
        // console.log('..articleToSchema');
        // Process JSON for meteor templating and mongo db
        // xml is a string. articleJson is parsed XML to JSON. but not in the schema we need.
        var journalMeta = articleJson[0]['front'][0]['journal-meta'][0];
        var article = articleJson[0]['front'][0]['article-meta'][0];

        var articleProcessed = {};

        // PUBLISHER
        // -----------
        if(journalMeta.publisher){
            for(var i = 0 ; i < journalMeta.publisher.length ; i++){
                if( journalMeta.publisher[i]['publisher-name']){
                    articleProcessed.publisher = journalMeta.publisher[i]['publisher-name'][0];
                }
            }
        }

        // console.log(articleProcessed);
        // TITLE
        // -----------
        var titleGroup = xml.substring(xml.lastIndexOf('<title-group>')+1,xml.lastIndexOf('</title-group>'));
        var titleTitle = titleGroup.substring(titleGroup.lastIndexOf('<article-title>')+1,titleGroup.lastIndexOf('</article-title>'));
            titleTitle = titleTitle.replace('article-title>','');
            // console.log('titleTitle',titleTitle);
        if(titleTitle){
            titleTitle = Meteor.general.cleanString(titleTitle);
            articleProcessed.title = titleTitle;
        }


        // META
        // -----------
        if(article.volume){
            articleProcessed.volume = parseInt(article.volume[0]);
        }
        if(article.issue){
            articleProcessed.issue = article.issue[0];
        }
        if(article.fpage){
            articleProcessed.page_start = parseInt(article.fpage[0]);
        }
        if(article.lpage){
            articleProcessed.page_end = parseInt(article.lpage[0]);
        }
        // KEYWORDS
        // -----------
        if(article['kwd-group']){
            articleProcessed.keywords = [];
            var keywords = article['kwd-group'][0]['kwd'];
            for(var kw=0 ; kw<keywords.length ; kw++){
                if(typeof  keywords[kw] == 'object'){
                    var kwStyled = '',
                        kwStyeType = '';
                    for(var kwKey in  keywords[kw]){
                        kwStyeType += kwKey;
                    }
                    kwStyled = '<' + kwStyeType + '>' + keywords[kw][kwStyeType] + '<' + kwStyeType + '/>';
                    articleProcessed.keywords.push(kwStyled);

                }else{
                    articleProcessed.keywords.push(keywords[kw]);
                }
            }
        }

        // ABSTRACT
        // -----------
        if(article.abstract){
            var abstract = xml.substring(xml.lastIndexOf('<abstract>')+1,xml.lastIndexOf('</abstract>'));
                abstract = abstract.replace('abstract>\n ', '');
                // abstract = abstract.replace('</p>\n','</p>');
                abstract = Meteor.processXml.cleanAbstract(abstract);
                articleProcessed.abstract = abstract;
        }

        // ARTICLE TYPE
        // -----------
        //TODO: These are nlm type, possible that publisher has its own type of articles
        //TODO: Update article type collection if this type not present
        if(article['article-categories']){
            articleProcessed.article_type = {};
            articleProcessed.article_type.name = article['article-categories'][0]['subj-group'][0]['subject'][0];
            articleProcessed.article_type.short_name =  articleJson[0]['$']['article-type'];
        }

        // IDS
        // -----------
        articleProcessed.ids = {};
        var idList = article['article-id'];
        var idListLength = idList.length;
        for(var i = 0 ; i < idListLength ; i++){
            var type = idList[i]['$']['pub-id-type'];
            var idCharacters = idList[i]['_'];
            articleProcessed.ids[type] = idCharacters;
        }

        // AUTHORS
        // -----------
        if(article['contrib-group']){
            articleProcessed.authors = [];
            var authorsList = article['contrib-group'][0].contrib;
            var authorsListLength = authorsList.length;
            for(var i = 0 ; i < authorsListLength ; i++){
                var author = {};
                if(authorsList[i].name){
                    if(authorsList[i].name[0]['given-names']){
                        author.name_first = authorsList[i].name[0]['given-names'][0];
                    }
                    if(authorsList[i].name[0].surname[0]){
                        author.name_last = authorsList[i].name[0].surname[0];
                    }
                }

                // Author affiliations
                if(authorsList[i].xref){
                    author.affiliations_numbers = [];
                    for(var authorAff=0 ; authorAff<authorsList[i].xref.length ; authorAff++){
                        if(authorsList[i].xref[authorAff].sup){
                            var affNumber = parseInt(authorsList[i].xref[authorAff].sup[0]-1);
                            author.affiliations_numbers.push(affNumber); // This is 0 based in the DB //TODO: look into possible attribute options for <xref> within <contrib>
                        }
                    }
                }
                articleProcessed.authors.push(author);
            }
        }

        // ALL AFFILIATIONS
        // -----------
        articleProcessed.affiliations = [];
        if(article['aff']){
            // console.log('------affiliations=');
            // console.log(JSON.stringify(article['aff']));
            for(var aff=0 ; aff < article.aff.length ; aff++){
                articleProcessed.affiliations.push(article.aff[aff]._);
            }
        }

        // PUB DATES
        // -----------
        articleProcessed.dates = {};
        var dates = article['pub-date'];
        var datesLength = dates.length;
        for(var i = 0 ; i < datesLength ; i++){
            var dateType =  dates[i]['$']['pub-type'];
            if(dateType != 'collection'){
                var d = '';
                if(dates[i].month && dates[i].day && dates[i].year){
                    d += dates[i].month[0] + ' ';
                    d += dates[i].day[0] + ' ';
                    d += dates[i].year[0] + ' ';
                    d += ' 00:00:00.0000';
                    var dd = new Date(d);
                    // console.log(dateType + ' = ' + dd);
                    articleProcessed.dates[dateType] = dd;
                }
            }
        }
        // console.log(articleProcessed.dates);

        // HISTORY DATES
        // -----------
        if(article.history){
            articleProcessed.history = {};
            var history = article.history[0].date;
            var historyLength = history.length;

            for(var i = 0 ; i < historyLength ; i++){
                var dateType = history[i]['$']['date-type'];
                var d = '';
                if(history[i].month && history[i].day && history[i].year){
                    d += history[i].month[0] + ' ';
                    d += history[i].day[0] + ' ';
                    d += history[i].year[0] + ' ';
                    d += ' 00:00:00.0000';
                    var dd = new Date(d);
                    articleProcessed.history[dateType] = dd;
                }
            }
        }

        // console.log('articleProcessed',articleProcessed);
        return articleProcessed;
    },
    pmcFiguresInXml: function(articleMongoId){
        // for finding all figures referenced in the full text XML
        var fut = new future();
        var articleJson,
            articleInfo,
            doc,
            dbFigures,
            xmlFigures,
            figuresResult = [];
        var articleInfo = articles.findOne({_id : articleMongoId});

        if(articleInfo && articleInfo.files && articleInfo.files.figures){
            dbFigures = articleInfo.files.figures;
        }

        if(articleInfo && articleInfo.files && articleInfo.files.xml){
            articleInfo = Meteor.article.readyData(articleInfo);
            if(articleInfo.files.xml){
                Meteor.call('getXml',articleInfo.files.xml.url, function(error,xml){
                    if(error){
                        console.error('getXmlError',error);
                        fut.throw(error);
                    }else if(xml){
                        doc = new dom().parseFromString(xml);
                        xmlFigures = xpath.select('//fig', doc);
                        xmlFigures.forEach(function(figure){
                            var fig = Meteor.fullText.convertFigure(figure,dbFigures,articleMongoId);
                            figuresResult.push(fig);
                        });
                        fut.return(figuresResult);
                    }
                });
            }
        }else{
            fut.return();
        }
        return fut.wait();
    }
});

// Methods to compare XML with DB
// -------------
var ignoreConflicts = ['_id','doc_updates','issue_id','batch', 'files', 'display'];

Meteor.methods({
    compareObjectsXmlWithDb: function(xmlValue, dbValue){
        // console.log('..compareObjectsXmlWithDb');
        // console.log(JSON.stringify(xmlValue));console.log(JSON.stringify(dbValue));
        var fut = new future();
        var conflict = '';
        var keyCount = 0;
        //TODO: add check for matching object lengths
        if(Object.keys(dbValue).length != 0){
            for(var valueKey in dbValue){
                // console.log('  ' + valueKey);
                // DB will have more keys because middle name, affiliations, etc all will be empty if they do not exist. whereas from the XML, the key will not exist
                // make sure XML has this key too
                if(xmlValue[valueKey]){
                    var c = Meteor.call('compareValuesXmlWithDb', valueKey, xmlValue[valueKey], dbValue[valueKey]);
                    if(c){
                        // append to other conflicts in this object
                        conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: ' + c.conflict + ' ';
                    }
                }else if(dbValue[valueKey] != '' && Object.keys(dbValue[valueKey]).length != 0){
                    conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: Missing in XML. In database: ';
                    if(valueKey == 'affiliations_numbers'){
                        for(var aff in dbValue[valueKey]){
                            conflict += parseInt(dbValue[valueKey][aff] + 1) + ' ';// in database, the affiliation numbers are 0 based. Make this easier for the user to get
                        }
                    }else{
                        conflict += JSON.stringify(dbValue[valueKey]) + ' ';
                    }

                }
                keyCount++;
                // console.log(keyCount);
                if(keyCount == Object.keys(dbValue).length){
                    // console.log('CONFLICT = ');console.log(conflict);
                    fut.return(conflict);
                }
            }
        }else{
            // Object is empty in DB.
            for(var valueKey in xmlValue){
                conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: Missing in database. In XML.';
                keyCount++;
                // console.log(keyCount);
                if(keyCount == Object.keys(xmlValue).length){
                    // console.log('CONFLICT = ');console.log(conflict);
                    fut.return(conflict);
                }
            }
        }

        return fut.wait();
    },
    compareValuesXmlWithDb: function(key, xmlValue, dbValue){
        // console.log('..compareValuesXmlWithDb');
        // console.log('  ' + key + ' : ' + xmlValue + ' =? ' + dbValue);
        var conflict = {};
            conflict.what = key,
            conflict.conflict = ''; //make empty so that later when looping through object the first iteration is not undefined.
        var arraysConflict = false;
        if(typeof xmlValue == 'string' || typeof xmlValue == 'boolean' || typeof xmlValue == 'number' || typeof xmlValue.getMonth === 'function'){ //treat dates as strings for comparisson
            if(xmlValue == dbValue){
            }else{
                // keep type comparisson. affiliation numbers are checked here and are 0 based, which would be false when checking.
                conflict.conflict = '<div class="clearfix"></div><b>XML != Database</b><div class="clearfix"></div>' + xmlValue + '<div class="clearfix"></div>!=<div class="clearfix"></div>' + dbValue;
            }
        }else if(typeof xmlValue == 'object' && !Array.isArray(xmlValue)){
            Meteor.call('compareObjectsXmlWithDb', xmlValue, dbValue, function(error,result){
                if(result){
                    conflict.conflict = result;
                }
            });
        }else if(typeof xmlValue == 'object' && Array.isArray(xmlValue)){
            // Make sure it is not an array of objects. arraysDiffer cannot handle objects.
            // if an array of objects (for ex, authors), then the order of objects in the array is important
            var idxIs = '';
            if(key === 'authors'){
                idxIs = 'Author ';
            }
            for(var arrIdx=0 ; arrIdx<xmlValue.length ; arrIdx++){
                if(typeof xmlValue[arrIdx] == 'object'){
                    Meteor.call('compareObjectsXmlWithDb', xmlValue[arrIdx], dbValue[arrIdx],function(err,res){
                        if(err){
                            console.error(err);
                        }
                        if(res){
                            conflict.conflict += '<div class="clearfix"></div><b>' + idxIs +  '#' + parseInt(arrIdx+1) + '</b>' + res;
                        }
                    });
                }else{
                    Meteor.call('compareValuesXmlWithDb', '', xmlValue[arrIdx], dbValue[arrIdx],function(e,r){
                        if(r){
                            conflict.conflict += r.conflict;
                        }
                    });
                }
            }
        }else{
            //TODO add checks for missing
        }

        if(conflict.conflict){
            return conflict;
        }else{
            return false; // they match, no conflicts.
        }
    },
    compareProcessedXmlWithDb: function(xmlArticle, dbArticle){
        // console.log('..compareProcessedXmlWithDb');
        // Take the XML data and compare with the data from the DB
        // this is for the article form and after XML is uploaded
        // Note: There are things in dbArticle that are not in the XML. For example, if an article is advance or feature
        // Note: Merged data will be from the XML if there is a conflict

        var merged = {};
            merged['conflicts'] = [];


        // since DB has more info than XML loop through its data to compare. Later double check nothing missing from merge by looping through XML data
        for(var keyDb in dbArticle){
            if(dbArticle[keyDb] != '' && xmlArticle[keyDb]){
                //XML will not have empty value, but DB might because of removing an article from something (ie, removing from a section)
                merged[keyDb] = xmlArticle[keyDb]; // both versions have data for key. if there are conflicts, then form will default to XML version
                // now check if there are conflicts between versions
                Meteor.call('compareValuesXmlWithDb', keyDb, xmlArticle[keyDb], dbArticle[keyDb], function(error,conflict){
                    if(conflict){
                        merged['conflicts'].push(conflict);
                    }
                });
            }else if(dbArticle[keyDb] == '' && xmlArticle[keyDb]){
                merged['conflicts'].push({
                    'what' : keyDb,
                    'conflict' : 'In XML, NOT in database'
                });
            }else if(dbArticle[keyDb] != '' && !xmlArticle[keyDb] && ignoreConflicts.indexOf(keyDb) == -1){
                if(typeof dbArticle[keyDb] === 'object' && Object.keys(dbArticle[keyDb]).length === 0){
                    // ignore empty objects in DB if there is nothing in the XML. There is no conflict
                }else{
                    // If in DB but not in XML
                    // skip mongo ID, issue mongo ID, db doc_updates etc for comparing
                    // stringify database info in case type is object
                    merged[keyDb] = dbArticle[keyDb];
                    merged['conflicts'].push({
                        'what' : keyDb,
                        'conflict' : 'In database, NOT in XML<div class="clearfix"></div>' + JSON.stringify(dbArticle[keyDb])
                    });
                }
            }else if(keyDb == '_id'){
                merged[keyDb] = dbArticle[keyDb];
            }else if(keyDb == 'issue_id'){
                if(xmlArticle.issue_id && xmlArticle.issue_id != dbArticle[keyDb]){
                    merged['conflicts'].push({
                        'what' : 'Issue Changed',
                        'conflict' : '<div class="clearfix"></div><b>XML != Database</b><div class="clearfix"></div>' + xmlArticle.issue_id + '<div class="clearfix"></div>!=<div class="clearfix"></div>' + dbArticle[keyDb]
                    });
                }
                merged[keyDb] = dbArticle[keyDb]; // add DB issue_id value to merged,
            }else{
                // console.log('..else');
                // the database value is empty and the XML does not have this
            }
        }
        // console.log('merged',merged);
        // Now make sure there isn't anything missing from XML
        for(var keyXml in xmlArticle){
            if(!merged[keyXml]){
                merged[keyXml] = xmlArticle[keyXml];
                if(keyXml != 'issue_id'){
                    merged['conflicts'].push({
                        'what' : keyXml,
                        'conflict' : 'In XML, NOT in database: ' + xmlArticle[keyXml]
                    });
                }
            }
        }

        return merged;
    },
    arraysDiffer: function(xmlKw, dbKw){
        // console.log('..arraysDiffer');
        // console.log(xmlKw);conflict.log(dbKw);
        // returns true if they DO NOT match
        // for just comparing KW between upoaded XML and DB info
        // create temporary for comparing, because we want the admins to be able to control order of kw
        var tempXmlKw,
            tempDbKw;
        tempXmlKw = xmlKw.sort();
        tempDbKw = dbKw.sort();
        // not same number of keywords
        if(tempXmlKw.length != tempDbKw.length){
            return true;
        }else{
            // same number of kw, but check if not matching
            for (var kw = 0; kw < tempXmlKw.length; kw++) {
                if (tempXmlKw[kw] !== tempDbKw[kw]){
                    return true;
                }
            }
        }
    }
});