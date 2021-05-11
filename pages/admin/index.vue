<template>
	<div>
		<section class="section">
			<div class="container has-text-centered">
				<nav class="level">
					<div class="level-left">
						<nuxt-link class="level-item" to="/">
							<figure class="image is-64x64">
								<img src="/logo.jpg" alt="Logo" class="is-rounded" />
							</figure>
							<div class="is-invisible">
								<p>2</p>
							</div>
							<p class="title">COMPANY</p>
						</nuxt-link>
					</div>

					<div class="level-right">
						<div class="level-item">
							<p class="subtitle">
								Hello
								<strong>{{ $auth.user.username }}</strong>
								<small>#{{ $auth.user.discriminator }}</small>
							</p>
							<div class="is-invisible">
								<p>2</p>
							</div>
							<button class="button is-warning is-small" @click="logout">
								logout
							</button>
						</div>
					</div>
				</nav>
			</div>
		</section>

		<section class="section mb-6">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-3">
						<section
							class="section has-background-light has-text-centered"
							style="border-radius: 10px;"
						>
							<p class="title">Update Stock</p>
							<p class="subtitle">
								Current:
								<strong>
									{{ stock.count }}
								</strong>
								stock, each
								<strong> ${{ stock.price }} </strong>
							</p>
							<div class="field">
								<label class="label">Count</label>
								<div class="control">
									<input
										class="input"
										type="number"
										v-model="stock_model.count"
										placeholder="3"
									/>
								</div>
							</div>

							<div class="field">
								<label class="label">Price</label>
								<div class="control">
									<input
										class="input"
										type="number"
										v-model="stock_model.price"
										placeholder="40"
									/>
								</div>
							</div>
							<button class="button is-danger is-light" @click="updateS">
								Update
							</button>
						</section>
					</div>
					<div class="column is-9">
						<section
							class="section has-background-light has-text-centered"
							style="border-radius: 10px;"
						>
							<p class="title">Users</p>
							<p class="subtitle">
								<strong>{{ stats().au }}</strong> Active |
								<strong>${{ stats().m }}</strong> / month
							</p>
							<div class="table-container">
								<table
									class="table is-inline-block is-striped is-hoverable"
									style="border-radius: 10px;"
								>
									<thead>
										<tr>
											<th>ID</th>
											<th># of Orders</th>
											<th>Active</th>
											<th>Active Order ID</th>
											<th>Active Order Email</th>
											<th>Active Order Start Date</th>
											<th>Active Order Amount</th>
										</tr>
									</thead>
									<tbody>
										<tr
											v-for="user in users"
											:key="user.discord_id"
											@click="select(user.discord_id)"
										>
											<th>{{ user.discord_id }}</th>
											<td>{{ Object.entries(user.orders).length }}</td>
											<td>{{ active(user.discord_id) == 1 ? "YES" : "NO" }}</td>
											<td>
												{{
													activeOrder(user.discord_id)
														? activeOrder(user.discord_id).order_id
														: "N/A"
												}}
											</td>
											<td>
												{{
													activeOrder(user.discord_id)
														? activeOrder(user.discord_id).email
														: "N/A"
												}}
											</td>
											<td>
												{{
													activeOrder(user.discord_id)
														? activeOrder(user.discord_id).start_date
														: "N/A"
												}}
											</td>
											<td>
												{{
													activeOrder(user.discord_id)
														? activeOrder(user.discord_id).amount
														: "N/A"
												}}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</section>
					</div>
				</div>
			</div>
		</section>

		<div :class="{ modal: true, 'is-active': show }" v-if="selectedUser">
			<div class="modal-background" @click="unselect"></div>
			<div class="modal-content">
				<section
					class="section has-background-light has-text-centered"
					style="border-radius: 10px;"
				>
					<p class="title">User {{ selectedUser.discord_id }}</p>
					<div class="table-container">
						<table
							class="table is-inline-block is-striped"
							v-if="selectedUser.orders"
							style="border-radius: 10px;"
						>
							<thead>
								<tr>
									<th>Active</th>
									<th>ID</th>
									<th>Start Date</th>
									<th>Amount</th>
									<th>Email</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(order, id) in selectedUser.orders" :key="id">
									<th>{{ order.status == "Active" ? "Yes" : "No" }}</th>
									<td>{{ id }}</td>
									<td>{{ order.start_date }}</td>
									<td>${{ order.amount }}</td>
									<td>{{ order.email }}</td>
									<td>
										<button
											class="button is-danger is-small"
											:disabled="order.status != 'Active'"
											@click="cancel(selectedUser.discord_id, id)"
										>
											Cancel
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</div>
			<button
				class="modal-close is-large"
				aria-label="close"
				@click="unselect"
			></button>
		</div>
	</div>
</template>

<script>
export default {
	middleware: "admin",
	async asyncData({ $axios }) {
		try {
			const { data: stock } = await $axios.get("/admin/stock")
			const { data: users } = await $axios.get("/admin/users")
			return { stock, users }
		} catch ({ message }) {
			return { stock: { count: 0, price: 40 } }
		}
	},
	data() {
		return {
			purchasing: false,
			stock_model: {
				count: 3,
				price: 40,
			},
			show: false,
			selectedUser: null,
		}
	},
	methods: {
		stats() {
			const activeUsers = this.$data.users.map(user =>
				this.active(user.discord_id)
			)
			const activeOrders = this.$data.users.map(user =>
				this.activeOrder(user.discord_id)
			)
			return {
				au: activeUsers.reduce((p, c) => p + c, 0),
				m: activeOrders.reduce((p, c) => (c ? p + c.amount : p), 0),
			}
		},
		select(id) {
			const user = this.$data.users.find(user => user.discord_id == id)
			this.$data.selectedUser = user
			this.$data.show = true
		},
		unselect() {
			this.selectedUser = null
			this.$data.show = false
		},
		active(id) {
			const user = this.$data.users.find(user => user.discord_id == id)
			const orders = Object.entries(user.orders)
			return orders.reduce((p, c) => (c[1].status == "Active" ? p + 1 : p), 0)
		},
		activeOrder(id) {
			const user = this.$data.users.find(user => user.discord_id == id)
			for (const [id, order] of Object.entries(user.orders)) {
				if (user.orders[id].status == "Active") return order
			}
			return null
		},
		async logout() {
			await this.$auth.logout()
		},
		async updateS() {
			try {
				const stock = this.$data.stock_model
				await this.$axios.post("/admin/stock", { stock })
				alert("Successfully updated stock")
			} catch (error) {
				console.log(error)
				alert("Update failed")
			}
		},
		async cancel(user_id, id) {
			const result = window.confirm(
				`Are you sure you want to cancel order ${id}?`
			)
			if (result) {
				try {
					const response = await this.$axios.delete("/admin/users/payment", {
						data: { user_id, id },
					})
					console.log(response)
					alert("Cancellation Successful")
				} catch ({ message }) {
					console.log(message)
					alert(
						"Failed to cancel membership. Try again or contact admins in discord"
					)
				}
			}
		},
	},
}
</script>

<style>
#footer {
	position: absolute;
	left: 0;
	bottom: 0;
	height: 6rem;
	width: 100%;
}
</style>
