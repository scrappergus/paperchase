Meteor.methods({
  indexDoc: function(id) {},
  indexJournal: function() {},
  search: function(query) {
    var mongoClient = Meteor.npmRequire('mongodb').MongoClient;
    var esClient = Meteor.npmRequire('elasticsearch').Client({
      host: Meteor.settings.elasticsearch
    });

    function getArticles(ids) {
      return mongoClient.connect(Meteor.settings.mongodb)
        .then(function(db) {
          return db.collection('articles').find({
            _id: {
              $in: ids
            }
          }).toArray();
        });
    }

    function queryElasticsearch(query) {
      var must = [];

      if (query.title) {
        must.push({
          match: {
            title: {
              query: query.title,
              operator: 'and'
            }
          }
        });
      }

      if (query.abstract) {
        must.push({
          match: {
            abstract: {
              query: query.abstract,
              operator: 'and'
            }
          }
        });
      }

      if (query.authors) {
        must.push({
          match: {
            authors: {
              query: query.authors,
              operator: 'and'
            }
          }
        });
      }

      return new Promise(function(resolve, reject) {
        esClient.search({
          size: 100,
          index: Meteor.settings.index,
          body: {
            query: {
              bool: {
                must: must
              }
            }
          }
        }, function(err, results) {
          err ? reject(err) : resolve(results);
        });
      });
    }

    function search(query, cb) {
      return queryElasticsearch(query)
        .then(function(results) {
          var ids = results.hits.hits.map(function(result) {
            return result._id;
          });

          return getArticles(ids);
        })
        .then(function(results) {
          cb(null, results);
        })
        .catch(cb);
    }

    var wrappedSearch = Meteor.wrapAsync(search);
    return wrappedSearch(query);
  }
});
