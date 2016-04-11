// PMC XML
// -------------
// Methods for processing PMC Full text XML for Mongo DB
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
        // console.log('..articleToSchema',articleJson);
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