Meteor.methods({
	findAuthorByName: function(nameF, nameL){
		return authors.findOne({'name_first' : nameF, 'name_last' : nameL});
	},
	addAuthor: function(authorData){
		return authors.insert(authorData);		
	},
	addAffiliationToAuthor: function(mongoId,affiliation){
		// console.log('--addAffiliationToAuthor | mongoId = '+ mongoId + ' / affiliation = ' + affiliation);
		return authors.update({'_id' : mongoId}, {$addToSet: {'affiliations':affiliation}});
	}
});