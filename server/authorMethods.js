Meteor.methods({
	findAuthorByName: function(nameF, nameL){
		return authors.findOne({'name_first' : nameF, 'name_last' : nameL});
	},
	addAuthor: function(authorData){
		return authors.insert(authorData);		
	},
	addArticleToAuthor: function(mongoId, articleId ){
		return authors.update({'_id' : mongoId}, {$addToSet: {'article_ids':articleId}});		
	}
});