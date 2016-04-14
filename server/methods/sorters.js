Meteor.methods({
    sorterAddItem: function(listName,mongoId){
        var fut = new future();
        // console.log('sorterAddItem',mongoId);
        // not always used for articles. for ex, use this for about and for authors sections.
        // TODO add to the beginning of set

        if(listName == 'advance') {
            var advanceOrder;
            //find the position to insert at
            article = articles.findOne({_id: mongoId});
            if(article) {
                advanceOrder = sorters.findOne({name: 'advance'});
                if(advanceOrder.order.indexOf(mongoId) == -1){
                    Meteor.call('advanceAddArticleToSection',mongoId, article.section_id, function(error,result){
                        if(result){
                            fut['return'](true);
                        }else{
                            fut['return'](false);
                        }
                    });
                }
            }
        } else {
            var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}},{upsert: true});
            fut['return'](res);
        }

        return fut.wait();
        // return res;
    },
    sorterRemoveItem: function(listName,mongoId){
        var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
        return res;
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
        return sorters.update({name : listName}, {$set : {order: list}},{upsert: true});
    }
});
