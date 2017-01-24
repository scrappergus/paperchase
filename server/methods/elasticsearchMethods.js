Meteor.methods({
    aliasIndex: function() {
        var INDEX_URL = Meteor.settings.elasticsearch + '/_aliases';
        var asPromised = Meteor.npmRequire('superagent-as-promised');
        var superagent = asPromised(Meteor.npmRequire('superagent'));
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;
        var config = journalConfig.findOne().elasticsearch;

        return superagent.post(INDEX_URL).send({
                "actions" : [
                { "add" : { "index" : "oncotarget-"+config.currentIndex, "alias" : config.primaryIndex} },
                { "remove" : { "index" : "oncotarget-"+config.idleIndex, "alias" : config.primaryIndex } }
                ]
            });
    },
    indexDoc: function(pii) {
        var INDEX_URL = Meteor.settings.elasticsearch + '/' + Meteor.settings.index + '/';
        var asPromised = Meteor.npmRequire('superagent-as-promised');
        var superagent = asPromised(Meteor.npmRequire('superagent'));
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;
        var articleURLTemplate = journalConfig.findOne().elasticsearch.articleURLTemplate;


        function indexArticle(doc) {
          return superagent.put(INDEX_URL + 'article/' + doc._id).send({
            title: doc.title,
            authors: getAuthorNameString(doc.authors),
            abstract: doc.abstract,
            keywords: getKeywordNameString(doc.keywords),
            volume: doc.volume,
            issue: doc.issue, 
            articleType: getArticleType(doc.article_type),
            url: getURLString(doc.ids.pii)
          });
        }

        function getArticleType(type) {
            if(type && type.name) {
                return type.name;
            }
            else {
                return null;
            }
        }

        function getURLString(pii) {
            return articleURLTemplate.replace("[pii]", pii);
        }

        function getAuthorNameString(authors) {
          return !Array.isArray(authors) ? '' : authors
            .map(function(author) {
              return Object.keys(author)
                .map(function(key) {
                  return author[key];
                })
            .join(' ').trim();
            })
            .join(', ');
        }

        function getKeywordString(keywords) {
          return !Array.isArray(keywords) ? '' : keywords
            .map(function(keyword) {
              return Object.keys(keyword)
                .map(function(key) {
                  return keyword[key];
                })
                .join(' ');
            })
            .join(', ');
        }

        function getArticle(pii) {
          return new Promise(function(resolve, reject) {
            mongoClient.connect(Meteor.settings.mongodb, function(err, db) {
              if (err) return reject(err);
              db.collection('articles').findOne({'ids.pii': pii}, function (err, doc) {
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
        var config = journalConfig.findOne();
        var INDEX_URL = Meteor.settings.elasticsearch + '/' + config.elasticsearch.indexPrefix+'-'+ config.elasticsearch.idleIndex+ '/';
        var asPromised = Meteor.npmRequire('superagent-as-promised');
        var superagent = asPromised(Meteor.npmRequire('superagent'));
        var mongoClient = Meteor.npmRequire('mongodb').MongoClient;
        var articleURLTemplate = journalConfig.findOne().elasticsearch.articleURLTemplate;

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
            var esObj = {
                title: doc.title,
                authors: getAuthorNameString(doc.authors),
                abstract: doc.abstract,
                volume: doc.volume,
                issue: doc.issue, 
                keywords: getKeywordString(doc.keywords),
                articleType: getArticleType(doc.article_type),
                url: getURLString(doc.ids.pii)
            };

            return superagent.put(INDEX_URL + 'article/' + doc._id).send(esObj);
        }


        function getArticleType(type) {
            if(type && type.name) {
                return type.name;
            }
            else {
                return null;
            }
        }

        function getURLString(pii) {
            return articleURLTemplate.replace("[pii]", pii);
        }

        function getAuthorNameString(authors) {
          return !Array.isArray(authors) ? '' : authors
            .map(function(author) {
              return Object.keys(author)
                .map(function(key) {
                        if(['name_last', 'name_first', 'name_middle', 'first_name', 'last_name', 'middle_name'].indexOf(key) > -1 && author[key] != '') {
                            return author[key];
                        }
                })
            .join(' ').trim();
            })
            .join(', ');
        }

        function getKeywordString(keywords) {
          return !Array.isArray(keywords) ? '' : keywords
            .join(', ');
        }


        function getArticlestream() {
          return new Promise(function(resolve, reject) {
            mongoClient.connect(Meteor.settings.mongodb, function(err, db) {
              if (err) return reject(err);
              db.collection('articles', function(err, articles) {
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
                Promise.delay(count * 500)
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

          if (query.keywords) {
            must.push({
              match: {
                authors: {
                  query: query.keywords,
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
