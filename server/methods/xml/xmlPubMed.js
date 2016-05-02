// AOP XML
// -------------
// Methods for processing PubMed citation AOP and PPUB XML for Mongo DB
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
        // console.log('article',articleProcessed);

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
                        if(keyword){
                          articleProcessed.keywords.push(keyword);
                        }

                    }else if(keywords[kw]['Param'][0]._){
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
                        var authorAffIndex = articleProcessed.affiliations.indexOf(Meteor.general.cleanString(authorAffiliations[aff]));
                        author.affiliations_numbers.push(authorAffIndex);
                    }
                }
                articleProcessed.authors.push(author);
            }
        }

        // console.log('articleProcessed',articleProcessed);

        // PUB DATES
        // -----------
        // only aheadofprint provided in AOP sample files, this is not stored in the DB
        // PPUB sample files do have dates, however they only have month/year

        // HISTORY DATES
        // -----------
        // None provided in AOP sample file. Does contain aheadofprint but we do not store this
        // console.log(articleProcessed.issue_id);
        // console.log('articleProcessed',articleProcessed);
        return articleProcessed;
    }
});