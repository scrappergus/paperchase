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
            Meteor.xmlPmc.publisher(journalMeta, function(publisher){
                if(publisher){
                    articleProcessed.publisher = publisher;
                }
            });
        }

        // TITLE
        // -----------
        Meteor.xmlPmc.title(xml,function(title){
            if(title){
                articleProcessed.title = title;
            }
        });

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
            Meteor.xmlPmc.keywords(article['kwd-group'][0]['kwd'], function(keywords){
                if(keywords && keywords.length > 0){
                    articleProcessed.keywords = keywords;
                }
            });
        }

        // ABSTRACT
        // -----------
        if(article.abstract){
            Meteor.xmlPmc.abstract(xml, function(abstract){
                if(abstract){
                    articleProcessed.abstract = abstract;
                }
            });
        }

        // ARTICLE TYPE
        // -----------
        //TODO: These are nlm type, possible that publisher has its own type of articles
        //TODO: Update article type collection if this type not present
        if(article['article-categories']){
            Meteor.xmlPmc.articleType(articleJson, function(articleType){
                if(articleType){
                    articleProcessed.article_type = articleType;
                }
            });
        }

        // IDS
        // -----------
        Meteor.xmlPmc.ids(article['article-id'], function(ids){
            if(ids){
                articleProcessed.ids = ids;
            }
        });

        // AUTHORS
        // -----------
        if(article['contrib-group']){
            var authorsList = article['contrib-group'][0].contrib;
            Meteor.xmlPmc.authors(authorsList,function(authors){
                if(authors && authors.length > 0){
                    articleProcessed.authors = authors;
                }
            });
        }

        // CORRESPONDING AUTHOR
        // -----------
        articleProcessed.correspondence = []; //can have multiple corresp elements, for ex: pmid 26678252
        if(article['author-notes'] && article['author-notes'][0].corresp){
            Meteor.xmlPmc.authorsCorresponding(article['author-notes'][0].corresp,function(correspondence){
                if(correspondence && correspondence.length > 0){
                    articleProcessed.correspondence = correspondence;
                }
            });
        }

        // AUTHOR NOTES
        // -----------

        // ALL AFFILIATIONS
        // -----------
        articleProcessed.affiliations = [];
        if(article['aff']){
            Meteor.xmlPmc.authorsAffiliations(article.aff, function(affiliations){
                if(affiliations && affiliations.length > 0){
                    articleProcessed.affiliations = affiliations;
                }
            });
        }

        // PUB DATES
        // -----------
        if(article['pub-date']){
            Meteor.xmlPmc.dates(article['pub-date'], function(dates){
                if(dates){
                    articleProcessed.dates = dates;
                }
            });
        }

        // HISTORY DATES
        // -----------
        if(article.history){
            Meteor.xmlPmc.history(article.history[0].date, function(history){
                if(history){
                    articleProcessed.history = history;
                }
            });
        }

        // SUPPLEMENTAL
        // -----------
        articleProcessed.files = {};
        Meteor.xmlPmc.figures(xml,function(figures){
            if(figures){
                articleProcessed.files.figures = figures;
            }
        });

        // FIGURES
        // -----------
        Meteor.xmlPmc.supplementalMaterials(xml,function(supps){
            if(supps){
                articleProcessed.files.supplemental = supps;
            }
        });

        // console.log('articleProcessed',articleProcessed.supplemental,articleProcessed.figures);
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

// below are used by processPmcXml()
// except supplementaryMaterials() which is used after the XML is uploaded, because this info won't be shown in the article form
Meteor.xmlPmc = {
    abstract: function(xml,cb){
        // uses XML string to get abstract
        var abstract;
        abstract = xml.substring(xml.lastIndexOf('<abstract>')+1,xml.lastIndexOf('</abstract>'));
        abstract = abstract.replace('abstract>\n ', '');
        abstract = Meteor.processXml.cleanAbstract(abstract);
        cb(abstract);
    },
    articleType: function(articleJson,cb){
        // keywords is JSON from XML to get keywords. Need to pass entire JSON and not part because the short name is an attribute on article element
        var article_type = {};
        var article = articleJson[0]['front'][0]['article-meta'][0];
        article_type.name = article['article-categories'][0]['subj-group'][0]['subject'][0];
        article_type.short_name =  articleJson[0]['$']['article-type'];
        cb(article_type);
    },
    authors: function(authorsList,cb){
        var authors = [];
        for(var i = 0 ; i < authorsList.length ; i++){
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
            authors.push(author);
        }
        cb(authors);
    },
    authorsAffiliations: function(affiliations,cb){
        var affiliationsResult = [];
        for(var aff=0 ; aff < affiliations.length ; aff++){
            if(affiliations[aff]._){
                affiliationsResult.push(affiliations[aff]._.trim());
            }else{
                console.log(affiliations[aff]);
            }

        }
        cb(affiliationsResult);
    },
    authorsCorresponding: function(corresp,cb){
        // corresp is JSON from XML to get all correspondence elements
        var allCorrespondence = [];
        for(var i=0 ; i < corresp.length ; i++){
            var correspondence = {};
            for(var k in corresp[i]){
                if(k != 'email' && typeof corresp[i][k] == 'string' && corresp[i][k] != '; '){
                    if(!correspondence.text){
                        correspondence.text = '';
                    }
                    correspondence.text += corresp[i][k];
                }else if(k != 'email' && k != '$' && typeof corresp[i][k] == 'object'){
                    if(!correspondence.text){
                        correspondence.text = '';
                    }
                    correspondence.text += Meteor.xmlParse.traverseJson(corresp[i][k]);
                }else if(k == 'email'){
                    // console.log(corresp[i][k][0]);
                    if(corresp[i][k][0]._){
                        correspondence.email = corresp[i][k][0]._; //for when there are attributes in the email tag
                    }else{
                        correspondence.email = corresp[i][k][0];
                    }

                }
            }
            if(correspondence.text){
                // console.log('correspondence 1-' + correspondence.text + '-');
                // remove all line breaks and extra spaces
                correspondence.text = correspondence.text.replace(/(\r\n|\n|\r)/gm,'');
                correspondence.text = correspondence.text.replace(/  +/g, ' ');
                // remove all the text we do not want to use for templating
                correspondence.text = correspondence.text.replace('Correspondence:','');
                correspondence.text = correspondence.text.replace('Correspondence :','');
                correspondence.text = correspondence.text.replace('Correspondence to ','');
                correspondence.text = correspondence.text.replace('at,','');

                // Trim and Replace
                while(correspondence.text.slice(-1) === ' ' || correspondence.text.charAt(0) === ',' || correspondence.text.charAt(0) === ':' ){
                    correspondence.text = correspondence.text.trim();
                    if( correspondence.text.charAt(0) === ',' || correspondence.text.charAt(0) === ':'){
                        correspondence.text = correspondence.text.slice(1, correspondence.text.length);
                    }
                }
                while(correspondence.text.charAt(0) === ' ' || correspondence.text.slice(-1) === ';' || correspondence.text.slice(-1) === ','){
                    correspondence.text = correspondence.text.trim();
                    if(correspondence.text.slice(-1) === ';' || correspondence.text.slice(-1) === ','){
                        correspondence.text = correspondence.text.slice(0, -1);
                    }
                }

                if(correspondence.text == ''){
                    delete correspondence.text; //after all the replacing, check if there is actually text
                }
            }

            allCorrespondence.push(correspondence);
        }
        cb(allCorrespondence);
    },
    dates: function(dates,cb){
        var datesResult = {};
        for(var i = 0 ; i < dates.length ; i++){
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
                   datesResult[dateType] = dd;
                }
            }
        }
        cb(datesResult)
    },
    figure: function(node,cb){
        var figObj = {};

        Meteor.xmlPmc.getAttributeId(node, function(figId){
            if(figId){
                figObj.id = figId;
            }
        });

        if(node.childNodes){

            for(var figChild=0 ; figChild < node.childNodes.length ; figChild++){
                var nod = node.childNodes[figChild];
                // label
                    if(nod.localName == 'label'){
                        figObj.label =Meteor.fullText.traverseNode(nod).replace(/^\s+|\s+$/g, '');
                    }
                //------------------
                // title and caption
                //------------------
                if(nod.childNodes){
                    for(var c = 0 ; c < nod.childNodes.length ; c++){
                        var n = nod.childNodes[c];
                        // console.log(n.localName);
                        // figure title
                        // ------------
                        if(n.localName == 'title'){
                            figObj.title =  Meteor.fullText.traverseNode(n).replace(/^\s+|\s+$/g, '');
                        }
                        // figure caption
                        // ------------
                        if(n.localName == 'p'){
                            figObj.caption = Meteor.fullText.convertContent(n);
                        }
                    }
                }
            }
        }

        cb(figObj);
    },
    figures: function(xml,cb){
        var figuresResult = [];
        doc = new dom().parseFromString(xml);
        xmlFigures = xpath.select('//fig', doc);
        xmlFigures.forEach(function(f){
            Meteor.xmlPmc.figure(f,function(fig){
                if(fig){
                    figuresResult.push(fig);
                }
            })
        });
        cb(figuresResult);
    },
    getAttributeId: function(node,cb){
        for(var attr = 0 ; attr < node.attributes.length ; attr++){
            if(node.attributes[attr].localName === 'id'){
                cb(node.attributes[attr].nodeValue);
            }
        }
    },
    history: function(history,cb){
        var historyResult = {};
        for(var i = 0 ; i < history.length ; i++){
            var dateType = history[i]['$']['date-type'];
            var d = '';
            if(history[i].month && history[i].day && history[i].year){
                d += history[i].month[0] + ' ';
                d += history[i].day[0] + ' ';
                d += history[i].year[0] + ' ';
                d += ' 00:00:00.0000';
                var dd = new Date(d);
                historyResult[dateType] = dd;
            }
        }
        cb(historyResult);
    },
    ids: function(idList,cb){
        // idList is JSON from XML to get IDs
        var ids = {};
        for(var i = 0 ; i < idList.length ; i++){
            var type = idList[i]['$']['pub-id-type'];
            var idCharacters = idList[i]['_'];

            ids[type] = idCharacters;
        }
        cb(ids);
    },
    keywords: function(keywords,cb){
        // keywords is JSON from XML to get keywords
        var result = [];
        for(var kw=0 ; kw<keywords.length ; kw++){
            if(typeof  keywords[kw] == 'object'){
                var kwStyled = '',
                    kwStyeType = '';
                for(var kwKey in  keywords[kw]){
                    kwStyeType += kwKey;
                }
                kwStyled = '<' + kwStyeType + '>' + keywords[kw][kwStyeType] + '<' + kwStyeType + '/>';
                result.push(kwStyled);

            }else{
                result.push(keywords[kw]);
            }
        }
        cb(result);
    },
    publisher: function(journalMeta,cb){
        // journalMeta is JSON from XML to get publisher name
        var publisher;
        for(var i = 0 ; i < journalMeta.publisher.length ; i++){
            if( journalMeta.publisher[i]['publisher-name']){
                publisher = journalMeta.publisher[i]['publisher-name'][0];
            }
        }
        cb(publisher);
    },
    supplemental: function(node,cb){
        var supp = {};
        if(node.attributes){
            Meteor.xmlPmc.getAttributeId(node,function(id){
                if(id){
                    supp.id = id;
                }
            });
        }

        // get the label, title, caption
        //------------------
        if(node.childNodes){
            for(var child=0 ; child < node.childNodes.length ; child++){
                var nod = node.childNodes[child];

                if(nod.childNodes){
                    for(var c = 0 ; c < nod.childNodes.length ; c++){
                        var n = nod.childNodes[c];
                        // label
                        // ------------
                        if(nod.localName == 'label'){
                            supp.label =Meteor.fullText.traverseNode(nod).replace(/^\s+|\s+$/g, '');
                        }
                        // title
                        // ------------
                        if(n.localName == 'title'){
                            supp.title =  Meteor.fullText.traverseNode(n).replace(/^\s+|\s+$/g, '');
                        }
                        // caption
                        // ------------
                        if(n.localName == 'p'){
                            supp.caption = Meteor.fullText.convertContent(n);
                        }
                    }
                }
            }
        }
        cb(supp);
    },
    supplementalMaterials: function(xml,cb){
        var suppMaterials = [];
        doc = new dom().parseFromString(xml);
        supps = xpath.select('//supplementary-material', doc);
        supps.forEach(function(s){
            Meteor.xmlPmc.supplemental(s,function(result){
                if(result){
                    suppMaterials.push(result);
                }
            });
        });
        cb(suppMaterials);
    },
    title: function(xml,cb){
        // title is from XML string
        var titleTitle;

        var titleGroup = xml.substring(xml.lastIndexOf('<title-group>')+1,xml.lastIndexOf('</title-group>'));

        titleTitle = titleGroup.substring(titleGroup.lastIndexOf('<article-title>')+1,titleGroup.lastIndexOf('</article-title>'));
        titleTitle = titleTitle.replace('article-title>','');
        if(titleTitle){
            titleTitle = Meteor.general.cleanString(titleTitle);
        }

        cb(titleTitle);
    }
}
