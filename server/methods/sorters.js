Meteor.methods({
	sorterAddItem: function(listName,mongoId){
		// not always used for articles. for ex, use this for about and for authors sections.
		// TODO add to the beginning of set

		if(listName == 'advance') {
			//find the position to insert at
			article = articles.findOne({"_id": mongoId});
			if(article) {
				Meteor.call('sorterRemoveItem', listName, mongoId);
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
		} else {
			var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}},{upsert: true});
		}

		return res;
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
