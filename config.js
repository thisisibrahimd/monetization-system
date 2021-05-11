export const config = {
	// LIST OF ADMIN"S DISCORD ID
	admins: [],
	paypal: {
		id:
			"PAYPAL_ID",
		secret:
			"PAYPAL_SECRET",
		base64:
			"PAYPAL_BASEURL_ENCODED",
	},
	discord: {
    oauth: {
      client_id: "DISCORD_OAUTH2_CLIENT_ID"
    },
    base_url: "AXIOS_BASE_API_URL ex https://exmaple.com/api",
		token: "DISCORD TOKEN",
		guild: "DISCORD_SERVER_ID",
		role: "DISCORD_ROLE_FOR_PAYING_MEMBERS",
		channel: "DISCORD_CHANNEL_TO_ISSUE_COMMANDS_AND_SEND_LOGS",
	},
	databaseURL: "FIRESTORE_DATABASE_URL"
}
