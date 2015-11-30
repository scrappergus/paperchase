Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
        //find the position to insert at
        article = articles.findOne({"_id": mongoId});
        if(article) {
            Meteor.call('sorterRemoveArticle', listName, mongoId);
            sorts = sorters.findOne({'name': listName});
            position = sorts.order.length;
            for(var i=0; i < sorts.order.length; i++) {
                match = articles.findOne({"_id":sorts.order[i], section_id:article.section_id});
                if(match) {
                    position = i;
                    i = sorts.order.length;
                }
            }

            var res = sorters.update({name : listName}, {$push : {
                        'order': {
                            $each: [mongoId],
                            $position: position
                        }}});
        }
		return res;
	},
	sorterRemoveArticle: function(listName,mongoId){
		// console.log('...sorterRemoveArticle');
		var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
		return res;
	},
	updateList: function(listName, list, remove){
		// console.log('... sorterUpdateList');
		// update sorters collection
		var one = sorters.findOne({name : listName});
		return sorters.update({_id : one._id}, {$set : {order: list}});
	}
});
