Meteor.methods({
	advancePublish: function(list){
        var fut = new future();
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
        }, function (error, result) {
            if(error){
                throw new Meteor.Error(error);
            }else if(result){
                fut['return'](result);
            }
        });
        return fut.wait();
	}
});

