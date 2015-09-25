Meteor.methods({
	'getEjpAccepted' : function(){
		console.log('..getAccepted');
		var cookieValue = ['aging_ejp=1'],
			agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
			requestURL = ejpCred.url + 'cgi-bin/main.plex',
			username = ejpCred.username,
			password = ejpCred.password,
			journalEjpId = ejpCred.journalEjpId;


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
					'cookie' : cookieValue
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
					cookieValue.push(cookieCrumbs[0]);
				}
				console.log(cookieValue);

				//first path to take
				// var manuscriptsPath = 'cgi-bin/main.plex?form_type=ndt_folder&amp;j_id=459&amp;ms_id_key=' + msPostDescisionsUrl + '&amp;ft_key=NQcbqxCKr20xjQr3VmgxSg&amp;is_open_1900=1&amp;folder_id=1900&amp;is_open_view_1900=11&amp;role=20'
				var manuscriptsPath = '';
				Meteor.http.get(requestURL + manuscriptsPath ,  {
		           	headers: {
						'Accept' : '*/*',
						'Connection' : 'Keep-Alive',
						'User-Agent' : agent,
						'cookie' : cookieValue
		          	}
				}, function(error,result){
					if(error){
						console.log('ERROR');
						console.log(error);
					}else{
						console.log(result);
					}
				});
			}
		}
	// }
});