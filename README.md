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

A nakonec soubor, do kterého bude bot ukládat data o probíhající hře **data.json**, obsahující úvodní pravidla ve formátu:
```js
{
  "total": 2,
  "rules": [
    "[1] Každý návrh musí být schválen alespoň polovinou hráčů, aby byl přijat. V případě lichého počtu hráčů pak větší polovinou. Hlasování trvá 12 hodin, není-li ukončeno předčasně.",
    "[2] Hlasování o každém návrhu bude ukončeno předčasně, pokud odhlasoval dostatečný počet hráčů pro jednoznačné přijetí/zamítnutí návrhu."
  ],
  "players": {}
}
```
