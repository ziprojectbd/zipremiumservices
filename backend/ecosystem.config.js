module.exports = {
  apps: [
    {
      name: "zi-premium-services-backend",
      script: "./dist/server.js",
      node_args: "-r module-alias/register",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      merge_logs: true,
      env: {
        NODE_ENV: "production",
      },
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 5000,
      shutdown_with_message: true,
    },
  ],
};
