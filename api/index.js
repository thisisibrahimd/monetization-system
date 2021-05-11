const express = require("express")
const admin = require("firebase-admin")
const axios = require("axios")
import { config } from '../config'

if (!admin.apps.some(app => app.name == "[DEFAULT]")) {
	admin.initializeApp({
		credential: admin.credential.applicationDefault(),
		databaseURL: config.databaseURL,
	})
}

const db = admin.firestore()
const stock = db.doc("stock/status")
const users = db.collection("users")

const router = express.Router()
const app = express()

const authMiddleware = (req, res, next) => {
	const auth = req.headers.authorization
	if (auth && /Bearer [a-zA-Z0-9]{30}/.test(auth)) next()
	else res.status(400).send()
}

const adminMiddleware = async (req, res, next) => {
	const token = req.headers.authorization.split(" ")[1]
	const me = await discord.getMe(token)
	if (config.admins.includes(me.id)) next()
	else res.status(403).send()
}

const stockMiddleware = async (req, res, next) => {
	const stock = await database.getStock()
	if (stock.count > 0) {
		next()
	} else {
		res.status(400).send()
	}
}

router.use((req, res, next) => {
	Object.setPrototypeOf(req, app.request)
	Object.setPrototypeOf(res, app.response)
	req.res = res
	res.req = req
	next()
})

router.get("/stock", async (_, res) => {
	const s = await database.getStock()
	if (s.count > 0) {
		res.send({ live: true, price: s.price })
	} else {
		res.send({ live: false })
	}
})

router.get("/user", authMiddleware, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const me = await discord.getMe(token)
	const u = await database.getUser(me.id)
	res.send(u)
})

router.get(
	"/user/payment",
	stockMiddleware,
	authMiddleware,
	async (req, res) => {
		const token = req.headers.authorization.split(" ")[1]
		const me = await discord.getMe(token)
		const u = await database.getUser(me.id)
		const active = false
		if (u)
			for (let id in u.orders) {
				if (u.orders[id].status == "Active") active = true
			}
		if (!active) {
			const s = await database.getStock()
			const plan = paypal.genPlan(s.price)
			const createdPlan = await paypal.createPlan(plan)
			if (createdPlan) {
				await paypal.activatePlan(createdPlan.id)
				const agreement = paypal.genAgreement(createdPlan.id)
				if (agreement) {
					const createdAgreement = await paypal.createAgreement(agreement)
					if (createdAgreement) {
						res.send(createdAgreement.links)
					} else res.status(500).send()
				} else res.status(500).send()
			} else res.status(500).send()
		} else {
			res.status(400).send()
		}
	}
)

router.post(
	"/user/payment",
	stockMiddleware,
	authMiddleware,
	async (req, res) => {
		const token = req.headers.authorization.split(" ")[1]
		const me = await discord.getMe(token)
		const u = await database.getUser(me.id)
		const s = await database.getStock()
		console.log(req.body)
		const ptoken = req.body.token
		const agreement = await paypal.executeAgreement(ptoken)
		if (agreement) {
			await database.decrementStock()
			const order = {
				email: agreement.payer.payer_info.email,
				order_id: agreement.id,
				start_date: paypal.genOrderDate(),
				status: "Active",
				amount: parseInt(s.price),
			}
			if (u) {
				await database.addOrder(me.id, order)
			} else {
				const user = {
					discord_id: me.id,
					orders: {
						[agreement.id]: order,
					},
				}
				await database.createUser(user)
			}
			await discord.addUser(token, me.id)
			await discord.addRole(me.id)
		} else res.status(400).send()
	}
)

router.delete("/user/payment", authMiddleware, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const me = await discord.getMe(token)
	const u = await database.getUser(me.id)
	const order_id = req.body.id
	if (order_id) {
		if (u.orders[order_id].status == "Active") {
			await paypal.cancelAgreement(order_id)
		}
		await discord.removeRole(me.id)
		await database.deactivateOrder(me.id, order_id)
		res.status(200).send()
	} else res.status(400).send()
})

router.get(
	"/admin/stock",
	authMiddleware,
	adminMiddleware,
	async (req, res) => {
		const s = await database.getStock()
		res.send(s)
	}
)

router.post(
	"/admin/stock",
	authMiddleware,
	adminMiddleware,
	async (req, res) => {
		const s = req.body.stock
		if (s) {
			await database.updateStock(s)
			res.send()
		} else res.status(400).send()
	}
)

router.get(
	"/admin/users",
	authMiddleware,
	adminMiddleware,
	async (req, res) => {
		const us = await database.getUsers()
		res.send(us)
	}
)

router.get(
	"/admin/users/:id",
	authMiddleware,
	adminMiddleware,
	async (req, res) => {
		const id = req.params.id
		const m = await discord.getUser(id)
		res.send(m)
	}
)

router.delete(
	"/admin/users/payment",
	authMiddleware,
	adminMiddleware,
	async (req, res) => {
		const user_id = req.body.user_id
		const order_id = req.body.id
		const u = await database.getUser(user_id)
		if (order_id) {
			if (u.orders[order_id].status == "Active") {
				await paypal.cancelAgreement(order_id)
			}
			await discord.removeRole(user_id)
			await database.deactivateOrder(user_id, order_id)
			res.status(200).send()
		} else res.status(400).send()
	}
)

class database {
	static async getStock() {
		const s = (await stock.get()).data()
		return s
	}

	static async updateStock({ count, price }) {
		await stock.update({ count: count, price: price })
	}

	static async decrementStock() {
		const s = await this.getStock()
		await stock.update({
			count: s.count - 1,
		})
	}

	static user(id) {
		return users.doc(id)
	}

	static async getUser(id) {
		const u = (await this.user(id).get()).data()
		return u
	}

	static async createUser(user) {
		await this.user(user.discord_id).create(user)
	}

	static async getUsers() {
		const urs = await (await users.get()).docs.map(doc => doc.data())
		return urs
	}

	static getOrderPath(order_id) {
		return `orders.${order_id}`
	}

	static async addOrder(id, order) {
		const res = await this.user(id).update({
			[this.getOrderPath(order.order_id)]: order,
		})
	}

	static async activateOrder(id, order_id) {
		await this.user(id).update({
			[this.getOrderPath(order_id) + ".status"]: "Active",
		})
	}

	static async deactivateOrder(id, order_id) {
		await this.user(id).update({
			[this.getOrderPath(order_id) + ".status"]: "Cancelled",
		})
	}
}

const discordGuildAPI = axios.create({
	baseURL: `https://discord.com/api/guilds/${config.discord.guild}`,
	headers: {
		Authorization: `Bot ${config.discord.token}`,
	},
})

class discord {
	static async getMe(token) {
		try {
			const { data } = await axios.get("https://discord.com/api/users/@me", {
				headers: { Authorization: `Bearer ${token}` },
			})
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async getUser(id) {
		try {
			const { data } = await discordGuildAPI.get(`/members/${id}`)
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async addUser(access_token, id) {
		try {
			await discordGuildAPI.put(
				`/members/${id}`,
				{ access_token },
				{ headers: { Authorization: `Bot ${config.discord.token}` } }
			)
		} catch (error) {
			console.log(error)
		}
	}

	static async addRole(user_id) {
		try {
			await discordGuildAPI.put(
				`/members/${user_id}/roles/${config.discord.role}`
			)
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async removeRole(user_id) {
		try {
			const res = await discordGuildAPI.delete(
				`/members/${user_id}/roles/${config.discord.role}`
			)
			return res
		} catch (error) {
			console.log(error)
			return null
		}
	}
}

const paypalAPI = axios.create({
	baseURL: "https://api.paypal.com",
	auth: {
		username: config.paypal.id,
		password: config.paypal.secret,
	},
	headers: {
		"Content-Type": "application/json",
	},
})

class paypal {
	static genPlan(price) {
		const urls =
			process.env.NODE_ENV == "production"
				? {
						c: "https://{DOMAIN}/dashboard",
						p: "https://{DOMAIN}/dashboard/success",
				}
				: {
						c: "http://localhost:8080/dashboard",
						p: "http://localhost:8080/dashboard/success",
				}
		return {
			name: "NAME",
			description: "DESCRIPTION",
			payment_definitions: [
				{
					amount: {
						currency: "USD",
						value: `${price}`,
					},
					cycles: "0",
					frequency: "MONTH",
					frequency_interval: "1",
					name: "NAME",
					type: "REGULAR",
				},
			],
			merchant_preferences: {
				auto_bill_amount: "yes",
				cancel_url: urls.c,
				initial_fail_amount_action: "continue",
				max_fail_attempts: "1",
				return_url: urls.p,
			},
			type: "INFINITE",
		}
	}

	static genAgreement(plan_id) {
		let today = new Date()
		today.setSeconds(today.getSeconds() + 15)
		today.toISOString().slice(0, 19) + "Z"

		return {
			name: "NAME",
			description: "DESCRIPTION",
			start_date: today,
			plan: {
				id: plan_id,
			},
			payer: {
				payment_method: "paypal",
			},
		}
	}

	static async createAgreement(agreement) {
		try {
			const { data } = await paypalAPI.post(
				"/v1/payments/billing-agreements/",
				agreement
			)
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async getAgreement(id) {
		try {
			const { data } = await paypalAPI.get(
				"/v1/payments/billing-agreements/" + id
			)
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async cancelAgreement(id) {
		try {
			await paypalAPI.post(
				"/v1/payments/billing-agreements/" + id + "/cancel",
				{
					note: "Canceling the agreement",
				}
			)
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async executeAgreement(token) {
		try {
			const { data } = await paypalAPI.post(
				"/v1/payments/billing-agreements/" + token + "/agreement-execute"
			)
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async createPlan(plan) {
		try {
			const { data } = await paypalAPI.post("/v1/payments/billing-plans/", plan)
			return data
		} catch (error) {
			console.log(error)
			return null
		}
	}

	static async activatePlan(id) {
		try {
			await paypalAPI.patch("v1/payments/billing-plans/" + id, [
				{
					op: "replace",
					path: "/",
					value: {
						state: "ACTIVE",
					},
				},
			])
		} catch (error) {
			console.log(error)
		}
	}

	static genOrderDate() {
		let today = new Date()
		let day = today.getDate()
		let month = today.getMonth() + 1
		let year = today.getFullYear()
		day = day < 10 ? `0${day}` : day
		month = month < 10 ? `0${month}` : month
		return `${month}/${day}/${year}`
	}
}

export default {
	path: "/api",
	handler: router,
}
