Meteor.methods({
    'getEjpAccepted' : function(){
        console.log('..getAccepted');
        var ejpConfig = Meteor.call('getConfigSubmission');
        var cookieValue = [ejpConfig['cookie']],
            agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
            requestURL = ejpConfig.url + 'cgi-bin/main.plex',
            username = ejpConfig.username,
            password = ejpConfig.password,
            journalEjpId = ejpConfig.journalEjpId;


            var login_res = Meteor.http.post(requestURL, {
                params: {
                    timeout: 30000,
                    form_type: 'login_results',
                    j_id : journalEjpId,
                    login: username,
                    password: password
                },
                headers: {
                    'Accept' : '*/*',
                    'Connection' : 'Keep-Alive',
                    'User-Agent' : agent,
                    'cookie' : cookieValue,
                    'Referer' : ejpConfig['url'] + '/cgi-bin/main.plex',
                    'Origin' : ejpConfig['url']
                }
            });

            if(login_res.statusCode == 200){
                // console.log(login_res.content);
                var msPostStart = login_res.content.lastIndexOf('Post Decision') + 88;
                var msPostEnd = msPostStart + 28;
                var msPostDescisionsUrl = login_res.content.substring(msPostStart,msPostEnd);
                console.log('ms_id_key for Post Deciscion URL = ');
                console.log(msPostDescisionsUrl);
                var newCookies = login_res['headers']['set-cookie'];

                for(c = 0 ; c < newCookies.length ; c++){
                    var cookieCrumbs = newCookies[c].split(';');
                    // cookieValue.push(cookieCrumbs[0]);
                    //cookieValue.push(newCookies[c]);
                    // console.log(newCookies[c]);
                    if(newCookies[c].indexOf('expires') !== -1) {

                    }else{
                        // cookieValue.push(newCookies[c]);
                    }
                }
                console.log(cookieValue);

                //first path to take
                var manuscriptsPath = '?form_type=ndt_folder&j_id=459&ms_id_key=' + msPostDescisionsUrl + '&ft_key=NQcbqxCKr20xjQr3VmgxSg&is_open_1900=1&folder_id=1900&is_open_view_1900=11&role=20'
                // console.log(manuscriptsPath);
                var manuscriptsPath = '';
                Meteor.http.get(requestURL + manuscriptsPath ,  {
                    params: {
                        login: username,
                        password: password,
                        form_type: 'ndt_folder',
                        j_id: 459,
                        timeout: 30000,
                        ms_id_key: msPostDescisionsUrl,
                        ft_key: 'NQcbqxCKr20xjQr3VmgxSg',
                        is_open_1900: 1,
                        folder_id: 1900,
                        is_open_view_1900: 11,
                        role: 20
                    },
                    headers: {
                        'Accept' : '*/*',
                        'Connection' : 'Keep-Alive',
                        'User-Agent' : agent,
                        'cookie' : JSON.stringify(cookieValue),
                        'Upgrade-Insecure-Requests' : 1,
                        'Content-Type' : 'application/x-www-form-urlencoded'
                    }
                }, function(error,result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                    }else{
                        console.log(result.content);
                    }
                });
            }
    }
});