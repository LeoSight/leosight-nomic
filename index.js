require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();

// pokud chcete bota testovat u sebe, je nutné vytvořit soubor .env s obsahem: DISCORD_TOKEN = "zde bude token bota"
const TOKEN = process.env.DISCORD_TOKEN;

const VERSION = "1.0.4"; // verze bota

// načtení configu ze souboru
let rawconfig = fs.readFileSync('config.json');
const CONFIG = JSON.parse(rawconfig);

const GUILD					= CONFIG.GUILD; // ID serveru
const BOT_ID				= CONFIG.BOT_ID; // ID bota
const CHANNEL_RULES			= CONFIG.CHANNEL_RULES; // místnost s pravidly
const CHANNEL_PLAYERS		= CONFIG.CHANNEL_PLAYERS; // místnost s hráči a jejich bilancí
const CHANNEL_POLLS			= CONFIG.CHANNEL_POLLS; // místnost s hlasováním
const CHANNEL_PROPOSALS		= CONFIG.CHANNEL_PROPOSALS; // místnost, kam se odesílají návrhy
const CHANNEL_TRANSACTIONS	= CONFIG.CHANNEL_TRANSACTIONS; // místnost, kde se provádí transakce
const CHANNEL_DONE			= CONFIG.CHANNEL_DONE; // místnost, kam se ukládají dokončená hlasování
const CHANNEL_REMOVED		= CONFIG.CHANNEL_REMOVED; // místnost, kam se ukládají odstraněná pravidla


// načtení dat ze souboru
let rawdata = fs.readFileSync('data.json');
let jsonData = JSON.parse(rawdata);

client.once('ready', () => {
	console.log(`LS Nomic Bot v${VERSION} načten!`);
	console.log(`Načteno ${jsonData.rules.length} pravidel a ${Object.keys(jsonData.players).length} hráčů`);

	savePlayers();
	replaceRules();
	replacePlayers();
});

// načte všechny hráče z Discordu a uloží jejich přezdívky do JSONu
function savePlayers() {
	client.guilds.get(GUILD).fetchMembers().then(r => {
    r.members.array().forEach(r => {
      let username = `${r.user.username}`;

			if(jsonData.players.hasOwnProperty(r.user.id.toString())){
				jsonData.players[r.user.id.toString()].username = r.user.username;
			}else{
				jsonData.players[r.user.id.toString()] = { points: 0, username: r.user.username };
			}
    });

		saveToFile();
  });
}

// uložení dat do souboru
function saveToFile() {
	fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), function(err) {
		if (err) {
			console.log(err);
		}
	});
}

// přepíše místnost s pravidly
function replaceRules() {
	client.channels.get(CHANNEL_RULES).fetchMessages().then(function(list){
    client.channels.get(CHANNEL_RULES).bulkDelete(list);
  }, function(err){message.channel.send("ERROR CLEARING CHANNEL")});

	let rules = [...jsonData.rules];
	let y = 1;
	while(rules.length > 0){
		let content = "";
		for (var i = 0; i < 7; i++) {
			if(rules.length <= 0){
				break;
			}
			content += "**[" + (y++) + "]** " + rules.shift() + "\n";
		}
		client.channels.get(CHANNEL_RULES).send(content);
	}

	var today = new Date();
	var time = today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear() + " v " + today.getHours().toString().padStart(2, '0') + ":" + today.getMinutes().toString().padStart(2, '0');
	client.channels.get(CHANNEL_RULES).setTopic(`LS Nomic Bot v${VERSION} - Poslední aktualizace pravidel: ${time}`);
}

// přepíše místnost hráčů a jejich bilance
function replacePlayers() {
	client.channels.get(CHANNEL_PLAYERS).fetchMessages().then(function(list){
		client.channels.get(CHANNEL_PLAYERS).bulkDelete(list);
	}, function(err){message.channel.send("ERROR CLEARING CHANNEL")});

	let totalPoints = 0;
	let players = jsonData.players;
	let len = Object.keys(players).length;
	while(len > 0){
		let content = "";
		for (var i = 0; i < 25; i++) {
			if(len <= 0){
				break;
			}
			let pid = Object.keys(players)[len - 1];
			//content += "<@" + pid + "> - **" + players[pid].points + "** ß\n";
			content += players[pid].username + " - **" + players[pid].points + "** ß\n";
			totalPoints += parseInt(players[pid].points);
			len--;
		}
		client.channels.get(CHANNEL_PLAYERS).send(content);
	}

	client.channels.get(CHANNEL_PLAYERS).setTopic('Celkem v oběhu: ' + totalPoints + ' ß');
}

// zjisti aktuální stav bodů hráče
function playerGetMoney(player){
	if(jsonData.players.hasOwnProperty(player.toString())){
		return parseInt(jsonData.players[player.toString()].points);
	}

	return 0;
}

// změní stav bodů hráče (pozor, dá se jít i do mínusu, kontroly musí proběhnout mimo tuto funkci)
function playerChangeMoney(player, change){
	change = parseInt(change);

	if(jsonData.players.hasOwnProperty(player.toString())){
		jsonData.players[player.toString()].points = parseInt(jsonData.players[player.toString()].points) + change;
	}else{
		jsonData.players[player.toString()] = { points: change };
	}

	return true;
}

// kontrola hlasování o návrhu
function checkPoll(msg, replaceRule, content, author, forced = false){
	if (!forced) {
		let validCheck = true;

		// todo: opravit tento nefunkční humáč
		validCheck = !Object.keys(msg.reactions.get('👍').users).some(r => r in Object.keys(msg.reactions.get('👎').users));

		if(!validCheck){
			console.log('[Návrh] Nevalidní hlasování!');
			client.channels.get(CHANNEL_POLLS).send("Nějaký debílek hlasuje pro dvě věci zároveň!");
			return false;
		}
	}

	if(jsonData.rules.includes(content) && content != "*anulováno*"){
		return false;
	}

	if(forced || (msg.reactions.get('👍').count - 1) >= Math.ceil((client.guilds.get(GUILD).members.size - 1) / 2)
 						|| (msg.reactions.get('👎').count - 1) >= Math.ceil((client.guilds.get(GUILD).members.size - 1) / 2)){
		console.log('[Návrh] Odhlasováno!');

		const votedFor = [];
		const votedAgainst = [];

		msg.reactions.get('👍').users.forEach(x => {
			if(x.id != BOT_ID){
				votedFor.push(x.username);
			}
		});

		msg.reactions.get('👎').users.forEach(x => {
			if(x.id != BOT_ID){
				votedAgainst.push(x.username);
			}
		});

		if (msg.reactions.get('👍').count - 1 > msg.reactions.get('👎').count - 1) {

			let oldContent = "";

			if(replaceRule){
				if(content == "*anulováno*"){
					client.channels.get(CHANNEL_REMOVED).send("**[" + replaceRule + "]** " + jsonData.rules[replaceRule-1]);
				}

				oldContent = jsonData.rules[replaceRule-1];
				jsonData.rules[replaceRule-1] = content;
				replaceRules();
			}else{
				jsonData.rules[jsonData.rules.length] = content;
				client.channels.get(CHANNEL_RULES).send("**[" + jsonData.rules.length + "]** " + content);

				var today = new Date();
				var time = today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear() + " v " + today.getHours().toString().padStart(2, '0') + ":" + today.getMinutes().toString().padStart(2, '0');
				client.channels.get(CHANNEL_RULES).setTopic(`LS Nomic Bot v${VERSION} - Poslední aktualizace pravidel: ${time}`);
			}

			console.log('[Návrh] Pravidlo přidáno!');

			playerChangeMoney(author.id, 1);
			replacePlayers();

			jsonData.total = jsonData.rules.length;

			saveToFile();

			msg.react('✅');
			msg.delete(5000);

			client.channels.get(CHANNEL_DONE).send({
				embed: {
				  "title": (replaceRule ? (content == "*anulováno*" ? "Návrh na zrušení pravidla č." + replaceRule + ":" : "Návrh změny pravidla č." + replaceRule + ":") : "Návrh nového pravidla:"),
				  "description": "\n" + (content == "*anulováno*" ? oldContent : content) + "\n ",
				  "color": (replaceRule ? (content == "*anulováno*" ? "15158332" : "15105570") : "3264944"),
				  "footer": {
						"text": `Návrh přidal ${author.username} - návrh byl PŘIJAT!\nPro hlasovali: ${votedFor.join(', ')}\nProti hlasovali: ${votedAgainst.join(', ')}`,
						"icon_url": author.avatarURL
				  }
				}
			});
		}else{
			console.log('[Návrh] Návrh zamítnut!');
			msg.react('❌');
			msg.delete(5000);

			client.channels.get(CHANNEL_DONE).send({
				embed: {
					"title": (replaceRule ? (content == "*anulováno*" ? "Návrh na zrušení pravidla č." + replaceRule + ":" : "Návrh změny pravidla č." + replaceRule + ":") : "Návrh nového pravidla:"),
				  "description": "\n" + (content == "*anulováno*" ? oldContent : content) + "\n ",
				  "color": (replaceRule ? (content == "*anulováno*" ? "15158332" : "15105570") : "3264944"),
				  "footer": {
						"text": `Návrh přidal ${author.username} - návrh byl ZAMÍTNUT!\nPro hlasovali: ${votedFor.join(', ')}\nProti hlasovali: ${votedAgainst.join(', ')}`,
						"icon_url": author.avatarURL
				  }
				}
			});
		}

		return true;
	}
}

client.login(TOKEN);

client.on('message', message => {

	if(message.channel.id == CHANNEL_PROPOSALS){ // návrh

		console.log('[Návrh] Nový návrh!');

		let replaceRule = false;
		let content = message.content;
		let regex = /^\[([0-9]+)\] ?/;
		let found = content.match(regex);
		if(found){
			content = content.replace(found[0], '');
			replaceRule = found[1];
		}

		client.channels.get(CHANNEL_POLLS).send({
			embed: {
				"title": (replaceRule ? (content == "*anulováno*" ? "Návrh na zrušení pravidla č." + replaceRule + ":" : "Návrh změny pravidla č." + replaceRule + ":") : "Návrh nového pravidla:"),
				"description": "\n" + (content == "*anulováno*" ? jsonData.rules[replaceRule-1] : content) + "\n ",
				"color": (replaceRule ? (content == "*anulováno*" ? "15158332" : "15105570") : "3264944"),
			  "footer": {
					"text": "Návrh přidal " + message.author.username + ",\nhlasování bude ukončeno za 12 hodin nebo hlasováním dostatečného počtu hráčů",
					"icon_url": message.author.avatarURL
			  }
			}
		}).then(async function(msg) {
			await msg.react('👍');
			await msg.react('👎');

			console.log('[Návrh] Čekám na reakce..');

			const filter = (reaction, user) => reaction.emoji.name === '👍' || reaction.emoji.name === '👎';

			let collector = msg.createReactionCollector(filter, {
				time: 12*60*60000,
				maxUsers: client.guilds.get(GUILD).members.size,
			});

			collector.on('collect', (reaction, rUser) => {
				if(rUser.id != BOT_ID){
					console.log('[Návrh] Nový hlas!');
					if(checkPoll(msg, replaceRule, content, message.author, false)){
						collector.stop('manual');
					}
				}
			});

			collector.on('end', (collected, reason) => {
				if (reason && reason === 'manual') {
					console.log('[Návrh] Kolektor ukončen');
				}else{
					console.log('[Návrh] Hlasování u konce!');
					checkPoll(msg, replaceRule, content, message.author, true);
				}
			});
		});

	}else if(message.channel.id == CHANNEL_TRANSACTIONS){ // transakce

		console.log("[Transakce] Načítám zprávu..");

		let content = message.content;
		let regex = /^<@!?(\d+)> (\d+)/;
		let found = content.match(regex);
		if(found){
			let toUser = found[1];
			let amount = found[2];

			if(message.author.id != toUser){
				if(amount > 0 && playerGetMoney(message.author.id) >= amount){
					playerChangeMoney(message.author.id, -amount);
					playerChangeMoney(toUser, amount);
					replacePlayers();
					saveToFile();

					console.log("[Transakce] Dokončeno!");
					message.react('✅');
				}else{
					console.log("[Transakce] Nemá dostatek bodů!");
					message.react('❌');
				}
			}else{
				console.log("[Transakce] Nemůže posílat sám sobě!");
				message.react('❌');
			}
		}else{
			console.log("[Transakce] Špatný formát!");
			message.react('❌');
		}

	}

});
