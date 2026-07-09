const fs = require("fs-extra");
const path = require("path");
const login = require("fca-unofficial");
const config = require("./config.json");

global.config = config;
global.client = {
  commands: new Map()
};

// Load commands
const commandPath = path.join(__dirname, "scripts", "commands");

if (fs.existsSync(commandPath)) {
  const files = fs.readdirSync(commandPath)
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    const command = require(commandPath + "/" + file);

    if (command.config && command.run) {
      global.client.commands.set(
        command.config.name,
        command
      );
      console.log(`Loaded: ${command.config.name}`);
    }
  }
}

const appState = require("./" + config.APPSTATE);

login({ appState }, (err, api) => {

  if (err) {
    return console.log("Login Error:", err);
  }

  api.setOptions({
    listenEvents: true,
    selfListen: false
  });

  console.log("✅ Baby Mirai Bot Online");

  api.listenMqtt(async (err, event) => {

    if (err) return console.log(err);

    if (event.type !== "message") return;

    const body = event.body || "";

    if (!body.startsWith(config.PREFIX)) return;

    const args = body
      .slice(config.PREFIX.length)
      .trim()
      .split(/\s+/);

    const cmdName = args.shift();

    const cmd = global.client.commands.get(cmdName);

    if (cmd) {
      cmd.run({
        api,
        event,
        args
      });
    }

  });

});
