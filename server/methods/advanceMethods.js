Meteor.methods({
    advancePublish: function(){
        var list = sorters.findOne({name:'advance'});
        list = list.articles;
        var out = [];
        for (var i = 0; i < list.length; i++){
            var article = list[i];
            var section = sections.findOne({'section_id' : article['section_id']});
              article['section_name'] = section['section_name'];

            out.push(article);
        }

        return publish.insert({
                name: 'advance'
                ,pubtime: new Date
                ,data: out
            });
    },
    orderBySectionId: function(articles){
        var byId = {};
        for(var i=0 ; i<articles.length ; i++){
            if(!byId[articles[i].section_id]){
                byId[articles[i].section_id] = [];
            }
            byId[articles[i].section_id].push(articles[i]._id);
        }
        // console.log('byId',byId);
        return byId;
    }
});
