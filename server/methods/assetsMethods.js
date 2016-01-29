Meteor.methods({
	articleAssests: function(mongoId){
		// console.log('... articleAssests: Mongo ID ', mongoId);
		var article = articles.findOne({_id : mongoId});
		var assets = {};
		if(article.ids.paperchase_id){
			var paperchaseId = article.ids.paperchase_id;
			// console.log('paperchaseId',paperchaseId);
			// XML
			var xmlAsset = xmlCollection.findOne({'ids.paperchase_id' : paperchaseId});
			if(xmlAsset && xmlAsset.xml_url){
				assets.xml_url = xmlAsset.xml_url;
			}
			// PDF
			var pdfAsset = pdfCollection.findOne({'ids.paperchase_id' : paperchaseId});
			if(pdfAsset && pdfAsset.pdf_url){
				assets.pdf_url = xmlAsset.pdf_url;
			}
		}
		// console.log(assets);
		return assets;
	}
});