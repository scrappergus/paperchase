//Meteor.authorizeCheck.article is temporary. The collections.js file should handle allow/deny but callback is failing to deny access
Meteor.authorizeCheck = {
    articles: function(){
        var loggedInUser = Meteor.user();
        if (!loggedInUser || !Roles.userIsInRole(loggedInUser,['super-admin','edit'],'article')) {
            // throw new Meteor.Error(403, 'Access denied')
        }
    }
};
// All of these methods are for admin article
Meteor.methods({
    articleChecksBeforeDbUpdate: function(articleData){
        // console.log('articleChecksBeforeDbUpdate');
        var fut = new future();

        var articleAuthors,
            articleAffiliations;

        if(articleData.authors){
            // Authors Check
            // -------------------
            if(articleData.authors){
                articleAuthors = articleData.authors;
            }
            if(articleData.affiliations){
                articleAffiliations = articleData.affiliations;
            }

            Meteor.call('articleAuthorsCheck',articleAuthors, articleAffiliations, function(error,authorsChecked){
                if(error){
                    console.error('articleAuthorsCheck',error);
                    fut.throw(error);
                }else if(authorsChecked){
                    articleData.authors = authorsChecked;
                    fut.return(articleData);
                }
            });
        }else{
            fut.return(articleData);
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    addArticle: function(articleData){
        // console.log('....addArticle');
        if(articleData.ids && articleData.ids.pii){
            console.log('....addArticle', articleData.ids.pii);
        }

        Meteor.authorizeCheck.articles();

        if(articleData.volume && articleData.issue){
            // check if article doc
            Meteor.call('addIssue', {volume: articleData.volume, issue: articleData.issue}, function(error,result){
                if(result){
                    articleData.issue_id = result;
                }
            });
        }

        return articles.insert(articleData);
    },
    updateArticle: function(mongoId, articleData, batch){
        // console.log('..updateArticle', new Date());
        // nope. articles with missing authors not showing this log
        // console.log('updateArticle',mongoId, articleData);
        // whether adding or editing an article, both will go through this method

        var fut = new future();

        Meteor.call('articleChecksBeforeDbUpdate', articleData, function(error,checkedData){
            if(error){
                console.error('articleChecksBeforeDbUpdate',error);
                fut.throw(error);
            }else if(checkedData){

                // the returned result will either be the result from updating/inserting the article doc,
                // if inserting an article and a duplicate was found, then that is returned.
                if(!mongoId){
                    // Add new article
                    Meteor.call('addArticle', checkedData, function(error,result){
                        if(error){
                            console.error('addArticle',error);
                            fut.throw(error);
                        }else if(result){
                            fut.return({article_id: result, saved: true});
                        }
                    });
                }else if(mongoId){
                    // Update existing
                    if(batch){
                        checkedData.batch = batch;
                    }
                    var updated = articles.update({'_id' : mongoId}, {$set: checkedData});
                    fut.return(mongoId);
                }
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    },
    updateArticleBy: function(where, what){
        // nope. used in batch getMissingPubMedIds() and when articles hidden when issue is validateIssue()
        Meteor.authorizeCheck.articles();
        return articles.update(where, {$set: what},{multi:true});
    },
    unsetArticles: function(where, what){
        console.log('..unsetArticles', new Date());
        // nope. used in removeArticlesFromIssue()
        Meteor.authorizeCheck.articles();
        var articlesToUpdate = articles.find(where).fetch();
        var updated = articles.update(where, {$unset: what},{ multi: true });
        if(updated){
            return articlesToUpdate; // this will be docs pre update.
        }
    },
    pushArticle: function(mongoId, field, articleData){
        // THIS WILL NOT RECORD PREVIOUS VERSION OF ARTICLE DOC IN THE DB
        Meteor.authorizeCheck.articles();
        var updateObj = {};
        updateObj[field] = articleData;
        return articles.update({'_id' : mongoId}, {$push: updateObj});
    },
    updateArticleByPmid: function(pmid, articleData){
        console.log('..updateArticleByPmid', new Date());
        // nope. used in batch methods. getPubMedInfo(), batchUpdateCorrespViaXml(), getMissingPmcIds()
        // console.log('--updateArticleByPmid |  pmid = '+pmid, articleData);

        if(articleData.volume && articleData.issue){
            // check if article doc
            Meteor.call('addIssue', {volume: articleData.volume, issue: articleData.issue}, function(error,result){
                if(result){
                    articleData.issue_id = result;
                }
            });
        }

        return articles.update({'ids.pmid' : pmid}, {$set: articleData});
    },
    addToArticleAffiliationsByPmid: function(pmid, affiliation){
        console.log('..addToArticleAffiliationsByPmid', new Date());
        // nope. used in batch method. getAllAuthorsAffiliationsPubMed()
        Meteor.authorizeCheck.articles();
        // console.log('--addToArticleAffiliationsByPmid | pmid = ' + pmid  + ' / affiliation = ' + affiliation);
        return  articles.update({'ids.pmid' : pmid}, {$addToSet: {'affiliations' : affiliation}});
    },
    pushPiiArticle: function(mongoId, ids){
        console.log('..pushPiiArticle', new Date());
        // nope. used in batch methods
        Meteor.authorizeCheck.articles();
        //used for batch processing of XML from PMC
        return articles.update({'_id' : mongoId}, {$set: {'ids' : ids}});
    },
    articleIssueVolume: function(volume,issue){
        // console.log('....articleIssueVolume v = ' + volume + ', i = ' + typeof issue );
        // if article in issue:
        // 1. check if issue exists in issues collection. If not add. If issue exists or added, issue Mongo ID returned
        // 2. include issue Mongo id in article doc
        var issueInfo,
            issueId;
        if(volume && issue){
            // Does issue exist?
            issue = String(issue);
            issueInfo = Meteor.call('findIssueByVolIssue', volume, issue);
            if(issueInfo){
                issueId = issueInfo._id;
            }else{
                // This also checks volume collection and inserts if needed.
                issueId = Meteor.call('addIssue',{
                    'volume': volume,
                    'issue': issue,
                    'issue_linkable' : Meteor.issue.linkeableIssue(issue) // remove any slashed to avoid URL linking problems
                });
            }
        }
        // console.log(issueId);
        return issueId;
    },
    articlesByIssueId: function(issueMongoId){
        return articles.find({issue_id : issueMongoId}).fetch();
    },
    getSavedPii: function(mongoId){
        // console.log('....getSavedPii');
        var fut = new future();
        var art = articles.findOne({_id : mongoId}, {ids:1});
        if(art.ids.pii){
            fut.return(art.ids.pii);
        }else{
            Meteor.call('getNewPii',function(error,pii){
                if(error){
                    console.error('getNewPii',error);
                }else if(pii){
                    fut.return(pii);
                }
            });
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    getNewPii: function(){
        // pii a string, so sorting is failing. below temp solution for this.
        var articleByPii = {};
        var articlesWithPiiCount = 0;
        var allArticles = articles.find({},{ids:1}).fetch();
        allArticles.forEach(function(article){
            if(article.ids && article.ids.pii){
                articleByPii[article.ids.pii] = article.ids.pii;
                articlesWithPiiCount++;
            }
        });
        // console.log('articleByPii',articleByPii[articlesWithPiiCount]);

        var highestPii = articles.findOne({},{sort: {'ids.pii' : -1}});
        return parseInt(articleByPii[articlesWithPiiCount]) + 1;
    },
    preProcessArticle: function(articleId,article){
        // Article Form: On - Article Form & Data Submissions
        // console.log('..preProcessArticle = ' + articleId);
        var articleByPii,
            articleFromDb;

        var affs,
            articleType,
            publisherArticleTypes,
            authorsList,
            selectedSectionId,
            publisherArticleSections,
            articleFilesInDb;

        if(!article && articleId){
            // when editing an article
            article = articles.findOne({'_id': articleId});
        }else if(articleId){
            // Check for duplicates
            Meteor.call('articleExistenceCheck', articleId, article, function(duplicateFound){
                if(duplicateFound){
                    console.error('articleExistenceCheck',duplicateFound);
                    article.duplicate = duplicateFound.details;
                }
            });
            // after processing XML
            // Compare XML and Database
            articleFromDb = articles.findOne({'_id': articleId});
            Meteor.call('compareProcessedXmlWithDb',article,articleFromDb,function(error,result){
                if(result){
                    article = result;
                }
            });
        }
        // console.log('-------',JSON.stringify(article.authors));

        // New or Edit article? If articleId given and PII found, then editing.
        if(!articleId){
            article = {}; // For a new article
            article.ids = {};
            // article.ids.pii = Meteor.call('getNewPii'); // no longer autofilling PII
        }

        if(article){
            // For editing an existing article
            // or after uploading XML and updating an existing article's DB info

            // Affiliations
            // ------------
            // add ALL affiliations for article to author object,
            // needed for author affiliation checkbox input
            affs = article.affiliations;
            notes = article.author_notes;
            if(article.authors){
                authorsList = article.authors;
                // Go through each author object
                for(var i=0 ; i < authorsList.length; i++){
                    var currentAuthorAffs,
                        authorAffiliationsEditable,
                        currentAuthorNotes,
                        authorNotesEditable,
                        mongo;

                    currentAuthorAffs = authorsList[i].affiliations_numbers;
                    authorAffiliationsEditable = []; // All affiliations for paper, which current author affs checked

                    currentAuthorNotes = authorsList[i].author_notes_ids;
                    authorNotesEditable = []; // All author notes for paper, which current author notes checked


                    // need the mongo ID for uniqueness in UI, id attribute, for checkbox
                    if(authorsList[i].ids && authorsList[i].ids.mongo_id){
                        mongo = authorsList[i].ids.mongo_id;
                    }else{
                        //for authors not saved in the db
                        mongo = Math.random().toString(36).substring(7);
                    }

                    if(affs){
                        for(var a = 0 ; a < affs.length ; a++){
                            var authorAff = {
                                author_mongo_id: mongo
                            };
                            if(currentAuthorAffs && currentAuthorAffs.indexOf(a) != -1){
                                // author already has affiliation
                                authorAff.author_aff = 'checked';
                            }else{
                                authorAff.author_aff = false;
                            }
                            authorAffiliationsEditable.push(authorAff);
                        }
                        authorsList[i].affiliations_list = authorAffiliationsEditable;
                    }

                    if(notes){
                        for(var a = 0 ; a < notes.length ; a++){
                            var note = notes[a];
                            var authorNote= {
                                id: note.id,
                                author_mongo_id: mongo
                            };
                            authorNote.author_note = false;
                            if(currentAuthorNotes) {
                                for(var currentNoteIdx=0; currentNoteIdx<currentAuthorNotes.length; currentNoteIdx++) {
                                    currentNote = currentAuthorNotes[currentNoteIdx];
                                    if(currentNote == note.id) {
                                        authorNote.author_note = 'checked';
                                    }
                                }
                            }

                            authorNotesEditable.push(authorNote);
                        }
                        authorsList[i].author_notes_list = authorNotesEditable;
                    }

                }
            }

            // Issues
            // ------
            article.volumes = Meteor.call('archive',article.issue_id);

            // Pub Status
            // ----------
            var copiedPubStatusTranslate = JSON.parse(JSON.stringify(pubStatusTranslate));
            article.pub_status_list = copiedPubStatusTranslate;

            var statusIndex = null;
            for(var statOptIdx = pubStatusTranslate.length-1; statOptIdx >= 0; statOptIdx--){
                if (article.pub_status && article.pub_status_list[statOptIdx].abbrev == article.pub_status){
                    article.pub_status_list[statOptIdx].selected = true;
                    statusIndex = statOptIdx;
                }
                if (article.pub_status && statusIndex || statusIndex === 0 && statOptIdx < statusIndex){
                    article.pub_status_list[statOptIdx].disabled = true;
                }
            }

            // Article Type
            // ------------
            // add ALL article types
            if(article.article_type){
                articleType = article.article_type.name;
            }
            publisherArticleTypes = articleTypes.find({},{sort: {name:1}}).fetch();
            article.article_type_list = publisherArticleTypes.map(function(typeOption){
                if(typeOption.name == articleType){
                    typeOption.selected = true;
                }
                return typeOption;
            });

            // Article Section
            // ------------
            // add ALL article sections
            if(article.section){
                selectedSectionId = article.section;
            }
            if(!selectedSectionId && selectedSectionId !== 0 && article.section_id || article.section_id === 0) {
                // For OJS
                selectedSectionId = article.section_id;
            }

            article.article_section_list = [];
            publisherArticleSections = sections.find().fetch();
            for(var s=0; s < publisherArticleSections.length; s++){
                var selectObj = {
                    _id : publisherArticleSections[s]._id,
                    name: publisherArticleSections[s].name,
                    short_name: publisherArticleSections[s].short_name
                };

                if(!selectObj.name && publisherArticleSections[s].section_name){
                    // For OJS
                    selectObj.name = publisherArticleSections[s].section_name;
                }


                if(publisherArticleSections[s]._id == selectedSectionId){
                    selectObj.selected = true;
                } else if(publisherArticleSections[s].section_id == selectedSectionId){
                    // for OJS
                    selectObj.selected = true;
                }
                article.article_section_list.push(selectObj);
            }

            // Files
            // -----------
            // add xml and pdf info so that we can use this to update db without erasing info
            // for figures, supplemental and tables - use the XML data

            if(article.files){
            }else{
                article.files = {};
            }

            articleFilesInDb = articles.findOne({'_id': articleId});
            // PDF and XML
            if(articleFilesInDb && articleFilesInDb.files) {
                if(articleFilesInDb && articleFilesInDb.files.pdf){
                    article.files.pdf = articleFilesInDb.files.pdf;
                }
                if(articleFilesInDb && articleFilesInDb.files && articleFilesInDb.files.xml){
                    article.files.xml = articleFilesInDb.files.xml;
                }
            }
            // Supp, Figures, Tables
            if(article.files){
                for(var fileType in article.files){
                    if(fileType != 'pdf' && fileType != 'xml'){
                        Meteor.articleFiles.maintainFilenameViaId(article.files[fileType], articleFilesInDb.files[fileType],function(fileRes){
                            if(fileRes){
                                article.files[fileType] = fileRes;
                            }
                        });
                    }
                }
            }
            // console.log('files',article.files);

            // console.log('--------------------article');
            // console.log(article);
            return article;
        }
    },
    duplicateArticles: function(){
        var result = {};
        var queryRes = {};
        queryRes.pii = articles.aggregate([
            {
                $group : {
                    _id: {
                        duplicate_field : '$ids.pii'
                    } ,
                    data: { '$addToSet' : { 'id' : '$_id','article_type' : '$article_type.name' } },
                    count : {
                        $sum: 1
                    }
                }
            },
            {
                $match : {
                    count : {
                        $gt : 1
                    }
                }
            }
        ]);

        queryRes.pmid = articles.aggregate([
            {
                $group : {
                    _id: {
                        duplicate_field : '$ids.pmid'
                    } ,
                    data: { '$addToSet' : { 'id' : '$_id','article_type' : '$article_type.name' } },
                    count : {
                        $sum: 1
                    }
                }
            },
            {
                $match : {
                    count : {
                        $gt : 1
                    }
                }
            }
        ]);
        queryRes.titles = articles.aggregate([
            {
                $group : {
                    _id: {
                        duplicate_field : '$title'
                    } ,
                    data: { '$addToSet' : { 'id' : '$_id', 'article_type' : '$article_type.name' } },
                    count : {
                        $sum: 1
                    }
                }
            },
            {
                $match : {
                    count : {
                        $gt : 1
                    }
                }
            }
        ]);
        for(var duplicateType in queryRes){
            if(queryRes[duplicateType].length > 0 && queryRes[duplicateType][0]._id !== null){
                var duplicateList = [];
                queryRes[duplicateType].forEach(function(duplicate){
                    if(duplicate._id.duplicate_field !== null){ //remove duplicates where field does not exist
                        var obj = {
                            duplicate_field: duplicate._id.duplicate_field,
                            count: duplicate.count
                        }; // if object not reformatted, _id : {} return from aggregratio causes underscore to throw error Meteor does not currently support objects other than ObjectID as ids
                        if(duplicate.data){
                            obj.article_types = [];
                            obj.mongo_ids = [];
                            duplicate.data.forEach(function(duplicateArticle){
                                obj.mongo_ids.push(duplicateArticle.id);
                                obj.article_types.push(duplicateArticle.article_type);
                            });
                            // console.log(duplicate.data);
                        }
                        duplicateList.push(obj);
                    }
                });
                result[duplicateType] = duplicateList;
            }else{
                result[duplicateType] = null; //for templating
            }
        }

        // Below is for debugging duplicates
        // var advanceArray = sorters.findOne({ name: 'advance' }).order;
        // var csvStr = 'PII, Mongo ID, Created By, Created Date, First Record, Advance in Article Doc, In Advance Array';
        //
        // result.pii.forEach(function(duplicateList){
        //     var previousDate;
        //     for(var i=0; i<duplicateList.mongo_ids.length; i++){
        //         var article = articles.findOne({_id: duplicateList.mongo_ids[i]});
        //         var createdBy = 'N/A',
        //             createdDate = 'N/A';
        //         var userData,
        //             firstRecord = '';
        //         if (article){
        //             if(article.doc_updates && article.doc_updates.updates && article.doc_updates.updates[0]){
        //                 if (article.doc_updates.updates[0].user){
        //                     userData = Meteor.users.findOne({_id : article.doc_updates.updates[0].user});
        //                     if(userData){
        //                         createdBy = userData.emails[0].address;
        //                     }
        //                 } else if(article.doc_updates.created_by){
        //                     createdBy = article.doc_updates.created_by;
        //                 }
        //
        //                 if (article.doc_updates.updates[0].date){
        //                     createdDate = article.doc_updates.updates[0].date;
        //                 }
        //             } else if(article.doc_updates && article.doc_updates.created_by){
        //                 createdBy = article.doc_updates.created_by;
        //             }
        //
        //             if(createdDate != 'N/A' && previousDate) {
        //                 if( createdDate < previousDate ){
        //                     firstRecord = 'Yes';
        //                 } else {
        //                     // console.log('No', createdDate , '>', previousDate);
        //                     firstRecord = 'No';
        //                 }
        //             }
        //
        //             if(createdDate != 'N/A') {
        //                 previousDate = createdDate;
        //             }
        //
        //             var inAdvanceArray = advanceArray.indexOf(article._id) != -1 ? 'Yes' : 'No';
        //
        //             var advanceInArticleDoc = article.advance ? 'Yes' : 'No';
        //
        //             csvStr += '\n' + article.ids.pii + ',' + article._id + ',' + createdBy + ',' + createdDate + ',' + firstRecord + ',' + advanceInArticleDoc + ',' + inAdvanceArray;
        //         } else{
        //             console.log('Not Found', duplicateList.mongo_ids[i]);
        //         }
        //     }
        // });
        // // console.log(csvStr);
        // result.csv = csvStr;
        return result;
    },
    articleExistenceCheck: function(mongoId, articleData){
        // console.log('--articleExistenceCheck');
        var fut = new future();
        var duplicate;
        // before inserting/updating article, check if doc already exists
        // will return duplicate article doc, if found
        if(articleData){
            var query =  [
                {
                    'title': articleData.title
                }
            ];

            if(articleData.ids && articleData.ids.pmid){
                query.push({
                    'ids.pmid': articleData.ids.pmid
                });
            }
            if(articleData.ids && articleData.ids.pmc){
                query.push({
                    'ids.pmc': articleData.ids.pmc
                });
            }
            if(articleData.ids && articleData.ids.pii){
                query.push({
                    'ids.pii': articleData.ids.pii
                });
            }

            var exists = articles.find({ $or: query }).fetch();

            if(exists && exists.length > 1){
                exists.forEach(function(article){
                    if(!duplicate && mongoId && article._id != mongoId){
                        Meteor.adminArticle.samePii(articleData, article, function(piiMatch){
                            if(piiMatch){
                                duplicate = article;
                            }
                        });
                    }else if(!duplicate && article._id != mongoId && articleData.title && article.title && Meteor.clean.removeSpaces(articleData.title) === Meteor.clean.removeSpaces(article.title)){
                        // for when uploading AOP XML, will not have a mongoId passed to the function
                        Meteor.adminArticle.samePii(articleData, article, function(piiMatch){
                            if(piiMatch){
                                duplicate = article;
                            }
                        });
                    }
                });
            }else if(exists && !mongoId && exists.length == 1){
                // for when uploading AOP XML, will not have a mongoId passed to the function
                // still need to make sure PIIs do not match, if they do not match then ok to create, because erratums can have same title
                Meteor.adminArticle.samePii(articleData, exists[0], function(piiMatch){
                    if(piiMatch){
                        duplicate = exists[0];
                    }
                });
            }

            if(duplicate){
                fut.throw(duplicate);
            }else{
                fut.return(true);
            }
        }

        try {
            return fut.wait();
        } catch(error) {
            throw new Meteor.Error(error);
        }
    },
    validateArticle: function(mongoId, articleData){
        // console.log('--validateArticle');
        var fut = new future();
        var validated;
        var result = {};
        var errorMessage;

        articles.schema.validate(articleData);

        Meteor.call('articleExistenceCheck',mongoId, articleData, function(existsError){
            if(existsError){
                errorMessage = {
                    article: existsError.error,
                    reason: 'duplicate'
                };
                fut.throw(errorMessage);
                console.error('articleExistenceCheck', existsError);
            }else{
                // article does not already exist
                Meteor.call('updateArticle',mongoId, articleData, function(updateError,result){
                    if(updateError){
                        console.error('updateArticle',updateError);
                        fut.throw(error);
                    }else if(result){
                        fut.return(result);
                    }
                });
            }
        });

        try {
            return fut.wait();
        } catch(err) {
            throw new Meteor.Error(err);
        }
    },
    removeArticlesFromIssue: function(issueMongoId){
        var fut = new future();
        var fieldsToRemove = {issue_id : '', issue: '', volume : ''};

        Meteor.call('unsetArticles',{issue_id : issueMongoId}, fieldsToRemove, function(error,articlesUpdated){
            if(error){
                console.error('unsetArticles',error);
                fut.throw(error);
            }else if(articlesUpdated){
                fut.return(articlesUpdated);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    }
});

// For Crawling by PII
Meteor.methods({
    crawlXmlById: function (mid) {
        jc = journalConfig.findOne();
        var baseUrl = jc.api.crawler;
        var journal = jc.journal.short_name;
        return Meteor.http.get(baseUrl + '/get_article_pmc_xml/' + journal + '/' + mid);
    },

    crawlPdfById: function (mid) {
        jc = journalConfig.findOne();
        var baseUrl = jc.api.crawler;
        var journal = jc.journal.short_name;
        return Meteor.http.get(baseUrl + '/get_article_pmc_pdf/' + journal + '/' + mid);
    },

    crawlFiguresByPii: function (pii) {
        jc = journalConfig.findOne();
        var baseUrl = jc.api.crawler;
        var journal = jc.journal.short_name;

        return Meteor.http.get(baseUrl + '/crawl_figures/' + journal + '/' + pii);
    },

    crawlSuplementsByPii: function (pii) {
        jc = journalConfig.findOne();
        var baseUrl = jc.api.crawler;
        var journal = jc.journal.short_name;

        return Meteor.http.get(baseUrl + '/crawl_supplemental/' + journal + '/' + pii);
    }
});


// For Download CSV
Meteor.methods({
    getArticlesDates: function(piiList){
        var foundDocs,
            docsByPii = {},
            result;

        piiList = piiList.split(',');

        foundDocs = articles.find({'ids.pii': {$in : piiList}}).fetch({dates:1, history:1});

        if(foundDocs){

            for(var i=0; i< foundDocs.length; i++){
                docsByPii[foundDocs[i].ids.pii] = foundDocs[i];
            }

            result = piiList.map(function(pii){
                if(docsByPii[pii]){
                    if(docsByPii[pii].dates && docsByPii[pii].dates.epub){
                        docsByPii[pii].dates.epub = Meteor.dates.articleCsv(docsByPii[pii].dates.epub);
                    }
                    if(docsByPii[pii].history && docsByPii[pii].history.accepted){
                        docsByPii[pii].history.accepted = Meteor.dates.articleCsv(docsByPii[pii].history.accepted);
                    }
                    if(docsByPii[pii].history && docsByPii[pii].history.received){
                        docsByPii[pii].history.received = Meteor.dates.articleCsv(docsByPii[pii].history.received);
                    }
                    return docsByPii[pii];
                }else{
                    return {ids : {pii : pii } };
                }
            });
        }
        // console.log('result',result);
        return result;
    }
});
