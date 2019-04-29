const path = require('path');
const fs = require('fs');
const {execAsync} = require('./tools');
const rimraf = require('rimraf');

class Repo
{
  constructor(name, base_path) {
    this.name = name;
    this.base_path = base_path;
    this.path = path.resolve(`${base_path}/${name}`);
    this.updateFail = false;
    this.compilationFail = false;
    this.compilationSuccess = false;
    this.makefilePresent = false;
  }

  async removeDirectory() {
    return new Promise((res, rej) => {
      rimraf(this.path, e => {
        if (e) return rej(e);
        return res();
      });
    });
  }

  async update(shelljs, blihMail) {
    let pullSuccess = false;
    if (fs.existsSync(this.path)) {
      const res = await execAsync(shelljs, `git -C ${this.path} pull`);
      if (res.code === 0)
        pullSuccess = true;
      else
        await this.removeDirectory();
    }
    if (!pullSuccess) {
      const res = await execAsync(shelljs, `git clone git@git.epitech.eu:/${blihMail}/${this.name} ${this.path}`);
      if (res.code !== 0) {
        this.updateFail = true;
        this.reason = `Failed to clone ${this.name} in ${this.path}`;
        this.out = {stdout: res.stdout, stderr: res.stderr};
        throw this.reason;
      }
    }
  }

  async checkCompilation(shelljs) {
    if (this.fail) throw 'This repository is in a failed state';
    const makefilePath = `${this.path}/Makefile`;
    if (!fs.existsSync(makefilePath)) return;
    this.makefilePresent = true;
    const res = await execAsync(shelljs, `make re -C ${this.path}`);
    if (res.code !== 0) {
      this.compilationFail = true;
      this.out = {stdout: res.stdout, stderr: res.stderr};
      throw 'Compilation failed';
    } else {
      this.compilationSuccess = true;
    }
  }

}

module.exports = Repo;