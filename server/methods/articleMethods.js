Meteor.methods({
    articlesFindOneWhere : function(where){
        return articles.findOne(where);
    },
    getArticle: function(articleId) {
        var article = articles.findOne(
            { $or: [ { _id: articleId }, { 'ids.pii': articleId } ] }
        );

        if (article) {
            article = Meteor.article.readyData(article);

            return {
                article: article
            };
        }
    },
    getArticleInfo: function(args) {
        var article = articles.findOne({'_id':args._id},{});
        // URL is based on Mongo ID. But a user could put PII instead, if so send PII info to redirect
        if(article){
          return articles.find({'_id':args._id},{});
        }else if(articles.findOne({'ids.pii':args._id},{})){
          return articles.find({'ids.pii':args._id},{});
        }else{
          return [];
        }
    },
    getArticleIssue: function(args) {
        var articleInfo = articles.findOne({_id : args._id});
        var issueInfo;
        if(articleInfo && articleInfo.issue_id){
          issueInfo = issues.find({_id : articleInfo.issue_id});
        }
        // console.log('articleInfo',articleInfo.issue_id);
        if(issueInfo){
          return issueInfo;
        }else{
          return [];
        }
    },
    getArticleTypes: function(args) {
        return articleTypes.find({},{});
    }
});
