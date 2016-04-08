// Article vs Articles will tell whether the function is for multiple or 1 article
Meteor.methods({
    batchUpdate:function(){
        // console.log('..batchUpdate');
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find().fetch();
        for(var a=0 ; a < articlesList.length ; a++){
            var article = articlesList[a];
            if(article.ids.pii){
                // console.log(article.ids.pii);
                var params = {};
                    params.id_type = 'pii',
                    params.id = article.ids.pii,
                    params.journal = journalShortName,
                    params.batch = true;
                Meteor.call('legacyArticleIntake',params);
            }
        }
    },
    legacyArticleIntake: function(articleParams){
        // console.log('...legacyArticleIntake');
        // console.log(articleParams);
        var idType = articleParams.id_type,
            idValue = articleParams.id,
            journal = articleParams.journal,
            advance = articleParams.advance,
            batch = articleParams.batch;
        var article,
            articleMongoId,
            paperchaseQueryParams,
            legacyPlatform,
            legacyPlatformApi,
            articleJson,
            processedArticleJson;
        // console.log('...legacyIntake: ' + idType + ' = ' + idValue);

        legacyPlatform = journalConfig.findOne();
        if(legacyPlatform){
            legacyPlatform = legacyPlatform['legacy_platform'];
            legacyPlatformApi = legacyPlatform['mini_api'];
            // Check if article exists by query for ID. Allow multiple types of ID (PMID, PII, etc)
            paperchaseQueryParams = '{"' + 'ids.' + idType + '" : "' + idValue + '"}';
            paperchaseQueryParams = JSON.parse(paperchaseQueryParams);
            article = articles.findOne(paperchaseQueryParams);

            // Get the article JSON from the legacy platform
            if(legacyPlatform['short_name'] === 'ojs'){
                articleJson = Meteor.call('ojsGetArticlesJson', idType, idValue, journal, legacyPlatformApi);
                articleJson = JSON.parse(articleJson);
            }

            // Process article info for Paperchase DB
            if(articleJson){
                articleJson = articleJson['articles'][0];
                processedArticleJson = Meteor.call('ojsProcessArticleJson', articleJson);
                if(advance){
                    processedArticleJson.advance = true;
                }
                if(article){
                    articleMongoId =  article['_id'];
                    if(article.section_id == 0){
                        processedArticleJson.section_id = 0; // Keep in Recent Research Papers
                    }
                    Meteor.call('updateArticle', articleMongoId, processedArticleJson, batch, function(error,result){
                        if(result){
                            Meteor.call('sorterAddItem','advance',articleMongoId);
                        }
                    });
                }else{
                    // console.log('    Add = ' + processedArticleJson['title']);
                    processedArticleJson['doc_updates'] = {} ;
                    processedArticleJson['doc_updates']['created_by'] = 'OJS Intake';
                    if(processedArticleJson.article_type.type == 'Research Papers'){
                        processedArticleJson.section_id = 0; // Put new Research Paper into Recent Research Papers
                    }
                    articleMongoId = Meteor.call('addArticle',processedArticleJson, function(error,result){
                        if(result){
                            Meteor.call('sorterAddItem','advance',articleMongoId);
                        }
                    });
                }
            }

            if(articleMongoId){
                return true; // DO we need a response to Legacy platform?
            }
            else {
                throw new Meteor.Error("legacy-intake-failure",
                    "Article ("+idType+": "+ idValue +") was not added to Paperchase.")
            }

        }
        else {
            return false;
        }
    }
});


// OJS
Meteor.methods({
    // ojsBatchUpdate: function(articles){ //TODO. FIX STACK ERROR. FOR click #ojs-batch-update
    //  console.log('..ojsBatchUpdateAll');
    //  var journalInfo = journalConfig.findOne();
    //  var journalShortName = journalInfo.journal.short_name;
    //  var articlesList = articles.find().fetch();
    //  for(var a=0 ; a < articlesList.length ; a++){
    //      var article = articlesList[a];
    //      if(article.ids.pii){
    //          console.log(article.ids.pii);
    //          var params = {};
    //              params.id_type = 'pii',
    //              params.id = article.ids.pii,
    //              params.journal = journalShortName;
    //          Meteor.call('legacyArticleIntake',params);
    //      }
    //  }
    //  return true;
    // },
    ojsGetArticlesJson: function(idType, idValue, journal, requestUrl){
        // JSON response can contain multiple articles
        if(requestUrl){
            // console.log('...ojsGetJson');
            // TODO: Add journal param?
            // requestUrl += '?type=' + idType + '&id=' + idValue + '&journal=' + journal;
            requestUrl += '?' + idType + '=' + idValue;
            // console.log(requestUrl);
            var res;
            res = Meteor.http.get(requestUrl);
            if(res){
                // console.log(res.content);
                return res.content;
            }
        }
    },
    ojsProcessArticleJson: function(article){
        // console.log('...ojsProcessArticleJson');
        // console.log(article);
        var articleUpdate = {},
            pagePieces,
            authors,
            issueId;

        var abs,
            abstract,
            datesAndKw;

        if(article.title){
            articleUpdate.title = article.title;
        }

        if(article.advance){
            articleUpdate.advance = article.advance;
        }

        if(article.volume){
            articleUpdate.volume = parseInt(article.volume);
        }

        if(article.issue && article.issue !=0 ){
            articleUpdate.issue = parseInt(article.issue);
        }

        if(article.pages && article.pages != null){
            pagePieces = article.pages.split('-');
            articleUpdate.page_start = pagePieces[0];
            if(pagePieces.length > 1){
                articleUpdate.page_end = pagePieces[1];
            }
        }

        // Abstract and Dates and Keywords
        // -------------------
        if(article.abstract){
            // HTML is pasted as the abstract and includes author information. We just want the abstract for the intake.

            // Abstract
            abs = article.abstract.indexOf('<p class=\"BodyText\">');
            abs = parseInt(abs + 20);
            abstract = article.abstract.substring(abs, article.abstract.length);
            articleUpdate.abstract = '<p>' + abstract;

            // Dates and Keywords
            datesAndKw = article.abstract.match(/<span class=\"CorespondanceBold\">(.*?)<\/p>/g); //will return 2 items - kw and dates list. need to then separate dates.
            if(datesAndKw){
                for(var dd=0; dd < datesAndKw.length ; dd++){
                    // get type of date, or if kw list
                    var dateKwType = datesAndKw[dd].match(/<span class=\"CorespondanceBold\">(.*?)<\/span>/g);
                    dateKwType = dateKwType[0].replace('<span class=\"CorespondanceBold\">','').replace('<\/span>','').replace(/:/g,'').replace(/;/,'');
                    // console.log(dateKwType);
                    if(dateKwType == 'Keywords'){
                        var kwList = datesAndKw[dd].match(/<\/span>(.*?)<\/p>/g);
                        kwList = kwList[0].replace('<\/span>: ','').replace('<\/p>','').replace(/^\s+|\s+$/g, '');
                        kwList = kwList.split(', '); // leave space when splitting to trim whitespace
                        articleUpdate.keywords = kwList
                    }else{
                        // separate list of dates
                        var dateString = datesAndKw[dd];
                        dateString = dateString.replace(/&nbsp;/g,'');
                        var dateList = dateString.match(/<span class=\"CorespondanceBold\">(.*?)[0-9]{4}/g);
                        // console.log(dateList);
                        if(dateList){
                            articleUpdate.dates = {};
                            articleUpdate.history = {};
                            for(var date=0 ; date<dateList.length ; date++){
                                var dateType = dateList[date].match(/<span class=\"CorespondanceBold\">(.*?)<\/span>/g);
                                dateType = dateType[0];
                                dateType = dateType.replace('<span class=\"CorespondanceBold\">','').replace('<\/span>','').replace(':','');
                                // console.log(dateType);
                                var dateDate = dateList[date].match(/<\/span>(.*?)[0-9]{4}/g);
                                dateDate = dateDate[0].replace('<\/span>','').replace(/^\s+|\s+$/g, '');
                                dateDate = dateDate + ' 00:00:00 EST'; // time of day is used to determine if date should have a day. For ex, type collection usually does not have a day.
                                dateDate = new Date(dateDate);
                                // console.log(dateDate);
                                if(dateType == 'Received'){
                                    articleUpdate.history.received = dateDate;
                                }else if(dateType == 'Accepted'){
                                    articleUpdate.history.accepted = dateDate;
                                }else if(dateType == 'Published'){
                                    articleUpdate.dates.epub = dateDate;
                                }
                            }
                        }
                    }
                }
            }
        }

        // TODO: Add NLM type. Query article types collection.
        if(article.article_type){
            articleUpdate.article_type = {};
            articleUpdate.article_type.type  = article.article_type;
            articleUpdate.article_type.short_name = article.shortname.toLowerCase();
        }

        if(article.section_id){
            articleUpdate.section_id = parseInt(article.section_id);
        }

        // TODO: Add other ID types. (PMC, PMID, etc)
        if(article.pii){
            articleUpdate.ids = {};
            articleUpdate.ids.pii = article.pii;
        }

        if(article.authors){
            articleUpdate.authors = [];
            authors = article.authors;
            for(var a = 0 ; a < authors.length ; a++){
                var authorObj = authors[a];
                authorObj.ids = {}; // this will also get added if we are inserting a new author to the authors collection. that is good though. we will add Orcid etc in the future to the author doc.

                // TODO: Add in author affiliation number
                // authorObj.affiliations_numbers = [];

                var authorMongo;
                var authorDoc = Meteor.call('findAuthorByName',authors[a].name_first, authors[a].name_last);
                if(!authorDoc){
                    // Add author to authors collection
                    authorMongo = Meteor.call('addAuthor',authorObj);
                }else{
                    authorMongo = authorDoc._id;
                }
                authorObj.ids.mongo_id = authorMongo;

                // Add the author with Mongo ID to the article update object
                articleUpdate.authors.push(authors[a]);
            }
        }

        // Links
        // -------------------
        articleUpdate.legacy_files = {};
        if(article.abstract){
            articleUpdate.legacy_files.abstract_exists = true;
        }
        if(article.pdf_galley_id){
            articleUpdate.legacy_files.pdf_galley_id = article.pdf_galley_id;
        }
        if(article.has_supps){
            articleUpdate.legacy_files.has_supps = true;
        }
        if(article.html_galley_id){
            articleUpdate.legacy_files.html_galley_id = article.html_galley_id;
        }

        // TODO: Affiliations
        // articleUpdate.affiliations = [];

        // TODO: Pub Status. Query PubMed.

        return articleUpdate;
    },
    ojsGetAdvanceArticles: function(){
        var fut = new future();
        var requestURL = 'http://impactjournals.com//ojs-api/?v=5&i=0';
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            fut['return'](res.data.articles);
        }else{
            throw new Meteor.Error(500, 'ojsAdvanceArticles' , error);
        }
        return fut.wait();
    }
});

