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
	}
});

