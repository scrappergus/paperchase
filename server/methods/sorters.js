Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		// console.log('...sorterAddArticle');
		// TODO add to the beginning of set

        //find the position to insert at
        article = articles.findOne({"_id": mongoId});
        if(article) {
            Meteor.call('sorterRemoveArticle', 'advance', mongoId);
            sorts = sorters.findOne({'name': 'advance'});
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
		return sorters.update({name : listName}, {$set : {order: list}});
	}
});
