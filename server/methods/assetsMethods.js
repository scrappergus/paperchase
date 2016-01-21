Meteor.methods({
	articleAssests: function(mongoId){
		// console.log('... articleAssests: Mongo ID ', mongoId);
		var article = articles.findOne({_id : mongoId});
		var assets = {};
		if(article.ids.paperchase_id){
			var paperchaseId = article.ids.paperchase_id;
			var xmlAsset = xmlCollection.findOne({paperchase_id : paperchaseId});
			if(xmlAsset && xmlAsset.full_xml){
				assets.full_xml_url = xmlAsset.full_xml;
			}
		}
		// console.log(assets);
		return assets;
	}
});