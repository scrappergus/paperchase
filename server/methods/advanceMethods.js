Meteor.methods({
    advancePublish: function(){
        var list = sorters.findOne({name:'advance'});
        list = list.articles;
        var out = [];
        for (var i = 0; i < list.length; i++){
            var article = list[i];
            var section = sections.findOne({'section_id' : article.section_id});
              article.section_name = section.section_name;

            out.push(article);
        }

        return publish.insert({
            name: 'advance',
            pubtime: new Date(),
            data: out
        });
    },
    compareWithLegacy: function(){
        // console.log('..compareWithLegacy');
        var fut = new future();
        var allPii = {};
        var result = {};
        result.paperchaseOnly = [];
        result.paperchaseNotAdvance = [];
        result.ojsOnly = [];
        result.allPiiCount = 0;
        Meteor.call('ojsGetAdvanceArticles',function(error,legacyArticles){
            if (error) {
                console.error('ojsGetAdvanceArticles via compareWithLegacy',error);
                throw new Meteor.Error(500, 'ojsGetAdvanceArticles' , error);
            } else if (legacyArticles) {
                // OJS Articles
                result.ojsCount = legacyArticles.length;
                legacyArticles.forEach(function(ojsA){
                    allPii[ojsA.pii] = {
                        ojs : true,
                        data: ojsA
                    };
                });
                // Paperchase Articles
                var order = sorters.findOne({name:'advance'});
                var pcArticles = order.articles;
                result.paperchaseCount = pcArticles.length;
                pcArticles.forEach(function(pcA){
                    // console.log('paperchase', pcA.ids.pii)
                    if(!allPii[pcA.ids.pii]){
                        allPii[pcA.ids.pii] = {};
                        result.paperchaseOnly.push(pcA);
                    }
                    allPii[pcA.ids.pii].paperchase = true;
                });
                // Compare. Get articles only in OJS
                for(var pii in allPii){
                    // console.log(pii, allPii[pii]);
                    result.allPiiCount++;
                    if(allPii[pii].paperchase !== true){
                        var existenceInPaperchase = articles.findOne({ 'ids.pii': pii });
                        paperchase_user = Meteor.user() ? Meteor.user()._id : null;
                        var queryObj = {
                            id : pii,
                            journal: 'oncotarget',
                            id_type: 'pii',
                            advance: true,
                            paperchase_user: paperchase_user
                        };

                        var ojsObj = {
                            pii: pii,
                            query: queryObj,
                            data: allPii[pii].data
                        };

                        // possible that PII is in Paperchase, but not in advance
                        if (existenceInPaperchase) {
                            var existingDataForUser = {};
                            for (var key in existenceInPaperchase){
                                existingDataForUser[key] = existenceInPaperchase[key];
                            }
                            existingDataForUser.query = queryObj;
                            result.paperchaseNotAdvance.push(existingDataForUser);
                        } else {
                            result.ojsOnly.push(ojsObj);
                        }
                    }
                }
                fut.return(result);
            }else{
                fut.return();
            }
        });

        try {
            return fut.wait();
        }catch(err) {
            throw new Meteor.Error(error);
        }
    },
    makeNewOrder: function(sectionsOrder){
        var fut = new future();
        var newOrder = [];

        var articlesList = sorters.findOne({name:'advance'});
        articlesList = articlesList.articles;
        articlesList.sort(function(a,b){
            var aDate;
            var bDate;
            if(!a.dates || !a.dates.epub){
                aDate = new Date();
            } else {
                aDate = new Date(a.dates.epub);
            }

            if(!b.dates || !b.dates.epub){
                bDate = new Date();
            } else {
                bDate = new Date(b.dates.epub);
            }
            return aDate.getTime() - bDate.getTime();
        });
        articlesList.reverse();

        var articlesBySection = Meteor.advance.articlesBySection(articlesList);
        var mongoIdsBySection = {};

        for(var articleSection in articlesBySection){
            mongoIdsBySection[articleSection] = [];
            articlesBySection[articleSection].forEach(function(article){
                mongoIdsBySection[articleSection].push(article._id);
            });
        }
            // console.log(mongoIdsBySection);

        sectionsOrder.forEach(function(section){
            newOrder = newOrder.concat(mongoIdsBySection[section]);
        });
        Meteor.call('updateList','advance', newOrder, function(error,result){
            if(error){
                // console.log('error!');
                throw new Meteor.Error(error);
            }else if(result){
                // console.log('success!');
                fut.return(true);
            }
        });
        return fut.wait();
    },
    updateAdvanceResearch: function(articles){
        var fut = new future();

        var order = sorters.findOne({name:'advance'});
        var orderBySectionId = Meteor.call('orderBySectionId', order.articles);
        var addRecent = [];
        var removeRecent = [];
        var allRecent = 0;

        // Find which articles need to be updated
        for (var article in articles) {
            if (articles[article] === true) {
                allRecent++;
                // recent checked. article was added to Recent Research Papers
                if(orderBySectionId[0] && orderBySectionId[0].indexOf(article) == -1 ) {
                    addRecent.push(article);
                } else if(!orderBySectionId[0]) {
                    addRecent.push(article);
                }
            } else if(orderBySectionId[0] && orderBySectionId[0].indexOf(article) != -1 ) {
                // recent NOT checked. article was in Recent Research Papers but now removed
                removeRecent.push(article);
            }
        }

        // Update articles and sorters collections. First update the article records with the correct section id, then update the sorters in 1 batch add of Mongo IDs to correct section in array
        Meteor.call('addResearchAdvance', addRecent, function(addErr, addRes){
            if (addErr) {
                console.error(addErr.error);
                if (addErr.error) {
                    fut.throw(addErr.error);
                } else {
                    fut.throw(addErr);
                }
            } else if (addRes) {
                if (removeRecent.length > 0) {
                    Meteor.call('removeResearchAdvance', removeRecent, function(removeErr, removeRes) {
                        if (removeErr) {
                            console.error(removeErr.error);
                            if (removeErr.error) {
                                fut.throw(removeErr.error);
                            } else {
                                fut.throw(removeErr);
                            }
                        } else if (removeRes) {
                            fut.return({
                                allRecent: allRecent,
                                added: addRecent.length,
                                removed: removeRecent.length
                            });
                        }
                    });
                } else {
                    fut.return({
                        allRecent: allRecent,
                        added: addRecent.length,
                        removed: removeRecent.length
                    });
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
    addResearchAdvance: function(addRecent) {
        var fut = new future();

        async.each(addRecent, function (articleId, cb) {
            Meteor.call('updateArticle', articleId, { advance: true, section_id: 0 }, function(updateError, updateRes) {
                if (updateError) {
                    cb('Failed at adding article to recent: ' + articleId);
                } else if(updateRes) {
                    cb();
                }
            });
        }, function (err) {
            if (err) {
                fut.throw(err);
            } else {
                // now update the sorters array - move articles to recent research papers
                Meteor.call('advanceAddArticleToSection', addRecent, 0, function(sorterError, sorterResult){
                    if (sorterError) {
                        fut.throw(sorterError);
                    } else if (sorterResult) {
                        fut.return(true);
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    },
    removeResearchAdvance: function(removeRecent) {
        var fut = new future();

        async.each(removeRecent, function (articleId, cb) {
            Meteor.call('updateArticle', articleId, { advance: true, section_id: 5 }, function(updateError, updateRes) {
                if (updateError) {
                    cb('Failed at removing article from recent: ' + articleId);
                } else if(updateRes) {
                    cb();
                }
            });
        }, function (err) {
            if (err) {
                fut.throw(err);
            } else {
                // now update the sorters array - move articles to research papers
                Meteor.call('advanceAddArticleToSection', removeRecent, 5, function(sorterError, sorterResult){
                    if (sorterError) {
                        fut.throw(sorterError);
                    } else if (sorterResult) {
                        fut.return(true);
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    },
    orderBySectionId: function(articles){
        var byId = {};
        for(var i=0 ; i<articles.length ; i++){
            if(!byId[articles[i].section_id]){
                byId[articles[i].section_id] = [];
            }
            byId[articles[i].section_id].push(articles[i]._id);
        }
        // console.log('byId',byId);
        return byId;
    },
    advanceAddArticleToSection: function(mongoIdArray, sectionId){
        check(sectionId, Number);

        var advanceIdList = sorters.findOne({'name': 'advance'});
        var position = advanceIdList.order.length;
        var advanceArticles = articles.find({ '_id': { '$in': advanceIdList.order } }).fetch();
        var advanceArticlesById = Meteor.organize.articlesByMongoId(advanceArticles);

        // go through all the Mongo IDs in the advance list and find the first article with the section id for the article to insert
        for (var i=0; i<advanceIdList.order.length; i++) {
            if (advanceArticlesById[advanceIdList.order[i]] && advanceArticlesById[advanceIdList.order[i]].section_id === sectionId) {
                position = i;
                i = advanceIdList.order.length;
            }
        }

        return sorters.update({name : 'advance'}, {$push : {
            'order': { $each: mongoIdArray, $position: position }
        }});
    },
    advanceAddArticleListToSection: function(mongoIdList, sectionId){
        // console.log('advanceAddArticleToSection',mongoIdList.length, sectionId);
        if (typeof sectionId === String){
            sectionId = parseInt(sectionId);
        }

        var sorts = sorters.findOne({'name': 'advance'});
        var position = sorts.order.length;
        for(var i=0; i < sorts.order.length; i++) {
            match = articles.findOne({ _id:sorts.order[i], section_id:sectionId });
            if(match) {
                position = i;
                i = sorts.order.length;
            }
        }

        return sorters.update({name : 'advance'}, {$push : {
            'order': {
                $each: mongoIdList,
                $position: position
        }}});
    }
});
