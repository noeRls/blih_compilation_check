const shelljs = require('shelljs');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const User = require('./User');

function checkParams(blihMail, savePath, pwd) {
  const {error} = Joi.validate({blihMail, savePath, pwd},
    Joi.object().keys({
      blihMail: Joi.string().email().required(),
      savePath: Joi.string().required(),
      pwd: Joi.string().required()
    }).required()
  );
  if (error) {
    throw error;
  }
  savePath = path.resolve(savePath);
  if (!fs.existsSync(savePath)) {
    throw `Invalid path ${savePath} no such directory`;
  }
  return {blihMail, savePath};
}

function checkTools() {
  if (!shelljs.which('git'))
    throw 'this script requires git';
  if (!shelljs.which('make'))
    throw 'this script requires make';
}

function report(user)
{
  user.repos.forEach(r => {
    if (r.updateFail) {
      console.log(r.reason);
    } else if (r.compilationFail) {
      console.log(`Compilation failed in ${r.name} repository`);
    }
  });
}

async function main(blihMail, pwd, savePath)
{
  console.log('started');
  shelljs.config.silent = true;
  const value = checkParams(blihMail, savePath, pwd); // throw on error
  blihMail = value.blihMail;
  savePath = value.savePath;
  checkTools();
  const user = new User(blihMail, pwd);
  await user.init();
  await user.loadRepo(savePath);
  await user.compute(shelljs);
  report(user);
}

return main(process.env.BLIH_MAIL, process.env.BLIH_PASSWORD, process.env.SAVE_PATH).catch(e => console.error(e));
