// Article vs Articles will tell whether the function is for multiple or 1 article
Meteor.methods({
    batchUpdate:function(){
        // console.log('..batchUpdate');
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find().fetch();

        var notUpdated = 0,
            updated = 0;

        async.each(articlesList, function (article, cb) {
            if(article.ids.pii){

                var params = {};
                    params.id_type = 'pii',
                    params.id = article.ids.pii,
                    params.journal = journalShortName,
                    params.batch = true;

                Meteor.call('legacyArticleIntake', params, function(error,result){
                    if(error){
                        console.error('legacyArticleIntake',error);
                        notUpdated++;
                    }else if(result){
                        updated++;
                        cb();
                    }
                });
            }

        }, function (err) {
            if (err) { throw err; }
            fut.return(true);
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    batchUpdateWithoutDates: function(){
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var query = { $or: [ { 'dates.epub': {$exists: false} }, { 'history.accepted': {$exists: false}}, { 'history.received': {$exists: false}} ] }
        var articlesList = articles.find(query).fetch();

        var notUpdated = 0,
            updated = 0;

        async.each(articlesList, function (article, cb) {
            // console.log(articlesList.indexOf(article), article._id);
            if(article.ids.pii){

                var params = {};
                    params.id_type = 'pii',
                    params.id = article.ids.pii,
                    params.journal = journalShortName,
                    params.batch = true;

                Meteor.call('legacyArticleIntake',params, function(error,result){
                    if(error){
                        console.error('legacyArticleIntake',error);
                        notUpdated++;
                    }else if(result){
                        updated++;
                        cb();
                    }
                });
            }

        }, function (err) {
            if (err) { throw err; }
            fut.return();
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    legacyArticleIntake: function(articleParams){
        // console.log('...legacyArticleIntake');
        // console.log(articleParams);
        // only using for batch update now
        var fut = new future();
        var idType = articleParams.id_type,
            idValue = articleParams.id,
            journal = articleParams.journal,
            advance = articleParams.advance,
            ojsUser = articleParams['ojs-user'],
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
            legacyPlatform = legacyPlatform.legacy_platform;
            legacyPlatformApi = legacyPlatform.mini_api;

            var ids = idValue.split(',').map(function(val) {return val.trim();});

            ids.forEach(function(id) {

                // Check if article exists by query for ID. Allow multiple types of ID (PMID, PII, etc)
                paperchaseQueryParams = '{"' + 'ids.' + idType + '" : "'+id+'"}';
                paperchaseQueryParams = JSON.parse(paperchaseQueryParams);
                article = articles.findOne(paperchaseQueryParams);

                // Get the article JSON from the legacy platform
                if(legacyPlatform.short_name === 'ojs'){
                    Meteor.call('ojsGetArticlesJson', idType, id, journal, legacyPlatformApi, function(error,articleJson){
                        if(articleJson){
                            articleJson = JSON.parse(articleJson);
                            articleJson = articleJson.articles[0];
                            // Process article info for Paperchase DB
                            Meteor.call('ojsProcessArticleJson', articleJson, function(error,processedArticleJson){
                                if(processedArticleJson){
                                    if(advance){
                                        processedArticleJson.advance = true;
                                    }
                                    if(ojsUser){
                                        processedArticleJson.ojsUser = ojsUser;
                                    }
                                    if(article){
                                        articleMongoId = article._id;
                                        if(article.section_id === 0){
                                            processedArticleJson.section_id = 0; // Keep in Recent Research Papers
                                        }
                                        Meteor.call('updateArticle', articleMongoId, processedArticleJson, batch, function(error,result){
                                            if (result && articleParams.paperchase_user && Roles.userIsInRole(articleParams.paperchase_user, ['super-admin', 'advance'])) {
                                    			Meteor.call('sorterAddItem', 'advance', articleMongoId, function(error, sorterUpdated){
                                    				if(error){
                                    					console.error(error);
                                    				}else if(sorterUpdated){
                                                        fut.return(true);
                                    				}
                                    			});
                                            } else if (result) {
                                                fut.return(true);
                                            }
                                        });

                                    }else{
                                        processedArticleJson.doc_updates = {} ;
                                        processedArticleJson.doc_updates.created_by = 'OJS Intake';
                                        if(processedArticleJson.article_type && processedArticleJson.article_type.type == 'Research Papers'){
                                            processedArticleJson.section_id = 0; // Put new Research Paper into Recent Research Papers
                                        }
                                        Meteor.call('addArticle',processedArticleJson, function(error,result){
                                            if (result && articleParams.paperchase_user && Roles.userIsInRole(articleParams.paperchase_user, ['super-admin', 'advance'])) {
                                    			Meteor.call('sorterAddItem', 'advance', result, function(error, sorterUpdated){
                                    				if(error){
                                    					console.error(error);
                                    				}else if(sorterUpdated){
                                                        fut.return(true);
                                    				}
                                    			});

                                            } else if (result) {
                                                fut.return(true);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }

                if(articleMongoId){
                    if(articleParams.ip){
                        console.log('updated article: ',articleMongoId, '| IP:',articleParams.ip);
                    }else{
                        console.log('updated article: ',articleMongoId);
                    }
                } else {
                    fut.throw({error: 'cannot update advance ' + id});
                }
            });
        }

        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error.message);
        }
    },
    legacyArticleReadyForIntake: function(articleParams){
        // console.log('...legacyArticleInfo');
        // console.log(articleParams);
        var fut = new future();
        var idType = articleParams.id_type,
            idValue = articleParams.id,
            journal = articleParams.journal,
            advance = articleParams.advance,
            batch = articleParams.batch;
        var article,
            paperchaseQueryParams,
            legacyPlatform,
            legacyPlatformApi,
            articleJson,
            processedArticleJson;
        // console.log('...legacyIntake: ' + idType + ' = ' + idValue);

        legacyPlatform = journalConfig.findOne();
        if(legacyPlatform){
            legacyPlatform = legacyPlatform.legacy_platform;
            legacyPlatformApi = legacyPlatform.mini_api;
            // Check if article exists by query for ID. Allow multiple types of ID (PMID, PII, etc)
            paperchaseQueryParams = '{"' + 'ids.' + idType + '" : "' + idValue + '"}';
            paperchaseQueryParams = JSON.parse(paperchaseQueryParams);
            article = articles.findOne(paperchaseQueryParams);

            // Get the article JSON from the legacy platform
            if(legacyPlatform.short_name === 'ojs'){
                Meteor.call('ojsGetArticlesJson', idType, idValue, journal, legacyPlatformApi, function(error,articleJson){
                    if(articleJson){
                        articleJson = JSON.parse(articleJson);
                        // console.log(articleJson.articles.length);
                        if(articleJson.articles && articleJson.articles.length > 0){
                            articleJson = articleJson.articles[0];
                            // Process article info for Paperchase DB
                            Meteor.call('ojsProcessArticleJson', articleJson, function(error,processedArticleJson){
                                if(error){
                                    console.error(error);
                                    fut.throw(error);
                                } else if(processedArticleJson){
                                    if(advance){
                                        processedArticleJson.advance = true;
                                    }
                                    if(article){
                                        processedArticleJson._id = article._id;
                                        if(article.section_id === 0){
                                            processedArticleJson.section_id = 0; // Keep in Recent Research Papers
                                        }
                                        if(article.issue_id){
                                            processedArticleJson.issue_id = article.issue_id;
                                        }
                                        // Now compare with the DB
                                        // TODO: need to adjust this for OJS data, right now it is setup for XML comparission
                                        // Meteor.call('compareProcessedXmlWithDb',processedArticleJson,article,function(error,result){
                                        //     if(result){
                                        //         console.log('result',result.conflicts);
                                        //     }else{
                                        //         console.log('..no');
                                        //     }
                                        // });
                                    }else{
                                        processedArticleJson.doc_updates = {} ;
                                        processedArticleJson.doc_updates.created_by = 'OJS Intake';
                                        if(processedArticleJson.article_type.type == 'Research Papers'){
                                            processedArticleJson.section_id = 0; // Put new Research Paper into Recent Research Papers
                                        }
                                    }

                                    fut.return(processedArticleJson);
                                } else {
                                    fut.throw('Article ('+idType+': '+ idValue +') was not added to Paperchase.');
                                }
                            });
                        }else{
                            fut.throw('Article ('+idType+': '+ idValue +') was not added to Paperchase. Could not find article in OJS database.');
                        }
                    }else {
                        fut.throw('Article ('+idType+': '+ idValue +') was not added to Paperchase.');
                    }
                });
            }
        }
        else {
            return false;
        }

        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error.message);
        }
    },
    updateArticlesViaLegacy: function(piiList){
        // console.log('updateArticlesViaLegacy',piiList);
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;

        var notUpdated = 0,
            updated = 0;

        var updatedList = [];

        async.each(piiList, function (pii, cb) {
            console.log(pii);
            var params = {};
                params.id_type = 'pii',
                params.id =  pii,
                params.journal = journalShortName,
                params.batch = true;

            Meteor.call('legacyArticleIntake',params, function(error,result){
                if(error){
                    console.error('legacyArticleIntake',error);
                    notUpdated++;
                }else if(result){
                    updated++;
                    console.log('updated count = ',updated);
                    updatedList.push(pii);
                    cb();
                }else{
                    console.error('legacyArticleIntake no response');
                }
            });

        }, function (err) {
            if (err) { throw err; }
            fut.return(updatedList);
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    }
});


// OJS
Meteor.methods({
    ojsGetArticlesJson: function(idType, idValue, journal, requestUrl){
        // JSON response can contain multiple articles
        // console.log('...ojsGetArticlesJson');
        if(requestUrl){
            requestUrl += '?journal='+journal+'&' + idType + '=' + idValue;
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

        if(article.issue && article.issue !==0 ){
            articleUpdate.issue = parseInt(article.issue);
        }

        if(articleUpdate.volume && articleUpdate.issue){
            articleUpdate.vi  = Meteor.issue.createIssueParam(articleUpdate.volume,articleUpdate.issue);
        }

        if(article.pages && article.pages !== null){
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
            abstract = article.abstract.substring(abs, article.abstract.length).replace("</p> \n   </div>", '').trim();
            articleUpdate.abstract = abstract;

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
                        kwList = kwList[0].replace(/<\/span>: /g,'').replace(/<\/span>/g,'').replace(/<\/p>/g,'').replace(/^\s+|\s+$/g, '');
                        kwList = kwList.split(', '); // leave space when splitting to trim whitespace
                        articleUpdate.keywords = kwList;
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
            articleUpdate.article_type.type  = article.article_type; //TODO: remove this after updating the DB, templates, and article type organization
            articleUpdate.article_type.name  = article.article_type;
            articleUpdate.article_type.short_name = article.shortname.toLowerCase();
        }

        if(article.section_id){
            articleUpdate.section_id = parseInt(article.section_id); // TODO: remove this because it is the same as article type
        }

        if(article.section){
            articleUpdate.article_type = {};
            articleUpdate.article_type.name = article.section;
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
        }else if(article.pii){
            console.log('OJS Intake - no authors: ', article.pii);
        }else{
            console.log('OJS Intake - no authors');
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

        if(article.keywords){
            articleUpdate.keywords = article.keywords;
        }

        // TODO: Affiliations
        // articleUpdate.affiliations = [];

        // TODO: Pub Status. Query PubMed.
		return articleUpdate;
	},
	ojsGetAdvanceArticles: function(){
        // console.log('ojsGetAdvanceArticles', new Date());
        var fut = new future();
        var requestURL = 'http://www.impactjournals.com//ojs-api/?v=5&i=0';
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            fut.return(res.data.articles);
        }else{
            throw new Meteor.Error(500, 'ojsAdvanceArticles' , error);
        }

        try {
            return fut.wait();
        }catch(err) {
            throw new Meteor.Error(error);
        }
    },
    ojsAddMissingAdvanceButInPaperchase: function(paperchaseArticles){
        // console.log('...ojsAddMissingAdvanceButInPaperchase', paperchaseArticles.length);
        var fut = new future();
        var added = [];
        var legacyPlatformApi;
        var legacyPlatform = journalConfig.findOne();
        var ojsAdvanceByPii = {};
        var articlesBySection = {}; // will use to update sorters

        if(legacyPlatform){
            legacyPlatform = legacyPlatform.legacy_platform;
            legacyPlatformApi = legacyPlatform.mini_api;
        }

        var paperchase_user = Meteor.user() ? Meteor.user()._id : null;

        if(legacyPlatformApi){
            Meteor.call('ojsGetAdvanceArticles', function(error, ojsAdvance){
                if (error) {
                    console.error('ojsGetAdvanceArticles in ojsAddMissingAdvanceButInPaperchase', error);
                    fut.throw(error);
                } else if(ojsAdvance) {
                    ojsAdvance.forEach(function(article){
                        if (article.pii) {
                            ojsAdvanceByPii[article.pii] = article;
                        } else {
                            console.error('cannot sort by PII for advance ', article);
                        }
                    });

                    paperchaseArticles.forEach(function(pcArticle, idx){
                        // first update the articles collection
                        if (pcArticle.ids && pcArticle.ids.pii && ojsAdvanceByPii[pcArticle.ids.pii]) {
                            Meteor.call('updateArticleUsingOjsData', pcArticle, ojsAdvanceByPii[pcArticle.ids.pii], paperchase_user, function(updateError, updateResult){
                                if (updateError) {
                                    console.error('updateError in ojsAddMissingAdvanceButInPaperchase', updateError);
                                } else if (updateResult) {
                                    added.push(pcArticle.ids.pii);

                                    if (!articlesBySection[ojsAdvanceByPii[pcArticle.ids.pii].section_id]) {
                                        articlesBySection[ojsAdvanceByPii[pcArticle.ids.pii].section_id] = [];
                                    }

                                    articlesBySection[ojsAdvanceByPii[pcArticle.ids.pii].section_id].push(pcArticle._id);
                                }
                            });
                        } else {
                            console.error('Cannot match OJS and Paperchase. MongoID: ', pcArticle._id);
                        }


                        // now update the sorters list. Doing it by section type to speed up sorters updating
                        if(idx === paperchaseArticles.length-1) {
                            Meteor.call('updateAdvanceSortersBySections', articlesBySection, function(errorSorters, resultSorters){
                                if(errorSorters) {
                                    fut.throw('Articles updated in the database but could not update advance list');
                                } else if(resultSorters) {
                                    fut.return(added);
                                }
                            });
                        }
                    });

                } else {
                    fut.throw('Cannot update advance. OJS is not responding.');
                }
            });
        }


        try {
            return fut.wait();
        }catch(err) {
            throw new Meteor.Error(error);
        }
    },
    updateAdvanceSortersBySections: function(articlesBySection){
        for(var sectionId in articlesBySection){
            Meteor.call('advanceAddArticleListToSection', articlesBySection[sectionId], sectionId, function(error, result){
                if (error) {
                    console.error('updateAdvanceSortersBySections', error);
                } else if(result){
                    console.log('updated sorters by section. Section ID:', sectionId);
                }
            });
        }
        return true;

    },
    updateArticleUsingOjsData: function(pcArticle, ojsArticle, paperchase_user){
        // only for adding existing articles in Paperchase to advance. Will also ensure research papers are set to recent
        var fut = new future();

        Meteor.call('ojsProcessArticleJson', ojsArticle, function(processError, processedArticleJson){
            if (processError) {
                console.error('processError PII:', pcArticle.ids.pii, processError);
                fut.throw(processError);
            } else if(processedArticleJson){
                processedArticleJson.advance = true;
                if (processedArticleJson.section_id && processedArticleJson.section_id  === 5 ){
                    processedArticleJson.section_id = 0;
                }

                Meteor.call('updateArticle', pcArticle._id, processedArticleJson, function(errorUpdate, resultUpdate){
                    if (resultUpdate) {
                        fut.return(true);
                    } else {
                        fut.throw('updateArticleUsingOjsData Cannot update in Paperchase', pcArticle._id);
                    }
                });
            } else {
                fut.throw('updateArticleUsingOjsData. Cannot process', pcArticle._id);
            }
        });

        try {
            return fut.wait();
        }catch(err) {
            throw new Meteor.Error(error);
        }
    },
    ojsAddMissingAdvance: function(missing){
        // console.log('...ojsAddMissingAdvance', missing.length);
        var added = [];
        var journalInfo = journalConfig.findOne();
        missing.map(function(article){
            Meteor.call('ojsProcessArticleJson', article.data, function(processError,processedArticleJson){
                if (processError) {
                    console.error('legacyArticleIntake via ojsAddMissingAdvance',processError);
                } else if (processedArticleJson) {
                    var dataForDb = Object.assign({'debug_added_via_all_ojs_btn': true}, processedArticleJson);

                    // verify not in DB, possible that someone on OJS added article right before this action triggered
                    if (dataForDb.ids && dataForDb.ids.pii) {
                        var exists  = articles.findOne({ 'ids.pii': dataForDb.ids.pii});
                        if (exists) {
                            Meteor.call('updateArticle', exists._id, dataForDb, function(addError,result){
                                if(addError){
                                    console.error('addError via ojsAddMissingAdvance',addError);
                                }else if(result){
                                    Meteor.call('sorterAddItem','advance',result, function(sorterError,sorterRes){
                                        if(sorterError){
                                            console.error('sorterAddItem via ojsAddMissingAdvance',sorterError);
                                        }else if(sorterRes){
                                            added.push(processedArticleJson.ids.pii);
                                        }
                                    });
                                }
                            });
                        } else {
                            // verified new article, not in db
                            Meteor.call('addArticle', dataForDb, function(addError,result){
                                if(addError){
                                    console.error('addError via ojsAddMissingAdvance',addError);
                                }else if(result){
                                    Meteor.call('sorterAddItem','advance',result, function(sorterError,sorterRes){
                                        if(sorterError){
                                            console.error('sorterAddItem via ojsAddMissingAdvance',sorterError);
                                        }else if(sorterRes){
                                            added.push(processedArticleJson.ids.pii);
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        });
        return added;
    }
});
