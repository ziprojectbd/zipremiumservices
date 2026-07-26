module.exports = {
  apps: [
    {
      name: "zi-premium-services-backend",
      script: "./dist/server.js",
      node_args: "-r module-alias/register",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
