// These are for organizing lists of papers in section
Meteor.methods({
    preprocessSectionArticles: function(articles){
        // console.log('..preprocessSectionArticles');console.log(articles);
        var fut = new future();
        // get assets
        for(var i=0 ; i< articles.length ; i++){
            // console.log(articles[i]['_id']);
            articles[i]['assets'] = Meteor.call('availableAssests', articles[i]['_id']);
            if(i == parseInt(articles.length - 1)){
                // console.log(articles);
                articles = Meteor.organize.groupArticles(articles);
                fut['return'](articles);
            }
        }
        return fut.wait();
    }
});