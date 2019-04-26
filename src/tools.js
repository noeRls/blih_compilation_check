function execAsync(shelljs, cmd) {
  return new Promise((res) => {
    shelljs.exec(cmd, (code, stdout, stderr) => {
      res({code, stdout, stderr});
    });
  });
}

module.exports = {execAsync};