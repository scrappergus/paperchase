Meteor.methods({
	advancePublish: function(list){
		var out = [];
		for (var i = 0; i < list.length; i++){
			var article = articles.findOne({'_id':list[i].article_id});
			var section = sections.findOne({'section_id' : article['section_id']});
			  article['section_name'] = section['section_name'];

			out.push(article);
		}

		publish.insert({
				name: 'advance'
				,pubtime: new Date
				,data: out
			});
	},
	compareWithLegacy: function(legacyArticles){
		// console.log('..compareWithLegacy');
		var allPii = {};
		var result = {};
		result.paperchaseOnly = [];
		result.ojsOnly = [];
		result.allPiiCount = 0;
		if(legacyArticles){
			// OJS Articles
			result.ojsCount = legacyArticles.length;
			legacyArticles.forEach(function(ojsA){
				allPii[ojsA.pii] = {
					ojs : true
				}
			});
			// Paperchase Articles
			var order = sorters.findOne({name:'advance'});
			var pcArticles = order.articles;
			result.paperchaseCount = pcArticles.length;
			pcArticles.forEach(function(pcA){
				if(allPii[pcA.ids.pii]){
					allPii[pcA.ids.pii] = {
						paperchase: true
					}
				}else{
					allPii[pcA.ids.pii] = {
						paperchase: false
					} // needed for counting below
					result.paperchaseOnly.push(pcA);
				}
			});
			// Compare. Get articles only in OJS
			for(var pii in allPii){
				result.allPiiCount++;
				if(!allPii[pii].paperchase){
					var ojsObj = {
						pii: pii,
						query: {
							id : pii,
							journal: 'oncotarget',
							id_type: 'pii',
							advance: true
						}
					}

					result.ojsOnly.push(ojsObj);
				}
			}
			return result;
		}else{
			return;
		}
	}
});
