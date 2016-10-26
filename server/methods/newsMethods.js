Meteor.methods({
    conferencesPastAndFuture: function(articles){
        var today = new Date();
        var result = {};
        result.past = [];
        result.future = [];

        var conferences = newsList.find({display: true, conference: true}, {sort: {'conference_date_start': 1}}).fetch();

        conferences.forEach(function(conference){
            if ( conference.conference_date_start && conference.conference_date_start < today) {
                result.past.push(conference);
            } else {
                result.future.push(conference);
            }
        });

        result.past.reverse();

        return result;
    }
});
