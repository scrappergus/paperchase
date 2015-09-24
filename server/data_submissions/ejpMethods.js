Meteor.methods({
	'getEjpAccepted' : function(){
		console.log('..getAccepted');
		var cookie_value,
			msIdKey,
			ms,
			agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
			requestURL = ejpCred.url,
			username = ejpCred.username,
			password = ejpCred.password,
			journalEjpId = ejpCred.journalEjpId;


		//Set initial cookie, get ms_id_key
		var res = Meteor.http.get(requestURL + 'cgi-bin/main.plex', {
           	headers: {
				'Accept' : '*/*',
				'Connection' : 'Keep-Alive',
				'User-Agent' : agent
          	}
		});
		if(res.statusCode == 200){
			//find ms_id_key in the login form
			var resHtml = res.content;
			var keyStart = resHtml.lastIndexOf('id=\'ms_id_key\'')+22;
			var keyEnd = keyStart + 28;
			ms = resHtml.substring(keyStart, keyEnd);

			//SET COOKIES -- set the cookie_value to the response's set-cookie
			cookie_value = res['headers']['set-cookie'];

			//LOGIN and GET Manuscripts
			var manuscriptsPath = 'cgi-bin/main.plex?form_type=ndt_folder&j_id=459&ms_id_key=684ftdWXpqQ0cuPXznOnZIQ2SiQ&ft_key=NQcbqxCKr20xjQr3VmgxSg&is_open_2000=1&folder_id=2000&is_open_view_2000=11&role=20';
			var login_res = Meteor.http.post(requestURL + manuscriptsPath, {
				// auth : authCredString,
				params: {
					timeout: 30000,
					form_type: 'login_results',
					j_id : journalEjpId,
					login: username,
					password: password,
					ms_id_key: ms
				},
	           	headers: {
					'Accept' : '*/*',
					'Connection' : 'Keep-Alive',
					'User-Agent' : agent,
					'cookie' : cookie_value
	          	}
			});
			if(login_res.statusCode == 200){
				console.log(login_res.content);
			}
		}
	}
});