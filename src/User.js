const Blih = require('blih');
const Repo = require('./Repo');
const ProgressBar = require('cli-progress');

class User {
  constructor(mail, pwd) {
    this.repos = [];
    this.blih = new Blih({ email: mail, password: pwd });
  }

  async init()
  {
    try {
      await this.blih.whoami();
    } catch(e) {
      throw 'Blih error: ' + e;
    }
  }

  async loadRepo(savePath)
  {
    const reposData = await this.blih.listRepositories();
    this.repos = reposData.map(data => new Repo(data.name, savePath));
  }

  async compute(shelljs)
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
    bar.start(this.repos.length, 0, info);

    console.log('loading repos');
    const promises = this.repos.map(async repo => {
      try {
        await repo.update(shelljs, this.blih.email);
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
      console.log('done');
      await bar.update(info.done, info);
    });
    await Promise.all(promises);
    bar.stop();
  }
}

module.exports = User;