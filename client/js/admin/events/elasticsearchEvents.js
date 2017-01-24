// ElasticSearch
// ----------------
Template.AdminElasticSearch.events({
        'click #indexA': function(e){
            var config = journalConfig.findOne();
            var newElasticSearch = {'elasticsearch':config.elasticsearch};
            newElasticSearch.elasticsearch.currentIndex = 'index-a';
            newElasticSearch.elasticsearch.idleIndex = 'index-b';
            var updated = journalConfig.update({'_id' : config._id}, {$set: newElasticSearch});
            Meteor.call('aliasIndex');
        },
        'click #indexB': function(e){
            var config = journalConfig.findOne();
            var newElasticSearch = {'elasticsearch':config.elasticsearch};
            newElasticSearch.elasticsearch.currentIndex = 'index-b';
            newElasticSearch.elasticsearch.idleIndex = 'index-a';
            var updated = journalConfig.update({'_id' : config._id}, {$set: newElasticSearch});
            Meteor.call('aliasIndex');
        },
        'click #reIndexButton': function(e) {
            Session.set('elasticSearchIndexing',true);
            Meteor.call('indexJournal', function(err) {
                    Session.set('elasticSearchIndexing',false);
                });
        }
    });
