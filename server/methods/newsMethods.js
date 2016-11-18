Meteor.methods({
    conferencesPastAndFuture: function(articles){
        var today = new Date();
        var result = {};
        var yearKeys = [];
        var past = {};
        result.future = [];
        result.past = [];

        var conferences = newsList.find({display: true, conference: true}, {sort: {'conference_date_start': 1}}).fetch();

        conferences.forEach(function(conference){
            if ( conference.conference_date_start && conference.conference_date_start < today) {
                var confDate =  new Date(conference.conference_date_start);
                var confYear = confDate.getFullYear();
                if (!past[confYear]) {
                    past[confYear] = [];
                }
                past[confYear].push(conference);
            } else {
                result.future.push(conference);
            }
        });

        // Descending dates within past year
        for (var pastYear in past){
            past[pastYear].reverse();
        }

        // Descending years
        for (var k in past) {
          if (past.hasOwnProperty(k)) {
            yearKeys.push(k);
          }
        }
        yearKeys.sort();
        yearKeys.reverse();

        len = yearKeys.length;

        for (i = 0; i < len; i++) {
          k = yearKeys[i];
          result.past.push({ year: k, conferences: past[k] });
        }

        return result;
    }
});
