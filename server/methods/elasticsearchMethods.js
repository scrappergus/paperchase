Meteor.methods({
    indexDoc: function(pii) {
        var INDEX_URL = Meteor.settings.elasticsearch + '/' + Meteor.settings.index + '/';
        var asPromised = Meteor.npmRequire('superagent-as-promised');
        var superagent = asPromised(Meteor.npmRequire('superagent'));
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;

        function indexArticle(doc) {
          return superagent.put(INDEX_URL + 'article/' + doc._id).send({
            title: doc.title,
            authors: getAuthorNameString(doc.authors),
            abstract: doc.abstract
          });
        }

        function getAuthorNameString(authors) {
          return !Array.isArray(authors) ? '' : authors
            .map(function(author) {
              return Object.keys(author)
                .map(function(key) {
                  return author[key];
                })
                .join(' ');
            })
            .join(', ');
        }

        function getArticle(hit) {
          return new Promise(function(resolve, reject) {
            mongoClient.connect(Meteor.settings.mongodb, function(err, db) {
              if (err) return reject(err);
              db.collection('articles').findOne({'ids.pii': hit.pii}, function (err, doc) {
                      db.close();
                err? reject(err): resolve(doc);
              })
            });
          });
        }

        function index(pii, cb) {
          return getArticle(pii)
            .then(indexArticle)
            .then(function() {
              console.log('indexed ' + pii);
            cb(null);
            })
            .catch(function(err) {
              console.log('index creation failed', err);
              cb(err);
            });
        }

        var wrappedIndex = Meteor.wrapAsync(index);
        return wrappedIndex(pii);
    },

    indexJournal: function() {
        var INDEX_URL = Meteor.settings.elasticsearch + '/' + Meteor.settings.index + '/';
        var asPromised = Meteor.npmRequire('superagent-as-promised');
        var superagent = asPromised(Meteor.npmRequire('superagent'));
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;

        var settings = {
          "settings": {
            "analysis": {
              "analyzer": {
                "kstem": {
                  "type": "custom",
                  "tokenizer": "standard",
                  "filter": ["standard", "lowercase", "stop", "kstem"]
                }
              },
              "filter": {
                "minimal_english": {
                  "type": "stemmer",
                  "name": "minimal_english"
                }
              }
            }
          },
          "mappings": {
            "document": {
              "properties": {
                "title": {
                  "type": "string",
                  "analyzer": "kstem"
                },
                "abstract": {
                  "type": "string",
                  "analyzer": "kstem"
                }
              }
            }
          }
        };

        function deleteIndex() {
          return superagent.del(INDEX_URL).catch(function() {
            console.log('unable to delete index');
          });
        }

        function createIndex() {
          return superagent.put(INDEX_URL).send(settings);
        }

        function indexArticle(doc) {
          return superagent.put(INDEX_URL + 'article/' + doc._id).send({
            title: doc.title,
            authors: getAuthorNameString(doc.authors),
            abstract: doc.abstract
          });
        }

        function getAuthorNameString(authors) {
          return !Array.isArray(authors) ? '' : authors
            .map(function(author) {
              return Object.keys(author)
                .map(function(key) {
                  return author[key];
                })
                .join(' ');
            })
            .join(', ');
        }

        function getArticlestream() {
          return new Promise(function(resolve, reject) {

            mongoClient.connect(Meteor.settings.mongodb, function(err, db) {
              if (err) return reject(err);
              db.collection('articles', function(err, articles) {
                      console.log('====> getArticleStream');
                if (err) return reject(err);
                resolve(articles.find({}).stream());
              });
            });
          });
        }

        function mapArticles(stream) {
          return new Promise(function(resolve, reject) {
            var count = 0;
            stream
              .on('data', function(doc) {
                Promise.delay(count * 250)
                  .then(function() {
                    return indexArticle(doc);
                  })
                  .then(function() {
                    console.log('completed doc', doc._id);
                  })
                  .catch(function(err) {
                    console.log('errored doc', doc._id, '\n', err, '\n');
                  });
                console.log('started doc', doc._id, count++);
              })
              .on('err', function(err) {
                console.log('err', err);
              })
              .on('end', function() {
                console.log('DB read complete');
                resolve();
              });
          });
        }

        function indexArticles(cb) {
          return deleteIndex()
            .then(createIndex)
            .then(getArticlestream)
            .then(mapArticles)
            .then(function() {
              console.log('index creation complete');
            cb(null);
            })
            .catch(function(err) {
              console.log('index creation failed', err);
              cb(err);
            });
        }

        var wrappedIndex = Meteor.wrapAsync(indexArticles);
        return wrappedIndex();

    },

    search: function(query) {
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;
        var esClient = Meteor.npmRequire('elasticsearch').Client({
          host: Meteor.settings.elasticsearch
        });

        function getArticles(ids) {
          return mongoClient.connect(Meteor.settings.mongodb)
            .then(function(db) {
                    var output = db.collection('articles').find({
                            _id: {
                                $in: ids
                            }
                        }).toArray(); 
                    db.close();

                    return output;
            });
        }

        function queryElasticsearch(query) {
          var must = [];

          if (query.general) {
              must.push({
                      multi_match: {
                          query: query.general,
                          fields: ['title', 'abstract', 'authors', 'keywords']
                      }
                  });
          }

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

          if (query.keywords) {
            must.push({
              match: {
                keywords: {
                  query: query.keywords,
                  operator: 'and'
                }
              }
            });
          }


          return new Promise(function(resolve, reject) {
            esClient.search({
              size: 1000,
              index: query.impactSearch ? Meteor.settings.publisherIndex : Meteor.settings.index,
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
              var hits = results.hits.hits.map(function(result) {
                      return result;
              });
          return hits;
          //look at not needing to connect to the mongo db, so short circuiting this.

              return getArticles(hits);
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
