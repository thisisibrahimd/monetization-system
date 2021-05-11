const bodyParser = require("body-parser")
import { config } from './config'

export default {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  mode: "universal",
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: "server",
  /*
   ** Headers of the page
   */
  head: {
    title: "monetization-system",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/bulma@0.9.0/css/bulma.min.css",
      },
    ],
  },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: true,
  /*
   ** ServerMiddleware configuration
   */
  serverMiddleware: [bodyParser.json(), "~/api"],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    "@nuxtjs/axios",
    // Doc: https://auth.nuxtjs.org/guide
    "@nuxtjs/auth",
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL:
      process.env.NODE_ENV == "production" ? config.discord.base_url : "http://localhost/api",
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {},
  /*
   ** Router configuration
   */
  router: {
    middleware: ["auth"],
  },
  /*
   ** Auth configuration
   */
  auth: {
    cookie: {
      options: {
        secure: true,
      },
    },
    strategies: {
      discord: {
        _scheme: "oauth2",
        authorization_endpoint: "https://discord.com/api/oauth2/authorize",
        userinfo_endpoint: "https://discord.com/api/users/@me",
        scope: ["identify", "email", "guilds.join"],
        access_type: undefined,
        access_token_endpoint: undefined,
        response_type: "token",
        token_type: "Bearer",
        client_id: config.discord.oauth.client_id,
        token_key: "access_token",
        state: false,
      },
    },
  },
  /*
   ** Server configuration
   */
  server: {
    port: 80,
    host:
      process.env.NODE_ENV == "production" ? "0" : "localhost",
  },
}
