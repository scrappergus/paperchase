Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		// console.log('...sorterAddArticle');
		// TODO add to the beginning of set
		var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}});
		return res;
	},
	sorterRemoveArticle: function(listName,mongoId){
		// console.log('...sorterRemoveArticle');
		var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
		return res;
	},
	updateList: function(listName, list){
		// console.log('... sorterUpdateList = ' + listName );
		// update sorters collection
		return sorters.update({name : listName}, {$set : {order: list}},{upsert: true});
	}
});