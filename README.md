# LeoSight Nomic

Pro spuštění bota je potřeba nejprve vytvořit soubor **.env** s obsahem:
```js
DISCORD_TOKEN = "token"
```

A následně také soubor **config.json** s obsahem:
```js
{
  "GUILD": "ID serveru",
  "BOT_ID": "ID bota",
  "CHANNEL_RULES": "ID místnosti",
  "CHANNEL_PLAYERS": "ID místnosti",
  "CHANNEL_POLLS": "ID místnosti",
  "CHANNEL_PROPOSALS": "ID místnosti",
  "CHANNEL_TRANSACTIONS": "ID místnosti",
  "CHANNEL_DONE": "ID místnosti",
  "CHANNEL_REMOVED": "ID místnosti"
}
```
(Jak bot interaguje s jednotlivými místnostmi podle těchto proměnných naleznete vysvětleno v komentářích v **index.js**)
