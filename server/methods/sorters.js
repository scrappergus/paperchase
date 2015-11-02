Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		console.log('..sorterAddArticle ' + listName + ' ' + mongoId);
		// TODO add to the beginning of set
		var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}});
		return res;
	},
	sorterRemoveArticle: function(listName,mongoId){
		console.log('..sorterRemoveArticle ' + listName + ' ' + mongoId);
		var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
		return res;
	},
	updateList: function(listName, list, remove){
		console.log('..updateList ' + listName + ' ' + remove);
		// console.log('... sorterUpdateList');

		// update articles collection--- use collection hook on sorters instead?
		for(var a = 0 ; a < list.length ; a++){
			Meteor.call('updateArticle', list[a], {advance:true});
		}
		for(var r = 0 ; r < remove.length ; r++){
			Meteor.call('updateArticle', remove[r], {advance:false});
		}

		// update sorters collection
		return sorters.update({name : listName}, {$set : {order: list}});
	}
});