Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		// console.log('... sorterAddArticle to ' + listName + ' ' + mongoId);
		// TODO add to the beginning of set
		var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}});
		// console.log(res);
	}
});