Meteor.methods({
    sorterAddItem: function(listName,mongoId){
        var fut = new future();
        var journal = journalConfig.findOne();
        // console.log('sorterAddItem',listName,mongoId);
        // not always used for articles. for ex, use this for about and for authors sections.
        // TODO add to the beginning of set

        if(listName == 'advance' && journal.journal.short_name === 'oncotarget') {
            var advanceOrder;
            //find the position to insert at
            article = articles.findOne({_id: mongoId});
            if(article) {
                advanceOrder = sorters.findOne({name: 'advance'});
                if(advanceOrder.order.indexOf(mongoId) == -1){
                    Meteor.call('advanceAddArticleToSection', mongoId, article.section_id, function(error,result){
                        if(error){
                            fut.throw(error);
                        }
                        else if(result){
                            fut.return(true);
                        }
                    });
                }
                else{
                    fut.return(true);
                }
            }
        }
        else {
            var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}},{upsert: true});
            fut.return(res);
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    },
    sorterRemoveItem: function(listName, mongoId){
        var fut = new future();
        sorters.update({name : listName}, {$pull : {'order' : mongoId}}, function(errorSorter, resultSorter){
            if(resultSorter && listName === 'advance'){
                var articleUpdateObj = { advance : false };
                if (Meteor.settings.public.journal.name === 'Oncotarget') {
                    articleUpdateObj.debug_sorter_remove_article = true;
                }
                Meteor.call('updateArticle', mongoId, articleUpdateObj, function(errorArticle, resultArticle){
                    if (resultArticle) {
                        fut.return(true);
                    } else {
                        fut.throw(errorArticle);
                    }
                });
            } else if(resultSorter) {
                fut.return(true);
            } else {
                fut.throw(errorSorter);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    },
    batchSorterRemoveItem: function(listName,idList){
        var removed = idList.map(function(mongoId){
            Meteor.call('sorterRemoveItem',listName, mongoId, function(error,result){
                if(result){
                    return mongoId;
                }
            });
        });
        // return fut.wait();
        return removed;
    },
    updateList: function(listName, list){
        // console.log('... sorterUpdateList = ' + listName );
        // update sorters collection
        if(listName && list){
            return sorters.update({name : listName}, {$set : {order: list}},{upsert: true});
        }
        else{
            return false;
        }
    },
    getListWithData: function(listName){
        var sorterData,
            collectionData,
            itemsById = {},
            result = [];

        sorterData = sorters.findOne({name : listName});

        if(sorterData && sorterData.order){
            collectionData = global[listName].find({'_id':{'$in':sorterData.order}}).fetch();

            if(collectionData){

                collectionData.forEach(function(itemData){
                    itemsById[itemData._id] = itemData;
                });

                sorterData.order.forEach(function(itemId){
                    if(itemsById[itemId]){
                        result.push(itemsById[itemId]);
                    }else{
                        console.error('could not find ID in data list: ', listName, itemId);
                    }
                });
            }
        }

        return result;
    }
});
