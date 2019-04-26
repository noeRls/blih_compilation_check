const shelljs = require('shelljs');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const ProgressBar = require('cli-progress');
const Repo = require('./Repo');
const {execAsync} = require('./tools');

function loadConfig() {
  try {
    const config = require('./config.json');
    const {value, error} = Joi.validate(config,
      Joi.object().keys({
        blih_mail: Joi.string().email().required(),
        save_path: Joi.string().required()
      }).required()
    );
    if (error) {
      console.log(error);
      process.exit(1);
    }
    value.save_path = path.resolve(value.save_path);
    if (!fs.existsSync(value.save_path)) {
      console.error(`Invalid path ${value.save_path} no such directory`);
      process.exit(1);
    }
    return value;
  } catch(e) {
    console.log('Missing or wrong config file');
    process.exit(1);
  }
}

function checkTools() {
  let ok = true;
  if (!shelljs.which('git')) {
    console.error('this script requires git');
    ok = false;
  }
  if (!shelljs.which('blih')) {
    console.error('this script requires blih');
    ok = false;
  }
  return ok;
}

async function loadRepo(config)
{
  const data = await execAsync(shelljs, `blih -u ${config.blih_mail} repository list`);
  if (data.code != 0) {
    console.error(data.stdout);
    console.error('Failed to list repository');
    return 1;
  }
  let reposNames = data.stdout.split('\n');
  reposNames.splice(reposNames.length - 1, 1);
  return reposNames.map(name => new Repo(name, config.save_path));
}

async function compute(config, repos)
{
  const bar = new ProgressBar.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | compiled: {compiled} | cfailed: {compilationFail} | nomakefile: {noMakefile} | ufailed: {fail}',
  });
  const info = {
    compiled: 0,
    nomakefile: 0,
    compilationFail: 0,
    fail: 0,
    done: 0
  };
  bar.start(repos.length, 0, info);

  const promises = repos.map(async repo => {
    try {
      await repo.update(config, shelljs);
      await repo.checkCompilation(shelljs);
      if (repo.compilationSuccess)
        info.compiled += 1;
      else if (!repo.makefilePresent)
        info.nomakefile += 1;
    } catch(e) {
      if (repo.compilationFail)
        info.compilationFail += 1;
      else
        info.fail += 1;
    }
    info.done += 1;
    await bar.update(info.done, info);
  });
  await Promise.all(promises);
  bar.stop();
}

function report(repos)
{
  repos.forEach(r => {
    if (r.updateFail)
      console.log(r.reason);
    else if (r.compilationFail) {
      console.log(`Compilation failed in ${r.name} repository`);
    }
  });
}

async function main()
{
  shelljs.config.silent = true;
  const config = loadConfig();
  if (!checkTools()) return 1;
  const repos = await loadRepo(config);
  await compute(config, repos);
  report(repos);
}

return main().catch(e => console.error(e));
