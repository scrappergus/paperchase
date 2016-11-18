Meteor.methods({
    conferencesPastAndFuture: function(articles){
        var today = new Date();
        var result = {};
        result.past = {};
        result.future = [];

        var conferences = newsList.find({display: true, conference: true}, {sort: {'conference_date_start': 1}}).fetch();

        conferences.forEach(function(conference){
            if ( conference.conference_date_start && conference.conference_date_start < today) {
                var confDate =  new Date(conference.conference_date_start);
                var confYear = confDate.getFullYear();
                if (!result.past[confYear]) {
                    result.past[confYear] = [];
                }
                result.past[confYear].push(conference);
            } else {
                result.future.push(conference);
            }
        });

        for (var pastYear in result.past){
            result.past[pastYear].reverse();
        }

        return result;
    }
});
