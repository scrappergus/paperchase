Meteor.methods({
	sorterAddArticle: function(listName,mongoId){
		// TODO add to the beginning of set
		var res = sorters.update({name : listName}, {$addToSet : {'order' : mongoId}});
		return res;
	},
	sorterRemoveArticle: function(listName,mongoId){
		var res = sorters.update({name : listName}, {$pull : {'order' : mongoId}});
		return res;
	},
	updateList: function(listName, list, remove){
		// console.log('... sorterUpdateList');

		// update articles collection--- use collection hook on sorters instead?
		for(var a = 0 ; a < list.length ; a++){
			console.log('.. advance = ' + a);
			Meteor.call('updateArticle', list[a], {advance:true});
		}
		for(var r = 0 ; r < remove.length ; r++){
			Meteor.call('updateArticle', remove[r], {advance:false});
			console.log('.. remove = ' + a);
		}

		// update sorters collection
		return sorters.update({name : listName}, {$set : {order: list}});
	}
});