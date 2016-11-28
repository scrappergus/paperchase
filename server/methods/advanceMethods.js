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
                fut['return'](true);
            }
        });
        return fut.wait();
    },
    updateAdvanceResearch: function(articles){
        var fut = new future();
        var track = 0;
        var recent = 0;
        var updated = 0;
        var result = {};
        var order = sorters.findOne({name:'advance'});
        var orderBySectionId = Meteor.call('orderBySectionId',order.articles);
        var total = 0;
        for(var a in articles){
            total++;
        }
        // update all article docs
        // and get order ready to update
        for(var article in articles){
            track++;
            // console.log(article, articles[articles]);
            var updateObj = {};
                updateObj.advance = true; // below the method advanceMoveArticle will pull from sorters, which will then set article advance to false (via sorters upddate collection hook), so for the updateArticle after, reset to advance
            var updateArticle = false;
            if(articles[article] === true){
                // recent checked
                updateObj.section_id = 0;
                recent++;
                if(orderBySectionId[0] && orderBySectionId[0].indexOf(article) == -1 ){
                    // article was added to Recent Research Papers
                    updateArticle = true;
                } else if(!orderBySectionId[0]){
                    updateArticle = true;
                }
            }else{
                // recent NOT checked
                if(orderBySectionId[0] && orderBySectionId[0].indexOf(article) != -1 ){
                    // article was in Recent Research Papers but now removed
                    updateArticle = true;
                }
                updateObj.section_id = 5;
            }
            if(updateArticle){
                Meteor.call('advanceMoveArticle', article, updateObj.section_id, function(error,result){
                    if(result){
                        updateObj.debug_moved_recent_research = updateObj.section_id === 5 ? 'Out of Recent' : 'Into Recent';
                        Meteor.call('updateArticle', article, updateObj, function(error,result){
                            if(result){
                                updated++;
                            }
                        });
                    }
                });

            }

            if(track == total){
                result = {
                    recent: recent,
                    updated: updated
                };
                fut.return(result);
            }
        }

        return fut.wait();
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
    advanceAddArticleToSection: function(mongoId, sectionId){
        // console.log('advanceAddArticleToSection',mongoId, sectionId);

        check(mongoId, String);
        check(sectionId, Number);

        var sorts = sorters.findOne({'name': 'advance'});
        var position = sorts.order.length;
        for(var i=0; i < sorts.order.length; i++) {
            match = articles.findOne({_id:sorts.order[i], section_id:sectionId});
            if(match) {
                position = i;
                i = sorts.order.length;
            }
        }

        return sorters.update({name : 'advance'}, {$push : {
            'order': {
                $each: [mongoId],
                $position: position
        }}});
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
    },
    advanceMoveArticle: function(mongoId, newSectionId){
        // console.log('advanceMoveArticle',mongoId,newSectionId)
        var fut = new future();
        Meteor.call('sorterRemoveItem', 'advance', mongoId, function(error,result){
            if(error){
                fut['return'](error);
            }else if(result){
                Meteor.call('advanceAddArticleToSection', mongoId, newSectionId, function(error,result){
                    if(error){
                        fut['return'](error);
                    }else if(result){
                        fut['return'](true);
                    }
                });
            }
        });
        return fut.wait();
    }
});
