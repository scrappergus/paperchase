//Meteor.authorizeCheck.article is temporary. The collections.js file should handle allow/deny but callback is failing to deny access
Meteor.authorizeCheck = {
    articles: function(){
        var loggedInUser = Meteor.user();
        if (!loggedInUser || !Roles.userIsInRole(loggedInUser,['super-admin','edit'],'article')) {
            throw new Meteor.Error(403, 'Access denied')
        }
    }
}
// All of these methods are for admin article
Meteor.methods({
    addArticle: function(articleData){
        Meteor.authorizeCheck.articles();
        if(articleData.authors){
            var authorsList = articleData.authors;
            for(var author = 0 ; author < authorsList.length; author++){
                //check if author doc exists in authors collection
                var authorDoc;
                authorsList[author].ids = {};
                authorDoc = authors.findOne({'name_first' : authorsList[author].name_first,'name_last' : authorsList[author].name_last});
                if(!authorDoc){
                    //INSERT into authors
                    Meteor.call('addAuthor',authorsList[author],function(error, mongo_id){
                        if(error){
                            console.error('ERROR',error);
                        }else{
                            authorsList[author].ids.mongo_id = mongo_id;
                        }
                    });
                }else{
                    //author doc already exists
                    authorsList[author].ids.mongo_id = authorDoc._id;
                }
            }
        }

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
        Meteor.authorizeCheck.articles();
        var fut = new future();
        // console.log('--updateArticle',mongoId,articleData);

        // the returned result will either be the result from updating/inserting the article doc,
        // if inserting an article and a duplicate was found, then that is returned.
        if(!mongoId){
            // Add new article
            Meteor.call('addArticle', articleData, function(error,result){
                if(error){
                    fut.throw(error);
                }else if(result){
                    fut.return(result);
                }
            });
        }else if(mongoId){
            // Update existing
            articleData.batch = batch;
            var updated = articles.update({'_id' : mongoId}, {$set: articleData});
            fut.return(mongoId);
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    updateArticleBy: function(where, what){
        Meteor.authorizeCheck.articles();
        return articles.update(where, {$set: what},{multi:true});
    },
    unsetArticles: function(where, what){
        Meteor.authorizeCheck.articles();
        var articlesToUpdate = articles.find(where).fetch()
        var updated = articles.update(where, {$unset: what},{ multi: true });
        if(updated){
            return articlesToUpdate; // this will be docs pre update.
        }
    },
    pushArticle: function(mongoId, field, articleData){
        Meteor.authorizeCheck.articles();
        var updateObj = {};
        updateObj[field] = articleData;
        return articles.update({'_id' : mongoId}, {$push: updateObj});
    },
    updateArticleByPmid: function(pmid, articleData){
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
        Meteor.authorizeCheck.articles();
        // console.log('--addToArticleAffiliationsByPmid | pmid = ' + pmid  + ' / affiliation = ' + affiliation);
        return  articles.update({'ids.pmid' : pmid}, {$addToSet: {'affiliations' : affiliation}});
    },
    pushPiiArticle: function(mongoId, ids){
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
            publisherArticleSections;

        if(!article && articleId){
            // when editing an article
            article = articles.findOne({'_id': articleId});
        }else{
            // after processing XML
            // Compare XML and Database
            articleFromDb = articles.findOne({'_id': articleId});
            Meteor.call('compareProcessedXmlWithDb',article,articleFromDb,function(error,result){
                if(result){
                    article = result;
                }
            });
            // Check for duplicates
            Meteor.call('articleExistenceCheck',articleId, article, function(error,duplicateFound){
                if(error){
                    console.error('articleExistenceCheck',error);
                }else if(duplicateFound){
                    article.duplicate = duplicateFound;
                }
            });
        }
        // console.log('-------',JSON.stringify(article.authors));

        // New or Edit article? If articleId given and PII found, then editing.
        // articleByPii = articles.findOne({'ids.pii':articleId});
        if(!articleId){
            article = {}; // For a new article
            article.ids = {};
            // article.ids.pii = Meteor.call('getNewPii'); // no longer autofilling PII
        }
        // else if(!article && !articleByPii){
        //     article = {}; // Article by PII not found. Then act like this is a new article
        //     article.ids = {};
        //     // article.ids.pii = Meteor.call('getNewPii'); // no longer autofilling PII
        // }

        if(article){
            // For editing an existing article
            // or after uploading XML and updating an existing article's DB info

            // Affiliations
            // ------------
            // add ALL affiliations for article to author object,
            // needed for author affiliation checkbox input
            affs = article.affiliations;
            if(article.authors){
                authorsList = article.authors;
                // Go through each author object
                for(var i=0 ; i < authorsList.length; i++){
                    var currentAuthorAffs,
                        authorAffiliationsEditable,
                        mongo;

                    currentAuthorAffs = authorsList[i].affiliations_numbers;
                    authorAffiliationsEditable = []; // All affiliations for paper, which current author affs checked

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
                            }
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
                }
            }

            // Issues
            // ------
            article.volumes = Meteor.call('archive',article.issue_id);

            // Pub Status
            // ----------
            article.pub_status_list = pubStatusTranslate;
            for(var p = 0; p < pubStatusTranslate.length; p++){
                if(article.pub_status_list[p].abbrev == article.pub_status){
                    article.pub_status_list[p].selected = true;
                }
            }

            // Article Type
            // ------------
            // add ALL article types
            if(article.article_type){
                articleType = article.article_type.name;
            }
            article.article_type_list = [];
            publisherArticleTypes = articleTypes.find().fetch();
            for(var k =0 ; k < publisherArticleTypes.length ; k++){
                var selectObj = {
                    nlm_type: publisherArticleTypes[k].nlm_type,
                    name: publisherArticleTypes[k].name.short_name,
                    short_name: publisherArticleTypes[k]
                }
                if(publisherArticleTypes[k].name == articleType){
                    selectObj.selected = true;
                }
                article.article_type_list.push(selectObj);
            }

            // Article Section
            // ------------
            // add ALL article sections
            if(article.section){
                selectedSectionId = article.section;
            }
            article.article_section_list = [];
            publisherArticleSections = sections.find().fetch();
            for(var s =0 ; s < publisherArticleSections.length ; s++){
                var selectObj = {
                    _id : publisherArticleSections[s]._id,
                    name: publisherArticleSections[s].name,
                    short_name: publisherArticleSections[s].short_name
                }
                if(publisherArticleSections[s]._id == selectedSectionId){
                    selectObj.selected = true;
                }
                article.article_section_list.push(selectObj);
            }

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
            if(queryRes[duplicateType].length > 0 && queryRes[duplicateType][0]._id != null){
                var duplicateList = [];
                queryRes[duplicateType].forEach(function(duplicate){
                    if(duplicate._id.duplicate_field != null){ //remove duplicates where field does not exist
                        var obj = {
                            duplicate_field: duplicate._id.duplicate_field,
                            count: duplicate.count
                        } // if object not reformatted, _id : {} return from aggregratio causes underscore to throw error Meteor does not currently support objects other than ObjectID as ids
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
        // console.log(result.pii);
        return result;
    },
    articleExistenceCheck: function(mongoId, articleData){
        // console.log('--articleExistenceCheck',mongoId);
        // before inserting/updating article, check if doc already exists
        // will return duplicate article doc, if found
        var query =  [
            {
                'title': articleData.title
            }
        ];

        if(articleData.ids.pmid){
            query.push({
                'ids.pmid': articleData.ids.pmid
            });
        }
        if(articleData.ids.pmc){
            query.push({
                'ids.pmc': articleData.ids.pmc
            });
        }
        if(articleData.ids.pii){
            query.push({
                'ids.pii': articleData.ids.pii
            });
        }
        // console.log('query',query);
        var exists = articles.findOne({ $or: query });

        if(exists && exists._id != mongoId){
            return exists;
        }else{
            return;
        }
    },
    checkArticleInputs: function(articleData){
        // will check for all required fields in form
        // will return all invalid inputs
        var invalid = [];
        var clear = '<div class="clearfix"></div>';

        // title
        if(articleData.title === ''){
            invalid.push({
                'fieldset_id' : 'article-title',
                'message' : clear + 'Article title is required'
            });
        }

        return invalid;
    },
    validateArticle: function(mongoId, articleData){
        // console.log('--validateArticle',mongoId);
        var fut = new future();
        var invalid = [];
        var result = {};
        // will check all required inputs are valid and check for duplicate article by PII
        // will either return doc of duplicate article, invalid array, or boolean if article was updated

        // first check for duplicates
        Meteor.call('articleExistenceCheck',mongoId, articleData, function(error,duplicateExists){
            if(error){
                fut.throw(error);
            }else if(duplicateExists){
                result = duplicateExists;
                result.duplicate = true;
                fut.return(duplicateExists);
            }else{
                Meteor.call('checkArticleInputs',articleData, function(error,articleInvalid){
                    if(error){
                        fut.throw(error);
                    }else if(articleInvalid && articleInvalid.length > 0){
                        result.invalid = true;
                        result.invalid_list = articleInvalid;
                        fut.return(result);
                    }else{
                        // no duplicates and all valid. Now update/insert
                        Meteor.call('updateArticle',mongoId, articleData, function(error,articleSaved){
                            if(error){
                                fut.throw(error);
                            }else if(articleSaved){
                                result.article_id = articleSaved;
                                result.saved = true;
                                fut.return(result);
                            }
                        });
                    }
                });

            }
        });

        return fut.wait();
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