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
			journalEjpId = ejpCred.journalEjpId,
			authCredString = username + ':' + password;


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
			ms = resHtml.substring(resHtml.lastIndexOf('id=\'ms_id_key\'')+1,resHtml.lastIndexOf('input'));
			ms = ms.replace('d=\'ms_id_key\' value=', '').replace('\' />','').replace('\'','');
			console.log('ms_id_key ===== ');
			console.log(ms);

			console.log('res HEADERS =====');
			console.log(res.headers);

			//SET COOKIES
			if(res['headers']['set-cookie']){
				var cookies = res['headers']['set-cookie'];
				for(var c = 0 ; c < cookies.length ; c++){
					var cookiePieces = cookies[c].split('=');
					console.log('cookie  =====');
					console.log(cookies[c]);
					Meteor.cookie.set(cookiePieces[0],cookiePieces[1]);
				}
			}
		
			//LOGIN
			var result = Meteor.http.post(requestURL + 'cgi-bin/main.plex', {
				//auth : authCredString,
				params: {
					form_type: 'login_results',
					j_id : journalEjpId,
					login: username,
					password: password,
					ms_id_key: ms
				},
	           	headers: {
					'Accept' : '*/*',
					'Connection' : 'Keep-Alive',
					'User-Agent' : agent
	          	}
			});


			//GET - get manuscripts
			if (result.statusCode == 200) {
				//SET COOKIES
				if(result['headers']['set-cookie']){
					var cookies = result['headers']['set-cookie'];
					for(var c = 0 ; c < cookies.length ; c++){
						var cookiePieces = cookies[c].split('=');
						console.log('cookie  =====');
						console.log(cookies[c]);
						Meteor.cookie.set(cookiePieces[0],cookiePieces[1]);
					}
				}
				console.log('login HEADERS =====');
				console.log(result.headers);

				// var res;
				// res = Meteor.http.get(requestURL,{
				// 	auth : authCredString,
				// 	params: {
				// 		timeout: 30000
				// 	},
				// 	headers: { 
				// 		'Accept' : '*/*',
				// 		'Connection' : 'Keep-Alive',
				// 		'User-Agent' : agent
				// 	},
				// 	auth : authCredString
				// });
				// if(res){
				// 	console.log('get manuscripts res = ');
				// 	// console.log(res.content);	
				// }
			}		
		}


	}
});