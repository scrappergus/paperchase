Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		// TODO add to the beginning of set
		var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}});
		return res;
	},
	sorterRemoveArticle: function(listName,mongoId){
		var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
		return res;
	}
});