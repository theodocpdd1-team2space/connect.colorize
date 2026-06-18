module.exports = {
  apps: [
    {
      name: "easycom-web",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3010
      }
    }
  ]
};
