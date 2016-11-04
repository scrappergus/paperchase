Meteor.methods({
    articlesFindOneWhere : function(where){
        return articles.findOne(where);
    }
});
